import { describe, expect, it } from 'vitest'

/**
 * Regression guard for the activity-calendar date keys in
 * app/entities/progress/composables/useStudentProgress.ts.
 *
 * The composable needs a Nuxt runtime, so the key derivation is reproduced
 * here — the point is to pin the *rule*: cells are keyed in UTC so they line up
 * with `attemptedAt`/`gradedAt`, which are timestamptz columns sliced to their
 * UTC date.
 */

/** Current implementation. */
const utcKeys = (now: Date, days: number): string[] => {
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const out: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(todayUtc)
    d.setUTCDate(d.getUTCDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

/** The version that shipped before the fix — local midnight re-read as UTC. */
const localMidnightKeys = (now: Date, days: number): string[] => {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const out: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

/** What a DB timestamptz slices to — the UTC date of the event. */
const dbDayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10)

describe('activityCalendar: ключи дней', () => {
  // 11 Aug 2026, 15:00 in Kazakhstan (UTC+5).
  const NOW = new Date('2026-08-11T15:00:00+05:00')

  it('последняя ячейка — сегодняшняя UTC-дата', () => {
    const keys = utcKeys(NOW, 7)
    expect(keys.at(-1)).toBe('2026-08-11')
  })

  it('сегодняшнее событие попадает в последнюю ячейку', () => {
    const keys = utcKeys(NOW, 7)
    const event = dbDayKey('2026-08-11T15:00:00+05:00')
    expect(keys).toContain(event)
    expect(keys.at(-1)).toBe(event)
  })

  it('старая реализация промахивалась на день (регрессия)', () => {
    const event = dbDayKey('2026-08-11T15:00:00+05:00')
    const old = localMidnightKeys(NOW, 7)
    // Локальная полночь UTC+5 -> 19:00 предыдущих суток по UTC.
    expect(old.at(-1)).toBe('2026-08-10')
    expect(old.at(-1)).not.toBe(event)
  })

  it('ключи не зависят от часового пояса — сервер и браузер совпадают', () => {
    // Один и тот же момент времени, выраженный в разных зонах.
    const asAlmaty = new Date('2026-08-11T15:00:00+05:00')
    const asUtc = new Date('2026-08-11T10:00:00Z')
    expect(utcKeys(asAlmaty, 12 * 7)).toEqual(utcKeys(asUtc, 12 * 7))
  })

  it('отдаёт ровно 12 недель по возрастанию, без дублей и дыр', () => {
    const keys = utcKeys(NOW, 12 * 7)
    expect(keys).toHaveLength(84)
    expect(new Set(keys).size).toBe(84)
    expect([...keys].sort()).toEqual(keys)
    const first = new Date(keys[0] + 'T00:00:00Z').getTime()
    const last = new Date(keys.at(-1) + 'T00:00:00Z').getTime()
    expect((last - first) / 86_400_000).toBe(83)
  })

  it('корректно переходит через границу месяца и года', () => {
    const keys = utcKeys(new Date('2026-01-02T12:00:00Z'), 4)
    expect(keys).toEqual(['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02'])
  })
})
