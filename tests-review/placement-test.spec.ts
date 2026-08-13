import { expect, test, type Page } from '@playwright/test'

/**
 * Входное тестирование с публичной страницы: возраст → заявка → вопросы →
 * результат → запись в карточке лида.
 *
 * Тест пишет в CRM (создаёт лид), поэтому в конце сам за собой убирает через
 * тот же путь, что и админ, — иначе прогон засоряет воронку.
 * Требует `pnpm dev` на :3000 и QA-аккаунт админа (scripts/qa-temp-account.mjs).
 */

const EMAIL = process.env.QA_EMAIL ?? 'qa-review-admin@lingaphone.invalid'
const PASSWORD = process.env.QA_PASSWORD ?? 'QaReview!2026#temp'

// Уникальный номер на прогон: дедупликация лида идёт по цифрам телефона, и
// фиксированный номер склеивал бы все запуски в один лид.
const PHONE_DIGITS = `7700${String(Date.now()).slice(-7)}`
const PHONE = `+${PHONE_DIGITS}`
const NAME = `QA Placement ${String(Date.now()).slice(-6)}`

test.describe.configure({ mode: 'serial' })

const loginAdmin = async (page: Page) => {
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()

  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(1000)
    if (!new URL(page.url()).pathname.startsWith('/login')) break
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    if (new URL(page.url()).pathname.startsWith('/admin')) return
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(4000)
  }
  throw new Error(`не удалось войти как ${EMAIL}, застряли на ${page.url()}`)
}

test('страница теста предлагает выбрать возраст', async ({ page }) => {
  await page.goto('/level-test', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  await expect(page.getByRole('heading', { name: 'Сколько лет ученику?' })).toBeVisible()
  // Подстрока, а не RegExp: «16+ / взрослый» содержит `+`, который в регулярке
  // означал бы квантификатор и никогда не совпал бы с текстом кнопки.
  for (const label of ['6–9 лет', '9–12 лет', '12–16 лет', '16+ / взрослый']) {
    await expect(page.getByRole('button', { name: label })).toBeVisible()
  }
})

test('возрастной тест: заявка обязательна, пропуск считается, результат сохраняется в лид', async ({ page }) => {
  await page.goto('/level-test', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.getByRole('button', { name: /9–12 лет/ }).click()

  // Без контактов тест не стартует.
  const startBtn = page.getByRole('button', { name: 'Начать тест' })
  await expect(startBtn).toBeDisabled()
  await page.getByPlaceholder('Иванов Иван').fill(NAME)
  await page.getByPlaceholder('+7 700 000 00 00').fill(PHONE)
  await expect(startBtn).toBeEnabled()
  await startBtn.click()

  // Первый вопрос — MATCH: тап справа без выбора слева обязан объясниться,
  // а не выглядеть как мёртвая кнопка.
  await page.getByRole('button', { name: 'библиотека', exact: true }).click()
  await expect(page.getByText('Сначала выбери слово слева')).toBeVisible()

  // Проходим весь тест кнопкой «Затрудняюсь ответить».
  let skipped = 0
  for (let i = 0; i < 40; i++) {
    const skip = page.getByRole('button', { name: 'Затрудняюсь ответить' })
    if (!await skip.isVisible().catch(() => false)) break
    // На последнем вопросе кнопка гаснет на время отправки и исчезает.
    try {
      await skip.click({ timeout: 5000 })
    } catch {
      break
    }
    skipped++
    await page.waitForTimeout(150)
  }
  expect(skipped).toBeGreaterThan(10)

  await expect(page.getByText(/Предварительный уровень/i)).toBeVisible({ timeout: 30_000 })
  const result = await page.locator('body').innerText()
  expect(result).toMatch(/Правильных ответов:\s*0 из \d+/)
  expect(result).toMatch(/Пропущено вопросов:\s*\d+/)
})

test('результат виден в карточке лида и лид не задвоился', async ({ page }) => {
  await loginAdmin(page)
  await page.goto('/admin/leads', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  const rows = page.getByText(NAME)
  await expect(rows.first()).toBeVisible()
  // Дедупликация по цифрам телефона: одна заявка — один лид.
  expect(await rows.count()).toBe(1)

  await rows.first().click()
  await page.waitForTimeout(1500)

  const body = await page.locator('body').innerText()
  expect(body).toContain('Входное тестирование')
  expect(body).toMatch(/затруднился:\s*\d+/)
  expect(body).not.toContain('undefined')

  // Письменная часть раскрывается и показывает вопросы преподавателю.
  await page.getByRole('button', { name: /Письменная часть/ }).first().click()
  await page.waitForTimeout(500)
  await expect(page.getByText('затруднился ответить').first()).toBeVisible()

  // Уборка: удаляем созданный прогоном лид вместе с результатами (ON DELETE CASCADE).
  page.once('dialog', d => d.accept())
  await page.getByRole('button', { name: 'Удалить' }).first().click()
  await page.waitForTimeout(2000)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await expect(page.getByText(NAME)).toHaveCount(0)
})
