let _sentry: typeof import('@sentry/node') | undefined

async function getSentry() {
  if (_sentry !== undefined) return _sentry
  try {
    _sentry = await import('@sentry/node')
  } catch {
    _sentry = undefined
  }
  return _sentry
}

/**
 * Capture an exception in Sentry with optional context.
 * Falls back to console.error if Sentry is not initialized.
 */
export const captureError = async (error: unknown, context?: Record<string, unknown>) => {
  const Sentry = await getSentry()
  if (Sentry?.isInitialized()) {
    Sentry.captureException(error, { extra: context })
  }
  console.error('[FEMO Error]', error, context ?? '')
}

/**
 * Capture a warning-level message in Sentry.
 */
export const captureWarning = async (message: string, context?: Record<string, unknown>) => {
  const Sentry = await getSentry()
  if (Sentry?.isInitialized()) {
    Sentry.captureMessage(message, { level: 'warning', extra: context })
  }
  console.warn('[FEMO Warning]', message, context ?? '')
}
