import { z } from 'zod'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/shared/types/database.types'

/**
 * Convert a Lead into a real Student account in one shot.
 *
 * Replaces the previous two-call client flow (POST /api/admin/students, then
 * PATCH Lead via useLeads.moveStage). That flow was not atomic: when the
 * second call failed the student account already existed but the lead stayed
 * unconverted, so the next attempt created a *duplicate* account — and the
 * duplicate email then made every retry fail.
 *
 * Here every step is undone on failure, so a failed convert leaves no trace
 * and the operation is safe to retry.
 */

const bodySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  surname: z.string().min(1).max(100).trim(),
  patronymic: z.string().max(100).trim().optional(),
  email: z.string().email().max(254).trim(),
  password: z.string().min(6).max(72),
  phone: z.string().max(20).trim().optional(),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  schoolGrade: z.number().int().min(1).max(12).optional(),
  iin: z.string().max(12).trim().optional(),
  level: z.enum(['A1', 'A2', 'S1', 'S2', 'B2', 'F1', 'F2', 'F3', 'F4']).optional()
})

export default defineEventHandler(async (event) => {
  const caller = await serverSupabaseUser(event)
  if (!caller) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const role = (caller as unknown as { user_role?: string }).user_role ?? caller.app_metadata?.role
  if (role !== 'ADMIN') throw createError({ statusCode: 403, message: 'Forbidden' })

  const leadId = getRouterParam(event, 'id')
  if (!leadId) throw createError({ statusCode: 400, message: 'id обязателен' })

  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = serverSupabaseServiceRole<Database>(event)

  // Guard: never convert the same lead twice.
  const { data: lead, error: leadReadErr } = await supabase
    .from('Lead')
    .select('id, stage, paidAt, convertedAt, convertedStudentId')
    .eq('id', leadId)
    .maybeSingle() as unknown as {
    data: { id: string, stage: string, paidAt: string | null, convertedAt: string | null, convertedStudentId: string | null } | null
    error: unknown
  }

  if (leadReadErr) throw createError({ statusCode: 500, message: 'Не удалось прочитать лид' })
  if (!lead) throw createError({ statusCode: 404, message: 'Лид не найден' })
  if (lead.convertedStudentId) {
    throw createError({ statusCode: 409, message: 'Лид уже сконвертирован в ученика' })
  }

  // ── 1. auth user ──────────────────────────────────────────────────────────
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { name: body.name, surname: body.surname }
  })
  if (authError || !authData?.user) {
    throw createError({ statusCode: 400, message: authError?.message ?? 'Не удалось создать аккаунт' })
  }
  const authId = authData.user.id

  const rollbackAuth = async () => {
    await supabase.auth.admin.deleteUser(authId).catch(() => {})
  }

  // ── 2. User row ───────────────────────────────────────────────────────────
  const { data: userRow, error: userError } = await supabase
    .from('User')
    .insert({
      authId,
      email: body.email,
      name: body.name,
      surname: body.surname,
      patronymic: body.patronymic || null,
      phone: body.phone || null,
      iin: body.iin || null,
      role: 'STUDENT',
      initialPassword: body.password
    } as never)
    .select('id')
    .single()

  if (userError || !userRow) {
    await rollbackAuth()
    throw createError({ statusCode: 500, message: userError?.message ?? 'Не удалось создать пользователя' })
  }

  const rollbackUser = async () => {
    await supabase.from('User').delete().eq('id', userRow.id)
    await rollbackAuth()
  }

  // ── 3. Student row ────────────────────────────────────────────────────────
  const { data: studentRow, error: studentError } = await supabase
    .from('Student')
    .insert({
      userId: userRow.id,
      schoolGrade: body.schoolGrade ?? null,
      birthdate: body.birthdate ?? null,
      level: body.level ?? 'A1'
    } as never)
    .select('id')
    .single()

  if (studentError || !studentRow) {
    await rollbackUser()
    throw createError({ statusCode: 500, message: studentError?.message ?? 'Не удалось создать ученика' })
  }

  // ── 4. Move the lead to ACTIVE and link it to the new student ─────────────
  const nowIso = new Date().toISOString()
  const { error: leadError } = await supabase
    .from('Lead')
    .update({
      stage: 'ACTIVE',
      convertedStudentId: studentRow.id,
      convertedAt: lead.convertedAt ?? nowIso,
      paidAt: lead.paidAt ?? nowIso
    } as never)
    .eq('id', leadId)

  if (leadError) {
    // Undo the whole account so a retry starts clean instead of colliding
    // on the now-taken email.
    await supabase.from('Student').delete().eq('id', studentRow.id)
    await rollbackUser()
    throw createError({ statusCode: 500, message: leadError.message ?? 'Не удалось обновить лид' })
  }

  return { success: true, userId: userRow.id, studentId: studentRow.id }
})
