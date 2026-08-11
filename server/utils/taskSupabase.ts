/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client for Nitro scheduled tasks.
 *
 * Tasks run without an H3 event, so `serverSupabaseServiceRole(event)` is not
 * available and the client has to be constructed by hand.
 *
 * This must stay a top-level ESM `import`. All three tasks previously built
 * the client with `require('@supabase/supabase-js')` inside the function body;
 * the Nitro bundle is ESM ("type": "module"), where `require` is not defined,
 * so every scheduled run died with `ReferenceError: require is not defined`
 * — silently disabling early-warning, notify-daily and extend-lesson-schedule.
 */
export const taskServiceRoleClient = (): any => {
  const config = useRuntimeConfig() as any

  const url = config.public?.supabase?.url
    ?? config.supabaseUrl
    ?? process.env.SUPABASE_URL
    ?? ''
  const key = config.supabaseServiceKey
    ?? config.supabase?.serviceKey
    ?? process.env.SUPABASE_SERVICE_KEY
    ?? ''

  if (!url || !key) {
    throw new Error(
      'taskServiceRoleClient: SUPABASE_URL / SUPABASE_SERVICE_KEY are not configured'
    )
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}
