-- Native structured lesson exercises (Duolingo-style player), replacing the
-- scan-overlay student view. Book → Module → LessonUnit → LessonExercise.
-- Answer key lives in a service-role-only table so it never reaches the student.

create table if not exists public."LessonUnit" (
  "id"         uuid primary key default gen_random_uuid(),
  "moduleId"   uuid not null references public."Module"("id") on delete cascade,
  "title"      text not null,
  "subtitle"   text,
  "orderIndex" int not null default 0,
  "intro"      jsonb not null default '[]'::jsonb,   -- grammar-rule blocks (text/image)
  "createdAt"  timestamptz not null default now(),
  "updatedAt"  timestamptz not null default now()
);

create table if not exists public."LessonExercise" (
  "id"          uuid primary key default gen_random_uuid(),
  "unitId"      uuid not null references public."LessonUnit"("id") on delete cascade,
  "orderIndex"  int not null default 0,
  "type"        text not null check ("type" in
    ('FILL_BLANK','CHOOSE','MCQ','WORD_IMAGE_MATCH','MATCH_PAIRS','REORDER','TRUE_FALSE','SORT_COLUMNS','SHORT_TEXT')),
  "instruction" text,
  "content"     jsonb not null default '{}'::jsonb,  -- type-specific, NO answer
  "xp"          int not null default 10,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now()
);

create table if not exists public."LessonExerciseAnswer" (
  "exerciseId"  uuid primary key references public."LessonExercise"("id") on delete cascade,
  "answerKey"   jsonb not null default '{}'::jsonb,
  "explanation" text,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now()
);

create table if not exists public."LessonAttempt" (
  "id"         uuid primary key default gen_random_uuid(),
  "studentId"  uuid not null references public."Student"("id") on delete cascade,
  "exerciseId" uuid not null references public."LessonExercise"("id") on delete cascade,
  "response"   jsonb not null default '{}'::jsonb,
  "isCorrect"  boolean,
  "score"      int check ("score" is null or "score" between 0 and 100),
  "createdAt"  timestamptz not null default now(),
  "updatedAt"  timestamptz not null default now(),
  unique ("studentId","exerciseId")
);

create index if not exists "idx_lesson_unit_module"     on public."LessonUnit"("moduleId","orderIndex");
create index if not exists "idx_lesson_exercise_unit"   on public."LessonExercise"("unitId","orderIndex");
create index if not exists "idx_lesson_attempt_student" on public."LessonAttempt"("studentId");
create index if not exists "idx_lesson_attempt_exercise" on public."LessonAttempt"("exerciseId");

alter table public."LessonUnit"           enable row level security;
alter table public."LessonExercise"       enable row level security;
alter table public."LessonExerciseAnswer" enable row level security;
alter table public."LessonAttempt"        enable row level security;

create policy "lesson_unit_select"      on public."LessonUnit"     for select to authenticated using (true);
create policy "lesson_unit_service_all" on public."LessonUnit"     for all    to service_role  using (true);
create policy "lesson_exercise_select"      on public."LessonExercise" for select to authenticated using (true);
create policy "lesson_exercise_service_all" on public."LessonExercise" for all    to service_role  using (true);

-- Answers: service role only (no authenticated policy = students cannot read).
create policy "lesson_answer_service_all" on public."LessonExerciseAnswer" for all to service_role using (true);

create policy "lesson_attempt_select_own" on public."LessonAttempt" for select to authenticated
  using ("studentId" in (select id from public."Student" where "userId" = public.get_current_user_id()));
create policy "lesson_attempt_service_all" on public."LessonAttempt" for all to service_role using (true);
