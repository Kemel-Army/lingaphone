import { z } from 'zod'

const schema = z.object({
  title: z.string().trim().min(1),
  level: z.enum(['A1', 'A2', 'B1', 'B2']),
  description: z.string().trim().max(2000).optional(),
  coverUrl: z.string().trim().url().optional(),
  isPublished: z.boolean().optional(),
  modules: z.array(z.object({
    title: z.string().trim().min(1),
    order: z.number().int().min(1).optional(),
    pdfUrl: z.string().trim().min(1).optional()
  })).optional()
})

/**
 * POST /api/admin/books  (ТЗ §2.1: ADMIN загружает книги/модули)
 * Creates a Book and its Modules. ADMIN only. Service role bypasses RLS.
 * The PDF file itself is uploaded separately (to /public/books or the
 * `books` storage bucket); pass its URL/path as module.pdfUrl.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const body = schema.parse(await readBody(event))
  const supabase = useServerSupabase(event)

  const { data: book, error: bookErr } = await supabase
    .from('Book')
    .insert({
      title: body.title,
      level: body.level,
      description: body.description ?? null,
      coverUrl: body.coverUrl ?? null,
      isPublished: body.isPublished ?? false
    })
    .select('id')
    .single()

  if (bookErr || !book) {
    throw createError({ statusCode: 500, message: bookErr?.message ?? 'Ошибка создания книги' })
  }

  if (body.modules?.length) {
    const rows = body.modules.map((m, i) => ({
      bookId: book.id,
      title: m.title,
      order: m.order ?? i + 1,
      pdfUrl: m.pdfUrl ?? null
    }))
    const { error: modErr } = await supabase.from('Module').insert(rows)
    if (modErr) throw createError({ statusCode: 500, message: modErr.message })
  }

  return { id: book.id }
})
