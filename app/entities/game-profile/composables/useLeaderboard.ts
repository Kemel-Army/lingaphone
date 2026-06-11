import type { LeaderEntry as ServerLeaderEntry } from '~/server/api/leaderboard/index.get'

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
