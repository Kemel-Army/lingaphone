import { test, expect, type BrowserContext, type Page } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Content → XP wiring: a student completes a grammar topic through the real UI
 * (theory → answer each exercise → finish) and the completion awards XP via
 * /api/gamification/award-xp. Uses a throwaway student for clean teardown.
 */

function loadEnv() {
  const file = ['.env.lingaphone', '.env'].map(f => resolve(process.cwd(), f)).find(p => existsSync(p))!
  const raw = readFileSync(file, 'utf8')
  const get = (k: string) => raw.split('\n').find(l => l.startsWith(`${k}=`))?.slice(k.length + 1).trim().replace(/^"|"$/g, '') ?? ''
  return { URL: get('SUPABASE_URL'), SVC: get('SUPABASE_SERVICE_KEY') }
}
const { URL: SUPA, SVC } = loadEnv()
const TS = String(Date.now()).slice(-9)
const EMAIL = `e2e_cx_${TS}@linga.kz`
const PW = 'E2eCx!2345'

function svc(path: string, init: RequestInit = {}) {
  return fetch(`${SUPA}/rest/v1/${path}`, { ...init, headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) } })
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

test.describe.configure({ mode: 'serial' })

test.describe('QA · content → XP (grammar completion)', () => {
  let adminCtx: BrowserContext
  let ctx: BrowserContext
  let page: Page
  let studentId = ''

  test.beforeAll(async ({ browser }) => {
    adminCtx = await browser.newContext()
    await login(adminCtx, 'admin@linga.kz', 'password123')
    const r = await adminCtx.request.post('/api/admin/students', { data: { name: 'Cx', surname: `CXQA_${TS}`, email: EMAIL, password: PW, level: 'A1' } })
    expect(r.status(), await r.text()).toBe(200)
    studentId = (await r.json()).studentId
    ctx = await browser.newContext()
    await login(ctx, EMAIL, PW)
    page = await ctx.newPage()
  })

  test.afterAll(async () => {
    await svc(`XpLog?studentId=eq.${studentId}`, { method: 'DELETE' })
    await svc(`GrammarProgress?studentId=eq.${studentId}`, { method: 'DELETE' })
    await svc(`StudentGameProfile?studentId=eq.${studentId}`, { method: 'DELETE' })
    await svc(`Student?id=eq.${studentId}`, { method: 'DELETE' })
    const u = await (await svc(`User?email=eq.${EMAIL}&select=id,authId`)).json()
    await svc(`User?email=eq.${EMAIL}`, { method: 'DELETE' })
    for (const row of u ?? []) if (row.authId) await fetch(`${SUPA}/auth/v1/admin/users/${row.authId}`, { method: 'DELETE', headers: { apikey: SVC, Authorization: `Bearer ${SVC}` } })
    await adminCtx?.close(); await ctx?.close()
  })

  test('completing the "to-be" grammar topic awards XP', async () => {
    await page.goto('/student/grammar/to-be', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /Начать упражнения/ }).click()

    // ex1 (MCQ) → "is"
    await page.getByRole('button', { name: 'is', exact: true }).click()
    await page.getByRole('button', { name: /Следующий вопрос/ }).click()
    // ex2 (MCQ) → "are"
    await page.getByRole('button', { name: 'are', exact: true }).click()
    await page.getByRole('button', { name: /Следующий вопрос/ }).click()
    // ex3 (FILL) → "am"
    await page.getByPlaceholder('Введите ответ...').fill('am')
    await page.getByRole('button', { name: 'Проверить' }).click()
    await page.getByRole('button', { name: /Завершить/ }).click()

    // completion fires award-xp → XpLog GRAMMAR_* row for this student
    await expect.poll(async () => {
      const x = await (await svc(`XpLog?studentId=eq.${studentId}&action=in.(GRAMMAR_COMPLETE,GRAMMAR_PERFECT)&select=action`)).json()
      return Array.isArray(x) ? x.length : 0
    }, { timeout: 20_000, message: 'grammar completion did not award XP' }).toBeGreaterThan(0)
    // and the profile XP went up
    const prof = await (await svc(`StudentGameProfile?studentId=eq.${studentId}&select=xp`)).json()
    expect(prof[0]?.xp ?? 0).toBeGreaterThan(0)
  })
})
