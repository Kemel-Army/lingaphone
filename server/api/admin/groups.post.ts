import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const supabase = serverSupabaseServiceRole(event)

  // Check admin role via JWT claim
  const role = (user as unknown as { user_role?: string }).user_role
    ?? user.user_metadata?.role
  if (role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody(event)
  const { name, level, teacherId, maxStudents, studentIds, schedule } = body

  if (!name?.trim() || !teacherId) {
    throw createError({ statusCode: 400, message: 'name и teacherId обязательны' })
  }

  // How many weeks of lessons to pre-create from the weekly pattern.
  const WEEKS_AHEAD = 12
  const RU_WEEKDAY: Record<string, number> = { Вс: 0, Пн: 1, Вт: 2, Ср: 3, Чт: 4, Пт: 5, Сб: 6 }

  type Slot = { weekday: number, time: string, durationMin: number }

  /**
   * Normalize the schedule jsonb into per-weekday slots. Supports the current
   * shape ({ slots: [{ weekday, time, durationMin }] }, where each day can have
   * its own time) and the legacy shape ({ days: ['Пн'], time, durationMin }).
   */
  const parseSlots = (): Slot[] => {
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
   * Turn weekly slots into concrete Lesson rows for the next WEEKS_AHEAD weeks.
   * Times are pinned to the Kazakhstan offset (+05:00) so they read the same
   * regardless of where the server runs.
   */
  const buildLessons = (groupId: string): Array<{ groupId: string, startsAt: string, durationMin: number, status: 'SCHEDULED' }> => {
    const slots = parseSlots()
    if (!slots.length) return []

    const byWeekday = new Map<number, Slot>()
    for (const s of slots) byWeekday.set(s.weekday, s)

    const rows: Array<{ groupId: string, startsAt: string, durationMin: number, status: 'SCHEDULED' }> = []
    const cursor = new Date()
    cursor.setHours(0, 0, 0, 0)
    for (let i = 0; i < WEEKS_AHEAD * 7; i++) {
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

  // Create the group
  const { data: group, error: groupErr } = await supabase
    .from('Group')
    .insert({
      name: name.trim(),
      level: level ?? 'A1',
      teacherId,
      maxStudents: maxStudents ?? 12,
      schedule: schedule ?? {},
      branchId: null
    })
    .select('id')
    .single()

  if (groupErr || !group) {
    throw createError({ statusCode: 500, message: groupErr?.message ?? 'Ошибка создания группы' })
  }

  // Add students if provided
  if (Array.isArray(studentIds) && studentIds.length > 0) {
    const members = studentIds.map((sid: string) => ({
      groupId: group.id,
      studentId: sid
    }))
    const { error: memberErr } = await supabase
      .from('GroupMember')
      .insert(members)

    if (memberErr) {
      // Non-fatal — group was created, just members failed
      console.error('GroupMember insert error:', memberErr.message)
    }
  }

  // Auto-generate the recurring lessons from the weekly schedule.
  const lessons = buildLessons(group.id)
  if (lessons.length > 0) {
    const { error: lessonErr } = await supabase.from('Lesson').insert(lessons)
    if (lessonErr) {
      // Non-fatal — group exists; the schedule just couldn't be pre-filled.
      console.error('Lesson generation error:', lessonErr.message)
    }
  }

  return { id: group.id, lessonsCreated: lessons.length }
})
