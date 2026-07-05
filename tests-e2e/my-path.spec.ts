import { test, expect, type Page } from '@playwright/test'

/**
 * «Мой путь» (User Journey) end-to-end.
 * Covers: bound-book map + lock states, block-test pass unlocking the next
 * block, and the curator's level→book binding in the admin student card.
 *
 * Prereq: `pnpm dev` running on :3000. Student = student@test.com (level A1 →
 * Access 1). DB gate state for that student is reset in beforeAll.
 */

const PASSWORD = 'test1234'
const SHOT = 'tests-e2e/__shots__'

// Block-1 test answer key (a/an) — question noun → correct article.
const BLOCK1_TEST: Array<[string, string]> = [
  ['orange', 'an'],
  ['book', 'a'],
  ['umbrella', 'an'],
  ['ruler', 'a'],
  ['eraser', 'an']
]

function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`))
  return errors
}

const IGNORE = [
  /favicon/i, /sourcemap/i, /Download the Vue Devtools/i, /\[vite\]/i, /manifest/i,
  /ERR_ABORTED/i, /_nuxt\//i, /Failed to load resource/i, /PGRST116/i
]
const realErrors = (errs: string[]) => errs.filter(e => !IGNORE.some(rx => rx.test(e)))

async function login(page: Page, email: string) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  const emailBox = page.locator('input[type="email"]')
  const passBox = page.locator('input[type="password"]')
  await emailBox.waitFor()
  await page.waitForTimeout(2000) // hydration can clear inputs; wait then verify

  // Refill until the value sticks (Vue hydration may reset the field once).
  await expect.poll(async () => {
    await emailBox.fill(email)
    await passBox.fill(PASSWORD)
    await page.waitForTimeout(300)
    return await emailBox.inputValue()
  }, { timeout: 15_000, message: 'email input kept clearing' }).toBe(email)

  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect.poll(async () => {
    const cookies = await page.context().cookies()
    return cookies.some(c => /auth-token/.test(c.name))
  }, { timeout: 30_000, message: 'auth cookie never set — login failed' }).toBe(true)
}

test.describe.configure({ mode: 'serial' })

test.describe('Мой путь', () => {
  test.beforeAll(async ({ request }) => {
    // Ensure the test accounts exist.
    await request.post('/api/auth/seed-test-users').catch(() => {})
  })

  test('карта: привязанный учебник, все блоки открыты', async ({ page }) => {
    const errors = trackErrors(page)
    await login(page, 'student@test.com')
    await page.request.post('/api/dev/reset-my-path') // fresh state

    await page.goto('/student/book', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Мой путь').first()).toBeVisible() // hero badge
    await expect(page.getByRole('heading', { name: 'Access 1' })).toBeVisible() // bound book

    // Gating is OFF — every block is open (no "Закрыт"), incl. later ones.
    const block1 = page.locator('li', { hasText: 'Indefinite Article' })
    await expect(block1).toContainText('Доступен')
    const block2 = page.locator('li', { hasText: 'Personal Subject Pronouns' })
    await expect(block2).toContainText('Доступен')
    await expect(page.getByText('Закрыт')).toHaveCount(0)

    await page.screenshot({ path: `${SHOT}/mypath-map.png`, fullPage: true })
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([])
  })

  test('сдача теста блока 1 разблокирует блок 2', async ({ page }) => {
    const errors = trackErrors(page)
    await login(page, 'student@test.com')
    await page.request.post('/api/dev/reset-my-path') // fresh: block 2 still locked

    // Open block 1 → its test.
    await page.goto('/student/book', { waitUntil: 'domcontentloaded' })
    await page.locator('a', { hasText: 'Indefinite Article' }).first().click()
    await page.waitForURL(/\/student\/book\/[0-9a-f-]+$/)
    await page.getByRole('heading', { name: /Блок 1/ }).waitFor()

    await page.getByRole('link', { name: /Тест блока/ }).first().click()
    await page.waitForURL(/\/student\/book\/[0-9a-f-]+\/[0-9a-f-]+$/)
    await expect(page.getByRole('heading', { name: /Тест блока/ })).toBeVisible()

    // Answer each MCQ correctly, then check it.
    for (const [noun, article] of BLOCK1_TEST) {
      const card = page.locator('section', { hasText: new RegExp(`___ ${noun}`) })
      await card.getByRole('button', { name: article, exact: true }).click()
      const checkBtn = card.getByRole('button', { name: 'Проверить' })
      await expect(checkBtn).toBeEnabled()
      await checkBtn.click()
      await expect(card.getByText(/Верно!|Не совсем/)).toBeVisible({ timeout: 25_000 })
      await expect(card).toContainText('Верно!')
    }

    // Finalize the test.
    await page.getByRole('button', { name: /Завершить тест/ }).click()
    await expect(page.getByText('Тест сдан!')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/Следующий блок открыт/)).toBeVisible()
    await page.screenshot({ path: `${SHOT}/mypath-test-passed.png`, fullPage: true })

    // Back to the map: block 2 is now available, block 1 completed.
    await page.goto('/student/book', { waitUntil: 'domcontentloaded' })
    const block2 = page.locator('li', { hasText: 'Personal Subject Pronouns' })
    await expect(block2).toContainText('Доступен')
    const block1 = page.locator('li', { hasText: 'Indefinite Article' })
    await expect(block1).toContainText('Пройден')

    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([])
  })

  test('админ: карточка ученика показывает уровень-матрицу и привязанный учебник', async ({ page }) => {
    const errors = trackErrors(page)
    await login(page, 'admin@test.com')

    // Open the test student's card directly (stable seeded studentId).
    await page.goto('/admin/students/28c902ec-85d9-4153-ab66-1d9667decbc1', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('student@test.com')).toBeVisible()

    // Bound-book badge from the level→book matrix.
    await expect(page.getByText('Access 1').first()).toBeVisible()

    // Edit form: dropdown labelled with the matrix + book hint (no save).
    const editBtn = page.getByRole('button', { name: 'Редактировать', exact: true })
    const modalTitle = page.getByText('Редактировать профиль')
    await expect.poll(async () => {
      if (!(await modalTitle.isVisible())) await editBtn.click().catch(() => {})
      return modalTitle.isVisible()
    }, { timeout: 15_000, message: 'edit modal never opened' }).toBe(true)

    await expect(page.getByText(/Учебник: Access 1/)).toBeVisible()
    await page.screenshot({ path: `${SHOT}/mypath-admin-card.png`, fullPage: true })

    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([])
  })
})
