/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * POST /api/ai/generate-capsule   (ADMIN)
 *
 * Generates an 11-layer capsule for one PathLesson (grammar unit) by sending
 * the book PDF straight to Gemini (built-in OCR reads the scanned pages) and
 * asking for structured JSON matching our CapsuleLayerContent shapes. The
 * result is validated leniently, then written to CapsuleLayer (replacing any
 * existing layers for that lesson).
 *
 * Requires GEMINI_API_KEY (free tier) and the book's PDF reachable via
 * Module.pdfUrl. Run per unit from the admin panel.
 */
import { z } from 'zod'

const bodySchema = z.object({
  lessonId: z.string().uuid()
})

const LAYER_ORDER = [
  'HOOK', 'DIAGNOSTIC', 'INTUITION', 'EXPLANATION', 'FORMALIZATION',
  'WALKTHROUGH', 'TRAINER', 'SCENARIO', 'TRAPS', 'TEACH_BACK', 'MASTERY_CHECK'
] as const

const LAYER_META: Record<string, { icon: string, accent: string, xp: number, min: number }> = {
  HOOK: { icon: 'i-lucide-sparkles', accent: 'amber', xp: 10, min: 1 },
  DIAGNOSTIC: { icon: 'i-lucide-stethoscope', accent: 'sky', xp: 15, min: 2 },
  INTUITION: { icon: 'i-lucide-wand-sparkles', accent: 'cyan', xp: 20, min: 4 },
  EXPLANATION: { icon: 'i-lucide-graduation-cap', accent: 'green', xp: 25, min: 6 },
  FORMALIZATION: { icon: 'i-lucide-book-open', accent: 'violet', xp: 15, min: 2 },
  WALKTHROUGH: { icon: 'i-lucide-lightbulb', accent: 'yellow', xp: 20, min: 4 },
  TRAINER: { icon: 'i-lucide-dumbbell', accent: 'emerald', xp: 30, min: 5 },
  SCENARIO: { icon: 'i-lucide-messages-square', accent: 'orange', xp: 30, min: 6 },
  TRAPS: { icon: 'i-lucide-alert-triangle', accent: 'rose', xp: 15, min: 2 },
  TEACH_BACK: { icon: 'i-lucide-megaphone', accent: 'pink', xp: 25, min: 4 },
  MASTERY_CHECK: { icon: 'i-lucide-trophy', accent: 'amber', xp: 40, min: 4 }
}

const layerSchema = z.object({
  layerType: z.enum(LAYER_ORDER),
  title: z.string().min(1).max(80),
  subtitle: z.string().max(120).optional().nullable(),
  content: z.record(z.string(), z.any()),
  completionCriteria: z.record(z.string(), z.any()).optional()
})
const respSchema = z.object({ layers: z.array(layerSchema).min(1).max(11) })

const buildPrompt = (unitTitle: string, grammar: string) => `
Ты — методист детской платформы английского для 1–6 классов. В PDF — учебник грамматики Access 1 (сканы страниц).
Найди в книге юнит «${unitTitle}» (тема: ${grammar}) и собери из него ОДИН интерактивный урок-«капсулу» из 11 слоёв.

Верни СТРОГО JSON вида: { "layers": [ { "layerType", "title", "subtitle", "content", "completionCriteria" }, ... ] }.
Ровно 11 слоёв в этом порядке layerType: HOOK, DIAGNOSTIC, INTUITION, EXPLANATION, FORMALIZATION, WALKTHROUGH, TRAINER, SCENARIO, TRAPS, TEACH_BACK, MASTERY_CHECK.
Весь обучающий контент на английском; подсказки/объяснения и title — на русском (дети — русскоязычные). Используй реальные слова/примеры/картинки-эмодзи из юнита.

Форма поля content по layerType (используй эти ключи):
- HOOK: { "kind":"HOOK","mediaKind":"fact","headline":"...","body":"...","bgPattern":"stars","emojiChoices":[{"id","emoji","label","isPrimary"}] }
- DIAGNOSTIC: { "kind":"DIAGNOSTIC","mode":"mcq","lives":3,"questions":[{"id","prompt","options":[..],"correctIndex","explanation"}] }  // 3-4 вопроса
- INTUITION: { "kind":"INTUITION","copy":{"headline","body"},"widget":{"type":"word-picture-match","pairs":[{"id","word","emoji"}]},"probes":[{"id","prompt","options","correctIndex"}] }
- EXPLANATION: { "kind":"EXPLANATION","chunks":[{"id","kind":"callout|text|tap-reveal","content","revealedContent"?,"revealedKind"?}],"checks":[{"id","prompt","options","correctIndex"}] }
- FORMALIZATION: { "kind":"FORMALIZATION","diagramTitle":"...","anatomy":[{"id","label","role","accent"}],"terms":[{"term","definition","example"}],"buildTask":{"prompt","template","expected":[..],"distractors":[..]} }
- WALKTHROUGH: { "kind":"WALKTHROUGH","intro":"...","examples":[{"id","problem","prefilledSteps":0,"steps":[{"index","title","explanation","visual":{"kind":"emoji","emoji":".."},"action":{"kind":"choice","prompt","options","correctIndex"}}]}] }
- TRAINER: { "kind":"TRAINER","targetCorrect":4,"problems":[{"kind":"choice","id","prompt","options","correctIndex"},{"kind":"tap-pair","id","prompt","left":[{"id","label"}],"right":[{"id","label","pairId"}]}] }  // 5-6 задач
- SCENARIO: { "kind":"SCENARIO","theme":"cafe","setting":{"title","roleplay","mascotLine"},"initialStats":{"revenue":0,"reputation":5,"customers":0},"orders":[{"id","customer","request","correct","wrongFeedback","revenueReward":10}] }
- TRAPS: { "kind":"TRAPS","mode":"flip","intro":"...","traps":[{"id","wrongStatement","whyWrong","correctStatement","rememberNote"}] }
- TEACH_BACK: { "kind":"TEACH_BACK","audiencePersona":"младшему брату","coverPrompts":[".."],"referenceAnswer":"...","requiredConcepts":[".."],"minSentences":2,"voiceFirst":true,"voicePrompt":"..." }
- MASTERY_CHECK: { "kind":"MASTERY_CHECK","passingScore":80,"retryAllowed":true,"trophyThresholds":{"gold":100,"silver":80,"bronze":60},"questions":[{"id","prompt","kind":"choice","options","correctIndex","conceptTag","cognitiveLevel":"apply"}] }  // 5 вопросов

completionCriteria по слою: HOOK/INTUITION {"minInteractions":1}; DIAGNOSTIC/EXPLANATION {"minAccuracy":50}; TRAINER {"minCorrect":4}; TEACH_BACK {"minLength":10}; MASTERY_CHECK {"minAccuracy":80}; остальные {}.
Только валидный JSON, без markdown-обёртки.
`.trim()

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const { lessonId } = await readValidatedBody(event, bodySchema.parse)

  if (!isGeminiAvailable()) {
    throw createError({ statusCode: 503, message: 'GEMINI_API_KEY не настроен' })
  }

  const supabase = useServerSupabase(event)

  // Load lesson → topic → book → first module PDF.
  const { data: lesson } = await supabase
    .from('PathLesson')
    .select('id, title, subtitle, pathTopicId')
    .eq('id', lessonId)
    .maybeSingle() as any
  if (!lesson) throw createError({ statusCode: 404, message: 'Урок не найден' })

  const { data: topic } = await supabase
    .from('PathTopic').select('id, name, bookId').eq('id', lesson.pathTopicId).maybeSingle() as any
  const bookId = topic?.bookId
  if (!bookId) throw createError({ statusCode: 400, message: 'Тема не привязана к книге' })

  const { data: modules } = await supabase
    .from('Module').select('pdfUrl').eq('bookId', bookId).order('order').limit(1) as any
  const pdfUrl = modules?.[0]?.pdfUrl as string | undefined
  if (!pdfUrl) throw createError({ statusCode: 400, message: 'У книги нет PDF (Module.pdfUrl)' })

  // Fetch the PDF bytes.
  const pdfRes = await fetch(pdfUrl)
  if (!pdfRes.ok) throw createError({ statusCode: 502, message: 'Не удалось скачать PDF книги' })
  const pdfB64 = Buffer.from(await pdfRes.arrayBuffer()).toString('base64')

  // Ask Gemini for the capsule JSON.
  const prompt = buildPrompt(lesson.title, lesson.subtitle ?? lesson.title)
  const data = await geminiGenerateContent('gemini-2.5-flash', {
    contents: [{
      parts: [
        { inlineData: { mimeType: 'application/pdf', data: pdfB64 } },
        { text: prompt }
      ]
    }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.4, maxOutputTokens: 8192 }
  })

  const rawText = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? ''
  let parsed: z.infer<typeof respSchema>
  try {
    parsed = respSchema.parse(JSON.parse(rawText))
  } catch (e) {
    throw createError({ statusCode: 502, message: `Gemini вернул невалидный JSON: ${(e as Error).message}` })
  }

  // Order + de-dupe by layerType, cap to canonical order.
  const byType = new Map<string, typeof parsed.layers[number]>()
  for (const l of parsed.layers) if (!byType.has(l.layerType)) byType.set(l.layerType, l)

  const rows = LAYER_ORDER
    .filter(t => byType.has(t))
    .map((t, idx) => {
      const l = byType.get(t)!
      const meta = LAYER_META[t]!
      return {
        lessonId,
        layerType: t,
        orderIndex: idx + 1,
        title: l.title,
        subtitle: l.subtitle ?? null,
        icon: meta.icon,
        accentColor: meta.accent,
        estimatedMinutes: meta.min,
        xpReward: meta.xp,
        content: { kind: t, ...l.content },
        completionCriteria: l.completionCriteria ?? {}
      }
    })

  if (!rows.length) throw createError({ statusCode: 502, message: 'Не удалось собрать слои' })

  // Replace existing layers for this lesson.
  await supabase.from('CapsuleLayer').delete().eq('lessonId', lessonId)
  const { error: insErr } = await supabase.from('CapsuleLayer').insert(rows as never)
  if (insErr) throw createError({ statusCode: 500, message: insErr.message })

  return { lessonId, layersCreated: rows.length, layerTypes: rows.map(r => r.layerType) }
})
