/**
 * PATCH /api/teacher/groups/[id]/book  (TEACHER)
 *
 * Sets or clears the group's default book. Students in the group without
 * a personal StudentBook override inherit this book on «Мой путь»
 * (see server/api/student/my-path.get.ts). bookId: null clears it.
 */
export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['TEACHER'])
  const supabase = useServerSupabase(event)

  const groupId = getRouterParam(event, 'id')
  if (!groupId) throw createError({ statusCode: 400, message: 'id обязателен' })

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

  const { data: group } = await supabase
    .from('Group').select('id').eq('id', groupId).eq('teacherId', teacherRow.id).maybeSingle() as unknown as
    { data: { id: string } | null }
  if (!group) throw createError({ statusCode: 403, message: 'Нет доступа к этой группе' })

  if (body.bookId) {
    const { data: book } = await supabase
      .from('Book').select('id').eq('id', body.bookId).eq('isPublished', true).maybeSingle() as unknown as
      { data: { id: string } | null }
    if (!book) throw createError({ statusCode: 400, message: 'Книга не найдена или не опубликована' })
  }

  const { error } = await supabase
    .from('Group')
    .update({ bookId: body.bookId })
    .eq('id', groupId)
  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true }
})
