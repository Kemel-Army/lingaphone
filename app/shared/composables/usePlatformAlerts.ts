/**
 * usePlatformAlerts — consolidated platform-level alerts for the admin
 * dashboard. Aggregates signals from across the platform into a single
 * prioritised feed.
 *
 * Severity tiers (high/medium/low) drive both visual treatment and the
 * order of the feed. Each alert exposes a CTA route for one-click triage.
 */

export interface PlatformAlert {
  id: string
  severity: 'high' | 'medium' | 'low'
  icon: string
  title: string
  detail?: string
  count?: number
  to: string
  cta: string
}

export const usePlatformAlerts = () => {
  const supabase = useTypedSupabaseClient()
  const { t } = useI18n()

  const fetchAlerts = async (): Promise<PlatformAlert[]> => {
    const alerts: PlatformAlert[] = []

    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const safe = <T>(p: PromiseLike<T>): Promise<T | null> =>
      Promise.resolve(p).then(v => v).catch(() => null)

    const [overdueHwRes, failedPayRes, atRiskRes, unrepliedSupportRes, expiringSubsRes] = await Promise.all([
      safe(supabase
        .from('HomeworkSubmission')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'OVERDUE')),
      safe(supabase
        .from('Payment')
        .select('id', { count: 'exact', head: true })
        .in('status', ['FAILED', 'PENDING'])
        .gte('createdAt', since7d)),
      safe(supabase
        .from('StudentModel')
        .select('studentId, knowledgeMap')
        .limit(500)),
      safe(supabase
        .from('SupportTicket')
        .select('id', { count: 'exact', head: true })
        .in('status', ['OPEN', 'IN_PROGRESS'])
        .lte('createdAt', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())),
      safe(supabase
        .from('Subscription')
        .select('id, currentPeriodEnd')
        .gte('currentPeriodEnd', new Date().toISOString())
        .lte('currentPeriodEnd', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString())
        .eq('status', 'ACTIVE'))
    ])

    const overdueHw = overdueHwRes?.count ?? 0
    if (overdueHw > 0) {
      alerts.push({
        id: 'overdue-hw',
        severity: overdueHw >= 20 ? 'high' : overdueHw >= 5 ? 'medium' : 'low',
        icon: 'i-lucide-hourglass',
        title: t('admin.alerts.overdueHw.title', { count: overdueHw }),
        detail: t('admin.alerts.overdueHw.detail'),
        count: overdueHw,
        to: '/admin/homework',
        cta: t('admin.alerts.cta.investigate')
      })
    }

    const failedPay = failedPayRes?.count ?? 0
    if (failedPay > 0) {
      alerts.push({
        id: 'failed-payments',
        severity: failedPay >= 5 ? 'high' : 'medium',
        icon: 'i-lucide-credit-card-x',
        title: t('admin.alerts.failedPay.title', { count: failedPay }),
        detail: t('admin.alerts.failedPay.detail'),
        count: failedPay,
        to: '/admin/finance/clients',
        cta: t('admin.alerts.cta.contact')
      })
    }

    // At-risk students: avg mastery < 40%
    const models = (atRiskRes?.data ?? []) as Array<{ studentId: string, knowledgeMap: Record<string, number> | null }>
    const buckets = new Map<string, { sum: number, n: number }>()
    for (const m of models) {
      const km = m.knowledgeMap
      if (!km) continue
      const vals = Object.values(km)
      if (!vals.length) continue
      const cur = buckets.get(m.studentId) ?? { sum: 0, n: 0 }
      cur.sum += vals.reduce((s, v) => s + v, 0)
      cur.n += vals.length
      buckets.set(m.studentId, cur)
    }
    let atRisk = 0
    for (const [, v] of buckets) {
      const avg = v.n > 0 ? v.sum / v.n : 0
      if (avg < 40) atRisk++
    }
    if (atRisk > 0) {
      alerts.push({
        id: 'at-risk',
        severity: atRisk >= 10 ? 'high' : atRisk >= 3 ? 'medium' : 'low',
        icon: 'i-lucide-alert-triangle',
        title: t('admin.alerts.atRisk.title', { count: atRisk }),
        detail: t('admin.alerts.atRisk.detail'),
        count: atRisk,
        to: '/admin/early-warning',
        cta: t('admin.alerts.cta.open')
      })
    }

    const unrepliedSupport = unrepliedSupportRes?.count ?? 0
    if (unrepliedSupport > 0) {
      alerts.push({
        id: 'support-sla',
        severity: unrepliedSupport >= 5 ? 'high' : 'medium',
        icon: 'i-lucide-headset',
        title: t('admin.alerts.supportSla.title', { count: unrepliedSupport }),
        detail: t('admin.alerts.supportSla.detail'),
        count: unrepliedSupport,
        to: '/admin/support',
        cta: t('admin.alerts.cta.reply')
      })
    }

    const expiringSubs = (expiringSubsRes?.data ?? []).length
    if (expiringSubs > 0) {
      alerts.push({
        id: 'expiring-subs',
        severity: 'low',
        icon: 'i-lucide-rotate-cw',
        title: t('admin.alerts.expiringSubs.title', { count: expiringSubs }),
        detail: t('admin.alerts.expiringSubs.detail'),
        count: expiringSubs,
        to: '/admin/finance/subscriptions',
        cta: t('admin.alerts.cta.open')
      })
    }

    const order = { high: 0, medium: 1, low: 2 } as const
    return alerts.sort((a, b) => order[a.severity] - order[b.severity])
  }

  return { fetchAlerts }
}
