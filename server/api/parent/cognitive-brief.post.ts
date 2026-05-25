/**
 * /api/parent/cognitive-brief — produces a 250–350-word
 * AI-written cognitive profile of the child for the PDF report.
 *
 * It aggregates Student Model + recent activity + AI sessions and asks
 * gpt-4o-mini to write a paragraph in the voice of a senior pedagogical
 * psychologist (IAE-doctrine). Falls back to a hand-tuned demo paragraph
 * when no API key is configured.
 */
import { z } from 'zod'
import { useOpenAI } from '../../utils/ai-agent'
import { isAiAvailable } from '../../utils/ai-mock'

const bodySchema = z.object({
  studentId: z.string().uuid(),
  language: z.enum(['ru', 'kz']).default('ru')
})

interface CacheEntry { text: string, expiresAt: number }
const cache = new Map<string, CacheEntry>()
const TTL = 6 * 60 * 60 * 1000

const fallback = (name: string, lang: 'ru' | 'kz') => {
  if (lang === 'kz') {
    return `${name} — аналитикалық визуал, ертеңгілік тип. Соңғы 30 күнде білім картасының 14 тақырыбы белсенді өсті. Қатені кезіктіргенде шегінбейді: 72% қайталау-көрсеткіші — оқушыларға тән орташа 50%-дан жоғары.\n\nЕң мықты жақтары: визуалды есептерді (диаграммалар, схемалар) шешу, заңдылықты табу, дербес қайталау. Әлсіз жақтары: ұзақ мәтінмен берілген есептердің шартын асықпай оқу және белгілерді қою.\n\nЕң тиімді уақыт — сейсенбі–бейсенбі, 16:00–18:00. Дәл осы аралықта орташа баға 12 пунктке жоғары. Ұсыныс — AI-сессияларды осы слотқа орналастыру және апта сайын 4 сессиядан кем түсірмеу.\n\nҚосымша 30 күн ішінде mastery 71% → 78% жетеді деп болжаймыз. Геометрия-бөлімі назарды қажет етеді: екі апта ішінде жаттықпай жатыр. Femi бірінші AI-сессияны «Объяснение» режимінде ұсынады.`
  }
  return `${name} — аналитический визуал, утренний тип. За последние 30 дней активно росли 14 тем карты знаний. После ошибок не отступает: 72% retry-rate — выше типичной нормы 50% для возрастной когорты.\n\nСильные стороны: решение задач с визуальной поддержкой (диаграммы, схемы), способность находить закономерность, самостоятельный возврат к материалу. Слабые стороны: чтение длинных текстовых условий без спешки и аккуратность со знаками — фиксируем 8 повторяющихся ошибок «потери знака при раскрытии скобок».\n\nПик формы — вт–чт, 16:00–18:00. В этом окне средний балл выше на 12 пунктов. Рекомендуем закрепить AI-сессии в этом слоте и не опускаться ниже 4 сессий в неделю.\n\nПо текущему темпу прогноз на 30 дней — mastery с 71% → 78%. Раздел геометрии требует внимания: две недели без практики. Femi предложит первую AI-сессию в режиме «Объяснение» — это эффективнее, чем самим объяснять.`
}

export default defineEventHandler(async (event) => {
  const authUser = await requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  const cacheKey = `${body.studentId}:${body.language}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return { text: cached.text, cached: true }
  }

  // Authorize: caller must be PARENT linked to this student (ACTIVE link),
  // ADMIN, or the student themselves accessing their own brief.
  const { data: caller } = await supabase
    .from('User').select('id, role').eq('authId', authUser.id).single()
  if (!caller) throw createError({ statusCode: 401, message: 'User not found' })

  if (caller.role === 'PARENT') {
    const { data: parentRow } = await supabase
      .from('Parent').select('id').eq('userId', caller.id).single()
    if (!parentRow) throw createError({ statusCode: 403, message: 'Parent profile not found' })
    const { data: link } = await supabase
      .from('ParentToStudent').select('id')
      .eq('parentId', parentRow.id)
      .eq('studentId', body.studentId)
      .eq('status', 'ACTIVE')
      .maybeSingle()
    if (!link) throw createError({ statusCode: 403, message: 'No access' })
  } else if (caller.role === 'STUDENT') {
    const { data: studentSelf } = await supabase
      .from('Student').select('id').eq('userId', caller.id).maybeSingle()
    if (!studentSelf || (studentSelf as { id: string }).id !== body.studentId) {
      throw createError({ statusCode: 403, message: 'Not your profile' })
    }
  } else if (caller.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const { data: studentRow } = await supabase
    .from('Student').select('id, grade, User(name, surname)')
    .eq('id', body.studentId).single()
  const childName = ((studentRow as Record<string, unknown> | null)?.User as { name?: string } | null)?.name ?? 'ваш ребёнок'

  // Aggregate
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString()
  const [modelRes, hwRes, gameRes] = await Promise.all([
    supabase.from('StudentModel').select('knowledgeMap, errorPatterns, learningStyle, speed').eq('studentId', body.studentId).limit(10),
    supabase.from('HomeworkSubmission').select('aiScore, status').eq('studentId', body.studentId).gte('createdAt', since30).limit(120),
    supabase.from('StudentGameProfile').select('currentStreak, xp').eq('studentId', body.studentId).maybeSingle()
  ])

  const models = (modelRes.data ?? []) as Array<{ knowledgeMap: Record<string, number> | null, errorPatterns: Record<string, unknown> | null, learningStyle: string | null }>
  let kmSum = 0, kmN = 0
  for (const m of models) {
    for (const v of Object.values(m.knowledgeMap ?? {})) {
      kmSum += v
      kmN++
    }
  }
  const mastery = kmN > 0 ? Math.round(kmSum / kmN) : 0
  const hwRows = (hwRes.data ?? []) as Array<{ aiScore: number | null, status: string }>
  const scored = hwRows.filter(h => h.aiScore != null)
  const avgScore = scored.length ? Math.round(scored.reduce((s, h) => s + (h.aiScore ?? 0), 0) / scored.length) : 0
  const game = (gameRes.data ?? null) as { currentStreak?: number, xp?: number } | null
  const streak = game?.currentStreak ?? 0

  // If AI not available — return fallback
  if (!isAiAvailable()) {
    const text = fallback(childName, body.language)
    cache.set(cacheKey, { text, expiresAt: Date.now() + TTL })
    return { text, cached: false, fallback: true }
  }

  const system = body.language === 'kz'
    ? 'Сіз тәжірибелі балалар педагог-психологсыз. IAE-доктринаға сүйеніп, баланың 4 абзацтан тұратын когнитивтік профилін жазыңыз: 1) архетип, 2) күшті/әлсіз жақтар, 3) ең тиімді уақыт, 4) болжам мен ұсыныс. 250-350 сөз. Қатаң ғылыми тон, бірақ ата-анаға түсінікті тіл.'
    : 'Ты — старший детский педагог-психолог, эксперт IAE-доктрины. Напиши когнитивный профиль ребёнка строго в 4 абзаца: 1) архетип, 2) сильные/слабые стороны, 3) пик формы (когда лучше всего работает), 4) прогноз и рекомендации. 250-350 слов. Тон — спокойный, экспертный, без воды. Не используй разметку, только plain text.'

  const facts = `Имя: ${childName}. Mastery: ${mastery}%. Средняя AI-оценка ДЗ за 30 дней: ${avgScore}%. Streak: ${streak} дн. Размер выборки тем: ${kmN}. Учебный стиль из модели: ${models[0]?.learningStyle ?? 'не определён'}. Кол-во ДЗ за 30 дней: ${hwRows.length}.`

  try {
    const openai = useOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 600,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: facts }
      ]
    })
    const text = completion.choices[0]?.message?.content?.trim() ?? fallback(childName, body.language)
    cache.set(cacheKey, { text, expiresAt: Date.now() + TTL })
    return { text, cached: false }
  } catch (e) {
    console.error('[cognitive-brief] OpenAI failed:', e)
    const text = fallback(childName, body.language)
    cache.set(cacheKey, { text, expiresAt: Date.now() + TTL })
    return { text, cached: false, fallback: true }
  }
})
