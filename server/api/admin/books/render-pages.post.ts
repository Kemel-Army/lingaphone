/**
 * POST /api/admin/books/render-pages  (multipart/form-data)
 *
 * Stores ONE page image of a module's PDF. The PDF is rendered to PNG in the
 * browser (vue-pdf-embed / pdfjs with the OpenJPEG wasm — the only place the
 * JPEG2000 scans decode), then each page PNG is posted here. The server writes
 * it to the public `books` bucket and upserts a BookPage row. Per-page calls
 * keep the job resumable for large books.
 *
 * Form fields:
 *   file        — the page PNG (required)
 *   moduleId    — target Module (required)
 *   pageNumber  — 1-based page number in the PDF (required)
 *   width       — natural image width in px (optional, for aspect ratio)
 *   height      — natural image height in px (optional)
 */
const MAX_BYTES = 20 * 1024 * 1024

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const parts = await readMultipartFormData(event)
  if (!parts?.length) throw createError({ statusCode: 400, message: 'Пустой запрос' })

  const field = (name: string) =>
    parts.find(p => p.name === name && !p.filename)?.data.toString('utf-8').trim()

  const filePart = parts.find(p => p.name === 'file' && p.filename)
  if (!filePart) throw createError({ statusCode: 400, message: 'Изображение страницы не передано' })
  if ((filePart.type ?? '') !== 'image/png') {
    throw createError({ statusCode: 400, message: 'Ожидается PNG' })
  }
  if (filePart.data.length > MAX_BYTES) {
    throw createError({ statusCode: 413, message: 'Страница больше 20 МБ' })
  }

  const moduleId = field('moduleId') ?? ''
  const pageNumber = Number(field('pageNumber'))
  if (!moduleId) throw createError({ statusCode: 400, message: 'moduleId обязателен' })
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    throw createError({ statusCode: 400, message: 'Некорректный pageNumber' })
  }
  const imageWidth = Math.max(0, Math.round(Number(field('width')) || 0))
  const imageHeight = Math.max(0, Math.round(Number(field('height')) || 0))

  const supabase = useServerSupabase(event)

  // Overwrite on re-render so a page can be regenerated cleanly.
  const path = `pages/${moduleId}/${pageNumber}.png`
  const { error: upErr } = await supabase.storage
    .from('books')
    .upload(path, filePart.data, { contentType: 'image/png', upsert: true })
  if (upErr) throw createError({ statusCode: 500, message: `Загрузка не удалась: ${upErr.message}` })

  const { data: urlData } = supabase.storage.from('books').getPublicUrl(path)
  const imageUrl = urlData.publicUrl

  const { data: page, error: pageErr } = await supabase
    .from('BookPage')
    .upsert(
      { moduleId, pageNumber, imageUrl, imageWidth, imageHeight, updatedAt: new Date().toISOString() },
      { onConflict: 'moduleId,pageNumber' }
    )
    .select('id')
    .single()
  if (pageErr || !page) {
    throw createError({ statusCode: 500, message: pageErr?.message ?? 'Не удалось сохранить страницу' })
  }

  // Keep Module.pageCount in sync with how many pages exist so far.
  const { count } = await supabase
    .from('BookPage')
    .select('id', { count: 'exact', head: true })
    .eq('moduleId', moduleId)
  if (typeof count === 'number') {
    await supabase.from('Module').update({ pageCount: count }).eq('id', moduleId)
  }

  return { pageId: page.id, imageUrl, pageNumber }
})
