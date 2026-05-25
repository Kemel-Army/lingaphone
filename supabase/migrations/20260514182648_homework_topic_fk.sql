-- Homework.topicId was created as a plain uuid column without a FOREIGN KEY
-- to Topic.id, so PostgREST cannot resolve embeddings like
-- HomeworkSubmission?select=...,Homework(topicId,Topic(subjectId))
-- and 400s the request.
--
-- After 20260618000000_replace_subjects_math_grades_1_6 wiped/replaced topics,
-- 9 Homework rows reference Topic ids that no longer exist. Null those out
-- (the references are already broken) so we can add the constraint.

UPDATE "Homework"
SET "topicId" = NULL
WHERE "topicId" IS NOT NULL
  AND "topicId" NOT IN (SELECT id FROM "Topic");

ALTER TABLE "Homework"
  ADD CONSTRAINT "Homework_topicId_fkey"
  FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
