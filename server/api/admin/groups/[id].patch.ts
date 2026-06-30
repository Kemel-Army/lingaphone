import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

/**
 * Archive / unarchive a group (soft close).
 *
 * Archiving sets Group.archivedAt — the group disappears from active admin
 * lists, but no students are deleted. Their GroupMember rows stay intact, so
 * the student UI can show the group as "закрылась". Archiving also frees the
 * student to join a new group (an archived group no longer counts toward the
 * "one active group per student" rule).
 *
 * Body: { archived: boolean }
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

  const body = await readBody(event)
  const archived = Boolean(body?.archived)

  const { error } = await supabase
    .from('Group')
    .update({ archivedAt: archived ? new Date().toISOString() : null })
    .eq('id', groupId)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true, archived }
})
