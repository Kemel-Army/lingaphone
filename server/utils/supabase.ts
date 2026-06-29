/* eslint-disable @typescript-eslint/no-explicit-any */
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/shared/types/database.types'

/**
 * Get typed Supabase service-role client for server routes.
 * Bypasses RLS — use only in server/api/.
 */
export const useServerSupabase = (event: any) => {
  return serverSupabaseServiceRole<Database>(event)
}

/**
 * Normalized auth-context shape returned by requireAuth / requireRole.
 *
 * The index signature preserves the JWT claims that ride along the request
 * (email, phone, user_role, user_name, user_surname, sub, aal, …). Without
 * it, spreading a Record<string, any> into an object literal collapses the
 * type to just the explicitly-listed keys and downstream `.email` / `.id`
 * reads start failing typecheck even though they exist at runtime.
 */
export type AuthUser = {
  id: string
  sub?: string
  email?: string | null
  user_role?: string
  user_name?: string
  user_surname?: string
  [key: string]: unknown
}

/**
 * Extract and validate authenticated user from request.
 * Returns a normalized object with `.id` set to the auth UUID.
 *
 * In newer @nuxtjs/supabase, serverSupabaseUser() returns JWT claims where the
 * auth UUID lives in `.sub`, not `.id`. We copy it into `.id` so all callers
 * doing `user.id` continue to work without per-file changes.
 */
export const requireAuth = async (event: any): Promise<AuthUser> => {
  const { serverSupabaseUser } = await import('#supabase/server')
  const claims = await serverSupabaseUser(event) as Record<string, any> | null

  if (claims) {
    return { ...claims, id: claims.sub as string } as AuthUser
  }

  // Fallback for client calls where auth cookie is missing but access token is present.
  const authHeader = getRequestHeader(event, 'authorization')
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : null

  if (token) {
    const supabase = serverSupabaseServiceRole<Database>(event)
    const { data, error } = await supabase.auth.getUser(token)
    if (!error && data.user) {
      return { ...data.user, id: data.user.id, email: data.user.email ?? null } as AuthUser
    }
  }

  throw createError({ statusCode: 401, message: 'Unauthorized' })
}

/**
 * Require specific role from authenticated user.
 *
 * Reads `user_role` from JWT claims (populated by custom_access_token_hook).
 * Falls back to a DB lookup on `User.role` when the claim is missing — this
 * keeps the route working when the Dashboard hook isn't enabled yet or when
 * the user's JWT was issued before the hook landed.
 */
export const requireRole = async (event: any, roles: string[]): Promise<AuthUser> => {
  const user = await requireAuth(event)
  let role = user.user_role

  if (!role) {
    const authId = (user.sub as string | undefined) ?? user.id
    if (authId) {
      const supabase = serverSupabaseServiceRole<Database>(event)
      const { data } = await supabase
        .from('User')
        .select('role')
        .eq('authId', authId)
        .maybeSingle()
      role = (data as { role?: string } | null)?.role
    }
  }

  if (!role || !roles.includes(role)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
  return { ...user, user_role: role }
}

/**
 * Resolve the caller's internal User.id + Student.id from their auth session.
 * Throws 403 if caller is not a student.
 */
export const getCurrentStudent = async (event: any): Promise<{ userId: string, studentId: string }> => {
  const user = await requireAuth(event)
  const supabase = serverSupabaseServiceRole<Database>(event)

  const { data: userRow, error: userErr } = await supabase
    .from('User')
    .select('id, role')
    .eq('authId', user.id)
    .maybeSingle() as unknown as { data: { id: string, role: string } | null, error: unknown }

  if (userErr || !userRow) {
    throw createError({ statusCode: 403, message: 'User not found' })
  }
  if (userRow.role !== 'STUDENT') {
    throw createError({ statusCode: 403, message: 'Not a student' })
  }

  const { data: studentRow, error: studentErr } = await supabase
    .from('Student')
    .select('id')
    .eq('userId', userRow.id)
    .maybeSingle() as unknown as { data: { id: string } | null, error: unknown }

  if (studentErr || !studentRow) {
    throw createError({ statusCode: 403, message: 'Student profile not found' })
  }

  return { userId: userRow.id, studentId: studentRow.id }
}

/**
 * Gate a route to server-internal callers only. The caller must present
 * the `x-internal-token` header matching `runtimeConfig.internalApiKey`.
 *
 * Use for endpoints that exist only to be invoked by other server routes
 * via $fetch — never directly from the browser.
 *
 * If `INTERNAL_API_KEY` env var is unset (e.g. fresh local dev), throws 503
 * to fail closed instead of allowing unauthenticated access.
 */
export const requireInternalCall = (event: any): void => {
  const config = useRuntimeConfig()
  const expected = (config.internalApiKey as string | undefined) ?? ''
  if (!expected) {
    throw createError({ statusCode: 503, message: 'Internal API key not configured' })
  }
  const provided = getRequestHeader(event, 'x-internal-token') ?? ''
  if (provided !== expected) {
    throw createError({ statusCode: 403, message: 'Internal route' })
  }
}

/**
 * Resolve only the internal User.id of the caller (works for any role).
 */
export const getCurrentInternalUserId = async (event: any): Promise<string> => {
  const user = await requireAuth(event)
  const supabase = serverSupabaseServiceRole<Database>(event)
  const { data, error } = await supabase
    .from('User')
    .select('id')
    .eq('authId', user.id)
    .maybeSingle() as unknown as { data: { id: string } | null, error: unknown }
  if (error || !data) throw createError({ statusCode: 403, message: 'User not found' })
  return data.id
}
