/**
 * FEMO Battle utilities — PIN generation, scoring.
 */

const PIN_LENGTH = 6

/**
 * Generate a random 6-digit PIN. Caller must verify uniqueness against active sessions.
 */
export const generatePin = (): string => {
  let pin = ''
  for (let i = 0; i < PIN_LENGTH; i++) {
    pin += Math.floor(Math.random() * 10).toString()
  }
  return pin
}

/**
 * Calculate points awarded for an answer.
 * Correct: 500 base + 500 * (timeLeft / totalTime). Max ≈ 1000, min 500.
 * Incorrect: 0.
 */
export const calculatePoints = (
  isCorrect: boolean,
  responseTimeMs: number,
  totalTimeMs: number
): number => {
  if (!isCorrect) return 0
  const ratio = Math.max(0, Math.min(1, 1 - responseTimeMs / totalTimeMs))
  return Math.round(500 + 500 * ratio)
}
