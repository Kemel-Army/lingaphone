import type { XPActionType, GemSourceType, AchievementTier, AchievementCategory } from '~/shared/types/common'

/**
 * Maps to DB "StudentGameProfile" table.
 */
export interface GameProfile {
  id: string
  studentId: string
  xp: number
  level: number
  gems: number
  currentStreak: number
  longestStreak: number
  streakFreezes: number
  lastActiveDate: string | null
  activeFrameId: string | null
  activeTitleId: string | null
  visualMode: string
  createdAt: string
  updatedAt: string
}

/**
 * Maps to DB "Achievement" table.
 * condition is JSONB: e.g. { type: 'streak', value: 7 }
 */
export interface Achievement {
  id: string
  name: string
  nameKz: string | null
  description: string
  descriptionKz: string | null
  icon: string
  condition: Record<string, unknown>
  xpReward: number
  gemReward: number
  tier: AchievementTier
  category: AchievementCategory
  isHidden: boolean
  isActive: boolean
  sortOrder: number
  createdAt: string
}

/**
 * Maps to DB "StudentAchievement" join table.
 */
export interface StudentAchievement {
  id: string
  studentProfileId: string
  achievementId: string
  earnedAt: string
  achievement?: Achievement
}

/**
 * Maps to DB "XPTransaction" table.
 */
export interface XPTransaction {
  id: string
  studentId: string
  amount: number
  action: XPActionType
  sourceId: string | null
  description: string | null
  createdAt: string
}

/**
 * Maps to DB "GemTransaction" table.
 */
export interface GemTransaction {
  id: string
  studentId: string
  amount: number
  sourceType: GemSourceType
  sourceId: string | null
  description: string | null
  createdAt: string
}

/**
 * Maps to DB "ShopItem" table.
 */
export interface ShopItem {
  id: string
  name: string
  nameKz: string | null
  description: string | null
  descriptionKz: string | null
  icon: string
  category: string
  price: number
  maxOwnable: number
  effect: Record<string, unknown> | null
  isActive: boolean
  isLimited: boolean
  requiredLevel: number
  sortOrder: number
  createdAt: string
}

/**
 * Maps to DB "StudentInventory" table.
 */
export interface StudentInventory {
  id: string
  studentId: string
  shopItemId: string
  quantity: number
  usedCount: number
  purchasedAt: string
  shopItem?: ShopItem
}

/**
 * Pre-defined achievement category icons for UI.
 */
export const ACHIEVEMENT_CATEGORY_ICONS: Record<string, string> = {
  XP: 'i-lucide-zap',
  STREAK: 'i-lucide-flame',
  LESSONS: 'i-lucide-book-open',
  HOMEWORK: 'i-lucide-file-check',
  AI: 'i-lucide-bot',
  TESTS: 'i-lucide-clipboard-check',
  MASTERY: 'i-lucide-star',
  LEVEL: 'i-lucide-trophy',
  HIDDEN: 'i-lucide-help-circle',
  GENERAL: 'i-lucide-award'
}
