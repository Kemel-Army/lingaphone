-- Phase 4: Lesson Messages table for real-time chat during online lessons
-- ============================================================

CREATE TABLE "LessonMessage" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lessonId" UUID NOT NULL REFERENCES "Lesson" ("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User" ("id") ON DELETE CASCADE,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "LessonMessage_lessonId_idx" ON "LessonMessage" ("lessonId");
CREATE INDEX "LessonMessage_createdAt_idx" ON "LessonMessage" ("createdAt");

-- RLS policies
-- Pattern: auth.uid()::text matches User.authId → get User.id → check participation
ALTER TABLE "LessonMessage" ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's internal UUID from auth id
-- Users can read messages for lessons they are part of
CREATE POLICY "LessonMessage: participants can read"
  ON "LessonMessage"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Lesson" l
      JOIN "Tutor" t ON t."id" = l."tutorId"
      JOIN "User" u ON u."id" = t."userId"
      WHERE l."id" = "LessonMessage"."lessonId"
        AND u."authId" = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM "LessonStudent" ls
      JOIN "Student" s ON s."id" = ls."studentId"
      JOIN "User" u ON u."id" = s."userId"
      WHERE ls."lessonId" = "LessonMessage"."lessonId"
        AND u."authId" = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM "GroupLessonParticipant" glp
      JOIN "GroupLesson" gl ON gl."id" = glp."groupLessonId"
      JOIN "Student" s ON s."id" = glp."studentId"
      JOIN "User" u ON u."id" = s."userId"
      WHERE gl."lessonId" = "LessonMessage"."lessonId"
        AND u."authId" = auth.uid()::text
    )
  );

-- Authenticated users can insert messages for lessons they are part of
CREATE POLICY "LessonMessage: participants can insert"
  ON "LessonMessage"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User" u WHERE u."id" = "LessonMessage"."userId" AND u."authId" = auth.uid()::text
    )
    AND (
      EXISTS (
        SELECT 1 FROM "Lesson" l
        JOIN "Tutor" t ON t."id" = l."tutorId"
        JOIN "User" u ON u."id" = t."userId"
        WHERE l."id" = "LessonMessage"."lessonId"
          AND u."authId" = auth.uid()::text
      )
      OR EXISTS (
        SELECT 1 FROM "LessonStudent" ls
        JOIN "Student" s ON s."id" = ls."studentId"
        JOIN "User" u ON u."id" = s."userId"
        WHERE ls."lessonId" = "LessonMessage"."lessonId"
          AND u."authId" = auth.uid()::text
      )
      OR EXISTS (
        SELECT 1 FROM "GroupLessonParticipant" glp
        JOIN "GroupLesson" gl ON gl."id" = glp."groupLessonId"
        JOIN "Student" s ON s."id" = glp."studentId"
        JOIN "User" u ON u."id" = s."userId"
        WHERE gl."lessonId" = "LessonMessage"."lessonId"
          AND u."authId" = auth.uid()::text
      )
    )
  );

-- Enable Realtime for LessonMessage
ALTER publication supabase_realtime ADD TABLE "LessonMessage";
