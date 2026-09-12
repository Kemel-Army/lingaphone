/**
 * POST /api/guest/lesson/[token]   (ПУБЛИЧНЫЙ)
 *
 * Вход гостя в комнату урока по ссылке, без регистрации. Расходует одну
 * попытку из `maxUses` и выдаёт JWT участника (НЕ модератора) со сроком жизни
 * до конца урока — дальше ссылка бесполезна.
 *
 * Body: { name }
 */
import { buildJitsiJoin, lessonRoomName } from '../../../utils/jitsi'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400, message: 'token обязателен' })

  const ip = getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
    ?? event.node.req.socket.remoteAddress
    ?? 'unknown'
  const limit = hitRateLimit(`guest-lesson-join:${ip}`, 20, 60_000)
  if (!limit.allowed) {
    throw createError({ statusCode: 429, message: 'Слишком много попыток, подождите минуту' })
  }

  const body = await readBody(event) as { name?: string }
  const name = (body.name ?? '').trim().slice(0, 60)
  if (name.length < 2) throw createError({ statusCode: 400, message: 'Укажите имя (минимум 2 символа)' })

  const supabase = useServerSupabase(event)

  const { data: invite } = await supabase
    .from('LessonGuestInvite')
    .select('id, maxUses, usedCount, expiresAt, revokedAt, lessonId, Lesson!lessonId ( id, topic, startsAt, durationMin )')
    .eq('token', token)
    .maybeSingle() as unknown as {
    data: {
      id: string
      maxUses: number
      usedCount: number
      expiresAt: string
      revokedAt: string | null
      lessonId: string
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

  const lesson = Array.isArray(invite.Lesson) ? invite.Lesson[0] : invite.Lesson
  if (!lesson) throw createError({ statusCode: 404, message: 'Урок не найден' })

  const start = new Date(lesson.startsAt).getTime()
  const end = start + (lesson.durationMin ?? 60) * 60000
  const now = Date.now()
  if (now < start - 15 * 60000) {
    throw createError({ statusCode: 425, message: 'Урок ещё не начался — подключение откроется за 15 минут до начала' })
  }
  if (now > end + 30 * 60000) {
    throw createError({ statusCode: 410, message: 'Урок уже завершён' })
  }

  // Счётчик увеличиваем условно: `usedCount = eq(текущее)` не даст двум
  // параллельным запросам проскочить сверх лимита.
  if (invite.usedCount >= invite.maxUses) {
    throw createError({ statusCode: 410, message: 'Лимит входов по ссылке исчерпан' })
  }
  const { data: claimed } = await supabase
    .from('LessonGuestInvite')
    .update({ usedCount: invite.usedCount + 1, lastUsedAt: new Date().toISOString() })
    .eq('id', invite.id)
    .eq('usedCount', invite.usedCount)
    .select('id') as unknown as { data: { id: string }[] | null }

  if (!claimed?.length) {
    throw createError({ statusCode: 409, message: 'Ссылка сейчас используется, попробуйте ещё раз' })
  }

  const ttlMinutes = Math.max(30, Math.ceil((end - now) / 60000) + 30)
  const join = buildJitsiJoin(lessonRoomName(lesson.id), {
    id: `guest-${invite.id}`,
    name,
    moderator: false
  }, ttlMinutes)

  return { ...join, displayName: name, topic: lesson.topic }
})
