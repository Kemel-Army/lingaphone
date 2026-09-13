const LESSON_TYPES = ['GROUP', 'INDIVIDUAL', 'TRIAL', 'MAKEUP', 'SPEAKING_CLUB'] as const

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['TEACHER'])
  const supabase = useServerSupabase(event)

  const body = await readBody(event)
  const { groupId, topic, startsAt, durationMin, meetingUrl, type } = body

  if (!topic?.trim() || !startsAt) {
    throw createError({ statusCode: 400, message: 'topic и startsAt обязательны' })
  }

  // Validate before it reaches the LessonType enum column — an unknown value
  // used to surface as an opaque 500 from Postgres instead of a 400.
  if (type !== undefined && !LESSON_TYPES.includes(type)) {
    throw createError({
      statusCode: 400,
      message: `type должен быть одним из: ${LESSON_TYPES.join(', ')}`
    })
  }

  // Группа обязательна только для GROUP — остальные типы (пробный/индивидуальный/
  // отработка/speaking club) физически всё равно нужен Lesson.groupId (NOT NULL),
  // но выбирать её вручную нелогично: подставляем служебную группу учителя.
  const isGroupType = (type ?? 'GROUP') === 'GROUP'
  if (isGroupType && !groupId) {
    throw createError({ statusCode: 400, message: 'groupId обязателен для группового занятия' })
  }

  if (Number.isNaN(new Date(startsAt).getTime())) {
    throw createError({ statusCode: 400, message: 'startsAt — некорректная дата' })
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

  let resolvedGroupId: string
  if (isGroupType) {
    // Verify this group belongs to the teacher
    const { data: group } = await supabase
      .from('Group')
      .select('id')
      .eq('id', groupId)
      .eq('teacherId', teacherRow.id)
      .maybeSingle() as unknown as { data: { id: string } | null }

    if (!group) throw createError({ statusCode: 403, message: 'Нет доступа к этой группе' })
    resolvedGroupId = groupId
  } else {
    const { data: serviceGroupId, error: rpcError } = await supabase
      .rpc('get_or_create_service_group', { p_teacher_id: teacherRow.id }) as unknown as { data: string | null, error: unknown }
    if (rpcError || !serviceGroupId) {
      throw createError({ statusCode: 500, message: 'Не удалось получить служебную группу учителя' })
    }
    resolvedGroupId = serviceGroupId
  }

  const { data: lesson, error } = await supabase
    .from('Lesson')
    .insert({
      groupId: resolvedGroupId,
      topic: topic.trim(),
      startsAt: new Date(startsAt).toISOString(),
      status: 'SCHEDULED',
      type: type ?? 'GROUP',
      durationMin: durationMin ?? 60,
      meetingUrl: meetingUrl?.trim() || null
    })
    .select('id, groupId, topic, startsAt, status, type, durationMin, meetingUrl, createdAt')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  return lesson
})
