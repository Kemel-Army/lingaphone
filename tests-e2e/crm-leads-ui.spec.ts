import { test, expect } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * UI-регрессия бага модалки создания лида: при `value: ''` у пункта USelect
 * Reka UI бросал исключение → дропдауны «Ответственный»/«Филиал» не
 * открывались и модалка не закрывалась. Проверяем, что теперь:
 *   - дропдаун «Ответственный» открывается (есть опции)
 *   - «Создать» закрывает модалку (лид создаётся)
 * Требует запущенный dev-сервер на :3000 (playwright.e2e.config).
 */

function loadEnv() {
  const file = ['.env.lingaphone', '.env'].map(f => resolve(process.cwd(), f)).find(p => existsSync(p))
  if (!file) throw new Error('no .env(.lingaphone) found')
  const raw = readFileSync(file, 'utf8')
  const get = (k: string) => raw.split('\n').find(l => l.startsWith(`${k}=`))?.slice(k.length + 1).trim().replace(/^"|"$/g, '') ?? ''
  return { URL: get('SUPABASE_URL'), ANON: get('SUPABASE_KEY'), SVC: get('SUPABASE_SERVICE_KEY') }
}
const { URL: SUPA, SVC } = loadEnv()
const LEAD_NAME = `UI Regr Lead ${String(Date.now()).slice(-9)}`

test.afterAll(async () => {
  // cleanup created lead(s)
  await fetch(`${SUPA}/rest/v1/Lead?fullName=eq.${encodeURIComponent(LEAD_NAME)}`, {
    method: 'DELETE',
    headers: { apikey: SVC, Authorization: `Bearer ${SVC}` }
  })
})

test('создание лида: дропдаун открывается и модалка закрывается', async ({ page }) => {
  // login (UI)
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.locator('input[type="email"]').fill('admin@linga.kz')
  await page.locator('input[type="password"]').fill('password123')
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect.poll(async () => (await page.context().cookies()).some(c => /auth-token/.test(c.name)),
    { timeout: 30_000 }).toBe(true)

  await page.goto('/admin/leads', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Новый лид/ }).first().click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  // fill name (first input in dialog)
  await dialog.locator('input').first().fill(LEAD_NAME)

  // Открыть дропдаун «Ответственный» (3-й combobox: источник, этап, ответственный, филиал)
  const combos = dialog.getByRole('combobox')
  await expect(combos).toHaveCount(4)
  await combos.nth(2).click()
  // Опции появились (регрессия: было 0 из-за throw)
  await expect.poll(async () => await page.getByRole('option').count(), { timeout: 5000 }).toBeGreaterThan(0)
  await page.keyboard.press('Escape')

  // Создать → модалка закрывается (регрессия: оставалась открытой)
  await page.getByRole('button', { name: /^Создать$/ }).click()
  await expect(dialog).toBeHidden({ timeout: 10_000 })
})
