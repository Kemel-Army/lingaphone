/**
 * Seed 3 DEMO lesson units (original example content + emoji) covering all 9
 * native exercise widgets, so the student player can be shown end-to-end.
 * These are illustrative examples authored for the demo — real licensed book
 * content is entered later via the admin editor.
 *
 * Run: node --env-file=.env scripts/seed-lessons.mjs
 * Idempotent: wipes the module's existing LessonUnits (cascades) first.
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
const opt = (id, label) => ({ id, label })

const UNITS = [
  {
    title: 'Артикль a / an',
    subtitle: 'Когда a, а когда an',
    intro: [
      { type: 'rule', text: 'a — перед согласным звуком: a dog, a cat, a book.' },
      { type: 'rule', text: 'an — перед гласным звуком (a, e, i, o, u): an apple, an egg, an orange.' },
      { type: 'examples', items: ['a car', 'an umbrella', 'a house', 'an elephant'] }
    ],
    exercises: [
      {
        type: 'FILL_BLANK', instruction: 'Впиши a или an', xp: 10,
        content: { items: [
          { image: '🍎', after: 'apple' },
          { image: '🐶', after: 'dog' },
          { image: '🐘', after: 'elephant' },
          { image: '☂️', after: 'umbrella' }
        ] },
        answerKey: { items: [{ accept: ['an'] }, { accept: ['a'] }, { accept: ['an'] }, { accept: ['an'] }] },
        explanation: 'Перед гласным звуком — an, перед согласным — a.'
      },
      {
        type: 'CHOOSE', instruction: 'Выбери правильный артикль', xp: 10,
        content: { items: [
          { before: 'It is', after: 'orange.', options: [opt('a', 'a'), opt('an', 'an')] },
          { before: 'I have', after: 'car.', options: [opt('a', 'a'), opt('an', 'an')] },
          { before: 'She eats', after: 'egg.', options: [opt('a', 'a'), opt('an', 'an')] }
        ] },
        answerKey: { items: [{ correctId: 'an' }, { correctId: 'a' }, { correctId: 'an' }] },
        explanation: 'orange и egg начинаются с гласного → an.'
      },
      {
        type: 'SORT_COLUMNS', instruction: 'Разложи слова по столбцам', xp: 15,
        content: {
          columns: [opt('a', 'a'), opt('an', 'an')],
          items: [
            { id: 'apple', image: '🍎', label: 'apple' },
            { id: 'dog', image: '🐶', label: 'dog' },
            { id: 'egg', image: '🥚', label: 'egg' },
            { id: 'car', image: '🚗', label: 'car' },
            { id: 'orange', image: '🍊', label: 'orange' },
            { id: 'book', image: '📚', label: 'book' }
          ]
        },
        answerKey: { placement: { apple: 'an', dog: 'a', egg: 'an', car: 'a', orange: 'an', book: 'a' } },
        explanation: 'apple, egg, orange → an; dog, car, book → a.'
      },
      {
        type: 'WORD_IMAGE_MATCH', instruction: 'Соедини слово с картинкой', xp: 15,
        content: { pairs: [
          { id: 'apple', word: 'apple', image: '🍎' },
          { id: 'dog', word: 'dog', image: '🐶' },
          { id: 'sun', word: 'sun', image: '☀️' },
          { id: 'cat', word: 'cat', image: '🐱' }
        ] },
        answerKey: { placement: { apple: 'apple', dog: 'dog', sun: 'sun', cat: 'cat' } },
        explanation: 'Каждое слово к своей картинке.'
      }
    ]
  },
  {
    title: 'Личные местоимения',
    subtitle: 'I, you, he, she, it, we, they',
    intro: [
      { type: 'rule', text: 'he — мальчик/мужчина, she — девочка/женщина, it — предмет или животное.' },
      { type: 'rule', text: 'we — мы, they — они (люди, животные, предметы во множественном).' },
      { type: 'examples', items: ['He is a boy', 'She is a girl', 'It is a cat', 'They are friends'] }
    ],
    exercises: [
      {
        type: 'FILL_BLANK', instruction: 'Впиши местоимение (He / She / It)', xp: 10,
        content: { items: [
          { image: '👦', after: 'is a boy.' },
          { image: '👧', after: 'is a girl.' },
          { image: '🐱', after: 'is a cat.' }
        ] },
        answerKey: { items: [{ accept: ['He'] }, { accept: ['She'] }, { accept: ['It'] }] },
        explanation: 'Мальчик → He, девочка → She, животное/предмет → It.'
      },
      {
        type: 'MCQ', instruction: 'Какое местоимение подходит?', xp: 10,
        content: { image: '👨‍👩‍👧', question: 'Семья — это…', options: [opt('they', 'they'), opt('he', 'he'), opt('it', 'it')] },
        answerKey: { correctId: 'they' },
        explanation: 'Несколько людей → they.'
      },
      {
        type: 'MATCH_PAIRS', instruction: 'Соедини местоимение и значение', xp: 15,
        content: {
          left: [opt('he', 'he'), opt('she', 'she'), opt('it', 'it'), opt('they', 'they')],
          right: [opt('boy', 'мальчик 👦'), opt('girl', 'девочка 👧'), opt('thing', 'предмет 📦'), opt('people', 'люди 👥')]
        },
        answerKey: { pairs: [{ l: 'he', r: 'boy' }, { l: 'she', r: 'girl' }, { l: 'it', r: 'thing' }, { l: 'they', r: 'people' }] },
        explanation: 'he↔мальчик, she↔девочка, it↔предмет, they↔люди.'
      },
      {
        type: 'TRUE_FALSE', instruction: 'Верно или нет?', xp: 10,
        content: { statement: '«He» используется для девочки.' },
        answerKey: { value: false },
        explanation: '«He» — для мальчика/мужчины. Для девочки — «She».'
      }
    ]
  },
  {
    title: 'Глагол to be (am / is / are)',
    subtitle: 'Формы глагола «быть»',
    intro: [
      { type: 'rule', text: 'I am · he/she/it is · we/you/they are.' },
      { type: 'examples', items: ['I am happy', 'She is nice', 'They are friends'] }
    ],
    exercises: [
      {
        type: 'FILL_BLANK', instruction: 'Впиши am / is / are', xp: 10,
        content: { items: [
          { before: 'I', after: 'happy.' },
          { before: 'She', after: 'nice.' },
          { before: 'They', after: 'friends.' }
        ] },
        answerKey: { items: [{ accept: ['am', '\'m'] }, { accept: ['is', '\'s'] }, { accept: ['are', '\'re'] }] },
        explanation: 'I am, she is, they are.'
      },
      {
        type: 'CHOOSE', instruction: 'Выбери правильную форму', xp: 10,
        content: { items: [
          { before: 'You', after: 'my friend.', options: [opt('is', 'is'), opt('are', 'are')] },
          { before: 'It', after: 'a dog.', options: [opt('is', 'is'), opt('are', 'are')] }
        ] },
        answerKey: { items: [{ correctId: 'are' }, { correctId: 'is' }] },
        explanation: 'you are, it is.'
      },
      {
        type: 'REORDER', instruction: 'Собери предложение', xp: 15,
        content: { tiles: ['is', 'She', 'teacher', 'a'] },
        answerKey: { order: ['She', 'is', 'a', 'teacher'] },
        explanation: 'She is a teacher.'
      },
      {
        type: 'SHORT_TEXT', instruction: 'Впиши недостающий глагол', xp: 10,
        content: { question: 'We ___ students. (форма to be)' },
        answerKey: { accept: ['are', '\'re'] },
        explanation: 'we are students.'
      }
    ]
  }
]

// ── wipe + insert ─────────────────────────────────────────────
await rest(`LessonUnit?moduleId=eq.${MODULE_ID}`, { method: 'DELETE' })
console.log('cleared existing LessonUnits')

let u = 0
for (const unit of UNITS) {
  const [urow] = await rest('LessonUnit', {
    method: 'POST', prefer: 'return=representation',
    body: { moduleId: MODULE_ID, title: unit.title, subtitle: unit.subtitle, orderIndex: u++, intro: unit.intro }
  })
  let e = 0
  for (const ex of unit.exercises) {
    const [exrow] = await rest('LessonExercise', {
      method: 'POST', prefer: 'return=representation',
      body: { unitId: urow.id, orderIndex: e++, type: ex.type, instruction: ex.instruction, content: ex.content, xp: ex.xp ?? 10 }
    })
    await rest('LessonExerciseAnswer?on_conflict=exerciseId', {
      method: 'POST', prefer: 'resolution=merge-duplicates',
      body: { exerciseId: exrow.id, answerKey: ex.answerKey, explanation: ex.explanation ?? null }
    })
  }
  console.log(`unit «${unit.title}»: ${unit.exercises.length} exercises`)
}
console.log(`\nDONE: ${UNITS.length} units seeded`)
