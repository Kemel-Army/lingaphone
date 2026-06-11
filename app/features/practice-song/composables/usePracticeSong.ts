import { useSongProgress } from '~/entities/song'

export interface GapResult {
  lineIndex: number
  userAnswer: string
  correctAnswer: string
  correct: boolean
}

export const usePracticeSong = () => {
  const { upsertProgress } = useSongProgress()

  const checkGap = (userAnswer: string, correctAnswers: string[]): boolean => {
    const norm = (s: string) => s.trim().toLowerCase()
    return correctAnswers.some(a => norm(userAnswer) === norm(a))
  }

  const submitSong = async (
    songId: string,
    results: GapResult[]
  ): Promise<{
    xpEarned: number
    score: number
    maxScore: number
    isPerfect: boolean
    levelUp: boolean
  }> => {
    const correct = results.filter(r => r.correct).length
    const score = correct * 10
    const maxScore = results.length * 10
    const isPerfect = results.length > 0 && results.every(r => r.correct)

    const xpAction = isPerfect ? 'SONG_PERFECT' : 'SONG_COMPLETE'
    const res = await $fetch<{ xp: number, level: number, levelUp: boolean }>(
      '/api/gamification/award-xp',
      { method: 'POST', body: { action: xpAction, sourceId: songId } }
    )

    await upsertProgress(songId, score, maxScore, res.xp)

    return { xpEarned: res.xp, score, maxScore, isPerfect, levelUp: res.levelUp }
  }

  return { checkGap, submitSong }
}
