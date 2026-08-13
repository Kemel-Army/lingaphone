/**
 * Канонический вид казахстанского номера — та же логика, что в generated-колонке
 * `Lead."phoneDigits"` (миграция 20260813233000). Держим их в паре: сравнение
 * идёт по этой колонке, и разойдись они — дедупликация лида молча сломается.
 *
 *   +7 700 111-22-33 → 77001112233
 *   8 700 111 22 33  → 77001112233
 *   700 111 22 33    → 77001112233
 */
export const normalizeKzPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) return `7${digits.slice(1)}`
  if (digits.length === 10) return `7${digits}`
  return digits
}

/** Номер, по которому вообще осмысленно искать человека. */
export const isUsablePhone = (digits: string): boolean => digits.length >= 10
