export default defineNitroPlugin(async (nitro) => {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return

  let Sentry: typeof import('@sentry/node') | undefined
  try {
    Sentry = await import('@sentry/node')
  } catch {
    console.warn('[sentry] Failed to load @sentry/node — skipping')
    return
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0
  })

  nitro.hooks.hook('error', (error) => {
    Sentry!.captureException(error)
  })

  nitro.hooks.hook('request', (event) => {
    Sentry!.setTag('request.url', event.path)
  })
})
