import { z } from 'zod'

const bodySchema = z.object({
  subscriptionId: z.string().uuid()
})

/**
 * Cancel a subscription. Verifies the caller owns it (or is admin).
 * Client direct UPDATEs on Subscription are blocked by RLS.
 */
export default defineEventHandler(async (event) => {
  const authUser = await requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  const { data: caller } = await supabase
    .from('User').select('id, role').eq('authId', authUser.id).single()
  if (!caller) throw createError({ statusCode: 401, message: 'User profile not found' })

  const { data: sub, error: subErr } = await supabase
    .from('Subscription')
    .select('id, userId, status')
    .eq('id', body.subscriptionId)
    .maybeSingle()

  if (subErr) throw createError({ statusCode: 500, message: subErr.message })
  if (!sub) throw createError({ statusCode: 404, message: 'Subscription not found' })

  const isOwner = (sub as { userId: string }).userId === caller.id
  const isAdmin = caller.role === 'ADMIN'
  if (!isOwner && !isAdmin) {
    throw createError({ statusCode: 403, message: 'Not your subscription' })
  }

  if ((sub as { status: string }).status === 'CANCELLED') {
    return { ok: true, idempotent: true }
  }

  const { error } = await supabase
    .from('Subscription')
    .update({
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as never)
    .eq('id', body.subscriptionId)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
