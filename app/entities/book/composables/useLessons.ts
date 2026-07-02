import type {
  LessonUnit,
  LessonExercise,
  LessonUnitWithExercises,
  LessonUnitSummary,
  LessonAttempt
} from '../model/types'

/**
 * Reads for the native lesson player (student). Exercise rows never include the
 * answer key (service-role table), so `select` here is safe. Checking + writes
 * go through `features/lesson-player` → `/api/book/check-exercise`.
 */
export const useLessons = () => {
  const supabase = useTypedSupabaseClient()

  /** Units of a module (for the unit-list page), with exercise counts. */
  const fetchModuleUnits = async (moduleId: string): Promise<LessonUnitSummary[]> => {
    const { data, error } = await supabase
      .from('LessonUnit')
      .select('id, title, subtitle, orderIndex, LessonExercise ( count )')
      .eq('moduleId', moduleId)
      .order('orderIndex')
    if (error) throw error

    return (data ?? []).map((row) => {
      const u = row as unknown as LessonUnitSummary & { LessonExercise: { count: number }[] | null }
      return {
        id: u.id,
        title: u.title,
        subtitle: u.subtitle,
        orderIndex: u.orderIndex,
        exerciseCount: u.LessonExercise?.[0]?.count ?? 0
      }
    })
  }

  /** One unit with its exercises (answer-free), sorted by orderIndex. */
  const fetchUnit = async (unitId: string): Promise<LessonUnitWithExercises | null> => {
    const { data, error } = await supabase
      .from('LessonUnit')
      .select(
        'id, moduleId, title, subtitle, orderIndex, intro,'
        + ' LessonExercise ( id, unitId, orderIndex, type, instruction, content, xp )'
      )
      .eq('id', unitId)
      .maybeSingle()
    if (error) throw error
    if (!data) return null

    const u = data as unknown as LessonUnit & { LessonExercise: LessonExercise[] | null }
    const exercises = [...(u.LessonExercise ?? [])].sort((a, b) => a.orderIndex - b.orderIndex)
    return { ...u, exercises }
  }

  /** The current student's attempts across a unit, keyed by exerciseId. */
  const fetchUnitAttempts = async (exerciseIds: string[]): Promise<Record<string, LessonAttempt>> => {
    if (!exerciseIds.length) return {}
    const { data, error } = await supabase
      .from('LessonAttempt')
      .select('id, exerciseId, response, isCorrect, score')
      .in('exerciseId', exerciseIds)
    if (error) throw error

    const map: Record<string, LessonAttempt> = {}
    for (const row of data ?? []) {
      const a = row as unknown as LessonAttempt
      map[a.exerciseId] = a
    }
    return map
  }

  return { fetchModuleUnits, fetchUnit, fetchUnitAttempts }
}
