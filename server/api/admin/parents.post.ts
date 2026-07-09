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
  iin: z.string().max(12).trim().optional(),
  studentIds: z.array(z.string().uuid()).default([])
})

export default defineEventHandler(async (event) => {
  const caller = await serverSupabaseUser(event)
  if (!caller) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const role = (caller as unknown as { user_role?: string }).user_role ?? caller.app_metadata?.role
  if (role !== 'ADMIN') throw createError({ statusCode: 403, message: 'Forbidden' })

  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = serverSupabaseServiceRole<Database>(event)

  // 1. Auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { name: body.name, surname: body.surname }
  })
  if (authError || !authData?.user) {
    throw createError({ statusCode: 400, message: authError?.message ?? 'Failed to create auth user' })
  }
  const authId = authData.user.id

  // 2. User row (role PARENT → flows into JWT via custom claims hook)
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
      role: 'PARENT',
      initialPassword: body.password
    } as never)
    .select('id')
    .single()
  if (userError || !userRow) {
    await supabase.auth.admin.deleteUser(authId)
    throw createError({ statusCode: 500, message: userError?.message ?? 'Failed to create user record' })
  }

  // 3. Parent row
  const { data: parentRow, error: parentError } = await supabase
    .from('Parent')
    .insert({ userId: userRow.id } as never)
    .select('id')
    .single()
  if (parentError || !parentRow) {
    await supabase.auth.admin.deleteUser(authId)
    throw createError({ statusCode: 500, message: parentError?.message ?? 'Failed to create parent record' })
  }

  // 4. Link children
  if (body.studentIds.length) {
    const links = body.studentIds.map(studentId => ({ parentId: parentRow.id, studentId }))
    const { error: linkError } = await supabase.from('ParentToStudent').insert(links as never)
    if (linkError) {
      throw createError({ statusCode: 500, message: linkError.message })
    }
  }

  return { success: true, parentId: parentRow.id, userId: userRow.id }
})
