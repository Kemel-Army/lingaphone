-- ============================================================
-- LINGAFON — Seed: 1 demo scenario for student@linga.kz
-- Run AFTER 001_core_schema.sql.
--
-- Creates:
--   - 4 branches (3 offline Almaty + 1 ONLINE)
--   - 1 group A2 led by teacher@linga.kz at Almaty — Достык
--   - Student row for student@linga.kz, joins the group
--   - 10 lessons (5 past, 5 future) over the past/next 3 weeks
--   - 5 grades for past lessons (avg = 4.4)
--   - 1 MonthlyMedal for last month + 1 paid Payout
--   - 3 materials (audio + video + dictionary link)
--   - 2 vocabulary entries
--   - 2 homework assignments (1 TEST, 1 ORAL)
--   - 1 conversation between student and teacher with 3 messages
--   - 2 notifications
--
-- Idempotent: re-running won't duplicate data.
-- ============================================================

DO $$
DECLARE
  v_student_user_id  UUID;
  v_teacher_user_id  UUID;

  v_student_id       UUID;
  v_teacher_id       UUID;

  v_branch_id        UUID;
  v_branch_online_id UUID;
  v_group_id         UUID;

  v_lesson_id        UUID;
  v_lesson_ids       UUID[] := ARRAY[]::UUID[];

  v_hw_id            UUID;
  v_conv_id          UUID;
  v_medal_id         UUID;
BEGIN
  -- ── Resolve User ids (auth seed already created them) ──
  SELECT id INTO v_student_user_id FROM public."User" WHERE email = 'student@linga.kz';
  SELECT id INTO v_teacher_user_id FROM public."User" WHERE email = 'teacher@linga.kz';

  IF v_student_user_id IS NULL OR v_teacher_user_id IS NULL THEN
    RAISE EXCEPTION 'Seed users not found. Run /api/auth/seed-lingafon-users first.';
  END IF;

  -- ── Student row ──
  INSERT INTO public."Student" ("userId", level, "schoolGrade", "goldStreak", "totalEarnings", "dailyStreak")
  VALUES (v_student_user_id, 'A2', 9, 2, 18000, 12)
  ON CONFLICT ("userId") DO UPDATE SET level = EXCLUDED.level
  RETURNING id INTO v_student_id;

  -- ── Teacher row ──
  INSERT INTO public."Teacher" ("userId", bio, "yearsOfExperience", rating, "reviewCount")
  VALUES (v_teacher_user_id, 'British Council certified. Speaking & olympiad coach.', 8, 4.9, 47)
  ON CONFLICT ("userId") DO UPDATE SET bio = EXCLUDED.bio
  RETURNING id INTO v_teacher_id;

  -- ── Branches (only if empty) ──
  IF NOT EXISTS (SELECT 1 FROM public."Branch") THEN
    INSERT INTO public."Branch" (name, kind, address, city) VALUES
      ('Алматы — Достык',       'OFFLINE', 'пр. Достык 89',       'Алматы'),
      ('Алматы — Розыбакиева',  'OFFLINE', 'ул. Розыбакиева 247', 'Алматы'),
      ('Алматы — Самал',        'OFFLINE', 'мкр. Самал-2, 33',    'Алматы'),
      ('Онлайн',                'ONLINE',   NULL,                  NULL);
  END IF;

  SELECT id INTO v_branch_id        FROM public."Branch" WHERE name = 'Алматы — Достык' LIMIT 1;
  SELECT id INTO v_branch_online_id FROM public."Branch" WHERE kind = 'ONLINE'           LIMIT 1;

  -- ── Group ──
  INSERT INTO public."Group" (name, level, "teacherId", "branchId", schedule, "maxStudents")
  SELECT 'A2 Tuesday Stars', 'A2', v_teacher_id, v_branch_id,
         '[{"weekday":2,"startTime":"16:30","durationMin":60},{"weekday":4,"startTime":"16:30","durationMin":60}]'::jsonb,
         10
  WHERE NOT EXISTS (SELECT 1 FROM public."Group" WHERE name = 'A2 Tuesday Stars')
  RETURNING id INTO v_group_id;

  IF v_group_id IS NULL THEN
    SELECT id INTO v_group_id FROM public."Group" WHERE name = 'A2 Tuesday Stars';
  END IF;

  -- ── GroupMember ──
  INSERT INTO public."GroupMember" ("groupId", "studentId", status)
  VALUES (v_group_id, v_student_id, 'ACTIVE')
  ON CONFLICT ("groupId", "studentId") DO NOTHING;

  -- ── Lessons (clear and recreate for stable timeline) ──
  DELETE FROM public."Lesson" WHERE "groupId" = v_group_id;

  -- 5 past (status COMPLETED) + 5 future (SCHEDULED)
  INSERT INTO public."Lesson" ("groupId", "startsAt", "durationMin", topic, status)
  VALUES
    (v_group_id, now() - INTERVAL '21 days', 60, 'Going shopping',     'COMPLETED'),
    (v_group_id, now() - INTERVAL '17 days', 60, 'Past Simple intro',  'COMPLETED'),
    (v_group_id, now() - INTERVAL '14 days', 60, 'Family vocabulary',  'COMPLETED'),
    (v_group_id, now() - INTERVAL '11 days', 60, 'Daily routines',     'COMPLETED'),
    (v_group_id, now() -  INTERVAL '7 days', 60, 'Past Simple',        'COMPLETED'),
    (v_group_id, now() +  INTERVAL '2 days', 60, 'Travel phrases',     'SCHEDULED'),
    (v_group_id, now() +  INTERVAL '4 days', 60, 'Asking questions',   'SCHEDULED'),
    (v_group_id, now() +  INTERVAL '9 days', 60, 'Food vocabulary',    'SCHEDULED'),
    (v_group_id, now() + INTERVAL '11 days', 60, 'My weekend',         'SCHEDULED'),
    (v_group_id, now() + INTERVAL '16 days', 60, 'Comparatives',       'SCHEDULED');

  -- Collect lesson ids
  SELECT array_agg(id ORDER BY "startsAt") INTO v_lesson_ids FROM public."Lesson" WHERE "groupId" = v_group_id;

  -- ── Grades (for 5 past lessons; avg = 4.4) ──
  -- ids[1..5] are past lessons. values: 5,4,5,4,4 → mean 4.4
  INSERT INTO public."Grade" ("studentId", "lessonId", value, comment, "gradedBy", "gradedAt")
  VALUES
    (v_student_id, v_lesson_ids[1], 4, NULL, v_teacher_id, now() - INTERVAL '21 days'),
    (v_student_id, v_lesson_ids[2], 5, 'Отличная работа!', v_teacher_id, now() - INTERVAL '17 days'),
    (v_student_id, v_lesson_ids[3], 4, NULL, v_teacher_id, now() - INTERVAL '14 days'),
    (v_student_id, v_lesson_ids[4], 4, NULL, v_teacher_id, now() - INTERVAL '11 days'),
    (v_student_id, v_lesson_ids[5], 5, 'Прекрасный устный ответ!', v_teacher_id, now() - INTERVAL '7 days')
  ON CONFLICT ("studentId", "lessonId") DO NOTHING;

  -- ── Attendance (all PRESENT for past lessons) ──
  INSERT INTO public."Attendance" ("studentId", "lessonId", status, "markedBy", "markedAt")
  SELECT v_student_id, unnest(v_lesson_ids[1:5]), 'PRESENT', v_teacher_id, now()
  ON CONFLICT ("studentId", "lessonId") DO NOTHING;

  -- ── MonthlyMedal for previous month (GOLD, since avg 4.7 historically) ──
  INSERT INTO public."MonthlyMedal" ("studentId", month, "averageGrade", medal, payout, "confirmedBy")
  VALUES (
    v_student_id,
    to_char(date_trunc('month', now() - INTERVAL '1 month'), 'YYYY-MM'),
    4.7, 'GOLD', 5000, v_teacher_id
  )
  ON CONFLICT ("studentId", month) DO UPDATE SET medal = EXCLUDED.medal
  RETURNING id INTO v_medal_id;

  -- ── Payout for that medal (PAID) ──
  INSERT INTO public."Payout" ("medalId", "studentId", amount, status, method, kind, "paidAt")
  VALUES (v_medal_id, v_student_id, 5000, 'PAID', 'Kaspi', 'MEDAL', now() - INTERVAL '5 days')
  ON CONFLICT DO NOTHING;

  -- ── Homework (one TEST attached to a future lesson) ──
  INSERT INTO public."Homework" ("lessonId", title, description, format, payload, "dueAt", "maxScore")
  SELECT v_lesson_ids[6], 'Past Simple — выбери правильную форму',
         '4 вопроса. Используй Past Simple.', 'TEST',
         '{"questions":[
            {"id":"q1","text":"I _____ to London last summer.","options":[{"id":"a","text":"go"},{"id":"b","text":"went"},{"id":"c","text":"gone"}],"correctOptionId":"b"},
            {"id":"q2","text":"She _____ a book yesterday.","options":[{"id":"a","text":"reads"},{"id":"b","text":"read"},{"id":"c","text":"readed"}],"correctOptionId":"b"},
            {"id":"q3","text":"We _____ at home last weekend.","options":[{"id":"a","text":"was"},{"id":"b","text":"were"},{"id":"c","text":"are"}],"correctOptionId":"b"},
            {"id":"q4","text":"_____ you see the new film?","options":[{"id":"a","text":"Do"},{"id":"b","text":"Did"},{"id":"c","text":"Does"}],"correctOptionId":"b"}
          ]}'::jsonb,
         now() + INTERVAL '5 days', 100
  WHERE NOT EXISTS (SELECT 1 FROM public."Homework" WHERE "lessonId" = v_lesson_ids[6])
  RETURNING id INTO v_hw_id;

  -- ── Materials (common — groupId NULL) ──
  IF NOT EXISTS (SELECT 1 FROM public."Material" WHERE tag = 'demo') THEN
    INSERT INTO public."Material" ("groupId", kind, title, description, url, "durationSec", tag) VALUES
      (v_group_id, 'AUDIO', 'Daily Routines — Listen & Repeat', 'Носитель произносит фразы. Слушай в наушниках, повторяй вслух.',
       'https://www.soundjay.com/buttons/button-1.mp3', 320, 'demo'),
      (v_group_id, 'VIDEO', 'Запись урока · Past Simple', 'Видео прошедшего урока твоей группы.',
       'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 596, 'demo'),
      (NULL, 'LINK', 'Cambridge Online Dictionary', 'Открой в новой вкладке.',
       'https://dictionary.cambridge.org', NULL, 'demo');
  END IF;

  -- ── Vocabulary ──
  INSERT INTO public."VocabularyEntry" ("studentId", word, ipa, translation, example, "reviewCount", "bestScore")
  VALUES
    (v_student_id, 'Breakfast', '/ˈbrekfəst/', 'завтрак',  'I have breakfast at 7.', 5, 92),
    (v_student_id, 'Schedule',  '/ˈʃedjuːl/',  'расписание','My schedule is busy.',   3, 78)
  ON CONFLICT ("studentId", word) DO NOTHING;

  -- ── Conversation (student ↔ teacher) ──
  SELECT id INTO v_conv_id FROM public."Conversation"
   WHERE kind = 'DIRECT' AND "participantIds" @> ARRAY[v_student_user_id, v_teacher_user_id]
   LIMIT 1;

  IF v_conv_id IS NULL THEN
    INSERT INTO public."Conversation" (kind, "participantIds")
    VALUES ('DIRECT', ARRAY[v_student_user_id, v_teacher_user_id])
    RETURNING id INTO v_conv_id;

    INSERT INTO public."Message" ("conversationId", "senderId", body, "createdAt") VALUES
      (v_conv_id, v_teacher_user_id, 'Hi! Did you do the Past Simple homework?', now() - INTERVAL '90 minutes'),
      (v_conv_id, v_student_user_id, 'Yes, almost done. Question 4 is tricky.',  now() - INTERVAL '60 minutes'),
      (v_conv_id, v_teacher_user_id, 'Look at the time marker — "yesterday" needs Past Simple.', now() - INTERVAL '30 minutes');
  END IF;

  -- ── Notifications (student) ──
  IF NOT EXISTS (SELECT 1 FROM public."Notification" WHERE "userId" = v_student_user_id) THEN
    INSERT INTO public."Notification" ("userId", type, title, body, payload) VALUES
      (v_student_user_id, 'MEDAL_AWARDED',   'Тебе выставлена медаль! 🥇',  'Золото за прошлый месяц. Заработано 5 000 ₸', jsonb_build_object('medalId', v_medal_id)),
      (v_student_user_id, 'PAYOUT_RECEIVED', 'Выплата получена',          '5 000 ₸ переведены на Kaspi', jsonb_build_object('medalId', v_medal_id));
  END IF;

  RAISE NOTICE 'Seed complete: student=%, teacher=%, group=%, lessons=%',
    v_student_id, v_teacher_id, v_group_id, array_length(v_lesson_ids, 1);
END $$;
