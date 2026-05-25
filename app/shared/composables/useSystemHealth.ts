/**
 * useSystemHealth — lightweight health probe for the admin navbar.
 *
 * Pings:
 *  - Supabase (HEAD request to a tiny table for round-trip latency)
 *  - OpenAI (status proxy; defaults to "ok" until a real probe is wired)
 *
 * Polls every 60s while the page is visible. Exposes:
 *  - overall ('ok' | 'degraded' | 'down')
 *  - supabaseStatus, supabaseLatency
 *  - openAiStatus
 *  - lastCheckedAt
 */

type Status = 'ok' | 'degraded' | 'down' | 'unknown'

export const useSystemHealth = (opts: { intervalMs?: number } = {}) => {
  const supabase = useTypedSupabaseClient()
  const interval = opts.intervalMs ?? 60000

  const supabaseStatus = ref<Status>('unknown')
  const supabaseLatency = ref<number | null>(null)
  const openAiStatus = ref<Status>('ok')
  const storageStatus = ref<Status>('ok')
  const lastCheckedAt = ref<Date | null>(null)
  const loading = ref(false)

  let timer: ReturnType<typeof setInterval> | null = null
  let visibilityHandler: (() => void) | null = null

  const overall = computed<Status>(() => {
    const arr = [supabaseStatus.value, openAiStatus.value, storageStatus.value]
    if (arr.includes('down')) return 'down'
    if (arr.includes('degraded')) return 'degraded'
    if (arr.every(s => s === 'ok')) return 'ok'
    return 'unknown'
  })

  async function probeSupabase() {
    const t0 = performance.now()
    try {
      const { error } = await supabase
        .from('User')
        .select('id', { count: 'exact', head: true })
        .limit(1)
      const dt = Math.round(performance.now() - t0)
      supabaseLatency.value = dt
      if (error) {
        supabaseStatus.value = 'down'
        return
      }
      supabaseStatus.value = dt > 1500 ? 'degraded' : 'ok'
    } catch {
      supabaseStatus.value = 'down'
      supabaseLatency.value = null
    }
  }

  async function refresh() {
    loading.value = true
    try {
      await probeSupabase()
      // OpenAI / Storage probes — stub until backend ping route exists.
      openAiStatus.value = 'ok'
      storageStatus.value = 'ok'
      lastCheckedAt.value = new Date()
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
    overall,
    supabaseStatus,
    supabaseLatency,
    openAiStatus,
    storageStatus,
    lastCheckedAt,
    loading,
    refresh
  }
}
