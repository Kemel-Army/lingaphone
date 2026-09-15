/**
 * POST /api/teacher/lesson-invite   (TEACHER | ADMIN | DIRECTOR)
 *
 * Создаёт ссылку на онлайн-урок для гостя БЕЗ регистрации — для пробных
 * уроков и клиентов, которым не нужен аккаунт на платформе. Ссылка живёт до
 * конца урока (+ запас) и ограничена числом входов, поэтому постоянный доступ
 * в платформу так не утекает.
 *
 * Заодно это единственное место, где пробный урок помечается «за каким
 * ребёнком» — leadId проставляется на инвайт, а Lead.trialLessonAt/
 * trialTeacherId синхронизируются автоматически, чтобы в CRM не заполнять
 * их вручную второй раз.
 *
 * Body: { lessonId, guestName?, leadId?, newLead?: { fullName, phone? }, maxUses? }
 */
import { randomBytes } from 'node:crypto'
import type { Database } from '~/shared/types/database.types'

type LeadStage = Database['public']['Enums']['LeadStage']

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['TEACHER', 'ADMIN', 'DIRECTOR'])
  const supabase = useServerSupabase(event)

  const body = await readBody(event) as {
    lessonId?: string
    guestName?: string
    leadId?: string
    newLead?: { fullName?: string, phone?: string }
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

  const group = Array.isArray(lesson.Group) ? lesson.Group[0] : lesson.Group
  let resolvedTeacherId = group?.teacherId ?? null

  if (userRow.role === 'TEACHER') {
    const { data: teacherRow } = await supabase
      .from('Teacher').select('id').eq('userId', userRow.id).maybeSingle() as unknown as {
      data: { id: string } | null
    }
    if (!teacherRow || group?.teacherId !== teacherRow.id) {
      throw createError({ statusCode: 403, message: 'Нет доступа к этому уроку' })
    }
    resolvedTeacherId = teacherRow.id
  }

  // ─── Ребёнок для этого приглашения: существующий лид или новый ──────────
  let leadId = body.leadId || null
  if (!leadId && body.newLead?.fullName?.trim()) {
    const { data: newLeadRow, error: leadInsertError } = await supabase
      .from('Lead')
      .insert({
        fullName: body.newLead.fullName.trim(),
        phone: body.newLead.phone?.trim() || null,
        source: 'OTHER',
        stage: 'TRIAL',
        trialTeacherId: resolvedTeacherId,
        trialLessonAt: lesson.startsAt
      })
      .select('id')
      .single() as unknown as { data: { id: string } | null, error: { message: string } | null }

    if (leadInsertError || !newLeadRow) {
      throw createError({ statusCode: 500, message: leadInsertError?.message ?? 'Не удалось завести лида' })
    }
    leadId = newLeadRow.id
    await supabase.from('LeadStageHistory').insert({
      leadId, fromStage: null, toStage: 'TRIAL', changedById: userRow.id
    })
  } else if (leadId) {
    // Существующий лид записывается на этот пробный — обновляем служебные
    // поля и продвигаем воронку, только если она ещё не ушла дальше «Пробного».
    const { data: leadRow } = await supabase
      .from('Lead').select('stage').eq('id', leadId).maybeSingle() as unknown as {
      data: { stage: LeadStage } | null
    }
    const patch: Record<string, unknown> = { trialLessonAt: lesson.startsAt, trialTeacherId: resolvedTeacherId }
    if (leadRow && (['NEW', 'CONTACTED'] as LeadStage[]).includes(leadRow.stage)) {
      patch.stage = 'TRIAL'
      await supabase.from('LeadStageHistory').insert({
        leadId, fromStage: leadRow.stage, toStage: 'TRIAL', changedById: userRow.id
      })
    }
    await supabase.from('Lead').update(patch).eq('id', leadId)
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
      leadId,
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
  return { ...invite, url: `${origin}/join/${invite.token}`, lessonTopic: lesson.topic, leadId }
})
