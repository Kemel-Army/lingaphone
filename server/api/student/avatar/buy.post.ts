import { z } from 'zod'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/shared/types/database.types'
import { AVATAR_ITEM_MAP } from '~/shared/lib/avatarCatalog'

const bodySchema = z.object({ itemId: z.string().min(1).max(64) })

export default defineEventHandler(async (event) => {
  const caller = await serverSupabaseUser(event)
  if (!caller) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const { itemId } = await readValidatedBody(event, bodySchema.parse)
  const item = AVATAR_ITEM_MAP[itemId]
  if (!item) throw createError({ statusCode: 400, message: 'Unknown item' })

  const supabase = serverSupabaseServiceRole<Database>(event)

  // Resolve student by auth id.
  const { data: userRow } = await supabase.from('User').select('id, role').eq('authId', caller.id).maybeSingle()
  if (!userRow || userRow.role !== 'STUDENT') throw createError({ statusCode: 403, message: 'Forbidden' })
  const { data: studentRow } = await supabase.from('Student').select('id').eq('userId', userRow.id).maybeSingle()
  if (!studentRow) throw createError({ statusCode: 404, message: 'Student not found' })
  const studentId = studentRow.id

  // Current avatar row.
  const { data: avatar } = await supabase
    .from('StudentAvatar')
    .select('config, owned')
    .eq('studentId', studentId)
    .maybeSingle()
  const owned: string[] = (avatar?.owned ?? []) as string[]

  // Free or already owned → nothing to charge.
  if (item.price === 0 || owned.includes(itemId)) {
    const { data: tx } = await supabase.from('LingaCoinTransaction').select('delta').eq('studentId', studentId)
    const balance = ((tx ?? []) as { delta: number }[]).reduce((s, t) => s + t.delta, 0)
    return { owned, balance }
  }

  // Balance = sum of transactions.
  const { data: txRows, error: txErr } = await supabase
    .from('LingaCoinTransaction')
    .select('delta')
    .eq('studentId', studentId)
  if (txErr) throw createError({ statusCode: 500, message: txErr.message })
  const balance = ((txRows ?? []) as { delta: number }[]).reduce((s, t) => s + t.delta, 0)

  if (balance < item.price) {
    throw createError({ statusCode: 400, message: 'Недостаточно Linga Coins' })
  }

  // Charge coins.
  const { error: chargeErr } = await supabase.from('LingaCoinTransaction').insert({
    studentId,
    delta: -item.price,
    reason: 'PURCHASE',
    note: `Покупка: ${item.name}`,
    awardedBy: userRow.id
  } as never)
  if (chargeErr) throw createError({ statusCode: 500, message: chargeErr.message })

  // Grant item.
  const newOwned = [...owned, itemId]
  const { error: grantErr } = await supabase
    .from('StudentAvatar')
    .upsert({ studentId, owned: newOwned, config: avatar?.config ?? {} } as never, { onConflict: 'studentId' })
  if (grantErr) {
    // Compensate the charge if grant failed.
    await supabase.from('LingaCoinTransaction').insert({
      studentId, delta: item.price, reason: 'ADJUSTMENT', note: 'Откат покупки', awardedBy: userRow.id
    } as never)
    throw createError({ statusCode: 500, message: grantErr.message })
  }

  return { owned: newOwned, balance: balance - item.price }
})
