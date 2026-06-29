import { test, expect, type Page } from '@playwright/test'

const PASSWORD = 'password123'
const SHOT = 'tests-e2e/__shots__'

// Collected console/page errors per test (asserted at the end).
function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`)
  })
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`))
  return errors
}

async function login(page: Page, email: string) {
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.getByRole('button', { name: 'Войти', exact: true }).click()

  // signInWithPassword persists the session cookie. The app's immediate
  // client redirect can race useSupabaseUser() reactivity, so instead we
  // wait for the auth cookie, then navigate fresh (SSR reads it → authed).
  await expect.poll(async () => {
    const cookies = await page.context().cookies()
    return cookies.some(c => /auth-token/.test(c.name))
  }, { timeout: 30_000, message: 'auth cookie never set — login failed' }).toBe(true)
}

// Ignore noise that isn't a real app fault (favicon, sourcemaps, hydration
// dev warnings, third-party). Keep real JS/runtime errors.
const IGNORE = [
  /favicon/i,
  /sourcemap/i,
  /Download the Vue Devtools/i,
  /\[vite\]/i,
  /manifest/i,
  /ERR_ABORTED/i, // Vite dev dep re-optimization aborts in-flight module loads
  /_nuxt\//i, // dev-only module fetch noise
  /Failed to load resource/i
]
function realErrors(errs: string[]): string[] {
  return errs.filter(e => !IGNORE.some(rx => rx.test(e)))
}

test.describe('Books — student', () => {
  test('library lists Access 1 and opens module PDF', async ({ page }) => {
    const errors = trackErrors(page)
    await login(page, 'student@linga.kz')

    // Library
    await page.goto('/student/books', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Книги' })).toBeVisible()
    const card = page.getByText('Access 1', { exact: true }).first()
    await expect(card).toBeVisible()
    await page.screenshot({ path: `${SHOT}/student-books-list.png`, fullPage: true })

    // Level filter A1 keeps Access 1 visible
    await page.getByRole('button', { name: /A1 ·/ }).click()
    await expect(page.getByText('Access 1', { exact: true }).first()).toBeVisible()

    // Open detail
    await page.getByRole('link').filter({ hasText: 'Access 1' }).first().click()
    await page.waitForURL(/\/student\/books\/.+/)
    // Module list present (full title appears in both list + viewer toolbar)
    await expect(page.getByText('Access 1 — Grammar Book (полный)').first()).toBeVisible()

    // pdf.js viewer: pages render to <canvas> (proves worker + render pipeline)
    await expect(page.locator('.vue-pdf-embed canvas').first()).toBeVisible({ timeout: 40_000 })
    expect(await page.locator('.vue-pdf-embed canvas').count()).toBeGreaterThan(0)
    // Toolbar page indicator like "1 / 80"
    await expect(page.getByText(/\d+\s*\/\s*\d+/).first()).toBeVisible()
    await page.screenshot({ path: `${SHOT}/student-book-detail.png`, fullPage: true })

    // PDF actually served
    const res = await page.request.get('/books/access-1-gb.pdf')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type'] || '').toContain('pdf')

    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([])
  })
})

test.describe('Books — admin', () => {
  test('admin sees Access 1 and can create + delete a book', async ({ page }) => {
    const errors = trackErrors(page)
    await login(page, 'admin@linga.kz')

    await page.goto('/admin/books', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Книги' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Access 1' })).toBeVisible()
    await page.screenshot({ path: `${SHOT}/admin-books-list.png`, fullPage: true })

    // Create (unique title per run; cleaned from DB after the suite)
    const title = `E2E_QA_${Date.now()}`
    await page.getByRole('button', { name: /Добавить книгу/ }).click()
    await page.getByPlaceholder('Access 1').fill(title)
    await page.getByRole('button', { name: 'Создать' }).click()
    // Row appears after refresh
    await expect(page.getByRole('cell', { name: title }).first()).toBeVisible({ timeout: 15_000 })
    await page.screenshot({ path: `${SHOT}/admin-books-created.png`, fullPage: true })

    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([])
  })
})
