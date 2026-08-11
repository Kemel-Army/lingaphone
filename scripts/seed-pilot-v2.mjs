/**
 * Seed the NEW interaction types on their real pages:
 *   page 7 Ex5 = UNDERLINE (underline the correct verb form, 8 items)
 *   page 8 Ex9 = MATCH (connect questions ↔ answers, 5 pairs)
 * Positions read off the rendered scans; refine via screenshot loop.
 * Keeps pages 4 & 5 (BLANK fill-ins) untouched.
 *
 * Run: node --env-file=.env scripts/seed-pilot-v2.mjs
 */
const MODULE_ID = 'a0000000-0000-4000-8000-000000000101'
const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('env missing')
const H = { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }
const rest = async (path, { method = 'GET', body, prefer } = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method, headers: { ...H, ...(prefer ? { Prefer: prefer } : {}) }, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const t = await res.text()
  return t ? JSON.parse(t) : null
}

// ── Page 7 Ex5: UNDERLINE the correct form (two options per item) ──
// opt = {id, x, y, w, h}; correctId names the right one.
const OW = 0.05, OH = 0.022
const u = (n, ax, bx, y, correct) => ({
  kind: 'UNDERLINE',
  x: 0.53, y, w: 0.02, h: 0.02, // nominal anchor (feedback bubble)
  prompt: `подчеркни верное (${n})`,
  options: [{ id: `${n}a`, x: ax, y, w: OW, h: OH }, { id: `${n}b`, x: bx, y, w: OW, h: OH }],
  correctId: `${n}${correct}`,
  explanation: 'верная форма глагола to be'
})
const PAGE7 = [
  u(1, 0.695, 0.755, 0.205, 'a'), // not / isn't → not
  u(2, 0.595, 0.655, 0.238, 'b'), // isn't / aren't → aren't
  u(3, 0.655, 0.705, 0.285, 'a'), // are / is → are
  u(4, 0.595, 0.655, 0.315, 'b'), // aren't / isn't → isn't
  u(5, 0.605, 0.650, 0.340, 'a'), // 're / 's → 're
  u(6, 0.605, 0.650, 0.390, 'b'), // is / am → am
  u(7, 0.555, 0.600, 0.415, 'a'), // Are / Is → Are
  u(8, 0.555, 0.605, 0.440, 'b') // Is / Are → Are
]

// ── Page 8 Ex9: MATCH questions ↔ answers ──
const L = (n, y) => ({ id: `l${n}`, side: 'L', x: 0.045, y, w: 0.04, h: 0.02 })
const R = (id, y) => ({ id: `r${id}`, side: 'R', x: 0.285, y, w: 0.05, h: 0.02 })
const PAGE8_MATCH = {
  kind: 'MATCH',
  x: 0.045, y: 0.79, w: 0.02, h: 0.02,
  prompt: 'соедини вопрос с ответом',
  options: [
    L(1, 0.815), L(2, 0.845), L(3, 0.878), L(4, 0.918), L(5, 0.945),
    R('a', 0.815), R('b', 0.845), R('c', 0.875), R('d', 0.905), R('e', 0.940)
  ],
  // 1→b, 2→c, 3→a, 4→e, 5→d
  pairs: [{ l: 'l1', r: 'rb' }, { l: 'l2', r: 'rc' }, { l: 'l3', r: 'ra' }, { l: 'l4', r: 're' }, { l: 'l5', r: 'rd' }],
  explanation: 'вопрос ↔ короткий ответ'
}

const pages = await rest(`BookPage?moduleId=eq.${MODULE_ID}&select=id,pageNumber`)
const byNum = Object.fromEntries(pages.map(p => [p.pageNumber, p.id]))

const addExercise = async (pageId, ex, order) => {
  const [row] = await rest('PageExercise', {
    method: 'POST', prefer: 'return=representation',
    body: { pageId, kind: ex.kind, x: ex.x, y: ex.y, w: ex.w, h: ex.h, prompt: ex.prompt, options: ex.options ?? [], orderIndex: order }
  })
  const answerKey = ex.kind === 'MATCH' ? { pairs: ex.pairs } : ex.kind === 'UNDERLINE' || ex.kind === 'CHOICE' ? { correctId: ex.correctId } : { accept: ex.accept ?? [] }
  await rest('PageExerciseAnswer?on_conflict=exerciseId', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { exerciseId: row.id, answerKey, explanation: ex.explanation ?? null } })
}

// page 7
if (byNum[7]) {
  await rest(`PageExercise?pageId=eq.${byNum[7]}`, { method: 'DELETE' })
  let o = 0
  for (const ex of PAGE7) await addExercise(byNum[7], ex, o++)
  console.log(`page 7: ${PAGE7.length} UNDERLINE`)
}
// page 8
if (byNum[8]) {
  await rest(`PageExercise?pageId=eq.${byNum[8]}`, { method: 'DELETE' })
  await addExercise(byNum[8], PAGE8_MATCH, 0)
  console.log('page 8: 1 MATCH (5 pairs)')
}
console.log('DONE v2')
