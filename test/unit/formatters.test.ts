import { describe, expect, it } from 'vitest'
import {
  formatNumber,
  formatPrice,
  formatPercent,
  formatXP,
  formatDuration,
  truncate,
  getInitials,
  getMasteryColor,
  getMasteryBgColor
} from '../../app/shared/lib/formatters'

describe('formatNumber', () => {
  it('formats numbers with locale spacing', () => {
    const result = formatNumber(24900)
    // Different environments may use different space characters
    expect(result.replace(/\s/g, '')).toBe('24900')
  })
})

describe('formatPrice', () => {
  it('formats price in tenge', () => {
    const result = formatPrice(24900)
    expect(result).toContain('₸')
    expect(result.replace(/\s/g, '')).toContain('24900')
  })

  it('formats zero', () => {
    expect(formatPrice(0)).toContain('₸')
  })
})

describe('formatPercent', () => {
  it('formats decimal as percentage', () => {
    expect(formatPercent(0.78)).toBe('78%')
  })

  it('formats value > 1 as-is', () => {
    expect(formatPercent(78)).toBe('78%')
  })

  it('supports decimal places', () => {
    expect(formatPercent(0.785, 1)).toBe('78.5%')
  })
})

describe('formatXP', () => {
  it('formats XP with suffix', () => {
    expect(formatXP(2450)).toContain('XP')
  })
})

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(30)).toBe('30 мин')
  })

  it('formats full hours', () => {
    expect(formatDuration(60)).toBe('1 ч')
    expect(formatDuration(120)).toBe('2 ч')
  })

  it('formats mixed hours and minutes', () => {
    expect(formatDuration(90)).toBe('1 ч 30 мин')
  })
})

describe('truncate', () => {
  it('returns short strings unchanged', () => {
    expect(truncate('Hello', 10)).toBe('Hello')
  })

  it('truncates with ellipsis', () => {
    expect(truncate('Long string here', 4)).toBe('Long…')
  })

  it('handles exact boundary', () => {
    expect(truncate('abc', 3)).toBe('abc')
  })
})

describe('getInitials', () => {
  it('returns initials from name and surname', () => {
    expect(getInitials('Айдана', 'Калиева')).toBe('АК')
  })

  it('returns single initial without surname', () => {
    expect(getInitials('John')).toBe('J')
  })

  it('uppercases initials', () => {
    expect(getInitials('test', 'user')).toBe('TU')
  })
})

describe('getMasteryColor', () => {
  it('returns green for high mastery', () => {
    expect(getMasteryColor(80)).toContain('green')
    expect(getMasteryColor(100)).toContain('green')
  })

  it('returns yellow for medium-high', () => {
    expect(getMasteryColor(60)).toContain('yellow')
    expect(getMasteryColor(79)).toContain('yellow')
  })

  it('returns orange for medium-low', () => {
    expect(getMasteryColor(40)).toContain('orange')
    expect(getMasteryColor(59)).toContain('orange')
  })

  it('returns red for low mastery', () => {
    expect(getMasteryColor(0)).toContain('red')
    expect(getMasteryColor(39)).toContain('red')
  })
})

describe('getMasteryBgColor', () => {
  it('returns appropriate background classes', () => {
    expect(getMasteryBgColor(90)).toContain('green')
    expect(getMasteryBgColor(70)).toContain('yellow')
    expect(getMasteryBgColor(50)).toContain('orange')
    expect(getMasteryBgColor(20)).toContain('red')
  })
})
