import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(200),
  nameKz: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  descriptionKz: z.string().max(1000).optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  gradeLevel: z.number().int().min(1).max(6),
  subjectId: z.string().uuid(),
  orderIndex: z.number().int().min(0).optional(),
  totalXp: z.number().int().min(0).optional(),
  durationMinutes: z.number().int().min(1).optional()
})

/**
 * POST /api/content/topics
 * Create a PathTopic. Admin only.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const body = schema.parse(await readBody(event))
  const supabase = useServerSupabase(event)

  // Auto-assign orderIndex if not provided
  if (body.orderIndex === undefined) {
    const { count } = await supabase
      .from('PathTopic')
      .select('id', { count: 'exact', head: true })
      .eq('gradeLevel', body.gradeLevel)
    body.orderIndex = (count ?? 0)
  }

  const { data, error } = await supabase
    .from('PathTopic')
    .insert({
      name: body.name,
      nameKz: body.nameKz ?? null,
      description: body.description ?? null,
      descriptionKz: body.descriptionKz ?? null,
      icon: body.icon ?? '📚',
      color: body.color ?? '#16A34A',
      gradeLevel: body.gradeLevel,
      subjectId: body.subjectId,
      orderIndex: body.orderIndex,
      totalXp: body.totalXp ?? 200,
      durationMinutes: body.durationMinutes ?? 30
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
