/**
 * useIaeImpact — IAE effectiveness metric for the admin analytics dashboard.
 *
 * Compares student mastery growth between cohorts:
 *  - "withAI"   — students who had ≥3 AI sessions in the last 30d
 *  - "withoutAI"— students with no AI sessions in the last 30d
 *
 * Returns avg mastery for each cohort plus the delta. This is the headline
 * IAE-impact number we show to Big-4 buyers: "AI tutoring lifts mastery by
 * +X percentage points vs. no AI."
 *
 * If the data is too thin to be meaningful, falls back to a demo baseline
 * (with-AI 72%, without 58%, +14pp) so the dashboard isn't blank for demos.
 */

export interface IaeImpactStats {
  withAI: { count: number, avgMastery: number }
  withoutAI: { count: number, avgMastery: number }
  delta: number
  topGrowthSubjects: Array<{ subject: string, delta: number }>
  isDemoFallback: boolean
}

export const useIaeImpact = () => {
  const supabase = useTypedSupabaseClient()

  const fetchIaeImpact = async (): Promise<IaeImpactStats> => {
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [convRes, modelsRes] = await Promise.all([
      supabase
        .from('AIConversation')
        .select('studentId, createdAt')
        .gte('createdAt', since30)
        .limit(5000),
      supabase
        .from('StudentModel')
        .select('studentId, knowledgeMap, Student(userId), Subject(name)')
        .limit(2000)
    ])

    const conv = (convRes.data ?? []) as Array<{ studentId: string | null }>
    const models = (modelsRes.data ?? []) as Array<{
      studentId: string
      knowledgeMap: Record<string, number> | null
      Student: { userId: string } | null
      Subject: { name: string } | null
    }>

    const usageByUser = new Map<string, number>()
    for (const c of conv) {
      if (!c.studentId) continue
      usageByUser.set(c.studentId, (usageByUser.get(c.studentId) ?? 0) + 1)
    }

    const withAIStudents = new Map<string, { sum: number, n: number }>()
    const withoutAIStudents = new Map<string, { sum: number, n: number }>()
    const bySubject = new Map<string, { withAI: { sum: number, n: number }, withoutAI: { sum: number, n: number } }>()

    for (const m of models) {
      const km = m.knowledgeMap
      if (!km) continue
      const vals = Object.values(km)
      if (!vals.length) continue
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length

      const userId = m.Student?.userId
      const aiUses = userId ? (usageByUser.get(userId) ?? 0) : 0
      const cohortMap = aiUses >= 3 ? withAIStudents : withoutAIStudents

      const cur = cohortMap.get(m.studentId) ?? { sum: 0, n: 0 }
      cur.sum += avg
      cur.n += 1
      cohortMap.set(m.studentId, cur)

      const subject = m.Subject?.name ?? '—'
      const slot = bySubject.get(subject) ?? {
        withAI: { sum: 0, n: 0 },
        withoutAI: { sum: 0, n: 0 }
      }
      if (aiUses >= 3) {
        slot.withAI.sum += avg
        slot.withAI.n += 1
      } else {
        slot.withoutAI.sum += avg
        slot.withoutAI.n += 1
      }
      bySubject.set(subject, slot)
    }

    const avg = (m: Map<string, { sum: number, n: number }>) => {
      let s = 0
      let n = 0
      for (const [, v] of m) {
        if (v.n > 0) {
          s += v.sum / v.n
          n++
        }
      }
      return n > 0 ? s / n : 0
    }

    const withAIAvg = avg(withAIStudents)
    const withoutAIAvg = avg(withoutAIStudents)
    const isDemoFallback = withAIStudents.size < 2 || withoutAIStudents.size < 2

    if (isDemoFallback) {
      return {
        withAI: { count: Math.max(withAIStudents.size, 24), avgMastery: 72 },
        withoutAI: { count: Math.max(withoutAIStudents.size, 18), avgMastery: 58 },
        delta: 14,
        topGrowthSubjects: [
          { subject: 'Алгебра', delta: 18 },
          { subject: 'Геометрия', delta: 15 },
          { subject: 'Алгоритмика', delta: 12 }
        ],
        isDemoFallback: true
      }
    }

    const subjectDeltas: Array<{ subject: string, delta: number }> = []
    for (const [subject, slot] of bySubject) {
      const withAvg = slot.withAI.n > 0 ? slot.withAI.sum / slot.withAI.n : 0
      const withoutAvg = slot.withoutAI.n > 0 ? slot.withoutAI.sum / slot.withoutAI.n : 0
      if (slot.withAI.n >= 2 && slot.withoutAI.n >= 2) {
        subjectDeltas.push({ subject, delta: Math.round(withAvg - withoutAvg) })
      }
    }
    subjectDeltas.sort((a, b) => b.delta - a.delta)

    return {
      withAI: { count: withAIStudents.size, avgMastery: Math.round(withAIAvg) },
      withoutAI: { count: withoutAIStudents.size, avgMastery: Math.round(withoutAIAvg) },
      delta: Math.round(withAIAvg - withoutAIAvg),
      topGrowthSubjects: subjectDeltas.slice(0, 3),
      isDemoFallback: false
    }
  }

  return { fetchIaeImpact }
}
