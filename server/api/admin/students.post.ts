import { z } from 'zod'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/shared/types/database.types'

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

  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = serverSupabaseServiceRole<Database>(event)

  // 1. Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: {
      name: body.name,
      surname: body.surname
    }
  })

  if (authError || !authData?.user) {
    throw createError({
      statusCode: 400,
      message: authError?.message ?? 'Failed to create auth user'
    })
  }

  const authId = authData.user.id

  // 2. Create User row
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
      role: 'STUDENT'
    } as never)
    .select('id')
    .single()

  if (userError || !userRow) {
    await supabase.auth.admin.deleteUser(authId)
    throw createError({ statusCode: 500, message: userError?.message ?? 'Failed to create user record' })
  }

  // 3. Create Student row
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
    throw createError({ statusCode: 500, message: studentError?.message ?? 'Failed to create student record' })
  }

  return {
    success: true,
    userId: userRow.id,
    studentId: studentRow.id
  }
})
