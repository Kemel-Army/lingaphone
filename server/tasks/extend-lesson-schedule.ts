/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Weekly scheduled task: top up every non-archived Group's Lesson rows to
 * keep a rolling DEFAULT_WEEKS_AHEAD-week horizon.
 *
 * Why this exists: Lesson rows were only ever generated once, at group
 * creation time (server/api/admin/groups.post.ts), for a fixed 12-week
 * window. Once that window passed with no further manual "Добавить урок"
 * activity, every group's future lessons ran out silently — which is why
 * "Онлайн-уроки" (student/online, teacher/online) would show empty for any
 * group older than ~12 weeks. This task re-runs the same generation weekly
 * so the horizon never runs dry.
 */
import { generateUpcomingLessons } from '../utils/lessonGeneration'

export default defineTask({
  meta: {
    name: 'extend-lesson-schedule',
    description: 'Top up recurring Lesson rows for every active group'
  },
  async run() {
    const supabase = taskServiceRoleClient()

    const { data: groups } = await supabase
      .from('Group')
      .select('id, schedule')
      .is('archivedAt', null)

    let totalCreated = 0
    for (const group of (groups ?? []) as { id: string, schedule: any }[]) {
      try {
        const { created } = await generateUpcomingLessons(supabase, group.id, group.schedule)
        totalCreated += created
      } catch (e) {
        console.error(`[extend-lesson-schedule] group ${group.id}:`, (e as Error).message)
      }
    }

    return { result: `extend-lesson-schedule: created ${totalCreated} lessons across ${groups?.length ?? 0} groups` }
  }
})
