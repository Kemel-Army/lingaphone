/**
 * Create / delete throwaway accounts used only for manual QA passes.
 *
 *   node scripts/qa-temp-account.mjs create ADMIN
 *   node scripts/qa-temp-account.mjs create TEACHER
 *   node scripts/qa-temp-account.mjs create STUDENT
 *   node scripts/qa-temp-account.mjs create            # all three
 *   node scripts/qa-temp-account.mjs delete            # removes all three
 *
 * Each role gets one auth user, one `User` row and — for TEACHER/STUDENT — the
 * matching profile row. `delete` removes every artefact it created, including
 * group membership, and re-syncs the affected group chat. Never point this at
 * anything but a database you own.
 */
import { readFileSync } from 'node:fs'

const envFile = readFileSync('.env.lingaphone', 'utf8')
const env = Object.fromEntries(
  envFile.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')]
    })
)

const URL = env.SUPABASE_URL
const SERVICE = env.SUPABASE_SERVICE_KEY
const ANON = env.SUPABASE_KEY

const PASSWORD = 'QaReview!2026#temp'
const ROLES = ['ADMIN', 'TEACHER', 'STUDENT']
const emailFor = role => `qa-review-${role.toLowerCase()}@lingaphone.invalid`

const api = async (path, init = {}) => {
  const res = await fetch(`${URL}${path}`, {
    ...init,
    headers: {
      'apikey': SERVICE,
      'Authorization': `Bearer ${SERVICE}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    }
  })
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  return { status: res.status, body }
}

const findAuthUser = async (email) => {
  const r = await api('/auth/v1/admin/users?page=1&per_page=500')
  return (r.body?.users ?? []).find(u => u.email === email) ?? null
}

const createRole = async (role) => {
  const email = emailFor(role)

  let authUser = await findAuthUser(email)
  if (!authUser) {
    const r = await api('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { name: 'QA', surname: role }
      })
    })
    if (r.status >= 300) throw new Error(`createUser ${role} ${r.status}: ${JSON.stringify(r.body)}`)
    authUser = r.body
  }

  const existing = await api(`/rest/v1/User?select=id&email=eq.${encodeURIComponent(email)}`)
  let userId = Array.isArray(existing.body) && existing.body[0]?.id
  if (!userId) {
    const r = await api('/rest/v1/User', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        authId: authUser.id,
        email,
        name: 'QA',
        surname: role,
        role
      })
    })
    if (r.status >= 300) throw new Error(`User insert ${role} ${r.status}: ${JSON.stringify(r.body)}`)
    userId = r.body[0].id
  }

  // Profile row so role-scoped pages have something to resolve.
  if (role === 'TEACHER') {
    const has = await api(`/rest/v1/Teacher?select=id&userId=eq.${userId}`)
    if (!Array.isArray(has.body) || !has.body.length) {
      const r = await api('/rest/v1/Teacher', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ userId })
      })
      if (r.status >= 300) throw new Error(`Teacher insert ${r.status}: ${JSON.stringify(r.body)}`)
    }
  }
  if (role === 'STUDENT') {
    const has = await api(`/rest/v1/Student?select=id&userId=eq.${userId}`)
    if (!Array.isArray(has.body) || !has.body.length) {
      const r = await api('/rest/v1/Student', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ userId })
      })
      if (r.status >= 300) throw new Error(`Student insert ${r.status}: ${JSON.stringify(r.body)}`)
    }
  }

  // Confirm the JWT actually carries the role (custom_access_token_hook).
  const tok = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD })
  })
  const tokBody = await tok.json()
  if (!tokBody.access_token) throw new Error(`login failed for ${role}: ${JSON.stringify(tokBody)}`)
  const claims = JSON.parse(Buffer.from(tokBody.access_token.split('.')[1], 'base64').toString())
  console.log(`${role.padEnd(8)} ok — user_role=${claims.user_role} user_id=${claims.user_id} email=${email}`)
}

const removeRole = async (role) => {
  const email = emailFor(role)
  const userRow = await api(`/rest/v1/User?select=id&email=eq.${encodeURIComponent(email)}`)
  const userId = Array.isArray(userRow.body) && userRow.body[0]?.id

  if (userId && role === 'STUDENT') {
    const st = await api(`/rest/v1/Student?select=id&userId=eq.${userId}`)
    const studentId = Array.isArray(st.body) && st.body[0]?.id
    if (studentId) {
      await api(`/rest/v1/GroupMember?studentId=eq.${studentId}`, { method: 'DELETE' })
      await api(`/rest/v1/Student?id=eq.${studentId}`, { method: 'DELETE' })
    }
  }
  if (userId && role === 'TEACHER') {
    await api(`/rest/v1/Teacher?userId=eq.${userId}`, { method: 'DELETE' })
  }
  if (userId) {
    await api(`/rest/v1/User?id=eq.${userId}`, { method: 'DELETE' })
  }

  const authUser = await findAuthUser(email)
  if (authUser) await api(`/auth/v1/admin/users/${authUser.id}`, { method: 'DELETE' })

  const leftRow = await api(`/rest/v1/User?select=id&email=eq.${encodeURIComponent(email)}`)
  const leftAuth = await findAuthUser(email)
  const clean = Array.isArray(leftRow.body) && leftRow.body.length === 0 && !leftAuth
  console.log(`${role.padEnd(8)} removed — clean=${clean}`)
  return clean
}

const cmd = process.argv[2]
const only = process.argv[3]
const roles = only ? [only.toUpperCase()] : ROLES

if (cmd === 'create') {
  for (const r of roles) await createRole(r)
  console.log(`\nQA_PASSWORD=${PASSWORD}`)
} else if (cmd === 'delete') {
  let allClean = true
  for (const r of roles) allClean = (await removeRole(r)) && allClean
  console.log(`\nall clean: ${allClean}`)
} else {
  console.log('usage: node scripts/qa-temp-account.mjs create|delete [ADMIN|TEACHER|STUDENT]')
  process.exit(1)
}
