import { test, expect, type BrowserContext, type Page } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * UI click-through tests — drive the REAL admin forms (modals, selects,
 * checkboxes) and verify the mutation actually landed in the DB. Complements
 * qa-flows (which hit the endpoints directly). Created rows + auth users are
 * cleaned up via the service role.
 */

function loadEnv() {
  const file = ['.env.lingaphone', '.env'].map(f => resolve(process.cwd(), f)).find(p => existsSync(p))!
  const raw = readFileSync(file, 'utf8')
  const get = (k: string) => raw.split('\n').find(l => l.startsWith(`${k}=`))?.slice(k.length + 1).trim().replace(/^"|"$/g, '') ?? ''
  return { URL: get('SUPABASE_URL'), ANON: get('SUPABASE_KEY'), SVC: get('SUPABASE_SERVICE_KEY') }
}
const { URL: SUPA, SVC } = loadEnv()
const TS = String(Date.now()).slice(-9)

function svc(path: string, init: RequestInit = {}) {
  return fetch(`${SUPA}/rest/v1/${path}`, { ...init, headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) } })
}
async function login(ctx: BrowserContext, email: string, password = 'password123') {
  const page = await ctx.newPage()
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect.poll(async () => (await ctx.cookies()).some(c => /auth-token/.test(c.name)), { timeout: 30_000 }).toBe(true)
  await page.close()
}

const created = {
  teacherEmail: `e2e_uit_${TS}@linga.kz`,
  studentEmail: `e2e_uis_${TS}@linga.kz`,
  groupName: `UIG_${TS}`,
  surname: `UIQA_${TS}`
}

test.describe.configure({ mode: 'serial' })

test.describe('QA · admin UI mutations (click-through)', () => {
  let ctx: BrowserContext
  let page: Page

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext()
    await login(ctx, 'admin@linga.kz')
    page = await ctx.newPage()
  })

  test.afterAll(async () => {
    // Clean created group, then student/teacher + their auth users.
    const grp = await (await svc(`Group?name=eq.${created.groupName}&select=id`)).json()
    for (const g of grp ?? []) {
      await svc(`GroupMember?groupId=eq.${g.id}`, { method: 'DELETE' })
      await svc(`Group?id=eq.${g.id}`, { method: 'DELETE' })
    }
    const emails = [created.teacherEmail, created.studentEmail]
    const users = await (await svc(`User?email=in.(${emails.join(',')})&select=id,authId,role`)).json()
    for (const u of users ?? []) {
      if (u.role === 'TEACHER') await svc(`Teacher?userId=eq.${u.id}`, { method: 'DELETE' })
      if (u.role === 'STUDENT') await svc(`Student?userId=eq.${u.id}`, { method: 'DELETE' })
    }
    await svc(`User?email=in.(${emails.join(',')})`, { method: 'DELETE' })
    for (const u of users ?? []) {
      if (u.authId) await fetch(`${SUPA}/auth/v1/admin/users/${u.authId}`, { method: 'DELETE', headers: { apikey: SVC, Authorization: `Bearer ${SVC}` } })
    }
    await ctx?.close()
  })

  test('create teacher via modal form → row in DB', async () => {
    await page.goto('/admin/teachers', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /Добавить учителя|Добавить первого/ }).first().click()
    const d = page.getByRole('dialog')
    await expect(d).toBeVisible()
    await d.getByRole('textbox', { name: /Фамилия/ }).fill(created.surname)
    await d.getByRole('textbox', { name: /Имя/ }).fill('UITeacher')
    await d.getByRole('textbox', { name: /Email/ }).fill(created.teacherEmail)
    await d.getByPlaceholder('••••••••').first().fill('UIpass!2345')
    await d.getByRole('button', { name: 'Создать аккаунт' }).click()
    // DB confirms the create endpoint ran and wrote a Teacher row
    await expect.poll(async () => {
      const r = await (await svc(`User?email=eq.${created.teacherEmail}&select=id,role`)).json()
      return Array.isArray(r) && r.length === 1 && r[0].role === 'TEACHER'
    }, { timeout: 15_000, message: 'teacher row never appeared' }).toBe(true)
    // and the row is visible in the list
    await expect(page.getByText(created.surname).first()).toBeVisible({ timeout: 15_000 })
  })

  test('create student via modal form → row in DB', async () => {
    await page.goto('/admin/students', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /Добавить ученика|Добавить первого/ }).first().click()
    const d = page.getByRole('dialog')
    await expect(d).toBeVisible()
    await d.getByRole('textbox', { name: /Фамилия/ }).fill(created.surname)
    await d.getByRole('textbox', { name: /Имя/ }).fill('UIStudent')
    await d.getByRole('textbox', { name: /Email/ }).fill(created.studentEmail)
    await d.getByPlaceholder('••••••••').first().fill('UIpass!2345')
    await d.getByRole('button', { name: 'Создать аккаунт' }).click()
    await expect.poll(async () => {
      const r = await (await svc(`User?email=eq.${created.studentEmail}&select=id,role`)).json()
      return Array.isArray(r) && r.length === 1 && r[0].role === 'STUDENT'
    }, { timeout: 15_000, message: 'student row never appeared' }).toBe(true)
    await expect(page.getByText(created.surname).first()).toBeVisible({ timeout: 15_000 })
  })

  test('create group via modal (name + teacher select) → row + teacherId in DB', async () => {
    await page.goto('/admin/groups', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /Создать группу/ }).first().click()
    const d = page.getByRole('dialog')
    await expect(d).toBeVisible()
    await d.getByPlaceholder('A2-Elementary-Morning').fill(created.groupName)

    // Teacher USelect: click the trigger (shows the placeholder), pick first option
    // (option list renders in a portal, so query at page level).
    await d.getByText('Выберите учителя...').click()
    await page.getByRole('option').first().click()

    await d.getByRole('button', { name: /Создать группу/ }).click()
    await expect.poll(async () => {
      const r = await (await svc(`Group?name=eq.${created.groupName}&select=id,teacherId`)).json()
      return Array.isArray(r) && r.length === 1 && !!r[0].teacherId
    }, { timeout: 15_000, message: 'group row never appeared with a teacher' }).toBe(true)
  })

  test('edit student via modal (PATCH) → surname updated in DB', async () => {
    const newSurname = `UIEDIT_${TS}`
    await page.goto('/admin/students', { waitUntil: 'networkidle' })
    // find the created student by email
    await page.getByPlaceholder(/ФИО, email/).fill(created.studentEmail)
    await expect(page.getByText(created.studentEmail).first()).toBeVisible({ timeout: 10_000 })
    // open the row edit modal (pencil)
    await page.getByRole('button', { name: /Редактировать|Изменить/ }).first().click().catch(async () => {
      // fall back to the pencil icon button in the row
      await page.locator('button:has([class*="pencil"])').first().click()
    })
    const d = page.getByRole('dialog')
    await expect(d).toBeVisible()
    await d.getByRole('textbox', { name: /Фамилия/ }).fill(newSurname)
    await d.getByRole('button', { name: 'Сохранить' }).click()
    await expect.poll(async () => {
      const u = await (await svc(`User?email=eq.${created.studentEmail}&select=surname`)).json()
      return Array.isArray(u) && u[0]?.surname
    }, { timeout: 15_000, message: 'student surname not updated via PATCH' }).toBe(newSurname)
  })

  test('add + remove a group member via the group detail modal', async () => {
    // resolve ids of the created group + student
    const grp = await (await svc(`Group?name=eq.${created.groupName}&select=id`)).json()
    const groupId = grp[0].id
    const usr = await (await svc(`User?email=eq.${created.studentEmail}&select=id`)).json()
    const stu = await (await svc(`Student?userId=eq.${usr[0].id}&select=id`)).json()
    const studentId = stu[0].id

    await page.goto(`/admin/groups/${groupId}`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Добавить', exact: true }).first().click()
    const d = page.getByRole('dialog')
    await expect(d).toBeVisible()
    // search the created student (surname was changed to UIEDIT_ in the prior test)
    await d.getByPlaceholder(/Поиск по ФИО/).fill('UIEDIT')
    await d.locator('label').filter({ hasText: 'UIEDIT' }).first().click()
    await d.getByRole('button', { name: /Добавить/ }).click()
    await expect.poll(async () => {
      const m = await (await svc(`GroupMember?groupId=eq.${groupId}&studentId=eq.${studentId}&select=studentId`)).json()
      return Array.isArray(m) ? m.length : 0
    }, { timeout: 15_000, message: 'member not added' }).toBe(1)

    // remove the member (icon-only button in the member's row, revealed on hover)
    const row = page.locator('tbody tr').filter({ hasText: 'UIEDIT' }).first()
    await row.hover()
    await row.getByRole('button').last().click()
    await expect.poll(async () => {
      const m = await (await svc(`GroupMember?groupId=eq.${groupId}&studentId=eq.${studentId}&select=studentId`)).json()
      return Array.isArray(m) ? m.length : 99
    }, { timeout: 15_000, message: 'member not removed' }).toBe(0)
  })
})
