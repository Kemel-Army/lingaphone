/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'

const querySchema = z.object({
  gradeLevel: z.coerce.number().int().min(1).max(6).optional(),
  subjectId: z.string().uuid().optional()
})

/**
 * GET /api/content/topics
 * List PathTopics with lesson counts. Admin only.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const q = querySchema.parse(getQuery(event))
  const supabase = useServerSupabase(event)

  let query = supabase
    .from('PathTopic')
    .select('*, PathLesson(id)')
    .order('gradeLevel', { ascending: true })
    .order('orderIndex', { ascending: true })

  if (q.gradeLevel) query = query.eq('gradeLevel', q.gradeLevel)
  if (q.subjectId) query = query.eq('subjectId', q.subjectId)

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, message: error.message })

  return (data ?? []).map((t: any) => ({
    ...t,
    lessonsCount: Array.isArray(t.PathLesson) ? t.PathLesson.length : 0,
    PathLesson: undefined
  }))
})
