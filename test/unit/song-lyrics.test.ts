import { describe, expect, it } from 'vitest'
import {
  parseGapLyrics,
  formatGapLyrics,
  gapCount,
  totalGaps,
  missingAnswers,
  preserveTranslations,
  GAP
} from '../../app/entities/song/model/lyrics'

describe('parseGapLyrics', () => {
  it('строка без скобок остаётся обычной', () => {
    const [line] = parseGapLyrics('Because I am happy')
    expect(line).toEqual({ lineIndex: 0, text: 'Because I am happy', hasGap: false })
  })

  it('слово в скобках превращается в пропуск с ответом', () => {
    const [line] = parseGapLyrics('It might seem [crazy] what I say')
    expect(line!.hasGap).toBe(true)
    expect(line!.text).toBe(`It might seem ${GAP} what I say`)
    expect(line!.gapAnswer).toEqual(['crazy'])
  })

  it('несколько пропусков в строке — ответы по позициям', () => {
    // Такие строки есть в методичках, поэтому ответ хранится не на строку.
    const [line] = parseGapLyrics('Clap [along] if you feel like a room without a [roof]')
    expect(gapCount(line!)).toBe(2)
    expect(line!.gapAnswer).toEqual(['along', 'roof'])
  })

  it('пустые скобки — это пропуск без ответа, а не обычный текст', () => {
    // Так выглядит лист, импортированный из PDF: прочерки есть, слов нет.
    const [line] = parseGapLyrics('I am [] here in the [] room')
    expect(line!.hasGap).toBe(true)
    expect(gapCount(line!)).toBe(2)
    expect(line!.gapAnswer).toEqual(['', ''])
  })

  it('нумерует строки подряд, включая пустые', () => {
    const lines = parseGapLyrics('one\n\n[two]')
    expect(lines.map(l => l.lineIndex)).toEqual([0, 1, 2])
    expect(lines[1]!.hasGap).toBe(false)
    expect(lines[2]!.hasGap).toBe(true)
  })

  it('пробелы внутри скобок не попадают в ответ', () => {
    const [line] = parseGapLyrics('I feel so [ lonely ]')
    expect(line!.gapAnswer).toEqual(['lonely'])
  })
})

describe('formatGapLyrics', () => {
  it('возвращает исходный авторский текст — round-trip', () => {
    const raw = 'It might seem [crazy] what I say\nClap [along] if you feel like a room without a [roof]\nplain line'
    expect(formatGapLyrics(parseGapLyrics(raw))).toBe(raw)
  })

  it('round-trip сохраняет пустые пропуски', () => {
    const raw = 'I am [] here in the [] room'
    expect(formatGapLyrics(parseGapLyrics(raw))).toBe(raw)
  })

  it('восстанавливает порядок строк, даже если они пришли вперемешку', () => {
    const lines = parseGapLyrics('first\nsecond')
    expect(formatGapLyrics([lines[1]!, lines[0]!])).toBe('first\nsecond')
  })
})

describe('totalGaps / missingAnswers', () => {
  const raw = 'It might seem [crazy] what I say\nClap [] if you feel like a room without a [roof]\nplain'
  const lines = parseGapLyrics(raw)

  it('считает пропуски, а не строки с пропусками', () => {
    expect(totalGaps(lines)).toBe(3)
  })

  it('находит пропуски без вписанного слова', () => {
    expect(missingAnswers(lines)).toBe(1)
  })

  it('полностью заполненный текст не имеет пропусков без ответа', () => {
    expect(missingAnswers(parseGapLyrics('Clap [along] if you feel like a room without a [roof]'))).toBe(0)
  })

  it('строка без пропусков ничего не добавляет', () => {
    expect(totalGaps(parseGapLyrics('plain line'))).toBe(0)
    expect(missingAnswers(parseGapLyrics('plain line'))).toBe(0)
  })
})

describe('preserveTranslations', () => {
  it('переносит перевод на строку с тем же текстом', () => {
    // Авторский формат переводы не хранит, поэтому правка текста в админке
    // без этого шага стирала бы русские подсказки под строками.
    const previous = parseGapLyrics('I am [] here in the [] room').map(l => ({ ...l, translation: 'Я сижу тут' }))
    const next = parseGapLyrics('I am [sitting] here in the [boring] room')
    expect(preserveTranslations(previous, next)[0]!.translation).toBe('Я сижу тут')
  })

  it('находит строку по тексту, даже если её номер изменился', () => {
    const previous = parseGapLyrics('first\nI feel so []').map((l, i) => (i === 1 ? { ...l, translation: 'Мне одиноко' } : l))
    const next = parseGapLyrics('new line on top\nfirst\nI feel so []')
    expect(preserveTranslations(previous, next)[2]!.translation).toBe('Мне одиноко')
    expect(preserveTranslations(previous, next)[0]!.translation).toBeUndefined()
  })

  it('без переводов в исходнике ничего не меняет', () => {
    const next = parseGapLyrics('plain [gap]')
    expect(preserveTranslations([], next)).toEqual(next)
  })
})
