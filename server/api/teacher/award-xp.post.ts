import { randomUUID } from 'node:crypto'
import { serverSupabaseServiceRole, serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'

const schema = z.object({
  studentId: z.string().uuid(),
  amount: z.number().int().positive().max(100),
  reason: z.string().max(200).optional()
})

/**
 * POST /api/teacher/award-xp
 *
 * A teacher awards bonus XP to a student in one of their own groups. Runs the
 * canonical award_xp_atomic RPC (updates StudentGameProfile.xp + XpLog) under
 * the service role, after verifying ownership server-side. Replaces the old
 * client-side write which RLS blocked (no teacher INSERT on XpLog / UPDATE on
 * Student).
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })
  const role = (user as unknown as { user_role?: string }).user_role
  if (role !== 'TEACHER') throw createError({ statusCode: 403, message: 'Forbidden' })

  const { studentId, amount, reason } = schema.parse(await readBody(event))
  const supabase = serverSupabaseServiceRole(event)

  // Resolve the caller's Teacher id in their own auth context (reuses the
  // proven RLS helper instead of guessing JWT claim shapes).
  const userClient = await serverSupabaseClient(event)
  const { data: teacherId } = await userClient.rpc('get_current_teacher_id' as never)
  if (!teacherId) throw createError({ statusCode: 403, message: 'Not a teacher' })

  // Ownership: the student must be an ACTIVE member of one of this teacher's groups.
  const { data: owns } = await supabase
    .from('GroupMember')
    .select('groupId, Group!inner(teacherId)')
    .eq('studentId', studentId)
    .eq('status', 'ACTIVE')
    .eq('Group.teacherId', teacherId as unknown as string)
    .maybeSingle()
  if (!owns) throw createError({ statusCode: 403, message: 'Student is not in your group' })

  const { data, error } = await supabase.rpc('award_xp_atomic', {
    p_student_id: studentId,
    p_action: 'MANUAL_AWARD',
    p_amount: amount,
    p_source_id: randomUUID(),
    p_description: reason ?? 'Бонус от учителя'
  } as never)
  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
