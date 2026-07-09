import type { Database } from '~/shared/types/database.types'
import type { UiColor } from '~/shared/types/common'

type Tables = Database['public']['Tables']
export type SubscriptionRow = Tables['Subscription']['Row']
export type SubscriptionInsert = Tables['Subscription']['Insert']
export type SubscriptionUpdate = Tables['Subscription']['Update']
export type PaymentRow = Tables['Payment']['Row']
export type PaymentInsert = Tables['Payment']['Insert']

export type SubscriptionStatus = Database['public']['Enums']['SubscriptionStatus']
export type PaymentStatus = Database['public']['Enums']['PaymentStatus']
export type PaymentMethod = Database['public']['Enums']['PaymentMethod']

interface Meta<T extends string> { value: T, label: string, color: UiColor }

export const SUBSCRIPTION_STATUSES: readonly Meta<SubscriptionStatus>[] = [
  { value: 'ACTIVE', label: 'Активен', color: 'success' },
  { value: 'PAUSED', label: 'Приостановлен', color: 'warning' },
  { value: 'CANCELLED', label: 'Отменён', color: 'error' },
  { value: 'EXPIRED', label: 'Истёк', color: 'neutral' }
]
export const SUBSCRIPTION_STATUS_MAP
  = Object.fromEntries(SUBSCRIPTION_STATUSES.map(s => [s.value, s])) as Record<SubscriptionStatus, Meta<SubscriptionStatus>>

export const PAYMENT_STATUSES: readonly Meta<PaymentStatus>[] = [
  { value: 'COMPLETED', label: 'Оплачен', color: 'success' },
  { value: 'PENDING', label: 'Ожидает', color: 'warning' },
  { value: 'REFUNDED', label: 'Возврат', color: 'neutral' },
  { value: 'FAILED', label: 'Ошибка', color: 'error' }
]
export const PAYMENT_STATUS_MAP
  = Object.fromEntries(PAYMENT_STATUSES.map(s => [s.value, s])) as Record<PaymentStatus, Meta<PaymentStatus>>

export const PAYMENT_METHODS: readonly { value: PaymentMethod, label: string }[] = [
  { value: 'CASH', label: 'Наличные' },
  { value: 'CARD', label: 'Карта' },
  { value: 'KASPI', label: 'Kaspi' },
  { value: 'TRANSFER', label: 'Перевод' },
  { value: 'OTHER', label: 'Другое' }
]
export const PAYMENT_METHOD_MAP
  = Object.fromEntries(PAYMENT_METHODS.map(m => [m.value, m])) as Record<PaymentMethod, { value: PaymentMethod, label: string }>

interface StudentRef { id: string, user: { name: string, surname: string } | null }

export interface PaymentWithStudent extends PaymentRow {
  student: StudentRef | null
}
export interface SubscriptionWithStudent extends SubscriptionRow {
  student: StudentRef | null
}

export interface StudentLite {
  id: string
  name: string
  surname: string
}
