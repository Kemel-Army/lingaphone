/**
 * Простейший счётчик обращений в памяти процесса.
 *
 * Нужен публичным маршрутам, которые пишут в CRM без авторизации: там нет ни
 * RLS, ни сессии, поэтому единственный барьер против набивания базы — лимит на
 * источник. Память процесса — намеренный компромисс: лимит переживает не всё,
 * но ломает автоматическую долбёжку, не притаскивая Redis в проект.
 */
interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/** Чтобы карта не росла бесконечно от разовых посетителей. */
const sweep = (now: number) => {
  if (buckets.size < 5000) return
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSec: number
}

export const hitRateLimit = (key: string, limit: number, windowMs: number): RateLimitResult => {
  const now = Date.now()
  sweep(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 }
  }

  bucket.count++
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(limit - bucket.count, 0),
    retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000)
  }
}

/** Только для тестов: сбросить состояние между кейсами. */
export const resetRateLimits = () => buckets.clear()
