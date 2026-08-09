/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Shared lesson-generation logic — expands a Group's weekly `schedule` jsonb
 * pattern into concrete `Lesson` rows for a rolling horizon.
 *
 * Used by:
 *  - server/api/admin/groups.post.ts (initial fill on group creation)
 *  - server/tasks/extend-lesson-schedule.ts (weekly top-up so the horizon
 *    never runs dry — see that file for why this exists: without it,
 *    "Онлайн-уроки" goes empty ~WEEKS_AHEAD weeks after a group is created)
 */

export const DEFAULT_WEEKS_AHEAD = 12

const RU_WEEKDAY: Record<string, number> = { Вс: 0, Пн: 1, Вт: 2, Ср: 3, Чт: 4, Пт: 5, Сб: 6 }

interface Slot { weekday: number, time: string, durationMin: number }

/**
 * Normalize the schedule jsonb into per-weekday slots. Supports the current
 * shape ({ slots: [{ weekday, time, durationMin }] }, where each day can have
 * its own time) and the legacy shape ({ days: ['Пн'], time, durationMin }).
 */
export const parseScheduleSlots = (schedule: any): Slot[] => {
  const fallbackDuration = Number(schedule?.durationMin) > 0 ? Number(schedule.durationMin) : 60

  if (Array.isArray(schedule?.slots)) {
    return (schedule.slots as unknown[])
      .map((s) => {
        const o = s as { weekday?: number, time?: string, durationMin?: number }
        if (typeof o?.weekday !== 'number' || !o?.time) return null
        return { weekday: o.weekday, time: o.time, durationMin: Number(o.durationMin) > 0 ? Number(o.durationMin) : fallbackDuration }
      })
      .filter((s): s is Slot => !!s)
  }

  // Legacy: shared time across selected days.
  const time: string = typeof schedule?.time === 'string' ? schedule.time : ''
  const rawDays: unknown[] = Array.isArray(schedule?.days) ? schedule.days : []
  if (!time || !rawDays.length) return []
  return rawDays
    .map((d) => {
      const label = typeof d === 'string' ? d : ((d as { value?: string, label?: string })?.value ?? (d as { label?: string })?.label ?? '')
      const weekday = RU_WEEKDAY[label]
      return weekday === undefined ? null : { weekday, time, durationMin: fallbackDuration }
    })
    .filter((s): s is Slot => !!s)
}

/**
 * Turn weekly slots into concrete Lesson rows for the next `weeksAhead` weeks,
 * starting from `fromDate` (defaults to today). Times are pinned to the
 * Kazakhstan offset (+05:00) so they read the same regardless of where the
 * server runs.
 */
export const buildLessonRows = (
  groupId: string,
  schedule: any,
  weeksAhead: number = DEFAULT_WEEKS_AHEAD,
  fromDate: Date = new Date()
): Array<{ groupId: string, startsAt: string, durationMin: number, status: 'SCHEDULED' }> => {
  const slots = parseScheduleSlots(schedule)
  if (!slots.length) return []

  const byWeekday = new Map<number, Slot>()
  for (const s of slots) byWeekday.set(s.weekday, s)

  const rows: Array<{ groupId: string, startsAt: string, durationMin: number, status: 'SCHEDULED' }> = []
  const cursor = new Date(fromDate)
  cursor.setHours(0, 0, 0, 0)
  for (let i = 0; i < weeksAhead * 7; i++) {
    const slot = byWeekday.get(cursor.getDay())
    if (slot) {
      const y = cursor.getFullYear()
      const m = String(cursor.getMonth() + 1).padStart(2, '0')
      const day = String(cursor.getDate()).padStart(2, '0')
      rows.push({
        groupId,
        startsAt: `${y}-${m}-${day}T${slot.time}:00+05:00`,
        durationMin: slot.durationMin,
        status: 'SCHEDULED'
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return rows
}

/**
 * Idempotently top up a group's Lesson rows to cover a rolling `weeksAhead`
 * horizon from today. Skips any slot that already has a Lesson at that exact
 * instant (compares by parsed time, not raw string — Postgres round-trips
 * timestamptz through a different string representation than we generate).
 */
export const generateUpcomingLessons = async (
  supabase: any,
  groupId: string,
  schedule: any,
  weeksAhead: number = DEFAULT_WEEKS_AHEAD
): Promise<{ created: number }> => {
  const rows = buildLessonRows(groupId, schedule, weeksAhead)
  if (!rows.length) return { created: 0 }

  const todayKey = new Date().toISOString().slice(0, 10)
  const horizonEnd = new Date(Date.now() + (weeksAhead + 1) * 7 * 86400_000).toISOString()

  const { data: existing } = await supabase
    .from('Lesson')
    .select('startsAt')
    .eq('groupId', groupId)
    .gte('startsAt', todayKey)
    .lte('startsAt', horizonEnd)

  const existingTimes = new Set(((existing ?? []) as { startsAt: string }[]).map(r => new Date(r.startsAt).getTime()))
  const newRows = rows.filter(r => !existingTimes.has(new Date(r.startsAt).getTime()))
  if (!newRows.length) return { created: 0 }

  const { error } = await supabase.from('Lesson').insert(newRows)
  if (error) throw error
  return { created: newRows.length }
}
