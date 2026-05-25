import { z } from 'zod'

const schema = z.object({
  shopItemId: z.string().uuid()
})

/**
 * POST /api/gamification/shop-purchase
 * Purchase a shop item with gems. studentId is resolved from auth.
 *
 * The actual gem deduction, inventory write and effect application are
 * done in the purchase_shop_item_atomic Postgres function which holds a
 * row lock on StudentGameProfile — two parallel purchases by the same
 * student cannot both succeed against the same balance.
 */
export default defineEventHandler(async (event) => {
  const { studentId } = await getCurrentStudent(event)
  const body = await readBody(event)
  const parsed = schema.parse(body)

  const supabase = useServerSupabase(event)

  const { data, error } = await supabase.rpc('purchase_shop_item_atomic', {
    p_student_id: studentId,
    p_shop_item_id: parsed.shopItemId
  } as never)

  if (error) {
    // Map Postgres error codes / messages back to HTTP status the client expects.
    const msg = error.message ?? ''
    if (msg.includes('Item not found')) {
      throw createError({ statusCode: 404, message: 'Item not found' })
    }
    if (msg.includes('Game profile not found')) {
      throw createError({ statusCode: 404, message: 'Game profile not found' })
    }
    if (msg.startsWith('Requires level')) {
      throw createError({ statusCode: 400, message: msg })
    }
    if (msg.includes('Already own maximum')) {
      throw createError({ statusCode: 400, message: 'Already own maximum quantity' })
    }
    if (msg.includes('Insufficient gems')) {
      throw createError({ statusCode: 400, message: 'Insufficient gems' })
    }
    throw createError({ statusCode: 500, message: msg || 'Purchase failed' })
  }

  const result = data as {
    gems: number
    quantity: number
    itemId: string
    itemName: string
  }

  return {
    gems: result.gems,
    item: { id: result.itemId, name: result.itemName },
    inventory: { quantity: result.quantity }
  }
})
