/**
 * Formatting utilities.
 */

/**
 * Format number with spacing (e.g., 24900 → "24 900")
 */
export const formatNumber = (n: number): string => {
  return n.toLocaleString('ru-RU')
}

/**
 * Format price in tenge (e.g., 24900 → "24 900 ₸")
 */
export const formatPrice = (amount: number): string => {
  return `${formatNumber(amount)} ₸`
}

/**
 * Format percentage (e.g., 0.78 → "78%")
 */
export const formatPercent = (value: number, decimals = 0): string => {
  const pct = value > 1 ? value : value * 100
  return `${pct.toFixed(decimals)}%`
}

/**
 * Format XP display (e.g., 2450 → "2,450 XP")
 */
export const formatXP = (xp: number): string => {
  return `${formatNumber(xp)} XP`
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const formatTopicName = (topicId: string | null | undefined): string => {
  if (!topicId) return ''
  const id = String(topicId).trim()
  if (UUID_RE.test(id)) return `Тема ${id.slice(0, 4).toUpperCase()}`
  if (id.includes('-') || id.includes('_')) {
    const words = id.replace(/[-_]+/g, ' ').trim().split(/\s+/)
    return words.map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(' ')
  }
  return id
}

export const normalizeMastery = (value: number | null | undefined): number => {
  const v = Number(value) || 0
  if (v <= 1.5) return Math.round(v * 100)
  return Math.round(v)
}

/**
 * Format duration in minutes to human readable
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} мин`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours} ч`
  return `${hours} ч ${mins} мин`
}

/**
 * Truncate string with ellipsis
 */
export const truncate = (str: string, length: number): string => {
  if (str.length <= length) return str
  return `${str.slice(0, length)}…`
}

/**
 * Get initials from name (e.g., "Айдана Калиева" → "АК")
 */
export const getInitials = (name: string, surname?: string): string => {
  const first = name.charAt(0).toUpperCase()
  const second = surname ? surname.charAt(0).toUpperCase() : ''
  return `${first}${second}`
}

/**
 * Get mastery level color class based on percentage
 */
export const getMasteryColor = (mastery: number): string => {
  if (mastery >= 90) return 'text-green-600 dark:text-green-400'
  if (mastery >= 70) return 'text-green-600 dark:text-green-500'
  if (mastery >= 50) return 'text-amber-600 dark:text-amber-400'
  if (mastery >= 30) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

/**
 * Get mastery level background class (transparent — for badges, row highlights)
 */
export const getMasteryBgColor = (mastery: number): string => {
  if (mastery >= 90) return 'bg-green-500/20'
  if (mastery >= 70) return 'bg-green-400/15'
  if (mastery >= 50) return 'bg-amber-500/20'
  if (mastery >= 30) return 'bg-orange-500/20'
  return 'bg-red-500/20'
}

/**
 * Get mastery heatmap cell class (solid opaque — for heatmap grid cells)
 */
export const getMasteryHeatColor = (mastery: number): string => {
  if (mastery >= 90) return 'bg-green-500 text-white'
  if (mastery >= 70) return 'bg-green-400/80 text-white'
  if (mastery >= 50) return 'bg-amber-400 text-white'
  if (mastery >= 30) return 'bg-orange-400 text-white'
  if (mastery > 0) return 'bg-red-400 text-white'
  return 'bg-gray-300 dark:bg-gray-700 text-gray-500'
}

/**
 * Get mastery ring / border color for heatmap cells
 */
export const getMasteryRingColor = (mastery: number): string => {
  if (mastery >= 90) return 'ring-green-500/30'
  if (mastery >= 70) return 'ring-green-400/30'
  if (mastery >= 50) return 'ring-amber-400/30'
  if (mastery >= 30) return 'ring-orange-400/30'
  return 'ring-red-500/30'
}

/**
 * Get mastery bar color
 */
export const getMasteryBarColor = (mastery: number): string => {
  if (mastery >= 80) return 'bg-green-500'
  if (mastery >= 60) return 'bg-amber-400'
  return 'bg-red-400'
}

/**
 * Human-readable mastery label
 */
export const getMasteryLabel = (mastery: number): string => {
  if (mastery >= 90) return 'Отлично'
  if (mastery >= 70) return 'Хорошо'
  if (mastery >= 50) return 'Средне'
  if (mastery >= 30) return 'Слабо'
  if (mastery > 0) return 'Критично'
  return 'Не изучено'
}
