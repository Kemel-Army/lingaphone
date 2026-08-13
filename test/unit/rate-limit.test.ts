import { describe, expect, it, beforeEach } from 'vitest'
import { hitRateLimit, resetRateLimits } from '../../server/utils/rateLimit'

/**
 * Лимит защищает публичный `/api/placement/submit`: он пишет в CRM service
 * role'ом, минуя RLS, поэтому без счётчика базу можно набить заявками.
 */
describe('hitRateLimit', () => {
  beforeEach(() => resetRateLimits())

  it('пропускает обращения до лимита включительно', () => {
    for (let i = 0; i < 3; i++) {
      expect(hitRateLimit('ip-a', 3, 60_000).allowed).toBe(true)
    }
  })

  it('блокирует всё сверх лимита и говорит, когда повторить', () => {
    for (let i = 0; i < 3; i++) hitRateLimit('ip-a', 3, 60_000)
    const denied = hitRateLimit('ip-a', 3, 60_000)
    expect(denied.allowed).toBe(false)
    expect(denied.remaining).toBe(0)
    expect(denied.retryAfterSec).toBeGreaterThan(0)
  })

  it('считает источники независимо — сосед по лимиту не блокирует', () => {
    for (let i = 0; i < 3; i++) hitRateLimit('ip-a', 3, 60_000)
    expect(hitRateLimit('ip-b', 3, 60_000).allowed).toBe(true)
  })

  it('окно истекает и счёт начинается заново', () => {
    // Нулевое окно истекает мгновенно — эквивалент «прошло время».
    expect(hitRateLimit('ip-c', 1, 0).allowed).toBe(true)
    expect(hitRateLimit('ip-c', 1, 0).allowed).toBe(true)
  })

  it('remaining уменьшается на каждом обращении', () => {
    expect(hitRateLimit('ip-d', 3, 60_000).remaining).toBe(2)
    expect(hitRateLimit('ip-d', 3, 60_000).remaining).toBe(1)
    expect(hitRateLimit('ip-d', 3, 60_000).remaining).toBe(0)
  })
})
