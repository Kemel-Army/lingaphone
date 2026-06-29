// Mirrors the shape returned by GET /api/leaderboard. The endpoint type cannot
// be imported directly — `~/server/*` is outside the Nuxt app srcDir alias.
export interface ServerLeaderEntry {
  rank: number
  studentId: string
  xp: number
  level: number
  streak: number
  name: string
  surname: string
  avatarUrl: string | null
}

export type LeaderboardPeriod = 'school' | 'week' | 'month'

export interface LeaderEntry extends ServerLeaderEntry {
  isCurrentUser: boolean
}

export const useLeaderboard = () => {
  const user = useSupabaseUser()

  const fetchLeaderboard = async (
    period: LeaderboardPeriod = 'school',
    limit = 50
  ): Promise<LeaderEntry[]> => {
    const data = await $fetch<ServerLeaderEntry[]>('/api/leaderboard', {
      query: { period, limit }
    })
    const currentId = user.value?.sub
    return data.map(entry => ({
      ...entry,
      isCurrentUser: entry.studentId === currentId
    }))
  }

  return { fetchLeaderboard }
}
