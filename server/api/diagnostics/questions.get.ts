import { z } from 'zod'

const querySchema = z.object({
  subjectId: z.string().uuid(),
  gradeLevel: z.coerce.number().int().min(1).max(6),
  difficulty: z.coerce.number().int().min(1).max(10).optional(),
  count: z.coerce.number().int().min(1).max(50).default(20),
  excludeIds: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse)
  const supabase = useServerSupabase(event)

  const excludeIds = query.excludeIds
    ? query.excludeIds.split(',').filter(Boolean)
    : []

  let qb = supabase
    .from('DiagnosticQuestion')
    .select('id, subjectId, topicName, gradeLevel, difficulty, text, type, options')
    .eq('subjectId', query.subjectId)
    .eq('gradeLevel', query.gradeLevel)
    .eq('isActive', true)

  if (query.difficulty) {
    const minDiff = Math.max(1, query.difficulty - 2)
    const maxDiff = Math.min(10, query.difficulty + 2)
    qb = qb.gte('difficulty', minDiff).lte('difficulty', maxDiff)
  }

  if (excludeIds.length > 0) {
    qb = qb.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  qb = qb.limit(query.count)

  const { data, error } = await qb

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  const allRows = data ?? []
  const filtered = allRows
    .filter((q: Record<string, unknown>) => {
      const opts = q.options as Array<{ text: string }> | null
      if (!opts || opts.length < 4) return false
      const isPlaceholder = opts[0]?.text === 'Вариант A' && opts[1]?.text === 'Вариант B'
      return !isPlaceholder
    })

  const questions = (filtered.length > 0
    ? filtered
    : allRows.filter((q: Record<string, unknown>) => {
        const opts = q.options as Array<{ text: string }> | null
        if (!opts?.length) return false
        const isPlaceholder = opts[0]?.text === 'Вариант A' && opts[1]?.text === 'Вариант B'
        return !isPlaceholder
      })
  ).sort(() => Math.random() - 0.5)

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    questions: questions.map((q: Record<string, any>) => ({
      id: q.id,
      topicId: q.topicName,
      text: q.text,
      difficulty: q.difficulty,
      type: q.type,
      options: stripCorrectness(q.options ?? [])
    }))
  }
})

function stripCorrectness(options: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return options.map((opt) => {
    const { isCorrect: _drop, ...safe } = opt as { isCorrect?: unknown }
    void _drop
    return safe
  })
}
