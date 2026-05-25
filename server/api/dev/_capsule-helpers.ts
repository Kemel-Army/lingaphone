// @supabase/supabase-js приходит транзитивно через @nuxtjs/supabase,
// но не в package.json как прямая зависимость, поэтому импорт типа из
// строкового модуля валит TS. Используем `any` — этот файл — server-side
// dev-сидеры, типобезопасность в нём не критична, а реальный клиент
// возвращает `serverSupabaseServiceRole` (типизирован уже в его сигнатуре).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any

/**
 * Shared helpers for grade-2 capsule seeders.
 *
 * Every grade-2 topic has its own POST /api/dev/seed-grade2-<topic>
 * endpoint that:
 *   1. locates the Subject (grade=2), PathTopic by name and its lessons
 *   2. wipes existing CapsuleLayer rows for those lessons
 *   3. re-inserts all 11 layers per lesson with rich, themed content
 *
 * Re-running any seeder is idempotent.
 */

export interface ResolvedLessonMap {
  topicId: string
  lessonIds: Record<string, string> // title → id
}

export async function resolveGrade2Topic(
  supabase: SupabaseClient,
  topicName: string
): Promise<ResolvedLessonMap> {
  const { data: subjectRow } = await supabase
    .from('Subject')
    .select('id')
    .eq('grade', 2)
    .single()
  if (!subjectRow) throw createError({ statusCode: 500, message: 'Grade 2 subject missing' })

  const { data: topicRow } = await supabase
    .from('PathTopic')
    .select('id')
    .eq('subjectId', (subjectRow as { id: string }).id)
    .eq('name', topicName)
    .single()
  if (!topicRow) throw createError({ statusCode: 500, message: `Topic "${topicName}" missing — run seed-curriculum first` })

  const topicId = (topicRow as { id: string }).id

  const { data: lessonRows } = await supabase
    .from('PathLesson')
    .select('id, title')
    .eq('pathTopicId', topicId)
    .order('orderIndex')
  if (!lessonRows?.length) throw createError({ statusCode: 500, message: `Topic "${topicName}" has no lessons` })

  const lessonIds: Record<string, string> = {}
  for (const l of lessonRows as { id: string, title: string }[]) lessonIds[l.title] = l.id

  return { topicId, lessonIds }
}

export const ALL_LAYER_TYPES = [
  'HOOK', 'DIAGNOSTIC', 'INTUITION', 'EXPLANATION', 'FORMALIZATION', 'WALKTHROUGH',
  'TRAINER', 'SCENARIO', 'TRAPS', 'TEACH_BACK', 'MASTERY_CHECK'
] as const

export async function wipeLayersForLessons(
  supabase: SupabaseClient,
  lessonIds: string[]
) {
  await supabase
    .from('CapsuleLayer')
    .delete()
    .in('lessonId', lessonIds)
    .in('layerType', ALL_LAYER_TYPES as unknown as string[])
}

export function makeInserter(supabase: SupabaseClient, counter: Record<string, number>) {
  return async (row: Record<string, unknown>) => {
    const { error } = await supabase.from('CapsuleLayer').insert(row as never)
    if (error) throw createError({ statusCode: 500, message: `Layer insert: ${error.message}` })
    const lid = row.lessonId as string
    counter[lid] = (counter[lid] ?? 0) + 1
  }
}

export function ensureNotProduction() {
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 403, message: 'Not allowed in production' })
  }
}
