import { describe, expect, it } from 'vitest'
import {
  normalizeConfig,
  ownedSet,
  itemPrice,
  FREE_ITEM_IDS,
  DEFAULT_CONFIG,
  AVATAR_ITEMS,
  AVATAR_ITEM_MAP,
  AVATAR_SLOTS
} from '../../app/shared/lib/avatarCatalog'

describe('normalizeConfig', () => {
  it('дефолт для пустого/невалидного', () => {
    expect(normalizeConfig(null)).toEqual(DEFAULT_CONFIG)
    expect(normalizeConfig({})).toEqual(DEFAULT_CONFIG)
    expect(normalizeConfig('garbage')).toEqual(DEFAULT_CONFIG)
  })

  it('сохраняет валидные предметы слотов', () => {
    const c = normalizeConfig({
      hat: 'hat-crown', glasses: 'glasses-sun', top: 'top-suit', shoes: 'shoes-neon', color: DEFAULT_CONFIG.color
    })
    expect(c.hat).toBe('hat-crown')
    expect(c.top).toBe('top-suit')
    expect(c.shoes).toBe('shoes-neon')
  })

  it('отклоняет предмет чужого слота', () => {
    expect(normalizeConfig({ glasses: 'hat-crown' }).glasses).toBe(DEFAULT_CONFIG.glasses)
    expect(normalizeConfig({ hat: 'shoes-neon' }).hat).toBe(DEFAULT_CONFIG.hat)
  })

  it('отклоняет невалидный цвет', () => {
    expect(normalizeConfig({ color: '#zzzzzz' }).color).toBe(DEFAULT_CONFIG.color)
  })
})

describe('ownedSet', () => {
  it('бесплатные всегда доступны', () => {
    const s = ownedSet([])
    for (const id of FREE_ITEM_IDS) expect(s.has(id)).toBe(true)
  })
  it('добавляет купленные', () => {
    expect(ownedSet(['hat-crown']).has('hat-crown')).toBe(true)
  })
  it('null безопасен', () => {
    expect(ownedSet(null).size).toBe(FREE_ITEM_IDS.length)
  })
})

describe('itemPrice', () => {
  it('бесплатные = 0', () => {
    for (const id of FREE_ITEM_IDS) expect(itemPrice(id)).toBe(0)
  })
  it('неизвестный = 0', () => expect(itemPrice('nope')).toBe(0))
  it('платный > 0', () => expect(itemPrice('hat-crown')).toBeGreaterThan(0))
})

describe('каталог целостность', () => {
  it('каждый предмет в мапе + слот валиден', () => {
    const slots = AVATAR_SLOTS.map(s => s.slot)
    for (const it of AVATAR_ITEMS) {
      expect(AVATAR_ITEM_MAP[it.id]).toBe(it)
      expect(slots).toContain(it.slot)
    }
  })
  it('в каждом слоте есть бесплатный дефолт', () => {
    for (const { slot } of AVATAR_SLOTS) {
      expect(AVATAR_ITEMS.some(i => i.slot === slot && i.price === 0)).toBe(true)
    }
  })
})
