import { createCanvas, loadImage } from '@napi-rs/canvas'
import { writeFile } from 'node:fs/promises'

const [input, output] = process.argv.slice(2)
if (!input || !output) throw new Error('Usage: node scripts/remove-connected-chroma.mjs input.png output.png')

const image = await loadImage(input)
const canvas = createCanvas(image.width, image.height)
const context = canvas.getContext('2d')
context.drawImage(image, 0, 0)
const frame = context.getImageData(0, 0, image.width, image.height)
const { data, width, height } = frame
const removed = new Uint8Array(width * height)
const queue = new Int32Array(width * height)
let head = 0
let tail = 0

const isChroma = (index) => {
  const offset = index * 4
  const red = data[offset]
  const green = data[offset + 1]
  const blue = data[offset + 2]
  return green > 115 && green - Math.max(red, blue) > 48
}
const enqueue = (index) => {
  if (index < 0 || index >= width * height || removed[index] || !isChroma(index)) return
  removed[index] = 1
  queue[tail++] = index
}

for (let x = 0; x < width; x++) {
  enqueue(x)
  enqueue((height - 1) * width + x)
}
for (let y = 0; y < height; y++) {
  enqueue(y * width)
  enqueue(y * width + width - 1)
}

while (head < tail) {
  const index = queue[head++]
  const x = index % width
  if (x > 0) enqueue(index - 1)
  if (x < width - 1) enqueue(index + 1)
  if (index >= width) enqueue(index - width)
  if (index < width * (height - 1)) enqueue(index + width)
}

for (let index = 0; index < removed.length; index++) {
  if (removed[index]) data[index * 4 + 3] = 0
}

context.putImageData(frame, 0, 0)
await writeFile(output, canvas.toBuffer('image/png'))
