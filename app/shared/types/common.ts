// Common types used across the application

export enum UserRole {
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN'
}

export enum AIMode {
  EXPLAIN = 'EXPLAIN',
  PRACTICE = 'PRACTICE',
  CHECK_HW = 'CHECK_HW',
  MOCK_TEST = 'MOCK_TEST',
  FREE = 'FREE'
}

export enum HomeworkFormat {
  TEST = 'TEST',
  INPUT = 'INPUT',
  TEXT = 'TEXT',
  ORAL = 'ORAL',
  FILE = 'FILE',
  INTERACTIVE = 'INTERACTIVE'
}

export enum HomeworkStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  CHECKED = 'CHECKED',
  OVERDUE = 'OVERDUE'
}

export enum LessonStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum LessonType {
  INDIVIDUAL = 'INDIVIDUAL',
  GROUP = 'GROUP'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum NotificationType {
  MEDAL_AWARDED = 'MEDAL_AWARDED',
  PAYOUT_RECEIVED = 'PAYOUT_RECEIVED',
  HOMEWORK_CHECKED = 'HOMEWORK_CHECKED',
  LESSON_REMINDER = 'LESSON_REMINDER',
  NEW_MESSAGE = 'NEW_MESSAGE',
  SYSTEM = 'SYSTEM'
}

export enum XPActionType {
  AI_CORRECT_ANSWER = 'AI_CORRECT_ANSWER',
  HOMEWORK_ON_TIME = 'HOMEWORK_ON_TIME',
  LESSON_ATTENDED = 'LESSON_ATTENDED',
  TOPIC_COMPLETED = 'TOPIC_COMPLETED',
  TEST_COMPLETED = 'TEST_COMPLETED',
  AI_SESSION = 'AI_SESSION',
  PERFECT_TEST = 'PERFECT_TEST',
  GAP_CLOSED = 'GAP_CLOSED',
  STREAK_BONUS = 'STREAK_BONUS',
  QUEST_DAILY = 'QUEST_DAILY',
  QUEST_WEEKLY = 'QUEST_WEEKLY',
  DAILY_BONUS = 'DAILY_BONUS',
  WEEKLY_BONUS = 'WEEKLY_BONUS',
  ACHIEVEMENT_REWARD = 'ACHIEVEMENT_REWARD',
  GRAMMAR_COMPLETE = 'GRAMMAR_COMPLETE',
  GRAMMAR_PERFECT = 'GRAMMAR_PERFECT',
  READING_COMPLETE = 'READING_COMPLETE',
  READING_PERFECT = 'READING_PERFECT',
  SONG_COMPLETE = 'SONG_COMPLETE',
  SONG_PERFECT = 'SONG_PERFECT'
}

// XP rewards table (matches landing page)
export const XP_REWARDS: Record<XPActionType, number | [number, number]> = {
  [XPActionType.AI_CORRECT_ANSWER]: [10, 30],
  [XPActionType.HOMEWORK_ON_TIME]: 50,
  [XPActionType.LESSON_ATTENDED]: 40,
  [XPActionType.TOPIC_COMPLETED]: 100,
  [XPActionType.TEST_COMPLETED]: [50, 200],
  [XPActionType.AI_SESSION]: 30,
  [XPActionType.PERFECT_TEST]: 150,
  [XPActionType.GAP_CLOSED]: 200,
  [XPActionType.STREAK_BONUS]: 50,
  [XPActionType.QUEST_DAILY]: [20, 30],
  [XPActionType.QUEST_WEEKLY]: [100, 150],
  [XPActionType.DAILY_BONUS]: 50,
  [XPActionType.WEEKLY_BONUS]: 100,
  [XPActionType.ACHIEVEMENT_REWARD]: [50, 5000],
  [XPActionType.GRAMMAR_COMPLETE]: 40,
  [XPActionType.GRAMMAR_PERFECT]: 90,
  [XPActionType.READING_COMPLETE]: 30,
  [XPActionType.READING_PERFECT]: 70,
  [XPActionType.SONG_COMPLETE]: 25,
  [XPActionType.SONG_PERFECT]: 60
}

// ═══════════════════════════════════════════════
// GEMS ECONOMY
// ═══════════════════════════════════════════════

export enum GemSourceType {
  QUEST = 'QUEST',
  ACHIEVEMENT = 'ACHIEVEMENT',
  MILESTONE = 'MILESTONE',
  STREAK = 'STREAK',
  LEVEL_UP = 'LEVEL_UP',
  SHOP_PURCHASE = 'SHOP_PURCHASE',
  SHOP_REFUND = 'SHOP_REFUND'
}

export const GEM_REWARDS = {
  DAILY_QUEST: 5,
  DAILY_BONUS_ALL: 10,
  WEEKLY_QUEST: 20,
  WEEKLY_BONUS_ALL: 50,
  STREAK_7: 20,
  STREAK_14: 30,
  STREAK_30: 50,
  STREAK_60: 100,
  STREAK_100: 150,
  LEVEL_UP_MULTIPLIER: 5 // gems = 5 * newLevel
} as const

export const ACHIEVEMENT_TIER_GEM_REWARDS: Record<AchievementTier, number> = {
  BRONZE: 10,
  SILVER: 25,
  GOLD: 50,
  PLATINUM: 100,
  COSMOS: 200
}

// ═══════════════════════════════════════════════
// ACHIEVEMENT TIERS & CATEGORIES
// ═══════════════════════════════════════════════

export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'COSMOS'
export type AchievementCategory = 'XP' | 'STREAK' | 'LESSONS' | 'HOMEWORK' | 'AI' | 'TESTS' | 'MASTERY' | 'LEVEL' | 'HIDDEN' | 'GENERAL'

export const ACHIEVEMENT_TIER_LABELS: Record<AchievementTier, string> = {
  BRONZE: 'Бронза',
  SILVER: 'Серебро',
  GOLD: 'Золото',
  PLATINUM: 'Платина',
  COSMOS: 'Космос'
}

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  XP: 'Опыт',
  STREAK: 'Серия',
  LESSONS: 'Уроки',
  HOMEWORK: 'Домашка',
  AI: 'AI-тренер',
  TESTS: 'Тесты',
  MASTERY: 'Мастерство',
  LEVEL: 'Уровень',
  HIDDEN: 'Скрытые',
  GENERAL: 'Общие'
}

export const ACHIEVEMENT_TIER_COLORS: Record<AchievementTier, string> = {
  BRONZE: 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
  SILVER: 'text-gray-500 bg-gray-100 dark:text-gray-300 dark:bg-gray-700/30',
  GOLD: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
  PLATINUM: 'text-cyan-600 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-900/30',
  COSMOS: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30'
}

// ═══════════════════════════════════════════════
// QUEST SYSTEM
// ═══════════════════════════════════════════════

export enum QuestType {
  SOLVE_PROBLEMS = 'SOLVE_PROBLEMS',
  AI_SESSION_MINUTES = 'AI_SESSION_MINUTES',
  ATTEND_LESSON = 'ATTEND_LESSON',
  SUBMIT_HOMEWORK = 'SUBMIT_HOMEWORK',
  REVIEW_TOPIC = 'REVIEW_TOPIC',
  EARN_XP = 'EARN_XP',
  PERFECT_TEST = 'PERFECT_TEST',
  CLOSE_GAP = 'CLOSE_GAP',
  STREAK_DAYS = 'STREAK_DAYS'
}

export enum QuestPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY'
}

export enum QuestStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED'
}

// ═══════════════════════════════════════════════
// SHOP SYSTEM
// ═══════════════════════════════════════════════

export enum ShopCategory {
  POWER_UP = 'POWER_UP',
  AVATAR_FRAME = 'AVATAR_FRAME',
  PROFILE_THEME = 'PROFILE_THEME',
  TITLE = 'TITLE'
}

// ═══════════════════════════════════════════════
// STREAK VISUAL MILESTONES
// ═══════════════════════════════════════════════

export const STREAK_VISUAL_MILESTONES = [
  { min: 1, max: 6, label: 'Искра', color: 'text-orange-400', icon: 'i-lucide-flame' },
  { min: 7, max: 29, label: 'Бронзовый огонь', color: 'text-amber-600', icon: 'i-lucide-flame' },
  { min: 30, max: 99, label: 'Серебряный огонь', color: 'text-gray-400', icon: 'i-lucide-flame' },
  { min: 100, max: 364, label: 'Золотой огонь', color: 'text-yellow-500', icon: 'i-lucide-flame' },
  { min: 365, max: Infinity, label: 'Космический огонь', color: 'text-purple-500', icon: 'i-lucide-sun' }
] as const

// Level thresholds
export const LEVEL_XP_THRESHOLDS = Array.from({ length: 100 }, (_, i) =>
  Math.round(100 * Math.pow(1.15, i))
)

// Route maps by role
export const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  [UserRole.STUDENT]: '/student',
  [UserRole.PARENT]: '/parent',
  [UserRole.TEACHER]: '/teacher',
  [UserRole.ADMIN]: '/admin'
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.STUDENT]: 'Ученик',
  [UserRole.PARENT]: 'Родитель',
  [UserRole.TEACHER]: 'Педагог',
  [UserRole.ADMIN]: 'Администратор'
}

// Sidebar navigation items per role
export interface SidebarItem {
  label: string
  icon: string
  to: string
  badge?: string | number
  dataTour?: string
  section?: string // For grouped sections (admin)
}

// ═══════════════════════════════════════════════
// Lingafon — placeholder sidebars.
// Add items as pages are built (see lingafon_pages_map.md).
// ═══════════════════════════════════════════════

export const STUDENT_SIDEBAR: SidebarItem[] = [
  { label: 'Главная', icon: 'i-lucide-home', to: '/student' },
  { label: 'AI-тренажёр', icon: 'i-lucide-headphones', to: '/student/practice', badge: 'NEW' },
  { label: 'Мини-игры', icon: 'i-lucide-gamepad-2', to: '/student/game', badge: 'NEW' },
  { label: 'Мои группы', icon: 'i-lucide-users', to: '/student/groups' },
  { label: 'Расписание', icon: 'i-lucide-calendar', to: '/student/schedule' },
  { label: 'Домашка', icon: 'i-lucide-book-open', to: '/student/homework' },
  { label: 'Журнал', icon: 'i-lucide-bar-chart-3', to: '/student/grades' },
  { label: 'Прогресс', icon: 'i-lucide-line-chart', to: '/student/progress' },
  { label: 'Материалы', icon: 'i-lucide-library', to: '/student/materials' },
  { label: 'Маркет Достижений', icon: 'i-lucide-trophy', to: '/student/achievements' },
  { label: 'Рейтинг', icon: 'i-lucide-bar-chart-2', to: '/student/leaderboard' },
  { label: 'Грамматика', icon: 'i-lucide-book-marked', to: '/student/grammar', badge: 'NEW' },
  { label: 'Чтение', icon: 'i-lucide-book-open-text', to: '/student/reading', badge: 'NEW' },
  { label: 'Песни', icon: 'i-lucide-music', to: '/student/songs', badge: 'NEW' },
  { label: 'Сертификаты', icon: 'i-lucide-award', to: '/student/certificates' },
  { label: 'Мероприятия', icon: 'i-lucide-party-popper', to: '/student/events' },
  { label: 'Сообщения', icon: 'i-lucide-message-circle', to: '/student/messenger' },
  { label: 'Настройки', icon: 'i-lucide-settings', to: '/student/settings' }
]

export const PARENT_SIDEBAR: SidebarItem[] = [
  { label: 'Главная', icon: 'i-lucide-home', to: '/parent' }
]

export const TEACHER_SIDEBAR: SidebarItem[] = [
  { label: 'Главная', icon: 'i-lucide-home', to: '/teacher' },
  { label: 'Мои группы', icon: 'i-lucide-layers', to: '/teacher/groups' },
  { label: 'Мои ученики', icon: 'i-lucide-users', to: '/teacher/students' },
  { label: 'Задания', icon: 'i-lucide-file-text', to: '/teacher/homework' },
  { label: 'Журнал оценок', icon: 'i-lucide-table', to: '/teacher/grades' },
  { label: 'Проверка работ', icon: 'i-lucide-inbox', to: '/teacher/submissions' },
  { label: 'Тестирование', icon: 'i-lucide-clipboard-list', to: '/teacher/testing' },
  { label: 'Расписание', icon: 'i-lucide-calendar-days', to: '/teacher/schedule' },
  { label: 'Профиль', icon: 'i-lucide-user-circle', to: '/teacher/profile' }
]

export const ADMIN_SIDEBAR: SidebarItem[] = [
  { label: 'Дашборд', icon: 'i-lucide-layout-dashboard', to: '/admin' },
  { label: 'Ученики', icon: 'i-lucide-graduation-cap', to: '/admin/students' },
  { label: 'Учителя', icon: 'i-lucide-users', to: '/admin/teachers' },
  { label: 'Группы', icon: 'i-lucide-layout-grid', to: '/admin/groups' },
  { label: 'Тестирование', icon: 'i-lucide-clipboard-list', to: '/admin/testing' },
  { label: 'Расписание', icon: 'i-lucide-calendar-days', to: '/admin/schedule' },
  { label: 'Финансы', icon: 'i-lucide-banknote', to: '/admin/finance' },
  { label: 'Настройки', icon: 'i-lucide-settings', to: '/admin/settings' }
]

export const SIDEBAR_BY_ROLE: Record<UserRole, SidebarItem[]> = {
  [UserRole.STUDENT]: STUDENT_SIDEBAR,
  [UserRole.PARENT]: PARENT_SIDEBAR,
  [UserRole.TEACHER]: TEACHER_SIDEBAR,
  [UserRole.ADMIN]: ADMIN_SIDEBAR
}
