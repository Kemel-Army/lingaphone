import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/shared/types/database.types'

// Self-registration is intentionally limited to STUDENT and PARENT.
// ADMIN must be provisioned through admin tooling, not this public endpoint.
const bodySchema = z.object({
  authId: z.string().uuid(),
  email: z.string().email().max(254),
  name: z.string().min(1).max(100).trim(),
  surname: z.string().min(1).max(100).trim(),
  role: z.enum(['STUDENT', 'PARENT']),
  phone: z.string().max(20).nullish(),
  grade: z.number().int().min(1).max(6).nullish()
})

/**
 * Server route: POST /api/auth/register
 * Creates the User row (and Student/Parent) in the database after Supabase Auth signup.
 *
 * Security:
 *  - role enum allows only STUDENT and PARENT — ADMIN cannot be self-assigned.
 *  - Verifies that body.authId actually exists in auth.users and that the
 *    auth.users row's email matches body.email — prevents anonymous attackers
 *    from minting User rows for arbitrary auth identities.
 *  - Refuses to write if a User row already exists for this authId or email
 *    (so an attacker can't take over an existing account by re-registering).
 */
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const { authId, email, name, surname, role, phone, grade } = body

  const supabase = serverSupabaseServiceRole<Database>(event)

  // Confirm the auth user exists and matches the supplied email.
  const { data: authLookup, error: authLookupErr } = await supabase.auth.admin.getUserById(authId)
  if (authLookupErr || !authLookup?.user) {
    throw createError({ statusCode: 400, message: 'Auth user not found' })
  }
  const authEmail = authLookup.user.email?.toLowerCase().trim()
  if (!authEmail || authEmail !== email.toLowerCase().trim()) {
    throw createError({ statusCode: 400, message: 'Email mismatch' })
  }

  // Refuse if a User row already exists for this authId or email.
  // Two separate .eq() queries are used instead of .or(`authId.eq.${authId},email.eq.${email}`)
  // because PostgREST's .or() uses commas as separators and would mis-parse
  // any email whose local-part contains an embedded comma (RFC 5321 allows it).
  const [{ data: byAuthId }, { data: byEmail }] = await Promise.all([
    supabase.from('User').select('id').eq('authId', authId).maybeSingle(),
    supabase.from('User').select('id').eq('email', email).maybeSingle()
  ])
  if (byAuthId || byEmail) {
    throw createError({ statusCode: 409, message: 'User already registered' })
  }

  // 1. Create User record
  const { data: user, error: userError } = await supabase
    .from('User')
    .insert({
      authId,
      email,
      name,
      surname,
      role,
      phone: phone || null
    })
    .select()
    .single()

  if (userError) {
    throw createError({ statusCode: 500, message: userError.message })
  }

  // 2. Create role-specific record
  if (role === 'STUDENT') {
    const { data: student, error: studentError } = await supabase
      .from('Student')
      .insert({
        userId: user.id,
        grade: grade || 1
      })
      .select('id')
      .single()

    if (studentError) {
      console.error('Student creation error:', studentError)
    }

    // Create GameProfile for student
    if (student) {
      const { error: gameError } = await supabase
        .from('StudentGameProfile')
        .insert({ studentId: student.id })
      if (gameError) {
        console.error('GameProfile creation error:', gameError)
      }
    }
  }

  if (role === 'PARENT') {
    const { error: parentError } = await supabase
      .from('Parent')
      .insert({ userId: user.id })
    if (parentError) {
      console.error('Parent creation error:', parentError)
    }
  }

  return { success: true, userId: user.id }
})
