/**
 * Populate lesson units from the user-provided document (10стр.md). The user
 * supplied the text + answers; this script just arranges that provided content
 * into the platform's lesson structure (rules → intro, tasks → interactive
 * exercises with answer keys). No images (per request).
 *
 * Run: node --env-file=.env scripts/seed-content.mjs
 * Replaces the module's existing units.
 */
const MODULE_ID = 'a0000000-0000-4000-8000-000000000101'
const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('env missing')
const H = { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }
const rest = async (path, { method = 'GET', body, prefer } = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method, headers: { ...H, ...(prefer ? { Prefer: prefer } : {}) }, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const t = await res.text()
  return t ? JSON.parse(t) : null
}
let _n = 0
const oid = () => `o${_n++}`

// ── exercise builders ─────────────────────────────────────────
const rule = t => ({ type: 'rule', text: t })
const examples = arr => ({ type: 'examples', items: arr })
const text = t => ({ type: 'text', text: t })

const fill = (instruction, items) => ({
  type: 'FILL_BLANK', instruction,
  content: { items: items.map(it => ({ before: it.before ?? '', after: it.after ?? '', image: '' })) },
  answerKey: { items: items.map(it => ({ accept: it.accept })) },
  explanation: ''
})
const choose = (instruction, items) => {
  const c = { items: [] }
  const k = { items: [] }
  for (const it of items) {
    const opts = it.options.map(l => ({ id: oid(), label: l }))
    const correct = opts.find(o => o.label === it.correct)
    c.items.push({ before: it.before ?? '', after: it.after ?? '', options: opts })
    k.items.push({ correctId: correct?.id ?? '' })
  }
  return { type: 'CHOOSE', instruction, content: c, answerKey: k, explanation: '' }
}
const sort = (instruction, columns, items) => {
  const cols = columns.map(l => ({ id: oid(), label: l }))
  const cItems = []
  const placement = {}
  for (const it of items) {
    const id = oid()
    cItems.push({ id, label: it.label, image: '' })
    placement[id] = cols.find(c => c.label === it.col)?.id ?? cols[0].id
  }
  return { type: 'SORT_COLUMNS', instruction, content: { columns: cols, items: cItems }, answerKey: { placement }, explanation: '' }
}
const match = (instruction, pairs) => {
  const left = []
  const right = []
  const pk = []
  for (const [l, r] of pairs) {
    const id = oid()
    left.push({ id, label: l })
    right.push({ id, label: r })
    pk.push({ l: id, r: id })
  }
  // shuffle right (stable) so it's a real task
  right.sort((a, b) => a.label.length - b.label.length || a.label.localeCompare(b.label))
  return { type: 'MATCH_PAIRS', instruction, content: { left, right }, answerKey: { pairs: pk }, explanation: '' }
}
const reorder = (instruction, jumble, correct) => ({
  type: 'REORDER', instruction, content: { tiles: jumble }, answerKey: { order: correct }, explanation: ''
})
const short = (instruction, question, accept) => ({
  type: 'SHORT_TEXT', instruction, content: { question }, answerKey: { accept }, explanation: ''
})
const mcq = (question, options, correct) => {
  const opts = options.map(l => ({ id: oid(), label: l, image: '' }))
  return { type: 'MCQ', instruction: '', content: { question, options: opts }, answerKey: { correctId: opts[correct].id }, explanation: '' }
}

// ── content (arranged from the user's document) ───────────────
const UNITS = [
  {
    title: 'Раздел 1. Неопределённый артикль a / an',
    subtitle: 'a / an',
    intro: [
      rule('Мы используем an перед словами, которые начинаются с гласного звука (a, e, i, o, u).'),
      examples(['an atlas', 'an eraser', 'an orange']),
      rule('Мы используем a перед словами, которые начинаются с согласного звука (b, c, d, f, g, h, j, k, l, m, n, p, q, r, s, t, v, w, x, y, z).'),
      examples(['a notebook', 'a pen'])
    ],
    exercises: [
      fill('Задание 1. Вставьте a или an (по образцу: an orange).', [
        { after: 'flag', accept: ['a'] }, { after: 'dog', accept: ['a'] }, { after: 'elephant', accept: ['an'] },
        { after: 'umbrella', accept: ['an'] }, { after: 'clown', accept: ['a'] }, { after: 'butterfly', accept: ['a'] }, { after: 'ice cream', accept: ['an'] }
      ]),
      sort('Задание 2. Распределите слова в две колонки: A и An.', ['A', 'An'], [
        { label: 'apple', col: 'An' }, { label: 'football', col: 'A' }, { label: 'notebook', col: 'A' }, { label: 'atlas', col: 'An' },
        { label: 'umbrella', col: 'An' }, { label: 'pencil', col: 'A' }, { label: 'book', col: 'A' }, { label: 'eraser', col: 'An' }
      ])
    ]
  },
  {
    title: 'Раздел 2. Личные местоимения',
    subtitle: 'Subject / Object pronouns',
    intro: [
      rule('Субъектные (Subject): I, you, he, she, it, we, you, they. I — всегда с заглавной; he — мужчины/мальчики; she — женщины/девочки; it — животные/предметы; we — люди; they — люди, животные, предметы.'),
      rule('Объектные (Object): me, you, him, her, it, us, you, them.')
    ],
    exercises: [
      fill('Задание 1. Впишите субъектное местоимение (по образцу: зонт → it).', [
        { before: 'девочка →', accept: ['she'] }, { before: 'птица →', accept: ['it'] }, { before: 'мужчина и женщина →', accept: ['they'] }
      ]),
      choose('Задание 2. Выберите правильное местоимение.', [
        { before: 'This is my umbrella.', after: 'is red.', options: ['I', 'It'], correct: 'It' },
        { before: 'This is Peter.', after: 'is fourteen.', options: ['She', 'He'], correct: 'He' },
        { before: 'This is Laura and Rose.', after: 'are my friends.', options: ['They', 'She'], correct: 'They' },
        { before: 'This is Tom and I\'m Steven. Look at', after: '.', options: ['us', 'them'], correct: 'us' },
        { before: 'This is Rex and Spot.', after: 'are my dogs.', options: ['It', 'They'], correct: 'They' },
        { before: 'Look at', after: '. She\'s Kathy.', options: ['she', 'her'], correct: 'her' },
        { before: 'This is my notebook.', after: 'is blue.', options: ['It', 'They'], correct: 'It' },
        { before: 'This is Tony. Come and meet', after: '.', options: ['he', 'him'], correct: 'him' }
      ])
    ]
  },
  {
    title: 'Раздел 3. Глагол to be (am / is / are)',
    subtitle: 'Формы глагола «быть»',
    intro: [
      rule('Утвердительная: I am, you are, he/she/it is, we/you/they are. Краткая: I\'m, you\'re, he\'s, she\'s, it\'s, we\'re, they\'re.'),
      rule('Отрицательная: I am not, you aren\'t, he/she/it isn\'t, we/you/they aren\'t.'),
      rule('Вопрос: Am I…? Are you…? Is he/she/it…? Are we/you/they…? Короткие ответы: Yes, she is. (полная форма), No, she isn\'t. (краткая).')
    ],
    exercises: [
      fill('Задание 1. Вставьте \'m/am, \'s/is, \'re/are (образец: She\'s / is Susan).', [
        { before: 'I', after: 'twelve.', accept: ['am', '\'m'] }, { before: 'You', after: 'my friend.', accept: ['are', '\'re'] },
        { before: 'It', after: 'a pencil.', accept: ['is', '\'s'] }, { before: 'They', after: 'brothers.', accept: ['are', '\'re'] },
        { before: 'We', after: 'twins.', accept: ['are', '\'re'] }, { before: 'He', after: 'Paul.', accept: ['is', '\'s'] }, { before: 'She', after: 'from England.', accept: ['is', '\'s'] }
      ]),
      fill('Задание 2. Заполните пропуски (am / is / are). Текст про Rita (1) is …).', [
        { before: 'I', after: 'eleven years old', accept: ['am', '\'m'] }, { before: 'and I', after: 'from the UK', accept: ['am', '\'m'] },
        { before: 'I', after: 'a student', accept: ['am', '\'m'] }, { before: 'My favourite subjects', after: 'Geography and Music', accept: ['are', '\'re'] },
        { before: 'My favourite colour', after: 'pink', accept: ['is', '\'s'] }, { before: 'my favourite day', after: 'Saturday', accept: ['is', '\'s'] },
        { before: 'Helen and Sophie', after: 'my best friends', accept: ['are', '\'re'] }
      ]),
      fill('Задание 3. Заполните пропуски в диалоге (am / is / are).', [
        { before: 'Excuse me.', after: 'you Betty Williams?', accept: ['Are', 'are'] }, { before: 'Yes, I', after: '.', accept: ['am', '\'m'] },
        { before: 'Who', after: 'you?', accept: ['are', '\'re'] }, { before: 'I', after: 'Kelly Philips.', accept: ['am', '\'m'] },
        { before: 'Where', after: 'Ann?', accept: ['is', '\'s'] }, { before: '', after: 'she here?', accept: ['Is', 'is'] },
        { before: 'Yes, she', after: '.', accept: ['is', '\'s'] }, { before: 'She', after: 'in the gym.', accept: ['is', '\'s'] }
      ]),
      fill('Задание 4. Мини-диалоги по анкете (Amanda 17/Art/Australia · John 16/History/South Africa · Mark 18/Science/New Zealand). Образец: Are you sixteen, John? — Yes, I am.', [
        { before: 'Amanda:', after: 'Mark eighteen?', accept: ['Is'] },
        { before: 'John: Yes, he', after: '.', accept: ['is'] },
        { before: 'John: What', after: 'your favourite school subject, Amanda?', accept: ['is', '\'s'] },
        { before: 'Amanda:', after: 'Art.', accept: ['It\'s', 'It is'] },
        { before: 'John:', after: 'Mark\'s favourite school subject English?', accept: ['Is'] },
        { before: 'Amanda: No, it', after: '.', accept: ['isn\'t'] },
        { before: 'Mark: Where', after: 'you from, John?', accept: ['are', '\'re'] },
        { before: 'John: I', after: 'from South Africa.', accept: ['am', '\'m'] },
        { before: 'Mark:', after: 'Amanda from New Zealand?', accept: ['Is'] },
        { before: 'John: No, she', after: '.', accept: ['isn\'t'] },
        { before: 'She', after: 'from Australia.', accept: ['is', '\'s'] }
      ]),
      choose('Задание 5. Выберите (подчеркните) правильную форму to be.', [
        { before: 'I\'m from Ireland. I am', after: 'from England.', options: ['not', 'isn\'t'], correct: 'not' },
        { before: 'We', after: 'in Grade 6.', options: ['isn\'t', 'aren\'t'], correct: 'aren\'t' },
        { before: '\'Are Philip and Helen teachers?\' \'Yes, they', after: '.\'', options: ['are', 'is'], correct: 'are' },
        { before: 'He', after: 'my brother.', options: ['aren\'t', 'isn\'t'], correct: 'isn\'t' },
        { before: 'They', after: 'my best friends.', options: ['\'re', '\'s'], correct: '\'re' },
        { before: '\'Are you new to the school, John?\' \'Yes, I', after: '.\'', options: ['is', 'am'], correct: 'am' },
        { before: '', after: 'they in your class?', options: ['Are', 'Is'], correct: 'Are' },
        { before: '', after: 'she from Canada?', options: ['Is', 'Are'], correct: 'Is' }
      ]),
      fill('Задание 6. Отрицание + верное утверждение (образец: Are they oranges? — No, they aren\'t. — They\'re lemons).', [
        { before: '', after: 'a computer?', accept: ['Is it'] },
        { before: 'No,', after: '.', accept: ['it isn\'t'] },
        { before: '', after: 'a clock.', accept: ['It\'s', 'It is'] },
        { before: '', after: 'pens?', accept: ['Are they'] },
        { before: 'No,', after: '.', accept: ['they aren\'t'] },
        { before: '', after: 'crayons.', accept: ['They\'re', 'They are'] },
        { before: '', after: 'a student?', accept: ['Is he', 'Is she'] },
        { before: 'No,', after: '.', accept: ['he isn\'t', 'she isn\'t'] },
        { before: '', after: 'a teacher.', accept: ['He\'s', 'She\'s', 'He is', 'She is'] }
      ]),
      short('Задание 7 (1). Напишите вопрос. Ответ: «Yes, I am. My cousin is twelve, too.»',
        'Ответ: Yes, I am. My cousin is twelve, too.', ['Are you twelve?', 'Are you 12?', 'Are you twelve years old?']),
      short('Задание 7 (2). Напишите вопрос. Ответ: «No, he isn\'t. He\'s my brother.»',
        'Ответ: No, he isn\'t. He\'s my brother.', ['Is he your father?', 'Is he your dad?', 'Is he your friend?']),
      short('Задание 7 (3). Напишите вопрос. Ответ: «Yes, they are. They\'re from Ireland.»',
        'Ответ: Yes, they are. They\'re from Ireland.', ['Are they from Ireland?']),
      fill('Задание 8. Напишите краткие ответы (по таблице; образец: Is Katherine fourteen? → Yes, she is).', [
        { before: 'Is George from Canada?', accept: ['No, he isn\'t'] },
        { before: 'Is James from Ireland?', accept: ['Yes, he is'] },
        { before: 'Is Katherine from the USA?', accept: ['No, she isn\'t'] },
        { before: 'Is James nineteen years old?', accept: ['Yes, he is'] },
        { before: 'Are George and Marie twenty years old?', accept: ['Yes, they are'] }
      ]),
      match('Задание 9. Соотнесите вопросы с ответами.', [
        ['Are they students?', 'No, they aren\'t.'],
        ['Is Tom from the UK?', 'No, he isn\'t.'],
        ['Is Mary nineteen years old?', 'Yes, she is.'],
        ['Are you a teacher?', 'No, I\'m not.'],
        ['Are we in class 2E?', 'Yes, we are.']
      ]),
      fill('Задание 10. Заполните пропуски (are, is, \'s, \'re, \'m, aren\'t, isn\'t).', [
        { before: 'A:', after: 'you from Ireland?', accept: ['Are'] },
        { before: 'B: No, I', after: 'not.', accept: ['\'m', 'am'] },
        { before: 'I', after: 'from Australia.', accept: ['\'m', 'am'] },
        { before: 'A:', after: 'your name Philip?', accept: ['Is'] },
        { before: 'B: No, it', after: '.', accept: ['isn\'t'] },
        { before: 'It', after: 'Peter.', accept: ['\'s', 'is'] },
        { before: 'A: Who', after: 'your favourite singer?', accept: ['is', '\'s'] },
        { before: 'B: It', after: 'Britney Spears.', accept: ['\'s', 'is'] },
        { before: 'She', after: 'from the USA.', accept: ['\'s', 'is'] },
        { before: 'A: How old', after: 'your brothers?', accept: ['are', '\'re'] },
        { before: 'B: Jack', after: 'six', accept: ['\'s', 'is'] },
        { before: 'and Steven', after: 'nine.', accept: ['\'s', 'is'] },
        { before: 'A:', after: 'they good at tennis?', accept: ['Are'] },
        { before: 'B: No, they', after: '.', accept: ['aren\'t'] },
        { before: 'They', after: 'good at football.', accept: ['\'re', 'are'] }
      ]),
      reorder('Задание 11. Расставьте слова по порядку (образец: He is an actor).',
        ['is', 'favourite', 'blue', 'your', 'colour'], ['Is', 'your', 'favourite', 'colour', 'blue']),
      reorder('Задание 11 (2).', ['not', 'they', 'Canada', 'are', 'from'], ['They', 'are', 'not', 'from', 'Canada']),
      reorder('Задание 11 (3).', ['from', 'are', 'Australia', 'you'], ['Are', 'you', 'from', 'Australia']),
      reorder('Задание 11 (4).', ['twelve', 'are', 'we', 'not'], ['We', 'are', 'not', 'twelve'])
    ]
  },
  {
    title: 'Раздел 4. Анализ грамматики',
    subtitle: 'Текст + практика',
    intro: [
      text('My name\'s Brenda and I\'m from the USA. I\'m twenty-three years old and I\'m a singer. My best friend is Kate. She\'s from Canada. Kate\'s 25 years old and she\'s a teacher. Kate\'s sister\'s Mandy and her brother\'s Jack. Mandy\'s 18 and Jack\'s 19. Mandy and Jack are students. They\'re very nice. We\'re all very good friends.')
    ],
    exercises: [
      fill('Упражнение 1. Краткие ответы по тексту (образец: Is Brenda from the USA? → Yes, she is).', [
        { before: 'Is Mandy a singer?', accept: ['No, she isn\'t'] },
        { before: 'Is Kate from Canada?', accept: ['Yes, she is'] },
        { before: 'Is Jack 20 years old?', accept: ['No, he isn\'t'] },
        { before: 'Are Kate and Jack brother and sister?', accept: ['No, they aren\'t'] },
        { before: 'Are Brenda and Mandy friends?', accept: ['Yes, they are'] }
      ]),
      choose('Упражнение 2. Постройте верные утверждения по тексту — выберите is или isn\'t. (В источнике 3-я колонка обрезана; предикаты взяты из текста.)', [
        { before: 'Brenda', after: 'a singer.', options: ['is', 'isn\'t'], correct: 'is' },
        { before: 'Jack', after: 'a teacher.', options: ['is', 'isn\'t'], correct: 'isn\'t' },
        { before: 'Kate', after: 'from Canada.', options: ['is', 'isn\'t'], correct: 'is' },
        { before: 'Mandy', after: 'a student.', options: ['is', 'isn\'t'], correct: 'is' },
        { before: 'Brenda', after: 'from Canada.', options: ['is', 'isn\'t'], correct: 'isn\'t' },
        { before: 'Jack', after: '18 years old.', options: ['is', 'isn\'t'], correct: 'isn\'t' }
      ]),
      fill('Упражнение 3. Заполните пропуски (is / isn\'t / are / aren\'t).', [
        { before: 'Brenda', after: 'a singer.', accept: ['is', '\'s'] }, { before: 'Jack', after: '14 years old.', accept: ['isn\'t'] },
        { before: 'Brenda and Mandy', after: 'sisters.', accept: ['aren\'t'] }, { before: 'Mandy', after: 'Jack\'s sister.', accept: ['is', '\'s'] },
        { before: 'Jack', after: 'Brenda\'s brother.', accept: ['isn\'t'] }, { before: 'Kate and Jack', after: 'brother and sister.', accept: ['aren\'t'] }
      ])
    ]
  },
  {
    title: 'Тестовый блок (Revision)',
    subtitle: 'Выберите правильный вариант',
    intro: [rule('Выберите один правильный вариант (A, B или C).')],
    exercises: [
      mcq('___ Cathy from Ireland?', ['Is', 'Are', 'Am'], 0),
      mcq('What ___ your favourite school subject?', ['is', 'am', 'are'], 0),
      mcq('We ___ from New Zealand.', ['isn\'t', 'am not', 'aren\'t'], 2),
      mcq('___ they from England?', ['Are', 'Is', 'Am'], 0),
      mcq('«Is she a teacher?» «Yes, she ___.»', ['isn\'t', 'is', 'aren\'t'], 1),
      mcq('This is ___ apple.', ['a', 'an', '–'], 1),
      mcq('Where ___ Betty and Thomas from?', ['am', 'is', 'are'], 2),
      mcq('This is ___ atlas.', ['a', 'an', '–'], 1),
      mcq('Look at ___ . She\'s Kathy.', ['she', 'he', 'her'], 2),
      mcq('It\'s ___ notebook.', ['a', 'an', '–'], 0),
      mcq('This ___ my friend.', ['am', 'is', 'are'], 1),
      mcq('«Are you from Australia?» «Yes, ___»', ['I\'m.', 'No, I\'m not.', 'I am.'], 2),
      mcq('«Who is ___?» «Mr Walter.»', ['it', 'he', 'him'], 1),
      mcq('My name ___ Kevin.', ['am', 'are', 'is'], 2),
      mcq('How old ___ you?', ['is', 'am', 'are'], 2),
      mcq('Look at Tom and Pete. Look at ___ .', ['him', 'they', 'them'], 2),
      mcq('Steve and Mary ___ 20 years old.', ['\'m not', 'isn\'t', 'aren\'t'], 2),
      mcq('«Is this a ruler?» «Yes, ___»', ['he is.', 'they are.', 'it is.'], 2),
      mcq('«Is he your brother?» «No, he ___»', ['is', 'isn\'t', 'aren\'t'], 1),
      mcq('«Are they students?» «Yes, ___»', ['we are', 'you are', 'they are'], 2)
    ]
  }
]

// ── insert ────────────────────────────────────────────────────
await rest(`LessonUnit?moduleId=eq.${MODULE_ID}`, { method: 'DELETE' })
console.log('cleared existing units')
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
      body: { unitId: urow.id, orderIndex: e++, type: ex.type, instruction: ex.instruction, content: ex.content, xp: 10 }
    })
    await rest('LessonExerciseAnswer?on_conflict=exerciseId', {
      method: 'POST', prefer: 'resolution=merge-duplicates',
      body: { exerciseId: exrow.id, answerKey: ex.answerKey, explanation: ex.explanation ?? '' }
    })
  }
  console.log(`«${unit.title}»: ${unit.exercises.length} заданий`)
}
console.log(`\nDONE: ${UNITS.length} units from the provided document`)
