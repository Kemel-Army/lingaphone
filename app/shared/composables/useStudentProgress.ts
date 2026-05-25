/**
 * useStudentProgress — pure-data aggregations for /student/progress.
 *
 * Reads Grade + Lesson + PracticeAttempt + VocabularyEntry and derives:
 *  - topic mastery (avg grade per lesson.topic)
 *  - grade timeline (last 90 days, all Grade.value over time)
 *  - daily activity heatmap (PracticeAttempt + Grade count per day, last 12 weeks)
 *  - pronunciation gaps (cards with low best-attempt scores)
 *  - vocabulary distribution (red/yellow/green by bestScore)
 *  - strengths / weaknesses (top-3 / bottom-3 topics)
 *
 * No XP-based computations here — XpLog is mostly empty on Lingafon seed.
 * RLS already restricts each query to the current student via
 * `get_current_student_id()` policies.
 */
import type { Database } from '~/shared/types/database.types'

type GradeRow = Database['public']['Tables']['Grade']['Row']
type LessonRow = Database['public']['Tables']['Lesson']['Row']
type PracticeAttemptRow = Database['public']['Tables']['PracticeAttempt']['Row']
type VocabRow = Database['public']['Tables']['VocabularyEntry']['Row']
type StoryAttemptRow = Database['public']['Tables']['StoryAttempt']['Row']

export interface TopicMastery {
  topic: string
  averageGrade: number
  gradeCount: number
  lastGradedAt: string | null
  /** 0-100 mastery score derived from average grade */
  masteryPct: number
}

export interface ActivityCell {
  date: string
  count: number
  /** 0..4 intensity bucket for color */
  level: 0 | 1 | 2 | 3 | 4
}

export interface PronunciationGap {
  target: string
  cardId: string
  attempts: number
  bestScore: number
  averageScore: number
  lastAttemptedAt: string
}

export interface VocabularyBuckets {
  total: number
  mastered: number // bestScore >= 85
  learning: number // 60-84
  weak: number // < 60
  averageBestScore: number
}

export interface StoryStats {
  totalAttempts: number
  uniqueStories: number
  averageScore: number
  bestScore: number
  perStory: Array<{
    storyId: string
    storyTitle: string
    storyLevel: string
    attempts: number
    bestScore: number
    averageScore: number
    lastAttemptedAt: string
  }>
}

export const useStudentProgress = () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const { data, refresh, pending } = useAsyncData(
    'student-progress-bundle',
    async () => {
      if (!user.value) return null

      const [gradesRes, lessonsRes, attemptsRes, vocabRes, storiesRes] = await Promise.all([
        supabase
          .from('Grade')
          .select('studentId, lessonId, value, comment, gradedAt')
          .order('gradedAt', { ascending: true }),
        supabase
          .from('Lesson')
          .select('id, topic, groupId, startsAt'),
        supabase
          .from('PracticeAttempt')
          .select('cardId, target, score, attemptedAt')
          .order('attemptedAt', { ascending: false }),
        supabase
          .from('VocabularyEntry')
          .select('word, bestScore, reviewCount, addedAt'),
        supabase
          .from('StoryAttempt')
          .select('storyId, storyTitle, storyLevel, comprehensionScore, keyPointsCovered, keyPointsTotal, attemptedAt')
          .order('attemptedAt', { ascending: false })
      ])

      return {
        grades: (gradesRes.data ?? []) as Pick<GradeRow, 'studentId' | 'lessonId' | 'value' | 'comment' | 'gradedAt'>[],
        lessons: (lessonsRes.data ?? []) as Pick<LessonRow, 'id' | 'topic' | 'groupId' | 'startsAt'>[],
        attempts: (attemptsRes.data ?? []) as Pick<PracticeAttemptRow, 'cardId' | 'target' | 'score' | 'attemptedAt'>[],
        vocab: (vocabRes.data ?? []) as Pick<VocabRow, 'word' | 'bestScore' | 'reviewCount' | 'addedAt'>[],
        stories: (storiesRes.data ?? []) as Pick<StoryAttemptRow, 'storyId' | 'storyTitle' | 'storyLevel' | 'comprehensionScore' | 'keyPointsCovered' | 'keyPointsTotal' | 'attemptedAt'>[]
      }
    },
    { server: false, default: () => null, watch: [user] }
  )

  // ─── Topic mastery ───────────────────────────────────────────────────
  const topicMastery = computed<TopicMastery[]>(() => {
    if (!data.value) return []
    const lessonById = new Map(data.value.lessons.map(l => [l.id, l]))
    const buckets = new Map<string, { sum: number, count: number, last: string }>()
    for (const g of data.value.grades) {
      const lesson = lessonById.get(g.lessonId)
      if (!lesson?.topic) continue
      const b = buckets.get(lesson.topic) ?? { sum: 0, count: 0, last: g.gradedAt }
      b.sum += g.value
      b.count += 1
      if (g.gradedAt > b.last) b.last = g.gradedAt
      buckets.set(lesson.topic, b)
    }
    return Array.from(buckets.entries()).map(([topic, b]) => {
      const avg = b.sum / b.count
      return {
        topic,
        averageGrade: avg,
        gradeCount: b.count,
        lastGradedAt: b.last,
        masteryPct: Math.round((avg / 5) * 100)
      }
    }).sort((a, b) => a.averageGrade - b.averageGrade)
  })

  const strengths = computed<TopicMastery[]>(() =>
    [...topicMastery.value].sort((a, b) => b.averageGrade - a.averageGrade).slice(0, 3)
  )
  const weaknesses = computed<TopicMastery[]>(() =>
    topicMastery.value.slice(0, 3)
  )

  // ─── Grade timeline (line chart data) ────────────────────────────────
  const gradeTimeline = computed(() => {
    if (!data.value) return { labels: [], values: [] }
    const last90 = data.value.grades.filter(g =>
      new Date(g.gradedAt).getTime() > Date.now() - 90 * 86400000
    )
    return {
      labels: last90.map(g => g.gradedAt.slice(0, 10)),
      values: last90.map(g => g.value)
    }
  })

  // ─── Activity heatmap (last 12 weeks, GitHub-style) ──────────────────
  const activityCalendar = computed<ActivityCell[]>(() => {
    if (!data.value) return []
    const dayCounts = new Map<string, number>()
    for (const a of data.value.attempts) {
      const day = a.attemptedAt.slice(0, 10)
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1)
    }
    for (const g of data.value.grades) {
      const day = g.gradedAt.slice(0, 10)
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1)
    }
    for (const s of data.value.stories) {
      const day = s.attemptedAt.slice(0, 10)
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1)
    }

    const cells: ActivityCell[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days = 12 * 7
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const count = dayCounts.get(key) ?? 0
      let level: ActivityCell['level'] = 0
      if (count >= 8) level = 4
      else if (count >= 5) level = 3
      else if (count >= 3) level = 2
      else if (count >= 1) level = 1
      cells.push({ date: key, count, level })
    }
    return cells
  })

  // ─── Pronunciation gaps — cards with low average score ───────────────
  const pronunciationGaps = computed<PronunciationGap[]>(() => {
    if (!data.value) return []
    type Agg = { target: string, attempts: number, sum: number, best: number, last: string }
    const byCard = new Map<string, Agg>()
    for (const a of data.value.attempts) {
      const cur = byCard.get(a.cardId)
      if (!cur) {
        byCard.set(a.cardId, {
          target: a.target,
          attempts: 1,
          sum: a.score,
          best: a.score,
          last: a.attemptedAt
        })
      } else {
        cur.attempts += 1
        cur.sum += a.score
        cur.best = Math.max(cur.best, a.score)
        if (a.attemptedAt > cur.last) cur.last = a.attemptedAt
      }
    }
    return Array.from(byCard.entries())
      .map(([cardId, a]) => ({
        cardId,
        target: a.target,
        attempts: a.attempts,
        bestScore: a.best,
        averageScore: Math.round(a.sum / a.attempts),
        lastAttemptedAt: a.last
      }))
      .filter(p => p.averageScore < 85)
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 10)
  })

  // ─── Vocabulary distribution ─────────────────────────────────────────
  const vocabularyBuckets = computed<VocabularyBuckets>(() => {
    if (!data.value || data.value.vocab.length === 0) {
      return { total: 0, mastered: 0, learning: 0, weak: 0, averageBestScore: 0 }
    }
    let mastered = 0, learning = 0, weak = 0, sum = 0
    for (const v of data.value.vocab) {
      sum += v.bestScore
      if (v.bestScore >= 85) mastered++
      else if (v.bestScore >= 60) learning++
      else weak++
    }
    return {
      total: data.value.vocab.length,
      mastered,
      learning,
      weak,
      averageBestScore: Math.round(sum / data.value.vocab.length)
    }
  })

  // ─── Summary KPIs ────────────────────────────────────────────────────
  const summary = computed(() => {
    if (!data.value) {
      return { overallAverage: 0, totalLessons: 0, totalPractice: 0, bestMonthAverage: 0 }
    }
    const grades = data.value.grades
    const overallAverage = grades.length > 0
      ? grades.reduce((s, g) => s + g.value, 0) / grades.length
      : 0

    const byMonth = new Map<string, { sum: number, count: number }>()
    for (const g of grades) {
      const m = g.gradedAt.slice(0, 7)
      const b = byMonth.get(m) ?? { sum: 0, count: 0 }
      b.sum += g.value
      b.count += 1
      byMonth.set(m, b)
    }
    let bestMonthAverage = 0
    for (const b of byMonth.values()) {
      const avg = b.sum / b.count
      if (avg > bestMonthAverage) bestMonthAverage = avg
    }

    return {
      overallAverage,
      totalLessons: data.value.lessons.length,
      totalPractice: data.value.attempts.length,
      bestMonthAverage
    }
  })

  // ─── 30-day grade trend (improving / declining / steady) ─────────────
  const gradeTrend = computed<'up' | 'down' | 'steady' | 'none'>(() => {
    if (!data.value || data.value.grades.length < 4) return 'none'
    const now = Date.now()
    const recent = data.value.grades.filter(g => new Date(g.gradedAt).getTime() > now - 30 * 86400000)
    const older = data.value.grades.filter((g) => {
      const t = new Date(g.gradedAt).getTime()
      return t > now - 60 * 86400000 && t <= now - 30 * 86400000
    })
    if (recent.length < 2 || older.length < 2) return 'none'
    const recentAvg = recent.reduce((s, g) => s + g.value, 0) / recent.length
    const olderAvg = older.reduce((s, g) => s + g.value, 0) / older.length
    const diff = recentAvg - olderAvg
    if (diff > 0.2) return 'up'
    if (diff < -0.2) return 'down'
    return 'steady'
  })

  // ─── Story retelling stats ──────────────────────────────────────────
  const storyStats = computed<StoryStats>(() => {
    if (!data.value || data.value.stories.length === 0) {
      return { totalAttempts: 0, uniqueStories: 0, averageScore: 0, bestScore: 0, perStory: [] }
    }
    type Agg = {
      storyTitle: string
      storyLevel: string
      attempts: number
      sumScore: number
      bestScore: number
      lastAttemptedAt: string
    }
    const byStory = new Map<string, Agg>()
    let sumAll = 0
    let bestAll = 0
    for (const s of data.value.stories) {
      sumAll += s.comprehensionScore
      bestAll = Math.max(bestAll, s.comprehensionScore)
      const cur = byStory.get(s.storyId)
      if (!cur) {
        byStory.set(s.storyId, {
          storyTitle: s.storyTitle,
          storyLevel: s.storyLevel,
          attempts: 1,
          sumScore: s.comprehensionScore,
          bestScore: s.comprehensionScore,
          lastAttemptedAt: s.attemptedAt
        })
      } else {
        cur.attempts++
        cur.sumScore += s.comprehensionScore
        cur.bestScore = Math.max(cur.bestScore, s.comprehensionScore)
        if (s.attemptedAt > cur.lastAttemptedAt) cur.lastAttemptedAt = s.attemptedAt
      }
    }
    return {
      totalAttempts: data.value.stories.length,
      uniqueStories: byStory.size,
      averageScore: Math.round(sumAll / data.value.stories.length),
      bestScore: bestAll,
      perStory: Array.from(byStory.entries()).map(([storyId, a]) => ({
        storyId,
        storyTitle: a.storyTitle,
        storyLevel: a.storyLevel,
        attempts: a.attempts,
        bestScore: a.bestScore,
        averageScore: Math.round(a.sumScore / a.attempts),
        lastAttemptedAt: a.lastAttemptedAt
      })).sort((a, b) => b.bestScore - a.bestScore)
    }
  })

  return {
    pending,
    refresh,
    summary,
    topicMastery,
    strengths,
    weaknesses,
    gradeTimeline,
    activityCalendar,
    pronunciationGaps,
    vocabularyBuckets,
    gradeTrend,
    storyStats
  }
}
