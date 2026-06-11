import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

type Period = 'school' | 'week' | 'month'

export interface LeaderEntry {
  rank: number
  studentId: string
  xp: number
  level: number
  streak: number
  name: string
  surname: string
  avatarUrl: string | null
}

export default defineEventHandler(async (event): Promise<LeaderEntry[]> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const query = getQuery(event)
  const period = ((query.period as string) ?? 'school') as Period
  const limit = Math.min(Number(query.limit ?? 50), 100)

  const supabase = serverSupabaseServiceRole(event)

  // ── School leaderboard: total XP from StudentGameProfile ──────────────────
  if (period === 'school') {
    const { data, error } = await supabase
      .from('StudentGameProfile')
      .select('studentId, xp, level, currentStreak, Student!inner(User!inner(name, surname, avatarUrl))')
      .order('xp', { ascending: false })
      .limit(limit)

    if (error) throw createError({ statusCode: 500, message: error.message })

    return (data ?? []).map((row, index) => {
      const student = (row as Record<string, unknown>).Student as Record<string, unknown> | null
      const u = student?.User as Record<string, unknown> | null
      return {
        rank: index + 1,
        studentId: row.studentId as string,
        xp: row.xp as number,
        level: row.level as number,
        streak: row.currentStreak as number,
        name: (u?.name as string) ?? '',
        surname: (u?.surname as string) ?? '',
        avatarUrl: (u?.avatarUrl as string | null) ?? null
      }
    })
  }

  // ── Weekly / monthly leaderboard: aggregate XPTransaction ─────────────────
  const days = period === 'week' ? 7 : 30
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data: transactions, error: txError } = await supabase
    .from('XpLog')
    .select('studentId, amount')
    .gte('createdAt', startDate)

  if (txError) throw createError({ statusCode: 500, message: txError.message })
  if (!transactions || transactions.length === 0) return []

  // Aggregate XP per student
  const xpMap = new Map<string, number>()
  for (const t of transactions) {
    if (t.studentId) {
      xpMap.set(t.studentId, (xpMap.get(t.studentId) ?? 0) + (t.amount as number))
    }
  }

  const sorted = [...xpMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)

  const topIds = sorted.map(([id]) => id)
  if (topIds.length === 0) return []

  const { data: profiles, error: profileError } = await supabase
    .from('StudentGameProfile')
    .select('studentId, level, currentStreak, Student!inner(User!inner(name, surname, avatarUrl))')
    .in('studentId', topIds)

  if (profileError) throw createError({ statusCode: 500, message: profileError.message })

  const profileMap = new Map(
    (profiles ?? []).map(p => [p.studentId as string, p])
  )

  return sorted.map(([studentId, xp], index) => {
    const profile = profileMap.get(studentId) as Record<string, unknown> | undefined
    const student = profile?.Student as Record<string, unknown> | null
    const u = student?.User as Record<string, unknown> | null
    return {
      rank: index + 1,
      studentId,
      xp,
      level: (profile?.level as number) ?? 1,
      streak: (profile?.currentStreak as number) ?? 0,
      name: (u?.name as string) ?? '',
      surname: (u?.surname as string) ?? '',
      avatarUrl: (u?.avatarUrl as string | null) ?? null
    }
  })
})
