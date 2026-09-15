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
          cefrTier: string | null
          coverUrl: string | null
          createdAt: string
          description: string | null
          id: string
          isPublished: boolean
          level: string
          title: string
          trackKey: string | null
        }
        Insert: {
          cefrTier?: string | null
          coverUrl?: string | null
          createdAt?: string
          description?: string | null
          id?: string
          isPublished?: boolean
          level: string
          title: string
          trackKey?: string | null
        }
        Update: {
          cefrTier?: string | null
          coverUrl?: string | null
          createdAt?: string
          description?: string | null
          id?: string
          isPublished?: boolean
          level?: string
          title?: string
          trackKey?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'Book_trackKey_fkey'
            columns: ['trackKey']
            isOneToOne: false
            referencedRelation: 'LevelTrack'
            referencedColumns: ['level']
          }
        ]
      }
      BookPage: {
        Row: {
          createdAt: string
          id: string
          imageHeight: number
          imageUrl: string
          imageWidth: number
          moduleId: string
          pageNumber: number
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id?: string
          imageHeight?: number
          imageUrl: string
          imageWidth?: number
          moduleId: string
          pageNumber: number
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          id?: string
          imageHeight?: number
          imageUrl?: string
          imageWidth?: number
          moduleId?: string
          pageNumber?: number
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'BookPage_moduleId_fkey'
            columns: ['moduleId']
            isOneToOne: false
            referencedRelation: 'Module'
            referencedColumns: ['id']
          }
        ]
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
          archivedAt: string | null
          bookId: string | null
          branchId: string | null
          createdAt: string
          id: string
          isService: boolean
          level: Database['public']['Enums']['EnglishLevel']
          maxStudents: number
          name: string
          schedule: Json
          teacherId: string
          updatedAt: string
        }
        Insert: {
          archivedAt?: string | null
          bookId?: string | null
          branchId?: string | null
          createdAt?: string
          id?: string
          isService?: boolean
          level: Database['public']['Enums']['EnglishLevel']
          maxStudents?: number
          name: string
          schedule?: Json
          teacherId: string
          updatedAt?: string
        }
        Update: {
          archivedAt?: string | null
          bookId?: string | null
          branchId?: string | null
          createdAt?: string
          id?: string
          isService?: boolean
          level?: Database['public']['Enums']['EnglishLevel']
          maxStudents?: number
          name?: string
          schedule?: Json
          teacherId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Group_bookId_fkey'
            columns: ['bookId']
            isOneToOne: false
            referencedRelation: 'Book'
            referencedColumns: ['id']
          },
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
      Lead: {
        Row: {
          amount: number | null
          branchId: string | null
          convertedAt: string | null
          convertedStudentId: string | null
          createdAt: string
          email: string | null
          firstContactAt: string
          fullName: string
          id: string
          notes: string | null
          paidAt: string | null
          phone: string | null
          phoneDigits: string | null
          responsibleId: string | null
          source: Database['public']['Enums']['LeadSource']
          stage: Database['public']['Enums']['LeadStage']
          tariff: string | null
          trialLessonAt: string | null
          trialSuccess: boolean | null
          trialTeacherId: string | null
          updatedAt: string
        }
        Insert: {
          amount?: number | null
          branchId?: string | null
          convertedAt?: string | null
          convertedStudentId?: string | null
          createdAt?: string
          email?: string | null
          firstContactAt?: string
          fullName: string
          id?: string
          notes?: string | null
          paidAt?: string | null
          phone?: string | null
          phoneDigits?: string | null
          responsibleId?: string | null
          source?: Database['public']['Enums']['LeadSource']
          stage?: Database['public']['Enums']['LeadStage']
          tariff?: string | null
          trialLessonAt?: string | null
          trialSuccess?: boolean | null
          trialTeacherId?: string | null
          updatedAt?: string
        }
        Update: {
          amount?: number | null
          branchId?: string | null
          convertedAt?: string | null
          convertedStudentId?: string | null
          createdAt?: string
          email?: string | null
          firstContactAt?: string
          fullName?: string
          id?: string
          notes?: string | null
          paidAt?: string | null
          phone?: string | null
          phoneDigits?: string | null
          responsibleId?: string | null
          source?: Database['public']['Enums']['LeadSource']
          stage?: Database['public']['Enums']['LeadStage']
          tariff?: string | null
          trialLessonAt?: string | null
          trialSuccess?: boolean | null
          trialTeacherId?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Lead_branchId_fkey'
            columns: ['branchId']
            isOneToOne: false
            referencedRelation: 'Branch'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Lead_convertedStudentId_fkey'
            columns: ['convertedStudentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Lead_responsibleId_fkey'
            columns: ['responsibleId']
            isOneToOne: false
            referencedRelation: 'User'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Lead_trialTeacherId_fkey'
            columns: ['trialTeacherId']
            isOneToOne: false
            referencedRelation: 'Teacher'
            referencedColumns: ['id']
          }
        ]
      }
      LeadStageHistory: {
        Row: {
          changedAt: string
          changedById: string | null
          fromStage: Database['public']['Enums']['LeadStage'] | null
          id: string
          leadId: string
          toStage: Database['public']['Enums']['LeadStage']
        }
        Insert: {
          changedAt?: string
          changedById?: string | null
          fromStage?: Database['public']['Enums']['LeadStage'] | null
          id?: string
          leadId: string
          toStage: Database['public']['Enums']['LeadStage']
        }
        Update: {
          changedAt?: string
          changedById?: string | null
          fromStage?: Database['public']['Enums']['LeadStage'] | null
          id?: string
          leadId?: string
          toStage?: Database['public']['Enums']['LeadStage']
        }
        Relationships: [
          {
            foreignKeyName: 'LeadStageHistory_changedById_fkey'
            columns: ['changedById']
            isOneToOne: false
            referencedRelation: 'User'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'LeadStageHistory_leadId_fkey'
            columns: ['leadId']
            isOneToOne: false
            referencedRelation: 'Lead'
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
          type: Database['public']['Enums']['LessonType']
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
          type?: Database['public']['Enums']['LessonType']
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
          type?: Database['public']['Enums']['LessonType']
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
      LessonAttempt: {
        Row: {
          createdAt: string
          exerciseId: string
          id: string
          isCorrect: boolean | null
          response: Json
          score: number | null
          studentId: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          exerciseId: string
          id?: string
          isCorrect?: boolean | null
          response?: Json
          score?: number | null
          studentId: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          exerciseId?: string
          id?: string
          isCorrect?: boolean | null
          response?: Json
          score?: number | null
          studentId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'LessonAttempt_exerciseId_fkey'
            columns: ['exerciseId']
            isOneToOne: false
            referencedRelation: 'LessonExercise'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'LessonAttempt_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      LessonCriterionGrade: {
        Row: {
          criterion: Database['public']['Enums']['GradeCriterion']
          gradedAt: string
          gradedBy: string | null
          lessonId: string
          studentId: string
          value: number
        }
        Insert: {
          criterion: Database['public']['Enums']['GradeCriterion']
          gradedAt?: string
          gradedBy?: string | null
          lessonId: string
          studentId: string
          value: number
        }
        Update: {
          criterion?: Database['public']['Enums']['GradeCriterion']
          gradedAt?: string
          gradedBy?: string | null
          lessonId?: string
          studentId?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: 'LessonCriterionGrade_gradedBy_fkey'
            columns: ['gradedBy']
            isOneToOne: false
            referencedRelation: 'Teacher'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'LessonCriterionGrade_lessonId_fkey'
            columns: ['lessonId']
            isOneToOne: false
            referencedRelation: 'Lesson'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'LessonCriterionGrade_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      LessonExercise: {
        Row: {
          content: Json
          createdAt: string
          id: string
          instruction: string | null
          orderIndex: number
          type: string
          unitId: string
          updatedAt: string
          xp: number
        }
        Insert: {
          content?: Json
          createdAt?: string
          id?: string
          instruction?: string | null
          orderIndex?: number
          type: string
          unitId: string
          updatedAt?: string
          xp?: number
        }
        Update: {
          content?: Json
          createdAt?: string
          id?: string
          instruction?: string | null
          orderIndex?: number
          type?: string
          unitId?: string
          updatedAt?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: 'LessonExercise_unitId_fkey'
            columns: ['unitId']
            isOneToOne: false
            referencedRelation: 'LessonUnit'
            referencedColumns: ['id']
          }
        ]
      }
      LessonExerciseAnswer: {
        Row: {
          answerKey: Json
          createdAt: string
          exerciseId: string
          explanation: string | null
          updatedAt: string
        }
        Insert: {
          answerKey?: Json
          createdAt?: string
          exerciseId: string
          explanation?: string | null
          updatedAt?: string
        }
        Update: {
          answerKey?: Json
          createdAt?: string
          exerciseId?: string
          explanation?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'LessonExerciseAnswer_exerciseId_fkey'
            columns: ['exerciseId']
            isOneToOne: true
            referencedRelation: 'LessonExercise'
            referencedColumns: ['id']
          }
        ]
      }
      LessonGuestInvite: {
        Row: {
          createdAt: string
          createdBy: string | null
          expiresAt: string
          guestName: string | null
          id: string
          lastUsedAt: string | null
          leadId: string | null
          lessonId: string
          maxUses: number
          revokedAt: string | null
          token: string
          usedCount: number
        }
        Insert: {
          createdAt?: string
          createdBy?: string | null
          expiresAt: string
          guestName?: string | null
          id?: string
          lastUsedAt?: string | null
          leadId?: string | null
          lessonId: string
          maxUses?: number
          revokedAt?: string | null
          token: string
          usedCount?: number
        }
        Update: {
          createdAt?: string
          createdBy?: string | null
          expiresAt?: string
          guestName?: string | null
          id?: string
          lastUsedAt?: string | null
          leadId?: string | null
          lessonId?: string
          maxUses?: number
          revokedAt?: string | null
          token?: string
          usedCount?: number
        }
        Relationships: [
          {
            foreignKeyName: 'LessonGuestInvite_createdBy_fkey'
            columns: ['createdBy']
            isOneToOne: false
            referencedRelation: 'User'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'LessonGuestInvite_leadId_fkey'
            columns: ['leadId']
            isOneToOne: false
            referencedRelation: 'Lead'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'LessonGuestInvite_lessonId_fkey'
            columns: ['lessonId']
            isOneToOne: false
            referencedRelation: 'Lesson'
            referencedColumns: ['id']
          }
        ]
      }
      LessonUnit: {
        Row: {
          createdAt: string
          id: string
          intro: Json
          kind: string
          moduleId: string
          orderIndex: number
          passThreshold: number
          subtitle: string | null
          title: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id?: string
          intro?: Json
          kind?: string
          moduleId: string
          orderIndex?: number
          passThreshold?: number
          subtitle?: string | null
          title: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          id?: string
          intro?: Json
          kind?: string
          moduleId?: string
          orderIndex?: number
          passThreshold?: number
          subtitle?: string | null
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'LessonUnit_moduleId_fkey'
            columns: ['moduleId']
            isOneToOne: false
            referencedRelation: 'Module'
            referencedColumns: ['id']
          }
        ]
      }
      LevelTrack: {
        Row: {
          ageRange: string
          bookTitle: string
          createdAt: string
          grades: string
          isActive: boolean
          level: string
          orderIndex: number
          tier: string
        }
        Insert: {
          ageRange?: string
          bookTitle?: string
          createdAt?: string
          grades?: string
          isActive?: boolean
          level: string
          orderIndex?: number
          tier: string
        }
        Update: {
          ageRange?: string
          bookTitle?: string
          createdAt?: string
          grades?: string
          isActive?: boolean
          level?: string
          orderIndex?: number
          tier?: string
        }
        Relationships: []
      }
      LingaCoinTransaction: {
        Row: {
          awardedBy: string | null
          createdAt: string
          delta: number
          id: string
          note: string | null
          reason: Database['public']['Enums']['LingaCoinReason']
          studentId: string
        }
        Insert: {
          awardedBy?: string | null
          createdAt?: string
          delta: number
          id?: string
          note?: string | null
          reason?: Database['public']['Enums']['LingaCoinReason']
          studentId: string
        }
        Update: {
          awardedBy?: string | null
          createdAt?: string
          delta?: number
          id?: string
          note?: string | null
          reason?: Database['public']['Enums']['LingaCoinReason']
          studentId?: string
        }
        Relationships: [
          {
            foreignKeyName: 'LingaCoinTransaction_awardedBy_fkey'
            columns: ['awardedBy']
            isOneToOne: false
            referencedRelation: 'User'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'LingaCoinTransaction_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
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
          pageCount: number
          pdfUrl: string | null
          title: string
        }
        Insert: {
          bookId: string
          createdAt?: string
          id?: string
          order?: number
          pageCount?: number
          pdfUrl?: string | null
          title: string
        }
        Update: {
          bookId?: string
          createdAt?: string
          id?: string
          order?: number
          pageCount?: number
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
          bookPoints: number
          confirmedAt: string
          confirmedBy: string | null
          gradesCount: number
          id: string
          instagramPoints: number
          lessonsCounted: number
          medal: Database['public']['Enums']['MedalKind']
          month: string
          participates: boolean
          paymentPoints: number
          payout: number
          studentId: string
          teacherAvg: number
        }
        Insert: {
          averageGrade: number
          bookPoints?: number
          confirmedAt?: string
          confirmedBy?: string | null
          gradesCount?: number
          id?: string
          instagramPoints?: number
          lessonsCounted?: number
          medal: Database['public']['Enums']['MedalKind']
          month: string
          participates?: boolean
          paymentPoints?: number
          payout?: number
          studentId: string
          teacherAvg?: number
        }
        Update: {
          averageGrade?: number
          bookPoints?: number
          confirmedAt?: string
          confirmedBy?: string | null
          gradesCount?: number
          id?: string
          instagramPoints?: number
          lessonsCounted?: number
          medal?: Database['public']['Enums']['MedalKind']
          month?: string
          participates?: boolean
          paymentPoints?: number
          payout?: number
          studentId?: string
          teacherAvg?: number
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
      MonthlyMotivationInput: {
        Row: {
          books: boolean
          instagram: boolean
          month: string
          note: string | null
          paidOnTime: boolean
          studentId: string
          subscriptionLessons: number
          updatedAt: string
          updatedBy: string | null
        }
        Insert: {
          books?: boolean
          instagram?: boolean
          month: string
          note?: string | null
          paidOnTime?: boolean
          studentId: string
          subscriptionLessons?: number
          updatedAt?: string
          updatedBy?: string | null
        }
        Update: {
          books?: boolean
          instagram?: boolean
          month?: string
          note?: string | null
          paidOnTime?: boolean
          studentId?: string
          subscriptionLessons?: number
          updatedAt?: string
          updatedBy?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'MonthlyMotivationInput_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'MonthlyMotivationInput_updatedBy_fkey'
            columns: ['updatedBy']
            isOneToOne: false
            referencedRelation: 'User'
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
      PageAttempt: {
        Row: {
          aiFeedback: Json | null
          audioUrl: string | null
          createdAt: string
          exerciseId: string
          id: string
          isCorrect: boolean | null
          response: Json
          score: number | null
          studentId: string
          updatedAt: string
        }
        Insert: {
          aiFeedback?: Json | null
          audioUrl?: string | null
          createdAt?: string
          exerciseId: string
          id?: string
          isCorrect?: boolean | null
          response?: Json
          score?: number | null
          studentId: string
          updatedAt?: string
        }
        Update: {
          aiFeedback?: Json | null
          audioUrl?: string | null
          createdAt?: string
          exerciseId?: string
          id?: string
          isCorrect?: boolean | null
          response?: Json
          score?: number | null
          studentId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'PageAttempt_exerciseId_fkey'
            columns: ['exerciseId']
            isOneToOne: false
            referencedRelation: 'PageExercise'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'PageAttempt_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      PageExercise: {
        Row: {
          createdAt: string
          h: number
          id: string
          kind: string
          options: Json
          orderIndex: number
          pageId: string
          prompt: string | null
          updatedAt: string
          w: number
          x: number
          y: number
        }
        Insert: {
          createdAt?: string
          h: number
          id?: string
          kind: string
          options?: Json
          orderIndex?: number
          pageId: string
          prompt?: string | null
          updatedAt?: string
          w: number
          x: number
          y: number
        }
        Update: {
          createdAt?: string
          h?: number
          id?: string
          kind?: string
          options?: Json
          orderIndex?: number
          pageId?: string
          prompt?: string | null
          updatedAt?: string
          w?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: 'PageExercise_pageId_fkey'
            columns: ['pageId']
            isOneToOne: false
            referencedRelation: 'BookPage'
            referencedColumns: ['id']
          }
        ]
      }
      PageExerciseAnswer: {
        Row: {
          answerKey: Json
          createdAt: string
          exerciseId: string
          explanation: string | null
          updatedAt: string
        }
        Insert: {
          answerKey?: Json
          createdAt?: string
          exerciseId: string
          explanation?: string | null
          updatedAt?: string
        }
        Update: {
          answerKey?: Json
          createdAt?: string
          exerciseId?: string
          explanation?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'PageExerciseAnswer_exerciseId_fkey'
            columns: ['exerciseId']
            isOneToOne: true
            referencedRelation: 'PageExercise'
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
      ParentToStudent: {
        Row: {
          createdAt: string
          id: string
          parentId: string
          respondedAt: string | null
          status: string
          studentId: string
        }
        Insert: {
          createdAt?: string
          id?: string
          parentId: string
          respondedAt?: string | null
          status?: string
          studentId: string
        }
        Update: {
          createdAt?: string
          id?: string
          parentId?: string
          respondedAt?: string | null
          status?: string
          studentId?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ParentToStudent_parentId_fkey'
            columns: ['parentId']
            isOneToOne: false
            referencedRelation: 'Parent'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ParentToStudent_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      Payment: {
        Row: {
          amount: number
          branchId: string | null
          comment: string | null
          createdAt: string
          id: string
          method: Database['public']['Enums']['PaymentMethod']
          paidAt: string
          status: Database['public']['Enums']['PaymentStatus']
          studentId: string
          subscriptionId: string | null
        }
        Insert: {
          amount: number
          branchId?: string | null
          comment?: string | null
          createdAt?: string
          id?: string
          method?: Database['public']['Enums']['PaymentMethod']
          paidAt?: string
          status?: Database['public']['Enums']['PaymentStatus']
          studentId: string
          subscriptionId?: string | null
        }
        Update: {
          amount?: number
          branchId?: string | null
          comment?: string | null
          createdAt?: string
          id?: string
          method?: Database['public']['Enums']['PaymentMethod']
          paidAt?: string
          status?: Database['public']['Enums']['PaymentStatus']
          studentId?: string
          subscriptionId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'Payment_branchId_fkey'
            columns: ['branchId']
            isOneToOne: false
            referencedRelation: 'Branch'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Payment_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Payment_subscriptionId_fkey'
            columns: ['subscriptionId']
            isOneToOne: false
            referencedRelation: 'Subscription'
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
      PlacementTest: {
        Row: {
          ageBand: Database['public']['Enums']['PlacementAgeBand']
          answers: Json
          autoMax: number
          autoScore: number
          createdAt: string
          fullName: string
          id: string
          leadId: string
          openAnswers: Json
          phone: string
          recommendedLevel: string | null
          skippedCount: number
        }
        Insert: {
          ageBand: Database['public']['Enums']['PlacementAgeBand']
          answers?: Json
          autoMax?: number
          autoScore?: number
          createdAt?: string
          fullName: string
          id?: string
          leadId: string
          openAnswers?: Json
          phone: string
          recommendedLevel?: string | null
          skippedCount?: number
        }
        Update: {
          ageBand?: Database['public']['Enums']['PlacementAgeBand']
          answers?: Json
          autoMax?: number
          autoScore?: number
          createdAt?: string
          fullName?: string
          id?: string
          leadId?: string
          openAnswers?: Json
          phone?: string
          recommendedLevel?: string | null
          skippedCount?: number
        }
        Relationships: [
          {
            foreignKeyName: 'PlacementTest_leadId_fkey'
            columns: ['leadId']
            isOneToOne: false
            referencedRelation: 'Lead'
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
          audioFileName: string | null
          audioUrl: string | null
          createdAt: string
          genre: string | null
          id: string
          isPublished: boolean
          level: string | null
          lyrics: Json
          title: string
          vocabulary: Json
          youtubeId: string | null
        }
        Insert: {
          artist: string
          audioFileName?: string | null
          audioUrl?: string | null
          createdAt?: string
          genre?: string | null
          id?: string
          isPublished?: boolean
          level?: string | null
          lyrics?: Json
          title: string
          vocabulary?: Json
          youtubeId?: string | null
        }
        Update: {
          artist?: string
          audioFileName?: string | null
          audioUrl?: string | null
          createdAt?: string
          genre?: string | null
          id?: string
          isPublished?: boolean
          level?: string | null
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
          age: number | null
          availableLessons: number
          birthdate: string | null
          createdAt: string
          dailyStreak: number
          goldStreak: number
          id: string
          lastActiveDate: string | null
          level: Database['public']['Enums']['EnglishLevel']
          schoolGrade: number | null
          schoolName: string | null
          status: Database['public']['Enums']['StudentStatus']
          totalEarnings: number
          totalXp: number
          updatedAt: string
          userId: string
        }
        Insert: {
          age?: number | null
          availableLessons?: number
          birthdate?: string | null
          createdAt?: string
          dailyStreak?: number
          goldStreak?: number
          id?: string
          lastActiveDate?: string | null
          level?: Database['public']['Enums']['EnglishLevel']
          schoolGrade?: number | null
          schoolName?: string | null
          status?: Database['public']['Enums']['StudentStatus']
          totalEarnings?: number
          totalXp?: number
          updatedAt?: string
          userId: string
        }
        Update: {
          age?: number | null
          availableLessons?: number
          birthdate?: string | null
          createdAt?: string
          dailyStreak?: number
          goldStreak?: number
          id?: string
          lastActiveDate?: string | null
          level?: Database['public']['Enums']['EnglishLevel']
          schoolGrade?: number | null
          schoolName?: string | null
          status?: Database['public']['Enums']['StudentStatus']
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
      StudentAvatar: {
        Row: {
          config: Json
          createdAt: string
          owned: string[]
          studentId: string
          updatedAt: string
        }
        Insert: {
          config?: Json
          createdAt?: string
          owned?: string[]
          studentId: string
          updatedAt?: string
        }
        Update: {
          config?: Json
          createdAt?: string
          owned?: string[]
          studentId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'StudentAvatar_studentId_fkey'
            columns: ['studentId']
            isOneToOne: true
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      StudentBlockResult: {
        Row: {
          attempts: number
          bestScore: number
          createdAt: string
          id: string
          lastScore: number
          moduleId: string
          passed: boolean
          passedAt: string | null
          studentId: string
          testUnitId: string | null
          updatedAt: string
        }
        Insert: {
          attempts?: number
          bestScore?: number
          createdAt?: string
          id?: string
          lastScore?: number
          moduleId: string
          passed?: boolean
          passedAt?: string | null
          studentId: string
          testUnitId?: string | null
          updatedAt?: string
        }
        Update: {
          attempts?: number
          bestScore?: number
          createdAt?: string
          id?: string
          lastScore?: number
          moduleId?: string
          passed?: boolean
          passedAt?: string | null
          studentId?: string
          testUnitId?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'StudentBlockResult_moduleId_fkey'
            columns: ['moduleId']
            isOneToOne: false
            referencedRelation: 'Module'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'StudentBlockResult_studentId_fkey'
            columns: ['studentId']
            isOneToOne: false
            referencedRelation: 'Student'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'StudentBlockResult_testUnitId_fkey'
            columns: ['testUnitId']
            isOneToOne: false
            referencedRelation: 'LessonUnit'
            referencedColumns: ['id']
          }
        ]
      }
      StudentBook: {
        Row: {
          assignedByTeacherId: string | null
          bookId: string
          createdAt: string
          studentId: string
          updatedAt: string
        }
        Insert: {
          assignedByTeacherId?: string | null
          bookId: string
          createdAt?: string
          studentId: string
          updatedAt?: string
        }
        Update: {
          assignedByTeacherId?: string | null
          bookId?: string
          createdAt?: string
          studentId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'StudentBook_assignedByTeacherId_fkey'
            columns: ['assignedByTeacherId']
            isOneToOne: false
            referencedRelation: 'Teacher'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'StudentBook_bookId_fkey'
            columns: ['bookId']
            isOneToOne: false
            referencedRelation: 'Book'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'StudentBook_studentId_fkey'
            columns: ['studentId']
            isOneToOne: true
            referencedRelation: 'Student'
            referencedColumns: ['id']
          }
        ]
      }
      StudentGameProfile: {
        Row: {
          activeAvatarId: string | null
          activeFrameId: string | null
          activeTitleId: string | null
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
          activeAvatarId?: string | null
          activeFrameId?: string | null
          activeTitleId?: string | null
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
          activeAvatarId?: string | null
          activeFrameId?: string | null
          activeTitleId?: string | null
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
      Subscription: {
        Row: {
          archived: boolean
          branchId: string | null
          course: string | null
          createdAt: string
          endAt: string | null
          id: string
          lessonsTotal: number
          lessonsUsed: number
          nextPaymentAt: string | null
          payerId: string | null
          plan: string
          price: number
          startAt: string | null
          status: Database['public']['Enums']['SubscriptionStatus']
          studentId: string
          updatedAt: string
        }
        Insert: {
          archived?: boolean
          branchId?: string | null
          course?: string | null
          createdAt?: string
          endAt?: string | null
          id?: string
          lessonsTotal?: number
          lessonsUsed?: number
          nextPaymentAt?: string | null
          payerId?: string | null
          plan: string
          price?: number
          startAt?: string | null
          status?: Database['public']['Enums']['SubscriptionStatus']
          studentId: string
          updatedAt?: string
        }
        Update: {
          archived?: boolean
          branchId?: string | null
          course?: string | null
          createdAt?: string
          endAt?: string | null
          id?: string
          lessonsTotal?: number
          lessonsUsed?: number
          nextPaymentAt?: string | null
          payerId?: string | null
          plan?: string
          price?: number
          startAt?: string | null
          status?: Database['public']['Enums']['SubscriptionStatus']
          studentId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Subscription_branchId_fkey'
            columns: ['branchId']
            isOneToOne: false
            referencedRelation: 'Branch'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Subscription_payerId_fkey'
            columns: ['payerId']
            isOneToOne: false
            referencedRelation: 'User'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Subscription_studentId_fkey'
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
      Task: {
        Row: {
          assigneeId: string | null
          branchId: string | null
          completedAt: string | null
          createdAt: string
          creatorId: string | null
          description: string | null
          dueAt: string | null
          id: string
          relatedId: string | null
          relatedType: Database['public']['Enums']['TaskRelatedType']
          status: Database['public']['Enums']['TaskStatus']
          title: string
          updatedAt: string
        }
        Insert: {
          assigneeId?: string | null
          branchId?: string | null
          completedAt?: string | null
          createdAt?: string
          creatorId?: string | null
          description?: string | null
          dueAt?: string | null
          id?: string
          relatedId?: string | null
          relatedType?: Database['public']['Enums']['TaskRelatedType']
          status?: Database['public']['Enums']['TaskStatus']
          title: string
          updatedAt?: string
        }
        Update: {
          assigneeId?: string | null
          branchId?: string | null
          completedAt?: string | null
          createdAt?: string
          creatorId?: string | null
          description?: string | null
          dueAt?: string | null
          id?: string
          relatedId?: string | null
          relatedType?: Database['public']['Enums']['TaskRelatedType']
          status?: Database['public']['Enums']['TaskStatus']
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: 'Task_assigneeId_fkey'
            columns: ['assigneeId']
            isOneToOne: false
            referencedRelation: 'User'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Task_branchId_fkey'
            columns: ['branchId']
            isOneToOne: false
            referencedRelation: 'Branch'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'Task_creatorId_fkey'
            columns: ['creatorId']
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
          initialPassword: string | null
          name: string
          patronymic: string | null
          phone: string | null
          registrationBatchId: string | null
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
          initialPassword?: string | null
          name: string
          patronymic?: string | null
          phone?: string | null
          registrationBatchId?: string | null
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
          initialPassword?: string | null
          name?: string
          patronymic?: string | null
          phone?: string | null
          registrationBatchId?: string | null
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
      get_current_parent_child_user_ids: { Args: never, Returns: string[] }
      get_current_parent_group_ids: { Args: never, Returns: string[] }
      get_current_parent_homework_ids: { Args: never, Returns: string[] }
      get_current_parent_student_ids: { Args: never, Returns: string[] }
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
      get_or_create_service_group: {
        Args: { p_teacher_id: string }
        Returns: string
      }
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
      GradeCriterion: 'ATTENDANCE' | 'BEHAVIOR' | 'HOMEWORK' | 'DIARY' | 'EBOOK'
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
      LeadSource:
        | 'INSTAGRAM'
        | 'WHATSAPP'
        | 'TELEGRAM'
        | 'REFERRAL'
        | 'WEBSITE'
        | 'CALL'
        | 'WALK_IN'
        | 'ADVERTISING'
        | 'OTHER'
      LeadStage:
        | 'NEW'
        | 'CONTACTED'
        | 'TRIAL'
        | 'NO_SHOW'
        | 'SCHEDULE_MISMATCH_KIDS'
        | 'SCHEDULE_MISMATCH_ADULTS'
        | 'TOO_EXPENSIVE'
        | 'LEFT_TO_COMPETITOR'
        | 'CONTACT_LATER'
        | 'THINKING'
        | 'PAYMENT'
        | 'ACTIVE'
      LessonStatus: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
      LessonType: 'GROUP' | 'INDIVIDUAL' | 'TRIAL' | 'MAKEUP' | 'SPEAKING_CLUB'
      LingaCoinReason:
        | 'BEHAVIOR'
        | 'NO_TARDINESS'
        | 'RESPECT'
        | 'ATTENDANCE'
        | 'MAKEUP'
        | 'HOMEWORK'
        | 'IEBOOK'
        | 'DIARY'
        | 'ENGLISH_VIDEO'
        | 'PAYMENT_ONTIME'
        | 'MEDAL'
        | 'PURCHASE'
        | 'MANUAL'
        | 'ADJUSTMENT'
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
        | 'LESSON_MISSED'
        | 'HOMEWORK_NEW'
        | 'LOW_PERFORMANCE'
        | 'PAYMENT_DUE'
      PaymentMethod: 'CASH' | 'CARD' | 'KASPI' | 'TRANSFER' | 'OTHER'
      PaymentStatus: 'COMPLETED' | 'PENDING' | 'REFUNDED' | 'FAILED'
      PayoutStatus: 'PENDING' | 'PAID' | 'CANCELLED'
      PlacementAgeBand: 'AGE_6_9' | 'AGE_9_12' | 'AGE_12_16'
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
      ShopCategory:
        | 'POWER_UP'
        | 'AVATAR_FRAME'
        | 'PROFILE_THEME'
        | 'TITLE'
        | 'AVATAR'
      StudentStatus: 'ACTIVE' | 'PAUSED' | 'DROPPED'
      SubscriptionStatus: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED'
      TaskRelatedType: 'STUDENT' | 'LEAD' | 'INTERNAL'
      TaskStatus: 'NEW' | 'IN_PROGRESS' | 'DONE' | 'OVERDUE'
      TicketPriority: 'LOW' | 'MEDIUM' | 'HIGH'
      TicketStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
      UserRole:
        | 'STUDENT'
        | 'PARENT'
        | 'TUTOR'
        | 'ADMIN'
        | 'TEACHER'
        | 'DIRECTOR'
      UserStatus: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'PENDING' | 'REJECTED'
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never
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
      GradeCriterion: ['ATTENDANCE', 'BEHAVIOR', 'HOMEWORK', 'DIARY', 'EBOOK'],
      GroupMemberStatus: ['ACTIVE', 'LEFT'],
      HomeworkFormat: ['TEST', 'INPUT', 'TEXT', 'ORAL', 'FILE', 'INTERACTIVE'],
      HomeworkStatus: [
        'ASSIGNED',
        'IN_PROGRESS',
        'SUBMITTED',
        'CHECKED',
        'OVERDUE'
      ],
      LeadSource: [
        'INSTAGRAM',
        'WHATSAPP',
        'TELEGRAM',
        'REFERRAL',
        'WEBSITE',
        'CALL',
        'WALK_IN',
        'ADVERTISING',
        'OTHER'
      ],
      LeadStage: [
        'NEW',
        'CONTACTED',
        'TRIAL',
        'NO_SHOW',
        'SCHEDULE_MISMATCH_KIDS',
        'SCHEDULE_MISMATCH_ADULTS',
        'TOO_EXPENSIVE',
        'LEFT_TO_COMPETITOR',
        'CONTACT_LATER',
        'THINKING',
        'PAYMENT',
        'ACTIVE'
      ],
      LessonStatus: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      LessonType: ['GROUP', 'INDIVIDUAL', 'TRIAL', 'MAKEUP', 'SPEAKING_CLUB'],
      LingaCoinReason: [
        'BEHAVIOR',
        'NO_TARDINESS',
        'RESPECT',
        'ATTENDANCE',
        'MAKEUP',
        'HOMEWORK',
        'IEBOOK',
        'DIARY',
        'ENGLISH_VIDEO',
        'PAYMENT_ONTIME',
        'MEDAL',
        'PURCHASE',
        'MANUAL',
        'ADJUSTMENT'
      ],
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
        'PARENT_LINK_REMOVED',
        'LESSON_MISSED',
        'HOMEWORK_NEW',
        'LOW_PERFORMANCE',
        'PAYMENT_DUE'
      ],
      PaymentMethod: ['CASH', 'CARD', 'KASPI', 'TRANSFER', 'OTHER'],
      PaymentStatus: ['COMPLETED', 'PENDING', 'REFUNDED', 'FAILED'],
      PayoutStatus: ['PENDING', 'PAID', 'CANCELLED'],
      PlacementAgeBand: ['AGE_6_9', 'AGE_9_12', 'AGE_12_16'],
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
      ShopCategory: [
        'POWER_UP',
        'AVATAR_FRAME',
        'PROFILE_THEME',
        'TITLE',
        'AVATAR'
      ],
      StudentStatus: ['ACTIVE', 'PAUSED', 'DROPPED'],
      SubscriptionStatus: ['ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED'],
      TaskRelatedType: ['STUDENT', 'LEAD', 'INTERNAL'],
      TaskStatus: ['NEW', 'IN_PROGRESS', 'DONE', 'OVERDUE'],
      TicketPriority: ['LOW', 'MEDIUM', 'HIGH'],
      TicketStatus: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      UserRole: ['STUDENT', 'PARENT', 'TUTOR', 'ADMIN', 'TEACHER', 'DIRECTOR'],
      UserStatus: ['ACTIVE', 'INACTIVE', 'BANNED', 'PENDING', 'REJECTED'],
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
