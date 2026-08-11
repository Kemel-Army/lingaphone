import { expect, test, type Page } from '@playwright/test'

/**
 * Click-through QA of every admin screen changed by b286c34, driven through a
 * real login. Runs serially against `pnpm dev` on :3000 (see
 * playwright.review.config.ts) using the throwaway ADMIN account created by
 * scripts/qa-temp-account.mjs.
 */

const EMAIL = process.env.QA_EMAIL ?? 'qa-review-admin@lingaphone.invalid'
const PASSWORD = process.env.QA_PASSWORD ?? 'QaReview!2026#temp'

test.describe.configure({ mode: 'serial' })

/**
 * Log in and land on /admin.
 *
 * Waiting for hydration before typing is required, not defensive: the login
 * form has no `name` attributes, so submitting it before Vue binds
 * `@submit.prevent` performs a native GET and lands on `/login?` with the
 * credentials dropped. The post-submit retries cover the slower redirect on a
 * cold dev server.
 */
const login = async (page: Page) => {
  // Wait for hydration before typing: submitting a not-yet-hydrated form runs
  // the native POST instead of the Supabase sign-in handler.
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()

  // Let the client-side redirect finish on its own first — navigating early
  // interrupts it and lands back on /login.
  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(1000)
    if (!new URL(page.url()).pathname.startsWith('/login')) break
  }

  // Then make sure we are actually on an admin page, retrying the full load a
  // couple of times to ride out the claims race described above.
  for (let attempt = 0; attempt < 3; attempt++) {
    if (new URL(page.url()).pathname.startsWith('/admin')) return
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(4000)
  }
  if (new URL(page.url()).pathname.startsWith('/admin')) return
  throw new Error(`не удалось войти, застряли на ${page.url()}`)
}

/** Authed pages keep Realtime sockets open, so `networkidle` never fires. */
const settle = async (page: Page) => {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(2500)
}

/** Fails the test if the page logged a client-side error while we poked at it. */
const watchErrors = (page: Page): string[] => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    const t = m.text()
    // Realtime/websocket noise against the shared dev Supabase is not a defect.
    if (/websocket|realtime|favicon/i.test(t)) return
    errors.push(t)
  })
  return errors
}

test('логин админа проходит и уводит с /login', async ({ page }) => {
  const errors = watchErrors(page)
  await login(page)
  expect(page.url()).not.toContain('/login')
  expect(errors, errors.join('\n')).toEqual([])
})

test.describe('Админ → Ученики', () => {
  test('вкладки статусов рисуются, счётчики числовые, переключение работает', async ({ page }) => {
    const errors = watchErrors(page)
    await login(page)
    await page.goto('/admin/students', { waitUntil: 'domcontentloaded' })
    await settle(page)

    for (const label of ['Активные', 'Приостановили', 'Бросили']) {
      await expect(page.getByRole('button', { name: new RegExp(label) })).toBeVisible()
    }

    // Счётчик рядом с активной вкладкой — из fetchStudentStatusCounts().
    const activeTab = page.getByRole('button', { name: /Активные/ })
    await expect(activeTab).toContainText(/\d+/)

    await page.getByRole('button', { name: /Приостановили/ }).click()
    await settle(page)
    await page.getByRole('button', { name: /Бросили/ }).click()
    await settle(page)
    await page.getByRole('button', { name: /Активные/ }).click()
    await settle(page)

    expect(errors, errors.join('\n')).toEqual([])
  })

  test('строка таблицы кликабельна и открывает карточку ученика', async ({ page }) => {
    const errors = watchErrors(page)
    await login(page)
    await page.goto('/admin/students', { waitUntil: 'domcontentloaded' })
    await settle(page)

    const firstRow = page.locator('tbody tr').first()
    await expect(firstRow).toBeVisible()
    await firstRow.click()
    await page.waitForURL(/\/admin\/students\/[0-9a-f-]{36}/, { timeout: 30_000 })

    expect(errors, errors.join('\n')).toEqual([])
  })

  test('карточка ученика: статус, группа, абонемент, посещаемость', async ({ page }) => {
    const errors = watchErrors(page)
    await login(page)
    await page.goto('/admin/students', { waitUntil: 'domcontentloaded' })
    await settle(page)
    await page.locator('tbody tr').first().click()
    await page.waitForURL(/\/admin\/students\/[0-9a-f-]{36}/, { timeout: 30_000 })
    await settle(page)

    const body = await page.locator('body').innerText()
    // STATUS_META лейблы — если статус не отрезолвился, тут был бы undefined.
    expect(body).toMatch(/Активный|Приостановил|Бросил/)
    expect(body).not.toContain('undefined')

    // Селектор статуса на месте и кликается (значение не меняем — это прод).
    const statusSelect = page.locator('select, [role="combobox"]').first()
    await expect(statusSelect).toBeVisible()

    expect(errors, errors.join('\n')).toEqual([])
  })
})

test.describe('Админ → Лиды', () => {
  test('вкладка «Клиенты» убрана, три оставшиеся работают', async ({ page }) => {
    const errors = watchErrors(page)
    await login(page)
    await page.goto('/admin/leads', { waitUntil: 'domcontentloaded' })
    await settle(page)

    await expect(page.getByRole('button', { name: /Воронка/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Список/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Я ответственный/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Клиенты$/ })).toHaveCount(0)

    await page.getByRole('button', { name: /Список/ }).click()
    await settle(page)
    await page.getByRole('button', { name: /Я ответственный/ }).click()
    await settle(page)

    expect(errors, errors.join('\n')).toEqual([])
  })

  test('кнопка «Новый лид» открывает и закрывает модалку', async ({ page }) => {
    const errors = watchErrors(page)
    await login(page)
    await page.goto('/admin/leads', { waitUntil: 'domcontentloaded' })
    await settle(page)

    const addBtn = page.getByRole('button', { name: /Новый лид|Добавить лид|Создать/ }).first()
    await addBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')

    expect(errors, errors.join('\n')).toEqual([])
  })
})

test.describe('Админ → Расписание', () => {
  test('сетка недели рисуется, форма урока содержит тип занятия', async ({ page }) => {
    const errors = watchErrors(page)
    await login(page)
    await page.goto('/admin/schedule', { waitUntil: 'domcontentloaded' })
    await settle(page)

    const addBtn = page.getByRole('button', { name: /Добавить урок|Новый урок|Добавить/ }).first()
    await addBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Селектор LessonType из LESSON_TYPE_OPTIONS (миграция 20260808200654).
    await expect(page.getByText(/Тип занятия/)).toBeVisible()
    await page.keyboard.press('Escape')

    expect(errors, errors.join('\n')).toEqual([])
  })
})

test.describe('Админ → Группы', () => {
  test('список групп открывается, карточка группы рисует расписание', async ({ page }) => {
    const errors = watchErrors(page)
    await login(page)
    await page.goto('/admin/groups', { waitUntil: 'domcontentloaded' })
    await settle(page)

    const firstLink = page.locator('a[href^="/admin/groups/"]').first()
    if (await firstLink.count()) {
      await firstLink.click()
      await page.waitForURL(/\/admin\/groups\/[0-9a-f-]{36}/, { timeout: 30_000 })
      await settle(page)
      const body = await page.locator('body').innerText()
      expect(body).not.toContain('undefined')
    }

    expect(errors, errors.join('\n')).toEqual([])
  })
})

test.describe('Групповой чат', () => {
  test('sync-conversation отвечает 200 под админом и возвращает id чата', async ({ page }) => {
    const errors = watchErrors(page)
    await login(page)

    // Берём реальную группу и синкуем её чат — тот же вызов, что admin/groups/[id]
    // делает после добавления/удаления ученика (b286c34).
    await page.goto('/admin/groups', { waitUntil: 'domcontentloaded' })
    await settle(page)
    const href = await page.locator('a[href^="/admin/groups/"]').first().getAttribute('href')
    test.skip(!href, 'в базе нет групп')

    const groupId = href!.split('/').pop()!
    const res = await page.request.post(`/api/admin/groups/${groupId}/sync-conversation`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.conversationId, 'чат группы не создан/не найден').toBeTruthy()

    expect(errors, errors.join('\n')).toEqual([])
  })
})

test.describe('Дашборды', () => {
  test('/admin грузится без ошибок', async ({ page }) => {
    const errors = watchErrors(page)
    await login(page)
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await settle(page)
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('/director отвечает быстро — 7 запросов распараллелены в b286c34', async ({ page }) => {
    const errors = watchErrors(page)
    await login(page)
    const started = Date.now()
    const res = await page.request.get('/api/director/stats')
    const elapsed = Date.now() - started
    // Админ может не иметь доступа к директорскому эндпоинту — тогда проверяем
    // только что он не висит и не падает в 500.
    expect([200, 403]).toContain(res.status())
    expect(elapsed, `/api/director/stats отвечал ${elapsed}ms`).toBeLessThan(15_000)
    expect(errors, errors.join('\n')).toEqual([])
  })
})
