import type { Database } from '~/shared/types/database.types'
import type { UiColor } from '~/shared/types/common'

export type { UiColor }

type Tables = Database['public']['Tables']
export type LeadRow = Tables['Lead']['Row']
export type LeadInsert = Tables['Lead']['Insert']
export type LeadUpdate = Tables['Lead']['Update']
export type LeadStageHistoryRow = Tables['LeadStageHistory']['Row']

export type LeadStage = Database['public']['Enums']['LeadStage']
export type LeadSource = Database['public']['Enums']['LeadSource']

export interface LeadStageMeta {
  value: LeadStage
  label: string
  color: UiColor
  icon: string
}

/**
 * Воронка продаж (ТЗ). Порядок = порядок колонок на канбан-доске.
 * ACTIVE = сконвертированный клиент (вкладка «Клиенты»).
 */
export const LEAD_STAGES: readonly LeadStageMeta[] = [
  { value: 'NEW', label: 'Лид', color: 'neutral', icon: 'i-lucide-user-plus' },
  { value: 'CONTACTED', label: 'Установлен контакт', color: 'info', icon: 'i-lucide-phone-call' },
  { value: 'TRIAL', label: 'Пробный урок', color: 'primary', icon: 'i-lucide-graduation-cap' },
  { value: 'NO_SHOW', label: 'Не пришёл, перезаписать', color: 'warning', icon: 'i-lucide-user-x' },
  { value: 'SCHEDULE_MISMATCH_KIDS', label: 'Расписание (дети)', color: 'warning', icon: 'i-lucide-calendar-x' },
  { value: 'SCHEDULE_MISMATCH_ADULTS', label: 'Расписание (взрослые)', color: 'warning', icon: 'i-lucide-calendar-x' },
  { value: 'TOO_EXPENSIVE', label: 'Дорого', color: 'error', icon: 'i-lucide-banknote' },
  { value: 'LEFT_TO_COMPETITOR', label: 'Ушёл к конкуренту', color: 'error', icon: 'i-lucide-log-out' },
  { value: 'CONTACT_LATER', label: 'Связаться позже', color: 'info', icon: 'i-lucide-clock' },
  { value: 'THINKING', label: 'Думает', color: 'info', icon: 'i-lucide-brain' },
  { value: 'PAYMENT', label: 'Оплата', color: 'success', icon: 'i-lucide-credit-card' },
  { value: 'ACTIVE', label: 'Активный ученик', color: 'success', icon: 'i-lucide-circle-check-big' }
]

export const LEAD_STAGE_MAP: Record<LeadStage, LeadStageMeta>
  = Object.fromEntries(LEAD_STAGES.map(s => [s.value, s])) as Record<LeadStage, LeadStageMeta>

export interface LeadSourceMeta {
  value: LeadSource
  label: string
  icon: string
}

export const LEAD_SOURCES: readonly LeadSourceMeta[] = [
  { value: 'INSTAGRAM', label: 'Instagram', icon: 'i-simple-icons-instagram' },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: 'i-simple-icons-whatsapp' },
  { value: 'TELEGRAM', label: 'Telegram', icon: 'i-simple-icons-telegram' },
  { value: 'REFERRAL', label: 'Рекомендация', icon: 'i-lucide-users' },
  { value: 'WEBSITE', label: 'Сайт', icon: 'i-lucide-globe' },
  { value: 'CALL', label: 'Звонок', icon: 'i-lucide-phone' },
  { value: 'WALK_IN', label: 'Пришёл сам', icon: 'i-lucide-door-open' },
  { value: 'ADVERTISING', label: 'Реклама', icon: 'i-lucide-megaphone' },
  { value: 'OTHER', label: 'Другое', icon: 'i-lucide-help-circle' }
]

export const LEAD_SOURCE_MAP: Record<LeadSource, LeadSourceMeta>
  = Object.fromEntries(LEAD_SOURCES.map(s => [s.value, s])) as Record<LeadSource, LeadSourceMeta>

/** Lead joined with responsible manager / branch / trial teacher for lists & board. */
export interface LeadWithRelations extends LeadRow {
  responsible: { id: string, name: string, surname: string } | null
  branch: { id: string, name: string } | null
  trialTeacher: { id: string, user: { name: string, surname: string } | null } | null
}

/** Simple admin option for the responsible/assignee pickers. */
export interface AdminOption {
  id: string
  name: string
  surname: string
}
