import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const LESSON_PATH = process.env.CAPSULE_LESSON_PATH ?? '/student/my-path/68996f20-119-4f34-bf37-47f8456fa517/ee55fbdd-f0b4-4736-ba3e-e6b986b45bcc'
const EMAIL = process.env.CAPSULE_EMAIL ?? 'student@femo.kz'
const PASSWORD = process.env.CAPSULE_PASSWORD ?? 'femo2025'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

const results = []
const fail = (msg) => {
  throw new Error(msg)
}

try {
  // Explicit login first
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.getByRole('button', { name: 'Войти' }).click()
  await page.waitForURL('**/student**', { timeout: 15000 })

  // Open lesson capsule
  await page.goto(`${BASE}${LESSON_PATH}`, { waitUntil: 'networkidle' })
  await page.locator('aside button').first().waitFor({ timeout: 15000 })

  const badState = page.getByText(/lesson not found|урок не найден|капсула ещё собирается/i)
  if (await badState.count()) {
    fail('Найден not found/empty state вместо капсулы')
  }

  const sidebarButtons = page.locator('aside button')
  const layerCount = await sidebarButtons.count()
  if (layerCount < 11) {
    const bodyText = (await page.locator('body').innerText()).trim().replace(/\s+/g, ' ').slice(0, 300)
    fail(`Ожидалось минимум 11 слоёв, найдено: ${layerCount}. URL: ${page.url()}. Body: ${bodyText}`)
  }

  const checked = Math.min(11, layerCount)

  for (let i = 0; i < checked; i++) {
    await sidebarButtons.nth(i).click({ timeout: 5000 })
    await page.waitForTimeout(500)

    const placeholder = await page.getByText(/Этот слой скоро появится/i).count()
    const section = page.locator('section').last()
    const text = (await section.innerText()).trim().replace(/\s+/g, ' ').slice(0, 240)

    results.push({ layer: i + 1, placeholder: placeholder > 0, sample: text })

    if (placeholder > 0) {
      fail(`Слой ${i + 1}: отрисован fallback placeholder`)
    }
    if (!text) {
      fail(`Слой ${i + 1}: пустой контент`)
    }
  }

  console.log(JSON.stringify({ ok: true, layerCount, checked, results }, null, 2))
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: String(e), partial: results }, null, 2))
  process.exitCode = 1
} finally {
  await browser.close()
}
