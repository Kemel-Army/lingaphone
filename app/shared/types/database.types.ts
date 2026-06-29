export type Json
  = | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      Achievement: {
        Row: {
          category: string
          condition: Json
          createdAt: string
          description: string
          descriptionKz: string | null
          gemReward: number
          icon: string
          id: string
          isActive: boolean
          isHidden: boolean
          name: string
          nameKz: string | null
          sortOrder: number
          tier: string
          xpReward: number
        }
        Insert: {
          category?: string
          condition: Json
          createdAt?: string
          description: string
          descriptionKz?: string | null
          gemReward?: number
          icon: string
          id?: string
          isActive?: boolean
          isHidden?: boolean
          name: string
          nameKz?: string | null
          sortOrder?: number
          tier?: string
          xpReward?: number
        }
        Update: {
          category?: string
          condition?: Json
          createdAt?: string
          description?: string
          descriptionKz?: string | null
          gemReward?: number
          icon?: string
          id?: string
          isActive?: boolean
          isHidden?: boolean
          name?: string
          nameKz?: string | null
          sortOrder?: number
          tier?: string
          xpReward?: number
        }
        Relationships: []
      }
      Attendance: {
        Row: {
          lessonId: string
          markedAt: string
          markedBy: string | null
          status: Database['public']['Enums']['AttendanceStatus']
          studentId: string
        }
        Insert: {
          lessonId: string
          markedAt?: string
          markedBy?: string | null
          status?: Database['public']['Enums']['AttendanceStatus']
          studentId: string
        }
        Update: {
          lessonId?: string
          markedAt?: string
          markedBy?: string | null
          status?: Database['public']['Enums']['AttendanceStatus']
          studentId?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Attendance_lessonId_fkey'
            columns: ['lessonId']
            isOneToOne: false
            referencedRelation: 'Lesson'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Attendance_markedBy_fkey'
            columns: ['markedBy']
            isOneToOne: false
            referencedRelation: 'Teacher'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Attendance_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      BattleAnswer: {
        Row: {
          answeredAt: string
          chosenIndex: number
          id: string
          isCorrect: boolean
          participantId: string
          pointsEarned: number
          questionId: string
          responseTimeMs: number | null
          sessionId: string
        }
        Insert: {
          answeredAt?: string
          chosenIndex: number
          id?: string
          isCorrect: boolean
          participantId: string
          pointsEarned?: number
          questionId: string
          responseTimeMs?: number | null
          sessionId: string
        }
        Update: {
          answeredAt?: string
          chosenIndex?: number
          id?: string
          isCorrect?: boolean
          participantId?: string
          pointsEarned?: number
          questionId?: string
          responseTimeMs?: number | null
          sessionId?: string
        }
        Relationships: [
          {
            foreignKeyName: 'BattleAnswer_participantId_fkey'
            columns: ['participantId']
            isOneToOne: false
            referencedRelation: 'BattleParticipant'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'BattleAnswer_questionId_fkey'
            columns: ['questionId']
            isOneToOne: false
            referencedRelation: 'BattleQuestion'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'BattleAnswer_sessionId_fkey'
            columns: ['sessionId']
            isOneToOne: false
            referencedRelation: 'BattleSession'
            referencedColumns: ['id']
          }
        ]
      }
      BattleParticipant: {
        Row: {
          avatarEmoji: string
          correctCount: number
          id: string
          isConnected: boolean
          joinedAt: string
          nickname: string
          score: number
          sessionId: string
          streak: number
        }
        Insert: {
          avatarEmoji?: string
          correctCount?: number
          id?: string
          isConnected?: boolean
          joinedAt?: string
          nickname: string
          score?: number
          sessionId: string
          streak?: number
        }
        Update: {
          avatarEmoji?: string
          correctCount?: number
          id?: string
          isConnected?: boolean
          joinedAt?: string
          nickname?: string
          score?: number
          sessionId?: string
          streak?: number
        }
        Relationships: [
          {
            foreignKeyName: 'BattleParticipant_sessionId_fkey'
            columns: ['sessionId']
            isOneToOne: false
            referencedRelation: 'BattleSession'
            referencedColumns: ['id']
          }
        ]
      }
      BattleQuestion: {
        Row: {
          correctIndex: number
          createdAt: string
          explanation: string | null
          gradeLevel: number
          id: string
          isActive: boolean
          options: Json
          text: string
          textKz: string | null
          topic: string
          topicKz: string | null
        }
        Insert: {
          correctIndex: number
          createdAt?: string
          explanation?: string | null
          gradeLevel: number
          id?: string
          isActive?: boolean
          options: Json
          text: string
          textKz?: string | null
          topic: string
          topicKz?: string | null
        }
        Update: {
          correctIndex?: number
          createdAt?: string
          explanation?: string | null
          gradeLevel?: number
          id?: string
          isActive?: boolean
          options?: Json
          text?: string
          textKz?: string | null
          topic?: string
          topicKz?: string | null
        }
        Relationships: []
      }
      BattleSession: {
        Row: {
          createdAt: string
          currentQuestionIndex: number
          endedAt: string | null
          gradeLevel: number
          id: string
          pin: string
          questionIds: Json
          startedAt: string | null
          status: Database['public']['Enums']['BattleStatus']
          teacherId: string | null
          topic: string | null
        }
        Insert: {
          createdAt?: string
          currentQuestionIndex?: number
          endedAt?: string | null
          gradeLevel: number
          id?: string
          pin: string
          questionIds?: Json
          startedAt?: string | null
          status?: Database['public']['Enums']['BattleStatus']
          teacherId?: string | null
          topic?: string | null
        }
        Update: {
          createdAt?: string
          currentQuestionIndex?: number
          endedAt?: string | null
          gradeLevel?: number
          id?: string
          pin?: string
          questionIds?: Json
          startedAt?: string | null
          status?: Database['public']['Enums']['BattleStatus']
          teacherId?: string | null
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'BattleSession_teacherId_fkey'
            columns: ['teacherId']
            isOneToOne: false
            referencedRelation: 'Teacher'
            referencedColumns: ['id']
          }
        ]
      }
      Book: {
        Row: {
          coverUrl: string | null
          createdAt: string
          description: string | null
          id: string
          isPublished: boolean
          level: string
          title: string
        }
        Insert: {
          coverUrl?: string | null
          createdAt?: string
          description?: string | null
          id?: string
          isPublished?: boolean
          level: string
          title: string
        }
        Update: {
          coverUrl?: string | null
          createdAt?: string
          description?: string | null
          id?: string
          isPublished?: boolean
          level?: string
          title?: string
        }
        Relationships: []
      }
      Branch: {
        Row: {
          address: string | null
          city: string | null
          createdAt: string
          id: string
          kind: Database['public']['Enums']['BranchKind']
          name: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          createdAt?: string
          id?: string
          kind: Database['public']['Enums']['BranchKind']
          name: string
        }
        Update: {
          address?: string | null
          city?: string | null
          createdAt?: string
          id?: string
          kind?: Database['public']['Enums']['BranchKind']
          name?: string
        }
        Relationships: []
      }
      Conversation: {
        Row: {
          createdAt: string
          groupId: string | null
          id: string
          kind: Database['public']['Enums']['ConversationKind']
          participantIds: string[]
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          groupId?: string | null
          id?: string
          kind?: Database['public']['Enums']['ConversationKind']
          participantIds: string[]
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          groupId?: string | null
          id?: string
          kind?: Database['public']['Enums']['ConversationKind']
          participantIds?: string[]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Conversation_groupId_fkey'
            columns: ['groupId']
            isOneToOne: false
            referencedRelation: 'Group'
            referencedColumns: ['id']
          }
        ]
      }
      Game: {
        Row: {
          config: Json
          createdAt: string
          id: string
          level: string
          moduleId: string | null
          slug: string
          title: string
        }
        Insert: {
          config?: Json
          createdAt?: string
          id?: string
          level: string
          moduleId?: string | null
          slug: string
          title: string
        }
        Update: {
          config?: Json
          createdAt?: string
          id?: string
          level?: string
          moduleId?: string | null
          slug?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Game_moduleId_fkey'
            columns: ['moduleId']
            isOneToOne: false
            referencedRelation: 'Module'
            referencedColumns: ['id']
          }
        ]
      }
      GameAttempt: {
        Row: {
          answersGiven: Json
          attemptedAt: string
          correctCount: number
          id: string
          levelId: string
          levelOrder: number
          levelTitle: string
          passed: boolean
          questionsAsked: Json
          scorePct: number
          studentId: string
          totalCount: number
        }
        Insert: {
          answersGiven: Json
          attemptedAt?: string
          correctCount: number
          id?: string
          levelId: string
          levelOrder: number
          levelTitle: string
          passed: boolean
          questionsAsked: Json
          scorePct: number
          studentId: string
          totalCount: number
        }
        Update: {
          answersGiven?: Json
          attemptedAt?: string
          correctCount?: number
          id?: string
          levelId?: string
          levelOrder?: number
          levelTitle?: string
          passed?: boolean
          questionsAsked?: Json
          scorePct?: number
          studentId?: string
          totalCount?: number
        }
        Relationships: [
          {
            foreignKeyName: 'GameAttempt_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      GemTransaction: {
        Row: {
          amount: number
          createdAt: string
          description: string | null
          id: string
          sourceId: string | null
          sourceType: Database['public']['Enums']['GemSourceType']
          studentId: string
        }
        Insert: {
          amount: number
          createdAt?: string
          description?: string | null
          id?: string
          sourceId?: string | null
          sourceType: Database['public']['Enums']['GemSourceType']
          studentId: string
        }
        Update: {
          amount?: number
          createdAt?: string
          description?: string | null
          id?: string
          sourceId?: string | null
          sourceType?: Database['public']['Enums']['GemSourceType']
          studentId?: string
        }
        Relationships: [
          {
            foreignKeyName: 'GemTransaction_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      Grade: {
        Row: {
          comment: string | null
          gradedAt: string
          gradedBy: string | null
          lessonId: string
          studentId: string
          value: number
        }
        Insert: {
          comment?: string | null
          gradedAt?: string
          gradedBy?: string | null
          lessonId: string
          studentId: string
          value: number
        }
        Update: {
          comment?: string | null
          gradedAt?: string
          gradedBy?: string | null
          lessonId?: string
          studentId?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: 'Grade_gradedBy_fkey'
            columns: ['gradedBy']
            isOneToOne: false
            referencedRelation: 'Teacher'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Grade_lessonId_fkey'
            columns: ['lessonId']
            isOneToOne: false
            referencedRelation: 'Lesson'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Grade_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      GrammarExercise: {
        Row: {
          answer: string
          hint: string | null
          id: string
          options: Json | null
          order: number
          points: number
          prompt: string
          topicId: string
          type: string
        }
        Insert: {
          answer: string
          hint?: string | null
          id?: string
          options?: Json | null
          order?: number
          points?: number
          prompt: string
          topicId: string
          type: string
        }
        Update: {
          answer?: string
          hint?: string | null
          id?: string
          options?: Json | null
          order?: number
          points?: number
          prompt?: string
          topicId?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'GrammarExercise_topicId_fkey'
            columns: ['topicId']
            isOneToOne: false
            referencedRelation: 'GrammarTopic'
            referencedColumns: ['id']
          }
        ]
      }
      GrammarProgress: {
        Row: {
          attempts: number
          bestScore: number
          completedAt: string | null
          id: string
          lastPracticed: string | null
          mastery: number
          maxScore: number
          studentId: string
          topicId: string
        }
        Insert: {
          attempts?: number
          bestScore?: number
          completedAt?: string | null
          id?: string
          lastPracticed?: string | null
          mastery?: number
          maxScore?: number
          studentId: string
          topicId: string
        }
        Update: {
          attempts?: number
          bestScore?: number
          completedAt?: string | null
          id?: string
          lastPracticed?: string | null
          mastery?: number
          maxScore?: number
          studentId?: string
          topicId?: string
        }
        Relationships: [
          {
            foreignKeyName: 'GrammarProgress_topicId_fkey'
            columns: ['topicId']
            isOneToOne: false
            referencedRelation: 'GrammarTopic'
            referencedColumns: ['id']
          }
        ]
      }
      GrammarTopic: {
        Row: {
          createdAt: string
          id: string
          isPublished: boolean
          level: string
          order: number
          slug: string
          theoryMd: string
          title: string
          videoUrl: string | null
        }
        Insert: {
          createdAt?: string
          id?: string
          isPublished?: boolean
          level: string
          order: number
          slug: string
          theoryMd?: string
          title: string
          videoUrl?: string | null
        }
        Update: {
          createdAt?: string
          id?: string
          isPublished?: boolean
          level?: string
          order?: number
          slug?: string
          theoryMd?: string
          title?: string
          videoUrl?: string | null
        }
        Relationships: []
      }
      Group: {
        Row: {
          branchId: string | null
          createdAt: string
          id: string
          level: Database['public']['Enums']['EnglishLevel']
          maxStudents: number
          name: string
          schedule: Json
          teacherId: string
          updatedAt: string
        }
        Insert: {
          branchId?: string | null
          createdAt?: string
          id?: string
          level: Database['public']['Enums']['EnglishLevel']
          maxStudents?: number
          name: string
          schedule?: Json
          teacherId: string
          updatedAt?: string
        }
        Update: {
          branchId?: string | null
          createdAt?: string
          id?: string
          level?: Database['public']['Enums']['EnglishLevel']
          maxStudents?: number
          name?: string
          schedule?: Json
          teacherId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Group_branchId_fkey'
            columns: ['branchId']
            isOneToOne: false
            referencedRelation: 'Branch'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Group_teacherId_fkey'
            columns: ['teacherId']
            isOneToOne: false
            referencedRelation: 'Teacher'
            referencedColumns: ['id']
          }
        ]
      }
      GroupMember: {
        Row: {
          groupId: string
          joinedAt: string
          status: Database['public']['Enums']['GroupMemberStatus']
          studentId: string
        }
        Insert: {
          groupId: string
          joinedAt?: string
          status?: Database['public']['Enums']['GroupMemberStatus']
          studentId: string
        }
        Update: {
          groupId?: string
          joinedAt?: string
          status?: Database['public']['Enums']['GroupMemberStatus']
          studentId?: string
        }
        Relationships: [
          {
            foreignKeyName: 'GroupMember_groupId_fkey'
            columns: ['groupId']
            isOneToOne: false
            referencedRelation: 'Group'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'GroupMember_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      Homework: {
        Row: {
          createdAt: string
          description: string | null
          dueAt: string
          format: Database['public']['Enums']['HomeworkFormat']
          id: string
          lessonId: string
          maxScore: number
          payload: Json
          title: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          dueAt: string
          format: Database['public']['Enums']['HomeworkFormat']
          id?: string
          lessonId: string
          maxScore?: number
          payload?: Json
          title: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          dueAt?: string
          format?: Database['public']['Enums']['HomeworkFormat']
          id?: string
          lessonId?: string
          maxScore?: number
          payload?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Homework_lessonId_fkey'
            columns: ['lessonId']
            isOneToOne: false
            referencedRelation: 'Lesson'
            referencedColumns: ['id']
          }
        ]
      }
      HomeworkSubmission: {
        Row: {
          aiFeedback: Json | null
          aiScore: number | null
          answers: Json | null
          audioUrl: string | null
          checkedAt: string | null
          createdAt: string
          fileUrl: string | null
          homeworkId: string
          id: string
          status: Database['public']['Enums']['HomeworkStatus']
          studentId: string
          submittedAt: string | null
          teacherComment: string | null
          teacherGrade: number | null
          updatedAt: string
        }
        Insert: {
          aiFeedback?: Json | null
          aiScore?: number | null
          answers?: Json | null
          audioUrl?: string | null
          checkedAt?: string | null
          createdAt?: string
          fileUrl?: string | null
          homeworkId: string
          id?: string
          status?: Database['public']['Enums']['HomeworkStatus']
          studentId: string
          submittedAt?: string | null
          teacherComment?: string | null
          teacherGrade?: number | null
          updatedAt?: string
        }
        Update: {
          aiFeedback?: Json | null
          aiScore?: number | null
          answers?: Json | null
          audioUrl?: string | null
          checkedAt?: string | null
          createdAt?: string
          fileUrl?: string | null
          homeworkId?: string
          id?: string
          status?: Database['public']['Enums']['HomeworkStatus']
          studentId?: string
          submittedAt?: string | null
          teacherComment?: string | null
          teacherGrade?: number | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'HomeworkSubmission_homeworkId_fkey'
            columns: ['homeworkId']
            isOneToOne: false
            referencedRelation: 'Homework'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'HomeworkSubmission_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      Lesson: {
        Row: {
          createdAt: string
          durationMin: number
          groupId: string
          id: string
          meetingUrl: string | null
          recordingUrl: string | null
          startsAt: string
          status: Database['public']['Enums']['LessonStatus']
          topic: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          durationMin?: number
          groupId: string
          id?: string
          meetingUrl?: string | null
          recordingUrl?: string | null
          startsAt: string
          status?: Database['public']['Enums']['LessonStatus']
          topic?: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          durationMin?: number
          groupId?: string
          id?: string
          meetingUrl?: string | null
          recordingUrl?: string | null
          startsAt?: string
          status?: Database['public']['Enums']['LessonStatus']
          topic?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Lesson_groupId_fkey'
            columns: ['groupId']
            isOneToOne: false
            referencedRelation: 'Group'
            referencedColumns: ['id']
          }
        ]
      }
      Material: {
        Row: {
          createdAt: string
          description: string | null
          durationSec: number | null
          groupId: string | null
          id: string
          kind: Database['public']['Enums']['MaterialKind']
          lessonId: string | null
          tag: string | null
          title: string
          url: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          durationSec?: number | null
          groupId?: string | null
          id?: string
          kind: Database['public']['Enums']['MaterialKind']
          lessonId?: string | null
          tag?: string | null
          title: string
          url: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          durationSec?: number | null
          groupId?: string | null
          id?: string
          kind?: Database['public']['Enums']['MaterialKind']
          lessonId?: string | null
          tag?: string | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Material_groupId_fkey'
            columns: ['groupId']
            isOneToOne: false
            referencedRelation: 'Group'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Material_lessonId_fkey'
            columns: ['lessonId']
            isOneToOne: false
            referencedRelation: 'Lesson'
            referencedColumns: ['id']
          }
        ]
      }
      Message: {
        Row: {
          attachments: Json | null
          body: string
          conversationId: string
          createdAt: string
          id: string
          readBy: string[]
          senderId: string
        }
        Insert: {
          attachments?: Json | null
          body: string
          conversationId: string
          createdAt?: string
          id?: string
          readBy?: string[]
          senderId: string
        }
        Update: {
          attachments?: Json | null
          body?: string
          conversationId?: string
          createdAt?: string
          id?: string
          readBy?: string[]
          senderId?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Message_conversationId_fkey'
            columns: ['conversationId']
            isOneToOne: false
            referencedRelation: 'Conversation'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Message_senderId_fkey'
            columns: ['senderId']
            isOneToOne: false
            referencedRelation: 'User'
            referencedColumns: ['id']
          }
        ]
      }
      Module: {
        Row: {
          bookId: string
          createdAt: string
          id: string
          order: number
          pdfUrl: string | null
          title: string
        }
        Insert: {
          bookId: string
          createdAt?: string
          id?: string
          order?: number
          pdfUrl?: string | null
          title: string
        }
        Update: {
          bookId?: string
          createdAt?: string
          id?: string
          order?: number
          pdfUrl?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Module_bookId_fkey'
            columns: ['bookId']
            isOneToOne: false
            referencedRelation: 'Book'
            referencedColumns: ['id']
          }
        ]
      }
      MonthlyMedal: {
        Row: {
          averageGrade: number
          confirmedAt: string
          confirmedBy: string | null
          id: string
          medal: Database['public']['Enums']['MedalKind']
          month: string
          payout: number
          studentId: string
        }
        Insert: {
          averageGrade: number
          confirmedAt?: string
          confirmedBy?: string | null
          id?: string
          medal: Database['public']['Enums']['MedalKind']
          month: string
          payout?: number
          studentId: string
        }
        Update: {
          averageGrade?: number
          confirmedAt?: string
          confirmedBy?: string | null
          id?: string
          medal?: Database['public']['Enums']['MedalKind']
          month?: string
          payout?: number
          studentId?: string
        }
        Relationships: [
          {
            foreignKeyName: 'MonthlyMedal_confirmedBy_fkey'
            columns: ['confirmedBy']
            isOneToOne: false
            referencedRelation: 'Teacher'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'MonthlyMedal_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      Notification: {
        Row: {
          body: string | null
          createdAt: string
          id: string
          isRead: boolean
          payload: Json | null
          title: string
          type: Database['public']['Enums']['NotificationType']
          userId: string
        }
        Insert: {
          body?: string | null
          createdAt?: string
          id?: string
          isRead?: boolean
          payload?: Json | null
          title: string
          type: Database['public']['Enums']['NotificationType']
          userId: string
        }
        Update: {
          body?: string | null
          createdAt?: string
          id?: string
          isRead?: boolean
          payload?: Json | null
          title?: string
          type?: Database['public']['Enums']['NotificationType']
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Notification_userId_fkey'
            columns: ['userId']
            isOneToOne: false
            referencedRelation: 'User'
            referencedColumns: ['id']
          }
        ]
      }
      Parent: {
        Row: {
          createdAt: string
          id: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          id?: string
          updatedAt?: string
          userId: string
        }
        Update: {
          createdAt?: string
          id?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Parent_userId_fkey'
            columns: ['userId']
            isOneToOne: true
            referencedRelation: 'User'
            referencedColumns: ['id']
          }
        ]
      }
      Payout: {
        Row: {
          amount: number
          createdAt: string
          id: string
          kind: string
          medalId: string | null
          method: string | null
          paidAt: string | null
          status: Database['public']['Enums']['PayoutStatus']
          studentId: string
        }
        Insert: {
          amount: number
          createdAt?: string
          id?: string
          kind?: string
          medalId?: string | null
          method?: string | null
          paidAt?: string | null
          status?: Database['public']['Enums']['PayoutStatus']
          studentId: string
        }
        Update: {
          amount?: number
          createdAt?: string
          id?: string
          kind?: string
          medalId?: string | null
          method?: string | null
          paidAt?: string | null
          status?: Database['public']['Enums']['PayoutStatus']
          studentId?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Payout_medalId_fkey'
            columns: ['medalId']
            isOneToOne: false
            referencedRelation: 'MonthlyMedal'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Payout_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      PracticeAttempt: {
        Row: {
          attemptedAt: string
          cardId: string
          deckId: string
          id: string
          score: number
          studentId: string
          target: string
          transcript: string
        }
        Insert: {
          attemptedAt?: string
          cardId: string
          deckId: string
          id?: string
          score: number
          studentId: string
          target: string
          transcript: string
        }
        Update: {
          attemptedAt?: string
          cardId?: string
          deckId?: string
          id?: string
          score?: number
          studentId?: string
          target?: string
          transcript?: string
        }
        Relationships: [
          {
            foreignKeyName: 'PracticeAttempt_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      Quest: {
        Row: {
          createdAt: string
          description: string | null
          descriptionKz: string | null
          gemReward: number
          icon: string
          id: string
          isActive: boolean
          isTemplate: boolean
          period: Database['public']['Enums']['QuestPeriod']
          target: number
          title: string
          titleKz: string | null
          type: Database['public']['Enums']['QuestType']
          xpReward: number
        }
        Insert: {
          createdAt?: string
          description?: string | null
          descriptionKz?: string | null
          gemReward?: number
          icon?: string
          id?: string
          isActive?: boolean
          isTemplate?: boolean
          period?: Database['public']['Enums']['QuestPeriod']
          target?: number
          title: string
          titleKz?: string | null
          type: Database['public']['Enums']['QuestType']
          xpReward?: number
        }
        Update: {
          createdAt?: string
          description?: string | null
          descriptionKz?: string | null
          gemReward?: number
          icon?: string
          id?: string
          isActive?: boolean
          isTemplate?: boolean
          period?: Database['public']['Enums']['QuestPeriod']
          target?: number
          title?: string
          titleKz?: string | null
          type?: Database['public']['Enums']['QuestType']
          xpReward?: number
        }
        Relationships: []
      }
      ReadingProgress: {
        Row: {
          completedAt: string | null
          id: string
          maxScore: number
          score: number
          studentId: string
          textId: string
          xpEarned: number
        }
        Insert: {
          completedAt?: string | null
          id?: string
          maxScore?: number
          score?: number
          studentId: string
          textId: string
          xpEarned?: number
        }
        Update: {
          completedAt?: string | null
          id?: string
          maxScore?: number
          score?: number
          studentId?: string
          textId?: string
          xpEarned?: number
        }
        Relationships: [
          {
            foreignKeyName: 'ReadingProgress_textId_fkey'
            columns: ['textId']
            isOneToOne: false
            referencedRelation: 'ReadingText'
            referencedColumns: ['id']
          }
        ]
      }
      ReadingQuestion: {
        Row: {
          answer: string
          id: string
          options: Json | null
          order: number
          points: number
          question: string
          textId: string
          type: string
        }
        Insert: {
          answer: string
          id?: string
          options?: Json | null
          order?: number
          points?: number
          question: string
          textId: string
          type: string
        }
        Update: {
          answer?: string
          id?: string
          options?: Json | null
          order?: number
          points?: number
          question?: string
          textId?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ReadingQuestion_textId_fkey'
            columns: ['textId']
            isOneToOne: false
            referencedRelation: 'ReadingText'
            referencedColumns: ['id']
          }
        ]
      }
      ReadingText: {
        Row: {
          audioUrl: string | null
          body: string
          createdAt: string
          genre: string
          id: string
          imageUrl: string | null
          isPublished: boolean
          level: string
          title: string
          topic: string | null
          vocabulary: Json
          wordCount: number | null
        }
        Insert: {
          audioUrl?: string | null
          body: string
          createdAt?: string
          genre: string
          id?: string
          imageUrl?: string | null
          isPublished?: boolean
          level: string
          title: string
          topic?: string | null
          vocabulary?: Json
          wordCount?: number | null
        }
        Update: {
          audioUrl?: string | null
          body?: string
          createdAt?: string
          genre?: string
          id?: string
          imageUrl?: string | null
          isPublished?: boolean
          level?: string
          title?: string
          topic?: string | null
          vocabulary?: Json
          wordCount?: number | null
        }
        Relationships: []
      }
      ShopItem: {
        Row: {
          category: Database['public']['Enums']['ShopCategory']
          createdAt: string
          description: string | null
          descriptionKz: string | null
          effect: Json | null
          icon: string
          id: string
          isActive: boolean
          isLimited: boolean
          maxOwnable: number
          name: string
          nameKz: string | null
          price: number
          requiredLevel: number
          sortOrder: number
        }
        Insert: {
          category: Database['public']['Enums']['ShopCategory']
          createdAt?: string
          description?: string | null
          descriptionKz?: string | null
          effect?: Json | null
          icon?: string
          id?: string
          isActive?: boolean
          isLimited?: boolean
          maxOwnable?: number
          name: string
          nameKz?: string | null
          price: number
          requiredLevel?: number
          sortOrder?: number
        }
        Update: {
          category?: Database['public']['Enums']['ShopCategory']
          createdAt?: string
          description?: string | null
          descriptionKz?: string | null
          effect?: Json | null
          icon?: string
          id?: string
          isActive?: boolean
          isLimited?: boolean
          maxOwnable?: number
          name?: string
          nameKz?: string | null
          price?: number
          requiredLevel?: number
          sortOrder?: number
        }
        Relationships: []
      }
      Song: {
        Row: {
          artist: string
          createdAt: string
          genre: string | null
          id: string
          isPublished: boolean
          level: string
          lyrics: Json
          title: string
          vocabulary: Json
          youtubeId: string | null
        }
        Insert: {
          artist: string
          createdAt?: string
          genre?: string | null
          id?: string
          isPublished?: boolean
          level: string
          lyrics?: Json
          title: string
          vocabulary?: Json
          youtubeId?: string | null
        }
        Update: {
          artist?: string
          createdAt?: string
          genre?: string | null
          id?: string
          isPublished?: boolean
          level?: string
          lyrics?: Json
          title?: string
          vocabulary?: Json
          youtubeId?: string | null
        }
        Relationships: []
      }
      SongProgress: {
        Row: {
          completedAt: string | null
          id: string
          maxScore: number
          score: number
          songId: string
          studentId: string
          xpEarned: number
        }
        Insert: {
          completedAt?: string | null
          id?: string
          maxScore?: number
          score?: number
          songId: string
          studentId: string
          xpEarned?: number
        }
        Update: {
          completedAt?: string | null
          id?: string
          maxScore?: number
          score?: number
          songId?: string
          studentId?: string
          xpEarned?: number
        }
        Relationships: [
          {
            foreignKeyName: 'SongProgress_songId_fkey'
            columns: ['songId']
            isOneToOne: false
            referencedRelation: 'Song'
            referencedColumns: ['id']
          }
        ]
      }
      StoryAttempt: {
        Row: {
          attemptedAt: string
          comprehensionScore: number
          id: string
          keyPointsCovered: number
          keyPointsTotal: number
          storyId: string
          storyLevel: string
          storyTitle: string
          studentId: string
          transcript: string
        }
        Insert: {
          attemptedAt?: string
          comprehensionScore: number
          id?: string
          keyPointsCovered: number
          keyPointsTotal: number
          storyId: string
          storyLevel: string
          storyTitle: string
          studentId: string
          transcript: string
        }
        Update: {
          attemptedAt?: string
          comprehensionScore?: number
          id?: string
          keyPointsCovered?: number
          keyPointsTotal?: number
          storyId?: string
          storyLevel?: string
          storyTitle?: string
          studentId?: string
          transcript?: string
        }
        Relationships: [
          {
            foreignKeyName: 'StoryAttempt_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      Student: {
        Row: {
          availableLessons: number
          birthdate: string | null
          createdAt: string
          dailyStreak: number
          goldStreak: number
          id: string
          lastActiveDate: string | null
          level: Database['public']['Enums']['EnglishLevel']
          schoolGrade: number | null
          totalEarnings: number
          totalXp: number
          updatedAt: string
          userId: string
        }
        Insert: {
          availableLessons?: number
          birthdate?: string | null
          createdAt?: string
          dailyStreak?: number
          goldStreak?: number
          id?: string
          lastActiveDate?: string | null
          level?: Database['public']['Enums']['EnglishLevel']
          schoolGrade?: number | null
          totalEarnings?: number
          totalXp?: number
          updatedAt?: string
          userId: string
        }
        Update: {
          availableLessons?: number
          birthdate?: string | null
          createdAt?: string
          dailyStreak?: number
          goldStreak?: number
          id?: string
          lastActiveDate?: string | null
          level?: Database['public']['Enums']['EnglishLevel']
          schoolGrade?: number | null
          totalEarnings?: number
          totalXp?: number
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Student_userId_fkey'
            columns: ['userId']
            isOneToOne: true
            referencedRelation: 'User'
            referencedColumns: ['id']
          }
        ]
      }
      StudentAchievement: {
        Row: {
          achievementId: string
          earnedAt: string
          id: string
          studentProfileId: string
        }
        Insert: {
          achievementId: string
          earnedAt?: string
          id?: string
          studentProfileId: string
        }
        Update: {
          achievementId?: string
          earnedAt?: string
          id?: string
          studentProfileId?: string
        }
        Relationships: [
          {
            foreignKeyName: 'StudentAchievement_achievementId_fkey'
            columns: ['achievementId']
            isOneToOne: false
            referencedRelation: 'Achievement'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'StudentAchievement_studentProfileId_fkey'
            columns: ['studentProfileId']
            isOneToOne: false
            referencedRelation: 'StudentGameProfile'
            referencedColumns: ['id']
          }
        ]
      }
      StudentGameProfile: {
        Row: {
          createdAt: string
          currentStreak: number
          gems: number
          id: string
          lastActiveDate: string | null
          level: number
          longestStreak: number
          streakFreezes: number
          studentId: string
          updatedAt: string
          visualMode: string
          xp: number
        }
        Insert: {
          createdAt?: string
          currentStreak?: number
          gems?: number
          id?: string
          lastActiveDate?: string | null
          level?: number
          longestStreak?: number
          streakFreezes?: number
          studentId: string
          updatedAt?: string
          visualMode?: string
          xp?: number
        }
        Update: {
          createdAt?: string
          currentStreak?: number
          gems?: number
          id?: string
          lastActiveDate?: string | null
          level?: number
          longestStreak?: number
          streakFreezes?: number
          studentId?: string
          updatedAt?: string
          visualMode?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: 'StudentGameProfile_studentId_fkey'
            columns: ['studentId']
            isOneToOne: true
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      StudentInventory: {
        Row: {
          id: string
          purchasedAt: string
          quantity: number
          shopItemId: string
          studentId: string
          usedCount: number
        }
        Insert: {
          id?: string
          purchasedAt?: string
          quantity?: number
          shopItemId: string
          studentId: string
          usedCount?: number
        }
        Update: {
          id?: string
          purchasedAt?: string
          quantity?: number
          shopItemId?: string
          studentId?: string
          usedCount?: number
        }
        Relationships: [
          {
            foreignKeyName: 'StudentInventory_shopItemId_fkey'
            columns: ['shopItemId']
            isOneToOne: false
            referencedRelation: 'ShopItem'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'StudentInventory_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      StudentQuest: {
        Row: {
          assignedAt: string
          completedAt: string | null
          expiresAt: string
          id: string
          progress: number
          questId: string
          status: Database['public']['Enums']['QuestStatus']
          studentId: string
          target: number
        }
        Insert: {
          assignedAt?: string
          completedAt?: string | null
          expiresAt: string
          id?: string
          progress?: number
          questId: string
          status?: Database['public']['Enums']['QuestStatus']
          studentId: string
          target: number
        }
        Update: {
          assignedAt?: string
          completedAt?: string | null
          expiresAt?: string
          id?: string
          progress?: number
          questId?: string
          status?: Database['public']['Enums']['QuestStatus']
          studentId?: string
          target?: number
        }
        Relationships: [
          {
            foreignKeyName: 'StudentQuest_questId_fkey'
            columns: ['questId']
            isOneToOne: false
            referencedRelation: 'Quest'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'StudentQuest_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      SupportTicket: {
        Row: {
          adminNote: string | null
          createdAt: string
          id: string
          message: string
          priority: Database['public']['Enums']['TicketPriority']
          resolvedAt: string | null
          status: Database['public']['Enums']['TicketStatus']
          subject: string
          updatedAt: string
          userId: string
        }
        Insert: {
          adminNote?: string | null
          createdAt?: string
          id?: string
          message: string
          priority?: Database['public']['Enums']['TicketPriority']
          resolvedAt?: string | null
          status?: Database['public']['Enums']['TicketStatus']
          subject: string
          updatedAt?: string
          userId: string
        }
        Update: {
          adminNote?: string | null
          createdAt?: string
          id?: string
          message?: string
          priority?: Database['public']['Enums']['TicketPriority']
          resolvedAt?: string | null
          status?: Database['public']['Enums']['TicketStatus']
          subject?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: 'SupportTicket_userId_fkey'
            columns: ['userId']
            isOneToOne: false
            referencedRelation: 'User'
            referencedColumns: ['id']
          }
        ]
      }
      Teacher: {
        Row: {
          bio: string | null
          category: string | null
          createdAt: string
          id: string
          rating: number
          reviewCount: number
          specialization: string | null
          updatedAt: string
          userId: string
          yearsOfExperience: number | null
        }
        Insert: {
          bio?: string | null
          category?: string | null
          createdAt?: string
          id?: string
          rating?: number
          reviewCount?: number
          specialization?: string | null
          updatedAt?: string
          userId: string
          yearsOfExperience?: number | null
        }
        Update: {
          bio?: string | null
          category?: string | null
          createdAt?: string
          id?: string
          rating?: number
          reviewCount?: number
          specialization?: string | null
          updatedAt?: string
          userId?: string
          yearsOfExperience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'Teacher_userId_fkey'
            columns: ['userId']
            isOneToOne: true
            referencedRelation: 'User'
            referencedColumns: ['id']
          }
        ]
      }
      User: {
        Row: {
          authId: string
          avatarUrl: string | null
          createdAt: string
          email: string
          id: string
          iin: string | null
          name: string
          patronymic: string | null
          phone: string | null
          role: Database['public']['Enums']['UserRole']
          status: Database['public']['Enums']['UserStatus']
          surname: string
          updatedAt: string
        }
        Insert: {
          authId: string
          avatarUrl?: string | null
          createdAt?: string
          email: string
          id?: string
          iin?: string | null
          name: string
          patronymic?: string | null
          phone?: string | null
          role: Database['public']['Enums']['UserRole']
          status?: Database['public']['Enums']['UserStatus']
          surname: string
          updatedAt?: string
        }
        Update: {
          authId?: string
          avatarUrl?: string | null
          createdAt?: string
          email?: string
          id?: string
          iin?: string | null
          name?: string
          patronymic?: string | null
          phone?: string | null
          role?: Database['public']['Enums']['UserRole']
          status?: Database['public']['Enums']['UserStatus']
          surname?: string
          updatedAt?: string
        }
        Relationships: []
      }
      VocabularyEntry: {
        Row: {
          addedAt: string
          bestScore: number
          example: string | null
          id: string
          ipa: string | null
          reviewCount: number
          studentId: string
          translation: string
          word: string
        }
        Insert: {
          addedAt?: string
          bestScore?: number
          example?: string | null
          id?: string
          ipa?: string | null
          reviewCount?: number
          studentId: string
          translation: string
          word: string
        }
        Update: {
          addedAt?: string
          bestScore?: number
          example?: string | null
          id?: string
          ipa?: string | null
          reviewCount?: number
          studentId?: string
          translation?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: 'VocabularyEntry_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      XpLog: {
        Row: {
          action: Database['public']['Enums']['XpActionKind']
          amount: number
          createdAt: string
          id: string
          refId: string | null
          studentId: string
        }
        Insert: {
          action: Database['public']['Enums']['XpActionKind']
          amount: number
          createdAt?: string
          id?: string
          refId?: string | null
          studentId: string
        }
        Update: {
          action?: Database['public']['Enums']['XpActionKind']
          amount?: number
          createdAt?: string
          id?: string
          refId?: string | null
          studentId?: string
        }
        Relationships: [
          {
            foreignKeyName: 'XpLog_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_xp_atomic: {
        Args: {
          p_action: string
          p_amount: number
          p_description?: string
          p_source_id: string
          p_student_id: string
        }
        Returns: Json
      }
      calculate_level: { Args: { p_xp: number }, Returns: number }
      complete_quest_atomic: {
        Args: { p_student_quest_id: string }
        Returns: Json
      }
      custom_access_token_hook: { Args: { event: Json }, Returns: Json }
      get_current_role: {
        Args: never
        Returns: Database['public']['Enums']['UserRole']
      }
      get_current_student_group_ids: { Args: never, Returns: string[] }
      get_current_student_id: { Args: never, Returns: string }
      get_current_teacher_group_ids: { Args: never, Returns: string[] }
      get_current_teacher_id: { Args: never, Returns: string }
      get_current_teacher_lesson_ids: { Args: never, Returns: string[] }
      get_current_user_id: { Args: never, Returns: string }
      purchase_shop_item_atomic: {
        Args: { p_shop_item_id: string, p_student_id: string }
        Returns: Json
      }
      tick_quest_progress: {
        Args: {
          p_increment: number
          p_quest_type: string
          p_student_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      AttendanceStatus: 'PRESENT' | 'ABSENT' | 'LATE'
      BattleStatus: 'WAITING' | 'IN_PROGRESS' | 'ENDED'
      BranchKind: 'OFFLINE' | 'ONLINE'
      ConversationKind: 'DIRECT' | 'GROUP'
      EnglishLevel: 'A1' | 'A2' | 'S1' | 'S2' | 'B2' | 'F1' | 'F2' | 'F3' | 'F4'
      GemSourceType:
        | 'QUEST'
        | 'ACHIEVEMENT'
        | 'MILESTONE'
        | 'STREAK'
        | 'LEVEL_UP'
        | 'SHOP_PURCHASE'
        | 'SHOP_REFUND'
      GroupMemberStatus: 'ACTIVE' | 'LEFT'
      HomeworkFormat:
        | 'TEST'
        | 'INPUT'
        | 'TEXT'
        | 'ORAL'
        | 'FILE'
        | 'INTERACTIVE'
      HomeworkStatus:
        | 'ASSIGNED'
        | 'IN_PROGRESS'
        | 'SUBMITTED'
        | 'CHECKED'
        | 'OVERDUE'
      LessonStatus: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
      MaterialKind: 'AUDIO' | 'VIDEO' | 'PDF' | 'LINK'
      MedalKind: 'GOLD' | 'SILVER' | 'BRONZE' | 'NONE'
      NotificationType:
        | 'MEDAL_AWARDED'
        | 'PAYOUT_RECEIVED'
        | 'HOMEWORK_CHECKED'
        | 'LESSON_REMINDER'
        | 'NEW_MESSAGE'
        | 'SYSTEM'
        | 'PARENT_LINK_REQUEST'
        | 'PARENT_LINK_REMOVED'
      PayoutStatus: 'PENDING' | 'PAID' | 'CANCELLED'
      QuestPeriod: 'DAILY' | 'WEEKLY'
      QuestStatus: 'ACTIVE' | 'COMPLETED' | 'EXPIRED'
      QuestType:
        | 'SOLVE_PROBLEMS'
        | 'AI_SESSION_MINUTES'
        | 'ATTEND_LESSON'
        | 'SUBMIT_HOMEWORK'
        | 'REVIEW_TOPIC'
        | 'EARN_XP'
        | 'PERFECT_TEST'
        | 'CLOSE_GAP'
        | 'STREAK_DAYS'
      ShopCategory: 'POWER_UP' | 'AVATAR_FRAME' | 'PROFILE_THEME' | 'TITLE'
      TicketPriority: 'LOW' | 'MEDIUM' | 'HIGH'
      TicketStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
      UserRole: 'STUDENT' | 'PARENT' | 'TUTOR' | 'ADMIN' | 'TEACHER'
      UserStatus: 'ACTIVE' | 'INACTIVE' | 'BANNED'
      XpActionKind:
        | 'PRACTICE_CARD'
        | 'PRACTICE_DECK'
        | 'HOMEWORK_ONTIME'
        | 'LESSON_ATTENDED'
        | 'DAILY_QUEST'
        | 'MANUAL_AWARD'
        | 'STORY_RETELL'
        | 'GAME_LEVEL'
        | 'GRAMMAR_COMPLETE'
        | 'GRAMMAR_PERFECT'
        | 'READING_COMPLETE'
        | 'READING_PERFECT'
        | 'SONG_COMPLETE'
        | 'SONG_PERFECT'
        | 'AI_CORRECT_ANSWER'
        | 'HOMEWORK_ON_TIME'
        | 'TOPIC_COMPLETED'
        | 'TEST_COMPLETED'
        | 'AI_SESSION'
        | 'PERFECT_TEST'
        | 'GAP_CLOSED'
        | 'STREAK_BONUS'
        | 'QUEST_DAILY'
        | 'QUEST_WEEKLY'
        | 'DAILY_BONUS'
        | 'WEEKLY_BONUS'
        | 'ACHIEVEMENT_REWARD'
      XPActionType:
        | 'CORRECT_ANSWER'
        | 'HOMEWORK_SUBMIT'
        | 'LESSON_ATTEND'
        | 'TEST_COMPLETE'
        | 'AI_SESSION'
        | 'STREAK_BONUS'
        | 'QUEST_DAILY'
        | 'QUEST_WEEKLY'
        | 'DAILY_BONUS'
        | 'WEEKLY_BONUS'
        | 'ACHIEVEMENT_REWARD'
        | 'GAME_LEVEL'
        | 'STORY_RETELL'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
      ? R
      : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables']
    & DefaultSchema['Views'])
    ? (DefaultSchema['Tables']
      & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
        ? R
        : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Insert: infer I
  }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Update: infer U
  }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema['Enums']
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema['CompositeTypes']
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      AttendanceStatus: ['PRESENT', 'ABSENT', 'LATE'],
      BattleStatus: ['WAITING', 'IN_PROGRESS', 'ENDED'],
      BranchKind: ['OFFLINE', 'ONLINE'],
      ConversationKind: ['DIRECT', 'GROUP'],
      EnglishLevel: ['A1', 'A2', 'S1', 'S2', 'B2', 'F1', 'F2', 'F3', 'F4'],
      GemSourceType: [
        'QUEST',
        'ACHIEVEMENT',
        'MILESTONE',
        'STREAK',
        'LEVEL_UP',
        'SHOP_PURCHASE',
        'SHOP_REFUND'
      ],
      GroupMemberStatus: ['ACTIVE', 'LEFT'],
      HomeworkFormat: ['TEST', 'INPUT', 'TEXT', 'ORAL', 'FILE', 'INTERACTIVE'],
      HomeworkStatus: [
        'ASSIGNED',
        'IN_PROGRESS',
        'SUBMITTED',
        'CHECKED',
        'OVERDUE'
      ],
      LessonStatus: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      MaterialKind: ['AUDIO', 'VIDEO', 'PDF', 'LINK'],
      MedalKind: ['GOLD', 'SILVER', 'BRONZE', 'NONE'],
      NotificationType: [
        'MEDAL_AWARDED',
        'PAYOUT_RECEIVED',
        'HOMEWORK_CHECKED',
        'LESSON_REMINDER',
        'NEW_MESSAGE',
        'SYSTEM',
        'PARENT_LINK_REQUEST',
        'PARENT_LINK_REMOVED'
      ],
      PayoutStatus: ['PENDING', 'PAID', 'CANCELLED'],
      QuestPeriod: ['DAILY', 'WEEKLY'],
      QuestStatus: ['ACTIVE', 'COMPLETED', 'EXPIRED'],
      QuestType: [
        'SOLVE_PROBLEMS',
        'AI_SESSION_MINUTES',
        'ATTEND_LESSON',
        'SUBMIT_HOMEWORK',
        'REVIEW_TOPIC',
        'EARN_XP',
        'PERFECT_TEST',
        'CLOSE_GAP',
        'STREAK_DAYS'
      ],
      ShopCategory: ['POWER_UP', 'AVATAR_FRAME', 'PROFILE_THEME', 'TITLE'],
      TicketPriority: ['LOW', 'MEDIUM', 'HIGH'],
      TicketStatus: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      UserRole: ['STUDENT', 'PARENT', 'TUTOR', 'ADMIN', 'TEACHER'],
      UserStatus: ['ACTIVE', 'INACTIVE', 'BANNED'],
      XpActionKind: [
        'PRACTICE_CARD',
        'PRACTICE_DECK',
        'HOMEWORK_ONTIME',
        'LESSON_ATTENDED',
        'DAILY_QUEST',
        'MANUAL_AWARD',
        'STORY_RETELL',
        'GAME_LEVEL',
        'GRAMMAR_COMPLETE',
        'GRAMMAR_PERFECT',
        'READING_COMPLETE',
        'READING_PERFECT',
        'SONG_COMPLETE',
        'SONG_PERFECT',
        'AI_CORRECT_ANSWER',
        'HOMEWORK_ON_TIME',
        'TOPIC_COMPLETED',
        'TEST_COMPLETED',
        'AI_SESSION',
        'PERFECT_TEST',
        'GAP_CLOSED',
        'STREAK_BONUS',
        'QUEST_DAILY',
        'QUEST_WEEKLY',
        'DAILY_BONUS',
        'WEEKLY_BONUS',
        'ACHIEVEMENT_REWARD'
      ],
      XPActionType: [
        'CORRECT_ANSWER',
        'HOMEWORK_SUBMIT',
        'LESSON_ATTEND',
        'TEST_COMPLETE',
        'AI_SESSION',
        'STREAK_BONUS',
        'QUEST_DAILY',
        'QUEST_WEEKLY',
        'DAILY_BONUS',
        'WEEKLY_BONUS',
        'ACHIEVEMENT_REWARD',
        'GAME_LEVEL',
        'STORY_RETELL'
      ]
    }
  }
} as const
