import type { CapsuleLayer, PathLesson, PathProgress, PathTopic } from '../model/types'

/**
 * Composable for "Мой путь".
 * Read-side helpers for topics / capsules / layers. Layer-progress mutations
 * live in server routes (/api/capsule/*) so scoring & XP are computed
 * server-side from CapsuleLayer.completionCriteria.
 */
export const useLearningPath = () => {
  const supabase = useTypedSupabaseClient()

  // ────────────── Topics ──────────────

  const fetchPathTopics = async (
    studentId: string | null,
    bookId: string | null = null
  ): Promise<PathTopic[]> => {
    let query = supabase
      .from('PathTopic')
      .select('*, PathLesson(id)')
      .order('orderIndex')

    if (bookId) query = query.eq('bookId', bookId)

    const { data: topics, error } = await query
    if (error) throw error
    if (!topics) return []

    const progressMap: Record<string, PathProgress> = {}
    if (studentId) {
      const { data: progressRows } = await supabase
        .from('PathProgress')
        .select('*')
        .eq('studentId', studentId)
      if (progressRows) {
        for (const p of progressRows as unknown as PathProgress[]) {
          progressMap[p.pathLessonId] = p
        }
      }
    }

    return (topics as unknown as (PathTopic & { PathLesson: { id: string }[] })[]).map((t) => {
      const lessonIds = t.PathLesson?.map(l => l.id) ?? []
      const completedCount = lessonIds.filter(id => progressMap[id]?.masteryAchieved).length
      return {
        ...t,
        lessonsCount: lessonIds.length,
        completedLessonsCount: completedCount,
        progress: lessonIds.length > 0 ? Math.round((completedCount / lessonIds.length) * 100) : 0,
        lessons: undefined,
        PathLesson: undefined
      } as PathTopic
    })
  }

  // ────────────── Single Topic + Lessons ──────────────

  const fetchPathTopic = async (topicId: string, studentId: string | null): Promise<PathTopic | null> => {
    const { data, error } = await supabase
      .from('PathTopic')
      .select('*, PathLesson(*)')
      .eq('id', topicId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    if (!data) return null

    const raw = data as unknown as PathTopic & { PathLesson: PathLesson[] }
    const lessons = (raw.PathLesson ?? []).sort((a, b) => a.orderIndex - b.orderIndex)

    const progressMap: Record<string, PathProgress> = {}
    if (studentId) {
      const lessonIds = lessons.map(l => l.id)
      if (lessonIds.length) {
        const { data: progressRows } = await supabase
          .from('PathProgress')
          .select('*')
          .eq('studentId', studentId)
          .in('pathLessonId', lessonIds)
        if (progressRows) {
          for (const p of progressRows as unknown as PathProgress[]) {
            progressMap[p.pathLessonId] = p
          }
        }
      }
    }

    const lessonsWithProgress = lessons.map(l => ({
      ...l,
      progress: progressMap[l.id] ?? null
    }))

    const completedCount = lessonsWithProgress.filter(l => l.progress?.masteryAchieved).length

    return {
      ...raw,
      lessons: lessonsWithProgress,
      lessonsCount: lessons.length,
      completedLessonsCount: completedCount,
      progress: lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0,
      PathLesson: undefined
    } as PathTopic
  }

  // ────────────── Capsule (lesson) with all layers ──────────────

  const fetchPathLesson = async (
    lessonId: string,
    studentId: string | null
  ): Promise<PathLesson | null> => {
    const { data, error } = await supabase
      .from('PathLesson')
      .select('*, PathTopic(name), CapsuleLayer(*)')
      .eq('id', lessonId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    if (!data) return null

    const raw = data as unknown as PathLesson & {
      PathTopic: { name: string }
      CapsuleLayer: CapsuleLayer[]
    }

    const layers = (raw.CapsuleLayer ?? []).sort((a, b) => a.orderIndex - b.orderIndex)

    let progress: PathProgress | null = null
    let layerProgressMap: Record<string, LayerProgressRow> = {}

    if (studentId) {
      const [{ data: p }, { data: layerRows }] = await Promise.all([
        supabase
          .from('PathProgress')
          .select('*')
          .eq('studentId', studentId)
          .eq('pathLessonId', lessonId)
          .maybeSingle(),
        supabase
          .from('LayerProgress')
          .select('*')
          .eq('studentId', studentId)
          .eq('lessonId', lessonId)
      ])
      if (p) progress = p as unknown as PathProgress
      if (layerRows) {
        layerProgressMap = Object.fromEntries(
          (layerRows as unknown as LayerProgressRow[]).map(r => [r.layerId, r])
        )
      }
    }

    const layersWithProgress = layers.map(l => ({
      ...l,
      progress: (layerProgressMap[l.id] as unknown as CapsuleLayer['progress']) ?? null
    }))

    return {
      ...raw,
      layers: layersWithProgress,
      topicName: raw.PathTopic?.name ?? '',
      progress,
      PathTopic: undefined,
      CapsuleLayer: undefined
    } as unknown as PathLesson
  }

  // ────────────── Overall stats ──────────────

  const computeOverallStats = (topics: PathTopic[]) => {
    const totalLessons = topics.reduce((s, t) => s + (t.lessonsCount ?? 0), 0)
    const completedLessons = topics.reduce((s, t) => s + (t.completedLessonsCount ?? 0), 0)
    const totalXp = topics.reduce((s, t) => s + t.totalXp, 0)
    const topicsRemaining = topics.filter(t => (t.progress ?? 0) < 100).length
    const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    return { totalLessons, completedLessons, totalXp, topicsRemaining, overallProgress }
  }

  // ────────────── Admin overview (topics → lessons → layer counts) ──────────────

  const fetchCapsuleOverview = async (): Promise<Array<{
    id: string
    name: string
    orderIndex: number
    bookId: string | null
    lessons: Array<{ id: string, title: string, orderIndex: number, layerCount: number }>
  }>> => {
    const [{ data: topics }, { data: lessons }, { data: layers }] = await Promise.all([
      supabase.from('PathTopic').select('id, name, orderIndex, bookId').order('orderIndex'),
      supabase.from('PathLesson').select('id, title, pathTopicId, orderIndex'),
      supabase.from('CapsuleLayer').select('lessonId')
    ])

    const counts: Record<string, number> = {}
    for (const l of (layers ?? []) as unknown as { lessonId: string }[]) {
      counts[l.lessonId] = (counts[l.lessonId] ?? 0) + 1
    }

    const lessonRows = (lessons ?? []) as unknown as { id: string, title: string, pathTopicId: string, orderIndex: number }[]

    return ((topics ?? []) as unknown as { id: string, name: string, orderIndex: number, bookId: string | null }[]).map(t => ({
      ...t,
      lessons: lessonRows
        .filter(l => l.pathTopicId === t.id)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(l => ({ id: l.id, title: l.title, orderIndex: l.orderIndex, layerCount: counts[l.id] ?? 0 }))
    }))
  }

  return { fetchPathTopics, fetchPathTopic, fetchPathLesson, computeOverallStats, fetchCapsuleOverview }
}

interface LayerProgressRow { layerId: string, [k: string]: unknown }
