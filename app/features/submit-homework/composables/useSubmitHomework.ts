import { useStudent } from '~/entities/student'
import type { Database, Json } from '~/shared/types/database.types'

export const useSubmitHomework = () => {
  const supabase = useSupabaseClient<Database>()
  const { studentId, refresh } = useStudent()

  const submitHomework = async (homeworkId: string, answers: Json, aiScore?: number) => {
    if (!studentId.value) return null

    const [{ data: existing }, { data: hw }] = await Promise.all([
      supabase
        .from('HomeworkSubmission')
        .select('id')
        .eq('homeworkId', homeworkId)
        .eq('studentId', studentId.value)
        .limit(1),
      supabase
        .from('Homework')
        .select('dueAt')
        .eq('id', homeworkId)
        .single()
    ])

    const previouslySubmitted = !!(existing && existing.length > 0)

    const { data: result, error } = await supabase
      .from('HomeworkSubmission')
      .upsert({
        homeworkId,
        studentId: studentId.value,
        answers,
        aiScore: aiScore ?? null,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString()
      }, { onConflict: 'homeworkId,studentId' })
      .select()
      .single()

    if (!error && !previouslySubmitted && hw) {
      const onTime = new Date(hw.dueAt).getTime() > Date.now()
      await supabase.from('XpLog').insert({
        studentId: studentId.value,
        action: 'HOMEWORK_ONTIME',
        amount: onTime ? 50 : 25,
        refId: homeworkId
      })
    }

    if (!error) await refresh()
    return result
  }

  return { submitHomework }
}
