/**
 * POST /api/admin/books/upload  (multipart/form-data)
 *
 * One-step book upload: ADMIN drops a PDF and picks a level. The PDF is stored
 * in the public `books` bucket (service role — only the server can write there),
 * then a Book + its first Module (pointing at the PDF) are created.
 *
 * Form fields:
 *   file        — the PDF (required)
 *   level       — A1 | A2 | B1 | B2 (required)
 *   title       — book title (optional; defaults to the file name)
 *   isPublished — "true" | "false" (optional; default true)
 */
const LEVELS = ['A1', 'A2', 'B1', 'B2']
const MAX_BYTES = 50 * 1024 * 1024 // matches bucket file_size_limit

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const parts = await readMultipartFormData(event)
  if (!parts?.length) throw createError({ statusCode: 400, message: 'Файл не передан' })

  const field = (name: string) =>
    parts.find(p => p.name === name && !p.filename)?.data.toString('utf-8').trim()

  const filePart = parts.find(p => p.name === 'file' && p.filename)
  if (!filePart) throw createError({ statusCode: 400, message: 'Файл не передан' })

  const level = field('level') ?? ''
  if (!LEVELS.includes(level)) throw createError({ statusCode: 400, message: 'Некорректный уровень' })

  const mime = filePart.type ?? 'application/octet-stream'
  if (mime !== 'application/pdf') {
    throw createError({ statusCode: 400, message: 'Допускается только PDF' })
  }
  if (filePart.data.length > MAX_BYTES) {
    throw createError({ statusCode: 413, message: 'Файл больше 50 МБ' })
  }

  const rawName = filePart.filename ?? 'book.pdf'
  const title = field('title') || rawName.replace(/\.pdf$/i, '').trim() || 'Без названия'
  const isPublished = (field('isPublished') ?? 'true') !== 'false'

  const supabase = useServerSupabase(event)

  // Upload PDF — randomized path keeps names collision-free.
  const safeBase = rawName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${level}/${Date.now()}-${safeBase}`
  const { error: upErr } = await supabase.storage
    .from('books')
    .upload(path, filePart.data, { contentType: 'application/pdf', upsert: false })
  if (upErr) throw createError({ statusCode: 500, message: `Загрузка не удалась: ${upErr.message}` })

  const { data: urlData } = supabase.storage.from('books').getPublicUrl(path)
  const pdfUrl = urlData.publicUrl

  const { data: book, error: bookErr } = await supabase
    .from('Book')
    .insert({ title, level, isPublished })
    .select('id')
    .single()
  if (bookErr || !book) {
    // Roll back the orphaned upload so storage doesn't accumulate junk.
    await supabase.storage.from('books').remove([path])
    throw createError({ statusCode: 500, message: bookErr?.message ?? 'Ошибка создания книги' })
  }

  const { error: modErr } = await supabase
    .from('Module')
    .insert({ bookId: book.id, title: 'Учебник', order: 1, pdfUrl })
  if (modErr) throw createError({ statusCode: 500, message: modErr.message })

  return { id: book.id, pdfUrl }
})
