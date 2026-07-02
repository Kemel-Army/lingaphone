/**
 * POST /api/admin/lessons/upload-image  (ADMIN, multipart) — upload a lesson
 * illustration to the public `books` bucket (service role; the bucket is
 * write-restricted to server). Returns the public URL to store in exercise
 * content. The admin uploads THEIR OWN / licensed images here.
 *
 * Form field: file (image, ≤ 10 MB)
 */
const MAX = 10 * 1024 * 1024
const OK_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const parts = await readMultipartFormData(event)
  const file = parts?.find(p => p.name === 'file' && p.filename)
  if (!file) throw createError({ statusCode: 400, message: 'Файл не передан' })
  if (!OK_MIME.includes(file.type ?? '')) throw createError({ statusCode: 400, message: 'Только изображения (png/jpeg/webp/gif)' })
  if (file.data.length > MAX) throw createError({ statusCode: 413, message: 'Изображение больше 10 МБ' })

  const supabase = useServerSupabase(event)
  const safe = (file.filename ?? 'img').replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `lesson-images/${Date.now()}-${safe}`
  const { error } = await supabase.storage.from('books').upload(path, file.data, { contentType: file.type, upsert: true })
  if (error) throw createError({ statusCode: 500, message: `Загрузка не удалась: ${error.message}` })

  const { data } = supabase.storage.from('books').getPublicUrl(path)
  return { url: data.publicUrl }
})
