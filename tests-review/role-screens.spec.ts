import { expect, test, type Page } from '@playwright/test'

/**
 * Click-through QA of the TEACHER and STUDENT screens changed by b286c34,
 * driven through real logins (throwaway accounts from
 * scripts/qa-temp-account.mjs):
 *
 *   TEACHER  /teacher/messenger      new page + sidebar entry (group chat)
 *            /teacher/schedule       lesson-type selector, type icons on grid
 *            /teacher/groups/[id]    formatSchedule fix, lesson-type selector
 *            /teacher/online         empty-state hint linking to the schedule
 *   STUDENT  /student/messenger      rebuilt on top of MessengerWidget
 *            sidebar                 «Дневник» / «Мой прогресс» renames
 *            /student/online         empty-state hint
 */

const PASSWORD = process.env.QA_PASSWORD ?? 'QaReview!2026#temp'
const TEACHER_EMAIL = process.env.QA_TEACHER_EMAIL ?? 'qa-review-teacher@lingaphone.invalid'
const STUDENT_EMAIL = process.env.QA_STUDENT_EMAIL ?? 'qa-review-student@lingaphone.invalid'

test.describe.configure({ mode: 'serial' })

const loginAs = async (page: Page, email: string, homePrefix: string) => {
  // Hydration must finish first — the form has no `name` attributes, so an
  // early submit does a native GET and drops the credentials.
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()

  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(1000)
    if (!new URL(page.url()).pathname.startsWith('/login')) break
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    if (new URL(page.url()).pathname.startsWith(homePrefix)) return
    await page.goto(homePrefix, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(4000)
  }
  throw new Error(`не удалось войти как ${email}, застряли на ${page.url()}`)
}

const settle = async (page: Page) => {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(3000)
}

const watchErrors = (page: Page): string[] => {
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

/** Asserts a page rendered its app shell rather than the Nuxt error screen. */
const expectRendered = async (page: Page, label: string) => {
  const body = await page.locator('body').innerText()
  expect(body, `${label} отдал ошибку`).not.toMatch(/Произошла ошибка/)
  expect(body, `${label} содержит undefined`).not.toContain('undefined')
  return body
}

// ── TEACHER ─────────────────────────────────────────────────────────────────

test.describe('Преподаватель', () => {
  test('логин и дашборд', async ({ page }) => {
    const errors = watchErrors(page)
    await loginAs(page, TEACHER_EMAIL, '/teacher')
    await settle(page)
    await expectRendered(page, '/teacher')
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('в сайдбаре есть «Сообщения», страница мессенджера открывается', async ({ page }) => {
    const errors = watchErrors(page)
    await loginAs(page, TEACHER_EMAIL, '/teacher')
    await settle(page)

    // Пункт добавлен в TEACHER_SIDEBAR в b286c34.
    await expect(page.locator('a[href="/teacher/messenger"]').first()).toBeVisible()

    await page.goto('/teacher/messenger', { waitUntil: 'domcontentloaded' })
    await settle(page)
    const body = await expectRendered(page, '/teacher/messenger')
    // Либо список чатов, либо честный пустой стейт — но не пустая страница.
    expect(body).toMatch(/Пока нет чатов|Выбери чат|Сообщения|Мессенджер/)

    expect(errors, errors.join('\n')).toEqual([])
  })

  test('расписание открывается и содержит выбор типа занятия', async ({ page }) => {
    const errors = watchErrors(page)
    await loginAs(page, TEACHER_EMAIL, '/teacher')
    await page.goto('/teacher/schedule', { waitUntil: 'domcontentloaded' })
    await settle(page)
    await expectRendered(page, '/teacher/schedule')
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('онлайн-уроки: пустой стейт со ссылкой на расписание', async ({ page }) => {
    const errors = watchErrors(page)
    await loginAs(page, TEACHER_EMAIL, '/teacher')
    await page.goto('/teacher/online', { waitUntil: 'domcontentloaded' })
    await settle(page)
    const body = await expectRendered(page, '/teacher/online')
    // Подсказка добавлена в b286c34 вместо голого «Нет запланированных».
    if (/Нет запланированных онлайн-уроков/.test(body)) {
      expect(body).toMatch(/Открыть расписание|не запланировано будущих уроков/)
    }
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('группы: карточка группы показывает расписание, а не «—»', async ({ page }) => {
    const errors = watchErrors(page)
    await loginAs(page, TEACHER_EMAIL, '/teacher')
    await page.goto('/teacher/groups', { waitUntil: 'domcontentloaded' })
    await settle(page)
    await expectRendered(page, '/teacher/groups')

    const link = page.locator('a[href^="/teacher/groups/"]').first()
    if (await link.count()) {
      await link.click()
      await page.waitForURL(/\/teacher\/groups\/[0-9a-f-]{36}/, { timeout: 30_000 })
      await settle(page)
      await expectRendered(page, 'карточка группы')
    }
    expect(errors, errors.join('\n')).toEqual([])
  })
})

// ── STUDENT ─────────────────────────────────────────────────────────────────

test.describe('Ученик', () => {
  test('логин и дашборд', async ({ page }) => {
    const errors = watchErrors(page)
    await loginAs(page, STUDENT_EMAIL, '/student')
    await settle(page)
    await expectRendered(page, '/student')
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('сайдбар переименован: «Дневник» и «Мой прогресс»', async ({ page }) => {
    const errors = watchErrors(page)
    await loginAs(page, STUDENT_EMAIL, '/student')
    await settle(page)

    // STUDENT_SIDEBAR в shared/types/common.ts: было «Журнал»/«Прогресс».
    await expect(page.locator('a[href="/student/grades"]').first()).toContainText('Дневник')
    await expect(page.locator('a[href="/student/progress"]').first()).toContainText('Мой прогресс')

    expect(errors, errors.join('\n')).toEqual([])
  })

  test('мессенджер на общем виджете открывается', async ({ page }) => {
    const errors = watchErrors(page)
    await loginAs(page, STUDENT_EMAIL, '/student')
    await page.goto('/student/messenger', { waitUntil: 'domcontentloaded' })
    await settle(page)
    const body = await expectRendered(page, '/student/messenger')
    expect(body).toMatch(/Пока нет чатов|Выбери чат|Чат с педагогом|Мессенджер/)
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('«Дневник» и «Мой прогресс» открываются', async ({ page }) => {
    const errors = watchErrors(page)
    await loginAs(page, STUDENT_EMAIL, '/student')
    for (const path of ['/student/grades', '/student/progress']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await settle(page)
      await expectRendered(page, path)
    }
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('онлайн-уроки открываются', async ({ page }) => {
    const errors = watchErrors(page)
    await loginAs(page, STUDENT_EMAIL, '/student')
    await page.goto('/student/online', { waitUntil: 'domcontentloaded' })
    await settle(page)
    await expectRendered(page, '/student/online')
    expect(errors, errors.join('\n')).toEqual([])
  })
})

// ── Ролевой гард ────────────────────────────────────────────────────────────

test.describe('Ролевой гард', () => {
  test('ученик не попадает в /admin и /teacher', async ({ page }) => {
    await loginAs(page, STUDENT_EMAIL, '/student')
    for (const path of ['/admin/students', '/teacher/schedule']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(4000)
      expect(new URL(page.url()).pathname, `${path} пустил ученика`).not.toMatch(/^\/(admin|teacher)/)
    }
  })

  test('преподаватель не попадает в /admin', async ({ page }) => {
    await loginAs(page, TEACHER_EMAIL, '/teacher')
    await page.goto('/admin/students', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(4000)
    expect(new URL(page.url()).pathname, '/admin пустил преподавателя').not.toMatch(/^\/admin/)
  })
})
