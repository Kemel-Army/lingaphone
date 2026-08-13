import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/shared/types/database.types'
import {
  PLACEMENT_TESTS,
  scorePlacement,
  type PlacementAgeBand,
  type PlacementAnswers
} from '~/shared/lib/placementTest'
import { normalizeKzPhone, isUsablePhone } from '~~/server/utils/phoneKz'
import { hitRateLimit } from '~~/server/utils/rateLimit'

/**
 * Приём входного тестирования с публичной страницы.
 *
 * Вызывается дважды: сразу после ввода контактов (создаёт лид и пустую попытку)
 * и в конце (дописывает ответы). Первый вызов нужен именно для того, чтобы
 * заявка попала в CRM, даже если ребёнок бросит тест на середине.
 *
 * Пишем service role: посетитель не залогинен, а у «Lead» и «PlacementTest»
 * нет клиентских INSERT-политик. Раз RLS здесь не работает, единственный барьер
 * против набивания CRM — лимит обращений по IP ниже.
 *
 * Счёт всегда считается здесь, а не на клиенте: ответы приходят из браузера, и
 * доверять присланному баллу нельзя.
 */

const answerSchema = z.union([
  z.null(),
  z.object({ kind: z.literal('MATCH'), pairs: z.record(z.string().max(64), z.string().max(64)) }),
  z.object({ kind: z.literal('CHOICE'), index: z.number().int().min(0).max(20) }),
  z.object({ kind: z.literal('ORDER'), order: z.array(z.string().max(64)).max(30) }),
  z.object({ kind: z.literal('SHORT'), text: z.string().max(500) }),
  z.object({ kind: z.literal('OPEN'), text: z.string().max(4000) })
])

const bodySchema = z.object({
  ageBand: z.enum(['AGE_6_9', 'AGE_9_12', 'AGE_12_16']),
  fullName: z.string().min(2).max(150).trim(),
  phone: z.string().min(5).max(20).trim()
    // Номер — единственный ключ, по которому лид потом находят. Строка вроде
    // «позвоните мне» дала бы пустой phoneDigits и склеилась бы с чужим лидом.
    .refine(p => isUsablePhone(normalizeKzPhone(p)), 'Укажите номер телефона полностью'),
  answers: z.record(z.string().max(64), answerSchema),
  /** Идентификатор уже созданной попытки — дописываем её, а не создаём новую. */
  testId: z.string().uuid().optional()
})

// Класс из одного кабинета проходит тест с одного IP, поэтому лимит щедрый:
// он ломает автоматическую долбёжку, а не живой урок.
const RATE_LIMIT = 60
const RATE_WINDOW_MS = 60 * 60 * 1000

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const limit = hitRateLimit(`placement:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)
  if (!limit.allowed) {
    setResponseHeader(event, 'Retry-After', limit.retryAfterSec)
    throw createError({ statusCode: 429, message: 'Слишком много попыток. Попробуйте позже.' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)
  const ageBand = body.ageBand as PlacementAgeBand

  // Отбрасываем всё, чего нет в банке вопросов — присланный клиентом мусор не
  // должен попадать ни в счёт, ни в jsonb.
  const known = new Set(PLACEMENT_TESTS[ageBand].questions.map(q => q.id))
  const answers: PlacementAnswers = {}
  for (const [id, value] of Object.entries(body.answers)) {
    if (known.has(id)) answers[id] = value as PlacementAnswers[string]
  }

  const result = scorePlacement(ageBand, answers)
  const supabase = serverSupabaseServiceRole<Database>(event)

  const payload = {
    ageBand,
    fullName: body.fullName,
    phone: body.phone,
    answers,
    autoScore: result.autoScore,
    autoMax: result.autoMax,
    skippedCount: result.skippedCount,
    openAnswers: result.openAnswers,
    recommendedLevel: result.recommendedLevel
  }

  const respond = (testId: string) => ({
    testId,
    autoScore: result.autoScore,
    autoMax: result.autoMax,
    percent: result.percent,
    skippedCount: result.skippedCount,
    recommendedLevel: result.recommendedLevel
  })

  // ─── Дописываем уже начатую попытку ───────────────────────────────────────
  if (body.testId) {
    const { data: updated, error } = await supabase
      .from('PlacementTest')
      .update(payload as never)
      .eq('id', body.testId)
      .select('id')
      .maybeSingle() as unknown as { data: { id: string } | null, error: unknown }

    if (error) throw createError({ statusCode: 500, message: 'Не удалось сохранить результат теста' })
    if (updated) return respond(updated.id)
    // Строку не нашли (например, её удалили) — падать нельзя, заводим заново.
  }

  // ─── Лид: переиспользуем существующий по телефону, иначе создаём ───────────
  // Сверяем по generated-колонке "phoneDigits" в каноническом виде, чтобы
  // «+7 700 111-22-33» и «8 700 111 22 33» попадали в один лид.
  const phoneDigits = normalizeKzPhone(body.phone)
  const { data: matched } = await supabase
    .from('Lead')
    .select('id')
    .eq('phoneDigits', phoneDigits)
    .order('createdAt', { ascending: false })
    .limit(1)
    .maybeSingle() as unknown as { data: { id: string } | null }

  let leadId = matched?.id ?? null
  if (!leadId) {
    const { data: created, error: leadError } = await supabase
      .from('Lead')
      .insert({
        fullName: body.fullName,
        phone: body.phone,
        source: 'WEBSITE',
        stage: 'NEW',
        notes: `Прошёл входное тестирование на сайте (${ageBand}).`
      } as never)
      .select('id')
      .single() as unknown as { data: { id: string } | null, error: unknown }

    if (leadError || !created) {
      throw createError({ statusCode: 500, message: 'Не удалось сохранить заявку' })
    }
    leadId = created.id
  }

  const { data: inserted, error: testError } = await supabase
    .from('PlacementTest')
    .insert({ leadId, ...payload } as never)
    .select('id')
    .single() as unknown as { data: { id: string } | null, error: unknown }

  if (testError || !inserted) {
    throw createError({ statusCode: 500, message: 'Не удалось сохранить результат теста' })
  }

  // Клиенту отдаём только итог — ключи ответов наружу не уходят.
  return respond(inserted.id)
})
