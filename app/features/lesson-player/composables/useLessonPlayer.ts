import { useGameProfile } from '~/entities/game-profile'
import { XPActionType } from '~/shared/types/common'
import type { BlockTestResult } from '~/entities/book'

export interface ExerciseCheckResult {
  isCorrect: boolean
  score: number
  explanation: string
  reveal: Record<string, unknown>
}

/**
 * Student actions for the native lesson player: check one exercise on the
 * server (deterministic, no AI) and award XP when a unit is finished.
 */
export const useLessonPlayer = () => {
  const { awardXP } = useGameProfile()

  const checkExercise = (exerciseId: string, response: Record<string, unknown>) =>
    $fetch<ExerciseCheckResult>('/api/book/check-exercise', {
      method: 'POST',
      body: { exerciseId, response }
    })

  /**
   * Finalize a block test — aggregates the already-checked answers into a
   * block score, applies the pass threshold, and (on pass) unlocks the next
   * block. The gate + scoring live server-side in /api/book/submit-block-test.
   */
  const submitBlockTest = (testUnitId: string) =>
    $fetch<BlockTestResult>('/api/book/submit-block-test', {
      method: 'POST',
      body: { testUnitId }
    })

  /** Award XP once per unit (idempotent by unit id). Perfect run = bigger reward. */
  const awardUnitXp = (unitId: string, correct: number, total: number) => {
    const action = correct === total ? XPActionType.GRAMMAR_PERFECT : XPActionType.GRAMMAR_COMPLETE
    return awardXP('', action, undefined, `lesson-unit-${unitId}`, `Юнит пройден: ${correct}/${total}`)
  }

  return { checkExercise, submitBlockTest, awardUnitXp }
}
