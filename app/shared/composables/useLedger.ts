/**
 * useLedger — finance summary for the admin refunds/ledger page.
 *
 * Reads Payment rows for the given window (default 90 days) and aggregates:
 *  - gross (sum of COMPLETED)
 *  - refunded (sum of REFUNDED)
 *  - net = gross - refunded
 *  - pending (sum of PENDING)
 *  - failed count
 *  - refundRate = refunded / gross
 *  - monthlyBreakdown (last 6 months)
 */

export interface LedgerSummary {
  gross: number
  refunded: number
  net: number
  pending: number
  failedCount: number
  refundRate: number
  monthlyBreakdown: Array<{ month: string, gross: number, refunded: number, net: number }>
  refunds: Array<{
    id: string
    amount: number
    createdAt: string
    user: { name: string | null, surname: string | null } | null
  }>
}

export const useLedger = () => {
  const supabase = useTypedSupabaseClient()

  const fetchLedger = async (daysWindow = 90): Promise<LedgerSummary> => {
    const since = new Date(Date.now() - daysWindow * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('Payment')
      .select('id, amount, status, createdAt, userId')
      .gte('createdAt', since)
      .order('createdAt', { ascending: false })
      .limit(5000)

    if (error || !data) {
      return {
        gross: 0,
        refunded: 0,
        net: 0,
        pending: 0,
        failedCount: 0,
        refundRate: 0,
        monthlyBreakdown: [],
        refunds: []
      }
    }

    const rows = data as Array<{
      id: string
      amount: number | null
      status: string
      createdAt: string
      userId: string | null
    }>

    let gross = 0
    let refunded = 0
    let pending = 0
    let failedCount = 0
    const refunds: LedgerSummary['refunds'] = []

    const monthly = new Map<string, { gross: number, refunded: number }>()

    for (const r of rows) {
      const a = r.amount ?? 0
      const monthKey = r.createdAt.slice(0, 7) // YYYY-MM
      const m = monthly.get(monthKey) ?? { gross: 0, refunded: 0 }

      if (r.status === 'COMPLETED') {
        gross += a
        m.gross += a
      } else if (r.status === 'REFUNDED') {
        refunded += a
        m.refunded += a
        refunds.push({ id: r.id, amount: a, createdAt: r.createdAt, user: null })
      } else if (r.status === 'PENDING') {
        pending += a
      } else if (r.status === 'FAILED') {
        failedCount++
      }

      monthly.set(monthKey, m)
    }

    const monthlyBreakdown = Array.from(monthly.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, v]) => ({
        month,
        gross: v.gross,
        refunded: v.refunded,
        net: v.gross - v.refunded
      }))

    return {
      gross,
      refunded,
      net: gross - refunded,
      pending,
      failedCount,
      refundRate: gross > 0 ? refunded / gross : 0,
      monthlyBreakdown,
      refunds: refunds.slice(0, 30)
    }
  }

  return { fetchLedger }
}
