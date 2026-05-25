# Lingafon — Supabase setup

SQL-миграции для lingafon-проекта в Supabase. Запускаются **руками через SQL Editor** в Dashboard (CLI не используем, чтобы не путать с femo).

Проект: `owiaccgxbejsgtyhhtrd.supabase.co`
SQL Editor: <https://supabase.com/dashboard/project/owiaccgxbejsgtyhhtrd/sql>

## Порядок запуска

| # | Файл | Когда | Что делает |
| --- | --- | --- | --- |
| 0 | [000_auth_minimum.sql](000_auth_minimum.sql) | Однократно при создании проекта | Базовая User-таблица, enum UserRole, JWT hook v1 |
| 1 | [001_core_schema.sql](001_core_schema.sql) | После 0 | Все таблицы студент-роли: Student/Teacher/Parent + Branch/Group/GroupMember/Lesson/Attendance/Grade + MonthlyMedal/Payout + Homework/HomeworkSubmission + Material/VocabularyEntry + PracticeAttempt + Conversation/Message/Notification + XpLog. Индексы, RLS, Realtime |
| 2 | [002_seed_demo.sql](002_seed_demo.sql) | После 1 (опционально) | Засевает демо-сценарий: 1 группа A2, ученик в ней, 10 уроков, 5 оценок, 1 медаль, 1 ДЗ, 1 чат, 2 уведомления. **Перед запуском нужно сначала вызвать `/api/auth/seed-lingafon-users`** чтобы создались `student@linga.kz` и `teacher@linga.kz` |
| 3 | [003_jwt_hook_v2.sql](003_jwt_hook_v2.sql) | После 1 | Добавляет в JWT claim `user_id` (Public.User.id PK), чтобы server-side не делал лишний SELECT. Все ранее залогиненные пользователи должны выйти и зайти заново |

## Шаги для свежей установки

1. Открой [SQL Editor lingafon](https://supabase.com/dashboard/project/owiaccgxbejsgtyhhtrd/sql) и запусти по очереди:
   - `000_auth_minimum.sql`
   - `001_core_schema.sql`
   - `003_jwt_hook_v2.sql`
2. **Authentication → Hooks → Customize Access Token (JWT) Claims** → Enable → schema `public`, function `custom_access_token_hook`. (Если уже включено с v1 — оставляешь как есть, новая v2 функция перезапишет старую с тем же именем)
3. Запусти dev-сервер: `pnpm dev:lingaphone`
4. Засей тестовых юзеров: `Invoke-RestMethod -Method Post http://localhost:3000/api/auth/seed-lingafon-users`
5. Засей демо-данные: вернись в SQL Editor → запусти `002_seed_demo.sql`
6. Войди как `student@linga.kz / password123` — должен увидеть **реальные** уроки, оценки, медаль, чат с педагогом

## Что делать, если повторно

Все миграции **идемпотентны** — можно перезапускать. Скрипты используют `CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS` / `CREATE POLICY`, `ON CONFLICT DO NOTHING/UPDATE`.

Чтобы откатить демо-данные:

```sql
DELETE FROM public."Notification";
DELETE FROM public."Message";
DELETE FROM public."Conversation";
DELETE FROM public."VocabularyEntry";
DELETE FROM public."Material";
DELETE FROM public."HomeworkSubmission";
DELETE FROM public."Homework";
DELETE FROM public."Payout";
DELETE FROM public."MonthlyMedal";
DELETE FROM public."Grade";
DELETE FROM public."Attendance";
DELETE FROM public."Lesson";
DELETE FROM public."GroupMember";
DELETE FROM public."Group";
DELETE FROM public."Branch";
DELETE FROM public."PracticeAttempt";
DELETE FROM public."XpLog";
DELETE FROM public."Student";
DELETE FROM public."Teacher";
```

## Связанные документы

- [/lingafon_data_model.md](../../lingafon_data_model.md) — полная модель данных
- [/lingafon_student_todo.md](../../lingafon_student_todo.md) — что ещё нужно сделать чтобы студент стал «настоящим»
- [/lingafon_pages_map.md](../../lingafon_pages_map.md) — карта UI
