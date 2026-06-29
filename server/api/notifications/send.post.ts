/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'

const bodySchema = z.object({
  userIds: z.array(z.string().uuid()).optional(),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum(['SYSTEM', 'LESSON_REMINDER', 'HOMEWORK_DUE', 'ACHIEVEMENT', 'PAYMENT', 'EARLY_WARNING', 'MESSAGE']).default('SYSTEM'),
  sendEmail: z.boolean().default(false),
  role: z.enum(['STUDENT', 'PARENT', 'ADMIN', 'ALL']).optional()
})

export default defineEventHandler(async (event) => {
  const _user = await requireRole(event, ['ADMIN'])
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  let targetUserIds: string[] = body.userIds ?? []

  // If role specified and no specific userIds — notify all users of that role
  if (body.role && targetUserIds.length === 0) {
    if (body.role === 'ALL') {
      const { data: users } = await supabase.from('User').select('id')
      targetUserIds = (users ?? []).map((u: any) => u.id)
    } else {
      const { data: users } = await supabase.from('User').select('id').eq('role', body.role)
      targetUserIds = (users ?? []).map((u: any) => u.id)
    }
  }

  if (targetUserIds.length === 0) {
    throw createError({ statusCode: 400, message: 'No target users specified' })
  }

  // Batch insert notifications (max 100 at a time)
  const batchSize = 100
  let totalInserted = 0

  for (let i = 0; i < targetUserIds.length; i += batchSize) {
    const batch = targetUserIds.slice(i, i + batchSize).map(uid => ({
      userId: uid,
      type: body.type,
      title: body.title,
      body: body.message,
      isRead: false
    }))

    const { error } = await supabase.from('Notification').insert(batch as never)
    if (!error) totalInserted += batch.length
  }

  // Send emails if requested (Mailgun integration)
  if (body.sendEmail) {
    const { data: users } = await supabase
      .from('User')
      .select('email')
      .in('id', targetUserIds)

    const emails = (users ?? []).map((u: any) => u.email).filter(Boolean)

    if (emails.length > 0) {
      const result = await sendBulkEmail(emails, body.title, body.message)
      return { sent: totalInserted, total: targetUserIds.length, emailsSent: result.sent, emailsFailed: result.failed }
    }
  }

  return { sent: totalInserted, total: targetUserIds.length }
})
