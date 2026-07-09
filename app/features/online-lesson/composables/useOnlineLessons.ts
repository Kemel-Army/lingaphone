import type { Database } from '~/shared/types/database.types'

export interface OnlineLesson {
  id: string
  groupId: string
  groupName: string
  topic: string
  startsAt: string
  durationMin: number
  status: Database['public']['Enums']['LessonStatus']
  isLive: boolean
  isPast: boolean
}

/** Детерминированное имя Jitsi-комнаты по уроку (доступ гейтит RLS на Lesson). */
export const lessonRoomName = (lessonId: string) => `lingaphone-${lessonId}`

/**
 * Онлайн-уроки (ТЗ разд. 3.3). Список уроков, доступных текущему
 * пользователю (RLS на Lesson сам ограничивает: свои группы). Присоединиться
 * можно за 10 минут до начала и до конца урока.
 */
export const useOnlineLessons = () => {
  const supabase = useSupabaseClient<Database>()

  const fetchLessons = async (): Promise<OnlineLesson[]> => {
    const { data, error } = await supabase
      .from('Lesson')
      .select('id, groupId, topic, startsAt, durationMin, status, group:Group(name)')
      .order('startsAt', { ascending: true })
    if (error) throw error

    const now = Date.now()
    type Row = { id: string, groupId: string, topic: string, startsAt: string, durationMin: number, status: OnlineLesson['status'], group: { name: string } | null }
    return ((data ?? []) as unknown as Row[]).map((l) => {
      const start = new Date(l.startsAt).getTime()
      const end = start + (l.durationMin ?? 60) * 60000
      return {
        id: l.id,
        groupId: l.groupId,
        groupName: l.group?.name ?? '',
        topic: l.topic,
        startsAt: l.startsAt,
        durationMin: l.durationMin,
        status: l.status,
        isLive: now >= start - 10 * 60000 && now <= end,
        isPast: now > end
      }
    })
  }

  /** Один урок для комнаты. null = нет доступа (RLS) или не найден. */
  const fetchLesson = async (id: string): Promise<{ id: string, topic: string, groupName: string } | null> => {
    const { data, error } = await supabase
      .from('Lesson')
      .select('id, topic, group:Group(name)')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    const g = (data as unknown as { group: { name: string } | null }).group
    return { id: data.id, topic: data.topic, groupName: g?.name ?? '' }
  }

  return { fetchLessons, fetchLesson, lessonRoomName }
}
