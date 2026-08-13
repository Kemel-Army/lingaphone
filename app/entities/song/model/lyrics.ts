import type { LyricLine } from './types'

/**
 * Текст песни с пропусками: авторский формат ↔ структура для плеера.
 *
 * Автор вставляет оригинальный текст и оборачивает пропадающие слова в
 * квадратные скобки:
 *
 *   It might seem [crazy] what I'm 'bout to say
 *   Clap [along] if you feel like a room without a [roof]
 *
 * Скобки выбраны потому, что методические файлы приходят уже с прочерками
 * (`________`) — прочерк не говорит, какое слово там было, а скобки хранят и
 * позицию, и ответ, так что один и тот же текст служит и заданием, и ключом.
 *
 * В строке допускается несколько пропусков: в исходных материалах они есть
 * («Clap ___ if you feel like a room without a ___»).
 */

/** Маркер пропуска в `LyricLine.text`, который рендерит плеер. */
export const GAP = '___'

// `*`, не `+`: пустые скобки — это тоже пропуск, просто ответ ещё не вписан.
// Так импортированный из методички лист (там одни прочерки) сохраняет позиции
// пропусков, а преподаватель дописывает слова уже в админке.
const BRACKETED = /\[([^\]]*)\]/g

/** «It might seem [crazy]…» → строки для плеера с ответами по позициям. */
export const parseGapLyrics = (raw: string): LyricLine[] =>
  raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(l => l.trimEnd())
    .map((line, lineIndex): LyricLine => {
      const answers = [...line.matchAll(BRACKETED)].map(m => m[1]!.trim())
      if (answers.length === 0) {
        return { lineIndex, text: line, hasGap: false }
      }
      return {
        lineIndex,
        text: line.replace(BRACKETED, GAP),
        hasGap: true,
        gapAnswer: answers
      }
    })

/** Обратное преобразование — чтобы админка открывала песню на редактирование. */
export const formatGapLyrics = (lines: LyricLine[]): string =>
  [...lines]
    .sort((a, b) => a.lineIndex - b.lineIndex)
    .map((line) => {
      if (!line.hasGap) return line.text
      let i = 0
      return line.text.replaceAll(GAP, () => {
        const answer = line.gapAnswer?.[i] ?? ''
        i++
        return `[${answer}]`
      })
    })
    .join('\n')

/**
 * Переносит построчные переводы со старой версии текста на новую.
 *
 * Авторский формат (`[слово]`) перевод не хранит, поэтому без этого шага любая
 * правка текста в админке молча стирала бы русские подсказки, которые плеер
 * показывает под строкой. Сопоставляем по самому тексту, а не по номеру строки:
 * при вставке или удалении строк номера уезжают, а текст остаётся собой.
 */
export const preserveTranslations = (previous: LyricLine[], next: LyricLine[]): LyricLine[] => {
  const byText = new Map<string, string>()
  for (const line of previous) {
    if (line.translation) byText.set(line.text.trim(), line.translation)
  }
  if (byText.size === 0) return next

  return next.map((line) => {
    const translation = byText.get(line.text.trim())
    return translation ? { ...line, translation } : line
  })
}

/** Сколько пропусков в строке — плееру нужно на каждый свой инпут. */
export const gapCount = (line: LyricLine): number =>
  line.hasGap ? line.text.split(GAP).length - 1 : 0

/** Всего пропусков в песне — это и есть максимальный балл. */
export const totalGaps = (lines: LyricLine[]): number =>
  lines.reduce((sum, l) => sum + gapCount(l), 0)

/**
 * Пропуски без ответа. Песню с такими нельзя отдавать ученику: проверить
 * ввод будет нечем, любой ответ окажется неверным.
 */
export const missingAnswers = (lines: LyricLine[]): number =>
  lines.reduce((sum, line) => {
    if (!line.hasGap) return sum
    const need = gapCount(line)
    const filled = (line.gapAnswer ?? []).filter(a => a.trim().length > 0).length
    return sum + Math.max(need - filled, 0)
  }, 0)
