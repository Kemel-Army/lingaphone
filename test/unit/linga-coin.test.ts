import { describe, expect, it } from 'vitest'
import {
  coinMedal,
  COIN_MEDALS,
  COIN_REASONS,
  COIN_REASON_MAP,
  AWARD_REASONS
} from '../../app/entities/linga-coin/model/types'

describe('coinMedal (ТЗ разд. 8 пороги)', () => {
  it('нет медали ниже бронзы', () => {
    const m = coinMedal(500)
    expect(m.current).toBeNull()
    expect(m.next?.key).toBe('BRONZE')
    expect(m.toNext).toBe(500)
  })

  it('бронза от 1000', () => {
    const m = coinMedal(1200)
    expect(m.current?.key).toBe('BRONZE')
    expect(m.next?.key).toBe('SILVER')
    expect(m.toNext).toBe(1800)
  })

  it('серебро от 3000, золото от 5000', () => {
    expect(coinMedal(3000).current?.key).toBe('SILVER')
    expect(coinMedal(3500).next?.key).toBe('GOLD')
    expect(coinMedal(5000).current?.key).toBe('GOLD')
  })

  it('золото — максимум, следующей нет, прогресс 100%', () => {
    const m = coinMedal(6000)
    expect(m.current?.key).toBe('GOLD')
    expect(m.next).toBeNull()
    expect(m.progressPct).toBe(100)
  })

  it('прогресс внутри полосы', () => {
    expect(coinMedal(2000).progressPct).toBe(50)
    expect(coinMedal(1000).progressPct).toBe(0)
  })
})

describe('coin reasons', () => {
  it('у каждой причины есть мета', () => {
    for (const r of COIN_REASONS) expect(COIN_REASON_MAP[r.value]).toBe(r)
  })

  it('AWARD_REASONS исключают авто-причины', () => {
    const vals = AWARD_REASONS.map(r => r.value)
    expect(vals).not.toContain('PURCHASE')
    expect(vals).not.toContain('MEDAL')
    expect(vals).not.toContain('ADJUSTMENT')
    expect(vals).toContain('BEHAVIOR')
    expect(vals).toContain('ATTENDANCE')
  })
})

describe('COIN_MEDALS', () => {
  it('пороги бронза/серебро/золото', () => {
    const byKey = Object.fromEntries(COIN_MEDALS.map(m => [m.key, m.threshold]))
    expect(byKey.BRONZE).toBe(1000)
    expect(byKey.SILVER).toBe(3000)
    expect(byKey.GOLD).toBe(5000)
  })
})
