/**
 * POST /api/admin/motivation/inputs   (ADMIN | DIRECTOR)
 *
 * Менеджерские параметры месяца: Instagram, оплата вовремя, книги и кол-во
 * занятий по абонементу. Учитель их НЕ ставит — только менеджер.
 *
 * Body: { month: 'YYYY-MM', studentId, instagram?, paidOnTime?, books?, subscriptionLessons?, note? }
 */
export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN', 'DIRECTOR'])
  const supabase = useServerSupabase(event)

  const body = await readBody(event) as {
    month?: string
    studentId?: string
    instagram?: boolean
    paidOnTime?: boolean
    books?: boolean
    subscriptionLessons?: number
    note?: string | null
  }

  const { month, studentId } = body
  if (!studentId) throw createError({ statusCode: 400, message: 'studentId обязателен' })
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw createError({ statusCode: 400, message: 'month должен быть в формате YYYY-MM' })
  }

  const subscriptionLessons = body.subscriptionLessons ?? 0
  if (!Number.isInteger(subscriptionLessons) || subscriptionLessons < 0 || subscriptionLessons > 100) {
    throw createError({ statusCode: 400, message: 'subscriptionLessons — целое число 0–100' })
  }

  const authId = (user.sub as string | undefined) ?? user.id
  const { data: userRow } = await supabase
    .from('User').select('id').eq('authId', authId).maybeSingle() as unknown as {
    data: { id: string } | null
  }

  const { error } = await supabase
    .from('MonthlyMotivationInput')
    .upsert({
      studentId,
      month,
      instagram: body.instagram ?? false,
      paidOnTime: body.paidOnTime ?? false,
      books: body.books ?? false,
      subscriptionLessons,
      note: body.note?.trim() || null,
      updatedBy: userRow?.id ?? null,
      updatedAt: new Date().toISOString()
    }, { onConflict: 'studentId,month' })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
