-- Remove rejected capsule/"Мой путь" system. Replaced by interactive-book (BookPage/PageExercise/PageAttempt).
-- CASCADE drops dependent policies, triggers, indexes. Shared funcs (award_xp_atomic, get_current_user_id) untouched.
drop table if exists public."LayerProgress" cascade;
drop table if exists public."CapsuleLayer" cascade;
drop table if exists public."PathProgress" cascade;
drop table if exists public."PathLesson" cascade;
drop table if exists public."PathTopic" cascade;
