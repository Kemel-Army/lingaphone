/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Scheduled task: Early Warning System.
 * Runs periodically to detect at-risk students and create notifications.
 *
 * In the tutor-less platform we notify the student and linked parents only:
 *  1. Inactivity (no Progress events for > 3 days) → student + parent
 *  2. Streak about to expire → student
 *  3. Mastery drop (≥ 3 weak topics in any StudentModel) → parent
 *
 * Run via Supabase pg_cron, Nitro cron, or manual GET /api/early-warning/check.
 */

const RULES = {
  INACTIVITY_DAYS: 3
}

export default defineTask({
  meta: {
    name: 'early-warning',
    description: 'Detect at-risk students and trigger notifications'
  },
  async run() {
    console.log('[early-warning] Running early warning check...')

    const supabase = useServiceRoleSupabase()
    const now = new Date()
    const notifications: { userId: string, type: string, title: string, message: string }[] = []

    const { data: students } = await supabase
      .from('Student')
      .select('id, userId, User(name, surname, email)')

    if (!students?.length) {
      return { result: 'No students found' }
    }

    for (const student of students as any[]) {
      const studentName = `${student.User?.name ?? ''} ${student.User?.surname ?? ''}`.trim()

      // Helper: get parent userIds linked to this student.
      const fetchParentUserIds = async (): Promise<string[]> => {
        const { data: parentLinks } = await supabase
          .from('ParentToStudent')
          .select('parentId, Parent(userId)')
          .eq('studentId', student.id)
        return ((parentLinks ?? []) as any[])
          .map(l => l.Parent?.userId)
          .filter(Boolean) as string[]
      }

      // 1. Inactivity check
      const { data: lastProgress } = await supabase
        .from('Progress')
        .select('createdAt')
        .eq('studentId', student.id)
        .order('createdAt', { ascending: false })
        .limit(1)
        .single()

      if (lastProgress) {
        const daysSince = Math.floor(
          (now.getTime() - new Date((lastProgress as any).createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSince >= RULES.INACTIVITY_DAYS) {
          notifications.push({
            userId: student.userId,
            type: 'EARLY_WARNING',
            title: 'Пора вернуться к учёбе!',
            message: `Вы не занимались ${daysSince} дней. Не теряйте прогресс!`
          })
          const parentUserIds = await fetchParentUserIds()
          for (const userId of parentUserIds) {
            notifications.push({
              userId,
              type: 'EARLY_WARNING',
              title: `${studentName} не занимается`,
              message: `${studentName} не проявлял активности ${daysSince} дней`
            })
          }
        }
      }

      // 2. Streak risk
      const { data: gp } = await supabase
        .from('StudentGameProfile')
        .select('currentStreak, lastActiveDate')
        .eq('studentId', student.id)
        .single()

      if (gp) {
        const profile = gp as any
        if (profile.currentStreak > 0 && profile.lastActiveDate) {
          const daysSince = Math.floor(
            (now.getTime() - new Date(profile.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
          )
          if (daysSince >= 1 && daysSince <= 2) {
            notifications.push({
              userId: student.userId,
              type: 'EARLY_WARNING',
              title: 'Streak под угрозой!',
              message: `Ваш streak ${profile.currentStreak} дней может прерваться. Позанимайтесь сегодня!`
            })
          }
        }
      }

      // 3. Mastery drop → notify parent
      const { data: studentModels } = await supabase
        .from('StudentModel')
        .select('knowledgeMap')
        .eq('studentId', student.id)

      if (studentModels?.length) {
        for (const sm of studentModels as any[]) {
          const km = sm.knowledgeMap as Record<string, number> | null
          if (km) {
            const weakTopics = Object.entries(km).filter(([_, v]) => v < 40)
            if (weakTopics.length >= 3) {
              const parentUserIds = await fetchParentUserIds()
              for (const userId of parentUserIds) {
                notifications.push({
                  userId,
                  type: 'EARLY_WARNING',
                  title: `Слабые темы: ${studentName}`,
                  message: `${studentName} имеет ${weakTopics.length} тем с уровнем <40%`
                })
              }
              break
            }
          }
        }
      }
    }

    // Batch-insert notifications (deduplicate within 48h window)
    const deduplicationHours = 48
    const deduplicationCutoff = new Date(now.getTime() - deduplicationHours * 60 * 60 * 1000).toISOString()

    const allUserIds = [...new Set(notifications.map(n => n.userId))]
    const { data: recentNotifications } = await supabase
      .from('Notification')
      .select('userId, title')
      .eq('type', 'EARLY_WARNING')
      .in('userId', allUserIds)
      .gte('createdAt', deduplicationCutoff)

    const recentKeys = new Set(
      (recentNotifications ?? []).map((n: any) => `${n.userId}:${n.title}`)
    )

    const seen = new Set<string>()
    const uniqueNotifications = notifications.filter((n) => {
      const key = `${n.userId}:${n.title}`
      if (seen.has(key) || recentKeys.has(key)) return false
      seen.add(key)
      return true
    })

    if (uniqueNotifications.length > 0) {
      const batchSize = 100
      for (let i = 0; i < uniqueNotifications.length; i += batchSize) {
        const batch = uniqueNotifications.slice(i, i + batchSize).map(n => ({
          userId: n.userId,
          type: n.type,
          title: n.title,
          body: n.message,
          isRead: false
        }))
        await supabase.from('Notification').insert(batch)
      }
    }

    console.log(`[early-warning] Created ${uniqueNotifications.length} notifications`)
    return { result: `Created ${uniqueNotifications.length} notifications for ${students.length} students` }
  }
})

/**
 * Create a Supabase service-role client for server tasks.
 */
function useServiceRoleSupabase() {
  const config = useRuntimeConfig()
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js') as { createClient: (url: string, key: string, opts?: object) => any }
  return createClient(
    config.public.supabase?.url ?? (config as any).supabaseUrl ?? '',
    (config as any).supabaseServiceKey ?? (config as any).supabase?.serviceKey ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
