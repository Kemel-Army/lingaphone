import { describe, expect, it } from 'vitest'
import {
  formatDate,
  formatDateShort,
  formatTime,
  formatRelativeTime,
  isToday,
  getDayOfWeekName,
  getDayOfWeekShort
} from '../../app/shared/lib/datetime'

describe('formatDate', () => {
  it('formats date string', () => {
    const result = formatDate('2025-03-15T10:00:00Z')
    // Contains year and some date text
    expect(result).toContain('2025')
  })

  it('accepts Date objects', () => {
    const result = formatDate(new Date('2025-03-15'))
    expect(result).toContain('2025')
  })
})

describe('formatDateShort', () => {
  it('returns shortened date', () => {
    const result = formatDateShort('2025-03-15T10:00:00Z')
    expect(result).toBeTruthy()
    expect(result.length).toBeLessThan(20)
  })
})

describe('formatTime', () => {
  it('returns time in HH:MM format', () => {
    const result = formatTime('2025-03-15T10:30:00Z')
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})

describe('formatRelativeTime', () => {
  it('returns "только что" for recent dates', () => {
    const now = new Date()
    expect(formatRelativeTime(now)).toBe('только что')
  })

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatRelativeTime(fiveMinAgo)).toContain('мин')
  })

  it('returns hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
    expect(formatRelativeTime(threeHoursAgo)).toContain('ч')
  })

  it('returns days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(twoDaysAgo)).toContain('дн')
  })
})

describe('isToday', () => {
  it('returns true for today', () => {
    expect(isToday(new Date())).toBe(true)
  })

  it('returns false for yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(isToday(yesterday)).toBe(false)
  })
})

describe('getDayOfWeekName', () => {
  it('returns correct day names', () => {
    expect(getDayOfWeekName(0)).toBe('Понедельник')
    expect(getDayOfWeekName(4)).toBe('Пятница')
    expect(getDayOfWeekName(6)).toBe('Воскресенье')
  })

  it('returns empty for out of range', () => {
    expect(getDayOfWeekName(7)).toBe('')
    expect(getDayOfWeekName(-1)).toBe('')
  })
})

describe('getDayOfWeekShort', () => {
  it('returns short day name', () => {
    const result = getDayOfWeekShort(0)
    expect(result).toBeTruthy()
  })
})
