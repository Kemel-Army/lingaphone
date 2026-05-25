import { z } from 'zod'
import { sendTemplatedEmail } from '../../utils/mailgun'

const bodySchema = z.object({
  email: z.string().email().toLowerCase()
})

/**
 * Parent invites a child by email.
 *
 * Flow (after Parent v3 hardening):
 *  1. If the email matches a STUDENT user — create a PENDING ParentToStudent
 *     link and notify the student. The student must accept the request before
 *     any of the `parent_select_child_*` policies grant visibility.
 *  2. Otherwise — send an invitation email (link with the parent's id) so the
 *     student creates their account and the link is established at signup.
 *
 * Critical: no data visibility is granted until the student accepts.
 */
export default defineEventHandler(async (event) => {
  const authUser = await requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  const { data: caller, error: callerErr } = await supabase
    .from('User').select('id, name, email, role').eq('authId', authUser.id).single()
  if (callerErr || !caller) throw createError({ statusCode: 401, message: 'User profile not found' })
  if (caller.role !== 'PARENT') throw createError({ statusCode: 403, message: 'Forbidden' })

  const { data: parentRow } = await supabase
    .from('Parent').select('id').eq('userId', caller.id).single()
  if (!parentRow) throw createError({ statusCode: 403, message: 'Parent profile not found' })

  const { data: studentUser } = await supabase
    .from('User').select('id, name, role').eq('email', body.email).maybeSingle()

  if (studentUser && studentUser.role === 'STUDENT') {
    const { data: studentRow } = await supabase
      .from('Student').select('id').eq('userId', studentUser.id).single()
    if (!studentRow) throw createError({ statusCode: 404, message: 'Student profile not found' })

    const { data: existingLink } = await supabase
      .from('ParentToStudent')
      .select('id, status')
      .eq('parentId', parentRow.id)
      .eq('studentId', studentRow.id)
      .maybeSingle()

    if (existingLink) {
      const link = existingLink as { id: string, status: string }
      if (link.status === 'ACTIVE') {
        return { result: 'already-linked' as const, studentId: studentRow.id }
      }
      // PENDING — re-notify but keep the existing row
      await supabase.from('Notification').insert({
        userId: studentUser.id,
        type: 'PARENT_LINK_REQUEST',
        title: 'Запрос на привязку',
        body: `${caller.name ?? 'Родитель'} просит подтвердить доступ к вашему профилю`,
        data: { link: '/student/parent-requests' }
      } as never)
      return { result: 'pending' as const, studentId: studentRow.id }
    }

    const { error: insertErr } = await supabase
      .from('ParentToStudent')
      .insert({
        parentId: parentRow.id,
        studentId: studentRow.id,
        status: 'PENDING'
      } as never)
    if (insertErr) throw createError({ statusCode: 500, message: insertErr.message })

    await supabase.from('Notification').insert({
      userId: studentUser.id,
      type: 'PARENT_LINK_REQUEST',
      title: 'Запрос на привязку',
      message: `${caller.name ?? 'Родитель'} просит подтвердить доступ к вашему профилю`,
      link: '/student/parent-requests'
    } as never)

    return { result: 'pending' as const, studentId: studentRow.id }
  }

  if (studentUser && studentUser.role !== 'STUDENT') {
    throw createError({ statusCode: 400, message: 'Этот email уже зарегистрирован с другой ролью' })
  }

  // No user found — send an invitation email; link will be created at signup.
  const appUrl = process.env.APP_URL ?? 'https://femo.kz'
  const inviteUrl = `${appUrl}/register?invite=${encodeURIComponent(body.email)}&parent=${encodeURIComponent(caller.id)}`

  const sent = await sendTemplatedEmail(body.email, 'parent-child-invite', {
    userName: `${caller.name ?? ''}`.trim(),
    inviteUrl
  })

  return { result: 'invited' as const, email: body.email, emailSent: sent }
})
