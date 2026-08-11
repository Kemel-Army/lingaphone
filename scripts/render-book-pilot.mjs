/**
 * Headless pilot renderer for the interactive book.
 *
 * Rasterises a page range of a local PDF (pdfjs-dist@5 + @napi-rs/canvas —
 * the OpenJPEG/JBIG2 wasm decodes the JPEG2000 scans), uploads each page PNG to
 * the `books` bucket, inserts BookPage rows, then asks Gemini to locate the
 * exercises and seeds PageExercise (+ answer key). If Gemini is unavailable
 * (e.g. 429 free-tier quota), a small demo exercise set is seeded instead so
 * the student view is visibly interactive now. Result: a ready book at
 * /student/book with no browser render step.
 *
 * Run:  node --env-file=.env scripts/render-book-pilot.mjs [fromPage] [toPage]
 * Idempotent: wipes the module's existing BookPage rows (cascades) first.
 */
import fs from 'node:fs'
import { createCanvas, DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas'

// pdfjs v5 (legacy build = Node-friendly) needs a few DOM globals present.
globalThis.DOMMatrix = DOMMatrix
globalThis.ImageData = ImageData
globalThis.Path2D = Path2D

const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')

// ── Config ────────────────────────────────────────────────────
const MODULE_ID = 'a0000000-0000-4000-8000-000000000101' // Access 1 — Grammar Book
const PDF_PATH = 'public/books/access-1-gb.pdf'
const WASM_DIR = 'public/pdfjs-wasm'
const DETECT_ONLY = process.argv.includes('--detect-only')
const numArgs = process.argv.slice(2).filter(a => !a.startsWith('--'))
const FROM = Number(numArgs[0] || 1)
const TO = Number(numArgs[1] || 10)
const SCALE = 2

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const GEMINI_KEY = process.env.GEMINI_API_KEY
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY missing in .env')

// pdfjs's wasm image decoders are flaky in Node's fake-worker context. A file://
// wasmUrl makes Node's fetch throw (unsupported scheme), so pdfjs falls back to
// its pure-JS OpenJPEG/JBIG2 decoders (*_nowasm_fallback.js next to the wasm) —
// which reliably decode the JPEG2000 scans here.
void WASM_DIR
const WASM_URL = 'file://' + process.cwd().replace(/\\/g, '/') + '/public/pdfjs-wasm/'

// ── Supabase REST helpers (service role, bypasses RLS) ────────
const restHeaders = { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }
const rest = async (path, { method = 'GET', body, prefer } = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { ...restHeaders, ...(prefer ? { Prefer: prefer } : {}) },
    body: body ? JSON.stringify(body) : undefined
  })
  if (!res.ok) throw new Error(`REST ${method} ${path} → ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const text = await res.text()
  return text ? JSON.parse(text) : null
}
const uploadPng = async (path, buf) => {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/books/${path}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY, 'Content-Type': 'image/png', 'x-upsert': 'true' },
    body: buf
  })
  if (!res.ok) throw new Error(`storage upload ${path} → ${res.status}: ${(await res.text()).slice(0, 300)}`)
  return `${SUPABASE_URL}/storage/v1/object/public/books/${path}`
}
const addExercise = async (pageId, ex, order) => {
  const [exRow] = await rest('PageExercise', {
    method: 'POST', prefer: 'return=representation',
    body: {
      pageId, kind: ex.kind,
      x: clamp01(ex.x), y: clamp01(ex.y),
      w: Math.min(1, clamp01(ex.w) || 0.1), h: Math.min(1, clamp01(ex.h) || 0.04),
      prompt: typeof ex.prompt === 'string' ? ex.prompt.slice(0, 500) : null,
      options: Array.isArray(ex.options) ? ex.options : [],
      orderIndex: order
    }
  })
  await rest('PageExerciseAnswer?on_conflict=exerciseId', {
    method: 'POST', prefer: 'resolution=merge-duplicates',
    body: {
      exerciseId: exRow.id,
      answerKey: ex.answerKey && typeof ex.answerKey === 'object' ? ex.answerKey : {},
      explanation: typeof ex.explanation === 'string' ? ex.explanation.slice(0, 500) : null
    }
  })
}

// ── Gemini vision detect (best-effort; stops after a 429) ─────
let geminiDead = !GEMINI_KEY
const DETECT_PROMPT = `You are annotating a scanned page of an English grammar workbook to make it interactive.
Find every place where a STUDENT writes or chooses an answer (fill-in-the-blank lines, gaps, multiple-choice to circle, true/false, short answers).
Return STRICT JSON { "exercises": [ { "kind": "BLANK"|"CHOICE"|"TRUE_FALSE"|"MATCH"|"SHORT_TEXT", "x":num,"y":num,"w":num,"h":num (bounding box of the ANSWER area, NORMALISED 0..1, origin TOP-LEFT), "prompt":string, "options":[{"id":string,"label":string}] (CHOICE only, else []), "answerKey":object (BLANK/SHORT_TEXT:{"accept":[..]}; CHOICE:{"correctId":str}; TRUE_FALSE:{"value":bool}; MATCH:{"accept":[..]}), "explanation":string } ] }
The box must cover the empty answer space, not the printed question. Best guess for the answer. Only confident items. If none: {"exercises":[]}.`
const detect = async (b64) => {
  if (geminiDead) return []
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: { 'x-goog-api-key': GEMINI_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ inlineData: { mimeType: 'image/png', data: b64 } }, { text: DETECT_PROMPT }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: 8192 }
      })
    })
    if (res.status === 429) {
      geminiDead = true
      console.log('   gemini 429 (daily quota) → switching to demo seed')
      return []
    }
    if (!res.ok) {
      console.log(`   gemini ${res.status}`)
      return []
    }
    const data = await res.json()
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
    // Salvage against markdown fences / trailing truncation.
    text = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
    const s = text.indexOf('{')
    const e = text.lastIndexOf('}')
    if (s >= 0 && e > s) text = text.slice(s, e + 1)
    const parsed = JSON.parse(text)
    return Array.isArray(parsed?.exercises) ? parsed.exercises : []
  } catch (e) {
    console.log(`   gemini parse/err: ${String(e).slice(0, 80)}`)
    return []
  }
}

const KINDS = new Set(['BLANK', 'CHOICE', 'TRUE_FALSE', 'MATCH', 'SHORT_TEXT'])
const clamp01 = n => Math.min(1, Math.max(0, Number(n) || 0))

// A tiny, clearly-marked demo set placed on a page when AI detection is
// unavailable — visible proof the overlay works; positions are meant to be
// fine-tuned in the admin editor (or replaced by re-running detect).
const demoFor = pageNumber => ([
  { kind: 'BLANK', x: 0.30, y: 0.30, w: 0.14, h: 0.035, prompt: 'демо: впиши слово', answerKey: { accept: ['is', 'are'] }, explanation: 'демо-поле' },
  { kind: 'CHOICE', x: 0.30, y: 0.50, w: 0.30, h: 0.05, prompt: 'демо: выбери', options: [{ id: 'a', label: 'a' }, { id: 'b', label: 'an' }, { id: 'c', label: 'the' }], answerKey: { correctId: 'b' }, explanation: 'демо-поле' },
  { kind: 'TRUE_FALSE', x: 0.30, y: 0.68, w: 0.12, h: 0.045, prompt: 'демо: верно?', answerKey: { value: true }, explanation: 'демо-поле' }
].map((e, i) => ({ ...e, _demoPage: pageNumber, _order: i })))

// ── Detect-only: re-run exercise detection over already-rendered pages ──
// Use after the Gemini daily quota resets (or with a paid key) to replace the
// demo fields with real book exercises — no re-render:
//   node --env-file=.env scripts/render-book-pilot.mjs --detect-only
if (DETECT_ONLY) {
  if (geminiDead) throw new Error('GEMINI_API_KEY missing — detect needs it')
  const pages = await rest(`BookPage?moduleId=eq.${MODULE_ID}&select=id,pageNumber,imageUrl&order=pageNumber`)
  console.log(`detect-only: ${pages.length} pages`)
  let total = 0
  for (const p of pages) {
    const img = await fetch(p.imageUrl)
    const b64 = Buffer.from(await img.arrayBuffer()).toString('base64')
    const found = (await detect(b64)).filter(ex => KINDS.has(ex?.kind))
    await rest(`PageExercise?pageId=eq.${p.id}`, { method: 'DELETE' })
    let order = 0
    for (const ex of found) await addExercise(p.id, ex, order++)
    total += order
    console.log(`  p${p.pageNumber}: ${order} exercises`)
    if (geminiDead) {
      console.log('  (quota hit — stopping)')
      break
    }
  }
  console.log(`\nDETECT DONE: ${total} exercises`)
  process.exit(0)
}

// ── Main (render) ─────────────────────────────────────────────
console.log(`Render ${PDF_PATH} pages ${FROM}–${TO} → module ${MODULE_ID}`)
await rest(`BookPage?moduleId=eq.${MODULE_ID}`, { method: 'DELETE' })
console.log('cleared existing BookPage rows')

const data = new Uint8Array(fs.readFileSync(PDF_PATH))
const doc = await getDocument({ data, wasmUrl: WASM_URL, isEvalSupported: false, useSystemFonts: true }).promise
console.log(`PDF loaded: ${doc.numPages} pages, wasm at ${WASM_URL}`)

const to = Math.min(TO, doc.numPages)
let totalExercises = 0
const pageIds = {} // pageNumber → { id }

for (let n = FROM; n <= to; n++) {
  const page = await doc.getPage(n)
  const viewport = page.getViewport({ scale: SCALE })
  const width = Math.ceil(viewport.width)
  const height = Math.ceil(viewport.height)
  const canvas = createCanvas(width, height)
  await page.render({ canvasContext: canvas.getContext('2d'), viewport, canvas }).promise
  const png = await canvas.encode('png')

  const imageUrl = await uploadPng(`pages/${MODULE_ID}/${n}.png`, png)
  const [row] = await rest('BookPage?on_conflict=moduleId,pageNumber', {
    method: 'POST', prefer: 'resolution=merge-duplicates,return=representation',
    body: { moduleId: MODULE_ID, pageNumber: n, imageUrl, imageWidth: width, imageHeight: height }
  })
  pageIds[n] = row.id

  let order = 0
  for (const ex of await detect(png.toString('base64'))) {
    if (!KINDS.has(ex?.kind)) continue
    await addExercise(row.id, ex, order++)
  }
  totalExercises += order
  console.log(`  p${n}: ${width}×${height} • ${Math.round(png.length / 1024)}KB • ${order} exercises`)
}

// Fallback: no AI exercises → seed a small demo set on two content pages.
if (totalExercises === 0) {
  const demoPages = [FROM + 2, FROM + 3].filter(p => pageIds[p])
  for (const p of demoPages) {
    let order = 0
    for (const ex of demoFor(p)) await addExercise(pageIds[p], ex, order++)
    totalExercises += order
  }
  console.log(`seeded demo exercises on pages ${demoPages.join(', ')} (AI quota unavailable)`)
}

await rest(`Module?id=eq.${MODULE_ID}`, { method: 'PATCH', body: { pageCount: to } })
console.log(`\nDONE: ${to - FROM + 1} pages, ${totalExercises} exercises. Student view ready at /student/book`)
