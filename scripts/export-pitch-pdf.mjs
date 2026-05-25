#!/usr/bin/env node
import { chromium } from 'playwright-core'
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'

const URL = process.env.PITCH_URL || 'http://localhost:3001/pitch'
const OUT = process.env.PITCH_OUT || 'pitch.pdf'

const candidates = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
]
const executablePath = candidates.find(p => existsSync(p))
if (!executablePath) {
  console.error('No Chrome/Chromium/Edge found on system.')
  process.exit(1)
}

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none']
})
const ctx = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
console.log(`→ Opening ${URL}`)
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60_000 })
await page.emulateMedia({ media: 'print' })
await page.waitForTimeout(2000)

await page.addStyleTag({
  content: `
    @page { size: 130mm 231mm; margin: 0; }
    html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
    .pitch-toolbar { display: none !important; }
    .pitch-shell, .pitch-deck { padding: 0 !important; gap: 0 !important; display: block !important; background: white !important; min-height: 0 !important; }
    .pitch-slide {
      display: flex !important;
      flex-direction: column !important;
      gap: 12px !important;
      width: 130mm !important;
      height: 231mm !important;
      min-height: 231mm !important;
      max-height: 231mm !important;
      max-width: none !important;
      aspect-ratio: auto !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      margin: 0 !important;
      padding: 12mm 9mm 9mm !important;
      overflow: hidden !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .pitch-split { align-items: start !important; }
    .pitch-phone { flex-shrink: 0 !important; }
    .pitch-slide:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }
    /* PDF render stability: replace heavy blurs with simple gradients */
    .pitch-blob { display: none !important; }
    .pitch-stars { display: none !important; }
    .pitch-slide {
      background-image:
        radial-gradient(220px 220px at 100% 0%, rgba(250, 165, 26, 0.25), transparent 60%),
        radial-gradient(200px 200px at 0% 100%, rgba(239, 68, 56, 0.20), transparent 60%) !important;
    }
  `
})

const slideCount = await page.$$eval('.pitch-slide', els => els.length)
console.log(`→ Total slides: ${slideCount}`)

// Render in batches of 5 to avoid Chrome PrintToPDF memory issues
const BATCH = 5
const tempFiles = []
for (let start = 1; start <= slideCount; start += BATCH) {
  const end = Math.min(start + BATCH - 1, slideCount)
  const tmp = `.pitch-batch-${start}-${end}.pdf`
  console.log(`→ Rendering pages ${start}–${end} → ${tmp}`)
  await page.pdf({
    path: tmp,
    width: '130mm',
    height: '231mm',
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    printBackground: true,
    preferCSSPageSize: false,
    pageRanges: `${start}-${end}`
  })
  tempFiles.push(tmp)
}

await browser.close()

// Merge batches
console.log(`→ Merging ${tempFiles.length} batches → ${OUT}`)
const merged = await PDFDocument.create()
for (const f of tempFiles) {
  const bytes = readFileSync(f)
  const doc = await PDFDocument.load(bytes)
  const copied = await merged.copyPages(doc, doc.getPageIndices())
  copied.forEach(p => merged.addPage(p))
}
const finalBytes = await merged.save()
writeFileSync(OUT, finalBytes)

for (const f of tempFiles) {
  try {
    unlinkSync(f)
  } catch {
    // ignore
  }
}

console.log(`✔ Saved ${OUT} · ${merged.getPageCount()} pages · ${(finalBytes.length / 1024 / 1024).toFixed(2)} MB`)
