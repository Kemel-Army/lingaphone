import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1).max(200).optional(),
  titleKz: z.string().max(200).nullable().optional(),
  subtitle: z.string().max(500).nullable().optional(),
  subtitleKz: z.string().max(500).nullable().optional(),
  orderIndex: z.number().int().min(0).optional(),
  durationMinutes: z.number().int().min(1).optional(),
  xpReward: z.number().int().min(0).optional(),
  masteryThreshold: z.number().min(0).max(100).optional(),
  difficulty: z.enum(['LIGHT', 'STANDARD', 'DEEP']).optional()
})

/**
 * PATCH /api/content/lessons/[id]
 * Update a PathLesson. Admin only.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const body = schema.parse(await readBody(event))
  const supabase = useServerSupabase(event)

  const { data, error } = await supabase
    .from('PathLesson')
    .update({ ...body, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
