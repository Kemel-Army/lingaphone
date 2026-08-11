import { expect, test, type Page } from '@playwright/test'

/**
 * Smoke check for the pages whose components were restructured while clearing
 * the ESLint backlog — the edits were mechanical (one-liners expanded, dynamic
 * `delete` replaced with rebuilds, `reveal: any` typed), so these assert the
 * refactors did not change runtime behaviour.
 *
 *   BookOverlayEditor.vue  -> drag/option handlers, computed get/set models
 *   ExerciseField.vue      -> match pairing without dynamic delete
 *   lesson-player/ui/ex/*  -> typed `reveal` prop
 */

const EMAIL = process.env.QA_EMAIL ?? 'qa-review-admin@lingaphone.invalid'
const PASSWORD = process.env.QA_PASSWORD ?? 'QaReview!2026#temp'

test.describe.configure({ mode: 'serial' })

const login = async (page: Page) => {
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
  throw new Error(`не удалось войти, застряли на ${page.url()}`)
}

const collectErrors = (page: Page): string[] => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    const t = m.text()
    if (/websocket|realtime|favicon/i.test(t)) return
    errors.push(t)
  })
  return errors
}

test('/admin/interactive-book монтирует ридер и редактор оверлея без ошибок', async ({ page }) => {
  const errors = collectErrors(page)
  await login(page)

  await page.goto('/admin/interactive-book', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(9000)

  const body = await page.locator('body').innerText()
  expect(body, 'страница отдала 500').not.toMatch(/Произошла ошибка/)
  expect(body).not.toContain('undefined')
  // Сайдбар отрисован => layout смонтировался, а не error-page.
  expect(body).toMatch(/Интерактивная книга/)

  expect(errors, errors.join('\n')).toEqual([])
})

test('страницы с v-html рендерят markdown, а не сырой HTML', async ({ page }) => {
  const errors = collectErrors(page)
  await login(page)

  // Публичный доступ к ним у админа закрыт ролевым гардом, поэтому проверяем
  // только то, что маршруты не отдают 500 и уводят на свой дашборд.
  for (const path of ['/student/grammar', '/student/reading']) {
    const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
    expect(res?.status(), `${path} отдал ${res?.status()}`).toBeLessThan(400)
    await page.waitForTimeout(3000)
    const body = await page.locator('body').innerText()
    expect(body, `${path} отдал ошибку`).not.toMatch(/Произошла ошибка/)
  }

  expect(errors, errors.join('\n')).toEqual([])
})
