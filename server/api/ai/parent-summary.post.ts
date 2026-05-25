import { z } from 'zod'
import { useOpenAI } from '../../utils/ai-agent'
import { isAiAvailable } from '../../utils/ai-mock'

const bodySchema = z.object({
  studentId: z.string().uuid(),
  days: z.number().int().min(1).max(60).default(7),
  language: z.enum(['ru', 'kz']).default('ru')
})

interface CacheEntry {
  text: string
  expiresAt: number
}
const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60 * 60 * 1000

const fmtDate = (d: Date) => d.toISOString().slice(0, 10)

const mockSummary = (childName: string, lang: 'ru' | 'kz') => {
  if (lang === 'kz') {
    return `Осы аптада ${childName} белсенді жұмыс істеді: 3 сабаққа қатысты, 2 үй жұмысын тапсырды (орташа 84%). «Көбейту мен бөлу» тақырыбын меңгеру 88%-ке өсті — өте жақсы прогресс. «Бөлшектер» тақырыбында әлі қиындықтар бар (45%) — оқытушы бұл туралы хабардар, келесі сабақта қайталау жоспарланған. ${childName} XP бойынша 7-деңгейге жетті және 5 күн қатарынан стрик ұстап тұр. Барлығы дұрыс жолда!`
  }
  return `На этой неделе ${childName} занимался активно: посетил 3 урока, сдал 2 домашних задания (средний балл 84%). Тема «Умножение и деление» выросла до 88% освоения — отличный прогресс. Тема «Дроби» всё ещё даётся непросто (45%) — преподаватель уже в курсе, на следующем уроке запланировано повторение. ${childName} достиг 7 уровня по XP и держит стрик 5 дней подряд. В целом — всё на верном пути!`
}

export default defineEventHandler(async (event) => {
  const authUser = await requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  const cacheKey = `${body.studentId}:${body.days}:${body.language}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return { text: cached.text, cached: true }
  }

  // Resolve role + internal userId via User table (JWT custom claims may not be active)
  const { data: caller, error: callerErr } = await supabase
    .from('User').select('id, role').eq('authId', authUser.id).single()
  if (callerErr || !caller) {
    console.error('[parent-summary] caller lookup failed:', callerErr?.message)
    throw createError({ statusCode: 401, message: 'User profile not found' })
  }
  if (caller.role !== 'PARENT' && caller.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  // Verify parent → student link (admins skip the check)
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
    if (!link) throw createError({ statusCode: 403, message: 'No access to this student' })
  }

  const { data: studentRow, error: studentErr } = await supabase
    .from('Student')
    .select('id, grade, User(name, surname)')
    .eq('id', body.studentId)
    .single()
  if (studentErr || !studentRow) {
    throw createError({ statusCode: 404, message: 'Student not found' })
  }
  const childName = ((studentRow as Record<string, unknown>).User as { name?: string } | null)?.name ?? 'ваш ребёнок'

  const since = new Date(Date.now() - body.days * 86400000)
  const sinceIso = since.toISOString()

  // Aggregate data in parallel — every query is best-effort, don't crash on schema drift
  const [xpRes, progRes, hwRes, aiRes, lessRes, capsRes] = await Promise.all([
    supabase.from('XPTransaction').select('amount, action, description, createdAt')
      .eq('studentId', body.studentId).gte('createdAt', sinceIso).order('createdAt', { ascending: false }),
    supabase.from('Progress').select('topicId, masteryBefore, masteryAfter, source, createdAt, Topic(name)')
      .eq('studentId', body.studentId).gte('createdAt', sinceIso).order('createdAt', { ascending: false }).limit(40),
    supabase.from('HomeworkSubmission').select('status, score, aiFeedback, submittedAt, createdAt, Homework(title, topicId, Topic(name))')
      .eq('studentId', body.studentId).gte('createdAt', sinceIso),
    supabase.from('AIConversation').select('*', { count: 'exact', head: true })
      .eq('studentId', body.studentId).gte('createdAt', sinceIso),
    supabase.from('LessonStudent').select('attended, Lesson(title, status, scheduledAt)')
      .eq('studentId', body.studentId),
    supabase.from('PathProgress').select('completedAt, layersCompleted, xpEarned')
      .eq('studentId', body.studentId).gte('createdAt', sinceIso)
  ])

  for (const [name, res] of Object.entries({ xp: xpRes, progress: progRes, hw: hwRes, ai: aiRes, lessons: lessRes, capsules: capsRes })) {
    const r = res as { error?: { message?: string } | null }
    if (r.error) console.error(`[parent-summary] ${name} query error:`, r.error.message)
  }

  const xpTx = (xpRes.data ?? []) as Array<{ amount?: number }>
  const progress = (progRes.data ?? []) as Array<{ topicId: string, masteryBefore: number, masteryAfter: number, Topic?: { name?: string } }>
  const hwSubs = (hwRes.data ?? []) as Array<{ status?: string, score?: number | null, aiFeedback?: string, Homework?: { title?: string, Topic?: { name?: string } } }>
  const aiCount = aiRes.count ?? 0
  const lessons = (lessRes.data ?? []) as Array<{ attended?: boolean, Lesson?: { status?: string, scheduledAt?: string } }>
  const capsules = (capsRes.data ?? []) as Array<{ completedAt: string | null, xpEarned?: number }>

  const totalXp = xpTx.reduce((acc, x) => acc + (x.amount ?? 0), 0)
  const checkedHw = hwSubs.filter(s => s.status === 'CHECKED' && s.score != null) as Array<{ score: number, aiFeedback?: string, Homework?: { title?: string, Topic?: { name?: string } } }>
  const avgHw = checkedHw.length
    ? Math.round(checkedHw.reduce((a, s) => a + (s.score ?? 0), 0) / checkedHw.length)
    : null

  // Mastery deltas by topic (sum of masteryAfter - masteryBefore per topic)
  const masteryDelta: Record<string, { name: string, delta: number, latest: number }> = {}
  for (const p of progress) {
    const name = p.Topic?.name ?? p.topicId
    const existing = masteryDelta[p.topicId] ?? { name, delta: 0, latest: p.masteryAfter }
    existing.delta += (p.masteryAfter - p.masteryBefore)
    masteryDelta[p.topicId] = existing
  }
  const topGrowth = Object.values(masteryDelta).filter(t => t.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 3)
  const topWeakness = Object.values(masteryDelta).filter(t => t.latest < 50).sort((a, b) => a.latest - b.latest).slice(0, 3)

  const lessonsAttended = lessons.filter(l => l.attended === true || l.Lesson?.status === 'COMPLETED').length
  const capsulesCompleted = capsules.filter(c => c.completedAt != null).length

  // Build context
  const facts: string[] = []
  facts.push(`Период: последние ${body.days} дней (с ${fmtDate(since)})`)
  facts.push(`Ребёнок: ${childName}, ${studentRow.grade ?? '?'} класс`)
  facts.push(`Капсул пройдено: ${capsulesCompleted}`)
  facts.push(`AI-сессий: ${aiCount}`)
  facts.push(`Заработано XP: ${totalXp}`)
  if (lessonsAttended > 0) facts.push(`Уроков посещено: ${lessonsAttended}`)
  if (checkedHw.length > 0) facts.push(`Сдано ДЗ (проверено): ${checkedHw.length}${avgHw !== null ? `, средний балл ${avgHw}%` : ''}`)
  if (topGrowth.length) {
    facts.push(`Рост по темам: ${topGrowth.map(t => `${t.name} (+${Math.round(t.delta)})`).join(', ')}`)
  }
  if (topWeakness.length) {
    facts.push(`Слабые темы: ${topWeakness.map(t => `${t.name} (${Math.round(t.latest)}%)`).join(', ')}`)
  }
  const lastFeedback = checkedHw.slice(0, 2).map(h => h.aiFeedback).filter(Boolean).slice(0, 2)
  if (lastFeedback.length) {
    facts.push(`Последние AI-комментарии к ДЗ: ${lastFeedback.join(' | ')}`)
  }

  // No data — short stub
  if (capsulesCompleted === 0 && checkedHw.length === 0 && aiCount === 0 && lessonsAttended === 0) {
    const text = body.language === 'kz'
      ? `Осы аптада ${childName} платформада әрекет жасамады. Сабаққа шақыруды ұсынамыз.`
      : `На этой неделе ${childName} не проявлял активности на платформе. Возможно, стоит напомнить о занятиях.`
    cache.set(cacheKey, { text, expiresAt: Date.now() + CACHE_TTL_MS })
    return { text, cached: false }
  }

  if (!isAiAvailable()) {
    const text = mockSummary(childName, body.language)
    cache.set(cacheKey, { text, expiresAt: Date.now() + CACHE_TTL_MS })
    return { text, cached: false, mock: true }
  }

  const langLabel = body.language === 'kz' ? 'казахском' : 'русском'
  const systemPrompt = `Ты — заботливый AI-помощник на образовательной платформе FEMO. Пишешь короткое еженедельное резюме для родителя ученика на ${langLabel} языке.

Тон: тёплый, человечный, поддерживающий. Никакой сухой статистики. Ты говоришь с мамой/папой о их ребёнке.

Структура (4-6 предложений, БЕЗ заголовков и буллетов, сплошной текст):
1. Что ребёнок делал на этой неделе (общая активность)
2. Где есть успехи и рост — конкретно по темам
3. Где буксует или нужна поддержка — без обвинений, мягко
4. Одно практическое действие, которое может предложить родитель

Не повторяй слово в слово факты — переплавляй в живой текст. Не используй markdown. Не выдумывай данные, которых нет в фактах.`

  const userPrompt = `Факты о неделе:\n${facts.map(f => `- ${f}`).join('\n')}\n\nНапиши резюме для родителя.`

  try {
    const openai = useOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 400
    })
    const text = completion.choices[0]?.message?.content?.trim() ?? mockSummary(childName, body.language)
    cache.set(cacheKey, { text, expiresAt: Date.now() + CACHE_TTL_MS })
    return { text, cached: false }
  } catch (err) {
    const text = mockSummary(childName, body.language)
    cache.set(cacheKey, { text, expiresAt: Date.now() + CACHE_TTL_MS / 6 })
    return { text, cached: false, mock: true, error: (err as Error).message }
  }
})
