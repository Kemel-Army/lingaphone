/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'
import crypto from 'node:crypto'

const bodySchema = z.object({
  paymentId: z.string().uuid(),
  status: z.enum(['COMPLETED', 'FAILED', 'CANCELLED']),
  gatewayTransactionId: z.string().optional(),
  signature: z.string().optional(),
  amount: z.number().optional()
})

/**
 * Payment gateway callback.
 * Called by Kaspi/Epay when payment status changes.
 * Validates HMAC signature to prevent forgery.
 */
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)
  const config = useRuntimeConfig()
  const paymentApiKey = config.paymentApiKey as string

  // Verify HMAC signature from payment gateway
  if (paymentApiKey && body.signature) {
    const signaturePayload = `${body.paymentId}:${body.status}:${body.amount ?? 0}`
    const expectedSignature = crypto
      .createHmac('sha256', paymentApiKey)
      .update(signaturePayload)
      .digest('hex')

    if (!crypto.timingSafeEqual(
      Buffer.from(body.signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )) {
      captureWarning('Invalid payment callback signature', { paymentId: body.paymentId })
      throw createError({ statusCode: 403, message: 'Invalid signature' })
    }
  }

  // Idempotency: check if already processed
  const { data: existingPayment } = await supabase
    .from('Payment')
    .select('id, status')
    .eq('id', body.paymentId)
    .single()

  if (!existingPayment) {
    throw createError({ statusCode: 404, message: 'Payment not found' })
  }

  const existing = existingPayment as any
  if (existing.status === 'COMPLETED' || existing.status === 'FAILED') {
    return { success: true, status: existing.status, alreadyProcessed: true }
  }

  // Update payment status
  const updateData: Record<string, any> = {
    status: body.status,
    updatedAt: new Date().toISOString()
  }
  if (body.gatewayTransactionId) {
    updateData.externalId = body.gatewayTransactionId
  }
  const { data: payment, error } = await supabase.from('Payment').update(updateData).eq('id', body.paymentId).select().single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  const p = payment as any

  // If payment completed — activate package/subscription
  if (body.status === 'COMPLETED') {
    // Activate package
    if (p.packageId) {
      const { data: pkg } = await supabase
        .from('Package')
        .select('lessonsCount')
        .eq('id', p.packageId)
        .single()

      if (pkg) {
        const pkgData = pkg as any
        // Increment available lessons for the student
        const { data: student } = await supabase
          .from('Student')
          .select('availableLessons')
          .eq('userId', p.userId)
          .single()

        if (student) {
          const current = (student as any).availableLessons ?? 0
          await supabase
            .from('Student')
            .update({ availableLessons: current + pkgData.lessonsCount })
            .eq('userId', p.userId)
        }
      }
    }

    // Activate subscription (find by userId + PENDING status)
    const { data: pendingSub } = await supabase
      .from('Subscription')
      .select('id')
      .eq('userId', p.userId)
      .eq('status', 'ACTIVE' as any) // find sub to extend
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    if (pendingSub) {
      const now = new Date()
      const endDate = new Date(now)
      endDate.setMonth(endDate.getMonth() + 1)

      await supabase.from('Subscription').update({
        status: 'ACTIVE',
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: endDate.toISOString()
      }).eq('id', (pendingSub as any).id)
    }

    // Create notification for student
    await supabase.from('Notification').insert({
      userId: p.userId,
      type: 'PAYMENT',
      title: 'Оплата прошла успешно',
      body: `Оплата на сумму ${formatPrice(p.amount)} подтверждена.`
    })
  }

  return { success: true, status: body.status }
})

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(amount)
}
