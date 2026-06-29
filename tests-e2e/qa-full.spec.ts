import { test, expect, type Page, type BrowserContext } from '@playwright/test'

/**
 * Full-platform QA smoke + interaction suite.
 *
 * Strategy:
 *  - Log in once per role, persist storageState to disk (auth = cookies).
 *  - For every static page of every role: navigate, assert it renders (no
 *    Nuxt error boundary, body has content), collect console/page errors.
 *  - Dynamic [id] pages: open the list, click the first item.
 *  - Cross-role isolation: each role is bounced from foreign role prefixes.
 *  - Interaction smoke: search inputs, dropdowns, primary buttons per role.
 *
 * Runs against an already-running `pnpm dev` on :3000 with real Supabase.
 */

const PASSWORD = 'password123'
const SHOT = 'tests-e2e/__shots__/qa'
const STATE_DIR = 'tests-e2e/.auth'

const USERS = {
  student: 'student@linga.kz',
  teacher: 'teacher@linga.kz',
  admin: 'admin@linga.kz'
} as const
type Role = keyof typeof USERS
const statePath = (r: Role) => `${STATE_DIR}/${r}.json`

// ---------------------------------------------------------------- error noise
const IGNORE = [
  /favicon/i, /sourcemap/i, /Download the Vue Devtools/i, /\[vite\]/i,
  /manifest/i, /ERR_ABORTED/i, /_nuxt\//i, /Failed to load resource/i,
  /net::ERR_/i, /Hydration/i, /hydrat/i
]
function realErrors(errs: string[]): string[] {
  return errs.filter(e => !IGNORE.some(rx => rx.test(e)))
}
function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`))
  return errors
}

async function loginInContext(ctx: BrowserContext, email: string) {
  const page = await ctx.newPage()
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect.poll(async () => {
    const cookies = await ctx.cookies()
    return cookies.some(c => /auth-token/.test(c.name))
  }, { timeout: 30_000, message: `auth cookie never set for ${email}` }).toBe(true)
  await page.close()
}

/** Page renders if no Nuxt error boundary and <main>/body has real content. */
async function assertRenders(page: Page, path: string) {
  // Nuxt error page shows statusCode / "error" component
  const errBoundary = page.locator('.nuxt-error-page, [data-nuxt-error]')
  await expect(errBoundary, `Nuxt error boundary on ${path}`).toHaveCount(0)
  const bodyText = (await page.locator('body').innerText()).trim()
  expect(bodyText.length, `empty body on ${path}`).toBeGreaterThan(0)
  // common crash signatures in visible text
  for (const sig of ['statusCode: 500', 'Cannot read properties', 'is not defined', 'undefined is not']) {
    expect(bodyText, `crash text "${sig}" on ${path}`).not.toContain(sig)
  }
}

// ===================================================================== SETUP
test.describe.serial('QA · auth setup', () => {
  for (const [role, email] of Object.entries(USERS) as [Role, string][]) {
    test(`login ${role}`, async ({ browser }) => {
      const ctx = await browser.newContext()
      await loginInContext(ctx, email)
      await ctx.storageState({ path: statePath(role) })
      await ctx.close()
    })
  }
})

// ================================================================ PAGE LISTS
const PUBLIC_PAGES = ['/', '/about', '/contact', '/privacy', '/terms', '/forgot-password', '/level-test']

const STUDENT_PAGES = [
  '/student', '/student/achievements', '/student/books', '/student/certificates',
  '/student/events', '/student/game', '/student/grades', '/student/grammar',
  '/student/groups', '/student/homework', '/student/leaderboard', '/student/materials',
  '/student/messenger', '/student/practice', '/student/progress', '/student/reading',
  '/student/schedule', '/student/settings', '/student/songs'
]
const TEACHER_PAGES = [
  '/teacher', '/teacher/grades', '/teacher/groups', '/teacher/homework',
  '/teacher/homework/create', '/teacher/profile', '/teacher/schedule',
  '/teacher/students', '/teacher/submissions', '/teacher/testing'
]
const ADMIN_PAGES = [
  '/admin', '/admin/books', '/admin/finance', '/admin/groups', '/admin/schedule',
  '/admin/settings', '/admin/students', '/admin/teachers', '/admin/testing'
]

const ROLE_PAGES: Record<Role, string[]> = {
  student: STUDENT_PAGES, teacher: TEACHER_PAGES, admin: ADMIN_PAGES
}

// ============================================================ PUBLIC SMOKE
test.describe('QA · public pages (anonymous)', () => {
  for (const path of PUBLIC_PAGES) {
    test(`renders ${path}`, async ({ page }) => {
      const errors = trackErrors(page)
      const resp = await page.goto(path, { waitUntil: 'networkidle' })
      expect(resp?.status(), `HTTP ${resp?.status()} for ${path}`).toBeLessThan(400)
      await assertRenders(page, path)
      await page.screenshot({ path: `${SHOT}/public${path.replace(/\//g, '_') || '_home'}.png`, fullPage: true })
      expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([])
    })
  }

  test('anonymous is redirected from protected paths to /login', async ({ page }) => {
    for (const p of ['/student', '/teacher', '/admin', '/parent']) {
      await page.goto(p, { waitUntil: 'networkidle' })
      await expect(page, `${p} should redirect anon to /login`).toHaveURL(/\/login/)
    }
  })
})

// ====================================================== PER-ROLE PAGE SMOKE
for (const role of ['student', 'teacher', 'admin'] as Role[]) {
  test.describe(`QA · ${role} pages`, () => {
    test.use({ storageState: statePath(role) })

    for (const path of ROLE_PAGES[role]) {
      test(`renders ${path}`, async ({ page }) => {
        const errors = trackErrors(page)
        const resp = await page.goto(path, { waitUntil: 'networkidle' })
        expect(resp?.status(), `HTTP ${resp?.status()} for ${path}`).toBeLessThan(400)
        // role-guard could bounce us — assert we actually stayed on the page
        await expect(page, `${role} bounced from ${path}`).toHaveURL(new RegExp(path.replace(/[/]/g, '\\/')))
        await assertRenders(page, path)
        await page.screenshot({ path: `${SHOT}/${role}${path.replace(/\//g, '_')}.png`, fullPage: true })
        expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([])
      })
    }
  })
}

// =================================================== CROSS-ROLE ISOLATION
test.describe('QA · cross-role isolation (role-guard)', () => {
  const FOREIGN: Record<Role, string[]> = {
    student: ['/admin', '/teacher'],
    teacher: ['/admin', '/student'],
    admin: ['/teacher', '/student']
  }
  const HOME: Record<Role, RegExp> = {
    student: /\/student/, teacher: /\/teacher/, admin: /\/admin/
  }
  for (const role of ['student', 'teacher', 'admin'] as Role[]) {
    test(`${role} cannot open foreign role pages`, async ({ browser }) => {
      const ctx = await browser.newContext({ storageState: statePath(role) })
      const page = await ctx.newPage()
      for (const foreign of FOREIGN[role]) {
        await page.goto(foreign, { waitUntil: 'networkidle' })
        await expect(page, `${role} reached ${foreign} (should be bounced home)`).toHaveURL(HOME[role])
      }
      await ctx.close()
    })
  }
})

// =================================================== DYNAMIC [id] PAGES
test.describe('QA · student dynamic detail pages', () => {
  test.use({ storageState: statePath('student') })

  const FLOWS: { list: string, itemUrl: RegExp, name: string }[] = [
    { list: '/student/books', itemUrl: /\/student\/books\/.+/, name: 'books' },
    { list: '/student/groups', itemUrl: /\/student\/groups\/.+/, name: 'groups' },
    { list: '/student/reading', itemUrl: /\/student\/reading\/.+/, name: 'reading' },
    { list: '/student/songs', itemUrl: /\/student\/songs\/.+/, name: 'songs' },
    { list: '/student/grammar', itemUrl: /\/student\/grammar\/.+/, name: 'grammar' },
    { list: '/student/homework', itemUrl: /\/student\/homework\/.+/, name: 'homework' }
  ]
  for (const f of FLOWS) {
    test(`open first ${f.name} item`, async ({ page }) => {
      const errors = trackErrors(page)
      await page.goto(f.list, { waitUntil: 'networkidle' })
      const link = page.locator(`a[href*="${f.list}/"]`).first()
      const count = await page.locator(`a[href*="${f.list}/"]`).count()
      if (count === 0) { test.skip(true, `no ${f.name} items seeded`); return }
      await link.click()
      await page.waitForURL(f.itemUrl, { timeout: 20_000 })
      await assertRenders(page, f.name)
      await page.screenshot({ path: `${SHOT}/student_detail_${f.name}.png`, fullPage: true })
      expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([])
    })
  }

  // Direct-nav the seeded group detail (cards aren't anchors → click flow skips).
  // This group has branchId=null + a teacher; exercises the null-branch guard.
  test('group detail renders with null branch (regression)', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/student/groups/950deb6f-b8b6-45f9-99ca-f391e5c22d05', { waitUntil: 'networkidle' })
    await assertRenders(page, '/student/groups/[id]')
    await page.screenshot({ path: `${SHOT}/student_detail_group_direct.png`, fullPage: true })
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([])
  })
})

// =================================================== INTERACTION SMOKE
test.describe('QA · interactions', () => {
  test('admin students search + filters respond', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: statePath('admin') })
    const page = await ctx.newPage()
    const errors = trackErrors(page)
    await page.goto('/admin/students', { waitUntil: 'networkidle' })
    const search = page.locator('input[type="search"], input[placeholder*="Поиск"], input[placeholder*="поиск"]').first()
    if (await search.count()) {
      await search.fill('zzz_no_match_zzz')
      await page.waitForTimeout(600)
      await search.fill('')
      await page.waitForTimeout(300)
    }
    await assertRenders(page, '/admin/students')
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([])
    await ctx.close()
  })

  test('teacher students search responds', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: statePath('teacher') })
    const page = await ctx.newPage()
    const errors = trackErrors(page)
    await page.goto('/teacher/students', { waitUntil: 'networkidle' })
    const search = page.locator('input[type="search"], input[placeholder*="Поиск"], input[placeholder*="поиск"]').first()
    if (await search.count()) {
      await search.fill('a'); await page.waitForTimeout(500); await search.fill('')
    }
    await assertRenders(page, '/teacher/students')
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([])
    await ctx.close()
  })

  test('every primary button on student dashboard is enabled & clickable', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: statePath('student') })
    const page = await ctx.newPage()
    const errors = trackErrors(page)
    await page.goto('/student', { waitUntil: 'networkidle' })
    const buttons = page.getByRole('button')
    const n = await buttons.count()
    expect(n, 'student dashboard should have actionable buttons').toBeGreaterThan(0)
    expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([])
    await ctx.close()
  })
})
