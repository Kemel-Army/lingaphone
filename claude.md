# CLAUDE.md — FEMO Platform

## Project Identity

**FEMO** — цифровая образовательная платформа по математике (B2C), построенная на методологии **IAE (Intelligent Adaptive Education)**. Казахстан. Nuxt 4 + Nuxt UI v4 + Supabase (queries + auth + RLS + migrations) + PostgreSQL + TypeScript + pnpm.

Архитектура фронтенда: **Feature-Sliced Design (FSD)** — адаптированная под Nuxt 4.

Ключевой цикл IAE: **Student Model → Instructional Model → Мгновенная обратная связь → Дашборд преподавателя → Корректировка → Повтор**.

Пять фундаментальных контуров:

1. **LMS (IAE)** — диагностика, Student Model, Instructional Model, AI-репетитор (5 режимов), ДЗ (6 форматов + AI-проверка), адаптивные тесты, траектории, прогресс, онлайн-уроки (WebRTC: 1:1 + групповые), доска, запись.
2. **Геймификация** — XP, уровни, streak, достижения, бейджи. Мотивация, не принуждение (IAE).
3. **Финансы** — пакеты, подписки, семейный тариф, промокоды, пробный урок, retention-триггеры.
4. **AI-движок** — AI-репетитор по предметам, AI-проверка ДЗ (все форматы включая speech-to-text), AI-генерация тестов и адаптивных ДЗ, Early Warning, Instructional Model.
5. **Коммуникации** — мессенджер (Realtime), уведомления (in-app + email), onboarding-туры.

**ИИ не заменяет педагога — он делает его суперпедагогом.**

---

## FSD Architecture (Feature-Sliced Design)

### Принцип

FSD делит код на **слои** (layers) → **слайсы** (slices) → **сегменты** (segments). Каждый слой имеет строгий уровень абстракции. Импорт **только сверху вниз** — верхние слои импортируют из нижних, никогда наоборот.

### Слои (сверху вниз по зависимости)

```
app/          → Инициализация приложения: layouts, plugins, global middleware, app.vue, app.config.ts
pages/        → Маршруты: только композиция виджетов/фич, минимум логики
widgets/      → Крупные составные блоки UI: Sidebar, DashboardPanel, LessonRoom, AiChatPanel
features/     → Бизнес-действия пользователя: SubmitHomework, StartAiSession, CreateLesson, MakePayment
entities/     → Бизнес-сущности: Student, Tutor, Lesson, Homework, StudentModel — модели, composables, карточки
shared/       → Переиспользуемое без бизнес-логики: UI-kit, утилиты, типы, константы, api-клиент
```

### Правило импортов (КРИТИЧЕСКОЕ)

```
pages → widgets → features → entities → shared
           ↓          ↓          ↓          ↓
     ТОЛЬКО ВНИЗ. Никогда вверх. Никогда между слайсами одного слоя.
```

```typescript
// ✅ ПРАВИЛЬНО
// pages/student/homework/[id].vue импортирует из widgets и features
import HomeworkSubmitForm from "~/features/homework/ui/HomeworkSubmitForm.vue";
import HomeworkDetailWidget from "~/widgets/homework/HomeworkDetailWidget.vue";

// ✅ ПРАВИЛЬНО
// features/homework импортирует из entities
import { useHomework } from "~/entities/homework/composables/useHomework";

// ❌ ЗАПРЕЩЕНО — entity импортирует из feature
import { useSubmitHomework } from "~/features/homework/composables/useSubmitHomework";

// ❌ ЗАПРЕЩЕНО — горизонтальный импорт между слайсами одного слоя
// entities/student импортирует из entities/lesson напрямую
import { useLesson } from "~/entities/lesson/composables/useLesson";
// Вместо этого — через shared или пробросить через feature/widget
```

### Сегменты внутри слайса

Каждый слайс (например `entities/student/`) содержит стандартные сегменты:

```
entities/student/
├── ui/                    — Vue-компоненты (StudentCard.vue, StudentAvatar.vue)
├── composables/           — Composables (useStudents.ts, useStudentModel.ts)
├── model/                 — Типы, интерфейсы, enums (types.ts, constants.ts)
├── api/                   — Supabase-запросы, если нужна обёртка поверх composable
└── index.ts               — Public API слайса (re-export)
```

**Public API (index.ts)** — единственная точка входа в слайс:

```typescript
// entities/student/index.ts
export { default as StudentCard } from "./ui/StudentCard.vue";
export { useStudents } from "./composables/useStudents";
export { useStudentModel } from "./composables/useStudentModel";
export type { Student, StudentModel } from "./model/types";
```

Импортировать из слайса — **только через index.ts**:

```typescript
// ✅ ПРАВИЛЬНО
import { StudentCard, useStudents } from "~/entities/student";

// ❌ ЗАПРЕЩЕНО — прямой импорт минуя public API
import StudentCard from "~/entities/student/ui/StudentCard.vue";
```

---

## FSD File Structure (полная)

```
femo/
├── app/
│   ├── app.vue                         — Root (NuxtLayout + NuxtPage)
│   ├── app.config.ts                   — UI colors, theme
│   ├── assets/
│   │   └── css/main.css
│   │
│   ├── layouts/                        — [app layer]
│   │   ├── default.vue                 — Dashboard (UDashboardGroup + sidebar + navbar)
│   │   ├── auth.vue                    — Auth pages (centered, animated bg)
│   │   ├── landing.vue                 — Landing (header + footer)
│   │   ├── lesson.vue                  — Онлайн-урок (видео + доска + материалы)
│   │   └── ai-session.vue              — AI-репетитор (чат + markdown + KaTeX)
│   │
│   ├── middleware/                      — [app layer]
│   │   └── role-guard.global.ts
│   │
│   ├── plugins/                        — [app layer]
│   │   ├── auth-redirect.ts
│   │   └── apexcharts.client.ts
│   │
│   ├── pages/                          — [pages layer] ТОЛЬКО композиция
│   │   ├── index.vue                   — Landing
│   │   ├── about.vue, contact.vue, privacy.vue, login.vue, register.vue
│   │   ├── tutors/                     — Каталог + [id] (ISR, SEO)
│   │   ├── programs/, blog/            — Контент (SSG/ISR)
│   │   ├── diagnostics/               — index + [id] (адаптивный тест)
│   │   ├── trial/                      — Пробный урок
│   │   ├── student/                    — ЛК ученика (карта ниже)
│   │   ├── parent/                     — ЛК родителя (карта ниже)
│   │   ├── tutor/                      — ЛК преподавателя (карта ниже)
│   │   ├── admin/                      — Админ-панель (карта ниже)
│   │   ├── lesson/[id].vue             — Комната урока (WebRTC)
│   │   └── messenger/index.vue         — Мессенджер
│   │
│   ├── widgets/                        — [widgets layer]
│   │   ├── student-dashboard/          — StudentDashboard, StudentModelSummary, GameStatsPanel
│   │   ├── parent-dashboard/           — ParentDashboard, ChildProgressCard
│   │   ├── tutor-dashboard/            — TutorIaeDashboard, EarlyWarningPanel, StudentHeatmap
│   │   ├── admin-dashboard/            — AdminDashboard, PlatformMetrics
│   │   ├── lesson-room/                — LessonRoom, VideoPanel, Whiteboard, LessonMaterials, LessonChat
│   │   ├── ai-chat/                    — AiChatPanel, AiModeSelector, AiMessageBubble
│   │   ├── homework-detail/            — HomeworkDetailWidget, AiFeedbackPanel
│   │   ├── messenger/                  — MessengerWidget, ConversationList
│   │   ├── sidebar/                    — AppSidebar (навигация по ролям)
│   │   └── navbar/                     — AppNavbar (breadcrumbs, user menu, notifications)
│   │
│   ├── features/                       — [features layer]
│   │   ├── auth/                       — LoginForm, RegisterForm, useAuthActions
│   │   ├── submit-homework/            — HomeworkSubmitForm (6 форматов), useSubmitHomework
│   │   ├── ai-session/                 — StartAiSession, AiInputBar, useAiSession (SSE)
│   │   ├── diagnostics/                — DiagnosticsWizard, AdaptiveTestRunner, useDiagnostics
│   │   ├── create-lesson/              — CreateLessonForm, useCreateLesson
│   │   ├── schedule-management/        — ScheduleCalendar, SlotPicker, useScheduleManagement
│   │   ├── make-payment/               — PaymentForm, PackageSelector, PromoCodeInput
│   │   ├── tutor-verification/         — VerificationPanel, useVerification
│   │   ├── manage-curriculum/          — CurriculumEditor, PersonalPlanEditor, useCurriculum
│   │   ├── send-message/               — MessageInput, useSendMessage
│   │   ├── write-review/               — ReviewForm, useWriteReview
│   │   ├── onboarding/                 — OnboardingTour, useOnboarding
│   │   └── early-warning/              — EarlyWarningAlerts, useEarlyWarning
│   │
│   ├── entities/                       — [entities layer]
│   │   ├── user/                       — UserAvatar, UserBadge, useCurrentUser, UserRole enum
│   │   ├── student/                    — StudentCard, useStudents, useStudentModel
│   │   ├── tutor/                      — TutorCard, TutorProfileHeader, useTutors
│   │   ├── parent/                     — ParentChildLink, useParents
│   │   ├── lesson/                     — LessonCard, LessonStatusBadge, useLessons, useGroupLessons
│   │   ├── homework/                   — HomeworkCard, HomeworkStatusBadge, useHomework
│   │   ├── test/                       — TestCard, useTests
│   │   ├── ai-conversation/            — AiConversationCard, useAiConversations, AiMode enum
│   │   ├── schedule/                   — ScheduleSlot, useSchedule
│   │   ├── subject/                    — useSubjects
│   │   ├── progress/                   — ProgressChart, TopicHeatmap, useProgress
│   │   ├── game-profile/               — XpBar, StreakCounter, AchievementBadge, useGameProfile, useXP
│   │   ├── payment/                    — PaymentHistoryItem, usePayments, usePackages, useSubscriptions
│   │   ├── notification/               — NotificationItem, useNotifications
│   │   ├── conversation/               — MessageBubble, useMessenger (Realtime)
│   │   ├── review/                     — ReviewCard, useReviews
│   │   ├── trajectory/                 — useTrajectory
│   │   └── curriculum/                 — CurriculumTopicRow, useCurriculumPlans
│   │
│   └── shared/                         — [shared layer]
│       ├── ui/                         — DataTable, EmptyState, LoadingSpinner, ConfirmDialog, FileUpload
│       ├── composables/                — useSupabaseClient, useFileUpload, useToast
│       ├── lib/                        — datetime, formatters, validators, constants
│       ├── api/                        — supabase base config
│       ├── types/                      — database.types.ts (auto-generated)
│       └── index.ts
│
├── server/                             — Backend (НЕ FSD)
│   ├── api/
│   │   ├── ai/                         — chat, check-homework, check-oral, generate-test, generate-homework
│   │   ├── auth/                       — registration flows
│   │   ├── lessons/                    — create online lesson
│   │   ├── payments/                   — invoice generation
│   │   └── notifications/              — email triggers (Mailgun)
│   ├── middleware/
│   ├── utils/                          — ai-agent.ts
│   └── tasks/                          — early-warning (scheduled)
│
├── supabase/
│   └── migrations/                    — SQL миграции (Supabase CLI)
├── public/
└── CLAUDE.md
```

### Nuxt 4 + FSD: авто-импорты

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  components: {
    dirs: [
      // Shared UI — глобально доступен без импорта
      { path: "~/shared/ui", global: true },
    ],
  },
  imports: {
    dirs: ["shared/composables", "shared/lib"],
  },
  // entities, features, widgets — ЯВНЫЙ импорт через index.ts
});
```

**Правило:** `shared/` — авто-импорт. Всё остальное — явный импорт через public API.

---

## IAE Architecture (пронизывает всю платформу)

```
📥 Вход ученика (диагностика: класс → предмет → цель → адаптивный тест)
  ↓
🧠 Student Model — знания по темам, паттерны ошибок, скорость, стиль обучения
  ↓
🎯 Instructional Model — сложность, тип заданий, материалы, подсказки, темп
  ↓
📊 Мгновенная обратная связь — hints, feedback, AI-проверка ДЗ
  ↓
👨‍🏫 Дашборд преподавателя — тепловая карта, Early Warning, рекомендации
  ↓
🔁 Непрерывный цикл — обновление после каждого действия
```

| Точка                 | IAE-компонент            | Что делает                                          |
| --------------------- | ------------------------ | --------------------------------------------------- |
| Диагностика           | Student Model            | Адаптивный тест → начальный профиль по темам        |
| AI-репетитор          | Instructional Model      | Адаптирует сложность и подсказки в реальном времени |
| ДЗ (AI-адаптивные)    | Instructional Model      | Генерирует задания под пробелы                      |
| ДЗ (проверка)         | Student Model + Feedback | AI анализирует ответы → мгновенный разбор           |
| Тестирование          | Student Model            | Адаптивная сложность по ходу теста                  |
| Прогресс              | Student Model            | Динамика, "точка А" vs "точка Б"                    |
| Дашборд преподавателя | Early Warning            | Кто отстаёт, где пробелы, куда вмешаться            |
| Уведомления           | Early Warning            | Триггеры при снижении активности                    |
| Геймификация          | Мотивация (IAE)          | Через достижения, не принуждение                    |

---

## Tech Stack

### Core

- **Framework:** Nuxt 4 (^4.3+), Vue 3 (^3.5+), TypeScript (^5.5+)
- **UI:** Nuxt UI v4 (@nuxt/ui ^4.x) — Dashboard components (sidebar, navbar, panels)
- **Styling:** Tailwind CSS v4 (@tailwindcss/vite)
- **Migrations:** Supabase CLI (`supabase migration new`, `supabase db push`)
- **Database:** Supabase PostgreSQL — все запросы через Supabase client
- **Auth:** Supabase Auth (@nuxtjs/supabase) + JWT custom claims hook
- **Validation:** Zod
- **Realtime:** Supabase Realtime (WebSocket) — мессенджер, уведомления
- **i18n:** @nuxtjs/i18n (RU/KZ)
- **Charts:** Chart.js (vue-chartjs)
- **PDF:** jspdf + jspdf-autotable
- **Markdown:** markdown-it + katex (формулы в AI-репетиторе)

### IAE AI Engine

- **LLM API:** OpenAI (через /server/api/)
- **Speech-to-Text:** OpenAI Whisper
- **Streaming:** Server-Sent Events

### Online Lessons

- **Video:** WebRTC — 1:1 (P2P) + групповые (SFU / mesh)
- **Whiteboard, Screen sharing, Recording**

### File Storage

- **Supabase Storage**

### Email

- **Mailgun** (mailgun.js)

### Additional Modules

- @nuxt/image, @nuxt/fonts (Inter), @nuxtjs/seo, @nuxt/content
- @vueuse/nuxt + @vueuse/core
- @iconify-json/lucide
- GSAP, vue3-lottie, @vueuse/motion, @formkit/auto-animate

---

## User Roles & Types (4)

```typescript
enum UserRole {
  STUDENT = "STUDENT",
  PARENT = "PARENT",
  TUTOR = "TUTOR",
  ADMIN = "ADMIN",
}
```

**JWT custom claims:**

```typescript
const user = useSupabaseUser();
const role = user.value?.user_role; // 'STUDENT' | 'PARENT' | 'TUTOR' | 'ADMIN'
const name = user.value?.user_name;
const surname = user.value?.user_surname;
const userId = user.value?.sub; // UUID
```

---

## Карта интерфейса по ролям

### Ученик (Student) — `/student/`

```
/student/
├── index.vue              — Dashboard (IAE Student Model + геймификация + предстоящие уроки)
├── ai-tutor/
│   ├── index.vue          — Выбор предмета/темы, история AI-сессий
│   └── [sessionId].vue    — AI-репетитор: 5 режимов
├── lessons/
│   ├── index.vue          — История уроков (1:1 + групповые)
│   └── [id].vue           — Детали урока: запись, материалы, заметки
├── homework/
│   ├── index.vue          — Список ДЗ (активные, выполненные, просроченные)
│   └── [id].vue           — Выполнение ДЗ (6 форматов) → AI-проверка → feedback
├── tests/
│   ├── index.vue          — Список тестов
│   └── [id].vue           — Прохождение теста (адаптивная сложность)
├── progress.vue           — Визуализация Student Model, тепловая карта
├── achievements.vue       — XP, уровень, streak, бейджи
├── schedule.vue           — Расписание, календарь
├── diagnostics/
│   ├── index.vue          — Запуск диагностики
│   └── [id].vue           — Адаптивный тест → Student Model
└── messenger/             — Мессенджер (↔ преподаватель)
```

**FSD-композиция страницы (пример `student/homework/[id].vue`):**

```vue
<script setup>
import { HomeworkDetailWidget } from "~/widgets/homework-detail";
import { HomeworkSubmitForm } from "~/features/submit-homework";
import { useHomework } from "~/entities/homework";

const route = useRoute();
const { fetchHomework } = useHomework();
const { data: homework } = await useAsyncData(`hw-${route.params.id}`, () =>
  fetchHomework(route.params.id),
);
</script>

<template>
  <HomeworkDetailWidget :homework="homework" />
  <HomeworkSubmitForm :homework-id="homework.id" />
</template>
```

**ДЗ — 6 форматов, все проверяются AI:**

- _Тестовые задания_ → AI проверяет мгновенно
- _Ввод ответа_ → AI проверяет
- _Развёрнутый ответ_ → AI анализирует логику
- _Устный ответ на камеру_ → speech-to-text → AI анализирует
- _Загрузка файла_ → AI анализирует содержимое
- _Интерактивные_ → drag-and-drop, пропуски

---

### Родитель (Parent) — `/parent/`

```
/parent/
├── index.vue              — Dashboard (сводка по всем детям)
├── children/
│   ├── index.vue          — Список детей (M:N)
│   └── [id].vue           — Прогресс ребёнка: Student Model, тренд, Early Warning
├── schedule.vue           — Расписание всех детей, кнопка «Подключиться»
├── homework.vue           — ДЗ всех детей: статусы, AI-анализ
├── payments.vue           — Пакеты, подписки, семейный тариф
├── reports.vue            — Отчёты по периодам
├── notifications.vue      — Early Warning, результаты
├── messenger/             — Мессенджер (↔ преподаватель)
└── settings.vue
```

---

### Преподаватель (Tutor) — `/tutor/`

```
/tutor/
├── index.vue              — IAE Дашборд: тепловая карта, Early Warning, рекомендации
├── students/
│   ├── index.vue          — Список учеников
│   └── [id].vue           — Student Model, прогресс, паттерны ошибок
├── lessons/
│   ├── index.vue          — Уроки
│   └── [id].vue           — Запись, материалы, отчёт
├── homework/
│   ├── index.vue          — AI-анализ ДЗ, назначение новых
│   └── [id].vue           — Per-question breakdown
├── curriculum/
│   ├── index.vue          — КТП: список предметов
│   ├── [subjectId].vue    — План предмета
│   └── [subjectId]/
│       └── [studentId].vue — Персональный план ученика
├── groups/
│   ├── index.vue          — Группы
│   └── [id].vue           — Участники, прогресс
├── schedule.vue           — Календарь, слоты
├── analytics.vue          — Эффективность, прогресс учеников
├── earnings.vue           — Доходы
├── profile.vue            — Публичный SEO-профиль
├── messenger/             — Мессенджер
└── settings.vue
```

---

### Администратор (Admin) — `/admin/`

```
/admin/
├── index.vue              — Dashboard: метрики, конверсия, финансы
├── users.vue              — Все пользователи
├── tutors/
│   ├── index.vue          — Верификация, рейтинги
│   └── [id].vue           — PENDING/APPROVED/REJECTED
├── students/
│   ├── index.vue          — Все ученики
│   └── [id].vue           — Student Model, история
├── finance/
│   ├── index.vue          — Финансовая сводка
│   ├── packages.vue       — Пакеты
│   ├── subscriptions.vue  — Подписки
│   ├── promo.vue          — Промокоды
│   └── payouts.vue        — Выплаты
├── quality/
│   ├── index.vue          — Отзывы, жалобы
│   └── reviews.vue        — Модерация
├── analytics/
│   ├── index.vue          — IAE-аналитика
│   ├── retention.vue      — Воронка, LTV, churn
│   └── ai-usage.vue       — AI-сессии, токены
├── notifications/
│   └── index.vue          — Массовые уведомления
├── settings.vue
└── support/
    └── index.vue          — Обращения
```

---

### Публичные + специальные страницы

```
/                          — Landing (SSG)
/about, /contact, /privacy — Статические (SSG)
/blog/**                   — Блог (SSG)
/tutors/, /tutors/[id]     — Каталог преподавателей (ISR, SEO)
/programs/**               — Программы (ISR)
/login, /register          — Auth (CSR)
/diagnostics/**            — Диагностика (CSR)
/trial/                    — Пробный урок (CSR)
/lesson/[id]               — Комната урока (layout: lesson)
/messenger/                — Мессенджер (layout: default)
```

---

## Data Access Layer

### КРИТИЧЕСКОЕ ПРАВИЛО: Supabase = миграции + запросы

```typescript
// ✅ ПРАВИЛЬНО — Supabase client в entities composable
// entities/student/composables/useStudents.ts
export const useStudents = () => {
  const supabase = useSupabaseClient<Database>();
  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("Student")
      .select("*, User(name, surname, email)")
      .order("createdAt", { ascending: false });
    if (error) throw error;
    return data;
  };
  return { fetchStudents };
};

// ❌ ЗАПРЕЩЕНО — ORM в runtime
// const students = await prisma.student.findMany()
```

### FSD: где живут запросы

```
entities/*/composables/     — Простые CRUD
features/*/composables/     — Мультишаговые действия (upload → submit → AI check → XP)
```

### Server Routes — только для сложной логики

1. AI-обработки (чат, анализ ДЗ, тесты)
2. Третьесторонние API (OpenAI, Mailgun)
3. Service role key
4. Генерация файлов (PDF)
5. Сложная бизнес-логика

---

## Authentication & Route Protection

**НЕ ДОБАВЛЯТЬ `middleware: 'auth'` к страницам.**

```typescript
// ✅ Защищённая — middleware НЕ нужен
definePageMeta({ layout: "default" });

// ❌ НЕПРАВИЛЬНО
definePageMeta({ middleware: "auth" });
```

### JWT Custom Claims Hook

```sql
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
    v_role text; v_name text; v_surname text;
begin
    select u.role, u.name, u.surname
    into v_role, v_name, v_surname
    from public."User" u
    where u.email = (event->'claims'->>'email');

    return jsonb_build_object('claims',
        (event->'claims') || jsonb_build_object(
            'user_role', v_role,
            'user_name', v_name,
            'user_surname', v_surname
        )
    );
end $$;
```

**RLS:** `auth.uid()::text`

---

## Key Models & Relations

```
User (email, name, surname, role, phone, avatarUrl)
  ├─ Student → tutor, lessons, homework, tests, progress, studentModel, gameProfile, aiConversations
  ├─ Tutor → students, lessons, schedule, subjects, earnings, verification
  └─ Parent → students (M:N через ParentToStudent)
```

**LMS (IAE):**

```
Subject, DiagnosticTest, DiagnosticResult,
StudentModel (knowledgeMap jsonb, errorPatterns jsonb, learningStyle, difficultyLevel, speed),
EducationProfile, LearningTrajectory,
Lesson, GroupLesson, GroupLessonParticipant, Schedule,
Homework, HomeworkSubmission (format: TEST/INPUT/TEXT/ORAL/FILE/INTERACTIVE, aiAnalysis jsonb),
Test, Progress
```

**AI Engine:**

```
AIConversation (mode: EXPLAIN/PRACTICE/CHECK_HW/MOCK_TEST/FREE),
AIMessage, AIGeneratedTest, AIGeneratedHomework
```

**Геймификация:**

```
StudentGameProfile, Achievement, StudentAchievement, XPTransaction
```

**Коммуникации:**

```
Conversation, Message, Notification
```

**Финансы:**

```
Payment, Package, Subscription, PromoCode, FamilyPlan
```

---

## IAE AI-репетитор (5 режимов)

**1. Объяснение темы** — Instructional Model подбирает глубину. KaTeX. Адаптивное.

**2. Практика** — Сократический метод. Адаптивная сложность. Паттерны ошибок.

**3. Проверка ДЗ** — 6 форматов. Speech-to-text для камеры. Мгновенный feedback.

**4. Mock-тест** — CAT. Таймер. Тепловая карта результатов.

**5. Свободный вопрос** — Контекстный ответ под уровень Student Model.

### Server API

```
/api/ai/
  chat.post.ts              — AI-репетитор (SSE)
  check-homework.post.ts    — AI-анализ ДЗ
  check-oral.post.ts        — Whisper → AI-анализ
  generate-test.post.ts     — Адаптивный тест
  generate-homework.post.ts — Адаптивная домашка
```

### Early Warning (правила, не LLM)

```
if (lastActivity > 3 days) → email родителю и ученику
if (streak about to expire) → email ученику
if (topicMastery dropping) → уведомление преподавателю
if (homeworkCompletionRate < 50%) → уведомление преподавателю
if (testScore < prev * 0.8) → Early Warning в дашборде
```

---

## Геймификация

| Действие                 | XP        |
| ------------------------ | --------- |
| Правильный ответ AI      | 10-30     |
| Выполнение ДЗ вовремя    | 50        |
| Посещение урока          | 40        |
| Завершение темы          | 100       |
| Тест                     | 50-200    |
| AI-сессия ≥ 15 мин       | 30        |
| Идеальный тест (100%)    | 150 бонус |
| Закрытие пробела (0→80%) | 200       |

Уровни (1-100), Streak (7/30/100 дней), Достижения/бейджи.

---

## Common Patterns

### Entity Composable

```typescript
import { useStudents } from "~/entities/student";
const { fetchStudents } = useStudents();
const { data } = await useAsyncData("students", fetchStudents);
```

### Feature Composable (мультишаговая логика)

```typescript
// features/submit-homework/composables/useSubmitHomework.ts
import { useHomework } from "~/entities/homework";
import { useStudentModel } from "~/entities/student";
import { useXP } from "~/entities/game-profile";

export const useSubmitHomework = () => {
  const { updateSubmission } = useHomework();
  const { updateModel } = useStudentModel();
  const { awardXP } = useXP();

  const submit = async (
    homeworkId: string,
    format: string,
    answers: object,
  ) => {
    // 1. Upload → 2. Submit → 3. AI check → 4. Update Model → 5. XP
  };
  return { submit };
};
```

### Realtime

```typescript
// entities/conversation/composables/useMessenger.ts
const supabase = useSupabaseClient();
supabase
  .channel("messages")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "Message" },
    handler,
  )
  .subscribe();
```

### Server Route

```typescript
// server/api/ai/chat.post.ts
export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event);
  const user = await serverSupabaseUser(event);
  // Load Student Model → OpenAI → save → update Student Model
});
```

---

## Anti-Bullshit Rules

### НЕ ДЕЛАЙ:

```typescript
// ❌ ORM в runtime
// const data = await prisma.student.findMany()

// ❌ Server route для простого SELECT
export default defineEventHandler(async () => { ... })

// ❌ Auth middleware
definePageMeta({ middleware: 'auth' })

// ❌ user.value.id вместо user.value.sub
const userId = user.value?.id

// ❌ user_metadata для custom claims
const role = user.value?.user_metadata?.user_role

// ❌ Inline Supabase в page/widget
const { data } = await supabase.from('Student').select('*')

// ❌ Прямой импорт минуя public API
import StudentCard from '~/entities/student/ui/StudentCard.vue'

// ❌ Импорт снизу вверх (entity → feature)
import { useSubmitHomework } from '~/features/submit-homework'

// ❌ Горизонтальный импорт между entities
import { useLesson } from '~/entities/lesson'  // из entities/student
```

### ДЕЛАЙ:

```typescript
// ✅ Entity через public API
import { useStudents } from '~/entities/student'

// ✅ Feature использует entities
import { useHomework } from '~/entities/homework'

// ✅ JWT claims
const role = user.value?.user_role
const userId = user.value?.sub

// ✅ AI через server route
const result = await $fetch('/api/ai/check-homework', { method: 'POST', body: { ... } })
```

---

## Decision Tree

```
Данные (CRUD)?
  → entities/*/composables/

Мультишаговое действие?
  → features/*/composables/

Составной UI-блок?
  → widgets/*/

Страница?
  → pages/* — композиция widgets + features

Переиспользуемый UI без бизнес-логики?
  → shared/ui/

AI / email / PDF / service role?
  → server/api/

Auth-проверка?
  → НЕ ДЕЛАЙ НИЧЕГО — RLS

Realtime?
  → entities/*/composables/ с Supabase Realtime
```

---

## Design System

- **Primary:** `#16A34A` (green)
- **Neutral:** `slate`
- **Font:** Inter
- **Grid:** 8pt
- **Dark mode:** full support
- **Icons:** Lucide
- **Dashboard:** Nuxt UI v4
- **Референсы:** Duolingo, Khan Academy, Preply

---

## Environment Variables

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_KEY="eyJ..."
SUPABASE_SERVICE_KEY="eyJ..."
OPENAI_API_KEY="sk-..."
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
PAYMENT_API_KEY=
```

---

## Development Commands

```bash
pnpm dev                  # Nuxt dev
pnpm build                # Production build
pnpm db:migrate:new       # Новая миграция (Supabase CLI)
pnpm db:push              # Применить миграции
pnpm db:reset             # Сбросить и пересоздать БД
pnpm db:diff              # Diff схемы
pnpm supabase:types       # Типы → shared/types/database.types.ts
pnpm db:migrate           # Push + types
pnpm lint                 # ESLint
pnpm test                 # Vitest
```

---

## When Making Changes

1. **Schema:** `supabase/migrations/` → `pnpm db:migrate`
2. **RLS:** Supabase Dashboard
3. **Новая сущность:** `entities/[name]/` (composables, ui, model, index.ts)
4. **Новое действие:** `features/[action]/` (composables, ui, model, index.ts)
5. **Новый составной блок:** `widgets/[name]/` (ui, index.ts)
6. **Новая страница:** `pages/` — только композиция widgets/features
7. **Server route:** `server/api/` — только AI/email/PDF/service role
8. **Утилитарный UI:** `shared/ui/`

---

## Critical Debugging Tips

### RLS Not Working

```sql
SELECT * FROM pg_policies WHERE tablename = 'StudentModel';
```

### Case-sensitive Tables

PascalCase → `"TableName"` в SQL.

### Type Errors

```bash
pnpm supabase:types
```

### FSD Import Violation

Импорт снизу вверх или горизонтальный → рефакторить через props, events или shared.

---

## Development Phases

| Phase | Scope                                                              | Duration  |
| ----- | ------------------------------------------------------------------ | --------- |
| 0     | Setup: Nuxt 4, UI v4, FSD structure, Supabase CLI, RLS, JWT, CI/CD | 5 days    |
| 1     | Auth + 4 роли + layouts (5) + landing + SEO + shared layer         | 1.5 weeks |
| 2     | IAE-диагностика → Student Model                                    | 2 weeks   |
| 3     | Каталог преподавателей + расписание + верификация                  | 1.5 weeks |
| 4     | Онлайн-занятия: WebRTC                                             | 3 weeks   |
| 5     | IAE AI-репетитор: 5 режимов                                        | 3 weeks   |
| 6     | ДЗ: 6 форматов + AI-проверка + Whisper                             | 2 weeks   |
| 7     | AI: адаптивные ДЗ + тесты + Early Warning                          | 1.5 weeks |
| 8     | Геймификация                                                       | 1.5 weeks |
| 9     | ЛК ученика: интеграция                                             | 2 weeks   |
| 10    | ЛК родителя + мессенджер                                           | 1.5 weeks |
| 11    | ЛК преподавателя: IAE-дашборд                                      | 2 weeks   |
| 12    | Мессенджер (Realtime) + уведомления                                | 1 week    |
| 13    | Финансы                                                            | 1.5 weeks |
| 14    | Админ-панель                                                       | 1.5 weeks |
| 15    | Onboarding + polish                                                | 1.5 weeks |

**Total: ~27-29 weeks (solo) / ~15-17 weeks (3 devs) / ~12-13 weeks (4-5 devs).**

---

## Поздние фазы

| Фича                    | Когда                  |
| ----------------------- | ---------------------- |
| Лиги, аватар, магазин   | 500+ учеников          |
| Карта знаний RPG        | 500+ учеников          |
| AI-конспект после урока | Расшифровка аудио      |
| AI smart matching       | 1000+ учеников         |
| Telegram-бот            | 500+ пользователей     |
| B2B2C школы             | 1000+ учеников         |
| Эмоциональный AI        | R&D (IAE roadmap 2027) |

---

## Language Notes

- Русский/Казахский для UI-текста
- English для кода, переменных, комментариев
- i18n: RU/KZ (@nuxtjs/i18n)
