export const useGradeStudent = () => {
  const supabase = useTypedSupabaseClient()

  const gradeSubmission = async (
    submissionId: string,
    grade: number,
    comment: string
  ) => {
    const { error } = await supabase
      .from('HomeworkSubmission')
      .update({
        teacherGrade: grade,
        teacherComment: comment || null,
        status: 'CHECKED',
        checkedAt: new Date().toISOString()
      })
      .eq('id', submissionId)

    if (error) throw error
  }

  const saveGrade = async (
    lessonId: string,
    studentId: string,
    value: number,
    comment?: string
  ) => {
    const user = useSupabaseUser()
    const authId = user.value?.sub ?? null

    let gradedBy: string | null = null
    if (authId) {
      const { data: uRow } = await supabase
        .from('User')
        .select('id')
        .eq('authId', authId)
        .maybeSingle() as unknown as { data: { id: string } | null }
      gradedBy = uRow?.id ?? null
    }

    const { error } = await supabase
      .from('Grade')
      .upsert(
        {
          lessonId,
          studentId,
          value,
          comment: comment || null,
          gradedBy,
          gradedAt: new Date().toISOString()
        },
        { onConflict: 'lessonId,studentId' }
      )

    if (error) throw error
  }

  const markAttendance = async (
    lessonId: string,
    studentId: string,
    status: 'PRESENT' | 'ABSENT' | 'LATE'
  ) => {
    const user = useSupabaseUser()
    const authId = user.value?.sub ?? null

    let markedBy: string | null = null
    if (authId) {
      const { data: uRow } = await supabase
        .from('User')
        .select('id')
        .eq('authId', authId)
        .maybeSingle() as unknown as { data: { id: string } | null }
      markedBy = uRow?.id ?? null
    }

    const { error } = await supabase
      .from('Attendance')
      .upsert(
        {
          lessonId,
          studentId,
          status,
          markedBy,
          markedAt: new Date().toISOString()
        },
        { onConflict: 'lessonId,studentId' }
      )

    if (error) throw error
  }

  const createHomework = async (payload: {
    lessonId: string
    format: string
    title: string
    description?: string
    dueAt: string
    maxScore?: number
    questions?: { question: string, options: string[], answer: number }[]
    prompt?: string
  }) => {
    const hwPayload: Record<string, unknown> = {}

    if (payload.format === 'TEST' && payload.questions) {
      hwPayload.questions = payload.questions
    } else if (payload.prompt) {
      hwPayload.prompt = payload.prompt
    }

    const { data, error } = await supabase
      .from('Homework')
      .insert({
        lessonId: payload.lessonId,
        format: payload.format as 'TEST' | 'INPUT' | 'TEXT' | 'ORAL' | 'FILE' | 'INTERACTIVE',
        title: payload.title,
        description: payload.description || null,
        dueAt: payload.dueAt,
        maxScore: payload.maxScore ?? 10,
        payload: hwPayload
      })
      .select('id')
      .single()

    if (error) throw error
    return data?.id ?? null
  }

  const awardXp = async (studentId: string, amount: number, reason: string) => {
    const { data: st } = await supabase
      .from('Student')
      .select('totalXp')
      .eq('id', studentId)
      .maybeSingle() as unknown as { data: { totalXp: number } | null }

    const { error } = await supabase
      .from('Student')
      .update({ totalXp: (st?.totalXp ?? 0) + amount })
      .eq('id', studentId)
    if (error) throw error

    await supabase.from('XpLog').insert({
      studentId,
      amount,
      action: 'LESSON_ATTENDED',
      description: reason,
      earnedAt: new Date().toISOString()
    })
  }

  const awardMedal = async (studentId: string, title: string) => {
    const now = new Date()
    const { error } = await supabase
      .from('Medal')
      .insert({
        studentId,
        title,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        awardedAt: now.toISOString()
      })
    if (error) throw error
  }

  return {
    gradeSubmission,
    saveGrade,
    markAttendance,
    createHomework,
    awardXp,
    awardMedal
  }
}
