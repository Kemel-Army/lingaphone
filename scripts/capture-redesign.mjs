import { chromium } from '@playwright/test'

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
})

const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.goto('http://127.0.0.1:3210', { waitUntil: 'networkidle' })
await page.evaluate(() => {
  document.querySelectorAll('img[loading="lazy"]').forEach((image) => {
    image.loading = 'eager'
  })
})
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 700) {
    window.scrollTo(0, y)
    await new Promise(resolve => setTimeout(resolve, 60))
  }
  window.scrollTo(0, 0)
})
await page.waitForFunction(() => [...document.images].every(image => image.complete))
await page.screenshot({ path: 'redesign-desktop.png', fullPage: true })
await page.screenshot({ path: 'redesign-hero.png' })
await page.locator('#results').screenshot({ path: 'redesign-results.png' })
await page.setViewportSize({ width: 390, height: 844 })
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 500) {
    window.scrollTo(0, y)
    await new Promise(resolve => setTimeout(resolve, 60))
  }
  window.scrollTo(0, 0)
})
await page.screenshot({ path: 'redesign-mobile.png', fullPage: true })
await page.locator('#results').screenshot({ path: 'redesign-results-mobile.png' })
await browser.close()
