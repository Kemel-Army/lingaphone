/**
 * Lingafon mock-data layer.
 *
 * Composables here mirror the shape of future Supabase-backed composables
 * (`useGroups`, `useLessons`, etc.). When the schema lands, swap these for
 * real queries without touching consumer components.
 *
 * For data-model overview see /lingafon_data_model.md.
 */

import {
  MOCK_BRANCHES, MOCK_TEACHERS, MOCK_GROUPS,
  MOCK_UPCOMING_LESSONS, MOCK_MEDAL_HISTORY, MOCK_HOMEWORK,
  MOCK_STUDENT_PROFILE
} from './data'

import {
  MOCK_HOMEWORK_LIST, MOCK_MATERIALS, MOCK_VOCABULARY,
  MOCK_GRADE_HISTORY, MOCK_EVENTS, MOCK_CERTIFICATES,
  MOCK_CONVERSATIONS, MOCK_MESSAGES_BY_CONV, STUDENT_CHAT_USER_ID,
  MOCK_WORD_OF_DAY, MOCK_DAILY_QUESTS
} from './extended'

export * from './types'
export * from './data'
export * from './extended'
export * from './pronunciation'
export * from './stories'
export * from './game-levels'
export * from './level-test'

export const useMockStudent = () => {
  const profile = MOCK_STUDENT_PROFILE

  const myGroups = MOCK_GROUPS
  const upcomingLessons = MOCK_UPCOMING_LESSONS
  const medalHistory = MOCK_MEDAL_HISTORY
  const homework = MOCK_HOMEWORK
  const branches = MOCK_BRANCHES
  const teachers = MOCK_TEACHERS

  const nextLesson = upcomingLessons[0] ?? null

  /** Predicted medal for current month based on running average */
  const predictedMedal = (() => {
    const a = profile.currentMonthAverage
    if (a >= 4.6) return 'GOLD'
    if (a >= 4.0) return 'SILVER'
    if (a >= 3.6) return 'BRONZE'
    return 'NONE'
  })() as 'GOLD' | 'SILVER' | 'BRONZE' | 'NONE'

  const predictedPayout = predictedMedal === 'GOLD'
    ? 5000
    : predictedMedal === 'SILVER'
      ? 3000
      : predictedMedal === 'BRONZE'
        ? 1000
        : 0

  return {
    profile,
    myGroups,
    upcomingLessons,
    medalHistory,
    homework,
    branches,
    teachers,
    nextLesson,
    predictedMedal,
    predictedPayout,
    // extended
    homeworkList: MOCK_HOMEWORK_LIST,
    materials: MOCK_MATERIALS,
    vocabulary: MOCK_VOCABULARY,
    gradeHistory: MOCK_GRADE_HISTORY,
    events: MOCK_EVENTS,
    certificates: MOCK_CERTIFICATES,
    conversations: MOCK_CONVERSATIONS,
    messagesByConv: MOCK_MESSAGES_BY_CONV,
    chatUserId: STUDENT_CHAT_USER_ID,
    wordOfDay: MOCK_WORD_OF_DAY,
    dailyQuests: MOCK_DAILY_QUESTS
  }
}

// also export a couple of pure data getters for pages that don't need full bundle
export const getHomework = (id: string) => MOCK_HOMEWORK_LIST.find(h => h.id === id)
export const getEvent = (id: string) => MOCK_EVENTS.find(e => e.id === id)
export const getConversation = (id: string) => MOCK_CONVERSATIONS.find(c => c.id === id)
