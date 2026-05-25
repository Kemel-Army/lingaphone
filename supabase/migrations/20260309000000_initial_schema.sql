-- FEMO - Initial Database Schema
-- Migrated from Prisma to Supabase CLI

-- ============================================================
-- EXTENSIONS (pgcrypto provides gen_random_uuid on older PG)
-- ============================================================
-- gen_random_uuid() is built-in since PG 13; no extension needed on Supabase.

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'PARENT', 'TUTOR', 'ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED');
CREATE TYPE "TutorVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "LessonStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "LessonType" AS ENUM ('INDIVIDUAL', 'GROUP');
CREATE TYPE "HomeworkStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'CHECKED', 'OVERDUE');
CREATE TYPE "HomeworkFormat" AS ENUM ('TEST', 'INPUT', 'TEXT', 'ORAL', 'FILE', 'INTERACTIVE');
CREATE TYPE "AIMode" AS ENUM ('EXPLAIN', 'PRACTICE', 'CHECK_HW', 'MOCK_TEST', 'FREE');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "NotificationType" AS ENUM ('EARLY_WARNING', 'LESSON_REMINDER', 'HOMEWORK_DUE', 'ACHIEVEMENT', 'PAYMENT', 'SYSTEM', 'MESSAGE');
CREATE TYPE "XPActionType" AS ENUM ('AI_CORRECT_ANSWER', 'HOMEWORK_ON_TIME', 'LESSON_ATTENDED', 'TOPIC_COMPLETED', 'TEST_COMPLETED', 'AI_SESSION', 'PERFECT_TEST', 'GAP_CLOSED', 'STREAK_BONUS');
CREATE TYPE "DiagnosticStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');
-- ============================================================
-- CORE: Users & Roles
-- ============================================================

CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "authId" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "surname" TEXT NOT NULL,
  "phone" TEXT,
  "avatarUrl" TEXT,
  "role" "UserRole" NOT NULL,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "User_authId_idx" ON "User" ("authId");
CREATE INDEX "User_email_idx" ON "User" ("email");
CREATE INDEX "User_role_idx" ON "User" ("role");
CREATE TABLE "Student" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES "User" ("id") ON DELETE CASCADE,
  "grade" INTEGER NOT NULL,
  "schoolName" TEXT,
  "city" TEXT,
  "goal" TEXT,
  "tutorId" UUID,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Student_tutorId_idx" ON "Student" ("tutorId");
CREATE INDEX "Student_grade_idx" ON "Student" ("grade");
CREATE TABLE "Tutor" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES "User" ("id") ON DELETE CASCADE,
  "bio" TEXT,
  "experience" INTEGER,
  "education" TEXT,
  "verificationStatus" "TutorVerificationStatus" NOT NULL DEFAULT 'PENDING',
  "verificationNote" TEXT,
  "documentsUrl" TEXT[] DEFAULT '{}',
  "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reviewCount" INTEGER NOT NULL DEFAULT 0,
  "hourlyRate" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Tutor_verificationStatus_idx" ON "Tutor" ("verificationStatus");
CREATE INDEX "Tutor_rating_idx" ON "Tutor" ("rating");
-- Add FK after Tutor exists
ALTER TABLE "Student" ADD CONSTRAINT "Student_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor" ("id");
CREATE TABLE "Parent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES "User" ("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE "ParentToStudent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "parentId" UUID NOT NULL REFERENCES "Parent" ("id") ON DELETE CASCADE,
  "studentId" UUID NOT NULL REFERENCES "Student" ("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("parentId", "studentId")
);
CREATE INDEX "ParentToStudent_parentId_idx" ON "ParentToStudent" ("parentId");
CREATE INDEX "ParentToStudent_studentId_idx" ON "ParentToStudent" ("studentId");
-- ============================================================
-- IAE: Student Model & Learning
-- ============================================================

CREATE TABLE "Subject" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "nameKz" TEXT,
  "description" TEXT,
  "icon" TEXT,
  "grade" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Subject_isActive_idx" ON "Subject" ("isActive");
CREATE TABLE "Topic" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "subjectId" UUID NOT NULL REFERENCES "Subject" ("id") ON DELETE CASCADE,
  "parentId" UUID REFERENCES "Topic" ("id"),
  "name" TEXT NOT NULL,
  "nameKz" TEXT,
  "description" TEXT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "gradeLevel" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Topic_subjectId_idx" ON "Topic" ("subjectId");
CREATE INDEX "Topic_parentId_idx" ON "Topic" ("parentId");
CREATE INDEX "Topic_orderIndex_idx" ON "Topic" ("orderIndex");
CREATE TABLE "TutorSubject" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tutorId" UUID NOT NULL REFERENCES "Tutor" ("id") ON DELETE CASCADE,
  "subjectId" UUID NOT NULL REFERENCES "Subject" ("id") ON DELETE CASCADE,
  "gradeFrom" INTEGER,
  "gradeTo" INTEGER,
  UNIQUE ("tutorId", "subjectId")
);
CREATE INDEX "TutorSubject_tutorId_idx" ON "TutorSubject" ("tutorId");
CREATE INDEX "TutorSubject_subjectId_idx" ON "TutorSubject" ("subjectId");
CREATE TABLE "StudentModel" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL UNIQUE REFERENCES "Student" ("id") ON DELETE CASCADE,
  "knowledgeMap" JSONB NOT NULL DEFAULT '{}',
  "errorPatterns" JSONB NOT NULL DEFAULT '{}',
  "learningStyle" TEXT,
  "difficultyLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "speed" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "strengths" JSONB NOT NULL DEFAULT '[]',
  "weaknesses" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE "EducationProfile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL UNIQUE REFERENCES "Student" ("id") ON DELETE CASCADE,
  "currentGrade" INTEGER NOT NULL,
  "targetExam" TEXT,
  "targetScore" INTEGER,
  "preferredLang" TEXT NOT NULL DEFAULT 'ru',
  "studyHoursPerWeek" DOUBLE PRECISION NOT NULL DEFAULT 5,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE "LearningTrajectory" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL UNIQUE REFERENCES "Student" ("id") ON DELETE CASCADE,
  "plan" JSONB NOT NULL DEFAULT '[]',
  "currentTopicIndex" INTEGER NOT NULL DEFAULT 0,
  "totalTopics" INTEGER NOT NULL DEFAULT 0,
  "completedTopics" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- ============================================================
-- DIAGNOSTICS
-- ============================================================

CREATE TABLE "DiagnosticTest" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "subjectId" UUID NOT NULL REFERENCES "Subject" ("id"),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "grade" INTEGER NOT NULL,
  "questions" JSONB NOT NULL DEFAULT '[]',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "DiagnosticTest_subjectId_grade_idx" ON "DiagnosticTest" ("subjectId", "grade");
CREATE TABLE "DiagnosticResult" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL REFERENCES "Student" ("id") ON DELETE CASCADE,
  "diagnosticTestId" UUID NOT NULL REFERENCES "DiagnosticTest" ("id"),
  "status" "DiagnosticStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "answers" JSONB NOT NULL DEFAULT '[]',
  "topicScores" JSONB NOT NULL DEFAULT '{}',
  "overallScore" DOUBLE PRECISION,
  "completedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "DiagnosticResult_studentId_idx" ON "DiagnosticResult" ("studentId");
CREATE INDEX "DiagnosticResult_diagnosticTestId_idx" ON "DiagnosticResult" ("diagnosticTestId");
-- ============================================================
-- LESSONS (Online + Group)
-- ============================================================

CREATE TABLE "Lesson" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tutorId" UUID NOT NULL REFERENCES "Tutor" ("id"),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" "LessonType" NOT NULL DEFAULT 'INDIVIDUAL',
  "status" "LessonStatus" NOT NULL DEFAULT 'SCHEDULED',
  "scheduledAt" TIMESTAMPTZ NOT NULL,
  "duration" INTEGER NOT NULL DEFAULT 50,
  "endedAt" TIMESTAMPTZ,
  "meetingUrl" TEXT,
  "recordingUrl" TEXT,
  "whiteboardData" JSONB,
  "materials" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Lesson_tutorId_idx" ON "Lesson" ("tutorId");
CREATE INDEX "Lesson_status_idx" ON "Lesson" ("status");
CREATE INDEX "Lesson_scheduledAt_idx" ON "Lesson" ("scheduledAt");
CREATE TABLE "LessonStudent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lessonId" UUID NOT NULL REFERENCES "Lesson" ("id") ON DELETE CASCADE,
  "studentId" UUID NOT NULL REFERENCES "Student" ("id") ON DELETE CASCADE,
  "attended" BOOLEAN NOT NULL DEFAULT false,
  "joinedAt" TIMESTAMPTZ,
  "leftAt" TIMESTAMPTZ,
  "notes" TEXT,
  UNIQUE ("lessonId", "studentId")
);
CREATE INDEX "LessonStudent_lessonId_idx" ON "LessonStudent" ("lessonId");
CREATE INDEX "LessonStudent_studentId_idx" ON "LessonStudent" ("studentId");
CREATE TABLE "GroupLesson" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lessonId" UUID NOT NULL UNIQUE REFERENCES "Lesson" ("id") ON DELETE CASCADE,
  "maxParticipants" INTEGER NOT NULL DEFAULT 10,
  "isOpen" BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE "GroupLessonParticipant" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupLessonId" UUID NOT NULL REFERENCES "GroupLesson" ("id") ON DELETE CASCADE,
  "studentId" UUID NOT NULL REFERENCES "Student" ("id") ON DELETE CASCADE,
  "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("groupLessonId", "studentId")
);
CREATE TABLE "Schedule" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tutorId" UUID NOT NULL REFERENCES "Tutor" ("id") ON DELETE CASCADE,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "specificDate" TIMESTAMPTZ,
  "isBlocked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Schedule_tutorId_idx" ON "Schedule" ("tutorId");
CREATE INDEX "Schedule_dayOfWeek_idx" ON "Schedule" ("dayOfWeek");
-- ============================================================
-- HOMEWORK & TESTS
-- ============================================================

CREATE TABLE "Homework" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tutorId" UUID NOT NULL REFERENCES "Tutor" ("id"),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "topicId" UUID,
  "grade" INTEGER,
  "format" "HomeworkFormat" NOT NULL,
  "questions" JSONB NOT NULL DEFAULT '[]',
  "dueDate" TIMESTAMPTZ,
  "maxScore" INTEGER NOT NULL DEFAULT 100,
  "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Homework_tutorId_idx" ON "Homework" ("tutorId");
CREATE INDEX "Homework_format_idx" ON "Homework" ("format");
CREATE INDEX "Homework_dueDate_idx" ON "Homework" ("dueDate");
CREATE TABLE "HomeworkSubmission" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "homeworkId" UUID NOT NULL REFERENCES "Homework" ("id") ON DELETE CASCADE,
  "studentId" UUID NOT NULL REFERENCES "Student" ("id") ON DELETE CASCADE,
  "status" "HomeworkStatus" NOT NULL DEFAULT 'ASSIGNED',
  "answers" JSONB NOT NULL DEFAULT '{}',
  "fileUrls" TEXT[] DEFAULT '{}',
  "oralRecordingUrl" TEXT,
  "oralTranscription" TEXT,
  "score" DOUBLE PRECISION,
  "aiAnalysis" JSONB,
  "aiCheckedAt" TIMESTAMPTZ,
  "submittedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("homeworkId", "studentId")
);
CREATE INDEX "HomeworkSubmission_homeworkId_idx" ON "HomeworkSubmission" ("homeworkId");
CREATE INDEX "HomeworkSubmission_studentId_idx" ON "HomeworkSubmission" ("studentId");
CREATE INDEX "HomeworkSubmission_status_idx" ON "HomeworkSubmission" ("status");
CREATE TABLE "Test" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tutorId" UUID REFERENCES "Tutor" ("id"),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "topicId" UUID,
  "grade" INTEGER,
  "questions" JSONB NOT NULL DEFAULT '[]',
  "timeLimit" INTEGER,
  "isAdaptive" BOOLEAN NOT NULL DEFAULT false,
  "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
  "maxScore" INTEGER NOT NULL DEFAULT 100,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Test_tutorId_idx" ON "Test" ("tutorId");
CREATE INDEX "Test_isAdaptive_idx" ON "Test" ("isAdaptive");
CREATE TABLE "TestAttempt" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "testId" UUID NOT NULL REFERENCES "Test" ("id") ON DELETE CASCADE,
  "studentId" UUID NOT NULL REFERENCES "Student" ("id") ON DELETE CASCADE,
  "answers" JSONB NOT NULL DEFAULT '{}',
  "score" DOUBLE PRECISION,
  "topicScores" JSONB NOT NULL DEFAULT '{}',
  "timeSpent" INTEGER,
  "completedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "TestAttempt_testId_idx" ON "TestAttempt" ("testId");
CREATE INDEX "TestAttempt_studentId_idx" ON "TestAttempt" ("studentId");
-- ============================================================
-- PROGRESS TRACKING
-- ============================================================

CREATE TABLE "Progress" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL REFERENCES "Student" ("id") ON DELETE CASCADE,
  "topicId" UUID NOT NULL,
  "masteryBefore" DOUBLE PRECISION NOT NULL,
  "masteryAfter" DOUBLE PRECISION NOT NULL,
  "source" TEXT NOT NULL,
  "sourceId" UUID,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Progress_studentId_idx" ON "Progress" ("studentId");
CREATE INDEX "Progress_topicId_idx" ON "Progress" ("topicId");
CREATE INDEX "Progress_createdAt_idx" ON "Progress" ("createdAt");
-- ============================================================
-- AI ENGINE
-- ============================================================

CREATE TABLE "AIConversation" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL REFERENCES "Student" ("id") ON DELETE CASCADE,
  "mode" "AIMode" NOT NULL,
  "subjectId" UUID,
  "topicId" UUID,
  "title" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "AIConversation_studentId_idx" ON "AIConversation" ("studentId");
CREATE INDEX "AIConversation_mode_idx" ON "AIConversation" ("mode");
CREATE INDEX "AIConversation_isActive_idx" ON "AIConversation" ("isActive");
CREATE TABLE "AIMessage" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversationId" UUID NOT NULL REFERENCES "AIConversation" ("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "AIMessage_conversationId_idx" ON "AIMessage" ("conversationId");
CREATE INDEX "AIMessage_createdAt_idx" ON "AIMessage" ("createdAt");
-- ============================================================
-- GAMIFICATION
-- ============================================================

CREATE TABLE "StudentGameProfile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL UNIQUE REFERENCES "Student" ("id") ON DELETE CASCADE,
  "xp" INTEGER NOT NULL DEFAULT 0,
  "level" INTEGER NOT NULL DEFAULT 1,
  "currentStreak" INTEGER NOT NULL DEFAULT 0,
  "longestStreak" INTEGER NOT NULL DEFAULT 0,
  "lastActiveDate" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE "Achievement" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "nameKz" TEXT,
  "description" TEXT NOT NULL,
  "descriptionKz" TEXT,
  "icon" TEXT NOT NULL,
  "condition" JSONB NOT NULL,
  "xpReward" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE "StudentAchievement" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentProfileId" UUID NOT NULL REFERENCES "StudentGameProfile" ("id") ON DELETE CASCADE,
  "achievementId" UUID NOT NULL REFERENCES "Achievement" ("id"),
  "earnedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("studentProfileId", "achievementId")
);
CREATE INDEX "StudentAchievement_studentProfileId_idx" ON "StudentAchievement" ("studentProfileId");
CREATE TABLE "XPTransaction" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL REFERENCES "Student" ("id") ON DELETE CASCADE,
  "amount" INTEGER NOT NULL,
  "action" "XPActionType" NOT NULL,
  "sourceId" UUID,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "XPTransaction_studentId_idx" ON "XPTransaction" ("studentId");
CREATE INDEX "XPTransaction_createdAt_idx" ON "XPTransaction" ("createdAt");
-- ============================================================
-- COMMUNICATIONS
-- ============================================================

CREATE TABLE "Conversation" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" TEXT NOT NULL DEFAULT 'direct',
  "lastMessageAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation" ("lastMessageAt");
CREATE TABLE "ConversationParticipant" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversationId" UUID NOT NULL REFERENCES "Conversation" ("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User" ("id") ON DELETE CASCADE,
  "lastReadAt" TIMESTAMPTZ,
  UNIQUE ("conversationId", "userId")
);
CREATE INDEX "ConversationParticipant_conversationId_idx" ON "ConversationParticipant" ("conversationId");
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant" ("userId");
CREATE TABLE "Message" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversationId" UUID NOT NULL REFERENCES "Conversation" ("id") ON DELETE CASCADE,
  "senderId" UUID NOT NULL REFERENCES "User" ("id"),
  "content" TEXT NOT NULL,
  "fileUrls" TEXT[] DEFAULT '{}',
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Message_conversationId_idx" ON "Message" ("conversationId");
CREATE INDEX "Message_senderId_idx" ON "Message" ("senderId");
CREATE INDEX "Message_createdAt_idx" ON "Message" ("createdAt");
CREATE TABLE "Notification" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User" ("id") ON DELETE CASCADE,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "data" JSONB,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "emailSent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Notification_userId_idx" ON "Notification" ("userId");
CREATE INDEX "Notification_isRead_idx" ON "Notification" ("isRead");
CREATE INDEX "Notification_createdAt_idx" ON "Notification" ("createdAt");
-- ============================================================
-- FINANCES
-- ============================================================

CREATE TABLE "Package" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "nameKz" TEXT,
  "description" TEXT,
  "descriptionKz" TEXT,
  "lessonsCount" INTEGER NOT NULL,
  "lessonDuration" INTEGER NOT NULL DEFAULT 50,
  "priceTotal" INTEGER NOT NULL,
  "pricePerLesson" INTEGER NOT NULL,
  "features" JSONB NOT NULL DEFAULT '[]',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE "Subscription" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "planName" TEXT NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "lessonsPerMonth" INTEGER NOT NULL,
  "pricePerMonth" INTEGER NOT NULL,
  "features" JSONB NOT NULL DEFAULT '[]',
  "currentPeriodStart" TIMESTAMPTZ NOT NULL,
  "currentPeriodEnd" TIMESTAMPTZ NOT NULL,
  "cancelledAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Subscription_userId_idx" ON "Subscription" ("userId");
CREATE INDEX "Subscription_status_idx" ON "Subscription" ("status");
CREATE TABLE "PromoCode" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL UNIQUE,
  "discountPercent" INTEGER,
  "discountAmount" INTEGER,
  "maxUses" INTEGER,
  "currentUses" INTEGER NOT NULL DEFAULT 0,
  "validFrom" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "validUntil" TIMESTAMPTZ,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "PromoCode_code_idx" ON "PromoCode" ("code");
CREATE INDEX "PromoCode_isActive_idx" ON "PromoCode" ("isActive");
CREATE TABLE "Payment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "packageId" UUID REFERENCES "Package" ("id"),
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'KZT',
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "method" TEXT,
  "externalId" TEXT,
  "promoCodeId" UUID REFERENCES "PromoCode" ("id"),
  "discount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Payment_userId_idx" ON "Payment" ("userId");
CREATE INDEX "Payment_status_idx" ON "Payment" ("status");
CREATE INDEX "Payment_createdAt_idx" ON "Payment" ("createdAt");
CREATE TABLE "FamilyPlan" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "parentUserId" UUID NOT NULL,
  "discountPercent" INTEGER NOT NULL DEFAULT 10,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "FamilyPlan_parentUserId_idx" ON "FamilyPlan" ("parentUserId");
CREATE TABLE "Earning" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tutorId" UUID NOT NULL REFERENCES "Tutor" ("id"),
  "amount" INTEGER NOT NULL,
  "lessonId" UUID,
  "description" TEXT,
  "paidAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Earning_tutorId_idx" ON "Earning" ("tutorId");
CREATE INDEX "Earning_createdAt_idx" ON "Earning" ("createdAt");
-- ============================================================
-- CURRICULUM (РљРўРџ)
-- ============================================================

CREATE TABLE "CurriculumPlan" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tutorId" UUID NOT NULL REFERENCES "Tutor" ("id") ON DELETE CASCADE,
  "subjectId" UUID NOT NULL REFERENCES "Subject" ("id"),
  "title" TEXT NOT NULL,
  "grade" INTEGER NOT NULL,
  "isPersonal" BOOLEAN NOT NULL DEFAULT false,
  "studentId" UUID,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "CurriculumPlan_tutorId_idx" ON "CurriculumPlan" ("tutorId");
CREATE INDEX "CurriculumPlan_subjectId_idx" ON "CurriculumPlan" ("subjectId");
CREATE TABLE "CurriculumPlanItem" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "curriculumPlanId" UUID NOT NULL REFERENCES "CurriculumPlan" ("id") ON DELETE CASCADE,
  "topicId" UUID,
  "title" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "notes" TEXT,
  "plannedDate" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "CurriculumPlanItem_curriculumPlanId_idx" ON "CurriculumPlanItem" ("curriculumPlanId");
CREATE INDEX "CurriculumPlanItem_orderIndex_idx" ON "CurriculumPlanItem" ("orderIndex");
-- ============================================================
-- REVIEWS
-- ============================================================

CREATE TABLE "Review" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tutorId" UUID NOT NULL REFERENCES "Tutor" ("id") ON DELETE CASCADE,
  "authorUserId" UUID NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "isApproved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Review_tutorId_idx" ON "Review" ("tutorId");
CREATE INDEX "Review_rating_idx" ON "Review" ("rating");
-- ============================================================
-- JWT Custom Claims Hook (for @nuxtjs/supabase)
-- ============================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_name text;
  v_surname text;
BEGIN
  SELECT u.role, u.name, u.surname
    INTO v_role, v_name, v_surname
    FROM public."User" u
   WHERE u."authId" = (event->'claims'->>'sub');

  IF v_role IS NOT NULL THEN
    RETURN jsonb_build_object(
      'claims', (event->'claims') || jsonb_build_object(
        'user_role', v_role,
        'user_name', v_name,
        'user_surname', v_surname
      )
    );
  END IF;

  RETURN event;
END;
$$;
-- ============================================================
-- Auto-update updatedAt trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$;
-- Apply updatedAt triggers to all tables that have updatedAt
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'updatedAt'
    GROUP BY table_name
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()',
      'update_' || lower(tbl) || '_updated_at', tbl
    );
  END LOOP;
END;
$$;
-- ============================================================
-- Enable Realtime for messenger tables
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE "Message";
ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";
