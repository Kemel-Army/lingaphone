/**
 * Mock-data types for Lingafon UI-first development.
 * Schema mirrors what we'll eventually have in Supabase
 * (see lingafon_pages_map.md → Базовые модели).
 */

export type EnglishLevel
  = | 'A1' | 'A2' | 'S1' | 'S2' | 'B2' | 'F1' | 'F2' | 'F3' | 'F4'

export type BranchKind = 'OFFLINE' | 'ONLINE'

export interface Branch {
  id: string
  name: string
  kind: BranchKind
  address?: string
  city?: string
}

export interface Teacher {
  id: string
  name: string
  surname: string
  avatarUrl?: string
  bio?: string
  yearsOfExperience: number
}

export interface Group {
  id: string
  name: string
  level: EnglishLevel
  teacher: Teacher
  branch: Branch
  /** ISO weekday numbers 1-7 + start time HH:MM */
  schedule: Array<{ weekday: number, startTime: string, durationMin: number }>
  studentsCount: number
  maxStudents: number
}

export interface Lesson {
  id: string
  groupId: string
  startsAt: string
  durationMin: number
  topic: string
  /** present after lesson is over */
  recordingUrl?: string
}

export interface Attendance {
  studentId: string
  lessonId: string
  status: 'PRESENT' | 'ABSENT' | 'LATE'
}

export interface Grade {
  studentId: string
  lessonId: string
  /** 1-5 */
  value: number
  comment?: string
}

export type MedalKind = 'GOLD' | 'SILVER' | 'BRONZE' | 'NONE'

export interface MonthlyMedal {
  id: string
  studentId: string
  /** YYYY-MM */
  month: string
  averageGrade: number
  medal: MedalKind
  /** payout in tenge */
  payout: number
  paidAt?: string
}

export interface Homework {
  id: string
  lessonId: string
  title: string
  dueAt: string
  status: 'ASSIGNED' | 'SUBMITTED' | 'GRADED'
  grade?: number
}

export interface StudentProfile {
  id: string
  name: string
  surname: string
  level: EnglishLevel
  /** consecutive months of GOLD medals */
  goldStreak: number
  /** total earnings in tenge */
  totalEarnings: number
  /** current month progress to medal */
  currentMonthAverage: number
  /** daily practice streak (days) — separate from monthly gold streak */
  dailyStreak: number
}

// ─── Homework (6 formats per CLAUDE.md / lingafon_data_model.md) ──────────

export type HomeworkFormatCode = 'TEST' | 'INPUT' | 'TEXT' | 'ORAL' | 'FILE' | 'INTERACTIVE'
export type HomeworkStatusCode = 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'CHECKED' | 'OVERDUE'

/** Multiple-choice quiz */
export interface TestPayload {
  questions: Array<{
    id: string
    text: string
    options: Array<{ id: string, text: string }>
    correctOptionId: string
  }>
}

/** Free-form short input (one-word / phrase) */
export interface InputPayload {
  questions: Array<{
    id: string
    prompt: string
    /** acceptable answers (case-insensitive comparison) */
    acceptableAnswers: string[]
  }>
}

/** Long-form essay */
export interface TextPayload {
  prompt: string
  minWords: number
}

/** Speak-aloud — student records voice, AI compares to target */
export interface OralPayload {
  prompts: Array<{
    id: string
    target: string
    ipa?: string
    translation?: string
  }>
}

/** File upload */
export interface FilePayload {
  instruction: string
  acceptedTypes: string[]
}

/** Drag-and-drop / fill-the-gap */
export interface InteractivePayload {
  kind: 'GAP_FILL' | 'MATCH'
  sentence?: string
  gaps?: Array<{ id: string, answer: string }>
  pairs?: Array<{ left: string, right: string }>
}

export interface HomeworkExtended {
  id: string
  lessonId: string
  title: string
  description?: string
  format: HomeworkFormatCode
  dueAt: string
  maxScore: number
  payload:
    | { kind: 'TEST', data: TestPayload }
    | { kind: 'INPUT', data: InputPayload }
    | { kind: 'TEXT', data: TextPayload }
    | { kind: 'ORAL', data: OralPayload }
    | { kind: 'FILE', data: FilePayload }
    | { kind: 'INTERACTIVE', data: InteractivePayload }
  status: HomeworkStatusCode
  aiScore?: number
  teacherGrade?: number
  teacherComment?: string
}

// ─── Materials & vocabulary ───────────────────────────────────────────────

export type MaterialKind = 'AUDIO' | 'VIDEO' | 'PDF' | 'LINK'

export interface Material {
  id: string
  lessonId?: string
  kind: MaterialKind
  title: string
  description?: string
  url: string
  durationSec?: number
  tag?: string
}

export interface VocabularyEntry {
  id: string
  word: string
  ipa?: string
  translation: string
  example?: string
  addedAt: string
  /** times student has reviewed it via Practice */
  reviewCount: number
  /** best score 0-100 across attempts */
  bestScore: number
}

// ─── Detailed grade entry (per lesson) ────────────────────────────────────

export interface GradeEntry {
  id: string
  lessonId: string
  groupId: string
  date: string
  topic: string
  value: 1 | 2 | 3 | 4 | 5
  comment?: string
  teacherName: string
}

// ─── Events ───────────────────────────────────────────────────────────────

export type EventKind = 'CAMP' | 'HOLIDAY' | 'WORKSHOP' | 'CONTEST'
export type EventStatus = 'OPEN' | 'CLOSED' | 'REGISTERED' | 'ATTENDED'

export interface SchoolEvent {
  id: string
  kind: EventKind
  title: string
  description: string
  startsAt: string
  endsAt: string
  price: number
  capacity: number
  registered: number
  branchName?: string
  posterEmoji: string
  myStatus: EventStatus
}

// ─── Certificates ─────────────────────────────────────────────────────────

export type CertificateKind = 'LEVEL_COMPLETION' | 'CONTEST_WINNER' | 'YEAR_END' | 'STREAK_BONUS'

export interface StudentCertificate {
  id: string
  kind: CertificateKind
  title: string
  subtitle?: string
  issuedAt: string
  level?: EnglishLevel
  /** accent color hue */
  accent: 'gold' | 'silver' | 'blue' | 'emerald'
}

// ─── Messenger ────────────────────────────────────────────────────────────

export interface ChatParticipant {
  id: string
  name: string
  surname: string
  role: 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN'
  avatarInitials: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  body: string
  sentAt: string
  isRead: boolean
}

export interface Conversation {
  id: string
  /** other participant (for student — usually teacher) */
  with: ChatParticipant
  lastMessageAt: string
  unreadCount: number
}

// ─── Word of the day & daily quest ────────────────────────────────────────

export interface WordOfTheDay {
  word: string
  ipa: string
  translation: string
  example: string
  funFact?: string
}

export interface DailyQuest {
  id: string
  title: string
  description: string
  icon: string
  /** progress 0-1 */
  progress: number
  rewardXp: number
  done: boolean
}
