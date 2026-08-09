import { createCanvas, loadImage } from '@napi-rs/canvas'
import { writeFile } from 'node:fs/promises'

const [input, output] = process.argv.slice(2)
if (!input || !output) throw new Error('Usage: node scripts/remove-chroma.mjs input.png output.png')

const image = await loadImage(input)
const canvas = createCanvas(image.width, image.height)
const context = canvas.getContext('2d')
context.drawImage(image, 0, 0)
const frame = context.getImageData(0, 0, image.width, image.height)
const pixels = frame.data

for (let offset = 0; offset < pixels.length; offset += 4) {
  const red = pixels[offset]
  const green = pixels[offset + 1]
  const blue = pixels[offset + 2]
  const greenLead = green - Math.max(red, blue)
  if (green > 105 && greenLead > 42) {
    const alpha = Math.max(0, Math.min(255, Math.round(255 * (1 - (greenLead - 42) / 175))))
    pixels[offset + 3] = alpha
    if (alpha > 0) pixels[offset + 1] = Math.min(green, Math.max(red, blue) + 10)
  }
}

context.putImageData(frame, 0, 0)
await writeFile(output, canvas.toBuffer('image/png'))
