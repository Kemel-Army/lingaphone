/**
 * Date/time formatting utilities for Kazakhstan (UTC+5/+6).
 */

/**
 * Format a date string to localized Russian format.
 */
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ru-KZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options
  })
}

/**
 * Format a date to short date format (e.g., "5 мар")
 */
export const formatDateShort = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ru-KZ', { day: 'numeric', month: 'short' })
}

/**
 * Format time (e.g., "16:00")
 */
export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('ru-KZ', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Format date and time together (e.g., "5 марта, 16:00")
 */
export const formatDateTime = (date: string | Date): string => {
  return `${formatDateShort(date)}, ${formatTime(date)}`
}

/**
 * Get relative time string (e.g., "5 минут назад")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'только что'
  if (diffMin < 60) return `${diffMin} мин. назад`
  if (diffHour < 24) return `${diffHour} ч. назад`
  if (diffDay < 7) return `${diffDay} дн. назад`
  return formatDateShort(d)
}

/**
 * Check if a date is today
 */
export const isToday = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

/**
 * Get day of week name in Russian
 */
export const getDayOfWeekName = (dayIndex: number): string => {
  const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
  return days[dayIndex] ?? ''
}

/**
 * Get short day name
 */
export const getDayOfWeekShort = (dayIndex: number): string => {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  return days[dayIndex] ?? ''
}
