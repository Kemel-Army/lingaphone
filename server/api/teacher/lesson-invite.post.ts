/**
 * POST /api/teacher/lesson-invite   (TEACHER | ADMIN | DIRECTOR)
 *
 * Создаёт ссылку на онлайн-урок для гостя БЕЗ регистрации — для пробных
 * уроков и клиентов, которым не нужен аккаунт на платформе. Ссылка живёт до
 * конца урока (+ запас) и ограничена числом входов, поэтому постоянный доступ
 * в платформу так не утекает.
 *
 * Body: { lessonId, guestName?, leadId?, maxUses? }
 */
import { randomBytes } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['TEACHER', 'ADMIN', 'DIRECTOR'])
  const supabase = useServerSupabase(event)

  const body = await readBody(event) as {
    lessonId?: string
    guestName?: string
    leadId?: string
    maxUses?: number
  }
  const lessonId = body.lessonId
  if (!lessonId) throw createError({ statusCode: 400, message: 'lessonId обязателен' })

  const maxUses = body.maxUses ?? 5
  if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 50) {
    throw createError({ statusCode: 400, message: 'maxUses — целое число 1–50' })
  }

  const authId = (user.sub as string | undefined) ?? user.id
  const { data: userRow } = await supabase
    .from('User').select('id, role').eq('authId', authId).maybeSingle() as unknown as {
    data: { id: string, role: string } | null
  }
  if (!userRow) throw createError({ statusCode: 403, message: 'User not found' })

  const { data: lesson } = await supabase
    .from('Lesson')
    .select('id, topic, startsAt, durationMin, Group!groupId ( teacherId )')
    .eq('id', lessonId)
    .maybeSingle() as unknown as {
    data: {
      id: string
      topic: string
      startsAt: string
      durationMin: number
      Group: { teacherId: string } | { teacherId: string }[] | null
    } | null
  }
  if (!lesson) throw createError({ statusCode: 404, message: 'Урок не найден' })

  if (userRow.role === 'TEACHER') {
    const group = Array.isArray(lesson.Group) ? lesson.Group[0] : lesson.Group
    const { data: teacherRow } = await supabase
      .from('Teacher').select('id').eq('userId', userRow.id).maybeSingle() as unknown as {
      data: { id: string } | null
    }
    if (!teacherRow || group?.teacherId !== teacherRow.id) {
      throw createError({ statusCode: 403, message: 'Нет доступа к этому уроку' })
    }
  }

  // Ссылка перестаёт работать через 2 часа после конца урока — гость не
  // должен возвращаться в комнату завтра.
  const endsAt = new Date(lesson.startsAt).getTime() + (lesson.durationMin ?? 60) * 60000
  const expiresAt = new Date(Math.max(endsAt, Date.now()) + 2 * 60 * 60000).toISOString()

  const token = randomBytes(24).toString('base64url')

  const { data: invite, error } = await supabase
    .from('LessonGuestInvite')
    .insert({
      token,
      lessonId,
      guestName: body.guestName?.trim() || null,
      leadId: body.leadId || null,
      maxUses,
      expiresAt,
      createdBy: userRow.id
    })
    .select('id, token, expiresAt, maxUses, usedCount')
    .single() as unknown as {
    data: { id: string, token: string, expiresAt: string, maxUses: number, usedCount: number } | null
    error: { message: string } | null
  }

  if (error || !invite) {
    throw createError({ statusCode: 500, message: error?.message ?? 'Не удалось создать ссылку' })
  }

  const origin = getRequestURL(event).origin
  return { ...invite, url: `${origin}/join/${invite.token}`, lessonTopic: lesson.topic }
})
