import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Full business-logic + data-isolation suite.
 *
 * Builds a real multi-actor scenario through the actual create endpoints
 * (admin cookie-authed), then verifies every isolation invariant by querying
 * PostgREST with each actor's real JWT (so RLS is the thing under test):
 *
 *   Teacher A → Group GA → Student X
 *   Teacher B → Group GB → Student Y
 *   Student Z → no group
 *   Teacher A creates Lesson LA + Homework HWA in GA
 *   Teacher B creates Lesson LB + Homework HWB in GB
 *
 * Invariants asserted:
 *   - creation endpoints succeed (no errors), rows land in DB
 *   - teacher A sees student X, NOT Y/Z; sees group GA, NOT GB
 *   - student X sees homework HWA, NOT HWB; sees group GA, NOT GB
 *   - student Z (ungrouped) sees no homework
 *   - student X cannot read student Y's row
 *   - student X submits HWA → teacher A sees the submission, teacher B does NOT,
 *     student Y does NOT
 *
 * All created rows + auth users are deleted in afterAll (FK-safe order).
 */

// ---------------------------------------------------------------- env / config
function loadEnv() {
  const file = ['.env.lingaphone', '.env'].map(f => resolve(process.cwd(), f)).find(p => existsSync(p))
  if (!file) throw new Error('no .env(.lingaphone) found')
  const raw = readFileSync(file, 'utf8')
  const get = (k: string) => raw.split('\n').find(l => l.startsWith(`${k}=`))?.slice(k.length + 1).trim().replace(/^"|"$/g, '') ?? ''
  return { URL: get('SUPABASE_URL'), ANON: get('SUPABASE_KEY'), SVC: get('SUPABASE_SERVICE_KEY') }
}
const { URL: SUPA, ANON, SVC } = loadEnv()
const PASSWORD = 'password123'
const TS = String(Date.now()).slice(-9)
const E = (s: string) => `e2e_${s}_${TS}@linga.kz`
const ACTOR_PW = 'E2eFlow!2345'

// -------------------------------------------------------------- REST utilities
async function gotrueToken(email: string, password: string): Promise<string> {
  const r = await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const j = await r.json()
  if (!j.access_token) throw new Error(`login failed for ${email}: ${JSON.stringify(j)}`)
  return j.access_token
}
function rest(token: string, apiKey: string = ANON) {
  return async (path: string, init: RequestInit = {}) => {
    const r = await fetch(`${SUPA}/rest/v1/${path}`, {
      ...init,
      headers: { 'apikey': apiKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) }
    })
    const text = await r.text()
    const body = text ? JSON.parse(text) : null
    return { status: r.status, body }
  }
}
// Service role bypasses RLS — used only for setup-id lookups + cleanup.
// New-style sb_secret_ keys must appear in BOTH apikey and Authorization.
const svc = rest(SVC, SVC)

// ------------------------------------------------------------------- UI helper
async function login(ctx: BrowserContext, email: string, password = PASSWORD) {
  const page = await ctx.newPage()
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect.poll(async () => (await ctx.cookies()).some(c => /auth-token/.test(c.name)),
    { timeout: 30_000, message: `login failed: ${email}` }).toBe(true)
  await page.close()
}

// ------------------------------------------------------------ shared scenario
type Ids = {
  teacherA?: string; teacherB?: string
  studentX?: string; studentY?: string; studentZ?: string
  groupA?: string; groupB?: string
  lessonA?: string; lessonB?: string
  hwA?: string; hwB?: string
}
const ids: Ids = {}
const emails = {
  teacherA: E('ta'), teacherB: E('tb'),
  studentX: E('sx'), studentY: E('sy'), studentZ: E('sz')
}
let adminCtx: BrowserContext

test.describe.configure({ mode: 'serial' })

test.describe('QA · business logic & isolation', () => {
  test.beforeAll(async ({ browser }) => {
    adminCtx = await browser.newContext()
    await login(adminCtx, 'admin@linga.kz')
  })

  test.afterAll(async () => {
    // FK-safe teardown. Best-effort; ignore individual failures.
    const all = Object.values(emails)
    if (ids.hwA || ids.hwB) {
      const hwIds = [ids.hwA, ids.hwB].filter(Boolean)
      await svc(`HomeworkSubmission?homeworkId=in.(${hwIds.join(',')})`, { method: 'DELETE' })
      await svc(`Homework?id=in.(${hwIds.join(',')})`, { method: 'DELETE' })
    }
    const lessonIds = [ids.lessonA, ids.lessonB].filter(Boolean)
    if (lessonIds.length) await svc(`Lesson?id=in.(${lessonIds.join(',')})`, { method: 'DELETE' })
    const groupIds = [ids.groupA, ids.groupB].filter(Boolean)
    if (groupIds.length) {
      await svc(`GroupMember?groupId=in.(${groupIds.join(',')})`, { method: 'DELETE' })
      await svc(`Group?id=in.(${groupIds.join(',')})`, { method: 'DELETE' })
    }
    const studentIds = [ids.studentX, ids.studentY, ids.studentZ].filter(Boolean)
    if (studentIds.length) await svc(`Student?id=in.(${studentIds.join(',')})`, { method: 'DELETE' })
    const teacherIds = [ids.teacherA, ids.teacherB].filter(Boolean)
    if (teacherIds.length) await svc(`Teacher?id=in.(${teacherIds.join(',')})`, { method: 'DELETE' })
    // Collect authIds before deleting User rows, then delete auth users
    const usersRes = await svc(`User?email=in.(${all.join(',')})&select=id,authId`)
    const authIds: string[] = (usersRes.body ?? []).map((u: { authId: string }) => u.authId).filter(Boolean)
    await svc(`User?email=in.(${all.join(',')})`, { method: 'DELETE' })
    for (const aid of authIds) {
      await fetch(`${SUPA}/auth/v1/admin/users/${aid}`, { method: 'DELETE', headers: { apikey: SVC, Authorization: `Bearer ${SVC}` } })
    }
    await adminCtx?.close()
  })

  // ----------------------------------------------------------- CREATION FLOWS
  test('admin creates two teachers (auth user + Teacher row)', async () => {
    for (const key of ['teacherA', 'teacherB'] as const) {
      const r = await adminCtx.request.post('/api/admin/teachers', {
        data: { name: key, surname: `QA_${TS}`, email: emails[key], password: ACTOR_PW, yearsOfExperience: 5 }
      })
      expect(r.status(), `create ${key}: ${await r.text()}`).toBe(200)
      ids[key] = (await r.json()).id
    }
    // auth users actually created → can log in
    await expect(gotrueToken(emails.teacherA, ACTOR_PW)).resolves.toBeTruthy()
  })

  test('admin creates three students', async () => {
    for (const key of ['studentX', 'studentY', 'studentZ'] as const) {
      const r = await adminCtx.request.post('/api/admin/students', {
        data: { name: key, surname: `QA_${TS}`, email: emails[key], password: ACTOR_PW, level: 'A1' }
      })
      expect(r.status(), `create ${key}: ${await r.text()}`).toBe(200)
      ids[key] = (await r.json()).studentId
    }
    expect(ids.studentX && ids.studentY && ids.studentZ).toBeTruthy()
  })

  test('admin creates two groups with members + schedule', async () => {
    const rA = await adminCtx.request.post('/api/admin/groups', {
      data: { name: `GA_${TS}`, level: 'A1', teacherId: ids.teacherA, studentIds: [ids.studentX], schedule: { days: ['Пн', 'Ср'], time: '10:00' } }
    })
    expect(rA.status(), `create GA: ${await rA.text()}`).toBe(200)
    ids.groupA = (await rA.json()).id
    const rB = await adminCtx.request.post('/api/admin/groups', {
      data: { name: `GB_${TS}`, level: 'A1', teacherId: ids.teacherB, studentIds: [ids.studentY], schedule: { days: ['Вт'], time: '12:00' } }
    })
    expect(rB.status(), `create GB: ${await rB.text()}`).toBe(200)
    ids.groupB = (await rB.json()).id

    // GroupMember rows actually landed
    const gm = await svc(`GroupMember?groupId=eq.${ids.groupA}&select=studentId`)
    expect(gm.body.map((m: { studentId: string }) => m.studentId)).toContain(ids.studentX)
  })

  test('teachers create lessons in their own groups', async () => {
    const tA = await browser_login_ctx('teacherA')
    const rLA = await tA.ctx.request.post('/api/teacher/lessons', {
      data: { groupId: ids.groupA, topic: 'LA topic', startsAt: '2026-07-01T10:00:00.000Z', durationMin: 60 }
    })
    expect(rLA.status(), `lesson A: ${await rLA.text()}`).toBe(200)
    ids.lessonA = (await rLA.json()).id
    await tA.ctx.close()

    const tB = await browser_login_ctx('teacherB')
    const rLB = await tB.ctx.request.post('/api/teacher/lessons', {
      data: { groupId: ids.groupB, topic: 'LB topic', startsAt: '2026-07-02T12:00:00.000Z', durationMin: 60 }
    })
    expect(rLB.status(), `lesson B: ${await rLB.text()}`).toBe(200)
    ids.lessonB = (await rLB.json()).id
    await tB.ctx.close()
  })

  test('teacher CANNOT create a lesson in another teacher\'s group', async () => {
    const tA = await browser_login_ctx('teacherA')
    const r = await tA.ctx.request.post('/api/teacher/lessons', {
      data: { groupId: ids.groupB, topic: 'intrusion', startsAt: '2026-07-03T10:00:00.000Z' }
    })
    expect([403, 404, 400], `teacher A reached B's group (status ${r.status()})`).toContain(r.status())
    await tA.ctx.close()
  })

  test('teachers create homework on their lessons (RLS insert)', async () => {
    const tokA = await gotrueToken(emails.teacherA, ACTOR_PW)
    const tokB = await gotrueToken(emails.teacherB, ACTOR_PW)
    const mk = async (tok: string, lessonId: string) => {
      const r = await rest(tok)('Homework', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ lessonId, format: 'TEXT', title: `HW_${TS}`, dueAt: '2026-07-10T00:00:00.000Z', maxScore: 10, payload: { prompt: 'write' } })
      })
      return r
    }
    const rA = await mk(tokA, ids.lessonA!)
    expect(rA.status, `hw A insert: ${JSON.stringify(rA.body)}`).toBeLessThan(300)
    ids.hwA = rA.body[0].id
    const rB = await mk(tokB, ids.lessonB!)
    expect(rB.status, `hw B insert: ${JSON.stringify(rB.body)}`).toBeLessThan(300)
    ids.hwB = rB.body[0].id
  })

  // -------------------------------------------------------------- ISOLATION
  test('teacher A sees student X only — NOT Y or Z', async () => {
    const tok = await gotrueToken(emails.teacherA, ACTOR_PW)
    const { body } = await rest(tok)('Student?select=id')
    const seen = new Set((body as { id: string }[]).map(s => s.id))
    expect(seen.has(ids.studentX!), 'teacher A should see student X').toBe(true)
    expect(seen.has(ids.studentY!), 'teacher A leaked student Y').toBe(false)
    expect(seen.has(ids.studentZ!), 'teacher A leaked ungrouped student Z').toBe(false)
  })

  test('teacher A sees group GA only — NOT GB', async () => {
    const tok = await gotrueToken(emails.teacherA, ACTOR_PW)
    const { body } = await rest(tok)('Group?select=id')
    const seen = new Set((body as { id: string }[]).map(g => g.id))
    expect(seen.has(ids.groupA!)).toBe(true)
    expect(seen.has(ids.groupB!), 'teacher A leaked group GB').toBe(false)
  })

  test('teacher A sees HWA but NOT HWB (homework scoped to own groups)', async () => {
    const tok = await gotrueToken(emails.teacherA, ACTOR_PW)
    const { body } = await rest(tok)('Homework?select=id')
    const seen = new Set((body as { id: string }[]).map(h => h.id))
    expect(seen.has(ids.hwA!), 'teacher A should see own group homework HWA').toBe(true)
    expect(seen.has(ids.hwB!), 'teacher A leaked homework HWB from another teacher\'s group').toBe(false)
  })

  test('student X sees homework HWA — NOT HWB', async () => {
    const tok = await gotrueToken(emails.studentX, ACTOR_PW)
    const { body } = await rest(tok)('Homework?select=id')
    const seen = new Set((body as { id: string }[]).map(h => h.id))
    expect(seen.has(ids.hwA!), 'student X should see own group homework HWA').toBe(true)
    expect(seen.has(ids.hwB!), 'student X leaked homework HWB from another group').toBe(false)
  })

  test('student Y sees homework HWB — NOT HWA', async () => {
    const tok = await gotrueToken(emails.studentY, ACTOR_PW)
    const { body } = await rest(tok)('Homework?select=id')
    const seen = new Set((body as { id: string }[]).map(h => h.id))
    expect(seen.has(ids.hwB!)).toBe(true)
    expect(seen.has(ids.hwA!), 'student Y leaked homework HWA').toBe(false)
  })

  test('ungrouped student Z sees neither homework', async () => {
    const tok = await gotrueToken(emails.studentZ, ACTOR_PW)
    const { body } = await rest(tok)('Homework?select=id')
    const seen = new Set((body as { id: string }[]).map(h => h.id))
    expect(seen.has(ids.hwA!) || seen.has(ids.hwB!), 'ungrouped student leaked homework').toBe(false)
  })

  test('student X sees own group GA — NOT GB', async () => {
    const tok = await gotrueToken(emails.studentX, ACTOR_PW)
    const { body } = await rest(tok)('Group?select=id')
    const seen = new Set((body as { id: string }[]).map(g => g.id))
    expect(seen.has(ids.groupA!)).toBe(true)
    expect(seen.has(ids.groupB!), 'student X leaked group GB').toBe(false)
  })

  test('student X cannot read student Y row', async () => {
    const tok = await gotrueToken(emails.studentX, ACTOR_PW)
    const { body } = await rest(tok)(`Student?id=eq.${ids.studentY}&select=id`)
    expect((body as unknown[]).length, 'student X read another student').toBe(0)
  })

  // ------------------------------------------------------ submission visibility
  test('student X submits HWA; only teacher A + X see it', async () => {
    const tokX = await gotrueToken(emails.studentX, ACTOR_PW)
    const ins = await rest(tokX)('HomeworkSubmission', {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify({ homeworkId: ids.hwA, studentId: ids.studentX, answers: { essay: 'my answer' }, status: 'SUBMITTED', submittedAt: '2026-06-28T00:00:00.000Z' })
    })
    expect(ins.status, `student submit failed: ${JSON.stringify(ins.body)}`).toBeLessThan(300)

    // Teacher A sees it (own group)
    const tokA = await gotrueToken(emails.teacherA, ACTOR_PW)
    const aSee = await rest(tokA)(`HomeworkSubmission?homeworkId=eq.${ids.hwA}&select=studentId`)
    expect((aSee.body as unknown[]).length, 'teacher A should see X submission').toBeGreaterThan(0)

    // Teacher B does NOT
    const tokB = await gotrueToken(emails.teacherB, ACTOR_PW)
    const bSee = await rest(tokB)(`HomeworkSubmission?homeworkId=eq.${ids.hwA}&select=studentId`)
    expect((bSee.body as unknown[]).length, 'teacher B leaked X submission').toBe(0)

    // Student Y does NOT
    const tokY = await gotrueToken(emails.studentY, ACTOR_PW)
    const ySee = await rest(tokY)(`HomeworkSubmission?homeworkId=eq.${ids.hwA}&select=studentId`)
    expect((ySee.body as unknown[]).length, 'student Y leaked X submission').toBe(0)
  })

  test('admin sees both new teachers and students in lists', async () => {
    const page = await adminCtx.newPage()
    await page.goto('/admin/teachers', { waitUntil: 'networkidle' })
    await expect(page.getByText(`QA_${TS}`).first()).toBeVisible({ timeout: 15_000 })
    await page.goto('/admin/students', { waitUntil: 'networkidle' })
    await expect(page.getByText(`QA_${TS}`).first()).toBeVisible({ timeout: 15_000 })
    await page.close()
  })
})

// login a freshly-created actor into its own browser context
let _browser: import('@playwright/test').Browser
test.beforeAll(async ({ browser }) => { _browser = browser })
async function browser_login_ctx(key: keyof typeof emails) {
  const ctx = await _browser.newContext()
  await login(ctx, emails[key], ACTOR_PW)
  return { ctx }
}
