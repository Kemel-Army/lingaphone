import { useStudent } from '~/entities/student'
import type { Database } from '~/shared/types/database.types'

export const usePractice = () => {
  const supabase = useSupabaseClient<Database>()
  const { studentId, vocabulary, refresh } = useStudent()

  const recordPracticeAttempt = async (
    deckId: string, cardId: string, target: string, transcript: string, score: number
  ) => {
    if (!studentId.value) return
    await supabase.from('PracticeAttempt').insert({
      studentId: studentId.value, deckId, cardId, target, transcript, score
    })
    const amount = score >= 85 ? 5 : score >= 60 ? 3 : 0
    if (amount > 0) {
      await supabase.from('XpLog').insert({
        studentId: studentId.value, action: 'PRACTICE_CARD', amount, refId: cardId
      })
    }
  }

  const recordDeckCompletion = async (deckId: string, avgScore: number) => {
    if (!studentId.value) return
    const amount = avgScore >= 85 ? 50 : avgScore >= 60 ? 25 : 0
    if (amount === 0) return
    const today = new Date().toISOString().slice(0, 10)
    const { data: existing } = await supabase
      .from('XpLog')
      .select('id')
      .eq('studentId', studentId.value)
      .eq('action', 'PRACTICE_DECK')
      .eq('refId', deckId)
      .gte('createdAt', `${today}T00:00:00.000Z`)
      .limit(1)
    if (existing && existing.length > 0) return
    await supabase.from('XpLog').insert({
      studentId: studentId.value, action: 'PRACTICE_DECK', amount, refId: deckId
    })
    await refresh()
  }

  const addToVocabulary = async (
    word: string, ipa: string | null, translation: string, example: string | null
  ) => {
    if (!studentId.value) return
    const alreadySaved = vocabulary.value.some(v => v.word.toLowerCase() === word.toLowerCase())

    await supabase.from('VocabularyEntry').upsert({
      studentId: studentId.value, word, ipa, translation, example
    }, { onConflict: 'studentId,word' })

    if (!alreadySaved) {
      await supabase.from('XpLog').insert({
        studentId: studentId.value, action: 'MANUAL_AWARD', amount: 10, refId: `vocab:${word}`
      })
    }
    await refresh()
  }

  return { recordPracticeAttempt, recordDeckCompletion, addToVocabulary }
}
