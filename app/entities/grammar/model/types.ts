export type GrammarLevel = 'A1' | 'A2' | 'B1' | 'B2'
export type ExerciseType = 'MCQ' | 'FILL' | 'TRANSFORM'

export interface GrammarTopic {
  id: string
  slug: string
  title: string
  level: GrammarLevel
  order: number
  videoUrl: string | null
  theoryMd: string
  isPublished: boolean
  createdAt: string
}

export interface GrammarExercise {
  id: string
  topicId: string
  type: ExerciseType
  prompt: string
  options: string[] | null
  answer: string
  hint: string | null
  points: number
  order: number
}

export interface GrammarProgress {
  id: string
  studentId: string
  topicId: string
  mastery: number
  attempts: number
  bestScore: number
  maxScore: number
  lastPracticed: string | null
  completedAt: string | null
}

export interface GrammarTopicWithProgress extends GrammarTopic {
  progress: GrammarProgress | null
}

export const LEVEL_META: Record<GrammarLevel, {
  label: string
  color: string
  bg: string
  ring: string
  gradient: string
  description: string
}> = {
  A1: {
    label: 'A1 — Beginner',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    ring: 'ring-emerald-300/60',
    gradient: 'from-emerald-400 to-teal-500',
    description: 'Основы — глагол to be, артикли, числа, настоящее время'
  },
  A2: {
    label: 'A2 — Elementary',
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    ring: 'ring-sky-300/60',
    gradient: 'from-sky-400 to-blue-500',
    description: 'Прошедшее время, сравнения, модальные глаголы'
  },
  B1: {
    label: 'B1 — Intermediate',
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    ring: 'ring-violet-300/60',
    gradient: 'from-violet-400 to-purple-500',
    description: 'Пассив, условные предложения, придаточные'
  },
  B2: {
    label: 'B2 — Upper-Intermediate',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    ring: 'ring-amber-300/60',
    gradient: 'from-amber-400 to-orange-500',
    description: 'Инверсия, смешанные условные, продвинутый пассив'
  }
}

export const MASTERY_LABEL = (mastery: number): { label: string, color: string, icon: string } => {
  if (mastery >= 1.0) return { label: 'Perfect', color: 'text-yellow-600 dark:text-yellow-400', icon: 'i-lucide-star' }
  if (mastery >= 0.7) return { label: 'Mastered', color: 'text-emerald-600 dark:text-emerald-400', icon: 'i-lucide-check-circle' }
  if (mastery >= 0.35) return { label: 'In progress', color: 'text-sky-600 dark:text-sky-400', icon: 'i-lucide-loader' }
  return { label: 'Not started', color: 'text-muted', icon: 'i-lucide-circle' }
}
