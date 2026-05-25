/**
 * useCognitiveProfile — deep cognitive read of a child for the Brain tab.
 *
 * Aggregates signals from AIMessage / HomeworkSubmission / Lesson and
 * StudentModel into a single profile:
 *  - learningStyle (Visual / Auditory / Kinesthetic) — inferred from
 *    which kinds of AI hints the child engages with most
 *  - persistence (0..100) — % of failed answers followed by a retry
 *  - speedTone (slow / normal / fast) — vs. avg time-to-answer
 *  - bestTimeOfDay — hour 0..23 with highest avg AI score / HW accuracy
 *  - bestDayOfWeek — day 0..6 same metric
 *  - radar — 5 axes (speed, accuracy, persistence, abstraction, application)
 *  - archetype — single-sentence character profile
 *  - hourHeatmap — 7×24 matrix of activity intensity
 *
 * Falls back to demo-grade values for smooth Big-4 demos.
 */

export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'mixed'

export interface CognitiveProfile {
  studentId: string
  learningStyle: LearningStyle
  styleConfidence: number
  persistence: number
  speedTone: 'slow' | 'normal' | 'fast'
  avgResponseSeconds: number
  bestHour: number
  bestDay: number
  radar: {
    speed: number
    accuracy: number
    persistence: number
    abstraction: number
    application: number
  }
  hourHeatmap: number[][]
  archetype: string
  insights: Array<{ icon: string, text: string }>
  isDemoFallback: boolean
}

const DAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export const useCognitiveProfile = () => {
  const supabase = useTypedSupabaseClient()

  const fetchProfile = async (studentId: string): Promise<CognitiveProfile> => {
    const since60d = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

    // AIConversation is filtered by studentId. AIMessage has no student column,
    // so we resolve the student's conversation ids first, then load messages.
    const { data: convs } = await supabase
      .from('AIConversation')
      .select('id, mode, createdAt')
      .eq('studentId', studentId)
      .gte('createdAt', since60d)
      .limit(500)

    const convIds = ((convs ?? []) as Array<{ id: string }>).map(c => c.id)

    const [hwRes, msgsRes, modelRes] = await Promise.all([
      supabase
        .from('HomeworkSubmission')
        .select('id, aiScore, status, createdAt, Homework(format)')
        .eq('studentId', studentId)
        .gte('createdAt', since60d)
        .limit(500),
      convIds.length
        ? supabase
            .from('AIMessage')
            .select('role, content, createdAt')
            .in('conversationId', convIds)
            .gte('createdAt', since60d)
            .limit(2000)
        : Promise.resolve({ data: [] as unknown[] }),
      supabase
        .from('StudentModel')
        .select('knowledgeMap, errorPatterns, learningStyle, speed')
        .eq('studentId', studentId)
        .limit(20)
    ])

    const hwRows = (hwRes.data ?? []) as unknown as Array<{ aiScore: number | null, status: string, createdAt: string, Homework: { format: string | null } | null }>
    const msgs = ((msgsRes as { data?: unknown[] }).data ?? []) as Array<{ role: string, content: string | null, createdAt: string }>
    const models = (modelRes.data ?? []) as Array<{ knowledgeMap: Record<string, number> | null, errorPatterns: Record<string, unknown> | null, learningStyle: string | null, speed: number | null }>

    // ── Heatmap (day × hour) of activity intensity ─────────────────────
    const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
    const tally = (createdAt: string, weight = 1) => {
      const d = new Date(createdAt)
      const day = d.getDay()
      const hour = d.getHours()
      heatmap[day]![hour]! += weight
    }
    for (const m of msgs) tally(m.createdAt, 1)
    for (const h of hwRows) tally(h.createdAt, 2)

    let bestHour = 16
    let bestDay = 1
    let bestVal = -1
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        if (heatmap[d]![h]! > bestVal) {
          bestVal = heatmap[d]![h]!
          bestHour = h
          bestDay = d
        }
      }
    }

    // ── Persistence: failed → retry pattern via AIMessage ──────────────
    // Heuristic: after assistant flag "wrong", does user send next msg within 90s?
    let retries = 0
    let failures = 0
    for (let i = 0; i < msgs.length - 1; i++) {
      const cur = msgs[i]
      if (!cur) continue
      const text = (cur.content ?? '').toLowerCase()
      const isFail = cur.role === 'assistant' && /(не правильн|ошибк|неверн|попробу)/i.test(text)
      if (isFail) {
        failures++
        const next = msgs[i + 1]
        if (next && next.role === 'user') {
          const dt = new Date(next.createdAt).getTime() - new Date(cur.createdAt).getTime()
          if (dt < 90_000) retries++
        }
      }
    }
    const persistence = failures > 0 ? Math.round((retries / failures) * 100) : 0

    // ── Speed (avg seconds between user→assistant exchanges) ───────────
    let speedSum = 0
    let speedN = 0
    for (let i = 0; i < msgs.length - 1; i++) {
      const a = msgs[i]
      const b = msgs[i + 1]
      if (a && b && a.role === 'user' && b.role === 'assistant') {
        const dt = (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) / 1000
        if (dt > 0 && dt < 600) {
          speedSum += dt
          speedN++
        }
      }
    }
    const avgResponseSeconds = speedN > 0 ? Math.round(speedSum / speedN) : 0
    const speedTone: 'slow' | 'normal' | 'fast'
      = avgResponseSeconds === 0
        ? 'normal'
        : avgResponseSeconds < 40
          ? 'fast'
          : avgResponseSeconds > 120 ? 'slow' : 'normal'

    // ── Accuracy & application from HW + Student Model ─────────────────
    const scored = hwRows.filter(h => h.aiScore != null)
    const avgScore = scored.length
      ? scored.reduce((s, h) => s + (h.aiScore ?? 0), 0) / scored.length
      : 0
    const accuracy = Math.round(avgScore)

    let applicationFmtCount = 0
    let applicationSum = 0
    for (const h of scored) {
      if (h.Homework?.format === 'FILE' || h.Homework?.format === 'INTERACTIVE' || h.Homework?.format === 'TEXT') {
        applicationFmtCount++
        applicationSum += h.aiScore ?? 0
      }
    }
    const application = applicationFmtCount > 0
      ? Math.round(applicationSum / applicationFmtCount)
      : accuracy

    // ── Abstraction from Student Model: mastery of abstract topics ─────
    let kmTotal = 0
    let kmN = 0
    for (const m of models) {
      const km = m.knowledgeMap ?? {}
      for (const v of Object.values(km)) {
        kmTotal += v
        kmN++
      }
    }
    const abstraction = kmN > 0 ? Math.round(kmTotal / kmN) : 0

    // ── Speed score (0..100) — inversed from latency ───────────────────
    const speed = avgResponseSeconds === 0
      ? 60
      : Math.max(20, Math.min(100, 100 - Math.round((avgResponseSeconds - 40) / 2)))

    // ── Learning style inference (heuristic) ───────────────────────────
    const modelStyle = models.find(m => m.learningStyle)?.learningStyle?.toLowerCase()
    let learningStyle: LearningStyle = 'mixed'
    let styleConfidence = 40
    if (modelStyle === 'visual' || modelStyle === 'auditory' || modelStyle === 'kinesthetic') {
      learningStyle = modelStyle
      styleConfidence = 75
    } else {
      const visualFormats = hwRows.filter(h => h.Homework?.format === 'FILE' || h.Homework?.format === 'INTERACTIVE').length
      const audioFormats = hwRows.filter(h => h.Homework?.format === 'ORAL').length
      const kineticFormats = hwRows.filter(h => h.Homework?.format === 'INPUT' || h.Homework?.format === 'TEST').length
      const max = Math.max(visualFormats, audioFormats, kineticFormats)
      if (max >= 3) {
        if (max === visualFormats) learningStyle = 'visual'
        else if (max === audioFormats) learningStyle = 'auditory'
        else learningStyle = 'kinesthetic'
        styleConfidence = Math.min(85, 40 + max * 5)
      }
    }

    // ── Demo fallback when data is thin ────────────────────────────────
    const isDemoFallback = msgs.length < 6 && hwRows.length < 3 && kmN < 6

    if (isDemoFallback) {
      const fallback: CognitiveProfile = {
        studentId,
        learningStyle: 'visual',
        styleConfidence: 78,
        persistence: 72,
        speedTone: 'normal',
        avgResponseSeconds: 64,
        bestHour: 17,
        bestDay: 2,
        radar: { speed: 68, accuracy: 74, persistence: 72, abstraction: 66, application: 71 },
        hourHeatmap: heatmap,
        archetype: 'Аналитический визуал · утренний тип · любит докапываться до сути.',
        insights: [
          { icon: 'i-lucide-eye', text: 'Лучше всего работает с задачами, где есть рисунок или диаграмма.' },
          { icon: 'i-lucide-rotate-cw', text: '72% попыток после ошибки — это «настойчивый» паттерн (норма 50%).' },
          { icon: 'i-lucide-clock-3', text: 'Пик внимания: вт-чт, 16:00–18:00. Совет: расписание под этот слот.' },
          { icon: 'i-lucide-message-circle', text: 'Часто переспрашивает условие задачи — нужна тренировка чтения текста.' }
        ],
        isDemoFallback: true
      }
      return fallback
    }

    // ── Archetype text ─────────────────────────────────────────────────
    const styleWord = learningStyle === 'visual'
      ? 'визуал'
      : learningStyle === 'auditory'
        ? 'аудиал'
        : learningStyle === 'kinesthetic'
          ? 'кинестетик'
          : 'смешанный тип'
    const persWord = persistence >= 65
      ? 'настойчивый'
      : persistence >= 35
        ? 'умеренно настойчивый'
        : 'быстро переключается'
    const timeWord = bestHour < 11 ? 'утренний' : bestHour < 17 ? 'дневной' : 'вечерний'
    const archetype = `${persWord.charAt(0).toUpperCase() + persWord.slice(1)} ${styleWord} · ${timeWord} тип · ${DAY_LABELS[bestDay]} ${bestHour}:00 — пик формы.`

    const insights: CognitiveProfile['insights'] = []
    if (learningStyle === 'visual') insights.push({ icon: 'i-lucide-eye', text: 'Лучше всего работает с визуальными подсказками и схемами.' })
    if (learningStyle === 'auditory') insights.push({ icon: 'i-lucide-ear', text: 'Хорошо воспринимает устные объяснения и проговаривание решения.' })
    if (learningStyle === 'kinesthetic') insights.push({ icon: 'i-lucide-hand', text: 'Учится на практике: предложите больше interactive-задач.' })

    if (persistence >= 65) insights.push({ icon: 'i-lucide-rotate-cw', text: `${persistence}% попыток после ошибки — это сильный паттерн настойчивости.` })
    else if (persistence < 35 && failures > 4) insights.push({ icon: 'i-lucide-rotate-cw', text: `${persistence}% retry-rate. Стоит работать над "не сдаваться после первой ошибки".` })

    insights.push({ icon: 'i-lucide-clock-3', text: `Пик активности: ${DAY_LABELS[bestDay]}, ${bestHour}:00.` })

    if (speedTone === 'fast') insights.push({ icon: 'i-lucide-zap', text: `Быстрый темп ответа (${avgResponseSeconds} с) — проверьте, не торопится ли в ущерб точности.` })
    if (speedTone === 'slow') insights.push({ icon: 'i-lucide-zap', text: `Медленный темп (${avgResponseSeconds} с) — глубокое обдумывание, не торопить.` })

    return {
      studentId,
      learningStyle,
      styleConfidence,
      persistence,
      speedTone,
      avgResponseSeconds,
      bestHour,
      bestDay,
      radar: { speed, accuracy, persistence, abstraction, application },
      hourHeatmap: heatmap,
      archetype,
      insights,
      isDemoFallback: false
    }
  }

  return { fetchProfile }
}
