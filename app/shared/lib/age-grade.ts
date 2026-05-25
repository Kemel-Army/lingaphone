/**
 * Age → school grade mapping for Kazakhstan (1–6 class platform).
 *
 * In Kazakhstan children start grade 1 at age 6–7. Each completed year
 * shifts the expected grade by one. The diagnostic test uses this to
 * pick an initial difficulty level; the adaptive engine then drifts up
 * or down ±1 class if the child is ahead or behind.
 */

export const MIN_GRADE = 1
export const MAX_GRADE = 6

/**
 * Return age in completed years from a birthdate (ISO YYYY-MM-DD).
 * Returns null for missing/invalid input.
 */
export function ageFromBirthdate(birthdate: string | Date | null | undefined): number | null {
  if (!birthdate) return null
  const birth = birthdate instanceof Date ? birthdate : new Date(birthdate)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years--
  return years
}

/**
 * Map age (in completed years) to the expected school grade for FEMO.
 * Clamped to [1, 6].
 *
 *   6 лет → 1 класс
 *   7 лет → 2 класс
 *   8 лет → 3 класс
 *   9 лет → 4 класс
 *  10 лет → 5 класс
 *  11+ лет → 6 класс
 *  <6 лет → 1 класс (too young, but we still let them try)
 */
export function gradeFromAge(age: number | null | undefined): number {
  if (age == null || Number.isNaN(age)) return MIN_GRADE
  const computed = age - 5 // age 6 → grade 1
  return Math.min(MAX_GRADE, Math.max(MIN_GRADE, computed))
}

/**
 * Shortcut: birthdate → expected grade.
 */
export function gradeFromBirthdate(birthdate: string | Date | null | undefined): number {
  return gradeFromAge(ageFromBirthdate(birthdate))
}

/**
 * Acceptable birthdate range for FEMO (5–13 years old).
 * Used to constrain a date picker.
 */
export function birthdateRange(now: Date = new Date()): { min: string, max: string } {
  const min = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate())
  const max = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate())
  return {
    min: min.toISOString().slice(0, 10),
    max: max.toISOString().slice(0, 10)
  }
}
