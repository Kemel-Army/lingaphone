import { useGameProfile } from '~/entities/game-profile'
import { XPActionType } from '~/shared/types/common'

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

  /** Award XP once per unit (idempotent by unit id). Perfect run = bigger reward. */
  const awardUnitXp = (unitId: string, correct: number, total: number) => {
    const action = correct === total ? XPActionType.GRAMMAR_PERFECT : XPActionType.GRAMMAR_COMPLETE
    return awardXP('', action, undefined, `lesson-unit-${unitId}`, `Юнит пройден: ${correct}/${total}`)
  }

  return { checkExercise, awardUnitXp }
}
