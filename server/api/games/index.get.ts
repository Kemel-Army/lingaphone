import { z } from 'zod'

const querySchema = z.object({
  moduleId: z.string().uuid().optional(),
  level: z.enum(['A1', 'A2', 'B1', 'B2']).optional()
}).refine(v => v.moduleId || v.level, { message: 'moduleId или level обязателен' })

/**
 * GET /api/games?moduleId={id}  (ТЗ §5.3)
 * Returns games for a module (or level), including the raw `config` JSON
 * that the frontend game component renders directly.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const q = querySchema.parse(getQuery(event))
  const supabase = useServerSupabase(event)

  let query = supabase.from('Game').select('*').order('createdAt')
  if (q.moduleId) query = query.eq('moduleId', q.moduleId)
  if (q.level) query = query.eq('level', q.level)

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
