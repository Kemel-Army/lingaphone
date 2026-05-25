import { z } from 'zod'
import { sendTemplatedEmail } from '../../utils/mailgun'

const bodySchema = z.object({
  studentId: z.string().uuid(),
  days: z.number().int().min(1).max(60).default(7),
  language: z.enum(['ru', 'kz']).default('ru')
})

/**
 * Generate AI weekly summary for a child and email it to the linked parent.
 * Auth: parent of this student, or admin.
 */
export default defineEventHandler(async (event) => {
  const authUser = await requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  const { data: caller, error: callerErr } = await supabase
    .from('User').select('id, email, role, name').eq('authId', authUser.id).single()
  if (callerErr || !caller) throw createError({ statusCode: 401, message: 'User profile not found' })
  if (caller.role !== 'PARENT' && caller.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  // Verify parent → student link
  if (caller.role === 'PARENT') {
    const { data: parentRow } = await supabase
      .from('Parent').select('id').eq('userId', caller.id).single()
    if (!parentRow) throw createError({ statusCode: 403, message: 'Parent profile not found' })
    const { data: link } = await supabase
      .from('ParentToStudent').select('id')
      .eq('parentId', parentRow.id)
      .eq('studentId', body.studentId)
      .eq('status', 'ACTIVE')
      .maybeSingle()
    if (!link) throw createError({ statusCode: 403, message: 'No access to this student' })
  }

  // Resolve child name
  const { data: studentRow } = await supabase
    .from('Student').select('User(name)').eq('id', body.studentId).single()
  const childName = ((studentRow as Record<string, unknown> | null)?.User as { name?: string } | null)?.name ?? 'ребёнок'

  // Reuse the parent-summary endpoint to get the text
  const summary = await $fetch<{ text: string }>('/api/ai/parent-summary', {
    method: 'POST',
    body: { studentId: body.studentId, days: body.days, language: body.language },
    headers: getRequestHeader(event, 'authorization')
      ? { Authorization: getRequestHeader(event, 'authorization')! }
      : undefined
  })

  if (!caller.email) {
    throw createError({ statusCode: 400, message: 'Parent has no email on file' })
  }

  const sent = await sendTemplatedEmail(caller.email, 'parent-weekly-summary', {
    userName: childName,
    warningMessage: summary.text
  })

  return {
    sent,
    recipient: caller.email,
    childName,
    preview: summary.text.slice(0, 120) + (summary.text.length > 120 ? '…' : '')
  }
})
