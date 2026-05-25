/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * POST /api/gamification/generate-quests
 * Generate daily/weekly quests for a student.
 * Called on login or when quests expire.
 */
export default defineEventHandler(async (event) => {
  const { studentId } = await getCurrentStudent(event)
  const supabase = useServerSupabase(event)
  const now = new Date()

  // 1. Check if student already has active quests for today/this week
  const { data: existingQuests } = await supabase
    .from('StudentQuest')
    .select('id, questId, status, expiresAt, Quest(period)')
    .eq('studentId', studentId)
    .eq('status', 'ACTIVE')
    .gt('expiresAt', now.toISOString())

  const hasActiveDaily = (existingQuests ?? []).some(
    (q: any) => q.Quest?.period === 'DAILY'
  )
  const hasActiveWeekly = (existingQuests ?? []).some(
    (q: any) => q.Quest?.period === 'WEEKLY'
  )

  // 2. Get quest templates
  const { data: templates } = await supabase
    .from('Quest')
    .select('*')
    .eq('isTemplate', true)
    .eq('isActive', true)

  if (!templates?.length) return { assigned: [] }

  const dailyTemplates = templates.filter((t: any) => t.period === 'DAILY')
  const weeklyTemplates = templates.filter((t: any) => t.period === 'WEEKLY')

  const assigned: any[] = []

  // 3. Assign daily quests (3 random)
  if (!hasActiveDaily && dailyTemplates.length > 0) {
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    const shuffled = dailyTemplates.sort(() => Math.random() - 0.5)
    const selectedDaily = shuffled.slice(0, Math.min(3, shuffled.length))

    for (const template of selectedDaily) {
      const t = template as Record<string, any>
      const { data: sq, error } = await supabase
        .from('StudentQuest')
        .insert({
          studentId,
          questId: t.id,
          progress: 0,
          target: t.target,
          status: 'ACTIVE',
          expiresAt: endOfDay.toISOString()
        })
        .select('*, Quest(*)')
        .single()

      if (!error && sq) assigned.push(sq)
    }
  }

  // 4. Assign weekly quests (2 random)
  if (!hasActiveWeekly && weeklyTemplates.length > 0) {
    const endOfWeek = new Date(now)
    const daysUntilSunday = 7 - endOfWeek.getDay()
    endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday)
    endOfWeek.setHours(23, 59, 59, 999)

    const shuffled = weeklyTemplates.sort(() => Math.random() - 0.5)
    const selectedWeekly = shuffled.slice(0, Math.min(2, shuffled.length))

    for (const template of selectedWeekly) {
      const t = template as Record<string, any>
      const { data: sq, error } = await supabase
        .from('StudentQuest')
        .insert({
          studentId,
          questId: t.id,
          progress: 0,
          target: t.target,
          status: 'ACTIVE',
          expiresAt: endOfWeek.toISOString()
        })
        .select('*, Quest(*)')
        .single()

      if (!error && sq) assigned.push(sq)
    }
  }

  // 5. Expire old quests
  await supabase
    .from('StudentQuest')
    .update({ status: 'EXPIRED' })
    .eq('studentId', studentId)
    .eq('status', 'ACTIVE')
    .lt('expiresAt', now.toISOString())

  return { assigned }
})
