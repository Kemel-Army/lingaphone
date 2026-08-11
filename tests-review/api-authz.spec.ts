import { expect, test } from '@playwright/test'

/**
 * Authorization on the server routes touched by b286c34.
 * Every one of these runs on the service-role client (RLS bypassed), so the
 * handler's own auth check is the only thing standing between an anonymous
 * caller and privileged writes.
 */

const GROUP_ID = '00000000-0000-4000-8000-000000000000'
const STUDENT_ID = '00000000-0000-4000-8000-000000000001'

test.describe('Анонимный доступ к server routes отклоняется', () => {
  test('POST /api/admin/groups/[id]/sync-conversation → 401', async ({ request }) => {
    const res = await request.post(`/api/admin/groups/${GROUP_ID}/sync-conversation`)
    expect(res.status()).toBe(401)
  })

  test('POST /api/admin/groups → 401', async ({ request }) => {
    const res = await request.post('/api/admin/groups', {
      data: { name: 'e2e-probe', teacherId: GROUP_ID }
    })
    expect(res.status()).toBe(401)
  })

  test('PATCH /api/admin/students/[id] со status → 401', async ({ request }) => {
    // Новое поле status в bodySchema (b286c34) не должно быть доступно анониму.
    const res = await request.patch(`/api/admin/students/${STUDENT_ID}`, {
      data: { status: 'DROPPED' }
    })
    expect(res.status()).toBe(401)
  })

  test('POST /api/teacher/lessons с type → 401', async ({ request }) => {
    const res = await request.post('/api/teacher/lessons', {
      data: { groupId: GROUP_ID, topic: 'e2e-probe', startsAt: new Date().toISOString(), type: 'TRIAL' }
    })
    expect(res.status()).toBe(401)
  })

  test('GET /api/director/stats → 401', async ({ request }) => {
    const res = await request.get('/api/director/stats')
    expect(res.status()).toBe(401)
  })

  test('POST /api/admin/leads/[id]/convert → 401', async ({ request }) => {
    // Атомарная конвертация лида в ученика: создаёт auth-аккаунт под
    // service-role, поэтому проверка роли — единственный барьер.
    const res = await request.post(`/api/admin/leads/${GROUP_ID}/convert`, {
      data: { name: 'e2e', surname: 'probe', email: 'e2e-probe@example.invalid', password: 'x'.repeat(12) }
    })
    expect(res.status()).toBe(401)
  })
})

test.describe('Приватные страницы не отдают данные анониму', () => {
  for (const path of [
    '/admin/students',
    '/admin/leads',
    '/admin/schedule',
    '/student/messenger',
    '/teacher/messenger',
    '/teacher/schedule'
  ]) {
    test(`${path} — редирект на логин или пустой каркас`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' })
      const url = page.url()
      const body = await page.locator('body').innerText()
      // Либо увели на /login, либо страница не отрисовала приватные данные.
      const redirected = /\/login|\/$/.test(new URL(url).pathname)
      expect(
        redirected || body.trim().length < 400,
        `${path} отрисовал контент анониму по адресу ${url}`
      ).toBeTruthy()
    })
  }
})

test.describe('Nitro scheduled tasks', () => {
  test('extend-lesson-schedule выполняется без ошибки', async ({ request }) => {
    // Задача добавлена в b286c34 и повешена на cron '0 3 * * 1'.
    // Регрессия: taskServiceRoleClient() вызывает require() внутри ESM-модуля,
    // поэтому задача падает с "require is not defined" на каждом запуске и
    // горизонт уроков не продлевается.
    const res = await request.post('/_nitro/tasks/extend-lesson-schedule')
    const body = await res.text()
    expect(body, `задача упала: ${body.slice(0, 300)}`).not.toContain('require is not defined')
    expect(res.status()).toBe(200)
  })
})
