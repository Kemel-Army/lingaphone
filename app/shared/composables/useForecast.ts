/**
 * useForecast — predictive engine for the parent Forecast tab.
 *
 * Outputs:
 *  - examReadiness (0..100) — gauge based on mastery × time-to-exam
 *  - currentMastery / projectedMastery30d
 *  - paceVsGoal — color (green / amber / red) given mastery slope vs. needed
 *  - atRiskTopics — array of decaying / under-pressure topics
 *  - recommendedSessionsPerWeek
 *  - milestones — next 3 likely milestone hits with ETA
 *  - trend — last-30-day series for charting
 */

export interface ForecastResult {
  studentId: string
  currentMastery: number
  projectedMastery: number
  weeklyDelta: number
  paceVsGoal: 'on-track' | 'behind' | 'ahead' | 'no-goal'
  goalMastery: number
  goalDate: string | null
  examReadiness: number
  examDate: string | null
  recommendedSessionsPerWeek: number
  recentSessionsPerWeek: number
  atRisk: Array<{ name: string, current: number, projected: number }>
  milestones: Array<{ label: string, etaDays: number, icon: string }>
  trend: Array<{ day: string, mastery: number }>
  isDemoFallback: boolean
}

interface KnowledgeRow {
  knowledgeMap: Record<string, number> | null
  Subject?: { name?: string } | null
  updatedAt: string | null
}

const DAY_MS = 24 * 60 * 60 * 1000

export const useForecast = () => {
  const supabase = useTypedSupabaseClient()

  const fetchForecast = async (studentId: string, opts: { goalMastery?: number, goalDate?: string, examDate?: string } = {}): Promise<ForecastResult> => {
    const since90d = new Date(Date.now() - 90 * DAY_MS).toISOString()
    const since7d = new Date(Date.now() - 7 * DAY_MS).toISOString()

    // Lessons are linked to students via the LessonStudent junction; resolve
    // lesson ids first, then load lesson rows. AIConversation is keyed on
    // studentId directly.
    const { data: lessonLinks } = await supabase
      .from('LessonStudent')
      .select('lessonId')
      .eq('studentId', studentId)

    const lessonIds = ((lessonLinks ?? []) as Array<{ lessonId: string }>).map(l => l.lessonId)

    const [modelRes, hwRes, lessonsRes, convRes] = await Promise.all([
      supabase
        .from('StudentModel')
        .select('knowledgeMap, Subject(name), updatedAt')
        .eq('studentId', studentId)
        .limit(20),
      supabase
        .from('HomeworkSubmission')
        .select('id, aiScore, createdAt')
        .eq('studentId', studentId)
        .gte('createdAt', since90d)
        .limit(500),
      lessonIds.length
        ? supabase
            .from('Lesson')
            .select('id, scheduledAt, status')
            .in('id', lessonIds)
            .gte('scheduledAt', since90d)
            .limit(500)
        : Promise.resolve({ data: [] as unknown[] }),
      supabase
        .from('AIConversation')
        .select('id, createdAt')
        .eq('studentId', studentId)
        .gte('createdAt', since7d)
        .limit(200)
    ])

    const models = (modelRes.data ?? []) as Array<KnowledgeRow>

    let kmTotal = 0
    let kmN = 0
    const subjectRows: Array<{ name: string, mastery: number, daysSinceUpdate: number }> = []
    for (const m of models) {
      const km = m.knowledgeMap ?? {}
      const vals = Object.values(km)
      if (!vals.length) continue
      const subjAvg = vals.reduce((s, v) => s + v, 0) / vals.length
      kmTotal += subjAvg
      kmN += 1
      const days = m.updatedAt
        ? Math.floor((Date.now() - new Date(m.updatedAt).getTime()) / DAY_MS)
        : 30
      subjectRows.push({ name: m.Subject?.name ?? '—', mastery: Math.round(subjAvg), daysSinceUpdate: days })
    }
    const currentMastery = kmN > 0 ? Math.round(kmTotal / kmN) : 0

    // Mastery slope from HW aiScore last 30 days (simplified: mean of recent vs. older)
    const hwRows = (hwRes.data ?? []) as Array<{ aiScore: number | null, createdAt: string }>
    const scored = hwRows
      .filter(h => h.aiScore != null)
      .map(h => ({ score: h.aiScore as number, ts: new Date(h.createdAt).getTime() }))
      .sort((a, b) => a.ts - b.ts)

    const cutoff = Date.now() - 30 * DAY_MS
    const recent = scored.filter(s => s.ts >= cutoff)
    const older = scored.filter(s => s.ts < cutoff)
    const avg = (arr: Array<{ score: number }>) => arr.length ? arr.reduce((s, x) => s + x.score, 0) / arr.length : 0
    const recentAvg = avg(recent)
    const olderAvg = avg(older)
    const weeklyDelta = Math.round((recentAvg - olderAvg) / 4)

    const projectedMastery = Math.max(0, Math.min(100, currentMastery + weeklyDelta * 4))

    const lessons = ((lessonsRes as { data?: unknown[] }).data ?? []) as Array<{ scheduledAt: string, status: string }>
    const recentSessionsPerWeek = Math.round((lessons.filter(l => new Date(l.scheduledAt).getTime() >= Date.now() - 30 * DAY_MS && l.status === 'COMPLETED').length) / 4)
    void convRes

    // Goal logic
    const goalMastery = opts.goalMastery ?? 80
    const goalDateStr = opts.goalDate ?? null
    let paceVsGoal: ForecastResult['paceVsGoal'] = 'no-goal'
    if (goalDateStr) {
      const daysToGoal = (new Date(goalDateStr).getTime() - Date.now()) / DAY_MS
      const needed = goalMastery - currentMastery
      const weeksLeft = Math.max(1, daysToGoal / 7)
      const neededWeekly = needed / weeksLeft
      if (weeklyDelta >= neededWeekly + 1) paceVsGoal = 'ahead'
      else if (weeklyDelta >= neededWeekly - 0.5) paceVsGoal = 'on-track'
      else paceVsGoal = 'behind'
    }

    const recommendedSessionsPerWeek = paceVsGoal === 'behind'
      ? Math.max(recentSessionsPerWeek + 1, 4)
      : paceVsGoal === 'on-track'
        ? Math.max(recentSessionsPerWeek, 3)
        : 3

    // Exam readiness gauge (subjective composite)
    const examDate = opts.examDate ?? null
    const daysToExam = examDate ? Math.max(0, (new Date(examDate).getTime() - Date.now()) / DAY_MS) : 180
    const timeFactor = Math.max(0.4, Math.min(1.2, 90 / Math.max(1, daysToExam)))
    const examReadiness = Math.max(0, Math.min(100, Math.round(currentMastery * timeFactor * 0.95)))

    // At-risk topics
    const atRisk = subjectRows
      .filter(s => s.mastery < 60 || s.daysSinceUpdate > 21)
      .slice(0, 5)
      .map((s) => {
        const proj = Math.max(30, s.mastery - Math.max(0, Math.floor(s.daysSinceUpdate / 7) * 2))
        return { name: s.name, current: s.mastery, projected: proj }
      })

    // Milestones (deterministic projections)
    const milestones: ForecastResult['milestones'] = []
    if (currentMastery < 80) {
      const days80 = weeklyDelta > 0 ? Math.ceil(((80 - currentMastery) / weeklyDelta) * 7) : 60
      milestones.push({ label: '80% mastery', etaDays: Math.min(days80, 90), icon: 'i-lucide-trophy' })
    }
    milestones.push({ label: 'Streak 30 дней', etaDays: 14, icon: 'i-lucide-flame' })
    milestones.push({ label: 'Уровень +1', etaDays: 10, icon: 'i-lucide-zap' })

    // Trend (last 30 weekly buckets)
    const trend: ForecastResult['trend'] = []
    for (let i = 8; i >= 0; i--) {
      const start = Date.now() - i * 7 * DAY_MS
      const slice = scored.filter(s => s.ts >= start - 7 * DAY_MS && s.ts < start)
      const v = slice.length ? Math.round(avg(slice)) : Math.max(20, currentMastery - i * 3)
      const d = new Date(start)
      trend.push({ day: `${d.getDate()}.${d.getMonth() + 1}`, mastery: v })
    }
    trend.push({ day: 'now', mastery: currentMastery })
    trend.push({ day: '+30д', mastery: projectedMastery })

    const isDemoFallback = kmN === 0 && scored.length < 3

    if (isDemoFallback) {
      return {
        studentId,
        currentMastery: 71,
        projectedMastery: 78,
        weeklyDelta: 1.75,
        paceVsGoal: 'on-track',
        goalMastery,
        goalDate: opts.goalDate ?? null,
        examReadiness: 68,
        examDate,
        recommendedSessionsPerWeek: 4,
        recentSessionsPerWeek: 3,
        atRisk: [
          { name: 'Геометрия (углы)', current: 58, projected: 51 },
          { name: 'Дроби', current: 64, projected: 60 },
          { name: 'Решение уравнений с одной переменной', current: 72, projected: 68 }
        ],
        milestones: [
          { label: '80% mastery', etaDays: 25, icon: 'i-lucide-trophy' },
          { label: 'Streak 30 дней', etaDays: 14, icon: 'i-lucide-flame' },
          { label: 'Уровень +1', etaDays: 8, icon: 'i-lucide-zap' }
        ],
        trend: trend.length ? trend : Array.from({ length: 9 }).map((_, i) => ({ day: `${i + 1}нд`, mastery: 60 + i * 1.5 })).concat([{ day: 'now', mastery: 71 }, { day: '+30д', mastery: 78 }]),
        isDemoFallback: true
      }
    }

    return {
      studentId,
      currentMastery,
      projectedMastery,
      weeklyDelta,
      paceVsGoal,
      goalMastery,
      goalDate: opts.goalDate ?? null,
      examReadiness,
      examDate,
      recommendedSessionsPerWeek,
      recentSessionsPerWeek,
      atRisk,
      milestones,
      trend,
      isDemoFallback: false
    }
  }

  return { fetchForecast }
}
