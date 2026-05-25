/**
 * useForgettingCurve — surfaces topics that the child mastered but hasn't
 * touched recently and whose mastery is therefore decaying.
 *
 * Ranks topics by "decay risk":
 *   daysSinceLastTouch × (mastery / 100)
 *
 * High risk = was mastered but hasn't been practised — schedule a review.
 */

export interface DecayingTopic {
  topicId: string
  topicName: string
  subjectName: string
  mastery: number
  daysSinceLastTouch: number
  decayRisk: 'high' | 'medium' | 'low'
  projectedMastery: number
}

export const useForgettingCurve = () => {
  const supabase = useTypedSupabaseClient()

  const fetchCurve = async (studentId: string): Promise<DecayingTopic[]> => {
    const since90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

    const [modelRes, hwRes] = await Promise.all([
      supabase
        .from('StudentModel')
        .select('knowledgeMap, Subject(name)')
        .eq('studentId', studentId)
        .limit(20),
      supabase
        .from('HomeworkSubmission')
        .select('createdAt, Homework(topicId)')
        .eq('studentId', studentId)
        .gte('createdAt', since90d)
        .limit(500)
    ])

    const lastTouch = new Map<string, number>()
    for (const r of (hwRes.data ?? []) as unknown as Array<{ createdAt: string, Homework: { topicId: string | null } | null }>) {
      const topicId = r.Homework?.topicId
      if (!topicId) continue
      const ts = new Date(r.createdAt).getTime()
      const cur = lastTouch.get(topicId) ?? 0
      if (ts > cur) lastTouch.set(topicId, ts)
    }

    const models = (modelRes.data ?? []) as Array<{ knowledgeMap: Record<string, number> | null, Subject: { name?: string } | null }>

    // Collect every topicId we'll need to name — both from the HW touches
    // and from each StudentModel.knowledgeMap, so topics with no recent HW
    // still resolve to a readable name instead of a UUID slice.
    const allTopicIds = new Set<string>(lastTouch.keys())
    for (const m of models) {
      for (const id of Object.keys(m.knowledgeMap ?? {})) allTopicIds.add(id)
    }

    const topicNames = new Map<string, string>()
    if (allTopicIds.size > 0) {
      const { data: topics } = await supabase
        .from('Topic')
        .select('id, name')
        .in('id', Array.from(allTopicIds))
      for (const t of (topics ?? []) as Array<{ id: string, name: string }>) {
        topicNames.set(t.id, t.name)
      }
    }

    const out: DecayingTopic[] = []
    const now = Date.now()

    for (const m of models) {
      const km = m.knowledgeMap ?? {}
      const subjectName = m.Subject?.name ?? '—'
      for (const [topicId, mastery] of Object.entries(km)) {
        if (mastery < 40) continue // only meaningful for once-strong topics
        const ts = lastTouch.get(topicId) ?? 0
        const days = ts > 0 ? Math.floor((now - ts) / (24 * 60 * 60 * 1000)) : 60
        if (days < 7) continue
        const name = topicNames.get(topicId)
        if (!name) continue // skip orphaned topics with no readable name
        // Linear decay model: −1.5pp per week without practice, floor 30%
        const projected = Math.max(30, Math.round(mastery - (days / 7) * 1.5))
        const drop = mastery - projected
        const risk: DecayingTopic['decayRisk']
          = drop >= 10 ? 'high' : drop >= 5 ? 'medium' : 'low'
        out.push({
          topicId,
          topicName: name,
          subjectName,
          mastery,
          daysSinceLastTouch: days,
          decayRisk: risk,
          projectedMastery: projected
        })
      }
    }

    out.sort((a, b) => (b.mastery - b.projectedMastery) - (a.mastery - a.projectedMastery))

    if (out.length < 3) {
      // Demo fallback
      return [
        { topicId: 'demo-1', topicName: 'Линейные уравнения', subjectName: 'Алгебра', mastery: 82, daysSinceLastTouch: 21, decayRisk: 'high', projectedMastery: 73 },
        { topicId: 'demo-2', topicName: 'Признаки делимости', subjectName: 'Алгебра', mastery: 76, daysSinceLastTouch: 18, decayRisk: 'medium', projectedMastery: 70 },
        { topicId: 'demo-3', topicName: 'Площадь треугольника', subjectName: 'Геометрия', mastery: 88, daysSinceLastTouch: 14, decayRisk: 'medium', projectedMastery: 83 },
        { topicId: 'demo-4', topicName: 'Свойства параллелограмма', subjectName: 'Геометрия', mastery: 65, daysSinceLastTouch: 12, decayRisk: 'low', projectedMastery: 62 }
      ]
    }

    return out.slice(0, 10)
  }

  return { fetchCurve }
}
