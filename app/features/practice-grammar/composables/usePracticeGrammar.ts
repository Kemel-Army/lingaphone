import { useGrammarProgress } from '~/entities/grammar'

export interface ExerciseResult {
  exerciseId: string
  correct: boolean
  hintUsed: boolean
  userAnswer: string
  correctAnswer: string
  prompt: string
}

export const usePracticeGrammar = () => {
  const { upsertProgress } = useGrammarProgress()

  const submitSession = async (
    topicId: string,
    results: ExerciseResult[],
    maxPossibleScore: number
  ): Promise<{
    xpEarned: number
    newMastery: number
    levelUp: boolean
    isPerfect: boolean
  }> => {
    const score = results.filter(r => r.correct).length * 10
    const isPerfect = results.length > 0 && results.every(r => r.correct)

    // Update progress in DB
    const progress = await upsertProgress(topicId, score, maxPossibleScore)

    // Award XP via server
    const xpAction = isPerfect ? 'GRAMMAR_PERFECT' : 'GRAMMAR_COMPLETE'
    const res = await $fetch<{ xp: number, level: number, levelUp: boolean }>(
      '/api/gamification/award-xp',
      { method: 'POST', body: { action: xpAction, sourceId: topicId } }
    )

    return {
      xpEarned: res.xp,
      newMastery: progress.mastery,
      levelUp: res.levelUp,
      isPerfect
    }
  }

  return { submitSession }
}
