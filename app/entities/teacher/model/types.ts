export interface TeacherProfile {
  id: string
  userId: string
  name: string
  surname: string
  email: string
  avatarUrl: string | null
  bio: string | null
  rating: number
  yearsOfExperience: number
}

export interface TeacherGroup {
  id: string
  name: string
  level: string
  maxStudents: number
  studentCount: number
  schedule: Record<string, unknown>
  branchId: string
  createdAt: string
}

export interface TeacherStudent {
  studentId: string
  userId: string
  name: string
  surname: string
  email: string
  avatarUrl: string | null
  level: string
  totalXp: number
  dailyStreak: number
  goldStreak: number
  totalEarnings: number
  lastActiveDate: string | null
  groupId: string
  groupName: string
}

export interface TeacherLesson {
  id: string
  groupId: string
  groupName: string
  topic: string
  startsAt: string
  status: string
  durationMin: number
  meetingUrl: string | null
  createdAt: string
}

export interface TeacherHomework {
  id: string
  lessonId: string
  lessonTopic: string
  groupId: string
  groupName: string
  format: string
  title: string
  description: string | null
  dueAt: string
  maxScore: number
  createdAt: string
  submittedCount: number
  checkedCount: number
}

export interface TeacherSubmission {
  id: string
  homeworkId: string
  homeworkTitle: string
  homeworkFormat: string
  homeworkMaxScore: number
  lessonId: string
  groupId: string
  groupName: string
  studentId: string
  studentName: string
  studentSurname: string
  studentAvatarUrl: string | null
  status: string
  answers: unknown | null
  audioUrl: string | null
  fileUrl: string | null
  aiScore: number | null
  aiFeedback: unknown | null
  teacherGrade: number | null
  teacherComment: string | null
  submittedAt: string | null
  createdAt: string
}

export interface TeacherGradeRow {
  lessonId: string
  lessonTopic: string
  lessonStartsAt: string
  studentId: string
  studentName: string
  studentSurname: string
  value: number
  comment: string | null
  gradedAt: string
}

export interface TeacherKpi {
  totalStudents: number
  totalGroups: number
  lessonsThisWeek: number
  pendingSubmissions: number
}
