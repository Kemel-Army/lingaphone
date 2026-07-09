import { test, expect, type Page } from '@playwright/test'
import {
  STUDENT_SIDEBAR, TEACHER_SIDEBAR, ADMIN_SIDEBAR, DIRECTOR_SIDEBAR, PARENT_SIDEBAR
} from '../app/shared/types/common'

/**
 * Полный QA-прогон: каждой ролью проходим ВСЕ страницы сайдбара и ловим
 * pageerror (JS-краши), console.error и сетевые 4xx/5xx. Плюс проверяем,
 * что ключевые модалки открываются/закрываются без ошибок.
 * Гоняется против запущенного dev-сервера :3000 (playwright.e2e.config).
 */

const CREDS: Record<string, string> = {
  admin: 'admin@linga.kz',
  teacher: 'teacher@linga.kz',
  student: 'kenzhebaev@mail.ru',
  parent: 'parent@linga.kz',
  director: 'director@linga.kz'
}
const PW = 'password123'

const ROUTES: Record<string, string[]> = {
  admin: ADMIN_SIDEBAR.map(i => i.to),
  teacher: TEACHER_SIDEBAR.map(i => i.to),
  student: STUDENT_SIDEBAR.map(i => i.to),
  parent: PARENT_SIDEBAR.map(i => i.to),
  director: DIRECTOR_SIDEBAR.map(i => i.to)
}

// Шум, который не считаем проблемой (жёсткие гейты — JS-краши и реальные
// сетевые 4xx/5xx ловятся отдельно; здесь фильтруем дубли и dev-only варны).
const IGNORE = [
  /favicon/, /wazzup\/iframe/, /\.map(\?|$)/, /web-vitals/,
  /__nuxt_devtools__/, /\/_nuxt\//, /devtools/, /hot-update/,
  / resource: net::ERR_/, /ResizeObserver/,
  // Дубликат сетевого 503 без URL (реальные сетевые ошибки ловит response-listener)
  /Failed to load resource/,
  // Dev-only варны гидрации Vue (в проде их нет, Vue сам ре-рендерит клиентом)
  /Hydration completed but contains mismatches/,
  /Hydration (node|text|children|class|style|attribute) mismatch/
]
const ignore = (s: string) => IGNORE.some(r => r.test(s))

async function login(page: Page, email: string) {
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400) // дать гидрации навесить обработчики
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(PW)
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect.poll(
    async () => (await page.context().cookies()).some(c => /auth-token/.test(c.name)),
    { timeout: 30_000, message: `login failed: ${email}` }
  ).toBe(true)
}

for (const [role, email] of Object.entries(CREDS)) {
  test.describe(`QA sweep · ${role}`, () => {
    test(`${role}: все страницы без ошибок консоли/сети`, async ({ page }) => {
      test.setTimeout(240_000)
      const byRoute: Record<string, string[]> = {}
      let current = 'login'
      const push = (s: string) => { (byRoute[current] ??= []).push(s) }

      page.on('pageerror', e => push(`JS-ERROR: ${e.message}`))
      page.on('console', (m) => {
        if (m.type() === 'error' && !ignore(m.text())) push(`CONSOLE: ${m.text().slice(0, 200)}`)
      })
      page.on('response', (r) => {
        const s = r.status()
        const u = r.url()
        if (s >= 400 && !ignore(u)) push(`NET ${s}: ${u.split('?')[0]}`)
      })

      await login(page, email)

      for (const route of ROUTES[role]!) {
        current = route
        await page.goto(route, { waitUntil: 'domcontentloaded' }).catch((e) => {
          // ERR_ABORTED = навигацию перебил клиентский редирект — не ошибка.
          if (!/ERR_ABORTED/.test(e.message)) push(`GOTO: ${e.message}`)
        })
        await page.waitForTimeout(1500)
        // страница не пустая (что-то отрендерилось)
        const bodyText = (await page.locator('body').innerText().catch(() => '')) || ''
        if (bodyText.trim().length < 5) push('BLANK PAGE (пустой рендер)')
      }

      const problems = Object.entries(byRoute).filter(([, v]) => v.length > 0)
      if (problems.length) {
        console.log(`\n===== ${role} PROBLEMS =====\n`
          + problems.map(([r, v]) => `  ${r}\n    - ${v.join('\n    - ')}`).join('\n'))
      }
      expect(problems, `Проблемы у роли ${role}`).toEqual([])
    })
  })
}

// Клик по кнопке открытия модалки с ретраями (устойчиво к гидрации).
async function openModal(page: Page, nameRe: RegExp) {
  const btn = page.getByRole('button', { name: nameRe }).first()
  await btn.waitFor({ state: 'visible', timeout: 10_000 })
  const dialog = page.getByRole('dialog')
  for (let i = 0; i < 4; i++) {
    await btn.click().catch(() => {})
    if (await dialog.isVisible().catch(() => false)) return dialog
    await page.waitForTimeout(600)
  }
  return dialog
}

// ─── Интерактив: ключевые модалки открываются/закрываются без throw ──
test.describe('QA · модалки CRM/финансы/директор', () => {
  test('admin: create-модалки открываются и закрываются', async ({ page }) => {
    test.setTimeout(120_000)
    const errors: string[] = []
    page.on('pageerror', e => errors.push(`JS: ${e.message}`))
    page.on('console', (m) => { if (m.type() === 'error' && !ignore(m.text())) errors.push(`C: ${m.text().slice(0, 150)}`) })

    await login(page, CREDS.admin!)

    const checks: { route: string, open: RegExp }[] = [
      { route: '/admin/leads', open: /Новый лид/ },
      { route: '/admin/tasks', open: /Новая задача/ },
      { route: '/admin/finances', open: /Платёж/ },
      { route: '/admin/parents', open: /Добавить родителя/ }
    ]
    for (const c of checks) {
      await page.goto(c.route, { waitUntil: 'networkidle' })
      await page.waitForTimeout(500)
      const dialog = await openModal(page, c.open)
      await expect(dialog, `модалка не открылась: ${c.route}`).toBeVisible({ timeout: 5000 })
      await page.keyboard.press('Escape')
      await expect(dialog, `модалка не закрылась: ${c.route}`).toBeHidden({ timeout: 5000 })
    }
    expect(errors, JSON.stringify(errors)).toEqual([])
  })

  test('director: модалка филиала + свитчер', async ({ page }) => {
    test.setTimeout(90_000)
    const errors: string[] = []
    page.on('pageerror', e => errors.push(`JS: ${e.message}`))
    await login(page, CREDS.director!)
    await page.goto('/director/branches', { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    const dialog = await openModal(page, /Новый филиал/)
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden({ timeout: 5000 })
    expect(errors, JSON.stringify(errors)).toEqual([])
  })

  test('parent: карточка ребёнка открывается', async ({ page }) => {
    test.setTimeout(90_000)
    const errors: string[] = []
    page.on('pageerror', e => errors.push(`JS: ${e.message}`))
    await login(page, CREDS.parent!)
    await page.goto('/parent', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1200)
    const link = page.locator('a[href^="/parent/children/"]').first()
    if (await link.count()) {
      await link.click()
      await page.waitForTimeout(1200)
      await expect(page).toHaveURL(/\/parent\/children\//)
    }
    expect(errors, JSON.stringify(errors)).toEqual([])
  })
})
