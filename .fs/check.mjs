import { chromium } from 'playwright-core'
const B = 'http://127.0.0.1:3181'
let pass = 0, fail = 0
const ok = (n, c, e = '') => { c ? pass++ : fail++; console.log(`  ${c ? '✅' : '❌'} ${n}${e ? ' — ' + e : ''}`) }

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()

await page.goto(`${B}/login`, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.fill('input[type="email"]', 'admin@linga.kz')
await page.fill('input[type="password"]', 'password123')
await page.click('button[type="submit"]')
for (let i = 0; i < 25; i++) { if (!page.url().includes('/login')) break; await page.waitForTimeout(1000) }
ok('вход админом', !page.url().includes('/login'))

await page.goto(`${B}/admin/messenger`, { waitUntil: 'networkidle' })
await page.waitForTimeout(6000)

const t = (await page.locator('body').innerText()).toLowerCase()
ok('страница открылась', t.includes('мессенджер'))
ok('iframe Wazzup вставлен', (await page.locator('iframe').count()) > 0)

// Высота чата в обычном режиме
const normalH = await page.locator('iframe').first().evaluate(el => el.getBoundingClientRect().height)
ok('чат занимает заметную высоту', normalH > 450, `${Math.round(normalH)} px`)

// Подсказка
const hint = t.includes('интеграция с crm') && t.includes('выбрать роли')
ok('подсказка указывает верный путь (Интеграция с CRM → Выбрать роли)', hint)
ok('подсказка упоминает роль «Руководитель»', t.includes('руководитель'))
ok('подсказка предупреждает про каналы', t.includes('каждого канала'))
await page.screenshot({ path: '.fs/shots/normal.png' })

// Разворачиваем
const btn = page.locator('button[title*="азверн"]').first()
ok('кнопка разворота есть', await btn.count() > 0)
if (await btn.count()) {
  await btn.click()
  await page.waitForTimeout(1500)
  const fsH = await page.locator('iframe').first().evaluate(el => el.getBoundingClientRect().height)
  ok('на весь экран чат стал выше', fsH > normalH, `${Math.round(normalH)} → ${Math.round(fsH)} px`)
  const vh = await page.evaluate(() => window.innerHeight)
  ok('занимает почти всё окно', fsH > vh * 0.85, `${Math.round(fsH)} из ${vh} px`)
  const overflow = await page.evaluate(() => document.body.style.overflow)
  ok('страница под чатом не скроллится', overflow === 'hidden', overflow || '(пусто)')
  await page.screenshot({ path: '.fs/shots/fullscreen.png' })

  await page.keyboard.press('Escape')
  await page.waitForTimeout(1200)
  const backH = await page.locator('iframe').first().evaluate(el => el.getBoundingClientRect().height)
  ok('Esc возвращает обычный режим', Math.abs(backH - normalH) < 60, `${Math.round(backH)} px`)
  const overflow2 = await page.evaluate(() => document.body.style.overflow)
  ok('скролл страницы возвращён', overflow2 !== 'hidden', overflow2 || '(пусто)')
}

// Закрытие подсказки запоминается
const close = page.locator('[role="alert"] button, .shrink-0 button').first()
if (await close.count()) {
  await close.click()
  await page.waitForTimeout(800)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)
  const t2 = (await page.locator('body').innerText()).toLowerCase()
  ok('закрытая подсказка не возвращается после перезагрузки', !t2.includes('выбрать роли'))
}

console.log(`\n━━━━ ИТОГ: ${pass} прошло, ${fail} провалено ━━━━`)
await browser.close()
process.exit(fail ? 1 : 0)
