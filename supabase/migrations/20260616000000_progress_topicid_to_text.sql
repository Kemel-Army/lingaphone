-- Change Progress.topicId from UUID to TEXT
-- Diagnostics uses topic names (text) as identifiers, not UUID references.
-- This makes Progress compatible with the diagnostic flow.
ALTER TABLE "Progress" ALTER COLUMN "topicId" TYPE TEXT USING "topicId"::TEXT;
