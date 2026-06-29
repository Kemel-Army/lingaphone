export const useGradeStudent = () => {
  const supabase = useTypedSupabaseClient()

  // Resolve the current user's Teacher.id from their auth id (authId → User → Teacher).
  // Attendance.markedBy / Grade.gradedBy are FKs to Teacher.id, not User.id.
  const resolveTeacherId = async (authId: string | null): Promise<string | null> => {
    if (!authId) return null
    const { data: uRow } = await supabase
      .from('User').select('id').eq('authId', authId).maybeSingle() as unknown as { data: { id: string } | null }
    if (!uRow) return null
    const { data: tRow } = await supabase
      .from('Teacher').select('id').eq('userId', uRow.id).maybeSingle() as unknown as { data: { id: string } | null }
    return tRow?.id ?? null
  }

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

    // Grade.gradedBy is a FK to Teacher.id (not User.id) — resolve it.
    const gradedBy = await resolveTeacherId(authId)

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

    // Attendance.markedBy is a FK to Teacher.id (not User.id) — resolve it.
    const markedBy = await resolveTeacherId(authId)

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
      } as never)
      .select('id')
      .single()

    if (error) throw error
    return data?.id ?? null
  }

  const awardXp = async (studentId: string, amount: number, reason: string) => {
    // Goes through a server route: a teacher cannot write XpLog /
    // StudentGameProfile directly (RLS), so the endpoint verifies group
    // ownership and runs the canonical award_xp_atomic RPC under service role.
    await $fetch('/api/teacher/award-xp', {
      method: 'POST',
      body: { studentId, amount, reason }
    })
  }

  return {
    gradeSubmission,
    saveGrade,
    markAttendance,
    createHomework,
    awardXp
  }
}
