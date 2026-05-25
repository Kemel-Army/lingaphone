/**
 * useUserStats — high-level counters for the admin users page hero.
 * Single round-trip: pulls all User rows with role+status fields and counts
 * client-side. For a 10k+ user base this should move to a Postgres RPC.
 */

export interface UserStats {
  total: number
  active: number
  banned: number
  byRole: {
    STUDENT: number
    PARENT: number
    ADMIN: number
  }
  newThisWeek: number
}

export const useUserStats = () => {
  const supabase = useTypedSupabaseClient()

  const fetchUserStats = async (): Promise<UserStats> => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('User')
      .select('id, role, status, createdAt')
      .limit(10000)

    if (error) {
      return {
        total: 0,
        active: 0,
        banned: 0,
        byRole: { STUDENT: 0, PARENT: 0, ADMIN: 0 },
        newThisWeek: 0
      }
    }

    const rows = (data ?? []) as Array<{ role: string, status: string | null, createdAt: string }>
    const byRole = { STUDENT: 0, PARENT: 0, ADMIN: 0 } as Record<string, number>
    let active = 0
    let banned = 0
    let newThisWeek = 0

    for (const r of rows) {
      if (r.role in byRole) byRole[r.role] = (byRole[r.role] ?? 0) + 1
      if (r.status === 'BANNED') banned++
      else active++
      if (r.createdAt >= weekAgo) newThisWeek++
    }

    return {
      total: rows.length,
      active,
      banned,
      byRole: {
        STUDENT: byRole.STUDENT ?? 0,
        PARENT: byRole.PARENT ?? 0,
        ADMIN: byRole.ADMIN ?? 0
      },
      newThisWeek
    }
  }

  return { fetchUserStats }
}
