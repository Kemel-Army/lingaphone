import { describe, expect, it } from 'vitest'
import { normalizeKzPhone, isUsablePhone } from '../../server/utils/phoneKz'

/**
 * Логика обязана совпадать с generated-колонкой `Lead."phoneDigits"`
 * (миграция 20260813233000). Разойдутся — дедупликация лида молча сломается:
 * поиск пойдёт по одному виду номера, а в базе будет лежать другой.
 */
describe('normalizeKzPhone', () => {
  it('склеивает +7 и 8 в один номер', () => {
    expect(normalizeKzPhone('+7 700 111-22-33')).toBe('77001112233')
    expect(normalizeKzPhone('8 700 111 22 33')).toBe('77001112233')
    expect(normalizeKzPhone('87001112233')).toBe('77001112233')
  })

  it('дописывает код страны к местному номеру из 10 цифр', () => {
    expect(normalizeKzPhone('700 111 22 33')).toBe('77001112233')
  })

  it('не трогает номера другой длины — иностранные остаются как есть', () => {
    expect(normalizeKzPhone('+44 20 7946 0958')).toBe('442079460958')
    expect(normalizeKzPhone('123')).toBe('123')
  })

  it('выбрасывает любую пунктуацию и пробелы', () => {
    expect(normalizeKzPhone(' +7 (700) 111—22—33 ')).toBe('77001112233')
  })

  it('строка без цифр даёт пустой результат, а не мусор', () => {
    expect(normalizeKzPhone('позвоните мне')).toBe('')
  })
})

describe('isUsablePhone', () => {
  it('пустой и короткий номер не годится как ключ поиска', () => {
    // Иначе лид склеился бы с любой записью, где телефон пустой.
    expect(isUsablePhone('')).toBe(false)
    expect(isUsablePhone('770011')).toBe(false)
  })

  it('нормальный казахстанский номер годится', () => {
    expect(isUsablePhone(normalizeKzPhone('+7 700 111-22-33'))).toBe(true)
  })
})
