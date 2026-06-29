import { z } from 'zod'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/shared/types/database.types'

const bodySchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  surname: z.string().min(1).max(100).trim().optional(),
  patronymic: z.string().max(100).trim().nullable().optional(),
  phone: z.string().max(20).trim().nullable().optional(),
  iin: z.string().max(12).trim().nullable().optional(),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  schoolGrade: z.number().int().min(1).max(12).nullable().optional(),
  level: z.enum(['A1', 'A2', 'S1', 'S2', 'B2', 'F1', 'F2', 'F3', 'F4']).optional()
})

export default defineEventHandler(async (event) => {
  const caller = await serverSupabaseUser(event)
  if (!caller) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const role = (caller as unknown as { user_role?: string }).user_role ?? caller.app_metadata?.role
  if (role !== 'ADMIN') throw createError({ statusCode: 403, message: 'Forbidden' })

  const studentId = getRouterParam(event, 'id')
  if (!studentId) throw createError({ statusCode: 400, message: 'Missing student id' })

  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = serverSupabaseServiceRole<Database>(event)

  // Fetch student to get userId
  const { data: student, error: fetchError } = await supabase
    .from('Student')
    .select('id, userId')
    .eq('id', studentId)
    .single()

  if (fetchError || !student) {
    throw createError({ statusCode: 404, message: 'Student not found' })
  }

  // Update User fields if any
  const userUpdates: Record<string, unknown> = {}
  if (body.name !== undefined) userUpdates.name = body.name
  if (body.surname !== undefined) userUpdates.surname = body.surname
  if (body.patronymic !== undefined) userUpdates.patronymic = body.patronymic
  if (body.phone !== undefined) userUpdates.phone = body.phone
  if (body.iin !== undefined) userUpdates.iin = body.iin

  if (Object.keys(userUpdates).length > 0) {
    const { error: userError } = await supabase
      .from('User')
      .update(userUpdates as never)
      .eq('id', student.userId)

    if (userError) throw createError({ statusCode: 500, message: userError.message })
  }

  // Update Student fields if any
  const studentUpdates: Record<string, unknown> = {}
  if (body.birthdate !== undefined) studentUpdates.birthdate = body.birthdate
  if (body.schoolGrade !== undefined) studentUpdates.schoolGrade = body.schoolGrade
  if (body.level !== undefined) studentUpdates.level = body.level

  if (Object.keys(studentUpdates).length > 0) {
    const { error: studentError } = await supabase
      .from('Student')
      .update(studentUpdates as never)
      .eq('id', studentId)

    if (studentError) throw createError({ statusCode: 500, message: studentError.message })
  }

  return { success: true }
})
