import type { Database } from '~/shared/types/database.types'

type Tables = Database['public']['Tables']
type BranchRow = Tables['Branch']['Row']
type GroupRow = Tables['Group']['Row']

export interface FlatTeacher {
  id: string
  name: string
  surname: string
  avatarUrl: string | null
  bio: string | null
  yearsOfExperience: number | null
}

export interface ScheduleSlot {
  weekday: number
  startTime: string
  durationMin: number
}

export type StudentGroup = Omit<GroupRow, 'schedule'> & {
  teacher: FlatTeacher | null
  branch: BranchRow | null
  studentsCount: number
  // Group.schedule is freeform jsonb in the DB; the composable normalizes it
  // to a uniform slot array so every student page can iterate it safely.
  schedule: ScheduleSlot[]
}

export interface Classmate {
  studentId: string
  userId: string
  name: string
  surname: string
  avatarUrl: string | null
  initials: string
}
