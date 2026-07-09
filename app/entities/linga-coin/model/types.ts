import type { Database } from '~/shared/types/database.types'

export type LingaCoinReason = Database['public']['Enums']['LingaCoinReason']
export type LingaCoinTransactionRow = Database['public']['Tables']['LingaCoinTransaction']['Row']

export interface ReasonMeta { value: LingaCoinReason, label: string, icon: string }

export const COIN_REASONS: readonly ReasonMeta[] = [
  { value: 'BEHAVIOR', label: 'Хорошее поведение', icon: 'i-lucide-smile' },
  { value: 'NO_TARDINESS', label: 'Без опозданий', icon: 'i-lucide-clock' },
  { value: 'RESPECT', label: 'Уважение', icon: 'i-lucide-heart-handshake' },
  { value: 'ATTENDANCE', label: 'Посещаемость 85%+', icon: 'i-lucide-calendar-check' },
  { value: 'MAKEUP', label: 'Отработки 100%', icon: 'i-lucide-rotate-ccw' },
  { value: 'HOMEWORK', label: 'ДЗ 100%', icon: 'i-lucide-book-check' },
  { value: 'IEBOOK', label: 'Работа с iEBook', icon: 'i-lucide-tablet' },
  { value: 'DIARY', label: 'Ведение дневника', icon: 'i-lucide-notebook-pen' },
  { value: 'ENGLISH_VIDEO', label: 'Видео на английском', icon: 'i-lucide-video' },
  { value: 'PAYMENT_ONTIME', label: 'Оплата вовремя', icon: 'i-lucide-badge-dollar-sign' },
  { value: 'MEDAL', label: 'Медаль', icon: 'i-lucide-medal' },
  { value: 'PURCHASE', label: 'Покупка', icon: 'i-lucide-shopping-bag' },
  { value: 'MANUAL', label: 'Начисление', icon: 'i-lucide-plus' },
  { value: 'ADJUSTMENT', label: 'Корректировка', icon: 'i-lucide-settings-2' }
]

export const COIN_REASON_MAP: Record<LingaCoinReason, ReasonMeta>
  = Object.fromEntries(COIN_REASONS.map(r => [r.value, r])) as Record<LingaCoinReason, ReasonMeta>

/** Причины, доступные учителю для ручного начисления (без авто-причин). */
export const AWARD_REASONS: readonly ReasonMeta[]
  = COIN_REASONS.filter(r => !['PURCHASE', 'MEDAL', 'ADJUSTMENT'].includes(r.value))

// ─── Медали (порог баланса, ТЗ разд. 8) ─────────────────────────────
export interface CoinMedalMeta {
  key: 'GOLD' | 'SILVER' | 'BRONZE'
  label: string
  threshold: number
  color: string
  emoji: string
}

export const COIN_MEDALS: readonly CoinMedalMeta[] = [
  { key: 'GOLD', label: 'Золотая медаль', threshold: 5000, color: 'text-yellow-500', emoji: '🥇' },
  { key: 'SILVER', label: 'Серебряная медаль', threshold: 3000, color: 'text-gray-400', emoji: '🥈' },
  { key: 'BRONZE', label: 'Бронзовая медаль', threshold: 1000, color: 'text-amber-700', emoji: '🥉' }
]

export interface CoinMedalState {
  current: CoinMedalMeta | null
  next: CoinMedalMeta | null
  toNext: number
  progressPct: number
}

/** Текущая медаль по балансу + прогресс до следующей. */
export const coinMedal = (balance: number): CoinMedalState => {
  const current = COIN_MEDALS.find(m => balance >= m.threshold) ?? null
  // Следующая медаль — ближайший бОльший порог.
  const higher = [...COIN_MEDALS].reverse().find(m => m.threshold > balance) ?? null
  const prevThreshold = current?.threshold ?? 0
  const next = higher
  const span = next ? next.threshold - prevThreshold : 0
  const toNext = next ? next.threshold - balance : 0
  const progressPct = next && span > 0 ? Math.min(100, Math.round(((balance - prevThreshold) / span) * 100)) : 100
  return { current, next, toNext, progressPct }
}

export interface CoinWallet {
  balance: number
  transactions: LingaCoinTransactionRow[]
  medal: CoinMedalState
}
