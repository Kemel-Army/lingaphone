import { test, expect, type BrowserContext, type Page } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Teacher journal click-through: a teacher marks attendance and awards XP for a
 * student in their own group through the real UI, and we verify the writes
 * land in the DB (this also exercises the teacher-side RLS for Attendance /
 * XpLog / Student updates).
 */

function loadEnv() {
  const file = ['.env.lingaphone', '.env'].map(f => resolve(process.cwd(), f)).find(p => existsSync(p))!
  const raw = readFileSync(file, 'utf8')
  const get = (k: string) => raw.split('\n').find(l => l.startsWith(`${k}=`))?.slice(k.length + 1).trim().replace(/^"|"$/g, '') ?? ''
  return { URL: get('SUPABASE_URL'), SVC: get('SUPABASE_SERVICE_KEY') }
}
const { URL: SUPA, SVC } = loadEnv()
const TS = String(Date.now()).slice(-9)
const ACTOR_PW = 'E2eJrnl!2345'
const emails = { teacher: `e2e_tj_${TS}@linga.kz`, student: `e2e_sj_${TS}@linga.kz` }

function svc(path: string, init: RequestInit = {}) {
  return fetch(`${SUPA}/rest/v1/${path}`, { ...init, headers: { 'apikey': SVC, 'Authorization': `Bearer ${SVC}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) } })
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

const ids: { teacherId?: string, studentId?: string, groupId?: string, lessonId?: string } = {}

test.describe.configure({ mode: 'serial' })

test.describe('QA · teacher journal (click-through)', () => {
  let adminCtx: BrowserContext
  let teacherCtx: BrowserContext
  let page: Page

  test.beforeAll(async ({ browser }) => {
    adminCtx = await browser.newContext()
    await login(adminCtx, 'admin@linga.kz')
    // teacher + student
    const t = await adminCtx.request.post('/api/admin/teachers', { data: { name: 'TJ', surname: `JQA_${TS}`, email: emails.teacher, password: ACTOR_PW } })
    expect(t.status(), await t.text()).toBe(200); ids.teacherId = (await t.json()).id
    const s = await adminCtx.request.post('/api/admin/students', { data: { name: 'SJ', surname: `JQA_${TS}`, email: emails.student, password: ACTOR_PW, level: 'A1' } })
    expect(s.status(), await s.text()).toBe(200); ids.studentId = (await s.json()).studentId
    // group with the student
    const g = await adminCtx.request.post('/api/admin/groups', { data: { name: `JG_${TS}`, level: 'A1', teacherId: ids.teacherId, studentIds: [ids.studentId], schedule: { days: ['Пн'], time: '10:00' } } })
    expect(g.status(), await g.text()).toBe(200); ids.groupId = (await g.json()).id
    // teacher logs in + creates a lesson
    teacherCtx = await browser.newContext()
    await login(teacherCtx, emails.teacher, ACTOR_PW)
    const l = await teacherCtx.request.post('/api/teacher/lessons', { data: { groupId: ids.groupId, topic: 'Journal lesson', startsAt: '2026-07-05T10:00:00.000Z', durationMin: 60 } })
    expect(l.status(), await l.text()).toBe(200); ids.lessonId = (await l.json()).id
    page = await teacherCtx.newPage()
  })

  test.afterAll(async () => {
    if (ids.lessonId) await svc(`Attendance?lessonId=eq.${ids.lessonId}`, { method: 'DELETE' })
    if (ids.studentId) { await svc(`XpLog?studentId=eq.${ids.studentId}`, { method: 'DELETE' }); await svc(`Grade?studentId=eq.${ids.studentId}`, { method: 'DELETE' }) }
    if (ids.lessonId) await svc(`Lesson?id=eq.${ids.lessonId}`, { method: 'DELETE' })
    if (ids.groupId) { await svc(`GroupMember?groupId=eq.${ids.groupId}`, { method: 'DELETE' }); await svc(`Group?id=eq.${ids.groupId}`, { method: 'DELETE' }) }
    if (ids.studentId) await svc(`Student?id=eq.${ids.studentId}`, { method: 'DELETE' })
    if (ids.teacherId) await svc(`Teacher?id=eq.${ids.teacherId}`, { method: 'DELETE' })
    const us = await (await svc(`User?email=in.(${Object.values(emails).join(',')})&select=id,authId`)).json()
    await svc(`User?email=in.(${Object.values(emails).join(',')})`, { method: 'DELETE' })
    for (const u of us ?? []) if (u.authId) await fetch(`${SUPA}/auth/v1/admin/users/${u.authId}`, { method: 'DELETE', headers: { apikey: SVC, Authorization: `Bearer ${SVC}` } })
    await adminCtx?.close(); await teacherCtx?.close()
  })

  test('teacher marks attendance in the journal → Attendance row', async () => {
    await page.goto(`/teacher/groups/${ids.groupId}`, { waitUntil: 'networkidle' })
    await page.getByRole('tab', { name: /Журнал урока/ }).click()
    // pick the lesson
    await page.getByText('Выберите урок…').click()
    await page.getByRole('option').first().click()
    // mark "Был" (PRESENT) for the (single) student
    await page.getByRole('button', { name: 'Был', exact: true }).first().click()
    await expect.poll(async () => {
      const r = await (await svc(`Attendance?lessonId=eq.${ids.lessonId}&studentId=eq.${ids.studentId}&select=status`)).json()
      return Array.isArray(r) && r.length === 1 ? r[0].status : null
    }, { timeout: 15_000, message: 'attendance not written' }).toBe('PRESENT')
  })

  test('teacher award-xp endpoint awards XP → XpLog row', async () => {
    // The members-tab XP button calls this endpoint; hit it directly so a
    // failure surfaces the server message instead of a swallowed UI toast.
    const r = await teacherCtx.request.post('/api/teacher/award-xp', {
      data: { studentId: ids.studentId, amount: 10, reason: 'Крутой ответ' }
    })
    expect(r.status(), `award-xp: ${await r.text()}`).toBe(200)
    await expect.poll(async () => {
      const x = await (await svc(`XpLog?studentId=eq.${ids.studentId}&select=amount`)).json()
      return Array.isArray(x) ? x.length : 0
    }, { timeout: 15_000, message: 'XP not written' }).toBeGreaterThan(0)
  })

  test('teacher saves a grade in the journal grid → Grade row (RLS + gradedBy FK)', async () => {
    await page.goto('/teacher/grades', { waitUntil: 'networkidle' })
    // select the group via the USelect combobox
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: /JG_/ }).first().click()
    // grid renders → click the empty grade cell ("—") to enter edit mode
    await expect(page.getByRole('button', { name: '—' }).first()).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: '—' }).first().click()
    await page.locator('input[type="number"]').first().fill('5')
    // save: in edit mode the only table buttons are the ✓ (save) then ✗ (cancel)
    await page.locator('table').getByRole('button').first().click()
    await expect.poll(async () => {
      const g = await (await svc(`Grade?lessonId=eq.${ids.lessonId}&studentId=eq.${ids.studentId}&select=value,gradedBy`)).json()
      return Array.isArray(g) && g.length === 1 ? g[0].value : null
    }, { timeout: 15_000, message: 'grade not saved (Grade RLS / gradedBy FK?)' }).toBe(5)
  })
})
