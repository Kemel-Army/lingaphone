import type { Database } from '~/shared/types/database.types'
import { GAME_LEVELS, type GameLevel, type GameQuestion } from '~/shared/mock'

type GameAttemptRow = Database['public']['Tables']['GameAttempt']['Row']

export interface LevelProgress {
  levelId: string
  attempts: number
  bestScore: number
  passed: boolean
  lastAttemptedAt: string | null
}

const PASS_THRESHOLD = 80

const sample = <T>(arr: readonly T[], n: number): T[] => {
  const copy = arr.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = copy[i]!
    copy[i] = copy[j]!
    copy[j] = tmp
  }
  return copy.slice(0, Math.min(n, copy.length))
}

export const useGameLevels = () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const levels = computed<GameLevel[]>(() =>
    [...GAME_LEVELS].sort((a, b) => a.order - b.order)
  )

  const { data: attemptsData, refresh } = useAsyncData(
    'game-attempts-bundle',
    async () => {
      if (!user.value) return [] as GameAttemptRow[]
      const { data, error } = await supabase
        .from('GameAttempt')
        .select('*')
        .order('attemptedAt', { ascending: false })
      if (error) {
        console.error('[useGameLevels] fetch attempts failed', error)
        return [] as GameAttemptRow[]
      }
      return (data ?? []) as GameAttemptRow[]
    },
    { server: false, default: () => [] as GameAttemptRow[], watch: [user] }
  )

  const progress = computed<Map<string, LevelProgress>>(() => {
    const map = new Map<string, LevelProgress>()
    for (const a of attemptsData.value ?? []) {
      const cur = map.get(a.levelId)
      if (!cur) {
        map.set(a.levelId, {
          levelId: a.levelId,
          attempts: 1,
          bestScore: a.scorePct,
          passed: a.passed,
          lastAttemptedAt: a.attemptedAt
        })
      } else {
        cur.attempts++
        cur.bestScore = Math.max(cur.bestScore, a.scorePct)
        cur.passed = cur.passed || a.passed
        if (a.attemptedAt > (cur.lastAttemptedAt ?? '')) cur.lastAttemptedAt = a.attemptedAt
      }
    }
    return map
  })

  const isUnlocked = (levelId: string): boolean => {
    const sorted = levels.value
    const idx = sorted.findIndex(l => l.id === levelId)
    if (idx <= 0) return idx === 0
    const prev = sorted[idx - 1]!
    return progress.value.get(prev.id)?.passed ?? false
  }

  const levelPath = computed(() =>
    levels.value.map((l, idx) => {
      const p = progress.value.get(l.id)
      const prevPassed = idx === 0 || (progress.value.get(levels.value[idx - 1]!.id)?.passed ?? false)
      return {
        ...l,
        attempts: p?.attempts ?? 0,
        bestScore: p?.bestScore ?? 0,
        passed: p?.passed ?? false,
        unlocked: prevPassed,
        lastAttemptedAt: p?.lastAttemptedAt ?? null
      }
    })
  )

  const sampleQuestions = (level: GameLevel): GameQuestion[] =>
    sample(level.questions, level.questionsPerAttempt)

  const resolveStudentId = async (): Promise<string | null> => {
    if (!user.value) return null
    const { data } = await supabase.from('Student').select('id').single()
    return data?.id ?? null
  }

  interface AnswerRecord {
    questionId: string
    format: GameQuestion['format']
    given: string
    correct: boolean
  }

  const recordAttempt = async (
    level: GameLevel,
    questionsAsked: GameQuestion[],
    answers: AnswerRecord[]
  ): Promise<{ ok: boolean, passed: boolean, xpAwarded: number, scorePct: number }> => {
    const studentId = await resolveStudentId()
    if (!studentId) return { ok: false, passed: false, xpAwarded: 0, scorePct: 0 }

    const correctCount = answers.filter(a => a.correct).length
    const totalCount = answers.length
    const scorePct = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100)
    const passed = scorePct >= PASS_THRESHOLD

    const { error: insertError } = await supabase.from('GameAttempt').insert({
      studentId,
      levelId: level.id,
      levelTitle: level.title,
      levelOrder: level.order,
      questionsAsked: questionsAsked.map(q => ({ id: q.id, format: q.format })),
      answersGiven: answers,
      correctCount,
      totalCount,
      scorePct,
      passed
    })

    if (insertError) {
      console.error('[useGameLevels] attempt insert failed', insertError)
      return { ok: false, passed, xpAwarded: 0, scorePct }
    }

    let xpAwarded = 0
    if (passed) {
      const alreadyPassed = (attemptsData.value ?? []).some(a => a.levelId === level.id && a.passed)
      if (!alreadyPassed) {
        xpAwarded = level.xpReward + (scorePct === 100 ? level.perfectBonusXp : 0)
        const { error: xpError } = await supabase.from('XpLog').insert({
          studentId,
          action: 'GAME_LEVEL',
          amount: xpAwarded,
          refId: level.id
        })
        if (xpError) console.error('[useGameLevels] XP insert failed', xpError)
      }
    }

    await refresh()
    return { ok: true, passed, xpAwarded, scorePct }
  }

  return {
    PASS_THRESHOLD,
    levels,
    progress,
    levelPath,
    isUnlocked,
    sampleQuestions,
    recordAttempt,
    refresh
  }
}
