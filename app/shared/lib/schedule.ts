export interface ScheduleSlot {
  weekday: number
  startTime: string
  durationMin: number
}

// Group.schedule jsonb comes in two historical shapes: the legacy slot array
// ([{ weekday, startTime, durationMin }]) and the admin-form object
// ({ days: [{ label, value }], time }). Normalize to a uniform slot array.
const RU_WEEKDAY: Record<string, number> = {
  Вс: 0, Пн: 1, Вт: 2, Ср: 3, Чт: 4, Пт: 5, Сб: 6
}

export function normalizeSchedule(raw: unknown): ScheduleSlot[] {
  if (Array.isArray(raw)) {
    return raw
      .filter(s => s && typeof s === 'object')
      .map((s: { weekday?: number, startTime?: string, durationMin?: number }) => ({
        weekday: s.weekday ?? 0,
        startTime: s.startTime ?? '',
        durationMin: s.durationMin ?? 60
      }))
  }
  if (raw && typeof raw === 'object') {
    // Current shape: per-day slots, each with its own time.
    const slots = (raw as { slots?: Array<{ weekday?: number, time?: string, startTime?: string, durationMin?: number }> }).slots
    if (Array.isArray(slots)) {
      return slots
        .filter(s => s && typeof s === 'object')
        .map(s => ({
          weekday: s.weekday ?? 0,
          startTime: s.startTime ?? s.time ?? '',
          durationMin: s.durationMin ?? 60
        }))
    }
    // Legacy shape: shared time across days.
    const s = raw as { days?: Array<string | { label?: string, value?: string }>, time?: string, durationMin?: number }
    const time = s.time ?? ''
    return (s.days ?? []).map((d) => {
      const label = typeof d === 'string' ? d : (d.value ?? d.label ?? '')
      return { weekday: RU_WEEKDAY[label] ?? 0, startTime: time, durationMin: s.durationMin ?? 60 }
    })
  }
  return []
}
