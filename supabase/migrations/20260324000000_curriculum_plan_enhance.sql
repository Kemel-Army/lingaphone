-- Enhance CurriculumPlan and CurriculumPlanItem for tutoring platform
-- Replace school-style КТП with adaptive study programs

-- Plan-level description
ALTER TABLE "CurriculumPlan" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Topic-level enhancements
ALTER TABLE "CurriculumPlanItem" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "CurriculumPlanItem" ADD COLUMN IF NOT EXISTS "duration" INTEGER; -- estimated minutes per topic
ALTER TABLE "CurriculumPlanItem" ADD COLUMN IF NOT EXISTS "materials" JSONB NOT NULL DEFAULT '[]'; -- [{name, url, type}]
ALTER TABLE "CurriculumPlanItem" ADD COLUMN IF NOT EXISTS "objectives" TEXT; -- learning objectives / what student should know after
