/**
 * Application-wide constants.
 */

// Platform info
export const APP_NAME = 'FEMO Platform'
export const APP_DESCRIPTION = 'Цифровая образовательная платформа по олимпиадной математике'
export const APP_URL = 'https://femo.kz'

// Supabase storage buckets
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  HOMEWORK: 'homework',
  MATERIALS: 'materials',
  DOCUMENTS: 'documents',
  RECORDINGS: 'recordings'
} as const

// AI settings
export const AI_CONFIG = {
  MODEL: 'gpt-4o',
  MAX_TOKENS: 4096,
  TEMPERATURE: 0.7,
  TIMEOUT_MS: 60_000
} as const

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// Lesson
export const DEFAULT_LESSON_DURATION = 50 // minutes
export const TRIAL_LESSON_DURATION = 30 // minutes

// Streak
export const STREAK_MILESTONES = {
  BRONZE: 7,
  SILVER: 30,
  GOLD: 100
} as const

// Plans matching the landing page pricing
export const PLANS = {
  TRIAL: {
    name: 'Пробный урок',
    price: 0,
    lessons: 1,
    duration: 30,
    features: [
      '1 онлайн-урок (30 мин)',
      'Диагностический тест',
      'Доступ к AI-тренеру (1 сессия)',
      'Тепловая карта знаний',
      'Персональные рекомендации'
    ]
  },
  START: {
    name: 'Пакет «Старт»',
    price: 24_900,
    lessons: 8,
    duration: 50,
    pricePerLesson: 3_112,
    features: [
      '8 онлайн-уроков 1:1 (50 мин)',
      'AI-тренер безлимитно',
      'Адаптивные ДЗ с AI-проверкой',
      'Карта знаний + прогресс',
      'Геймификация: XP, уровни, streak',
      'Мессенджер с преподавателем'
    ]
  },
  PRO: {
    name: 'Подписка «Pro»',
    price: 34_900,
    lessonsPerMonth: 12,
    duration: 50,
    pricePerLesson: 2_908,
    features: [
      '12 уроков в месяц (1:1 или групповые)',
      'AI-тренер — все 5 режимов',
      'Адаптивные ДЗ, тесты и траектории',
      'Полная аналитика и отчёты для родителей',
      'Early Warning — раннее оповещение',
      'Приоритетная поддержка'
    ]
  }
} as const
