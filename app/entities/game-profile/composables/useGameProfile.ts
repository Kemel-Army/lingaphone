import type { GameProfile, XPTransaction, GemTransaction, Achievement, StudentAchievement, ShopItem, StudentInventory } from '../model/types'
import { LEVEL_XP_THRESHOLDS, type XPActionType } from '~/shared/types/common'

/**
 * Composable for game profile, XP, gems, streak, achievements, shop, leaderboard.
 */
export const useGameProfile = () => {
  const supabase = useTypedSupabaseClient()

  // ────────────────────── Profile ──────────────────────

  const fetchGameProfile = async (studentId: string): Promise<GameProfile | null> => {
    const { data, error } = await supabase
      .from('StudentGameProfile')
      .select('*')
      .eq('studentId', studentId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data as unknown as GameProfile ?? null
  }

  /**
   * Ensure a game profile exists via server (client INSERTs are blocked by trigger).
   */
  const ensureGameProfile = async (_studentId: string): Promise<GameProfile> => {
    const res = await $fetch<{ profile: GameProfile }>('/api/gamification/ensure-profile', {
      method: 'POST'
    })
    return res.profile
  }

  // ────────────────────── XP ──────────────────────

  const fetchXPHistory = async (studentId: string, limit = 20): Promise<XPTransaction[]> => {
    const { data, error } = await supabase
      .from('XPTransaction')
      .select('*')
      .eq('studentId', studentId)
      .order('createdAt', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data as unknown as XPTransaction[]
  }

  /**
   * Award XP via server route. Server resolves studentId from auth and uses
   * XP_REWARDS[action] as the canonical amount. The amount argument is now
   * ignored client-side; sourceId enables idempotency.
   */
  const awardXP = async (
    _studentId: string,
    action: XPActionType,
    _amount?: number,
    sourceId?: string,
    description?: string
  ): Promise<{ xp: number, levelUp: boolean, newLevel: number }> => {
    const res = await $fetch<{ xp: number, level: number, levelUp: boolean, amount: number }>(
      '/api/gamification/award-xp',
      { method: 'POST', body: { action, sourceId, description } }
    )
    return { xp: res.xp, levelUp: res.levelUp, newLevel: res.level }
  }

  /**
   * Update streak via server route.
   */
  const updateStreak = async (_studentId: string): Promise<{ currentStreak: number, isNewDay: boolean }> => {
    const res = await $fetch<{ currentStreak: number, isNewDay: boolean }>(
      '/api/gamification/update-streak',
      { method: 'POST' }
    )
    return { currentStreak: res.currentStreak, isNewDay: res.isNewDay }
  }

  // ────────────────────── Gems ──────────────────────

  const fetchGemHistory = async (studentId: string, limit = 30): Promise<GemTransaction[]> => {
    const { data, error } = await supabase
      .from('GemTransaction')
      .select('*')
      .eq('studentId', studentId)
      .order('createdAt', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data ?? []) as GemTransaction[]
  }

  // ────────────────────── Shop ──────────────────────

  const fetchShopItems = async (): Promise<ShopItem[]> => {
    const { data, error } = await supabase
      .from('ShopItem')
      .select('*')
      .eq('isActive', true)
      .order('sortOrder')
    if (error) throw error
    return (data ?? []) as ShopItem[]
  }

  const fetchInventory = async (studentId: string): Promise<StudentInventory[]> => {
    const { data, error } = await supabase
      .from('StudentInventory')
      .select('*, ShopItem(*)')
      .eq('studentId', studentId)
    if (error) throw error
    return (data ?? []).map((inv: Record<string, unknown>) => ({
      ...inv,
      shopItem: inv.ShopItem
    })) as StudentInventory[]
  }

  // ────────────────────── Leaderboard ──────────────────────

  const fetchLeaderboard = async (
    limit = 20,
    grade?: number | null
  ): Promise<Array<{
    studentId: string
    xp: number
    level: number
    currentStreak: number
    gems: number
    studentName: string
    studentSurname: string
    avatarUrl: string | null
    grade: number | null
  }>> => {
    let query = supabase
      .from('StudentGameProfile')
      .select('studentId, xp, level, currentStreak, gems, Student!inner(grade, User(name, surname, avatarUrl))')
      .order('xp', { ascending: false })
      .limit(limit)
    if (grade != null) query = query.eq('Student.grade', grade)
    const { data, error } = await query
    if (error) throw error

    return (data ?? []).map((row: Record<string, unknown>) => {
      const student = row.Student as Record<string, unknown> | null
      const user = student?.User as Record<string, unknown> | null
      return {
        studentId: row.studentId as string,
        xp: row.xp as number,
        level: row.level as number,
        currentStreak: row.currentStreak as number,
        gems: row.gems as number,
        studentName: (user?.name as string) ?? '',
        studentSurname: (user?.surname as string) ?? '',
        avatarUrl: (user?.avatarUrl as string) ?? null,
        grade: (student?.grade as number | null) ?? null
      }
    })
  }

  // ────────────────────── Achievements ──────────────────────

  const fetchAchievements = async (): Promise<Achievement[]> => {
    const { data, error } = await supabase
      .from('Achievement')
      .select('*')
      .eq('isActive', true)
      .order('xpReward')
    if (error) throw error
    return data as unknown as Achievement[]
  }

  const fetchStudentAchievements = async (profileId: string): Promise<StudentAchievement[]> => {
    const { data, error } = await supabase
      .from('StudentAchievement')
      .select('*, Achievement(*)')
      .eq('studentProfileId', profileId)
      .order('earnedAt', { ascending: false })
    if (error) throw error
    return (data ?? []).map((sa: Record<string, unknown>) => ({
      ...sa,
      achievement: sa.Achievement
    })) as unknown as StudentAchievement[]
  }

  /**
   * Check & award newly earned achievements via server route. Server pulls
   * its own context stats (it can't trust the caller's). Returns achievements
   * newly granted on this call.
   */
  const checkAndAwardAchievements = async (
    _studentId: string,
    _context?: unknown
  ): Promise<StudentAchievement[]> => {
    const res = await $fetch<{ newAchievements: StudentAchievement[] }>(
      '/api/gamification/check-achievements',
      { method: 'POST' }
    )
    return res.newAchievements ?? []
  }

  // ────────────────────── Level helpers ──────────────────────

  /**
   * Calculate level from XP.
   */
  const calculateLevel = (xp: number): number => {
    for (let i = LEVEL_XP_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= (LEVEL_XP_THRESHOLDS[i] ?? 0)) return i + 1
    }
    return 1
  }

  /**
   * Calculate XP progress within current level.
   */
  const getLevelProgress = (xp: number): { current: number, needed: number, percent: number } => {
    const level = calculateLevel(xp)
    const currentThreshold = level === 1 ? 0 : (LEVEL_XP_THRESHOLDS[level - 2] ?? 0)
    const nextThreshold = LEVEL_XP_THRESHOLDS[level - 1] ?? currentThreshold + 200
    const current = Math.max(0, xp - currentThreshold)
    const needed = Math.max(1, nextThreshold - currentThreshold)
    return {
      current,
      needed,
      percent: Math.max(0, Math.min(100, Math.round((current / needed) * 100)))
    }
  }

  const equipItem = async (
    _studentId: string,
    category: 'AVATAR_FRAME' | 'TITLE' | 'PROFILE_THEME',
    shopItemId: string | null
  ): Promise<void> => {
    await $fetch('/api/gamification/equip-item', {
      method: 'POST',
      body: { category, shopItemId }
    })
  }

  return {
    fetchGameProfile,
    ensureGameProfile,
    fetchXPHistory,
    awardXP,
    updateStreak,
    fetchGemHistory,
    fetchShopItems,
    fetchInventory,
    fetchLeaderboard,
    fetchAchievements,
    fetchStudentAchievements,
    checkAndAwardAchievements,
    calculateLevel,
    getLevelProgress,
    equipItem
  }
}
