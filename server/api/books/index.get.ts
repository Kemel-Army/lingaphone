import { z } from 'zod'

const querySchema = z.object({
  level: z.enum(['A1', 'A2', 'B1', 'B2']).optional()
})

/**
 * GET /api/books  (ТЗ §5.2)
 * Authenticated users get published books. Optional ?level filter.
 *
 * ТЗ asks to auto-filter by the student's CEFR level, but there is no such
 * field on the profile in this codebase (User.level is the gamification level).
 * Until one exists, the caller passes ?level explicitly.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const q = querySchema.parse(getQuery(event))
  const supabase = useServerSupabase(event)

  let query = supabase
    .from('Book')
    .select('*, Module(id,title,order,pdfUrl)')
    .eq('isPublished', true)
    .order('level')
    .order('createdAt')

  if (q.level) query = query.eq('level', q.level)

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
