import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(200).optional(),
  nameKz: z.string().max(200).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  descriptionKz: z.string().max(1000).nullable().optional(),
  icon: z.string().max(100).nullable().optional(),
  color: z.string().max(50).nullable().optional(),
  gradeLevel: z.number().int().min(1).max(6).optional(),
  subjectId: z.string().uuid().optional(),
  orderIndex: z.number().int().min(0).optional(),
  totalXp: z.number().int().min(0).optional(),
  durationMinutes: z.number().int().min(1).optional()
})

/**
 * PATCH /api/content/topics/[id]
 * Update a PathTopic. Admin only.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const body = schema.parse(await readBody(event))
  const supabase = useServerSupabase(event)

  const { data, error } = await supabase
    .from('PathTopic')
    .update({ ...body, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
