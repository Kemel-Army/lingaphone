/**
 * Импорт методического листа «Fill in the Missing Words» из PDF в таблицу Song.
 *
 *   node scripts/import-song-pdf.mjs \
 *     --pdf "docs/Lemon Tree.pdf" --title "Lemon Tree" --artist "Fool's Garden" \
 *     --audio "docs/lemon.mpeg" --level B1 --genre pop
 *
 * В листе стоят прочерки (`________`) — сами слова там не напечатаны. Поэтому
 * импорт сохраняет ПОЗИЦИИ пропусков (`[]`), а слова преподаватель вписывает в
 * /admin/songs. Песня заводится черновиком: опубликовать её нельзя, пока не
 * заполнены все ответы и не приложено аудио (это же проверяет CHECK в БД).
 *
 * Повторный запуск обновляет песню с тем же title+artist, а не плодит дубли.
 */
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'

const env = Object.fromEntries(
  readFileSync('.env.lingaphone', 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')]
    })
)

const URL_BASE = env.SUPABASE_URL
const SERVICE = env.SUPABASE_SERVICE_KEY
if (!URL_BASE || !SERVICE) {
  console.error('Нужны SUPABASE_URL и SUPABASE_SERVICE_KEY в .env.lingaphone')
  process.exit(1)
}

// ─── Аргументы ───────────────────────────────────────────────────────────────

const args = {}
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i]?.replace(/^--/, '')
  if (key) args[key] = process.argv[i + 1]
}

for (const required of ['pdf', 'title', 'artist']) {
  if (!args[required]) {
    console.error(`Не хватает --${required}`)
    process.exit(1)
  }
}

// ─── PDF → строки ────────────────────────────────────────────────────────────

/**
 * pdfjs отдаёт разрозненные текстовые куски с координатами, поэтому строки
 * собираем сами: куски с одинаковой (округлённой) координатой Y — это одна строка.
 */
const extractLines = async (path) => {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(readFileSync(path)),
    useSystemFonts: true
  }).promise

  const lines = []
  for (let p = 1; p <= doc.numPages; p++) {
    const content = await (await doc.getPage(p)).getTextContent()
    const rows = new Map()
    for (const item of content.items) {
      if (typeof item.str !== 'string') continue
      const y = Math.round(item.transform[5])
      if (!rows.has(y)) rows.set(y, [])
      rows.get(y).push({ x: item.transform[4], str: item.str })
    }
    // Сверху вниз, внутри строки — слева направо.
    for (const y of [...rows.keys()].sort((a, b) => b - a)) {
      const text = rows.get(y)
        .sort((a, b) => a.x - b.x)
        .map(i => i.str)
        .join('')
        .replace(/\s+/g, ' ')
        .trim()
      lines.push(text)
    }
  }
  return lines
}

/** `________` → `[]`; заголовок листа выбрасываем. */
const toLyricLines = (lines) => {
  const body = lines
    .filter(l => !/Fill\s+in\s+the\s+Missing\s+Words/i.test(l))
    .map(l => l.replace(/_{2,}/g, '[]').trim())

  // Хвостовые пустые строки не нужны, внутренние — разделяют куплеты.
  while (body.length && body[body.length - 1] === '') body.pop()
  while (body.length && body[0] === '') body.shift()

  return body.map((line, lineIndex) => {
    const gaps = (line.match(/\[\]/g) ?? []).length
    return gaps === 0
      ? { lineIndex, text: line, hasGap: false }
      : { lineIndex, text: line.replace(/\[\]/g, '___'), hasGap: true, gapAnswer: Array(gaps).fill('') }
  })
}

// ─── Supabase ────────────────────────────────────────────────────────────────

const rest = async (path, init = {}) => {
  const res = await fetch(`${URL_BASE}/rest/v1${path}`, {
    ...init,
    headers: {
      'apikey': SERVICE,
      'Authorization': `Bearer ${SERVICE}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(init.headers ?? {})
    }
  })
  const body = await res.text()
  if (res.status >= 300) throw new Error(`${path} → ${res.status}: ${body}`)
  return body ? JSON.parse(body) : null
}

const uploadAudio = async (path) => {
  const name = basename(path).toLowerCase().replace(/[^a-z0-9.]+/g, '-')
  const key = `${Date.now()}-${name}`.replace(/\.(mpeg|mpga)$/, '.mp3')
  const res = await fetch(`${URL_BASE}/storage/v1/object/song-audio/${key}`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE,
      'Authorization': `Bearer ${SERVICE}`,
      'Content-Type': 'audio/mpeg',
      'x-upsert': 'true'
    },
    body: readFileSync(path)
  })
  if (res.status >= 300) throw new Error(`upload → ${res.status}: ${await res.text()}`)
  return {
    audioUrl: `${URL_BASE}/storage/v1/object/public/song-audio/${key}`,
    audioFileName: basename(path)
  }
}

// ─── Запуск ──────────────────────────────────────────────────────────────────

const lyrics = toLyricLines(await extractLines(args.pdf))
const gaps = lyrics.reduce((s, l) => s + (l.gapAnswer?.length ?? 0), 0)

if (gaps === 0) {
  console.error('В PDF не найдено ни одного прочерка — проверь файл')
  process.exit(1)
}

const audio = args.audio ? await uploadAudio(args.audio) : {}

const row = {
  title: args.title,
  artist: args.artist,
  level: args.level ?? null,
  genre: args.genre ?? null,
  lyrics,
  vocabulary: [],
  // Черновик: слов в пропусках ещё нет, публиковать нечего.
  isPublished: false,
  ...audio
}

const q = `?title=eq.${encodeURIComponent(args.title)}&artist=eq.${encodeURIComponent(args.artist)}`
const existing = await rest(`/Song${q}&select=id`)

const saved = existing?.length
  ? await rest(`/Song?id=eq.${existing[0].id}`, { method: 'PATCH', body: JSON.stringify(row) })
  : await rest('/Song', { method: 'POST', body: JSON.stringify(row) })

console.log(`${existing?.length ? 'обновлено' : 'создано'}: ${args.title} — ${args.artist}`)
console.log(`  строк: ${lyrics.length}, пропусков: ${gaps} (все без ответа)`)
console.log(`  аудио: ${audio.audioUrl ? audio.audioFileName : 'нет'}`)
console.log(`  id: ${saved[0].id} · черновик — впиши слова в /admin/songs`)
