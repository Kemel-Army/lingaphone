/**
 * Student-side action: submit one exercise answer and get an instant verdict.
 * The server (service role) is the only place the answer meets the key.
 */
export interface CheckResult {
  isCorrect: boolean | null
  score: number | null
  feedback: string
  correctAnswer?: string
}

export const useBookExercises = () => {
  const checkAnswer = (
    exerciseId: string,
    response: Record<string, unknown>,
    audioUrl?: string
  ): Promise<CheckResult> =>
    $fetch<CheckResult>('/api/book/check-answer', {
      method: 'POST',
      body: { exerciseId, response, audioUrl }
    })

  return { checkAnswer }
}
