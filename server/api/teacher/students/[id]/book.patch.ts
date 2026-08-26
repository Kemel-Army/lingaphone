/**
 * PATCH /api/teacher/students/[id]/book  (TEACHER)
 *
 * Sets or clears a per-student book override (StudentBook), taking
 * priority over the student's group's default book on «Мой путь».
 * bookId: null removes the override (student falls back to the group book).
 * Scoped to students in one of the requesting teacher's own groups.
 */
export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['TEACHER'])
  const supabase = useServerSupabase(event)

  const studentId = getRouterParam(event, 'id')
  if (!studentId) throw createError({ statusCode: 400, message: 'id обязателен' })

  const body = await readBody<{ bookId?: string | null }>(event)
  if (body?.bookId !== null && typeof body?.bookId !== 'string') {
    throw createError({ statusCode: 400, message: 'bookId (string | null) обязателен' })
  }

  const authId = (user.sub as string | undefined) ?? user.id
  const { data: userRow } = await supabase
    .from('User').select('id').eq('authId', authId).maybeSingle() as unknown as
    { data: { id: string } | null }
  if (!userRow) throw createError({ statusCode: 403, message: 'User not found' })

  const { data: teacherRow } = await supabase
    .from('Teacher').select('id').eq('userId', userRow.id).maybeSingle() as unknown as
    { data: { id: string } | null }
  if (!teacherRow) throw createError({ statusCode: 403, message: 'Teacher profile not found' })

  // Verify this student is in one of the teacher's own active groups.
  const { data: membership } = await supabase
    .from('GroupMember')
    .select('studentId, Group!groupId ( teacherId )')
    .eq('studentId', studentId)
    .eq('status', 'ACTIVE') as unknown as
    { data: Array<{ studentId: string, Group: { teacherId: string } | { teacherId: string }[] | null }> | null }

  const ownsStudent = (membership ?? []).some((m) => {
    const g = Array.isArray(m.Group) ? m.Group[0] : m.Group
    return g?.teacherId === teacherRow.id
  })
  if (!ownsStudent) throw createError({ statusCode: 403, message: 'Нет доступа к этому ученику' })

  if (!body.bookId) {
    const { error } = await supabase.from('StudentBook').delete().eq('studentId', studentId)
    if (error) throw createError({ statusCode: 500, message: error.message })
    return { ok: true }
  }

  const { data: book } = await supabase
    .from('Book').select('id').eq('id', body.bookId).eq('isPublished', true).maybeSingle() as unknown as
    { data: { id: string } | null }
  if (!book) throw createError({ statusCode: 400, message: 'Книга не найдена или не опубликована' })

  const { error } = await supabase
    .from('StudentBook')
    .upsert({ studentId, bookId: body.bookId, assignedByTeacherId: teacherRow.id }, { onConflict: 'studentId' })
  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true }
})
