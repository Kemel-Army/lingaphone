export type SongLevel = 'A2' | 'B1' | 'B2'
export type SongGenre = 'pop' | 'rock' | 'rap' | 'indie' | 'rnb' | 'other'

export interface LyricLine {
  lineIndex: number
  text: string
  hasGap: boolean
  gapAnswer?: string[]
  translation?: string
}

export interface SongVocabEntry {
  word: string
  type: 'slang' | 'idiom' | 'phrase' | 'word'
  meaning: string
  example?: string
}

export interface Song {
  id: string
  title: string
  artist: string
  youtubeId: string | null
  level: SongLevel
  genre: SongGenre | null
  lyrics: LyricLine[]
  vocabulary: SongVocabEntry[]
  isPublished: boolean
  createdAt: string
}

export interface SongProgress {
  id: string
  studentId: string
  songId: string
  score: number
  maxScore: number
  completedAt: string | null
  xpEarned: number
}

export interface SongWithProgress extends Song {
  progress: SongProgress | null
}

export const SONG_LEVEL_META: Record<SongLevel, {
  label: string
  bg: string
  color: string
  gradient: string
}> = {
  A2: {
    label: 'Elementary',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    color: 'text-blue-700 dark:text-blue-300',
    gradient: 'from-blue-400 to-indigo-500'
  },
  B1: {
    label: 'Intermediate',
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    color: 'text-violet-700 dark:text-violet-300',
    gradient: 'from-violet-400 to-purple-500'
  },
  B2: {
    label: 'Upper-Inter',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    color: 'text-amber-700 dark:text-amber-300',
    gradient: 'from-amber-400 to-orange-500'
  }
}

export const SONG_GENRE_LABELS: Record<SongGenre, string> = {
  pop: 'Pop',
  rock: 'Rock',
  rap: 'Rap / Hip-hop',
  indie: 'Indie',
  rnb: 'R&B',
  other: 'Other'
}
