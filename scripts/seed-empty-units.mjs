/**
 * Seed 10 EMPTY book-style page templates (units) for the module — structure
 * only, no content. Each has a rule block + a picture-fill grid + a choose row,
 * all blank. The admin opens each in the editor and fills their own text /
 * images / answers. (Structure/functionality is built here; content is entered
 * by the user.)
 *
 * Run: node --env-file=.env scripts/seed-empty-units.mjs
 * Replaces the module's existing units.
 */
const MODULE_ID = 'a0000000-0000-4000-8000-000000000101'
const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('env missing')
const H = { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }
const rest = async (path, { method = 'GET', body, prefer } = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method, headers: { ...H, ...(prefer ? { Prefer: prefer } : {}) }, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const t = await res.text(); return t ? JSON.parse(t) : null
}
let n = 0
const oid = () => `o${Date.now()}${n++}`

// one empty page template: rule + 4-picture fill grid + one choose row
const emptyExercises = () => {
  const g = () => ({ before: '', after: '', image: '' })
  const o = () => ({ id: oid(), label: '' })
  return [
    {
      type: 'FILL_BLANK', instruction: '', xp: 10,
      content: { items: [g(), g(), g(), g()] },
      answerKey: { items: [{ accept: [] }, { accept: [] }, { accept: [] }, { accept: [] }] }, explanation: ''
    },
    {
      type: 'CHOOSE', instruction: '', xp: 10,
      content: { items: [{ before: '', after: '', options: [o(), o()] }] },
      answerKey: { items: [{ correctId: '' }] }, explanation: ''
    }
  ]
}

await rest(`LessonUnit?moduleId=eq.${MODULE_ID}`, { method: 'DELETE' })
console.log('cleared existing units')

for (let i = 1; i <= 10; i++) {
  const [u] = await rest('LessonUnit', {
    method: 'POST', prefer: 'return=representation',
    body: { moduleId: MODULE_ID, title: `Страница ${i}`, subtitle: '', orderIndex: i - 1, intro: [{ type: 'rule', text: '' }] }
  })
  let order = 0
  for (const ex of emptyExercises()) {
    const [row] = await rest('LessonExercise', {
      method: 'POST', prefer: 'return=representation',
      body: { unitId: u.id, orderIndex: order++, type: ex.type, instruction: ex.instruction, content: ex.content, xp: ex.xp }
    })
    await rest('LessonExerciseAnswer?on_conflict=exerciseId', {
      method: 'POST', prefer: 'resolution=merge-duplicates',
      body: { exerciseId: row.id, answerKey: ex.answerKey, explanation: ex.explanation }
    })
  }
  console.log(`Страница ${i}: template ready`)
}
console.log('\nDONE: 10 empty page templates')
