import { describe, expect, it } from 'vitest'
import {
  PLACEMENT_TESTS,
  normalizeText,
  questionWeight,
  scoreQuestion,
  scorePlacement,
  levelFor,
  type PlacementAgeBand,
  type PlacementAnswers,
  type MatchQuestion,
  type ChoiceQuestion,
  type OrderQuestion,
  type ShortQuestion
} from '../../app/shared/lib/placementTest'

const BANDS: PlacementAgeBand[] = ['AGE_6_9', 'AGE_9_12', 'AGE_12_16']

/** Полностью верные ответы для теста возрастной группы. */
const perfectAnswers = (band: PlacementAgeBand): PlacementAnswers => {
  const out: PlacementAnswers = {}
  for (const q of PLACEMENT_TESTS[band].questions) {
    switch (q.kind) {
      case 'MATCH':
        out[q.id] = { kind: 'MATCH', pairs: { ...q.key } }
        break
      case 'CHOICE':
        out[q.id] = { kind: 'CHOICE', index: q.correctIndex }
        break
      case 'ORDER':
        // Восстанавливаем порядок из первого принимаемого варианта.
        out[q.id] = { kind: 'ORDER', order: q.accepted[0]!.split(' ') }
        break
      case 'SHORT':
        out[q.id] = { kind: 'SHORT', text: q.accepted[0]! }
        break
      case 'OPEN':
        out[q.id] = { kind: 'OPEN', text: 'my answer' }
        break
    }
  }
  return out
}

describe('placement test — банк вопросов', () => {
  it.each(BANDS)('%s: у каждого вопроса уникальный id', (band) => {
    const ids = PLACEMENT_TESTS[band].questions.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(BANDS)('%s: ключ MATCH покрывает все левые слова и ссылается на существующие правые', (band) => {
    const matches = PLACEMENT_TESTS[band].questions.filter((q): q is MatchQuestion => q.kind === 'MATCH')
    expect(matches.length).toBeGreaterThan(0)
    for (const q of matches) {
      const rightIds = new Set(q.right.map(r => r.id))
      expect(Object.keys(q.key).sort()).toEqual(q.left.map(l => l.id).sort())
      // Один перевод не может быть ответом на два слова.
      const used = Object.values(q.key)
      expect(new Set(used).size).toBe(used.length)
      for (const r of used) expect(rightIds.has(r)).toBe(true)
    }
  })

  it.each(BANDS)('%s: correctIndex у CHOICE в границах списка вариантов', (band) => {
    const choices = PLACEMENT_TESTS[band].questions.filter((q): q is ChoiceQuestion => q.kind === 'CHOICE')
    for (const q of choices) {
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(q.options.length)
    }
  })

  it.each(BANDS)('%s: принимаемый ответ ORDER состоит ровно из выданных плиток', (band) => {
    const orders = PLACEMENT_TESTS[band].questions.filter((q): q is OrderQuestion => q.kind === 'ORDER')
    for (const q of orders) {
      for (const accepted of q.accepted) {
        expect(accepted.split(' ').sort()).toEqual(q.tiles.map(normalizeText).sort())
      }
    }
  })

  it.each(BANDS)('%s: варианты SHORT уже нормализованы', (band) => {
    const shorts = PLACEMENT_TESTS[band].questions.filter((q): q is ShortQuestion => q.kind === 'SHORT')
    for (const q of shorts) {
      expect(q.accepted.length).toBeGreaterThan(0)
      for (const a of q.accepted) expect(normalizeText(a)).toBe(a)
    }
  })
})

describe('normalizeText', () => {
  it('снимает регистр, пунктуацию и лишние пробелы', () => {
    expect(normalizeText('  His name is TOM.  ')).toBe('his name is tom')
    expect(normalizeText('It’s a "dog" — yes!')).toBe('it s a dog yes')
  })
})

describe('scoreQuestion', () => {
  const band: PlacementAgeBand = 'AGE_6_9'
  const q = PLACEMENT_TESTS[band].questions

  it('MATCH считает по каждой верной паре, а не «всё или ничего»', () => {
    const match = q.find((x): x is MatchQuestion => x.kind === 'MATCH')!
    const [first, second] = Object.entries(match.key)
    const half = { [first![0]]: first![1], [second![0]]: second![1] }
    expect(scoreQuestion(match, { kind: 'MATCH', pairs: half })).toBe(2)
    expect(scoreQuestion(match, { kind: 'MATCH', pairs: { ...match.key } })).toBe(match.left.length)
  })

  it('MATCH не даёт балл за перепутанную пару', () => {
    const match = q.find((x): x is MatchQuestion => x.kind === 'MATCH')!
    const wrong = Object.fromEntries(match.left.map(l => [l.id, 'r-nope']))
    expect(scoreQuestion(match, { kind: 'MATCH', pairs: wrong })).toBe(0)
  })

  it('SHORT принимает ответ независимо от регистра и точки', () => {
    const short = q.find((x): x is ShortQuestion => x.id === 'a69-p3-1')!
    expect(scoreQuestion(short, { kind: 'SHORT', text: 'Tom.' })).toBe(1)
    expect(scoreQuestion(short, { kind: 'SHORT', text: '  HIS NAME IS TOM  ' })).toBe(1)
    expect(scoreQuestion(short, { kind: 'SHORT', text: 'Max' })).toBe(0)
  })

  it('ORDER засчитывает только верный порядок слов', () => {
    const order = q.find((x): x is OrderQuestion => x.kind === 'ORDER')!
    expect(scoreQuestion(order, { kind: 'ORDER', order: ['My', 'name', 'is', 'Anna'] })).toBe(1)
    expect(scoreQuestion(order, { kind: 'ORDER', order: ['name', 'My', 'is', 'Anna'] })).toBe(0)
  })

  it('«затрудняюсь ответить» (null) — всегда ноль, для любого типа', () => {
    for (const question of q) expect(scoreQuestion(question, null)).toBe(0)
  })

  it('OPEN не приносит баллов и не входит в максимум', () => {
    const open = q.find(x => x.kind === 'OPEN')!
    expect(questionWeight(open)).toBe(0)
    expect(scoreQuestion(open, { kind: 'OPEN', text: 'a perfect essay' })).toBe(0)
  })
})

describe('scorePlacement', () => {
  it.each(BANDS)('%s: полностью верные ответы дают 100%% и верхний уровень', (band) => {
    const r = scorePlacement(band, perfectAnswers(band))
    expect(r.autoScore).toBe(r.autoMax)
    expect(r.percent).toBe(100)
    expect(r.skippedCount).toBe(0)
    expect(r.recommendedLevel).toBe(levelFor(band, 100))
  })

  it.each(BANDS)('%s: пустые ответы дают 0%% и нижний уровень, все вопросы считаются пропущенными', (band) => {
    const r = scorePlacement(band, {})
    expect(r.autoScore).toBe(0)
    expect(r.percent).toBe(0)
    expect(r.skippedCount).toBe(PLACEMENT_TESTS[band].questions.length)
    expect(r.recommendedLevel).toBe(levelFor(band, 0))
  })

  it('собирает развёрнутые ответы для преподавателя, включая пропущенные', () => {
    const answers = perfectAnswers('AGE_12_16')
    const openIds = PLACEMENT_TESTS.AGE_12_16.questions.filter(q => q.kind === 'OPEN').map(q => q.id)
    answers[openIds[0]!] = null

    const r = scorePlacement('AGE_12_16', answers)
    expect(r.openAnswers).toHaveLength(openIds.length)
    expect(r.openAnswers.find(o => o.questionId === openIds[0])!.text).toBe('')
    expect(r.openAnswers.find(o => o.questionId === openIds[1])!.text).toBe('my answer')
    // Пропуск OPEN не должен уменьшать максимум — он и так не оценивается.
    expect(r.autoScore).toBe(r.autoMax)
  })

  it('ответ на несуществующий вопрос не влияет на счёт', () => {
    const clean = scorePlacement('AGE_6_9', perfectAnswers('AGE_6_9'))
    const dirty = scorePlacement('AGE_6_9', { ...perfectAnswers('AGE_6_9'), 'not-a-question': { kind: 'CHOICE', index: 0 } })
    expect(dirty.autoScore).toBe(clean.autoScore)
    expect(dirty.autoMax).toBe(clean.autoMax)
  })
})

describe('levelFor', () => {
  it('одинаковый процент означает разный уровень в разных возрастах', () => {
    expect(levelFor('AGE_6_9', 75)).toBe('A2')
    expect(levelFor('AGE_9_12', 75)).toBe('B1')
    expect(levelFor('AGE_12_16', 75)).toBe('B2')
  })

  it('пороги 40 и 70 включительно', () => {
    expect(levelFor('AGE_9_12', 39)).toBe('A1')
    expect(levelFor('AGE_9_12', 40)).toBe('A2')
    expect(levelFor('AGE_9_12', 69)).toBe('A2')
    expect(levelFor('AGE_9_12', 70)).toBe('B1')
  })
})
