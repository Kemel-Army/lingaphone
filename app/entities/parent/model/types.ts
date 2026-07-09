import type { Database } from '~/shared/types/database.types'

export type AttendanceStatus = Database['public']['Enums']['AttendanceStatus']
export type PaymentStatus = Database['public']['Enums']['PaymentStatus']
export type SubscriptionStatus = Database['public']['Enums']['SubscriptionStatus']

// ─── Admin side ─────────────────────────────────────────────────────
export interface ParentListItem {
  parentId: string
  userId: string
  name: string
  surname: string
  email: string
  phone: string | null
  children: { studentId: string, name: string, surname: string }[]
}

// ─── Parent side (aggregated child view) ────────────────────────────
export interface ChildPayment {
  id: string
  amount: number
  paidAt: string
  status: PaymentStatus
}

export interface ChildAttendanceRow {
  id: string
  status: AttendanceStatus
  markedAt: string
  date: string | null
  topic: string
}

export interface ChildSubscription {
  plan: string
  price: number
  status: SubscriptionStatus
  nextPaymentAt: string | null
  lessonsUsed: number
  lessonsTotal: number
}

export interface ParentChild {
  studentId: string
  name: string
  surname: string
  avatarUrl: string | null
  level: string
  groups: { id: string, name: string }[]
  avgGrade: number
  gradeCount: number
  attendance: { total: number, present: number, absent: number, late: number, pct: number }
  attendanceRows: ChildAttendanceRow[]
  homework: { done: number, total: number }
  subscription: ChildSubscription | null
  payments: ChildPayment[]
}
