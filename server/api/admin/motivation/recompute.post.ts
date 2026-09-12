/**
 * POST /api/admin/motivation/recompute   (ADMIN | DIRECTOR)
 *
 * Фиксирует итоги месяца в MonthlyMedal: средний балл, медаль, бонус. До
 * пересчёта сводная считается на лету и ничего не сохраняет — так менеджер
 * может править параметры сколько угодно, а «подписывает» месяц один раз.
 *
 * Опционально начисляет Linga Coins за медаль (`awardCoins: true`), по 1 монете
 * за 100 ₸ бонуса. Повторный пересчёт монеты НЕ дублирует.
 *
 * Body: { month: 'YYYY-MM', awardCoins?: boolean }
 */
import { buildMonthlySummary } from '../../../utils/motivationQuery'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN', 'DIRECTOR'])
  const supabase = useServerSupabase(event)

  const body = await readBody(event) as { month?: string, awardCoins?: boolean }
  const month = body.month ?? ''
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw createError({ statusCode: 400, message: 'month должен быть в формате YYYY-MM' })
  }

  const summary = await buildMonthlySummary(supabase, month, null)

  const authId = (user.sub as string | undefined) ?? user.id
  const { data: userRow } = await supabase
    .from('User').select('id').eq('authId', authId).maybeSingle() as unknown as {
    data: { id: string } | null
  }

  // MonthlyMedal.confirmedBy — FK на Teacher, а пересчёт запускает менеджер.
  // Оставляем null, авторство фиксируется в MonthlyMotivationInput.updatedBy.
  const rows = summary.rows.map(r => ({
    studentId: r.studentId,
    // MonthlyMedal.month — TEXT 'YYYY-MM' (исходная схема), не дата.
    month,
    medal: r.medal,
    averageGrade: r.average,
    payout: r.payout,
    teacherAvg: r.teacherAvg,
    instagramPoints: r.instagramPoints,
    paymentPoints: r.paymentPoints,
    bookPoints: r.bookPoints,
    lessonsCounted: r.lessonsCounted,
    gradesCount: r.gradesCount,
    participates: r.participates,
    confirmedAt: new Date().toISOString()
  }))

  if (rows.length) {
    const { error } = await supabase
      .from('MonthlyMedal')
      .upsert(rows, { onConflict: 'studentId,month' })
    if (error) throw createError({ statusCode: 500, message: error.message })
  }

  let coinsAwarded = 0
  if (body.awardCoins) {
    const note = `Медаль за ${month}`
    const winners = summary.rows.filter(r => r.payout > 0)

    // Уже начисленные за этот месяц — чтобы повторный пересчёт не задвоил.
    const { data: existing } = await supabase
      .from('LingaCoinTransaction')
      .select('studentId')
      .eq('reason', 'MEDAL')
      .eq('note', note) as unknown as { data: { studentId: string }[] | null }
    const already = new Set((existing ?? []).map(t => t.studentId))

    const tx = winners
      .filter(r => !already.has(r.studentId))
      .map(r => ({
        studentId: r.studentId,
        delta: Math.round(r.payout / 100),
        reason: 'MEDAL' as const,
        note,
        awardedBy: userRow?.id ?? null
      }))

    if (tx.length) {
      const { error } = await supabase.from('LingaCoinTransaction').insert(tx)
      if (error) throw createError({ statusCode: 500, message: error.message })
      coinsAwarded = tx.length
    }
  }

  return { ok: true, month, saved: rows.length, totals: summary.totals, coinsAwarded }
})
