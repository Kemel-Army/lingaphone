/**
 * GET /api/lessons/[id]/join   (авторизованный участник урока)
 *
 * Отдаёт параметры входа в видеокомнату: домен, комнату и JWT. Право доступа
 * проверяется здесь, а не на клиенте: учитель — владелец группы, ученик —
 * активный участник группы, родитель — родитель такого ученика.
 * Модератором становится только учитель (или админ).
 */
import { buildJitsiJoin, lessonRoomName } from '../../../utils/jitsi'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const lessonId = getRouterParam(event, 'id')
  if (!lessonId) throw createError({ statusCode: 400, message: 'id обязателен' })

  const supabase = useServerSupabase(event)
  const authId = (user.sub as string | undefined) ?? user.id

  const { data: userRow } = await supabase
    .from('User').select('id, role, name, surname, email, avatarUrl').eq('authId', authId).maybeSingle() as unknown as {
    data: { id: string, role: string, name: string, surname: string, email: string | null, avatarUrl: string | null } | null
  }
  if (!userRow) throw createError({ statusCode: 403, message: 'User not found' })

  const { data: lesson } = await supabase
    .from('Lesson')
    .select('id, topic, groupId, startsAt, durationMin, Group!groupId ( name, teacherId )')
    .eq('id', lessonId)
    .maybeSingle() as unknown as {
    data: {
      id: string
      topic: string
      groupId: string
      startsAt: string
      durationMin: number
      Group: { name: string, teacherId: string } | { name: string, teacherId: string }[] | null
    } | null
  }
  if (!lesson) throw createError({ statusCode: 404, message: 'Урок не найден' })

  const group = Array.isArray(lesson.Group) ? lesson.Group[0] : lesson.Group

  let allowed = false
  let moderator = false

  if (userRow.role === 'ADMIN' || userRow.role === 'DIRECTOR') {
    allowed = true
    moderator = true
  } else if (userRow.role === 'TEACHER') {
    const { data: teacherRow } = await supabase
      .from('Teacher').select('id').eq('userId', userRow.id).maybeSingle() as unknown as {
      data: { id: string } | null
    }
    allowed = !!teacherRow && group?.teacherId === teacherRow.id
    moderator = allowed
  } else if (userRow.role === 'STUDENT') {
    const { data: studentRow } = await supabase
      .from('Student').select('id').eq('userId', userRow.id).maybeSingle() as unknown as {
      data: { id: string } | null
    }
    if (studentRow) {
      const { data: member } = await supabase
        .from('GroupMember')
        .select('studentId')
        .eq('groupId', lesson.groupId)
        .eq('studentId', studentRow.id)
        .eq('status', 'ACTIVE')
        .maybeSingle() as unknown as { data: { studentId: string } | null }
      allowed = !!member
    }
  } else if (userRow.role === 'PARENT') {
    const { data: parentRow } = await supabase
      .from('Parent').select('id').eq('userId', userRow.id).maybeSingle() as unknown as {
      data: { id: string } | null
    }
    if (parentRow) {
      const { data: links } = await supabase
        .from('ParentToStudent')
        .select('studentId')
        .eq('parentId', parentRow.id) as unknown as { data: { studentId: string }[] | null }
      const childIds = (links ?? []).map(l => l.studentId)
      if (childIds.length) {
        const { data: member } = await supabase
          .from('GroupMember')
          .select('studentId')
          .eq('groupId', lesson.groupId)
          .in('studentId', childIds)
          .eq('status', 'ACTIVE')
          .limit(1) as unknown as { data: { studentId: string }[] | null }
        allowed = !!member?.length
      }
    }
  }

  if (!allowed) throw createError({ statusCode: 403, message: 'Нет доступа к этому уроку' })

  const room = lessonRoomName(lesson.id)
  const displayName = `${userRow.name} ${userRow.surname}`.trim() || 'Участник'

  // Токен живёт до конца урока + час запаса на задержки и овертайм.
  const endsAt = new Date(lesson.startsAt).getTime() + (lesson.durationMin ?? 60) * 60000
  const ttlMinutes = Math.max(60, Math.ceil((endsAt - Date.now()) / 60000) + 60)

  const join = buildJitsiJoin(room, {
    id: userRow.id,
    name: displayName,
    email: userRow.email,
    avatar: userRow.avatarUrl,
    moderator
  }, ttlMinutes)

  return {
    ...join,
    displayName,
    moderator,
    lesson: { id: lesson.id, topic: lesson.topic, groupName: group?.name ?? '' }
  }
})
