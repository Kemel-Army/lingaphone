import { z } from 'zod'

/* eslint-disable @typescript-eslint/no-explicit-any */

const bodySchema = z.object({
  otherUserId: z.string().uuid()
})

/**
 * POST /api/conversations/find-or-create
 * Direct conversation between the caller and `otherUserId`.
 *
 * Client INSERTs on Conversation/ConversationParticipant are blocked at
 * RLS level after the v2 hardening migration — creation funnels here.
 *
 * Relationship gate: the two users must already be related through one of:
 *  - tutor ↔ assigned student
 *  - parent ↔ ACTIVE-linked child's tutor
 *  - parent ↔ ACTIVE-linked child (rare but allowed for family chat)
 *  - either side is ADMIN (support contact)
 *
 * Without this gate, any logged-in user could spawn DMs with arbitrary
 * UUIDs — a spam/grooming vector.
 */
export default defineEventHandler(async (event) => {
  const userId = await getCurrentInternalUserId(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  if (body.otherUserId === userId) {
    throw createError({ statusCode: 400, message: 'Cannot create conversation with yourself' })
  }

  await assertCanMessage(supabase, userId, body.otherUserId)

  // Look for existing direct conversation between the two users
  const { data: minePartIds } = await supabase
    .from('ConversationParticipant')
    .select('conversationId')
    .eq('userId', userId)

  const myConvIds = (minePartIds ?? []).map((p: any) => p.conversationId as string)
  if (myConvIds.length > 0) {
    const { data: matches } = await supabase
      .from('ConversationParticipant')
      .select('conversationId')
      .eq('userId', body.otherUserId)
      .in('conversationId', myConvIds)

    if (matches && matches.length > 0) {
      return { conversationId: (matches[0] as any).conversationId as string, existed: true }
    }
  }

  // Create conversation
  const { data: conv, error: convErr } = await supabase
    .from('Conversation')
    .insert({ type: 'direct' } as never)
    .select('id')
    .single()
  if (convErr || !conv) {
    throw createError({ statusCode: 500, message: convErr?.message ?? 'Failed to create conversation' })
  }

  const conversationId = (conv as { id: string }).id

  const { error: partErr } = await supabase
    .from('ConversationParticipant')
    .insert([
      { conversationId, userId },
      { conversationId, userId: body.otherUserId }
    ] as never)
  if (partErr) {
    // Roll back orphan conversation
    await supabase.from('Conversation').delete().eq('id', conversationId)
    throw createError({ statusCode: 500, message: partErr.message })
  }

  return { conversationId, existed: false }
})

/**
 * Verify the two users are allowed to message each other. Throws 403 otherwise.
 *
 * Allowed pairings (symmetric):
 *  - student.tutor.userId === peer.userId
 *  - parent ↔ tutor of an ACTIVE-linked child
 *  - parent ↔ ACTIVE-linked child (family chat)
 *  - either side is ADMIN
 */
async function assertCanMessage(supabase: any, callerUserId: string, peerUserId: string): Promise<void> {
  const [{ data: caller }, { data: peer }] = await Promise.all([
    supabase.from('User').select('id, role').eq('id', callerUserId).maybeSingle(),
    supabase.from('User').select('id, role').eq('id', peerUserId).maybeSingle()
  ])

  if (!caller || !peer) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  if (caller.role === 'ADMIN' || peer.role === 'ADMIN') return

  // Resolve each side's Student / Parent / Tutor profile in parallel.
  const [
    { data: callerStudent },
    { data: callerParent },
    { data: callerTutor },
    { data: peerStudent },
    { data: peerParent },
    { data: peerTutor }
  ] = await Promise.all([
    supabase.from('Student').select('id, tutorId').eq('userId', callerUserId).maybeSingle(),
    supabase.from('Parent').select('id').eq('userId', callerUserId).maybeSingle(),
    supabase.from('Tutor').select('id, userId').eq('userId', callerUserId).maybeSingle(),
    supabase.from('Student').select('id, tutorId').eq('userId', peerUserId).maybeSingle(),
    supabase.from('Parent').select('id').eq('userId', peerUserId).maybeSingle(),
    supabase.from('Tutor').select('id, userId').eq('userId', peerUserId).maybeSingle()
  ])

  // Case A: tutor ↔ assigned student
  if (callerTutor && peerStudent && peerStudent.tutorId === callerTutor.id) return
  if (peerTutor && callerStudent && callerStudent.tutorId === peerTutor.id) return

  // Case B: parent ↔ ACTIVE-linked child
  if (callerParent && peerStudent) {
    const { data: link } = await supabase
      .from('ParentToStudent').select('id')
      .eq('parentId', callerParent.id)
      .eq('studentId', peerStudent.id)
      .eq('status', 'ACTIVE')
      .maybeSingle()
    if (link) return
  }
  if (peerParent && callerStudent) {
    const { data: link } = await supabase
      .from('ParentToStudent').select('id')
      .eq('parentId', peerParent.id)
      .eq('studentId', callerStudent.id)
      .eq('status', 'ACTIVE')
      .maybeSingle()
    if (link) return
  }

  // Case C: parent ↔ tutor-of-active-child (parent contacts their child's tutor)
  if (callerParent && peerTutor) {
    const { data: link } = await supabase
      .from('ParentToStudent')
      .select('Student!inner(tutorId)')
      .eq('parentId', callerParent.id)
      .eq('status', 'ACTIVE')
    const tutorIds = ((link as Array<{ Student?: { tutorId: string | null } }>) ?? [])
      .map(r => r.Student?.tutorId).filter(Boolean) as string[]
    if (tutorIds.includes(peerTutor.id)) return
  }
  if (peerParent && callerTutor) {
    const { data: link } = await supabase
      .from('ParentToStudent')
      .select('Student!inner(tutorId)')
      .eq('parentId', peerParent.id)
      .eq('status', 'ACTIVE')
    const tutorIds = ((link as Array<{ Student?: { tutorId: string | null } }>) ?? [])
      .map(r => r.Student?.tutorId).filter(Boolean) as string[]
    if (tutorIds.includes(callerTutor.id)) return
  }

  throw createError({ statusCode: 403, message: 'No messaging relationship with this user' })
}
