export type ReadingLevel = 'A1' | 'A2' | 'B1' | 'B2'
export type ReadingGenre = 'story' | 'article' | 'comic' | 'dialogue'
export type ReadingQuestionType = 'MCQ' | 'TRUE_FALSE' | 'FILL' | 'OPEN'

export interface VocabEntry {
  word: string
  translation: string
  examples?: string[]
}

export interface ReadingText {
  id: string
  title: string
  body: string
  audioUrl: string | null
  level: ReadingLevel
  genre: ReadingGenre
  topic: string | null
  wordCount: number | null
  vocabulary: VocabEntry[]
  imageUrl: string | null
  isPublished: boolean
  createdAt: string
}

export interface ReadingQuestion {
  id: string
  textId: string
  type: ReadingQuestionType
  question: string
  options: string[] | null
  answer: string
  points: number
  order: number
}

export interface ReadingProgress {
  id: string
  studentId: string
  textId: string
  score: number
  maxScore: number
  completedAt: string | null
  xpEarned: number
}

export interface ReadingTextWithProgress extends ReadingText {
  progress: ReadingProgress | null
}

export const READING_LEVEL_META: Record<ReadingLevel, {
  label: string
  description: string
  bg: string
  color: string
  gradient: string
}> = {
  A1: {
    label: 'Beginner',
    description: 'Простые тексты, базовая лексика',
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    color: 'text-sky-700 dark:text-sky-300',
    gradient: 'from-sky-400 to-blue-500'
  },
  A2: {
    label: 'Elementary',
    description: 'Знакомые темы, несложные конструкции',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    color: 'text-blue-700 dark:text-blue-300',
    gradient: 'from-blue-400 to-indigo-500'
  },
  B1: {
    label: 'Intermediate',
    description: 'Разнообразные темы, стандартная лексика',
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    color: 'text-violet-700 dark:text-violet-300',
    gradient: 'from-violet-400 to-purple-500'
  },
  B2: {
    label: 'Upper-Inter',
    description: 'Сложные тексты, расширенная лексика',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    color: 'text-amber-700 dark:text-amber-300',
    gradient: 'from-amber-400 to-orange-500'
  }
}

export const READING_GENRE_META: Record<ReadingGenre, { label: string, icon: string }> = {
  story: { label: 'Рассказ', icon: 'i-lucide-book' },
  article: { label: 'Статья', icon: 'i-lucide-newspaper' },
  comic: { label: 'Комикс', icon: 'i-lucide-smile' },
  dialogue: { label: 'Диалог', icon: 'i-lucide-message-square' }
}

// Average reading speed for EFL learner (words per minute)
export const EFL_READING_WPM = 130
