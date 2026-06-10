/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'
import crypto from 'node:crypto'

// The client only signals *what* package the user wants to buy and which
// payment method. Price and the buyer's identity are resolved server-side
// from the authenticated session and the Package table — never from the body.
const bodySchema = z.object({
  packageId: z.string().uuid(),
  currency: z.string().default('KZT'),
  paymentMethod: z.enum(['card', 'kaspi']).default('card'),
  promoCode: z.string().optional(),
  idempotencyKey: z.string().uuid()
})

export default defineEventHandler(async (event) => {
  const buyerUserId = await getCurrentInternalUserId(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)
  const config = useRuntimeConfig()

  // Idempotency check — prevent double payments
  const { data: existingPayment } = await supabase
    .from('Payment')
    .select('id, status')
    .eq('idempotencyKey', body.idempotencyKey)
    .maybeSingle()

  if (existingPayment) {
    const ep = existingPayment as any
    return { paymentId: ep.id, status: ep.status, duplicate: true }
  }

  // Resolve canonical price from the Package table — never trust the body.
  const { data: pkg, error: pkgErr } = await supabase
    .from('Package')
    .select('id, priceTotal, salePrice, isActive')
    .eq('id', body.packageId)
    .maybeSingle()

  if (pkgErr || !pkg) {
    throw createError({ statusCode: 404, message: 'Package not found' })
  }
  const pkgRow = pkg as { id: string, priceTotal: number, salePrice: number | null, isActive: boolean | null }
  if (pkgRow.isActive === false) {
    throw createError({ statusCode: 400, message: 'Package not available' })
  }
  const basePrice = pkgRow.salePrice != null && pkgRow.salePrice > 0
    ? pkgRow.salePrice
    : pkgRow.priceTotal
  if (typeof basePrice !== 'number' || basePrice <= 0) {
    throw createError({ statusCode: 500, message: 'Invalid package price' })
  }

  let finalAmount = basePrice
  let promoCodeId: string | null = null

  // Validate promo code
  if (body.promoCode) {
    const { data: promo } = await supabase
      .from('PromoCode')
      .select('*')
      .eq('code', body.promoCode.toUpperCase())
      .eq('isActive', true)
      .single()

    if (promo) {
      const p = promo as any
      const now = new Date()
      const isValid = (!p.validFrom || new Date(p.validFrom) <= now)
        && (!p.validUntil || new Date(p.validUntil) >= now)
        && (!p.maxUses || p.currentUses < p.maxUses)

      if (isValid) {
        promoCodeId = p.id
        if (p.discountPercent) {
          finalAmount = Math.round(finalAmount * (1 - p.discountPercent / 100))
        } else if (p.discountAmount) {
          finalAmount = Math.max(0, finalAmount - p.discountAmount)
        }

        await supabase.from('PromoCode').update({
          currentUses: (p.currentUses ?? 0) + 1
        }).eq('id', p.id)
      }
    }
  }

  // Auto-detect FamilyPlan discount for parent
  const { data: familyPlan } = await supabase
    .from('FamilyPlan')
    .select('discountPercent')
    .eq('parentId', buyerUserId)
    .eq('isActive', true)
    .maybeSingle()

  if (familyPlan) {
    const fp = familyPlan as any
    if (fp.discountPercent > 0) {
      finalAmount = Math.round(finalAmount * (1 - fp.discountPercent / 100))
    }
  }

  // Enforce max 45% combined discount cap against the canonical base price.
  const MAX_DISCOUNT_PERCENT = 45
  const minAllowed = Math.round(basePrice * (1 - MAX_DISCOUNT_PERCENT / 100))
  finalAmount = Math.max(finalAmount, minAllowed)

  // Create payment record — userId is always the authenticated buyer.
  const { data: payment, error } = await supabase.from('Payment').insert({
    userId: buyerUserId,
    packageId: body.packageId,
    amount: finalAmount,
    currency: body.currency,
    status: 'PENDING',
    method: body.paymentMethod,
    promoCodeId,
    discount: basePrice - finalAmount,
    idempotencyKey: body.idempotencyKey
  }).select().single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  const paymentId = (payment as any).id
  const paymentApiKey = config.paymentApiKey as string
  const appUrl = process.env.APP_URL ?? 'https://femo.kz'
  const callbackUrl = `${appUrl}/api/payments/callback`

  // Build gateway URL with signature
  let gatewayUrl: string

  if (body.paymentMethod === 'kaspi') {
    // Kaspi QR / Kaspi Pay integration
    const params = new URLSearchParams({
      merchantId: process.env.KASPI_MERCHANT_ID ?? '',
      orderId: paymentId,
      amount: String(finalAmount),
      currency: body.currency,
      returnUrl: `${appUrl}/student/payments?paymentId=${paymentId}`,
      callbackUrl
    })
    const signaturePayload = `${paymentId}:${finalAmount}:${body.currency}`
    const signature = crypto
      .createHmac('sha256', paymentApiKey)
      .update(signaturePayload)
      .digest('hex')
    params.set('signature', signature)

    gatewayUrl = `https://pay.kaspi.kz/pay?${params.toString()}`
  } else {
    // Epay (Halyk Bank) card payment
    const params = new URLSearchParams({
      merchantId: process.env.EPAY_MERCHANT_ID ?? '',
      orderId: paymentId,
      amount: String(finalAmount),
      currency: body.currency,
      language: 'rus',
      postLink: callbackUrl,
      backLink: `${appUrl}/student/payments?paymentId=${paymentId}`,
      failureBackLink: `${appUrl}/student/payments?paymentId=${paymentId}&status=failed`
    })
    const signaturePayload = `${paymentId};${finalAmount};${body.currency}`
    const signature = crypto
      .createHmac('sha256', paymentApiKey)
      .update(signaturePayload)
      .digest('hex')
    params.set('sign', signature)

    gatewayUrl = `https://epay.kkb.kz/pay?${params.toString()}`
  }

  return {
    paymentId,
    amount: finalAmount,
    currency: body.currency,
    gatewayUrl,
    status: 'PENDING'
  }
})
