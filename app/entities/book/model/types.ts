export type BookLevel = 'A1' | 'A2' | 'B1' | 'B2'

export interface BookModule {
  id: string
  bookId: string
  title: string
  order: number
  pdfUrl: string | null
  createdAt: string
}

export interface Book {
  id: string
  title: string
  description: string | null
  level: BookLevel
  coverUrl: string | null
  isPublished: boolean
  createdAt: string
}

export interface BookWithModules extends Book {
  modules: BookModule[]
}

export const BOOK_LEVEL_META: Record<BookLevel, {
  label: string
  color: string
  bg: string
  gradient: string
}> = {
  A1: {
    label: 'Beginner',
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    gradient: 'from-sky-400 to-blue-500'
  },
  A2: {
    label: 'Elementary',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    gradient: 'from-blue-400 to-indigo-500'
  },
  B1: {
    label: 'Intermediate',
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    gradient: 'from-violet-400 to-purple-500'
  },
  B2: {
    label: 'Upper-Inter',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    gradient: 'from-amber-400 to-orange-500'
  }
}
