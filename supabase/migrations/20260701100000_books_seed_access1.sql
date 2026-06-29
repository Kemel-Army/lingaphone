-- ═══════════════════════════════════════════════════════════════
-- Seed: "Access 1" grammar book (level A1) + single full-book module
-- ═══════════════════════════════════════════════════════════════
-- The scanned PDF is served statically from /public/books/. Future
-- admin-uploaded books will instead live in the `books` storage bucket;
-- the app resolves pdfUrl as-is (absolute path or full URL).
-- Module split into units is left for the admin to do later (one module now).

INSERT INTO "Book" (id, title, description, level, "coverUrl", "isPublished")
VALUES (
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'Access 1',
  'Grammar Book — Beginner (A1). Express Publishing. Полный учебник одним модулем.',
  'A1',
  NULL,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title         = EXCLUDED.title,
  description   = EXCLUDED.description,
  level         = EXCLUDED.level,
  "isPublished" = EXCLUDED."isPublished";

INSERT INTO "Module" (id, "bookId", title, "order", "pdfUrl")
VALUES (
  'a0000000-0000-4000-8000-000000000101'::uuid,
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'Access 1 — Grammar Book (полный)',
  1,
  '/books/access-1-gb.pdf'
)
ON CONFLICT (id) DO UPDATE SET
  title    = EXCLUDED.title,
  "order"  = EXCLUDED."order",
  "pdfUrl" = EXCLUDED."pdfUrl";
