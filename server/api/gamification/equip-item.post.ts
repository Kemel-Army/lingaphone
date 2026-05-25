import { z } from 'zod'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * POST /api/gamification/equip-item
 *
 * Equip a previously purchased cosmetic. The student must own the item
 * (StudentInventory.quantity > 0). Effect depends on category:
 *
 *   AVATAR_FRAME   → StudentGameProfile.activeFrameId = shopItemId
 *   TITLE          → StudentGameProfile.activeTitleId = shopItemId
 *   PROFILE_THEME  → StudentGameProfile.visualMode    = effect.name
 *
 * Passing shopItemId = null with a category clears the slot (снять).
 * POWER_UP items cannot be equipped — they are consumed at action time.
 */

const schema = z.object({
  category: z.enum(['AVATAR_FRAME', 'TITLE', 'PROFILE_THEME']),
  shopItemId: z.string().uuid().nullable()
})

export default defineEventHandler(async (event) => {
  const { studentId } = await getCurrentStudent(event)
  const body = await readBody(event)
  const parsed = schema.parse(body)

  const supabase = useServerSupabase(event)

  // Determine which slot we are writing.
  const slot: 'activeFrameId' | 'activeTitleId' | 'visualMode'
    = parsed.category === 'AVATAR_FRAME'
      ? 'activeFrameId'
      : parsed.category === 'TITLE'
        ? 'activeTitleId'
        : 'visualMode'

  // Unequip path.
  if (parsed.shopItemId === null) {
    const update: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    update[slot] = slot === 'visualMode' ? '' : null
    const { error } = await supabase
      .from('StudentGameProfile')
      .update(update as never)
      .eq('studentId', studentId)
    if (error) throw createError({ statusCode: 500, message: error.message })
    return { ok: true, [slot]: update[slot] }
  }

  // Equip path — load item, verify category and ownership.
  const { data: item, error: itemErr } = await supabase
    .from('ShopItem')
    .select('id, category, effect')
    .eq('id', parsed.shopItemId)
    .single()
  if (itemErr || !item) throw createError({ statusCode: 404, message: 'Item not found' })

  const i = item as Record<string, any>
  if (i.category !== parsed.category) {
    throw createError({ statusCode: 400, message: 'Item category mismatch' })
  }

  const { data: inv } = await supabase
    .from('StudentInventory')
    .select('quantity')
    .eq('studentId', studentId)
    .eq('shopItemId', parsed.shopItemId)
    .maybeSingle()
  if (!inv || ((inv as Record<string, any>).quantity as number) <= 0) {
    throw createError({ statusCode: 400, message: 'Item not in inventory' })
  }

  // Compute value to write into the slot.
  let value: string | null = parsed.shopItemId
  if (slot === 'visualMode') {
    const themeName = (i.effect as Record<string, unknown> | null)?.name
    value = typeof themeName === 'string' ? themeName : ''
  }

  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() }
  update[slot] = value
  const { error } = await supabase
    .from('StudentGameProfile')
    .update(update as never)
    .eq('studentId', studentId)
  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true, [slot]: value }
})
