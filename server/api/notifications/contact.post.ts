/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  message: z.string().min(1).max(5000)
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const config = useRuntimeConfig()

  const supportEmail = (config.public?.supportEmail as string | undefined) ?? 'info@femo.kz'

  // Send email to support via Mailgun
  try {
    await sendTemplatedEmail(
      supportEmail,
      'generic',
      {
        userName: body.name,
        warningMessage: `<p><strong>Имя:</strong> ${body.name}</p>
        <p><strong>Email:</strong> ${body.email}</p>
        <p><strong>Сообщение:</strong></p>
        <p>${body.message}</p>`
      }
    )
  } catch {
    // Log but don't fail — save to DB as fallback
    console.warn('[contact] Email send failed, saving to DB only')
  }

  // Also save to Notification table for admin visibility
  const supabase = useServerSupabase(event)
  const { data: admins } = await supabase
    .from('User')
    .select('id')
    .eq('role', 'ADMIN')
    .limit(10)

  const adminIds = (admins ?? []).map((a: any) => a.id)
  if (adminIds.length > 0) {
    const notifications = adminIds.map(uid => ({
      userId: uid,
      type: 'SYSTEM' as const,
      title: `Обратная связь от ${body.name}`,
      body: `Email: ${body.email}\n\n${body.message}`,
      isRead: false
    }))
    await supabase.from('Notification').insert(notifications)
  }

  return { success: true }
})
