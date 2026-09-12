/**
 * GET /api/guest/lesson/[token]   (ПУБЛИЧНЫЙ)
 *
 * Предпросмотр гостевой ссылки: тема, время, можно ли уже заходить. Ничего не
 * расходует — счётчик входов трогает только POST. Персональные данные группы
 * наружу не отдаём: гость видит только тему и время.
 */
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400, message: 'token обязателен' })

  const ip = getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
    ?? event.node.req.socket.remoteAddress
    ?? 'unknown'
  const limit = hitRateLimit(`guest-lesson-preview:${ip}`, 60, 60_000)
  if (!limit.allowed) {
    throw createError({ statusCode: 429, message: 'Слишком много запросов, попробуйте через минуту' })
  }

  const supabase = useServerSupabase(event)

  const { data: invite } = await supabase
    .from('LessonGuestInvite')
    .select('id, guestName, maxUses, usedCount, expiresAt, revokedAt, Lesson!lessonId ( id, topic, startsAt, durationMin )')
    .eq('token', token)
    .maybeSingle() as unknown as {
    data: {
      id: string
      guestName: string | null
      maxUses: number
      usedCount: number
      expiresAt: string
      revokedAt: string | null
      Lesson: { id: string, topic: string, startsAt: string, durationMin: number }
        | { id: string, topic: string, startsAt: string, durationMin: number }[]
        | null
    } | null
  }

  if (!invite) throw createError({ statusCode: 404, message: 'Ссылка не найдена' })
  if (invite.revokedAt) throw createError({ statusCode: 410, message: 'Ссылка отозвана' })
  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    throw createError({ statusCode: 410, message: 'Срок действия ссылки истёк' })
  }
  if (invite.usedCount >= invite.maxUses) {
    throw createError({ statusCode: 410, message: 'Лимит входов по ссылке исчерпан' })
  }

  const lesson = Array.isArray(invite.Lesson) ? invite.Lesson[0] : invite.Lesson
  if (!lesson) throw createError({ statusCode: 404, message: 'Урок не найден' })

  const start = new Date(lesson.startsAt).getTime()
  const end = start + (lesson.durationMin ?? 60) * 60000
  const now = Date.now()

  return {
    topic: lesson.topic,
    startsAt: lesson.startsAt,
    durationMin: lesson.durationMin,
    guestName: invite.guestName,
    // За 15 минут до начала — чтобы гость успел проверить камеру и микрофон.
    canJoin: now >= start - 15 * 60000 && now <= end + 30 * 60000,
    isPast: now > end + 30 * 60000
  }
})
