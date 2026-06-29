import { test, expect, type BrowserContext, type Page } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * FILE-format homework end-to-end: a student uploads a file for a FILE homework
 * (Supabase Storage, private bucket) and submits it; we verify the submission
 * persists the file reference. Throwaway teacher+student+group+lesson+homework.
 */

function loadEnv() {
  const file = ['.env.lingaphone', '.env'].map(f => resolve(process.cwd(), f)).find(p => existsSync(p))!
  const raw = readFileSync(file, 'utf8')
  const get = (k: string) => raw.split('\n').find(l => l.startsWith(`${k}=`))?.slice(k.length + 1).trim().replace(/^"|"$/g, '') ?? ''
  return { URL: get('SUPABASE_URL'), SVC: get('SUPABASE_SERVICE_KEY') }
}
const { URL: SUPA, SVC } = loadEnv()
const TS = String(Date.now()).slice(-9)
const ACTOR_PW = 'E2eFile!2345'
const emails = { teacher: `e2e_ft_${TS}@linga.kz`, student: `e2e_fs_${TS}@linga.kz` }

function svc(path: string, init: RequestInit = {}) {
  return fetch(`${SUPA}/rest/v1/${path}`, { ...init, headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers ?? {}) } })
}
async function login(ctx: BrowserContext, email: string, password: string) {
  const p = await ctx.newPage()
  await p.goto('/login', { waitUntil: 'networkidle' })
  await p.locator('input[type="email"]').fill(email)
  await p.locator('input[type="password"]').fill(password)
  await p.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect.poll(async () => (await ctx.cookies()).some(c => /auth-token/.test(c.name)), { timeout: 30_000 }).toBe(true)
  await p.close()
}

const ids: { teacherId?: string, studentId?: string, groupId?: string, lessonId?: string, hwId?: string } = {}

test.describe.configure({ mode: 'serial' })

test.describe('QA · FILE homework (upload + submit)', () => {
  let adminCtx: BrowserContext
  let studentCtx: BrowserContext
  let page: Page

  test.beforeAll(async ({ browser }) => {
    adminCtx = await browser.newContext()
    await login(adminCtx, 'admin@linga.kz', 'password123')
    const t = await adminCtx.request.post('/api/admin/teachers', { data: { name: 'FT', surname: `FQA_${TS}`, email: emails.teacher, password: ACTOR_PW } })
    expect(t.status(), await t.text()).toBe(200); ids.teacherId = (await t.json()).id
    const s = await adminCtx.request.post('/api/admin/students', { data: { name: 'FS', surname: `FQA_${TS}`, email: emails.student, password: ACTOR_PW, level: 'A1' } })
    expect(s.status(), await s.text()).toBe(200); ids.studentId = (await s.json()).studentId
    const g = await adminCtx.request.post('/api/admin/groups', { data: { name: `FG_${TS}`, level: 'A1', teacherId: ids.teacherId, studentIds: [ids.studentId], schedule: { days: ['Пн'], time: '10:00' } } })
    expect(g.status(), await g.text()).toBe(200); ids.groupId = (await g.json()).id
    studentCtx = await browser.newContext()
    await login(studentCtx, emails.student, ACTOR_PW)
    const teacherCtx = await browser.newContext()
    await login(teacherCtx, emails.teacher, ACTOR_PW)
    const l = await teacherCtx.request.post('/api/teacher/lessons', { data: { groupId: ids.groupId, topic: 'File lesson', startsAt: '2026-07-08T10:00:00.000Z', durationMin: 60 } })
    expect(l.status(), await l.text()).toBe(200); ids.lessonId = (await l.json()).id
    await teacherCtx.close()
    // FILE-format homework on that lesson
    const hw = await (await svc('Homework', { method: 'POST', body: JSON.stringify({ lessonId: ids.lessonId, format: 'FILE', title: `FileHW_${TS}`, description: 'Upload a doc', dueAt: '2026-07-20T00:00:00.000Z', maxScore: 10, payload: { prompt: 'Upload your work' } }) })).json()
    ids.hwId = hw[0].id
    page = await studentCtx.newPage()
  })

  test.afterAll(async () => {
    if (ids.hwId) await svc(`HomeworkSubmission?homeworkId=eq.${ids.hwId}`, { method: 'DELETE' })
    if (ids.hwId) await svc(`Homework?id=eq.${ids.hwId}`, { method: 'DELETE' })
    if (ids.lessonId) await svc(`Lesson?id=eq.${ids.lessonId}`, { method: 'DELETE' })
    if (ids.groupId) { await svc(`GroupMember?groupId=eq.${ids.groupId}`, { method: 'DELETE' }); await svc(`Group?id=eq.${ids.groupId}`, { method: 'DELETE' }) }
    if (ids.studentId) await svc(`Student?id=eq.${ids.studentId}`, { method: 'DELETE' })
    if (ids.teacherId) await svc(`Teacher?id=eq.${ids.teacherId}`, { method: 'DELETE' })
    const us = await (await svc(`User?email=in.(${Object.values(emails).join(',')})&select=id,authId`)).json()
    await svc(`User?email=in.(${Object.values(emails).join(',')})`, { method: 'DELETE' })
    for (const u of us ?? []) if (u.authId) await fetch(`${SUPA}/auth/v1/admin/users/${u.authId}`, { method: 'DELETE', headers: { apikey: SVC, Authorization: `Bearer ${SVC}` } })
    await adminCtx?.close(); await studentCtx?.close()
  })

  test('student uploads a file and submits → submission stores the file', async () => {
    await page.goto(`/student/homework/${ids.hwId}`, { waitUntil: 'networkidle' })
    // upload via the hidden file input
    await page.locator('input[type="file"]').setInputFiles({
      name: 'my-work.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC', 'base64')
    })
    // attachment appears
    await expect(page.getByText('my-work.png')).toBeVisible({ timeout: 15_000 })
    // submit
    await page.getByRole('button', { name: /Отправить на проверку/ }).click()
    // submission persisted with the file reference
    await expect.poll(async () => {
      const r = await (await svc(`HomeworkSubmission?homeworkId=eq.${ids.hwId}&studentId=eq.${ids.studentId}&select=answers,status`)).json()
      if (!Array.isArray(r) || !r.length) return false
      const files = (r[0].answers as { files?: unknown[] })?.files
      return Array.isArray(files) && files.length > 0
    }, { timeout: 15_000, message: 'FILE submission did not store the uploaded file' }).toBe(true)
  })
})
