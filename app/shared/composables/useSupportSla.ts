/**
 * useSupportSla — operational SLA metrics for the admin support page.
 *
 * Computes:
 *  - openCount / inProgressCount / resolvedCount
 *  - resolvedToday
 *  - slaBreaches: open/in-progress tickets older than 24h
 *  - avgFirstResponseMinutes: avg time from createdAt to updatedAt across
 *    tickets that have moved out of OPEN
 *  - csatPct: % of resolved tickets where the closure happened within 24h
 *    (proxy until a real CSAT survey is wired)
 */

export interface SupportSlaStats {
  total: number
  openCount: number
  inProgressCount: number
  resolvedCount: number
  resolvedToday: number
  slaBreaches: number
  avgFirstResponseMinutes: number
  csatPct: number
}

const HOUR = 60 * 60 * 1000

export const useSupportSla = () => {
  const supabase = useTypedSupabaseClient()

  const fetchSupportSla = async (): Promise<SupportSlaStats> => {
    const { data, error } = await supabase
      .from('SupportTicket')
      .select('id, status, createdAt, updatedAt, resolvedAt')
      .order('createdAt', { ascending: false })
      .limit(2000)

    if (error || !data) {
      return {
        total: 0,
        openCount: 0,
        inProgressCount: 0,
        resolvedCount: 0,
        resolvedToday: 0,
        slaBreaches: 0,
        avgFirstResponseMinutes: 0,
        csatPct: 0
      }
    }

    const rows = data as Array<{
      status: string
      createdAt: string
      updatedAt: string
      resolvedAt: string | null
    }>

    const now = Date.now()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayStartMs = todayStart.getTime()

    let openCount = 0
    let inProgressCount = 0
    let resolvedCount = 0
    let resolvedToday = 0
    let slaBreaches = 0
    let frSum = 0
    let frN = 0
    let csatGood = 0
    let csatN = 0

    for (const r of rows) {
      const created = new Date(r.createdAt).getTime()
      if (r.status === 'OPEN') {
        openCount++
        if (now - created > 24 * HOUR) slaBreaches++
      } else if (r.status === 'IN_PROGRESS') {
        inProgressCount++
        if (now - created > 24 * HOUR) slaBreaches++
        const updated = new Date(r.updatedAt).getTime()
        if (updated > created) {
          frSum += (updated - created) / 60000
          frN++
        }
      } else if (r.status === 'RESOLVED' || r.status === 'CLOSED') {
        resolvedCount++
        const closed = r.resolvedAt ? new Date(r.resolvedAt).getTime() : new Date(r.updatedAt).getTime()
        if (closed >= todayStartMs) resolvedToday++
        csatN++
        if (closed - created <= 24 * HOUR) csatGood++
        if (closed > created) {
          frSum += (closed - created) / 60000
          frN++
        }
      }
    }

    return {
      total: rows.length,
      openCount,
      inProgressCount,
      resolvedCount,
      resolvedToday,
      slaBreaches,
      avgFirstResponseMinutes: frN > 0 ? Math.round(frSum / frN) : 0,
      csatPct: csatN > 0 ? Math.round((csatGood / csatN) * 100) : 0
    }
  }

  return { fetchSupportSla }
}
