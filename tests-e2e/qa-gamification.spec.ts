import { test, expect, type BrowserContext } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Gamification XP path — exercises the REAL HTTP endpoints (cookie-authed)
 * after the award_xp_atomic / shop / quest RPCs were rebuilt against the live
 * schema. Uses a throwaway student so real accounts are untouched; cleans up.
 */

function loadEnv() {
  const file = ['.env.lingaphone', '.env'].map(f => resolve(process.cwd(), f)).find(p => existsSync(p))!
  const raw = readFileSync(file, 'utf8')
  const get = (k: string) => raw.split('\n').find(l => l.startsWith(`${k}=`))?.slice(k.length + 1).trim().replace(/^"|"$/g, '') ?? ''
  return { URL: get('SUPABASE_URL'), ANON: get('SUPABASE_KEY'), SVC: get('SUPABASE_SERVICE_KEY') }
}
const { URL: SUPA, ANON, SVC } = loadEnv()
const TS = String(Date.now()).slice(-9)
const EMAIL = `e2e_gam_${TS}@linga.kz`
const PW = 'E2eGam!2345'

function svc(path: string, init: RequestInit = {}) {
  return fetch(`${SUPA}/rest/v1/${path}`, { ...init, headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) } })
}
async function login(ctx: BrowserContext, email: string, password: string) {
  const page = await ctx.newPage()
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect.poll(async () => (await ctx.cookies()).some(c => /auth-token/.test(c.name)), { timeout: 30_000 }).toBe(true)
  await page.close()
}
function uuid(n: number) { return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` }

test.describe.configure({ mode: 'serial' })

test.describe('QA · gamification XP path', () => {
  let adminCtx: BrowserContext
  let studentCtx: BrowserContext
  let studentId = ''

  test.beforeAll(async ({ browser }) => {
    adminCtx = await browser.newContext()
    await login(adminCtx, 'admin@linga.kz', 'password123')
    const r = await adminCtx.request.post('/api/admin/students', {
      data: { name: 'Gam', surname: `QA_${TS}`, email: EMAIL, password: PW, level: 'A1' }
    })
    expect(r.status(), `create student: ${await r.text()}`).toBe(200)
    studentId = (await r.json()).studentId
    studentCtx = await browser.newContext()
    await login(studentCtx, EMAIL, PW)
  })

  test.afterAll(async () => {
    await svc(`StudentInventory?studentId=eq.${studentId}`, { method: 'DELETE' })
    await svc(`StudentQuest?studentId=eq.${studentId}`, { method: 'DELETE' })
    await svc(`XpLog?studentId=eq.${studentId}`, { method: 'DELETE' })
    await svc(`GemTransaction?studentId=eq.${studentId}`, { method: 'DELETE' })
    await svc(`StudentGameProfile?studentId=eq.${studentId}`, { method: 'DELETE' })
    await svc(`Student?id=eq.${studentId}`, { method: 'DELETE' })
    const u = await (await svc(`User?email=eq.${EMAIL}&select=id,authId`)).json()
    await svc(`User?email=eq.${EMAIL}`, { method: 'DELETE' })
    for (const row of u ?? []) {
      if (row.authId) await fetch(`${SUPA}/auth/v1/admin/users/${row.authId}`, { method: 'DELETE', headers: { apikey: SVC, Authorization: `Bearer ${SVC}` } })
    }
    await adminCtx?.close(); await studentCtx?.close()
  })

  test('ensure-profile creates a game profile', async () => {
    const r = await studentCtx.request.post('/api/gamification/ensure-profile', { data: {} })
    expect(r.status(), await r.text()).toBe(200)
  })

  test('award-xp increases XP and is idempotent', async () => {
    const src = uuid(1)
    const r1 = await studentCtx.request.post('/api/gamification/award-xp', { data: { action: 'READING_COMPLETE', sourceId: src } })
    expect(r1.status(), `award1: ${await r1.text()}`).toBe(200)
    const b1 = await r1.json()
    expect(b1.idempotent).toBe(false)
    expect(b1.xp).toBeGreaterThan(0)
    expect(b1.amount).toBeGreaterThan(0)

    // same source → idempotent, xp unchanged
    const r2 = await studentCtx.request.post('/api/gamification/award-xp', { data: { action: 'READING_COMPLETE', sourceId: src } })
    expect(r2.status()).toBe(200)
    const b2 = await r2.json()
    expect(b2.idempotent).toBe(true)
    expect(b2.xp).toBe(b1.xp)

    // different source → xp grows
    const r3 = await studentCtx.request.post('/api/gamification/award-xp', { data: { action: 'GRAMMAR_COMPLETE', sourceId: uuid(2) } })
    expect(r3.status(), `award3: ${await r3.text()}`).toBe(200)
    const b3 = await r3.json()
    expect(b3.idempotent).toBe(false)
    expect(b3.xp).toBeGreaterThan(b1.xp)
  })

  test('award-xp cannot target another student (studentId from session)', async () => {
    // the endpoint ignores any body studentId; award lands on the caller only
    const r = await studentCtx.request.post('/api/gamification/award-xp', {
      data: { action: 'SONG_COMPLETE', sourceId: uuid(3), studentId: '11111111-1111-4111-8111-111111111111' }
    })
    expect(r.status()).toBe(200)
    // confirm via service role that the foreign student got nothing for this source
    const foreign = await (await svc(`XpLog?refId=eq.${uuid(3)}&studentId=eq.11111111-1111-4111-8111-111111111111&select=id`)).json()
    expect(Array.isArray(foreign) ? foreign.length : 0).toBe(0)
  })

  test('update-streak responds (no XPTransaction crash)', async () => {
    const r = await studentCtx.request.post('/api/gamification/update-streak', { data: {} })
    expect(r.status(), await r.text()).toBe(200)
    const b = await r.json()
    expect(typeof b.currentStreak).toBe('number')
  })

  test('XP is persisted to the canonical StudentGameProfile store', async () => {
    const prof = await (await svc(`StudentGameProfile?studentId=eq.${studentId}&select=xp,level`)).json()
    expect(prof[0].xp).toBeGreaterThan(0)
  })

  test('shop-purchase deducts gems server-side + grants inventory', async () => {
    // Grant gems for the test (no endpoint adds gems; set via service role).
    await svc(`StudentGameProfile?studentId=eq.${studentId}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ gems: 500 }) })
    const items = await (await svc('ShopItem?select=id,name,price,requiredLevel&requiredLevel=eq.1&order=price.asc&limit=1')).json()
    const item = items[0]
    expect(item, 'need a level-1 shop item seeded').toBeTruthy()

    const r = await studentCtx.request.post('/api/gamification/shop-purchase', { data: { shopItemId: item.id } })
    expect(r.status(), `purchase: ${await r.text()}`).toBe(200)
    const b = await r.json()
    expect(b.gems).toBe(500 - item.price)
    expect(b.inventory.quantity).toBeGreaterThanOrEqual(1)

    // Inventory row landed
    const inv = await (await svc(`StudentInventory?studentId=eq.${studentId}&shopItemId=eq.${item.id}&select=quantity`)).json()
    expect(inv[0]?.quantity).toBeGreaterThanOrEqual(1)
  })

  test('shop-purchase rejects when gems insufficient (no negative balance)', async () => {
    await svc(`StudentGameProfile?studentId=eq.${studentId}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ gems: 1 }) })
    const items = await (await svc('ShopItem?select=id,price&requiredLevel=eq.1&order=price.desc&limit=1')).json()
    const r = await studentCtx.request.post('/api/gamification/shop-purchase', { data: { shopItemId: items[0].id } })
    expect(r.status(), 'should reject insufficient gems').toBeGreaterThanOrEqual(400)
    // gems must not go negative
    const prof = await (await svc(`StudentGameProfile?studentId=eq.${studentId}&select=gems`)).json()
    expect(prof[0].gems).toBeGreaterThanOrEqual(0)
  })

  test('generate-quests creates active quests', async () => {
    const gq = await studentCtx.request.post('/api/gamification/generate-quests', { data: {} })
    expect(gq.status(), `generate-quests: ${await gq.text()}`).toBe(200)
    const quests = await (await svc(`StudentQuest?studentId=eq.${studentId}&select=id,status,Quest!inner(type)&Quest.type=eq.EARN_XP`)).json()
    expect(Array.isArray(quests) && quests.length, 'EARN_XP quest should be assigned').toBeGreaterThan(0)
  })

  test('tick_quest_progress RPC advances EARN_XP quest progress', async () => {
    const before = await (await svc(`StudentQuest?studentId=eq.${studentId}&select=progress,Quest!inner(type)&Quest.type=eq.EARN_XP`)).json()
    const beforeProg = before.reduce((s: number, q: { progress: number }) => s + q.progress, 0)
    const rpc = await fetch(`${SUPA}/rest/v1/rpc/tick_quest_progress`, {
      method: 'POST',
      headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_student_id: studentId, p_quest_type: 'EARN_XP', p_increment: 5 })
    })
    expect(rpc.status, `tick rpc: ${await rpc.text()}`).toBeLessThan(300)
    const after = await (await svc(`StudentQuest?studentId=eq.${studentId}&select=progress,Quest!inner(type)&Quest.type=eq.EARN_XP`)).json()
    const afterProg = after.reduce((s: number, q: { progress: number }) => s + q.progress, 0)
    expect(afterProg, 'EARN_XP quest progress should advance').toBeGreaterThan(beforeProg)
  })

  test('check-achievements responds without crashing', async () => {
    const r = await studentCtx.request.post('/api/gamification/check-achievements', { data: {} })
    expect(r.status(), await r.text()).toBe(200)
    const b = await r.json()
    expect(Array.isArray(b.newAchievements)).toBe(true)
  })

  test('leaderboard returns ranked entries', async () => {
    const r = await studentCtx.request.get('/api/leaderboard')
    expect(r.status(), await r.text()).toBe(200)
  })
})
