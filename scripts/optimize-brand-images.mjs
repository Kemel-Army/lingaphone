/**
 * Downscale + re-encode the landing brand art to WebP.
 *
 * The redesign (ff8ba5e) shipped 11 raw PNGs — ~9.8 MB total — straight into
 * <img> tags. Each source is 1104x1424 but renders into a 96–290 px slot, so
 * the browser downloads roughly 30x more pixels than it draws. @nuxt/image is
 * not registered in nuxt.config.ts, so there is no runtime resizing either.
 *
 * This emits one WebP per asset at MASCOT_WIDTH / HERO_WIDTH (enough for a 2x
 * display) next to the original. Re-run after replacing any source art:
 *   node scripts/optimize-brand-images.mjs
 */
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { readdir, readFile, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'

const BRAND_DIR = path.join(process.cwd(), 'public/images/brand')
const MASCOT_DIR = path.join(BRAND_DIR, 'mascot-states')

// Largest rendered slot is .mascot-moment--lg (290px); 640 covers it at 2x.
const MASCOT_WIDTH = 640
// Hero sits in a flexible column, ~560px at desktop; 1120 covers it at 2x.
const HERO_WIDTH = 1120
const QUALITY = 82

const toWebp = async (srcPath, targetWidth) => {
  const image = await loadImage(await readFile(srcPath))
  const scale = Math.min(1, targetWidth / image.width)
  const width = Math.round(image.width * scale)
  const height = Math.round(image.height * scale)

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0, width, height)

  const outPath = srcPath.replace(/\.png$/i, '.webp')
  const buffer = canvas.toBuffer('image/webp', QUALITY)
  await writeFile(outPath, buffer)

  const before = (await stat(srcPath)).size
  const after = buffer.length
  return { outPath, before, after, width, height, srcWidth: image.width }
}

const run = async () => {
  const targets = []

  for (const file of await readdir(MASCOT_DIR)) {
    if (file.endsWith('-transparent.png')) {
      targets.push([path.join(MASCOT_DIR, file), MASCOT_WIDTH])
    }
  }
  targets.push([path.join(BRAND_DIR, 'platform-hero-transparent-v2.png'), HERO_WIDTH])

  let before = 0
  let after = 0
  for (const [src, width] of targets.sort()) {
    const r = await toWebp(src, width)
    before += r.before
    after += r.after
    console.log(
      `${path.basename(r.outPath).padEnd(38)} `
      + `${r.srcWidth}px -> ${r.width}x${r.height}  `
      + `${(r.before / 1024).toFixed(0)}KB -> ${(r.after / 1024).toFixed(0)}KB`
    )
  }

  console.log(
    `\ntotal ${(before / 1024 / 1024).toFixed(2)} MB -> ${(after / 1024 / 1024).toFixed(2)} MB `
    + `(-${(100 - (after / before) * 100).toFixed(1)}%)`
  )
}

await run()
