/* eslint-disable @typescript-eslint/no-explicit-any */
import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * POST /api/auth/seed-test-users
 *
 * Creates 3 test accounts (one per active role) for development/testing.
 * Uses service role key. Only works in development.
 *
 * Credentials:
 *   student@test.com  / test1234  → STUDENT
 *   parent@test.com   / test1234  → PARENT
 *   admin@test.com    / test1234  → ADMIN
 */
export default defineEventHandler(async (event) => {
  // Safety: only allow in development
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 403, message: 'Not allowed in production' })
  }

  const supabase = serverSupabaseServiceRole(event)

  const testUsers = [
    {
      email: 'student@test.com',
      password: 'test1234',
      name: 'Тестовый',
      surname: 'Ученик',
      role: 'STUDENT',
      grade: 9
    },
    {
      email: 'parent@test.com',
      password: 'test1234',
      name: 'Тестовый',
      surname: 'Родитель',
      role: 'PARENT'
    },
    {
      email: 'admin@test.com',
      password: 'test1234',
      name: 'Тестовый',
      surname: 'Администратор',
      role: 'ADMIN'
    }
  ]

  const results: Array<{ email: string, status: string, error?: string }> = []

  for (const tu of testUsers) {
    try {
      // Check if auth user already exists by trying to sign in
      const { data: existingAuth } = await supabase.auth.admin.listUsers()
      const existing = existingAuth?.users?.find(u => u.email === tu.email)

      let authId: string

      if (existing) {
        authId = existing.id
        results.push({ email: tu.email, status: 'auth_exists', error: undefined })
      } else {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: tu.email,
          password: tu.password,
          email_confirm: true,
          user_metadata: {
            name: tu.name,
            surname: tu.surname,
            role: tu.role
          }
        })

        if (authError) {
          results.push({ email: tu.email, status: 'auth_error', error: authError.message })
          continue
        }
        authId = authData.user.id
      }

      // Check if User row already exists
      const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .eq('authId', authId)
        .single()

      if (existingUser) {
        results.push({ email: tu.email, status: 'already_exists' })
        continue
      }

      // Create User record
      const { data: user, error: userError } = await supabase
        .from('User')
        .insert({
          authId,
          email: tu.email,
          name: tu.name,
          surname: tu.surname,
          role: tu.role,
          phone: null
        } as never)
        .select()
        .single()

      if (userError) {
        results.push({ email: tu.email, status: 'user_error', error: userError.message })
        continue
      }

      const userId = (user as any).id

      // Create role-specific records
      if (tu.role === 'STUDENT') {
        const { data: student } = await supabase
          .from('Student')
          .insert({ userId, grade: tu.grade ?? 9 } as never)
          .select('id')
          .single()

        if (student) {
          // Create game profile
          await supabase
            .from('StudentGameProfile')
            .insert({ studentId: (student as any).id } as never)
        }
      }

      if (tu.role === 'PARENT') {
        await supabase
          .from('Parent')
          .insert({ userId } as never)
      }

      results.push({ email: tu.email, status: 'created' })
    } catch (err: any) {
      results.push({ email: tu.email, status: 'exception', error: err.message })
    }
  }

  return {
    success: true,
    results,
    credentials: {
      note: 'All accounts use password: test1234',
      accounts: [
        { email: 'student@test.com', role: 'STUDENT', dashboard: '/student' },
        { email: 'parent@test.com', role: 'PARENT', dashboard: '/parent' },
        { email: 'admin@test.com', role: 'ADMIN', dashboard: '/admin' }
      ]
    }
  }
})
