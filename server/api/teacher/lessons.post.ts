export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['TEACHER'])
  const supabase = useServerSupabase(event)

  const body = await readBody(event)
  const { groupId, topic, startsAt, durationMin, meetingUrl } = body

  if (!groupId || !topic?.trim() || !startsAt) {
    throw createError({ statusCode: 400, message: 'groupId, topic и startsAt обязательны' })
  }

  const authId = (user.sub as string | undefined) ?? user.id

  // Resolve Teacher.id for this user
  const { data: userRow } = await supabase
    .from('User')
    .select('id')
    .eq('authId', authId)
    .maybeSingle() as unknown as { data: { id: string } | null }

  if (!userRow) throw createError({ statusCode: 403, message: 'User not found' })

  const { data: teacherRow } = await supabase
    .from('Teacher')
    .select('id')
    .eq('userId', userRow.id)
    .maybeSingle() as unknown as { data: { id: string } | null }

  if (!teacherRow) throw createError({ statusCode: 403, message: 'Teacher profile not found' })

  // Verify this group belongs to the teacher
  const { data: group } = await supabase
    .from('Group')
    .select('id')
    .eq('id', groupId)
    .eq('teacherId', teacherRow.id)
    .maybeSingle() as unknown as { data: { id: string } | null }

  if (!group) throw createError({ statusCode: 403, message: 'Нет доступа к этой группе' })

  const { data: lesson, error } = await supabase
    .from('Lesson')
    .insert({
      groupId,
      topic: topic.trim(),
      startsAt: new Date(startsAt).toISOString(),
      status: 'SCHEDULED',
      durationMin: durationMin ?? 60,
      meetingUrl: meetingUrl?.trim() || null
    })
    .select('id, groupId, topic, startsAt, status, durationMin, meetingUrl, createdAt')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  return lesson
})
