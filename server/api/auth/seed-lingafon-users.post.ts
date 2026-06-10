/* eslint-disable @typescript-eslint/no-explicit-any */
import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * POST /api/auth/seed-lingafon-users
 *
 * Creates 4 test accounts (one per role) for Lingafon dev.
 * Targets the lingafon Supabase project. Idempotent.
 *
 * Credentials (all use password: password123):
 *   admin@linga.kz   → ADMIN
 *   student@linga.kz → STUDENT
 *   parent@linga.kz  → PARENT
 *   teacher@linga.kz → TUTOR  (enum is TUTOR; педагог in UI)
 *
 * Requires: bootstrap SQL applied (User table + JWT hook).
 */
export default defineEventHandler(async (event) => {
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 403, message: 'Not allowed in production' })
  }

  const url = process.env.SUPABASE_URL ?? ''
  if (!url.includes('owiaccgxbejsgtyhhtrd')) {
    throw createError({
      statusCode: 400,
      message: `Refusing to seed: SUPABASE_URL is "${url}", expected lingafon. Run with: pnpm dev:lingaphone`
    })
  }

  const supabase = serverSupabaseServiceRole(event)

  const testUsers = [
    { email: 'admin@linga.kz', name: 'Admin', surname: 'Lingafon', role: 'ADMIN' },
    { email: 'student@linga.kz', name: 'Student', surname: 'Lingafon', role: 'STUDENT' },
    { email: 'parent@linga.kz', name: 'Parent', surname: 'Lingafon', role: 'PARENT' },
    { email: 'teacher@linga.kz', name: 'Teacher', surname: 'Lingafon', role: 'TUTOR' }
  ]

  const results: Array<{ email: string, status: string, error?: string }> = []

  const { data: existingList, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) {
    throw createError({ statusCode: 500, message: `auth.listUsers failed: ${listErr.message}` })
  }

  for (const tu of testUsers) {
    try {
      const existing = existingList?.users?.find(u => u.email === tu.email)
      let authId: string

      if (existing) {
        authId = existing.id
      } else {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: tu.email,
          password: 'password123',
          email_confirm: true,
          user_metadata: { name: tu.name, surname: tu.surname, role: tu.role }
        })
        if (authError || !authData?.user) {
          results.push({ email: tu.email, status: 'auth_error', error: authError?.message })
          continue
        }
        authId = authData.user.id
      }

      const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .eq('authId', authId)
        .maybeSingle()

      if (existingUser) {
        results.push({ email: tu.email, status: 'already_exists' })
        continue
      }

      const { error: userError } = await supabase
        .from('User')
        .insert({
          authId,
          email: tu.email,
          name: tu.name,
          surname: tu.surname,
          role: tu.role
        } as never)

      if (userError) {
        results.push({ email: tu.email, status: 'user_error', error: userError.message })
        continue
      }

      results.push({ email: tu.email, status: 'created' })
    } catch (err: any) {
      results.push({ email: tu.email, status: 'exception', error: err?.message })
    }
  }

  return {
    success: true,
    results,
    credentials: {
      note: 'All accounts use password: password123',
      accounts: testUsers.map(t => ({ email: t.email, role: t.role }))
    }
  }
})
