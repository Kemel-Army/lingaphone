/** `null` в `Song.level` = песня доступна на всех уровнях. */
export type SongLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
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
  /** Загруженный в Storage трек. Приоритетнее YouTube. */
  audioUrl: string | null
  /** Исходное имя файла — чтобы админ понимал, что именно залито. */
  audioFileName: string | null
  youtubeId: string | null
  /** `null` = все уровни. */
  level: SongLevel | null
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

export interface SongLevelMeta {
  label: string
  bg: string
  color: string
  gradient: string
}

/** Как показать песню без уровня — доступна всем. */
export const SONG_LEVEL_ANY: SongLevelMeta = {
  label: 'Все уровни',
  bg: 'bg-slate-100 dark:bg-slate-800/60',
  color: 'text-slate-700 dark:text-slate-300',
  gradient: 'from-slate-400 to-slate-600'
}

export const songLevelMeta = (level: SongLevel | null): SongLevelMeta =>
  level ? SONG_LEVEL_META[level] : SONG_LEVEL_ANY

export const SONG_LEVEL_META: Record<SongLevel, SongLevelMeta> = {
  A1: {
    label: 'Beginner',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    color: 'text-emerald-700 dark:text-emerald-300',
    gradient: 'from-emerald-400 to-teal-500'
  },
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
  },
  C1: {
    label: 'Advanced',
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    color: 'text-rose-700 dark:text-rose-300',
    gradient: 'from-rose-400 to-pink-600'
  }
}

/** Варианты для селектора уровня в админке. `null` — «Все уровни». */
export const SONG_LEVEL_OPTIONS: { label: string, value: SongLevel | null }[] = [
  { label: 'Все уровни', value: null },
  ...(Object.keys(SONG_LEVEL_META) as SongLevel[]).map(l => ({
    label: `${l} · ${SONG_LEVEL_META[l].label}`,
    value: l as SongLevel | null
  }))
]

export const SONG_GENRE_LABELS: Record<SongGenre, string> = {
  pop: 'Pop',
  rock: 'Rock',
  rap: 'Rap / Hip-hop',
  indie: 'Indie',
  rnb: 'R&B',
  other: 'Other'
}
