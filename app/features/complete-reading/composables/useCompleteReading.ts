import { useReadingProgress } from '~/entities/reading'
import type { ReadingQuestion } from '~/entities/reading'

export interface QuestionAnswer {
  questionId: string
  userAnswer: string
  correct: boolean
  points: number
  prompt: string
  correctAnswer: string
}

export const useCompleteReading = () => {
  const { upsertProgress } = useReadingProgress()

  const checkAnswer = (question: ReadingQuestion, userAnswer: string): boolean => {
    if (question.type === 'OPEN') return true
    const norm = (s: string) => s.trim().toLowerCase()
    return norm(userAnswer) === norm(question.answer)
  }

  const submitReading = async (
    textId: string,
    answers: QuestionAnswer[]
  ): Promise<{
    xpEarned: number
    score: number
    maxScore: number
    isPerfect: boolean
    levelUp: boolean
  }> => {
    const score = answers.reduce((sum, a) => sum + (a.correct ? a.points : 0), 0)
    const maxScore = answers.reduce((sum, a) => sum + a.points, 0)
    const isPerfect = answers.length > 0 && answers.every(a => a.correct)

    const xpAction = isPerfect ? 'READING_PERFECT' : 'READING_COMPLETE'
    const res = await $fetch<{ xp: number, level: number, levelUp: boolean }>(
      '/api/gamification/award-xp',
      { method: 'POST', body: { action: xpAction, sourceId: textId } }
    )

    await upsertProgress(textId, score, maxScore, res.xp)

    return { xpEarned: res.xp, score, maxScore, isPerfect, levelUp: res.levelUp }
  }

  return { checkAnswer, submitReading }
}
