import { expect, test } from '@playwright/test'

/** Landing redesign — commit ff8ba5e "landing page redesign with Ling mascot system". */

test.describe('Лендинг: рендер и целостность ассетов', () => {
  test('открывается, отдаёт 200 и заголовок', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle(/.+/)
  })

  test('ни один сетевой запрос не падает (нет битых ассетов)', async ({ page }) => {
    const failed: string[] = []
    page.on('response', (r) => {
      if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`)
    })
    await page.goto('/', { waitUntil: 'networkidle' })
    expect(failed, `битые запросы:\n${failed.join('\n')}`).toEqual([])
  })

  test('нет ошибок в консоли браузера', async ({ page }) => {
    const errors: string[] = []
    page.on('console', m => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', e => errors.push(e.message))
    await page.goto('/', { waitUntil: 'networkidle' })
    expect(errors, `ошибки консоли:\n${errors.join('\n')}`).toEqual([])
  })

  test('все изображения маскота Ling отрисовываются после прокрутки', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    // Маскоты ниже первого экрана намеренно loading="lazy", поэтому до
    // прокрутки они и не должны быть загружены — прокручиваем страницу целиком.
    // Наверх не возвращаемся: Chrome отменяет ленивую загрузку, если картинка
    // покидает зону подгрузки раньше, чем запрос успел стартовать.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y)
        await new Promise(r => setTimeout(r, 120))
      }
    })
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('img'))
        .filter(img => img.src.includes('/images/brand/'))
        .every(img => img.complete && img.naturalWidth > 0),
      null,
      { timeout: 20_000 }
    )
    const broken = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .filter(img => img.src.includes('/images/brand/'))
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src)
    )
    expect(broken, `не отрисовались:\n${broken.join('\n')}`).toEqual([])
  })

  test('маскот-состояния подключены (10 поз из MASCOT_SYSTEM.md)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const count = await page.locator('img[src*="/images/brand/mascot-states/"]').count()
    expect(count).toBeGreaterThanOrEqual(10)
  })
})

test.describe('Лендинг: вес страницы', () => {
  test('картинки лендинга укладываются в 3 МБ', async ({ page }) => {
    // Регрессия ff8ba5e: 11 сырых PNG (~9.8 МБ) отдаются через обычный <img>,
    // без @nuxt/image, без webp/avif и без ресайза. Для B2C-лендинга на
    // мобильном интернете это неприемлемо — тест держит планку.
    let imageBytes = 0
    page.on('response', async (r) => {
      if (!r.url().includes('/images/')) return
      const len = Number(r.headers()['content-length'] ?? 0)
      imageBytes += len
    })
    await page.goto('/', { waitUntil: 'networkidle' })
    expect(
      imageBytes,
      `картинки лендинга весят ${(imageBytes / 1024 / 1024).toFixed(1)} МБ`
    ).toBeLessThan(3 * 1024 * 1024)
  })

  test('лениво грузятся все маскоты, кроме одного героя первого экрана', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const eager = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .filter(img => img.src.includes('/images/brand/mascot-states/'))
        .filter(img => img.loading !== 'lazy')
        .map(img => img.src.split('/').pop() ?? '')
    )
    // LandingMascot по умолчанию ставит loading="lazy"; герой первого экрана
    // осознанно eager. Всё, что сверх одного — регрессия.
    expect(eager, `грузятся сразу:\n${eager.join('\n')}`).toHaveLength(1)
  })

  test('брендовые ассеты отдаются в webp, а не PNG-мастерами по 1104px', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    const assets = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .filter(img => img.src.includes('/images/brand/'))
        .map(img => ({ src: img.src, natural: img.naturalWidth }))
    )
    expect(assets.length).toBeGreaterThan(0)

    const png = assets.filter(a => a.src.endsWith('.png')).map(a => a.src)
    expect(png, `PNG-мастера всё ещё на лендинге:\n${png.join('\n')}`).toEqual([])

    // Один общий webp на все слоты (макс. .mascot-moment--lg 290px при 2x).
    // Мастера были 1104-1536px — вот их и ловим.
    const tooLarge = assets
      .filter(a => a.natural > 0 && a.natural > 1120)
      .map(a => `${a.src.split('/').pop()}: ${a.natural}px`)
    expect(tooLarge, `слишком большие исходники:\n${tooLarge.join('\n')}`).toEqual([])
  })
})

test.describe('Публичные страницы не сломаны редизайном', () => {
  for (const path of ['/about', '/contact', '/login', '/register']) {
    test(`${path} отдаёт 200 и рисует контент`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      await expect(page.locator('body')).not.toBeEmpty()
    })
  }
})
