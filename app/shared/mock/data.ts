import type {
  Branch, Teacher, Group, Lesson, MonthlyMedal,
  Homework, StudentProfile
} from './types'

/**
 * Static mock data for UI-first development.
 * Will be replaced by real Supabase queries when schema is finalized.
 */

export const MOCK_BRANCHES: Branch[] = [
  { id: 'br-1', name: 'Алматы — Достык', kind: 'OFFLINE', address: 'пр. Достык 89', city: 'Алматы' },
  { id: 'br-2', name: 'Алматы — Розыбакиева', kind: 'OFFLINE', address: 'ул. Розыбакиева 247', city: 'Алматы' },
  { id: 'br-3', name: 'Алматы — Самал', kind: 'OFFLINE', address: 'мкр. Самал-2, 33', city: 'Алматы' },
  { id: 'br-online', name: 'Онлайн', kind: 'ONLINE' }
]

export const MOCK_TEACHERS: Teacher[] = [
  { id: 't-1', name: 'Айсауле', surname: 'Бекжан', yearsOfExperience: 8, bio: 'British Council certified. Speaking & olympiad coach.' },
  { id: 't-2', name: 'Жанель', surname: 'Аманова', yearsOfExperience: 5, bio: 'IELTS prep specialist. Loves storytelling lessons.' },
  { id: 't-3', name: 'Aiman', surname: 'Nazarova', yearsOfExperience: 10, bio: 'Phonetics expert. Beautiful British accent.' },
  { id: 't-4', name: 'Dana', surname: 'Yessenbayeva', yearsOfExperience: 7, bio: 'Young learners specialist. Game-based teaching.' }
]

export const MOCK_GROUPS: Group[] = [
  {
    id: 'g-1',
    name: 'A2 Tuesday Stars',
    level: 'A2',
    teacher: MOCK_TEACHERS[0]!,
    branch: MOCK_BRANCHES[0]!,
    schedule: [
      { weekday: 2, startTime: '16:30', durationMin: 60 },
      { weekday: 4, startTime: '16:30', durationMin: 60 }
    ],
    studentsCount: 8,
    maxStudents: 10
  },
  {
    id: 'g-2',
    name: 'S2 Online Champions',
    level: 'S2',
    teacher: MOCK_TEACHERS[1]!,
    branch: MOCK_BRANCHES[3]!,
    schedule: [
      { weekday: 1, startTime: '18:00', durationMin: 75 },
      { weekday: 3, startTime: '18:00', durationMin: 75 }
    ],
    studentsCount: 6,
    maxStudents: 8
  }
]

export const MOCK_STUDENT_PROFILE: StudentProfile = {
  id: 'st-current',
  name: 'Student',
  surname: 'Lingafon',
  level: 'A2',
  goldStreak: 2,
  totalEarnings: 18000,
  currentMonthAverage: 4.4,
  dailyStreak: 12
}

/**
 * Build upcoming lessons starting today + a few days.
 * Computed at module load → stable within a session.
 */
function buildUpcomingLessons(): Lesson[] {
  const now = new Date()
  const lessons: Lesson[] = []
  for (let i = 0; i < 8; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    // odd days → group 1, even → group 2
    const groupId = i % 2 === 0 ? 'g-1' : 'g-2'
    d.setHours(16 + (i % 2) * 2, 30, 0, 0)
    lessons.push({
      id: `l-${i}`,
      groupId,
      startsAt: d.toISOString(),
      durationMin: 60,
      topic: groupId === 'g-1'
        ? ['Past Simple', 'Daily routines', 'Family vocabulary', 'Travel phrases'][i % 4]!
        : ['Conditionals', 'Phrasal verbs', 'IELTS Speaking Part 2', 'Business idioms'][i % 4]!
    })
  }
  return lessons
}

export const MOCK_UPCOMING_LESSONS: Lesson[] = buildUpcomingLessons()

/**
 * Build last 6 months of medals for the current student.
 */
function buildMedalHistory(): MonthlyMedal[] {
  const now = new Date()
  const medals: MonthlyMedal[] = []
  const pattern: Array<{ medal: 'GOLD' | 'SILVER' | 'BRONZE' | 'NONE', avg: number, payout: number }> = [
    { medal: 'GOLD', avg: 4.7, payout: 5000 },
    { medal: 'GOLD', avg: 4.8, payout: 5000 },
    { medal: 'SILVER', avg: 4.2, payout: 3000 },
    { medal: 'GOLD', avg: 4.6, payout: 5000 },
    { medal: 'BRONZE', avg: 3.7, payout: 1000 },
    { medal: 'SILVER', avg: 4.1, payout: 3000 }
  ]
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i - 1, 1)
    const p = pattern[i]!
    medals.push({
      id: `m-${i}`,
      studentId: MOCK_STUDENT_PROFILE.id,
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      averageGrade: p.avg,
      medal: p.medal,
      payout: p.payout,
      paidAt: d.toISOString()
    })
  }
  return medals
}

export const MOCK_MEDAL_HISTORY: MonthlyMedal[] = buildMedalHistory()

export const MOCK_HOMEWORK: Homework[] = [
  {
    id: 'hw-1',
    lessonId: 'l-0',
    title: 'Write 5 sentences using Past Simple',
    dueAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: 'ASSIGNED'
  },
  {
    id: 'hw-2',
    lessonId: 'l-2',
    title: 'Listen to "Travel phrases" audio + repeat each phrase',
    dueAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    status: 'ASSIGNED'
  }
]
