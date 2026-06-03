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
  yearsOfExperience: number
}

export type StudentGroup = GroupRow & {
  teacher: FlatTeacher | null
  branch: BranchRow | null
  studentsCount: number
}

export interface Classmate {
  studentId: string
  userId: string
  name: string
  surname: string
  avatarUrl: string | null
  initials: string
}
