import { expect, test, type Page } from '@playwright/test'

/**
 * Двухшаговые упражнения в книге («соедини пару», «распредели по колонкам»).
 *
 * Регрессия, ради которой тест существует: тап по цели без выбранного источника
 * не делал ничего и молча — преподаватель сообщил это как «книга не вся
 * кликабельная». Теперь такой тап обязан объясниться и подсказка обязана гаснуть
 * сама, не залипая поверх задания.
 *
 * Требует `pnpm dev` на :3000 и QA-ученика (scripts/qa-temp-account.mjs).
 */

const EMAIL = process.env.QA_STUDENT_EMAIL ?? 'qa-review-student@lingaphone.invalid'
const PASSWORD = process.env.QA_PASSWORD ?? 'QaReview!2026#temp'

// Юниты из боевой базы: «I Can Sing!» содержит MATCH_PAIRS,
// «Adjectives & Adverbs» — SORT_COLUMNS.
const MATCH_UNIT = '/student/book/d3ab67f6-8808-507e-b13b-a5bc6359bc19/5e364fb4-f3bd-5efd-9307-1b0a337bae0b'
const SORT_UNIT = '/student/book/68b5faac-d43f-5589-a1c3-1aa4cf75082a/00ebb934-e133-58fe-992c-235c1632ca1a'

const loginStudent = async (page: Page) => {
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/student/, { timeout: 60_000 })
}

test('MATCH_PAIRS: тап справа без выбора слева объясняется', async ({ page }) => {
  await loginStudent(page)
  await page.goto(MATCH_UNIT, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const card = page.locator('div').filter({ hasText: 'Нажми слева, потом справа' }).last()
  await card.locator('div.grid > div').nth(1).locator('button').first().click()

  await expect(page.getByText('Сначала нажми слово слева')).toBeVisible()
})

test('SORT_COLUMNS: тап по колонке без выбора слова объясняется и подсказка гаснет', async ({ page }) => {
  await loginStudent(page)
  await page.goto(SORT_UNIT, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  await page.locator('button', { hasText: 'manner (how)' }).first().click()
  const hint = page.getByText('Сначала нажми слово, потом колонку')
  await expect(hint).toBeVisible()

  // Подсказка временная: залипшая надпись поверх задания — тоже дефект.
  await page.waitForTimeout(2200)
  await expect(hint).toHaveCount(0)
})
