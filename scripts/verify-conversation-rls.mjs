/**
 * Proves that a plain authenticated user can no longer forge conversations.
 *
 * Before 20260811120000_drop_open_conversation_insert.sql the `Conversation`
 * table carried `authenticated_insert_conversations` with
 * `WITH CHECK (auth.uid() IS NOT NULL)` — participantIds went unchecked, so any
 * logged-in user could invent a conversation with anyone and then post into it
 * (msg_participant_insert only verifies membership, which they had just granted
 * themselves).
 *
 * Run against a database you own. Creates one throwaway STUDENT and removes it,
 * along with anything the probe managed to insert.
 *
 *   node scripts/verify-conversation-rls.mjs
 */
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.lingaphone', 'utf8')
    .split('\n')
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
const EMAIL = 'qa-rls-probe@lingaphone.invalid'
const PASSWORD = 'QaProbe!2026#temp'

const svc = (path, init = {}) => fetch(`${URL}${path}`, {
  ...init,
  headers: {
    'apikey': SERVICE,
    'Authorization': `Bearer ${SERVICE}`,
    'Content-Type': 'application/json',
    ...(init.headers ?? {})
  }
})

const asUser = (jwt, path, init = {}) => fetch(`${URL}${path}`, {
  ...init,
  headers: {
    'apikey': ANON,
    'Authorization': `Bearer ${jwt}`,
    'Content-Type': 'application/json',
    ...(init.headers ?? {})
  }
})

const results = []
const check = (label, passed, detail = '') => {
  results.push({ label, passed, detail })
  console.log(`  ${passed ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`)
}

// ── setup ───────────────────────────────────────────────────────────────────
let authId = null
let userId = null
let forgedConversationId = null

const listUser = async () => {
  const r = await svc('/auth/v1/admin/users?page=1&per_page=500')
  const j = await r.json()
  return (j.users ?? []).find(u => u.email === EMAIL) ?? null
}

try {
  let existing = await listUser()
  if (!existing) {
    const r = await svc('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, email_confirm: true })
    })
    existing = await r.json()
  }
  authId = existing.id

  const ur = await svc('/rest/v1/User', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ authId, email: EMAIL, name: 'QA', surname: 'Probe', role: 'STUDENT' })
  })
  const urj = await ur.json()
  userId = Array.isArray(urj) ? urj[0]?.id : null
  if (!userId) throw new Error('не удалось создать User: ' + JSON.stringify(urj))

  const tr = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  })
  const { access_token: jwt } = await tr.json()
  if (!jwt) throw new Error('не удалось залогиниться пробным пользователем')

  console.log('\nпробный STUDENT создан, проверки:\n')

  // ── 1. forging a conversation must now be refused ─────────────────────────
  const victim = await svc('/rest/v1/User?select=id&role=eq.STUDENT&limit=1')
  const victimId = (await victim.json())[0]?.id

  const forge = await asUser(jwt, '/rest/v1/Conversation', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ kind: 'DIRECT', participantIds: [userId, victimId] })
  })
  const forgeBody = await forge.text()
  if (forge.ok) {
    try {
      forgedConversationId = JSON.parse(forgeBody)[0]?.id
    } catch { /* ignore */ }
  }
  check(
    'создание беседы обычным пользователем отклонено',
    !forge.ok,
    forge.ok ? 'ДЫРА ОТКРЫТА: беседа создана' : `HTTP ${forge.status}`
  )

  // ── 2. posting into someone else's conversation must be refused ───────────
  const others = await svc('/rest/v1/Conversation?select=id,participantIds&limit=5')
  const foreign = (await others.json()).find(c => !(c.participantIds ?? []).includes(userId))
  if (foreign) {
    const post = await asUser(jwt, '/rest/v1/Message', {
      method: 'POST',
      body: JSON.stringify({ conversationId: foreign.id, senderId: userId, body: 'rls probe' })
    })
    check(
      'запись в чужую беседу отклонена',
      !post.ok,
      post.ok ? 'ДЫРА: сообщение записано' : `HTTP ${post.status}`
    )

    const read = await asUser(jwt, `/rest/v1/Message?select=id&conversationId=eq.${foreign.id}`)
    const rows = await read.json()
    check(
      'чтение чужой переписки не отдаёт строк',
      Array.isArray(rows) && rows.length === 0,
      `строк: ${Array.isArray(rows) ? rows.length : '?'}`
    )
  }

  // ── 3. and cannot see conversations it is not part of ─────────────────────
  const list = await asUser(jwt, '/rest/v1/Conversation?select=id')
  const visible = await list.json()
  check(
    'список бесед пуст для постороннего',
    Array.isArray(visible) && visible.length === 0,
    `видно: ${Array.isArray(visible) ? visible.length : '?'}`
  )
} finally {
  // ── cleanup ───────────────────────────────────────────────────────────────
  if (forgedConversationId) {
    await svc(`/rest/v1/Message?conversationId=eq.${forgedConversationId}`, { method: 'DELETE' })
    await svc(`/rest/v1/Conversation?id=eq.${forgedConversationId}`, { method: 'DELETE' })
  }
  if (userId) {
    await svc(`/rest/v1/Message?senderId=eq.${userId}`, { method: 'DELETE' })
    await svc(`/rest/v1/User?id=eq.${userId}`, { method: 'DELETE' })
  }
  if (authId) await svc(`/auth/v1/admin/users/${authId}`, { method: 'DELETE' })

  const leftUser = await svc(`/rest/v1/User?select=id&email=eq.${encodeURIComponent(EMAIL)}`)
  const leftRows = await leftUser.json()
  const leftAuth = await listUser()
  console.log(`\nочистка: User=${Array.isArray(leftRows) ? leftRows.length : '?'} auth=${leftAuth ? 'остался' : 'удалён'}`)
}

const failed = results.filter(r => !r.passed)
console.log(`\nитог: ${results.length - failed.length}/${results.length} пройдено`)
process.exit(failed.length ? 1 : 0)
