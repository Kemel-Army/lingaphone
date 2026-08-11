/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Keeps one GROUP `Conversation` per `Group` in sync — participantIds =
 * the group's teacher + every ACTIVE `GroupMember`. Called:
 *  - at group creation (server/api/admin/groups.post.ts)
 *  - whenever membership changes (server/api/admin/groups/[id]/sync-conversation.post.ts)
 *
 * `Conversation.kind`/`groupId`/`participantIds` already existed in the live
 * schema (unused until now) — no migration needed for group chat itself.
 * Runs with the service-role client, bypassing RLS (Conversation has no
 * client-writable INSERT/UPDATE policy by design).
 */
export const syncGroupConversation = async (supabase: any, groupId: string): Promise<{ conversationId: string | null }> => {
  const { data: group } = await supabase.from('Group').select('teacherId').eq('id', groupId).maybeSingle()
  if (!group) return { conversationId: null }

  const { data: teacherRow } = await supabase.from('Teacher').select('userId').eq('id', group.teacherId).maybeSingle()

  const { data: memberRows } = await supabase
    .from('GroupMember')
    .select('Student!studentId ( userId )')
    .eq('groupId', groupId)
    .eq('status', 'ACTIVE')

  const studentUserIds = ((memberRows ?? []) as { Student: { userId: string } | { userId: string }[] | null }[])
    .map(m => (Array.isArray(m.Student) ? m.Student[0]?.userId : m.Student?.userId))
    .filter((id): id is string => !!id)

  const participantIds = [teacherRow?.userId, ...studentUserIds].filter(Boolean) as string[]

  const { data: existing } = await supabase
    .from('Conversation')
    .select('id')
    .eq('groupId', groupId)
    .eq('kind', 'GROUP')
    .maybeSingle()

  // An existing chat is always re-synced, including down to an empty roster.
  // Bailing out early on `!participantIds.length` left the last known members
  // in place after the final student was removed, so they kept read access.
  if (existing) {
    const { error } = await supabase
      .from('Conversation')
      .update({ participantIds, updatedAt: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
    return { conversationId: existing.id }
  }

  // Nothing to create a chat around yet (group has neither teacher nor members).
  if (!participantIds.length) return { conversationId: null }

  const { data: created, error } = await supabase
    .from('Conversation')
    .insert({ kind: 'GROUP', groupId, participantIds })
    .select('id')
    .single()
  if (error) throw error
  return { conversationId: created.id }
}
