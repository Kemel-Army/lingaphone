/**
 * Seed REAL exercises for the pilot (pages 4 & 5 of Access 1), authored by
 * reading the rendered page images — accurate positions + answers, replacing
 * the placeholder demo. Use until Gemini quota frees the --detect-only path.
 *
 * Run: node --env-file=.env scripts/seed-pilot-exercises.mjs
 */
const MODULE_ID = 'a0000000-0000-4000-8000-000000000101'
const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY missing')

const H = { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }
const rest = async (path, { method = 'GET', body, prefer } = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method, headers: { ...H, ...(prefer ? { Prefer: prefer } : {}) }, body: body ? JSON.stringify(body) : undefined
  })
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const t = await res.text()
  return t ? JSON.parse(t) : null
}

// bbox normalised 0..1 (origin top-left), read off the rendered scans.
const PAGES = {
  4: [ // "The Indefinite Article a – an" — Ex 1, fill in a/an
    { x: 0.300, y: 0.560, w: 0.090, h: 0.026, accept: ['a'], prompt: 'a или an? (flag)', explanation: 'flag — согласная → a' },
    { x: 0.533, y: 0.560, w: 0.088, h: 0.026, accept: ['a'], prompt: 'a или an? (dog)', explanation: 'dog — согласная → a' },
    { x: 0.748, y: 0.560, w: 0.085, h: 0.026, accept: ['an'], prompt: 'a или an? (elephant)', explanation: 'elephant — гласная → an' },
    { x: 0.045, y: 0.735, w: 0.090, h: 0.026, accept: ['an'], prompt: 'a или an? (umbrella)', explanation: 'umbrella — гласная → an' },
    { x: 0.283, y: 0.735, w: 0.085, h: 0.026, accept: ['a'], prompt: 'a или an? (clown)', explanation: 'clown — согласная → a' },
    { x: 0.512, y: 0.735, w: 0.088, h: 0.026, accept: ['a'], prompt: 'a или an? (butterfly)', explanation: 'butterfly — согласная → a' },
    { x: 0.742, y: 0.735, w: 0.085, h: 0.026, accept: ['an'], prompt: 'a или an? (ice cream)', explanation: 'ice — гласная → an' }
  ],
  5: [ // "Personal Subject Pronouns" — Ex 1, fill in the subject pronoun
    { x: 0.290, y: 0.533, w: 0.150, h: 0.028, accept: ['they'], prompt: 'subject pronoun (two boys)', explanation: 'два мальчика → they' },
    { x: 0.515, y: 0.500, w: 0.150, h: 0.028, accept: ['it'], prompt: 'subject pronoun (teddy)', explanation: 'предмет → it' },
    { x: 0.755, y: 0.533, w: 0.150, h: 0.028, accept: ['she'], prompt: 'subject pronoun (girl)', explanation: 'девушка → she' },
    { x: 0.045, y: 0.693, w: 0.150, h: 0.028, accept: ['it'], prompt: 'subject pronoun (bird)', explanation: 'животное → it' },
    { x: 0.300, y: 0.693, w: 0.150, h: 0.028, accept: ['they'], prompt: 'subject pronoun (balloons)', explanation: 'много → they' },
    { x: 0.515, y: 0.693, w: 0.150, h: 0.028, accept: ['he'], prompt: 'subject pronoun (man)', explanation: 'мужчина → he' },
    { x: 0.740, y: 0.720, w: 0.150, h: 0.028, accept: ['they'], prompt: 'subject pronoun (two people)', explanation: 'двое → they' }
  ]
}

// clear demo/old exercises on the content pages first
const pages = await rest(`BookPage?moduleId=eq.${MODULE_ID}&select=id,pageNumber`)
const byNum = Object.fromEntries(pages.map(p => [p.pageNumber, p.id]))
const targetIds = [3, 4, 5].map(n => byNum[n]).filter(Boolean)
if (targetIds.length) {
  await rest(`PageExercise?pageId=in.(${targetIds.join(',')})`, { method: 'DELETE' })
}

let total = 0
for (const [num, list] of Object.entries(PAGES)) {
  const pageId = byNum[num]
  if (!pageId) {
    console.log(`no BookPage for page ${num}`)
    continue
  }
  let order = 0
  for (const ex of list) {
    const [row] = await rest('PageExercise', {
      method: 'POST', prefer: 'return=representation',
      body: { pageId, kind: 'BLANK', x: ex.x, y: ex.y, w: ex.w, h: ex.h, prompt: ex.prompt, options: [], orderIndex: order++ }
    })
    await rest('PageExerciseAnswer?on_conflict=exerciseId', {
      method: 'POST', prefer: 'resolution=merge-duplicates',
      body: { exerciseId: row.id, answerKey: { accept: ex.accept }, explanation: ex.explanation }
    })
  }
  total += order
  console.log(`page ${num}: ${order} exercises`)
}
console.log(`\nDONE: ${total} real exercises seeded on pages 4 & 5`)
