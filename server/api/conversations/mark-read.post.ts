import { z } from 'zod'

const bodySchema = z.object({
  conversationId: z.string().uuid()
})

/**
 * POST /api/conversations/mark-read
 * Marks all unread messages in a conversation (sent by OTHERS) as read.
 * Verifies the caller is a participant before mutating.
 */
export default defineEventHandler(async (event) => {
  const userId = await getCurrentInternalUserId(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  // Verify membership
  const { data: membership } = await supabase
    .from('ConversationParticipant')
    .select('conversationId')
    .eq('conversationId', body.conversationId)
    .eq('userId', userId)
    .maybeSingle()

  if (!membership) {
    throw createError({ statusCode: 403, message: 'Not a participant' })
  }

  const { error } = await supabase
    .from('Message')
    .update({ isRead: true } as never)
    .eq('conversationId', body.conversationId)
    .neq('senderId', userId)
    .eq('isRead', false)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { ok: true }
})
