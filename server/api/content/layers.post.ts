import { z } from 'zod'

const LAYER_TYPES = [
  'HOOK', 'DIAGNOSTIC', 'INTUITION', 'EXPLANATION', 'FORMALIZATION',
  'WALKTHROUGH', 'TRAINER', 'SCENARIO', 'TRAPS', 'TEACH_BACK', 'MASTERY_CHECK'
] as const

const schema = z.object({
  lessonId: z.string().uuid(),
  layerType: z.enum(LAYER_TYPES),
  title: z.string().min(1).max(200),
  titleKz: z.string().max(200).optional().nullable(),
  subtitle: z.string().max(500).optional().nullable(),
  subtitleKz: z.string().max(500).optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
  accentColor: z.string().max(50).optional().nullable(),
  estimatedMinutes: z.number().int().min(1).optional(),
  xpReward: z.number().int().min(0).optional(),
  orderIndex: z.number().int().min(0).optional(),
  content: z.record(z.string(), z.unknown()).optional().nullable(),
  completionCriteria: z.record(z.string(), z.unknown()).optional().nullable()
})

/**
 * POST /api/content/layers
 * Create a CapsuleLayer. Admin only.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const body = schema.parse(await readBody(event))
  const supabase = useServerSupabase(event)

  if (body.orderIndex === undefined) {
    const { count } = await supabase
      .from('CapsuleLayer')
      .select('id', { count: 'exact', head: true })
      .eq('lessonId', body.lessonId)
    body.orderIndex = count ?? 0
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insertPayload: any = {
    lessonId: body.lessonId,
    layerType: body.layerType,
    title: body.title,
    titleKz: body.titleKz ?? null,
    subtitle: body.subtitle ?? null,
    subtitleKz: body.subtitleKz ?? null,
    icon: body.icon ?? null,
    accentColor: body.accentColor ?? null,
    estimatedMinutes: body.estimatedMinutes ?? 3,
    xpReward: body.xpReward ?? 20,
    orderIndex: body.orderIndex,
    content: body.content ?? {},
    completionCriteria: body.completionCriteria ?? null
  }
  const { data, error } = await supabase
    .from('CapsuleLayer')
    .insert(insertPayload)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
