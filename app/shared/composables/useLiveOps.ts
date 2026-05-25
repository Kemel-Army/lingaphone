/**
 * useLiveOps — real-time platform pulse for the admin dashboard.
 *
 * Returns active counters that auto-refresh every 15s while the page is
 * visible. The platform is now tutor-less, so "live lessons" is gone;
 * counters are derived from AI sessions and homework submissions.
 *
 * Counters:
 *  - usersActive5m   — distinct students with AI activity in last 5 min
 *  - aiSessionsLive  — AIConversation updated in last 10 min
 *  - submissions1h   — HomeworkSubmission rows created in last 60 min
 */
export const useLiveOps = (opts: { intervalMs?: number } = {}) => {
  const supabase = useTypedSupabaseClient()
  const interval = opts.intervalMs ?? 15000

  const usersActive5m = ref<number>(0)
  const aiSessionsLive = ref<number>(0)
  const submissions1h = ref<number>(0)
  const lastUpdatedAt = ref<Date | null>(null)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  let timer: ReturnType<typeof setInterval> | null = null
  let visibilityHandler: (() => void) | null = null

  async function refresh() {
    loading.value = true
    error.value = null
    try {
      const now = Date.now()
      const since5m = new Date(now - 5 * 60 * 1000).toISOString()
      const since10m = new Date(now - 10 * 60 * 1000).toISOString()
      const since60m = new Date(now - 60 * 60 * 1000).toISOString()

      const [activeRes, hwRes, aiConvRes] = await Promise.all([
        supabase
          .from('AIConversation')
          .select('studentId')
          .gte('updatedAt', since5m)
          .limit(500),
        supabase
          .from('HomeworkSubmission')
          .select('id', { count: 'exact', head: true })
          .gte('createdAt', since60m),
        supabase
          .from('AIConversation')
          .select('id, updatedAt')
          .gte('updatedAt', since10m)
          .limit(200)
      ])

      const active = (activeRes.data ?? []) as Array<{ studentId: string | null }>
      const distinct = new Set<string>()
      for (const r of active) if (r.studentId) distinct.add(r.studentId)
      usersActive5m.value = distinct.size

      submissions1h.value = hwRes.count ?? 0

      aiSessionsLive.value = (aiConvRes.data ?? []).length

      lastUpdatedAt.value = new Date()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'live-ops-failed'
    } finally {
      loading.value = false
    }
  }

  function start() {
    refresh()
    timer = setInterval(refresh, interval)
  }

  function stop() {
    if (timer) clearInterval(timer)
    timer = null
  }

  onMounted(() => {
    start()
    if (typeof document !== 'undefined') {
      visibilityHandler = () => {
        if (document.visibilityState === 'visible') {
          if (!timer) start()
        } else {
          stop()
        }
      }
      document.addEventListener('visibilitychange', visibilityHandler)
    }
  })

  onUnmounted(() => {
    stop()
    if (visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityHandler)
    }
  })

  return {
    usersActive5m,
    aiSessionsLive,
    submissions1h,
    lastUpdatedAt,
    loading,
    error,
    refresh
  }
}
