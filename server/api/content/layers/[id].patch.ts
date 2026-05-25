import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1).max(200).optional(),
  titleKz: z.string().max(200).nullable().optional(),
  subtitle: z.string().max(500).nullable().optional(),
  subtitleKz: z.string().max(500).nullable().optional(),
  icon: z.string().max(100).nullable().optional(),
  accentColor: z.string().max(50).nullable().optional(),
  estimatedMinutes: z.number().int().min(1).optional(),
  xpReward: z.number().int().min(0).optional(),
  orderIndex: z.number().int().min(0).optional(),
  content: z.record(z.string(), z.unknown()).nullable().optional(),
  completionCriteria: z.record(z.string(), z.unknown()).nullable().optional()
})

/**
 * PATCH /api/content/layers/[id]
 * Update a CapsuleLayer (including content JSONB). Admin only.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const body = schema.parse(await readBody(event))
  const supabase = useServerSupabase(event)

  const { data, error } = await supabase
    .from('CapsuleLayer')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ ...body, updatedAt: new Date().toISOString() } as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
