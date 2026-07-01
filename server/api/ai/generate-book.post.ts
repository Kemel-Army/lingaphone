/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * POST /api/ai/generate-book   (ADMIN)
 *
 * Reads a book PDF (Module.pdfUrl) with Gemini and builds the "Мой путь"
 * STRUCTURE for it: PathTopic (modules) + PathLesson (units). Does NOT
 * generate the 11-layer capsules — that's a second step per lesson via
 * /api/ai/generate-capsule. Skips if the book already has topics.
 */
import { z } from 'zod'

const bodySchema = z.object({ bookId: z.string().uuid() })

const structSchema = z.object({
  topics: z.array(z.object({
    name: z.string().min(1).max(80),
    level: z.string().max(10).optional().nullable(),
    lessons: z.array(z.object({
      title: z.string().min(1).max(100),
      subtitle: z.string().max(120).optional().nullable()
    })).min(1).max(20)
  })).min(1).max(15)
})

const PALETTE = [
  { icon: 'i-lucide-sparkles', color: 'sky' }, { icon: 'i-lucide-boxes', color: 'violet' },
  { icon: 'i-lucide-map-pin', color: 'emerald' }, { icon: 'i-lucide-zap', color: 'amber' },
  { icon: 'i-lucide-help-circle', color: 'rose' }, { icon: 'i-lucide-activity', color: 'cyan' },
  { icon: 'i-lucide-history', color: 'orange' }, { icon: 'i-lucide-shuffle', color: 'pink' },
  { icon: 'i-lucide-shield-check', color: 'blue' }, { icon: 'i-lucide-rocket', color: 'green' }
]

const PROMPT = `
Проанализируй учебник в PDF. Раздели его на модули (крупные темы) и уроки (грамматические/тематические юниты внутри модуля).
Верни СТРОГО JSON: { "topics": [ { "name": "...", "level": "A1", "lessons": [ { "title": "...", "subtitle": "..." } ] } ] }.
name модуля — короткое (англ. или как в книге). title урока — как называется юнит в книге. subtitle — короткое пояснение на русском.
5–12 модулей, в каждом реальные уроки из оглавления книги. Только валидный JSON, без markdown.
`.trim()

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const { bookId } = await readValidatedBody(event, bodySchema.parse)

  if (!isGeminiAvailable()) throw createError({ statusCode: 503, message: 'GEMINI_API_KEY не настроен' })

  const supabase = useServerSupabase(event)

  const { data: existing } = await supabase.from('PathTopic').select('id').eq('bookId', bookId).limit(1) as any
  if (existing?.length) {
    throw createError({ statusCode: 409, message: 'У этой книги уже собран путь. Удалите темы, чтобы пересобрать.' })
  }

  const { data: modules } = await supabase.from('Module').select('pdfUrl').eq('bookId', bookId).order('order').limit(1) as any
  const pdfUrl = modules?.[0]?.pdfUrl as string | undefined
  if (!pdfUrl) throw createError({ statusCode: 400, message: 'У книги нет PDF' })

  const pdfRes = await fetch(pdfUrl)
  if (!pdfRes.ok) throw createError({ statusCode: 502, message: 'Не удалось скачать PDF' })
  const pdfB64 = Buffer.from(await pdfRes.arrayBuffer()).toString('base64')

  const data = await geminiGenerateContent('gemini-2.5-flash', {
    contents: [{ parts: [{ inlineData: { mimeType: 'application/pdf', data: pdfB64 } }, { text: PROMPT }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.3, maxOutputTokens: 8192 }
  })
  const raw = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? ''
  let parsed: z.infer<typeof structSchema>
  try {
    parsed = structSchema.parse(JSON.parse(raw))
  } catch (e) {
    throw createError({ statusCode: 502, message: `Gemini вернул невалидную структуру: ${(e as Error).message}` })
  }

  let topicsCreated = 0
  let lessonsCreated = 0
  for (let ti = 0; ti < parsed.topics.length; ti++) {
    const t = parsed.topics[ti]!
    const pal = PALETTE[ti % PALETTE.length]!
    const { data: topicRow, error: tErr } = await supabase.from('PathTopic').insert({
      bookId, name: t.name, level: t.level ?? null,
      icon: pal.icon, color: pal.color, orderIndex: ti + 1,
      totalXp: t.lessons.length * 100, durationMinutes: t.lessons.length * 15
    } as never).select('id').single() as any
    if (tErr || !topicRow) continue
    topicsCreated++

    const lessonRows = t.lessons.map((l, li) => ({
      pathTopicId: topicRow.id, title: l.title, subtitle: l.subtitle ?? null,
      orderIndex: li + 1, durationMinutes: 15, xpReward: 100
    }))
    const { error: lErr } = await supabase.from('PathLesson').insert(lessonRows as never)
    if (!lErr) lessonsCreated += lessonRows.length
  }

  return { bookId, topicsCreated, lessonsCreated }
})
