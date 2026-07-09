import { test, expect, type Page } from '@playwright/test'

/**
 * Библиотека книг для админа/учителя (тот же просмотрщик, что у детей):
 * список всех книг → модуль → юнит → LessonPage read-only.
 * Требует dev-сервер :3000 (playwright.e2e.config).
 */
const PW = 'password123'
const IGNORE = /favicon|wazzup|\.map|_nuxt|Failed to load resource|Hydration|406|PGRST/

async function login(page: Page, email: string) {
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(PW)
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect.poll(async () => (await page.context().cookies()).some(c => /auth-token/.test(c.name)),
    { timeout: 30_000 }).toBe(true)
}

async function openFirstUnit(page: Page) {
  // раскрыть первый модуль
  const toggle = page.getByTestId('mod-toggle').first()
  await toggle.waitFor({ state: 'visible', timeout: 10_000 })
  await toggle.click()
  // открыть первый юнит
  const openBtn = page.getByTestId('open-unit').first()
  await openBtn.waitFor({ state: 'visible', timeout: 10_000 })
  await openBtn.click()
  // ридер (LessonPage read-only) в слайдовере — «Учебник»-шапка
  await expect(page.getByRole('dialog').getByText('Учебник').first()).toBeVisible({ timeout: 10_000 })
}

async function openFirstScan(page: Page) {
  const btn = page.getByTestId('open-scan').first()
  await btn.waitFor({ state: 'visible', timeout: 10_000 })
  await btn.click()
  // InteractiveBookReader показывает картинку-страницу из storage
  const img = page.getByRole('dialog').locator('img[src*="/storage/"]').first()
  await expect(img).toBeVisible({ timeout: 20_000 })
}

test('admin: библиотека книг + чтение юнита read-only', async ({ page }) => {
  test.setTimeout(90_000)
  const errors: string[] = []
  page.on('pageerror', e => errors.push(`JS: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(`C: ${m.text().slice(0, 150)}`) })

  await login(page, 'admin@linga.kz')
  await page.goto('/admin/interactive-book', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Книги' }).click()
  // хотя бы одна книга (бейдж статуса)
  await expect(page.getByText(/Опубликована|Черновик/).first()).toBeVisible({ timeout: 15_000 })
  await openFirstScan(page) // сканы (Fairyland/Spark)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 })
  await openFirstUnit(page) // нативный юнит
  expect(errors, JSON.stringify(errors)).toEqual([])
})

test('teacher: библиотека книг + чтение юнита read-only', async ({ page }) => {
  test.setTimeout(90_000)
  const errors: string[] = []
  page.on('pageerror', e => errors.push(`JS: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(`C: ${m.text().slice(0, 150)}`) })

  await login(page, 'teacher@linga.kz')
  await page.goto('/teacher/books', { waitUntil: 'networkidle' })
  await expect(page.getByText(/Опубликована|Черновик/).first()).toBeVisible({ timeout: 15_000 })
  await openFirstUnit(page)
  expect(errors, JSON.stringify(errors)).toEqual([])
})

test('student (F2): видит и читает отсканированный учебник', async ({ page }) => {
  test.setTimeout(90_000)
  const errors: string[] = []
  page.on('pageerror', e => errors.push(`JS: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(`C: ${m.text().slice(0, 150)}`) })

  await login(page, 'student@linga.kz') // уровень F2 → Fairyland 2
  await page.goto('/student/book', { waitUntil: 'networkidle' })
  const link = page.locator('a[href^="/student/book/scan/"]').first()
  await expect(link).toBeVisible({ timeout: 15_000 })
  await link.click()
  await expect(page).toHaveURL(/\/student\/book\/scan\//)
  const img = page.locator('img[src*="/storage/"]').first()
  await expect(img).toBeVisible({ timeout: 20_000 })
  expect(errors, JSON.stringify(errors)).toEqual([])
})
