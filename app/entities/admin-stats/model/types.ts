export interface AdminKpi {
  totalStudents: number
  activeStudents7d: number
  totalTeachers: number
  totalGroups: number
  currentMonthMedals: { gold: number, silver: number, bronze: number }
  pendingPayouts: number
  pendingPayoutsAmount: number
  newStudents30d: number
}

export interface AdminStudent {
  id: string
  userId: string
  name: string
  surname: string
  patronymic: string | null
  email: string
  phone: string | null
  avatarUrl: string | null
  iin: string | null
  initialPassword: string | null
  birthdate: string | null
  level: string
  schoolGrade: number | null
  totalXp: number
  dailyStreak: number
  goldStreak: number
  totalEarnings: number
  lastActiveDate: string | null
  createdAt: string
  groupCount: number
}

export interface AdminTeacher {
  id: string
  userId: string
  name: string
  surname: string
  email: string
  phone: string | null
  avatarUrl: string | null
  bio: string | null
  yearsOfExperience: number | null
  specialization: string | null
  category: string | null
  rating: number
  reviewCount: number
  groupCount: number
  studentCount: number
  createdAt: string
}

export interface AdminGroup {
  id: string
  name: string
  level: string
  teacherId: string
  teacherName: string
  branchId: string | null
  schedule: Record<string, unknown>
  maxStudents: number
  studentCount: number
  createdAt: string
  archivedAt: string | null
}

export interface AdminMedal {
  id: string
  studentId: string
  studentName: string
  studentSurname: string
  month: string
  averageGrade: number
  medal: 'GOLD' | 'SILVER' | 'BRONZE' | 'NONE'
  payout: number
  confirmedAt: string | null
  confirmedBy: string | null
  payoutStatus: string | null
  payoutId: string | null
}

export interface AdminPayout {
  id: string
  studentId: string
  studentName: string
  studentSurname: string
  amount: number
  status: string
  method: string | null
  kind: string | null
  paidAt: string | null
  createdAt: string
}

export interface XpChartPoint {
  date: string
  xp: number
}
