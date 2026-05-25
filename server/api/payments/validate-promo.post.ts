import { z } from 'zod'

const bodySchema = z.object({
  code: z.string().min(1).max(64)
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  const { data, error } = await supabase
    .from('PromoCode')
    .select('code, discountPercent, discountAmount, validUntil, maxUses, currentUses, isActive')
    .eq('code', body.code.toUpperCase())
    .eq('isActive', true)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }
  if (!data) {
    return { valid: false, reason: 'not_found' }
  }

  if (data.validUntil && new Date(data.validUntil as unknown as string) < new Date()) {
    return { valid: false, reason: 'expired' }
  }
  if (data.maxUses != null && (data.currentUses as number) >= (data.maxUses as number)) {
    return { valid: false, reason: 'exhausted' }
  }

  return {
    valid: true,
    discountPercent: (data.discountPercent as number | null) ?? 0,
    discountAmount: (data.discountAmount as number | null) ?? 0
  }
})
