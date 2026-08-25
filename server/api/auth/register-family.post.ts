import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/shared/types/database.types'
import { generateTempPassword, studentLoginEmail } from '~/shared/lib/credentials'

const parentSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  surname: z.string().min(1).max(100).trim(),
  patronymic: z.string().max(100).trim().nullish(),
  phone: z.string().min(5).max(20).trim(),
  email: z.string().email().max(254).trim()
})

const childSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  surname: z.string().min(1).max(100).trim(),
  patronymic: z.string().max(100).trim().nullish(),
  age: z.number().int().min(3).max(18).nullish(),
  schoolGrade: z.number().int().min(1).max(11).nullish(),
  schoolName: z.string().max(200).trim().nullish()
})

const bodySchema = z.object({
  parent1: parentSchema,
  parent2: parentSchema.nullish(),
  children: z.array(childSchema).min(1).max(6)
})

type Account = { role: 'PARENT' | 'STUDENT', label: string, email: string, password: string }

/**
 * Server route: POST /api/auth/register-family
 *
 * Self-serve registration for a whole family in one submission — one or two
 * parent accounts + N child accounts, all created together and left in
 * `status: PENDING` until an admin approves the batch (see
 * /api/admin/registrations/*). Every account created here shares one
 * `registrationBatchId` so the admin UI can group and approve/reject them
 * as a single unit.
 *
 * Passwords are generated server-side (never typed by the parent) so the
 * client can show a one-time "save these credentials" screen.
 */
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = serverSupabaseServiceRole<Database>(event)
  const batchId = crypto.randomUUID()

  const createdAuthIds: string[] = []
  const createdUserIds: string[] = []

  const rollback = async () => {
    for (const userId of createdUserIds) {
      await supabase.from('User').delete().eq('id', userId)
    }
    for (const authId of createdAuthIds) {
      await supabase.auth.admin.deleteUser(authId)
    }
  }

  const emailTaken = async (email: string) => {
    const { data: dbUser } = await supabase.from('User').select('id').eq('email', email).maybeSingle()
    return Boolean(dbUser)
  }

  const createPersonAccount = async (
    role: 'PARENT' | 'STUDENT',
    email: string,
    name: string,
    surname: string,
    patronymic: string | null | undefined,
    phone: string | null
  ) => {
    const password = generateTempPassword()

    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {}
    })
    if (authErr || !authData.user) {
      const isDuplicate = authErr?.message?.toLowerCase().includes('already registered')
        || authErr?.message?.toLowerCase().includes('already been registered')
      throw createError({
        statusCode: isDuplicate ? 409 : 500,
        message: isDuplicate ? `Email уже используется: ${email}` : (authErr?.message ?? 'Ошибка создания аккаунта')
      })
    }
    createdAuthIds.push(authData.user.id)

    const { data: userRow, error: userErr } = await supabase
      .from('User')
      .insert({
        authId: authData.user.id,
        email,
        name,
        surname,
        patronymic: patronymic || null,
        phone,
        role,
        status: 'PENDING',
        initialPassword: password,
        registrationBatchId: batchId
      })
      .select('id')
      .single()

    if (userErr || !userRow) {
      throw createError({ statusCode: 500, message: userErr?.message ?? 'Ошибка создания пользователя' })
    }
    createdUserIds.push(userRow.id)

    return { userId: userRow.id, password }
  }

  // ---- validate emails up front (parent emails only — child emails are auto-generated) ----
  const parentEmails = [body.parent1.email, body.parent2?.email].filter(Boolean) as string[]
  if (new Set(parentEmails.map(e => e.toLowerCase())).size !== parentEmails.length) {
    throw createError({ statusCode: 400, message: 'Email родителей должны отличаться' })
  }
  for (const email of parentEmails) {
    if (await emailTaken(email)) {
      throw createError({ statusCode: 409, message: `Email уже используется: ${email}` })
    }
  }

  const accounts: Account[] = []
  const parentIds: string[] = []

  try {
    // ---- parents ----
    for (const p of [body.parent1, body.parent2].filter(Boolean) as z.infer<typeof parentSchema>[]) {
      const { userId, password } = await createPersonAccount('PARENT', p.email, p.name, p.surname, p.patronymic, p.phone)

      const { data: parentRow, error: parentErr } = await supabase
        .from('Parent')
        .insert({ userId })
        .select('id')
        .single()
      if (parentErr || !parentRow) throw createError({ statusCode: 500, message: parentErr?.message ?? 'Ошибка создания родителя' })

      parentIds.push(parentRow.id)
      accounts.push({ role: 'PARENT', label: `${p.surname} ${p.name}`.trim(), email: p.email, password })
    }

    // ---- children ----
    for (const c of body.children) {
      let childEmail = studentLoginEmail(c.name, c.surname)
      for (let attempt = 0; attempt < 5 && await emailTaken(childEmail); attempt++) {
        childEmail = studentLoginEmail(c.name, c.surname)
      }

      const { userId, password } = await createPersonAccount('STUDENT', childEmail, c.name, c.surname, c.patronymic, null)

      const { data: studentRow, error: studentErr } = await supabase
        .from('Student')
        .insert({
          userId,
          schoolGrade: c.schoolGrade ?? null,
          schoolName: c.schoolName || null,
          age: c.age ?? null
        })
        .select('id')
        .single()
      if (studentErr || !studentRow) throw createError({ statusCode: 500, message: studentErr?.message ?? 'Ошибка создания ученика' })

      const { error: gameProfileErr } = await supabase.from('StudentGameProfile').insert({ studentId: studentRow.id })
      if (gameProfileErr) throw createError({ statusCode: 500, message: gameProfileErr.message })

      for (const parentId of parentIds) {
        const { error: linkErr } = await supabase.from('ParentToStudent').insert({
          parentId,
          studentId: studentRow.id,
          status: 'ACTIVE',
          respondedAt: new Date().toISOString()
        })
        if (linkErr) throw createError({ statusCode: 500, message: linkErr.message })
      }

      accounts.push({ role: 'STUDENT', label: `${c.surname} ${c.name}`.trim(), email: childEmail, password })
    }
  } catch (e) {
    await rollback()
    if (e && typeof e === 'object' && 'statusCode' in e) throw e
    throw createError({ statusCode: 500, message: e instanceof Error ? e.message : 'Ошибка регистрации семьи' })
  }

  return { batchId, accounts }
})
