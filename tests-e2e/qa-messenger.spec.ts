import { test, expect, type BrowserContext, type Page } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Messenger: a student sends a message (persist + render) and receives a
 * message injected by the other party in real time (Supabase Realtime).
 */

function loadEnv() {
  const file = ['.env.lingaphone', '.env'].map(f => resolve(process.cwd(), f)).find(p => existsSync(p))!
  const raw = readFileSync(file, 'utf8')
  const get = (k: string) => raw.split('\n').find(l => l.startsWith(`${k}=`))?.slice(k.length + 1).trim().replace(/^"|"$/g, '') ?? ''
  return { URL: get('SUPABASE_URL'), SVC: get('SUPABASE_SERVICE_KEY') }
}
const { URL: SUPA, SVC } = loadEnv()
const TS = String(Date.now()).slice(-9)

function svc(path: string, init: RequestInit = {}) {
  return fetch(`${SUPA}/rest/v1/${path}`, { ...init, headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers ?? {}) } })
}
async function login(ctx: BrowserContext, email: string, password = 'password123') {
  const p = await ctx.newPage()
  await p.goto('/login', { waitUntil: 'networkidle' })
  await p.locator('input[type="email"]').fill(email)
  await p.locator('input[type="password"]').fill(password)
  await p.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect.poll(async () => (await ctx.cookies()).some(c => /auth-token/.test(c.name)), { timeout: 30_000 }).toBe(true)
  await p.close()
}

test.describe.configure({ mode: 'serial' })

test.describe('QA · messenger (send + realtime receive)', () => {
  let ctx: BrowserContext
  let page: Page
  let convId = ''
  let studentUserId = ''
  let teacherUserId = ''

  test.beforeAll(async ({ browser }) => {
    const stu = await (await svc('User?email=eq.student@linga.kz&select=id')).json()
    const tea = await (await svc('User?email=eq.teacher@linga.kz&select=id')).json()
    studentUserId = stu[0].id; teacherUserId = tea[0].id
    const conv = await (await svc('Conversation', { method: 'POST', body: JSON.stringify({ kind: 'DIRECT', participantIds: [studentUserId, teacherUserId] }) })).json()
    convId = conv[0].id
    ctx = await browser.newContext()
    await login(ctx, 'student@linga.kz')
    page = await ctx.newPage()
  })

  test.afterAll(async () => {
    // remove the test messages (they may have landed in any active conversation)
    await svc(`Message?body=like.ping_${TS}`, { method: 'DELETE' })
    await svc(`Message?body=like.pong_${TS}`, { method: 'DELETE' })
    if (convId) {
      await svc(`Message?conversationId=eq.${convId}`, { method: 'DELETE' })
      await svc(`Conversation?id=eq.${convId}`, { method: 'DELETE' })
    }
    await ctx?.close()
  })

  let activeConvId = ''

  test('student sends a message → persisted + rendered', async () => {
    await page.goto('/student/messenger', { waitUntil: 'networkidle' })
    // newest conversation (the one created in beforeAll) is auto-selected
    const text = `ping_${TS}`
    const input = page.getByPlaceholder('Напиши сообщение...')
    await expect(input).toBeVisible({ timeout: 10_000 })
    await input.fill(text)
    await input.press('Enter')
    // persisted (find it regardless of which conversation is active)
    await expect.poll(async () => {
      const m = await (await svc(`Message?senderId=eq.${studentUserId}&body=eq.${text}&select=conversationId`)).json()
      if (Array.isArray(m) && m.length) { activeConvId = m[0].conversationId; return true }
      return false
    }, { timeout: 15_000, message: 'sent message not persisted (Message insert RLS?)' }).toBe(true)
    await expect(page.getByText(text)).toBeVisible({ timeout: 10_000 })
  })

  test('incoming message appears in real time', async () => {
    const text = `pong_${TS}`
    // other party sends — injected to the active conversation to simulate their client
    const ins = await svc('Message', { method: 'POST', body: JSON.stringify({ conversationId: activeConvId, senderId: teacherUserId, body: text }) })
    expect(ins.status, `inject: ${await ins.text()}`).toBeLessThan(300)
    await expect(page.getByText(text)).toBeVisible({ timeout: 20_000 })
  })
})
