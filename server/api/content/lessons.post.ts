import { z } from 'zod'

const schema = z.object({
  pathTopicId: z.string().uuid(),
  title: z.string().min(1).max(200),
  titleKz: z.string().max(200).optional().nullable(),
  subtitle: z.string().max(500).optional().nullable(),
  subtitleKz: z.string().max(500).optional().nullable(),
  orderIndex: z.number().int().min(0).optional(),
  durationMinutes: z.number().int().min(1).optional(),
  xpReward: z.number().int().min(0).optional(),
  masteryThreshold: z.number().min(0).max(100).optional(),
  difficulty: z.enum(['LIGHT', 'STANDARD', 'DEEP']).optional()
})

/**
 * POST /api/content/lessons
 * Create a PathLesson. Admin only.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const body = schema.parse(await readBody(event))
  const supabase = useServerSupabase(event)

  if (body.orderIndex === undefined) {
    const { count } = await supabase
      .from('PathLesson')
      .select('id', { count: 'exact', head: true })
      .eq('pathTopicId', body.pathTopicId)
    body.orderIndex = count ?? 0
  }

  const { data, error } = await supabase
    .from('PathLesson')
    .insert({
      pathTopicId: body.pathTopicId,
      title: body.title,
      titleKz: body.titleKz ?? null,
      subtitle: body.subtitle ?? null,
      subtitleKz: body.subtitleKz ?? null,
      orderIndex: body.orderIndex,
      durationMinutes: body.durationMinutes ?? 25,
      xpReward: body.xpReward ?? 200,
      masteryThreshold: body.masteryThreshold ?? 80,
      difficulty: body.difficulty ?? 'STANDARD'
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
