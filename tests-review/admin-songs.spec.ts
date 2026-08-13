import { expect, test, type Page } from '@playwright/test'

/**
 * Раздел «Песни» в админке: загрузка своего трека вместо поиска на YouTube и
 * текст с пропусками.
 *
 * Ключевые инварианты, которые тут защищаются:
 *  - песню без аудио и с незаполненными пропусками нельзя опубликовать;
 *  - импортированный из методички лист открывается на редактирование как
 *    авторский текст с пустыми скобками, а не как каша.
 *
 * Требует `pnpm dev` на :3000 и QA-админа (scripts/qa-temp-account.mjs).
 */

const EMAIL = process.env.QA_EMAIL ?? 'qa-review-admin@lingaphone.invalid'
const PASSWORD = process.env.QA_PASSWORD ?? 'QaReview!2026#temp'

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

test('список песен показывает источник звука и число пропусков', async ({ page }) => {
  await loginAdmin(page)
  await page.goto('/admin/songs', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  await expect(page.getByRole('heading', { name: 'Песни' })).toBeVisible()
  const body = await page.locator('body').innerText()

  // Источник звука подписан у каждой песни — иначе не видно, чем она играет.
  expect(body).toMatch(/Файл|YouTube|Без аудио/)
  expect(body).toMatch(/\d+ пропусков/)
  expect(body).not.toContain('undefined')
  expect(body).not.toContain('NaN')
})

test('форма: незаполненные пропуски и отсутствие аудио блокируют публикацию', async ({ page }) => {
  await loginAdmin(page)
  await page.goto('/admin/songs', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  await page.getByRole('button', { name: 'Добавить песню' }).click()
  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible()

  await dialog.getByPlaceholder('Happy').fill('QA Проверка публикации')
  await dialog.getByPlaceholder('Pharrell Williams').fill('QA Artist')
  // Пропуск без слова: позиция есть, ответа нет.
  await dialog.locator('textarea').first().fill('I am [] here in the [bright] room')

  await expect(dialog.getByText('2 пропусков')).toBeVisible()
  await expect(dialog.getByText('без ответа: 1')).toBeVisible()

  // Черновик сохранить можно.
  const save = dialog.getByRole('button', { name: 'Добавить', exact: true })
  await expect(save).toBeEnabled()

  // Публикация — нет: нет ни аудио, ни всех ответов.
  await dialog.getByText('Опубликовать', { exact: false }).click()
  await expect(dialog.getByText(/Нельзя опубликовать песню без аудио/)).toBeVisible()
  await expect(dialog.getByText(/пропусков без ответа/)).toBeVisible()
  await expect(save).toBeDisabled()

  // Ничего не создаём — закрываем форму.
  await dialog.getByRole('button', { name: 'Отмена' }).click()
  await expect(page.getByText('QA Проверка публикации')).toHaveCount(0)
})

test('загрузка WhatsApp-аудио (.mpeg) проходит и трек играет', async ({ page }) => {
  // Регрессия: браузер помечает .mpeg как video/mpeg, бакет пускает только
  // audio/*, и Storage отвечал 415 на самом ходовом для школы файле.
  const title = `QA Upload ${String(Date.now()).slice(-6)}`
  await loginAdmin(page)
  await page.goto('/admin/songs', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  await page.getByRole('button', { name: 'Добавить песню' }).click()
  const dialog = page.locator('[role="dialog"]')
  await dialog.getByPlaceholder('Happy').fill(title)
  await dialog.getByPlaceholder('Pharrell Williams').fill('QA Artist')
  await dialog.locator('textarea').first().fill('I am [sitting] here in the [boring] room')
  await dialog.locator('input[type="file"]').setInputFiles('docs/WhatsApp Audio 2026-07-30 at 13.08.25 (1).mpeg')
  await expect(dialog.getByText(/Будет загружен:/)).toBeVisible()

  await dialog.getByText('Опубликовать', { exact: false }).click()
  await dialog.getByRole('button', { name: 'Добавить', exact: true }).click()
  await expect(dialog).toBeHidden({ timeout: 120_000 })
  await page.waitForTimeout(2000)

  const card = page.locator('.rounded-2xl.border').filter({ hasText: title }).first()
  const cardText = await card.innerText()
  expect(cardText).toContain('Опубликована')
  expect(cardText).toContain('Файл')

  // Ссылка из Storage должна реально проигрываться, а не просто существовать.
  const playable = await card.locator('audio').first().evaluate((el: HTMLAudioElement) => new Promise<string>((resolve) => {
    el.addEventListener('loadedmetadata', () => resolve('ok'), { once: true })
    el.addEventListener('error', () => resolve(`error code=${el.error?.code}`), { once: true })
    el.load()
    setTimeout(() => resolve('timeout'), 30_000)
  }))
  expect(playable).toBe('ok')

  // Уборка: прогон не должен оставлять песни в боевой базе.
  page.once('dialog', d => d.accept())
  await card.getByRole('button', { name: 'Удалить' }).click()
  await page.waitForTimeout(2500)
  await expect(page.getByText(title)).toHaveCount(0)
})

test('импортированный лист открывается как авторский текст со скобками', async ({ page }) => {
  await loginAdmin(page)
  await page.goto('/admin/songs', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  await page.getByRole('button', { name: 'Редактировать' }).first().click()
  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible()

  const raw = await dialog.locator('textarea').first().inputValue()
  expect(raw.length).toBeGreaterThan(20)
  // Прочерки методички превращаются в скобки — это и есть формат редактирования.
  expect(raw).toMatch(/\[.*?\]/)
  // Маркер плеера в редактор попадать не должен: там только авторский формат.
  expect(raw).not.toContain('___')
})
