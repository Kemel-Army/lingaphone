import { z } from 'zod'
import crypto from 'node:crypto'

const bodySchema = z.object({
  packageId: z.string().uuid(),
  amount: z.number().positive()
})

/**
 * Mock Kaspi payment — instantly completes a payment and activates subscription.
 *
 * Controlled by PAYMENT_MOCK_MODE env var (default: 'true').
 * Set PAYMENT_MOCK_MODE=false before production launch to disable the mock.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (config.paymentMockMode === 'false') {
    throw createError({ statusCode: 403, message: 'Mock payments are disabled' })
  }

  const user = await requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  const userId = user.id

  // ── Idempotency: check for a recent completed payment for this package ──
  const { data: recentPayment } = await supabase
    .from('Payment')
    .select('id, status')
    .eq('userId', userId)
    .eq('packageId', body.packageId)
    .eq('status', 'COMPLETED')
    .order('createdAt', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recentPayment) {
    return { success: true, paymentId: (recentPayment as any).id, alreadyActivated: true }
  }

  // ── Load package details for durationDays ──
  const { data: pkg, error: pkgError } = await supabase
    .from('Package')
    .select('id, name, priceTotal, durationDays')
    .eq('id', body.packageId)
    .eq('isActive', true)
    .single()

  if (pkgError || !pkg) {
    throw createError({ statusCode: 404, message: 'Package not found or inactive' })
  }

  const p = pkg as any
  const durationDays: number = p.durationDays ?? 365

  // ── Create Payment record ──
  const { data: payment, error: paymentError } = await supabase
    .from('Payment')
    .insert({
      userId,
      packageId: body.packageId,
      amount: body.amount,
      currency: 'KZT',
      status: 'COMPLETED',
      method: 'kaspi',
      discount: Math.max(0, (p.priceTotal ?? body.amount) - body.amount),
      idempotencyKey: crypto.randomUUID()
    })
    .select('id')
    .single()

  if (paymentError || !payment) {
    throw createError({ statusCode: 500, message: paymentError?.message ?? 'Payment insert failed' })
  }

  const paymentId = (payment as any).id

  // ── Cancel any existing active subscriptions ──
  await supabase
    .from('Subscription')
    .update({ status: 'CANCELLED', cancelledAt: new Date().toISOString() } as any)
    .eq('userId', userId)
    .eq('status', 'ACTIVE' as any)

  // ── Create new Subscription ──
  const now = new Date()
  const periodEnd = new Date(now.getTime() + durationDays * 86400 * 1000)

  const { error: subError } = await supabase
    .from('Subscription')
    .insert({
      userId,
      planName: p.name ?? 'FEMO Годовая подписка',
      pricePerMonth: Math.round(body.amount / Math.max(1, Math.round(durationDays / 30))),
      lessonsPerMonth: 0,
      features: {},
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      status: 'ACTIVE' as any
    })

  if (subError) {
    throw createError({ statusCode: 500, message: subError.message })
  }

  // ── Create in-app notification ──
  await supabase.from('Notification').insert({
    userId,
    type: 'PAYMENT',
    title: '🎉 Оплата прошла успешно!',
    body: `Доступ к FEMO активирован на ${durationDays} дней. Добро пожаловать!`
  })

  return { success: true, paymentId }
})
