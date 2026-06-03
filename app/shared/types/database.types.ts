export type Json
  = | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      Attendance: {
        Row: { lessonId: string, markedAt: string, markedBy: string | null, status: Database['public']['Enums']['AttendanceStatus'], studentId: string }
        Insert: { lessonId: string, markedAt?: string, markedBy?: string | null, status?: Database['public']['Enums']['AttendanceStatus'], studentId: string }
        Update: { lessonId?: string, markedAt?: string, markedBy?: string | null, status?: Database['public']['Enums']['AttendanceStatus'], studentId?: string }
      }
      Branch: {
        Row: { address: string | null, city: string | null, createdAt: string, id: string, kind: Database['public']['Enums']['BranchKind'], name: string }
        Insert: { address?: string | null, city?: string | null, createdAt?: string, id?: string, kind: Database['public']['Enums']['BranchKind'], name: string }
        Update: { address?: string | null, city?: string | null, createdAt?: string, id?: string, kind?: Database['public']['Enums']['BranchKind'], name?: string }
      }
      Conversation: {
        Row: { createdAt: string, groupId: string | null, id: string, kind: Database['public']['Enums']['ConversationKind'], participantIds: string[], updatedAt: string }
        Insert: { createdAt?: string, groupId?: string | null, id?: string, kind?: Database['public']['Enums']['ConversationKind'], participantIds: string[], updatedAt?: string }
        Update: { createdAt?: string, groupId?: string | null, id?: string, kind?: Database['public']['Enums']['ConversationKind'], participantIds?: string[], updatedAt?: string }
      }
      GameAttempt: {
        Row: { answersGiven: Json, attemptedAt: string, correctCount: number, id: string, levelId: string, levelOrder: number, levelTitle: string, passed: boolean, questionsAsked: Json, scorePct: number, studentId: string, totalCount: number }
        Insert: { answersGiven: Json, attemptedAt?: string, correctCount: number, id?: string, levelId: string, levelOrder: number, levelTitle: string, passed: boolean, questionsAsked: Json, scorePct: number, studentId: string, totalCount: number }
        Update: { answersGiven?: Json, attemptedAt?: string, correctCount?: number, id?: string, levelId?: string, levelOrder?: number, levelTitle?: string, passed?: boolean, questionsAsked?: Json, scorePct?: number, studentId?: string, totalCount?: number }
      }
      Grade: {
        Row: { comment: string | null, gradedAt: string, gradedBy: string | null, lessonId: string, studentId: string, value: number }
        Insert: { comment?: string | null, gradedAt?: string, gradedBy?: string | null, lessonId: string, studentId: string, value: number }
        Update: { comment?: string | null, gradedAt?: string, gradedBy?: string | null, lessonId?: string, studentId?: string, value?: number }
      }
      Group: {
        Row: { branchId: string, createdAt: string, id: string, level: Database['public']['Enums']['EnglishLevel'], maxStudents: number, name: string, schedule: Json, teacherId: string, updatedAt: string }
        Insert: { branchId: string, createdAt?: string, id?: string, level: Database['public']['Enums']['EnglishLevel'], maxStudents?: number, name: string, schedule?: Json, teacherId: string, updatedAt?: string }
        Update: { branchId?: string, createdAt?: string, id?: string, level?: Database['public']['Enums']['EnglishLevel'], maxStudents?: number, name?: string, schedule?: Json, teacherId?: string, updatedAt?: string }
      }
      GroupMember: {
        Row: { groupId: string, joinedAt: string, status: Database['public']['Enums']['GroupMemberStatus'], studentId: string }
        Insert: { groupId: string, joinedAt?: string, status?: Database['public']['Enums']['GroupMemberStatus'], studentId: string }
        Update: { groupId?: string, joinedAt?: string, status?: Database['public']['Enums']['GroupMemberStatus'], studentId?: string }
      }
      Homework: {
        Row: { createdAt: string, description: string | null, dueAt: string, format: Database['public']['Enums']['HomeworkFormat'], id: string, lessonId: string, maxScore: number, payload: Json, title: string }
        Insert: { createdAt?: string, description?: string | null, dueAt: string, format: Database['public']['Enums']['HomeworkFormat'], id?: string, lessonId: string, maxScore?: number, payload?: Json, title: string }
        Update: { createdAt?: string, description?: string | null, dueAt?: string, format?: Database['public']['Enums']['HomeworkFormat'], id?: string, lessonId?: string, maxScore?: number, payload?: Json, title?: string }
      }
      HomeworkSubmission: {
        Row: { aiFeedback: Json | null, aiScore: number | null, answers: Json | null, audioUrl: string | null, checkedAt: string | null, createdAt: string, fileUrl: string | null, homeworkId: string, id: string, status: Database['public']['Enums']['HomeworkStatus'], studentId: string, submittedAt: string | null, teacherComment: string | null, teacherGrade: number | null, updatedAt: string }
        Insert: { aiFeedback?: Json | null, aiScore?: number | null, answers?: Json | null, audioUrl?: string | null, checkedAt?: string | null, createdAt?: string, fileUrl?: string | null, homeworkId: string, id?: string, status?: Database['public']['Enums']['HomeworkStatus'], studentId: string, submittedAt?: string | null, teacherComment?: string | null, teacherGrade?: number | null, updatedAt?: string }
        Update: { aiFeedback?: Json | null, aiScore?: number | null, answers?: Json | null, audioUrl?: string | null, checkedAt?: string | null, createdAt?: string, fileUrl?: string | null, homeworkId?: string, id?: string, status?: Database['public']['Enums']['HomeworkStatus'], studentId?: string, submittedAt?: string | null, teacherComment?: string | null, teacherGrade?: number | null, updatedAt?: string }
      }
      Lesson: {
        Row: { createdAt: string, durationMin: number, groupId: string, id: string, meetingUrl: string | null, recordingUrl: string | null, startsAt: string, status: Database['public']['Enums']['LessonStatus'], topic: string, updatedAt: string }
        Insert: { createdAt?: string, durationMin?: number, groupId: string, id?: string, meetingUrl?: string | null, recordingUrl?: string | null, startsAt: string, status?: Database['public']['Enums']['LessonStatus'], topic?: string, updatedAt?: string }
        Update: { createdAt?: string, durationMin?: number, groupId?: string, id?: string, meetingUrl?: string | null, recordingUrl?: string | null, startsAt?: string, status?: Database['public']['Enums']['LessonStatus'], topic?: string, updatedAt?: string }
      }
      Material: {
        Row: { createdAt: string, description: string | null, durationSec: number | null, groupId: string | null, id: string, kind: Database['public']['Enums']['MaterialKind'], lessonId: string | null, tag: string | null, title: string, url: string }
        Insert: { createdAt?: string, description?: string | null, durationSec?: number | null, groupId?: string | null, id?: string, kind: Database['public']['Enums']['MaterialKind'], lessonId?: string | null, tag?: string | null, title: string, url: string }
        Update: { createdAt?: string, description?: string | null, durationSec?: number | null, groupId?: string | null, id?: string, kind?: Database['public']['Enums']['MaterialKind'], lessonId?: string | null, tag?: string | null, title?: string, url?: string }
      }
      Message: {
        Row: { attachments: Json | null, body: string, conversationId: string, createdAt: string, id: string, readBy: string[], senderId: string }
        Insert: { attachments?: Json | null, body: string, conversationId: string, createdAt?: string, id?: string, readBy?: string[], senderId: string }
        Update: { attachments?: Json | null, body?: string, conversationId?: string, createdAt?: string, id?: string, readBy?: string[], senderId?: string }
      }
      MonthlyMedal: {
        Row: { averageGrade: number, confirmedAt: string, confirmedBy: string | null, id: string, medal: Database['public']['Enums']['MedalKind'], month: string, payout: number, studentId: string }
        Insert: { averageGrade: number, confirmedAt?: string, confirmedBy?: string | null, id?: string, medal: Database['public']['Enums']['MedalKind'], month: string, payout?: number, studentId: string }
        Update: { averageGrade?: number, confirmedAt?: string, confirmedBy?: string | null, id?: string, medal?: Database['public']['Enums']['MedalKind'], month?: string, payout?: number, studentId?: string }
      }
      Notification: {
        Row: { body: string | null, createdAt: string, id: string, isRead: boolean, payload: Json | null, title: string, type: Database['public']['Enums']['NotificationType'], userId: string }
        Insert: { body?: string | null, createdAt?: string, id?: string, isRead?: boolean, payload?: Json | null, title: string, type: Database['public']['Enums']['NotificationType'], userId: string }
        Update: { body?: string | null, createdAt?: string, id?: string, isRead?: boolean, payload?: Json | null, title?: string, type?: Database['public']['Enums']['NotificationType'], userId?: string }
      }
      Parent: {
        Row: { createdAt: string, id: string, updatedAt: string, userId: string }
        Insert: { createdAt?: string, id?: string, updatedAt?: string, userId: string }
        Update: { createdAt?: string, id?: string, updatedAt?: string, userId?: string }
      }
      Payout: {
        Row: { amount: number, createdAt: string, id: string, kind: string, medalId: string | null, method: string | null, paidAt: string | null, status: Database['public']['Enums']['PayoutStatus'], studentId: string }
        Insert: { amount: number, createdAt?: string, id?: string, kind?: string, medalId?: string | null, method?: string | null, paidAt?: string | null, status?: Database['public']['Enums']['PayoutStatus'], studentId: string }
        Update: { amount?: number, createdAt?: string, id?: string, kind?: string, medalId?: string | null, method?: string | null, paidAt?: string | null, status?: Database['public']['Enums']['PayoutStatus'], studentId?: string }
      }
      PracticeAttempt: {
        Row: { attemptedAt: string, cardId: string, deckId: string, id: string, score: number, studentId: string, target: string, transcript: string }
        Insert: { attemptedAt?: string, cardId: string, deckId: string, id?: string, score: number, studentId: string, target: string, transcript: string }
        Update: { attemptedAt?: string, cardId?: string, deckId?: string, id?: string, score?: number, studentId?: string, target?: string, transcript?: string }
      }
      StoryAttempt: {
        Row: { attemptedAt: string, comprehensionScore: number, id: string, keyPointsCovered: number, keyPointsTotal: number, storyId: string, storyLevel: string, storyTitle: string, studentId: string, transcript: string }
        Insert: { attemptedAt?: string, comprehensionScore: number, id?: string, keyPointsCovered: number, keyPointsTotal: number, storyId: string, storyLevel: string, storyTitle: string, studentId: string, transcript: string }
        Update: { attemptedAt?: string, comprehensionScore?: number, id?: string, keyPointsCovered?: number, keyPointsTotal?: number, storyId?: string, storyLevel?: string, storyTitle?: string, studentId?: string, transcript?: string }
      }
      Student: {
        Row: { createdAt: string, dailyStreak: number, goldStreak: number, id: string, lastActiveDate: string | null, level: Database['public']['Enums']['EnglishLevel'], schoolGrade: number | null, totalEarnings: number, totalXp: number, updatedAt: string, userId: string }
        Insert: { createdAt?: string, dailyStreak?: number, goldStreak?: number, id?: string, lastActiveDate?: string | null, level?: Database['public']['Enums']['EnglishLevel'], schoolGrade?: number | null, totalEarnings?: number, totalXp?: number, updatedAt?: string, userId: string }
        Update: { createdAt?: string, dailyStreak?: number, goldStreak?: number, id?: string, lastActiveDate?: string | null, level?: Database['public']['Enums']['EnglishLevel'], schoolGrade?: number | null, totalEarnings?: number, totalXp?: number, updatedAt?: string, userId?: string }
      }
      Teacher: {
        Row: { bio: string | null, createdAt: string, id: string, rating: number, reviewCount: number, updatedAt: string, userId: string, yearsOfExperience: number }
        Insert: { bio?: string | null, createdAt?: string, id?: string, rating?: number, reviewCount?: number, updatedAt?: string, userId: string, yearsOfExperience?: number }
        Update: { bio?: string | null, createdAt?: string, id?: string, rating?: number, reviewCount?: number, updatedAt?: string, userId?: string, yearsOfExperience?: number }
      }
      User: {
        Row: { authId: string, avatarUrl: string | null, createdAt: string, email: string, id: string, name: string, phone: string | null, role: Database['public']['Enums']['UserRole'], status: Database['public']['Enums']['UserStatus'], surname: string, updatedAt: string }
        Insert: { authId: string, avatarUrl?: string | null, createdAt?: string, email: string, id?: string, name: string, phone?: string | null, role: Database['public']['Enums']['UserRole'], status?: Database['public']['Enums']['UserStatus'], surname: string, updatedAt?: string }
        Update: { authId?: string, avatarUrl?: string | null, createdAt?: string, email?: string, id?: string, name?: string, phone?: string | null, role?: Database['public']['Enums']['UserRole'], status?: Database['public']['Enums']['UserStatus'], surname?: string, updatedAt?: string }
      }
      VocabularyEntry: {
        Row: { addedAt: string, bestScore: number, example: string | null, id: string, ipa: string | null, reviewCount: number, studentId: string, translation: string, word: string }
        Insert: { addedAt?: string, bestScore?: number, example?: string | null, id?: string, ipa?: string | null, reviewCount?: number, studentId: string, translation: string, word: string }
        Update: { addedAt?: string, bestScore?: number, example?: string | null, id?: string, ipa?: string | null, reviewCount?: number, studentId?: string, translation?: string, word?: string }
      }
      XpLog: {
        Row: { action: Database['public']['Enums']['XpActionKind'], amount: number, createdAt: string, id: string, refId: string | null, studentId: string }
        Insert: { action: Database['public']['Enums']['XpActionKind'], amount: number, createdAt?: string, id?: string, refId?: string | null, studentId: string }
        Update: { action?: Database['public']['Enums']['XpActionKind'], amount?: number, createdAt?: string, id?: string, refId?: string | null, studentId?: string }
      }
    }
    Enums: {
      AttendanceStatus: 'PRESENT' | 'ABSENT' | 'LATE'
      BranchKind: 'OFFLINE' | 'ONLINE'
      ConversationKind: 'DIRECT' | 'GROUP'
      EnglishLevel: 'A1' | 'A2' | 'S1' | 'S2' | 'B2' | 'F1' | 'F2' | 'F3' | 'F4'
      GroupMemberStatus: 'ACTIVE' | 'LEFT'
      HomeworkFormat: 'TEST' | 'INPUT' | 'TEXT' | 'ORAL' | 'FILE' | 'INTERACTIVE'
      HomeworkStatus: 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'CHECKED' | 'OVERDUE'
      LessonStatus: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
      MaterialKind: 'AUDIO' | 'VIDEO' | 'PDF' | 'LINK'
      MedalKind: 'GOLD' | 'SILVER' | 'BRONZE' | 'NONE'
      NotificationType: 'MEDAL_AWARDED' | 'PAYOUT_RECEIVED' | 'HOMEWORK_CHECKED' | 'LESSON_REMINDER' | 'NEW_MESSAGE' | 'SYSTEM'
      PayoutStatus: 'PENDING' | 'PAID' | 'CANCELLED'
      UserRole: 'STUDENT' | 'PARENT' | 'TUTOR' | 'TEACHER' | 'ADMIN'
      UserStatus: 'ACTIVE' | 'INACTIVE' | 'BANNED'
      XpActionKind: 'PRACTICE_CARD' | 'PRACTICE_DECK' | 'HOMEWORK_ONTIME' | 'LESSON_ATTENDED' | 'DAILY_QUEST' | 'MANUAL_AWARD' | 'STORY_RETELL' | 'GAME_LEVEL'
    }
    Views: { [_ in never]: never }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }, Returns: Json }
      get_current_role: { Args: never, Returns: Database['public']['Enums']['UserRole'] }
      get_current_student_group_ids: { Args: never, Returns: string[] }
      get_current_student_id: { Args: never, Returns: string }
      get_current_teacher_group_ids: { Args: never, Returns: string[] }
      get_current_teacher_id: { Args: never, Returns: string }
      get_current_teacher_lesson_ids: { Args: never, Returns: string[] }
      get_current_user_id: { Args: never, Returns: string }
    }
    CompositeTypes: { [_ in never]: never }
  }
}
