/**
 * Server middleware: security headers + rate limiting for sensitive endpoints.
 */

// In-memory rate limit store (per-process; for multi-instance use Redis)
const rateLimitStore = new Map<string, { count: number, resetAt: number }>()

interface RateLimitRule {
  windowMs: number
  maxRequests: number
}

const RATE_LIMITS: Record<string, RateLimitRule> = {
  '/api/ai/': { windowMs: 60_000, maxRequests: 20 },
  '/api/auth/': { windowMs: 60_000, maxRequests: 10 },
  '/api/payments/': { windowMs: 60_000, maxRequests: 10 }
}

function checkRateLimit(key: string, rule: RateLimitRule): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + rule.windowMs })
    return true
  }

  if (entry.count >= rule.maxRequests) {
    return false
  }

  entry.count++
  return true
}

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key)
  }
}, 300_000)

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  const isDev = process.env.NODE_ENV !== 'production'

  // --- Security headers ---
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')
  setResponseHeader(event, 'X-Frame-Options', 'DENY')
  setResponseHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin')
  setResponseHeader(event, 'X-XSS-Protection', '1; mode=block')
  setResponseHeader(event, 'Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()')

  // HSTS — only in production
  if (!isDev) {
    setResponseHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // CSP — disabled (re-enable when deploying to production)

  // --- Rate limiting ---
  if (path.startsWith('/api/')) {
    const matchedPrefix = Object.keys(RATE_LIMITS).find(prefix => path.startsWith(prefix))
    if (matchedPrefix) {
      const rule = RATE_LIMITS[matchedPrefix]
      // Use IP + path prefix as key (fallback to 'unknown' for proxied requests)
      const forwarded = getRequestHeader(event, 'x-forwarded-for')
      const ip = forwarded?.split(',')[0]?.trim() ?? getRequestHeader(event, 'x-real-ip') ?? 'unknown'
      const key = `${ip}:${matchedPrefix}`

      if (!checkRateLimit(key, rule!)) {
        setResponseHeader(event, 'Retry-After', Math.ceil(rule!.windowMs / 1000))
        throw createError({ statusCode: 429, message: 'Too many requests. Please try again later.' })
      }
    }
  }
})
