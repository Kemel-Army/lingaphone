import { describe, it, expect } from 'vitest'
import {
  computeMotivation,
  medalForAverage,
  monthKey,
  monthRange
} from '../../server/utils/motivation'

/**
 * Числа взяты из реальной Google-таблицы «Сводные по мотивашке», лист
 * «Сводная таблица сентябрь» — если расчёт разойдётся с ней, менеджеры
 * получат не те бонусы.
 */
describe('medalForAverage', () => {
  it('раздаёт медали по границам из таблицы', () => {
    expect(medalForAverage(2.69)).toEqual({ medal: 'NONE', payout: 0 })
    expect(medalForAverage(2.7)).toEqual({ medal: 'BRONZE', payout: 1000 })
    expect(medalForAverage(3.79)).toEqual({ medal: 'BRONZE', payout: 1000 })
    expect(medalForAverage(3.8)).toEqual({ medal: 'SILVER', payout: 3000 })
    expect(medalForAverage(4.59)).toEqual({ medal: 'SILVER', payout: 3000 })
    expect(medalForAverage(4.6)).toEqual({ medal: 'GOLD', payout: 5000 })
    expect(medalForAverage(5)).toEqual({ medal: 'GOLD', payout: 5000 })
  })

  it('не выдаёт медаль за балл выше шкалы', () => {
    expect(medalForAverage(5.5)).toEqual({ medal: 'NONE', payout: 0 })
  })

  it('повторяет строки сентябрьской сводной', () => {
    expect(medalForAverage(4.42).payout).toBe(3000) // Абдолла Едилхан
    expect(medalForAverage(4.67).payout).toBe(5000) // Әнуарбек Жасұлан
    expect(medalForAverage(3.91).payout).toBe(3000) // Байтугаев Самир
    expect(medalForAverage(5.0).payout).toBe(5000) // Боровицина Томирис
  })
})

describe('computeMotivation', () => {
  const base = {
    gradeSum: 0,
    gradesCount: 0,
    attendedLessons: 0,
    subscriptionLessons: 0,
    instagram: false,
    paidOnTime: true,
    books: false
  }

  it('идеальный месяц со всеми параметрами даёт ровно 5.0 и золото', () => {
    // 8 уроков × 5 критериев × 5 баллов = 200; 200 / 8 = 25 за занятие.
    const r = computeMotivation({
      ...base,
      gradeSum: 200,
      gradesCount: 40,
      attendedLessons: 8,
      subscriptionLessons: 8,
      instagram: true,
      paidOnTime: true,
      books: true
    })
    expect(r.teacherAvg).toBe(25)
    expect(r.average).toBe(5)
    expect(r.medal).toBe('GOLD')
    expect(r.payout).toBe(5000)
  })

  it('делит на абонемент, когда пропусков больше, чем посещений', () => {
    // Ходил 4 раза из 8 оплаченных — средний балл падает вдвое.
    const r = computeMotivation({
      ...base,
      gradeSum: 100,
      gradesCount: 20,
      attendedLessons: 4,
      subscriptionLessons: 8
    })
    expect(r.lessonsCounted).toBe(8)
    expect(r.teacherAvg).toBe(12.5)
    expect(r.average).toBe(2.19)
    expect(r.medal).toBe('NONE')
  })

  it('считает по факту посещений, если их больше абонемента (отработки)', () => {
    const r = computeMotivation({
      ...base,
      gradeSum: 125,
      gradesCount: 25,
      attendedLessons: 5,
      subscriptionLessons: 4
    })
    expect(r.lessonsCounted).toBe(5)
    expect(r.teacherAvg).toBe(25)
  })

  it('без оплаты вовремя ученик не участвует', () => {
    const r = computeMotivation({
      ...base,
      gradeSum: 200,
      gradesCount: 40,
      attendedLessons: 8,
      subscriptionLessons: 8,
      instagram: true,
      books: true,
      paidOnTime: false
    })
    expect(r.participates).toBe(false)
    expect(r.average).toBe(0)
    expect(r.medal).toBe('NONE')
    expect(r.payout).toBe(0)
  })

  it('каждый менеджерский параметр добавляет 5/8 = 0.625 балла', () => {
    const without = computeMotivation({
      ...base,
      gradeSum: 100,
      gradesCount: 20,
      attendedLessons: 5,
      subscriptionLessons: 5
    })
    const withInstagram = computeMotivation({
      ...base,
      gradeSum: 100,
      gradesCount: 20,
      attendedLessons: 5,
      subscriptionLessons: 5,
      instagram: true
    })
    // Оба балла округлены до сотых, поэтому разница «гуляет» на ~0.005.
    expect(withInstagram.average - without.average).toBeCloseTo(0.625, 1)
  })

  it('не делит на ноль, когда занятий в месяце не было', () => {
    const r = computeMotivation({ ...base, gradeSum: 0, attendedLessons: 0, subscriptionLessons: 0 })
    expect(r.lessonsCounted).toBe(0)
    expect(r.teacherAvg).toBe(0)
    expect(r.average).toBe(0.63) // только балл за оплату
  })

  it('не выпускает средний балл выше 5', () => {
    const r = computeMotivation({
      ...base,
      gradeSum: 500,
      gradesCount: 40,
      attendedLessons: 8,
      subscriptionLessons: 8,
      instagram: true,
      books: true
    })
    expect(r.average).toBe(5)
  })
})

describe('monthKey / monthRange', () => {
  it('отдаёт ключ YYYY-MM — формат MonthlyMedal.month', () => {
    expect(monthKey('2026-09-17T10:00:00.000Z')).toBe('2026-09')
  })

  it('дополняет однозначный месяц нулём', () => {
    expect(monthKey('2026-01-05T00:00:00.000Z')).toBe('2026-01')
  })

  it('отдаёт полуинтервал [начало месяца, начало следующего)', () => {
    const { from, to } = monthRange('2026-09')
    expect(from).toBe('2026-09-01T00:00:00.000Z')
    expect(to).toBe('2026-10-01T00:00:00.000Z')
  })

  it('переходит через год в декабре', () => {
    const { to } = monthRange('2026-12')
    expect(to).toBe('2027-01-01T00:00:00.000Z')
  })
})
