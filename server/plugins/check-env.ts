/**
 * Boot-time sanity check: warn loudly when security-critical env vars
 * are missing so production misconfig is visible instead of failing
 * silently (e.g. quest progression simply not running because the
 * internal API key is empty).
 *
 * Note: we WARN, not throw. The app still boots — individual routes
 * fail closed (see requireInternalCall in server/utils/supabase.ts).
 */
export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()

  if (!config.internalApiKey) {
    console.warn(
      '[boot] INTERNAL_API_KEY is empty. Server-internal calls '
      + '(quest progression, streak chains) will fail closed with 503. '
      + 'Generate one with: openssl rand -hex 32'
    )
  }

  if (!config.public?.supabaseUrl && !process.env.SUPABASE_URL) {
    console.warn('[boot] SUPABASE_URL is empty — auth and DB will not work.')
  }
})
