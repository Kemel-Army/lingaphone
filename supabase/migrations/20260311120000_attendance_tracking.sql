-- Attendance tracking: extend LessonStudent with attendance status
-- Step 20: Add attendanceStatus, markedAt, markedBy to LessonStudent

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AttendanceStatus') THEN
    CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE');
  END IF;
END $$;

ALTER TABLE "LessonStudent"
  ADD COLUMN IF NOT EXISTS "attendanceStatus" "AttendanceStatus",
  ADD COLUMN IF NOT EXISTS "markedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "markedBy" UUID REFERENCES "User"(id);

-- Index for admin attendance queries
CREATE INDEX IF NOT EXISTS idx_lesson_student_attendance
  ON "LessonStudent" ("attendanceStatus")
  WHERE "attendanceStatus" IS NOT NULL;
