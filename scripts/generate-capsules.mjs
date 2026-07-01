/**
 * Batch capsule generator (Gemini vision → CapsuleLayer rows).
 * Reads the local book PDF, asks Gemini for an 11-layer capsule per lesson,
 * validates loosely, and writes to Supabase via PostgREST (service role).
 *
 * Run:  node --env-file=.env scripts/generate-capsules.mjs <pdfPath> [lessonId ...]
 * With no lessonIds → generates every Access 1 lesson that has 0 layers.
 */
import { readFileSync } from 'node:fs'

const GEMINI_KEY = process.env.GEMINI_API_KEY
const SB_URL = process.env.SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_KEY
if (!GEMINI_KEY || !SB_URL || !SB_KEY) {
  console.error('Missing GEMINI_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const BOOK_ID = 'a0000000-0000-4000-8000-000000000001'
const pdfPath = process.argv[2] ?? 'Access_1_GB.pdf'
const pdfB64 = readFileSync(pdfPath).toString('base64')

// ── PostgREST helpers ──
const sbHeaders = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' }
const sbGet = async (path) => {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: sbHeaders })
  if (!res.ok) throw new Error(`SB GET ${res.status}: ${await res.text()}`)
  return res.json()
}
const sbDelete = async (path) => {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { method: 'DELETE', headers: sbHeaders })
  if (!res.ok) throw new Error(`SB DELETE ${res.status}: ${await res.text()}`)
}
const sbInsert = async (table, rows) => {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...sbHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify(rows)
  })
  if (!res.ok) throw new Error(`SB INSERT ${res.status}: ${await res.text()}`)
}

const LAYER_ORDER = ['HOOK', 'DIAGNOSTIC', 'INTUITION', 'EXPLANATION', 'FORMALIZATION', 'WALKTHROUGH', 'TRAINER', 'SCENARIO', 'TRAPS', 'TEACH_BACK', 'MASTERY_CHECK']
const LAYER_META = {
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

const buildPrompt = (unitTitle) => `
Ты — методист детской платформы английского для 1–6 классов. В PDF — учебник грамматики Access 1 (сканы страниц).
Найди в книге юнит «${unitTitle}» и собери из него ОДИН интерактивный урок-«капсулу» из 11 слоёв.

Верни СТРОГО JSON вида: { "layers": [ { "layerType", "title", "subtitle", "content", "completionCriteria" }, ... ] }.
Ровно 11 слоёв в этом порядке layerType: HOOK, DIAGNOSTIC, INTUITION, EXPLANATION, FORMALIZATION, WALKTHROUGH, TRAINER, SCENARIO, TRAPS, TEACH_BACK, MASTERY_CHECK.
Весь обучающий контент на английском; подсказки/объяснения и title — на русском (дети — русскоязычные). Используй реальные слова/примеры из юнита; для картинок используй эмодзи.

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

const gemini = async (model, body, attempt = 0) => {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': GEMINI_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    if ((res.status === 503 || res.status === 429 || res.status === 500) && attempt < 4) {
      const wait = 5000 * (attempt + 1)
      console.log(`  …Gemini ${res.status}, retry in ${wait / 1000}s`)
      await new Promise(r => setTimeout(r, wait))
      return gemini(model, body, attempt + 1)
    }
    throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
  return res.json()
}

const genLesson = async (lessonId, title) => {
  const data = await gemini('gemini-2.5-flash', {
    contents: [{ parts: [{ inlineData: { mimeType: 'application/pdf', data: pdfB64 } }, { text: buildPrompt(title) }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.4, maxOutputTokens: 16384 }
  })
  const raw = data?.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? ''
  const parsed = JSON.parse(raw)
  const layers = parsed.layers ?? []

  const byType = new Map()
  for (const l of layers) if (l?.layerType && !byType.has(l.layerType)) byType.set(l.layerType, l)

  const rows = LAYER_ORDER.filter(t => byType.has(t)).map((t, idx) => {
    const l = byType.get(t)
    const meta = LAYER_META[t]
    return {
      lessonId, layerType: t, orderIndex: idx + 1,
      title: String(l.title ?? t).slice(0, 80),
      subtitle: l.subtitle ? String(l.subtitle).slice(0, 120) : null,
      icon: meta.icon, accentColor: meta.accent, estimatedMinutes: meta.min, xpReward: meta.xp,
      content: { kind: t, ...(l.content ?? {}) },
      completionCriteria: l.completionCriteria ?? {}
    }
  })
  if (!rows.length) throw new Error('no layers parsed')

  await sbDelete(`CapsuleLayer?lessonId=eq.${lessonId}`)
  await sbInsert('CapsuleLayer', rows)
  return rows.map(r => r.layerType)
}

// ── Resolve targets ──
let targets = []
const argIds = process.argv.slice(3)
if (argIds.length) {
  targets = await sbGet(`PathLesson?id=in.(${argIds.join(',')})&select=id,title`)
} else {
  const topics = await sbGet(`PathTopic?bookId=eq.${BOOK_ID}&select=id`)
  const topicIds = topics.map(t => t.id)
  const lessons = await sbGet(`PathLesson?pathTopicId=in.(${topicIds.join(',')})&select=id,title`)
  const withLayers = await sbGet('CapsuleLayer?select=lessonId')
  const filled = new Set(withLayers.map(r => r.lessonId))
  targets = lessons.filter(l => !filled.has(l.id))
}

console.log(`Targets: ${targets.length}`)
let ok = 0, fail = 0
for (const t of targets) {
  try {
    const types = await genLesson(t.id, t.title)
    ok++
    console.log(`✓ ${t.title} — ${types.length} layers [${types.join(',')}]`)
  } catch (e) {
    fail++
    console.log(`✗ ${t.title} — ${e.message}`)
  }
  await new Promise(r => setTimeout(r, 4000))
}
console.log(`\nDone. ok=${ok} fail=${fail}`)
