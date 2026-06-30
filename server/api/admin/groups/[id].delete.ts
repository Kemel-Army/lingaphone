import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

/**
 * DELETE /api/admin/groups/[id]  — permanently delete a group.
 *
 * Students are NEVER deleted. DB cascades remove only the group's own data:
 * GroupMember links (so students are freed and can join another group),
 * Lessons and their Attendance/Grade/Homework, and group Conversations.
 * Student rows stay intact. Use archiving instead if students should still
 * see the group as "закрылась".
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const role = (user as unknown as { user_role?: string }).user_role
    ?? user.user_metadata?.role
  if (role !== 'ADMIN') throw createError({ statusCode: 403, message: 'Forbidden' })

  const supabase = serverSupabaseServiceRole(event)
  const groupId = getRouterParam(event, 'id')
  if (!groupId) throw createError({ statusCode: 400, message: 'id обязателен' })

  // Single delete — every dependent FK is ON DELETE CASCADE (verified against
  // the live schema), so this clears lessons/grades/attendance/homework/
  // conversations and frees members. Student rows are not touched.
  const { error } = await supabase.from('Group').delete().eq('id', groupId)
  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true }
})
