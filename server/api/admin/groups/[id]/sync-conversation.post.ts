import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { syncGroupConversation } from '../../../../utils/groupConversation'

/**
 * Re-syncs a group's GROUP Conversation.participantIds to its current
 * teacher + ACTIVE GroupMember roster. Call after adding/removing students
 * (or reassigning the teacher) so the group chat stays in sync — Conversation
 * has no client-writable RLS policy, so this can't be done from the client.
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

  const { conversationId } = await syncGroupConversation(supabase, groupId)
  return { ok: true, conversationId }
})
