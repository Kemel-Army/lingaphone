# ТЗ — Lingaphone Platform (полная спецификация)

> Версия: 1.0 · Дата: 2026-06-02 · Автор: IskaGay

---

## Содержание

1. [Текущее состояние (студент)](#1-текущее-состояние-студент)
2. [Роли и аккаунты](#2-роли-и-аккаунты)
3. [Роль: Admin](#3-роль-admin)
4. [Роль: Teacher](#4-роль-teacher)
5. [Модуль: Library (оцифровка книг)](#5-модуль-library-оцифровка-книг)
6. [Модуль: Songs Practice](#6-модуль-songs-practice)
7. [Модуль: Grammar Platform](#7-модуль-grammar-platform)
8. [Интеграция: АльфаСРМ](#8-интеграция-альфасрм)
9. [Схема БД (дополнения)](#9-схема-бд-дополнения)
10. [Чеклист задач](#10-чеклист-задач)

---

## 1. Текущее состояние (студент)

### Что уже реализовано ✅

**Страницы `/student/`:**
- `index.vue` — Dashboard: приветствие, медаль-прогноз, XP/уровень, квесты дня, следующий урок, ДЗ
- `game/index.vue` — Карта уровней (locked/unlocked/passed)
- `game/[levelId].vue` — Игра: QUIZ_CHOICE, TYPE_ANSWER, SPEAK_PROMPT, LISTEN_TYPE + речь
- `practice/index.vue` — AI-тренажёр произношения (WORD/PHRASE/MIN_PAIR)
- `progress.vue` — Аналитика: timeline, тепловая карта тем, произношение, словарь
- `homework/index.vue` + `[id].vue` — ДЗ (6 форматов: TEST/INPUT/TEXT/ORAL/FILE/INTERACTIVE)
- `groups/index.vue` + `[id].vue` — Мои группы (учитель, расписание, участники)
- `schedule.vue` — Расписание уроков
- `grades.vue` — Журнал оценок
- `materials.vue` — Учебные материалы (Audio/Video/PDF/Links)
- `achievements.vue` — Медали, XP-история, лидерборд
- `certificates.vue` — Сертификаты (структура готова)
- `events.vue` — События школы (структура готова)
- `settings.vue` — Профиль и настройки
- `stories/[id].vue` — Чтение историй
- `messenger.vue` — Чат с учителями/одноклассниками

**Entities:**
- `entities/student/` — `useStudent()` с полным профилем, группами, оценками, ДЗ
- `entities/game-profile/` — `useGameProfile()`, `useGameLevels()`, XP/стрики/достижения/магазин
- `entities/progress/` — `useStudentProgress()` с полной аналитикой

**Features:**
- `features/practice/` — `usePractice()` запись попыток, XP за практику
- `features/submit-homework/` — `useSubmitHomework()` сдача ДЗ
- `features/ai-session/` — AI-разговор (структура)

**Геймификация:**
- XP → уровень (100 XP/уровень)
- Streak (daily/longest/gold monthly)
- Медали: GOLD ≥4.6 → 5000₸, SILVER ≥4.0 → 3000₸, BRONZE ≥3.6 → 1000₸
- Достижения через сервер `/api/gamification/*`
- Магазин предметов (аватар-рамки, титулы)

### Что ОТСУТСТВУЕТ у студента ❌

- Страницы Library (books), Songs, Grammar — не созданы
- Интеграция с АльфаСРМ — не создана
- Панель оценок книг / историй (student_submissions) — не создана

---

## 2. Роли и аккаунты

### Тестовые аккаунты (создать в Supabase)

| Роль    | Email               | Password    | Примечания                      |
|---------|---------------------|-------------|---------------------------------|
| Admin   | admin@linga.kz      | password123 | Полный доступ к панели          |
| Teacher | teacher@linga.kz    | password123 | Управление учениками и контентом|

### Как создать аккаунты

**Шаг 1 — Создать пользователей в Supabase Auth:**
```sql
-- Выполнить в Supabase SQL Editor или через Dashboard > Authentication > Users
-- Или через CLI:
-- supabase auth admin create-user --email admin@linga.kz --password password123
-- supabase auth admin create-user --email teacher@linga.kz --password password123
```

**Шаг 2 — Назначить роли через `profiles` таблицу:**
```sql
-- После создания аккаунтов в Supabase Auth:
INSERT INTO profiles (id, username, role, email)
VALUES 
  ((SELECT id FROM auth.users WHERE email = 'admin@linga.kz'), 'admin_linga', 'admin', 'admin@linga.kz'),
  ((SELECT id FROM auth.users WHERE email = 'teacher@linga.kz'), 'teacher_linga', 'teacher', 'teacher@linga.kz');
```

**Шаг 3 — Middleware для роутинга по ролям:**
```
/admin/*   → только role = 'admin'
/teacher/* → role = 'teacher' или 'admin'
/student/* → role = 'student'
```

> Файл: `app/middleware/role-guard.global.ts` — проверяет `user.role` из profiles и редиректит.

---

## 3. Роль: Admin

### Что нужно сделать (Admin)

```
/admin/
├── index.vue              — Главный дашборд: KPI метрики
├── students/
│   ├── index.vue          — Список всех учеников
│   └── [id].vue           — Профиль ученика: прогресс, история оплат
├── teachers/
│   ├── index.vue          — Список учителей
│   └── [id].vue           — Профиль учителя: группы, посещаемость
├── groups/
│   ├── index.vue          — Все группы
│   └── [id].vue           — Управление группой: участники, расписание
├── content/
│   ├── books.vue          — Управление библиотекой (CRUD книг)
│   ├── songs.vue          — Управление песнями (CRUD)
│   └── grammar.vue        — Управление грамматикой (CRUD)
├── finance/
│   ├── index.vue          — Финансовая сводка
│   ├── medals.vue         — Медали и выплаты по месяцам
│   └── payments.vue       — История платежей (АльфаСРМ)
├── crm/
│   └── index.vue          — Данные из АльфаСРМ (лиды, сделки)
├── analytics/
│   ├── index.vue          — Общая аналитика платформы
│   └── gamification.vue  — XP, стрики, активность
├── submissions/
│   └── index.vue          — Проверка устных ответов учеников
└── settings.vue           — Настройки платформы
```

### Admin Dashboard (index.vue) — блоки

| Блок | Данные | Источник |
|------|--------|----------|
| Активные ученики | count студентов с активностью за 7д | profiles |
| Выданные медали (месяц) | GOLD/SILVER/BRONZE count | medals таблица |
| Выплаты к зачислению | сумма ₸ за текущий месяц | medals + payouts |
| Новые регистрации | за 30 дней | auth.users |
| Топ-5 учеников | по XP | profiles |
| Активность по дням | chart 30 дней | xp_ledger |

### FSD слои для Admin

```
entities/admin-stats/       — useAdminStats() → KPI запросы
features/manage-content/    — CRUD книг/песен/грамматики
features/manage-users/      — useManageUsers() блокировка/роли
features/review-submission/ — useReviewSubmission() оценить устный ответ
widgets/admin-dashboard/    — AdminDashboardWidget
widgets/admin-submissions/  — SubmissionsReviewWidget
pages/admin/                — только композиция виджетов
```

---

## 4. Роль: Teacher

### Что нужно сделать (Teacher)

```
/teacher/
├── index.vue              — Дашборд: мои группы, ближайшие уроки, ДЗ на проверку
├── students/
│   ├── index.vue          — Мои ученики (из моих групп)
│   └── [id].vue           — Профиль ученика: прогресс, оценки, ДЗ
├── groups/
│   ├── index.vue          — Мои группы
│   └── [id].vue           — Группа: участники, расписание, материалы
├── lessons/
│   ├── index.vue          — Журнал уроков
│   └── [id].vue           — Детали урока: тема, оценки, посещаемость
├── homework/
│   ├── index.vue          — ДЗ: выданные, на проверке, проверенные
│   ├── create.vue         — Создать новое ДЗ (6 форматов)
│   └── [id].vue           — Просмотр сданных работ учеников
├── grades/
│   └── index.vue          — Выставление оценок журнал
├── submissions/
│   └── index.vue          — Устные ответы на проверку (audio player + оценка)
├── materials/
│   ├── index.vue          — Мои материалы
│   └── upload.vue         — Загрузка материала
├── schedule.vue           — Мое расписание
├── messenger.vue          — Чат с учениками/родителями
└── settings.vue           — Профиль учителя
```

### Teacher Dashboard — блоки

| Блок | Данные |
|------|--------|
| Мои группы сегодня | расписание на сегодня |
| ДЗ на проверке | submissions со статусом SUBMITTED |
| Устные ответы | student_submissions.status = 'pending' |
| Средний балл по группам | grades агрегат за 30д |
| Квест дня учителя | провести урок, проверить 3 ДЗ |

### ДЗ — создание (6 форматов)

Форма `homework/create.vue`:
- Выбрать группу / отдельных учеников
- Выбрать формат: TEST / INPUT / TEXT / ORAL / FILE / INTERACTIVE
- Дедлайн
- Прикрепить материалы
- TEST: конструктор вопросов + варианты
- INTERACTIVE: drag-and-drop конструктор

### Проверка устных ответов (submissions/index.vue)

```vue
<!-- Аудиоплеер для каждого ответа -->
<UAudio :src="submission.audioUrl" />
<!-- Оценка: 1-10 ползунок или звёзды -->
<URange v-model="score" :min="1" :max="10" />
<!-- Комментарий учителя -->
<UTextarea v-model="feedback" />
<!-- Кнопка Принять -->
<UButton @click="reviewSubmission(submission.id, score, feedback)">Оценить</UButton>
```

### FSD слои для Teacher

```
entities/teacher/           — useTeacher() → мои группы, ученики, расписание
features/create-homework/   — useCreateHomework()
features/grade-student/     — useGradeStudent()
features/review-submission/ — (shared с admin) useReviewSubmission()
widgets/teacher-dashboard/  — TeacherDashboardWidget
widgets/grade-journal/      — GradeJournalWidget
pages/teacher/              — только композиция
```

---

## 5. Модуль: Library (оцифровка книг)

### Концепция

Студенты читают учебники интерактивно:
- Клик по слову → перевод всплывает
- Аудио-синхронизация (слово подсвечивается в такт озвучке)
- Устный ответ на вопросы по тексту → запись → проверка учителем
- XP за прочтение главы

### Схема БД

```sql
CREATE TABLE books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    level TEXT NOT NULL, -- 'A1', 'A2', 'B1', 'B2', 'C1'
    cover_url TEXT,
    description TEXT,
    content JSONB NOT NULL,
    -- content структура:
    -- { chapters: [{ id, title, sentences: [{ id, text, startTime, endTime, words: [...] }] }] }
    audio_url TEXT,         -- Основной аудиофайл (опционально)
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE book_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    chapter_id TEXT NOT NULL,
    completed_at TIMESTAMPTZ,
    reading_time_seconds INTEGER DEFAULT 0,
    UNIQUE(user_id, book_id, chapter_id)
);

CREATE TABLE book_discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    chapter_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    audio_storage_path TEXT,   -- Supabase Storage путь
    text_content TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'reviewed'
    teacher_score INTEGER,
    teacher_feedback TEXT,
    xp_awarded INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Страницы Library

```
/student/library/
├── index.vue          — Список книг (по уровню, жанру)
└── [id].vue           — Читалка книги

/admin/content/books.vue  — CRUD управление книгами
```

### BookReader компонент

```
widgets/book-reader/
├── BookReader.vue           — Основной компонент
├── ChapterNav.vue           — Навигация по главам
├── WordTranslatePopover.vue — Всплывающий перевод
└── DiscussionRecorder.vue   — Запись устного ответа
```

**Ключевая логика BookReader.vue:**

```typescript
// Клик по слову → перевод
const translateWord = async (word: string) => {
  const translation = await $fetch('/api/translate', { 
    method: 'POST', 
    body: { word, targetLang: 'ru' } 
  })
  activeWord.value = { word, translation }
}

// Аудио-синхронизация
const onAudioTimeUpdate = (currentTime: number) => {
  const activeSentence = sentences.find(s => 
    currentTime >= s.startTime && currentTime <= s.endTime
  )
  highlightedSentenceId.value = activeSentence?.id ?? null
}

// Сохранить слово в словарь
const saveToVocabulary = async (word: string, translation: string) => {
  await addToVocabulary(word, '', translation, '')
  // 10 XP через usePractice
}
```

### XP за Library

| Действие | XP |
|----------|----|
| Прочитать главу (завершить) | 30 |
| Ответить на вопрос (текст) | 20 |
| Записать устный ответ | 40 |
| Получить оценку учителя ≥7 | +20 |

---

## 6. Модуль: Songs Practice

### Концепция

Студенты изучают язык через песни:
- YouTube плеер встроенный
- Fill-in-the-gaps: пропущенные слова вместо инпутов
- Плеер автопаузируется на пропуске, ждёт ввода
- XP за каждый правильный ввод

### Схема БД

```sql
CREATE TABLE songs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    cover_url TEXT,
    video_id TEXT NOT NULL, -- YouTube Video ID (без https://youtu.be/)
    level TEXT NOT NULL,    -- 'A1'..'C1'
    lyrics_lrc JSONB NOT NULL,
    -- Структура lyrics_lrc:
    -- [{ time: 12.5, text: "Never gonna give you up", gaps: [{ word: "give", index: 3 }] }]
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE song_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    correct_gaps INTEGER DEFAULT 0,
    total_gaps INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    xp_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Страницы Songs

```
/student/songs/
├── index.vue      — Каталог песен (по уровню, жанру, исполнителю)
└── [id].vue       — Плеер + gaps

/admin/content/songs.vue  — CRUD управление песнями
```

### SongWorkspace компонент

```
widgets/song-player/
├── SongWorkspace.vue     — Главный виджет
├── YoutubePlayer.vue     — YouTube IFrame через useScript()
├── LyricsDisplay.vue     — Строки + инпуты
└── GapInput.vue          — Отдельный инпут для слова
```

**Ключевая логика:**

```typescript
// Пауза на пропуске
watch(currentLine, (line) => {
  if (line?.gaps?.length > 0 && !allGapsFilled(line)) {
    player.pauseVideo()
    focusFirstGap(line)
  }
})

// Проверка ввода
const checkGap = (lineIndex: number, gapIndex: number, value: string) => {
  const correct = lyrics[lineIndex].gaps[gapIndex].word
  const isCorrect = value.trim().toLowerCase() === correct.toLowerCase()
  if (isCorrect) {
    gapResults[lineIndex][gapIndex] = 'correct'
    gamificationStore.addXp(10, 'song_gap', `${songId}:${lineIndex}:${gapIndex}`)
    if (allGapsFilled(lyrics[lineIndex])) {
      player.playVideo() // Продолжить
    }
  } else {
    gapResults[lineIndex][gapIndex] = 'incorrect'
  }
}
```

### XP за Songs

| Действие | XP |
|----------|----|
| Правильный gap | 10 |
| Завершить песню (все gaps) | 50 |
| 100% точность | +30 бонус |

---

## 7. Модуль: Grammar Platform

### Концепция

5-шаговый wizard изучения грамматики:
1. **Watch** — видео-урок
2. **Study** — конспект Markdown
3. **Practice** — собрать предложения из слов
4. **Test** — тест с выбором варианта
5. **Speaking** — записать устный ответ

### Схема БД

```sql
CREATE TABLE grammar_lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    level TEXT NOT NULL,
    topic TEXT,             -- 'Past Simple', 'Conditionals', etc.
    video_url TEXT,
    content_md TEXT NOT NULL,
    practice_data JSONB NOT NULL,
    -- practice_data структура:
    -- {
    --   sentences: [{ words: ["I", "went", "to", "school"], correct: "I went to school" }],
    --   quiz: [{ question: "...", options: ["A","B","C","D"], correct: "A" }],
    --   speaking_prompt: "Tell me about your last vacation using Past Simple"
    -- }
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE grammar_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES grammar_lessons(id) ON DELETE CASCADE,
    step_completed INTEGER DEFAULT 0, -- 1..5
    quiz_score NUMERIC(3,1),          -- % правильных
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    xp_awarded INTEGER DEFAULT 0,
    UNIQUE(user_id, lesson_id)
);
```

### Страницы Grammar

```
/student/grammar/
├── index.vue      — Каталог уроков по темам и уровням
└── [id].vue       — 5-шаговый wizard

/admin/content/grammar.vue  — CRUD грамматических уроков
```

### GrammarWizard компонент

```
widgets/grammar-wizard/
├── GrammarWizard.vue      — Главный компонент (степпер)
├── StepWatch.vue          — Шаг 1: видео
├── StepStudy.vue          — Шаг 2: Markdown конспект
├── StepPractice.vue       — Шаг 3: сборка предложений
├── StepTest.vue           — Шаг 4: quiz
└── StepSpeaking.vue       — Шаг 5: запись + загрузка
```

**StepPractice.vue — сборка предложений:**

```typescript
const availableWords = ref(shuffle([...sentence.words]))
const selectedWords = ref<string[]>([])

const selectWord = (word: string, idx: number) => {
  selectedWords.value.push(word)
  availableWords.value.splice(idx, 1)
}

const removeWord = (word: string, idx: number) => {
  availableWords.value.push(word)
  selectedWords.value.splice(idx, 1)
}

const checkSentence = () => {
  const result = selectedWords.value.join(' ')
  isCorrect.value = result === sentence.correct
  if (isCorrect.value) {
    gamificationStore.addXp(15, 'grammar_practice', lessonId)
  }
}
```

**StepSpeaking.vue — запись:**

```typescript
const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  recorder = new MediaRecorder(stream)
  chunks = []
  recorder.ondataavailable = (e) => chunks.push(e.data)
  recorder.onstop = uploadRecording
  recorder.start()
  isRecording.value = true
}

const uploadRecording = async () => {
  const blob = new Blob(chunks, { type: 'audio/webm' })
  const path = `grammar/${userId}/${lessonId}/${Date.now()}.webm`
  const { data } = await supabase.storage.from('submissions').upload(path, blob)
  await supabase.from('student_submissions').insert({
    user_id: userId,
    lesson_type: 'grammar_speaking',
    target_id: lessonId,
    audio_storage_path: data?.path,
    status: 'pending'
  })
  gamificationStore.addXp(50, 'grammar_speaking', lessonId)
  triggerConfetti()
}
```

### XP за Grammar

| Действие | XP |
|----------|----|
| Посмотреть видео (80%) | 10 |
| Прочитать конспект | 10 |
| Собрать предложение правильно | 15 |
| Тест ≥70% | 50 |
| Тест 100% | +30 бонус |
| Записать устный ответ | 50 |

---

## 8. Интеграция: АльфаСРМ

### Что такое АльфаСРМ

CRM для образовательных центров. Хранит:
- Лиды (потенциальные ученики)
- Сделки (оплата, статус)
- Контакты (студенты, родители)
- Занятия и посещаемость

### Ключевые сценарии интеграции

1. **Синхронизация учеников** — При регистрации в Lingaphone → создать контакт в АльфаСРМ
2. **Статусы оплаты** — Оплачено в АльфаСРМ → активировать доступ в Lingaphone
3. **Посещаемость** — Урок проведён → отметить в АльфаСРМ
4. **Новые лиды** — Форма на сайте → лид в АльфаСРМ

### API АльфаСРМ (v2)

```
Base URL: https://api.alfacrm.pro/v2/{CRM_DOMAIN}/
Auth: Заголовок X-ALFACRM-TOKEN

Ключевые endpoints:
GET  /customer          — Список учеников
POST /customer          — Создать ученика
GET  /customer/{id}     — Получить ученика
PUT  /customer/{id}     — Обновить ученика
GET  /pay               — История оплат
POST /attendance        — Отметить посещаемость
GET  /lead              — Лиды
POST /lead              — Создать лид
GET  /lesson            — Занятия
```

### Серверные маршруты

```
server/api/crm/
├── sync-student.post.ts   — При регистрации: создать в АльфаСРМ
├── check-payment.get.ts   — Проверить статус оплаты ученика
├── mark-attendance.post.ts — Отметить посещаемость после урока
├── create-lead.post.ts    — Новый лид с лендинга
└── webhook.post.ts        — Webhook от АльфаСРМ (оплата прошла)
```

### sync-student.post.ts

```typescript
// server/api/crm/sync-student.post.ts
export default defineEventHandler(async (event) => {
  const { userId, name, surname, phone, email, level } = await readBody(event)
  
  const response = await $fetch(`${CRM_BASE}/customer`, {
    method: 'POST',
    headers: { 'X-ALFACRM-TOKEN': process.env.ALFACRM_TOKEN! },
    body: {
      name: `${name} ${surname}`,
      email,
      phone,
      study_status_id: 1, // Активный
      note: `Level: ${level}`
    }
  })
  
  // Сохранить alfa_id в profiles
  const supabase = serverSupabaseServiceRole(event)
  await supabase.from('profiles').update({ 
    alfa_crm_id: response.id 
  }).eq('id', userId)
  
  return { success: true, alfaId: response.id }
})
```

### Webhook от АльфаСРМ (оплата)

```typescript
// server/api/crm/webhook.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // Проверить подпись
  if (body.secret !== process.env.ALFACRM_WEBHOOK_SECRET) {
    throw createError({ statusCode: 401 })
  }
  
  if (body.event === 'payment.created') {
    const supabase = serverSupabaseServiceRole(event)
    // Обновить статус подписки
    await supabase.from('subscriptions').upsert({
      user_id: body.customer_id_mapped, // нужен mapping
      paid_until: body.paid_until,
      status: 'active'
    })
  }
  
  return { ok: true }
})
```

### Нужно добавить в схему БД

```sql
-- В таблицу profiles добавить:
ALTER TABLE profiles ADD COLUMN alfa_crm_id TEXT;
ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'trial'; 
-- 'trial', 'active', 'expired'
ALTER TABLE profiles ADD COLUMN subscription_until TIMESTAMPTZ;
```

### Страница Admin CRM

```
/admin/crm/index.vue — Данные из АльфаСРМ:
- Список лидов
- Ученики с просроченной оплатой
- Новые оплаты за текущий месяц
- Кнопка "Синхронизировать"
```

### Env переменные

```bash
ALFACRM_API_URL=https://api.alfacrm.pro/v2/
ALFACRM_DOMAIN=yourdomain     # Поддомен вашей CRM
ALFACRM_TOKEN=your_token
ALFACRM_WEBHOOK_SECRET=your_secret
```

---

## 9. Схема БД (дополнения)

### student_submissions (общая для Grammar + Library)

```sql
CREATE TABLE student_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    lesson_type TEXT NOT NULL, -- 'grammar_speaking', 'library_discussion', 'homework_oral'
    target_id UUID NOT NULL,   -- ID урока/книги/ДЗ
    audio_storage_path TEXT,
    text_content TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'reviewed'
    teacher_id UUID REFERENCES profiles(id),
    teacher_score INTEGER,         -- 1..10
    teacher_feedback TEXT,
    xp_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE student_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own" ON student_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own" ON student_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers can read all" ON student_submissions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
    );

CREATE POLICY "Teachers can update" ON student_submissions
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
    );
```

### Полная схема role в profiles

```sql
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'student';
-- Значения: 'student', 'teacher', 'admin'
ALTER TABLE profiles ADD COLUMN email TEXT;
ALTER TABLE profiles ADD COLUMN name TEXT;
ALTER TABLE profiles ADD COLUMN surname TEXT;
ALTER TABLE profiles ADD COLUMN alfa_crm_id TEXT;
ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'trial';
ALTER TABLE profiles ADD COLUMN subscription_until TIMESTAMPTZ;
```

---

## 10. Чеклист задач

### Phase 1: Роли и аккаунты

- [ ] Добавить колонку `role`, `email`, `name`, `surname` в `profiles`
- [ ] Создать миграцию: `supabase migration new add-roles-to-profiles`
- [ ] Создать аккаунт admin@linga.kz через Supabase Dashboard
- [ ] Создать аккаунт teacher@linga.kz через Supabase Dashboard
- [ ] Вставить записи в profiles с ролями
- [ ] Обновить `middleware/role-guard.global.ts` для редиректов по ролям
- [ ] Создать layout для `/admin/` и `/teacher/`

### Phase 2: Панель Admin

- [ ] `pages/admin/index.vue` — KPI дашборд
- [ ] `pages/admin/students/index.vue` — список учеников
- [ ] `pages/admin/students/[id].vue` — профиль ученика
- [ ] `pages/admin/teachers/index.vue` — список учителей
- [ ] `pages/admin/groups/index.vue` — группы
- [ ] `pages/admin/finance/index.vue` — медали и выплаты
- [ ] `pages/admin/submissions/index.vue` — проверка устных ответов
- [ ] `entities/admin-stats/composables/useAdminStats.ts`
- [ ] `features/review-submission/composables/useReviewSubmission.ts`
- [ ] `widgets/admin-dashboard/AdminDashboardWidget.vue`

### Phase 3: Панель Teacher

- [ ] `pages/teacher/index.vue` — дашборд учителя
- [ ] `pages/teacher/students/index.vue` + `[id].vue`
- [ ] `pages/teacher/groups/index.vue` + `[id].vue`
- [ ] `pages/teacher/homework/index.vue` + `create.vue` + `[id].vue`
- [ ] `pages/teacher/grades/index.vue`
- [ ] `pages/teacher/submissions/index.vue` — аудиоплеер + оценка
- [ ] `entities/teacher/composables/useTeacher.ts`
- [ ] `features/create-homework/composables/useCreateHomework.ts`
- [ ] `features/grade-student/composables/useGradeStudent.ts`

### Phase 4: Library (книги)

- [ ] Миграция: создать таблицы `books`, `book_progress`, `book_discussions`
- [ ] RLS политики для книг
- [ ] `entities/book/composables/useBooks.ts`
- [ ] `entities/book/model/types.ts`
- [ ] `entities/book/index.ts`
- [ ] `widgets/book-reader/BookReader.vue`
- [ ] `widgets/book-reader/WordTranslatePopover.vue`
- [ ] `widgets/book-reader/DiscussionRecorder.vue`
- [ ] `pages/student/library/index.vue`
- [ ] `pages/student/library/[id].vue`
- [ ] `pages/admin/content/books.vue` — CRUD
- [ ] `server/api/translate.post.ts` — перевод слов (OpenAI/DeepL)
- [ ] XP интеграция за прочтение

### Phase 5: Songs

- [ ] Миграция: создать таблицы `songs`, `song_attempts`
- [ ] RLS политики
- [ ] `entities/song/composables/useSongs.ts`
- [ ] `widgets/song-player/SongWorkspace.vue`
- [ ] `widgets/song-player/LyricsDisplay.vue`
- [ ] `widgets/song-player/GapInput.vue`
- [ ] `pages/student/songs/index.vue`
- [ ] `pages/student/songs/[id].vue`
- [ ] `pages/admin/content/songs.vue` — CRUD
- [ ] YouTube IFrame API через `useScript()`
- [ ] XP интеграция за gaps

### Phase 6: Grammar

- [ ] Миграция: создать таблицы `grammar_lessons`, `grammar_progress`
- [ ] RLS политики
- [ ] `entities/grammar/composables/useGrammar.ts`
- [ ] `widgets/grammar-wizard/GrammarWizard.vue`
- [ ] `widgets/grammar-wizard/StepWatch.vue`
- [ ] `widgets/grammar-wizard/StepStudy.vue`
- [ ] `widgets/grammar-wizard/StepPractice.vue`
- [ ] `widgets/grammar-wizard/StepTest.vue`
- [ ] `widgets/grammar-wizard/StepSpeaking.vue`
- [ ] `pages/student/grammar/index.vue`
- [ ] `pages/student/grammar/[id].vue`
- [ ] `pages/admin/content/grammar.vue` — CRUD
- [ ] Интеграция `canvas-confetti` при 100% тесте
- [ ] Supabase Storage bucket `submissions`
- [ ] XP интеграция за все шаги

### Phase 7: АльфаСРМ

- [ ] Добавить `alfa_crm_id`, `subscription_status`, `subscription_until` в profiles
- [ ] `server/api/crm/sync-student.post.ts`
- [ ] `server/api/crm/check-payment.get.ts`
- [ ] `server/api/crm/mark-attendance.post.ts`
- [ ] `server/api/crm/create-lead.post.ts`
- [ ] `server/api/crm/webhook.post.ts`
- [ ] `pages/admin/crm/index.vue`
- [ ] Env переменные: ALFACRM_API_URL, ALFACRM_TOKEN, ALFACRM_DOMAIN, ALFACRM_WEBHOOK_SECRET
- [ ] Middleware проверки подписки (блокировать expired)

### Phase 8: student_submissions (общая таблица)

- [ ] Миграция: создать `student_submissions`
- [ ] RLS политики (студент видит своё, учитель видит всё)
- [ ] Storage bucket `submissions` (публичный доступ только для аутентифицированных)
- [ ] `entities/submission/composables/useSubmissions.ts`
- [ ] `features/review-submission/composables/useReviewSubmission.ts`

---

## Порядок выполнения (рекомендуемый)

```
1. Роли + аккаунты (1 день)          → разблокирует тестирование всех ролей
2. Admin панель базовая (2-3 дня)     → нужна для управления контентом
3. Teacher панель базовая (2-3 дня)   → нужна для проверки ДЗ и ответов
4. student_submissions + Storage (1 день) → база для Grammar и Library
5. Grammar (2-3 дня)                  → самый сложный модуль (5 шагов)
6. Library (2-3 дня)                  → читалка + синхронизация аудио
7. Songs (1-2 дня)                    → YouTube + gaps логика
8. АльфаСРМ (2-3 дня)                → зависит от доступа к API

Итого: ~15-20 рабочих дней
```

---

## Технические заметки

### Supabase Storage Buckets

```sql
-- Создать через Dashboard > Storage > New Bucket
-- Или через миграцию:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('submissions', 'submissions', false, 52428800, ARRAY['audio/webm', 'audio/mp4', 'audio/ogg']),
  ('books', 'books', true, 104857600, ARRAY['application/pdf', 'audio/mpeg', 'image/*']),
  ('covers', 'covers', true, 5242880, ARRAY['image/*']);
```

### YouTube IFrame через useScript (Nuxt 4)

```typescript
// В компоненте SongWorkspace.vue
const { onLoaded } = useScript('https://www.youtube.com/iframe_api', {
  use() { return window.YT }
})

onLoaded((YT) => {
  player = new YT.Player('youtube-player', {
    videoId: props.song.video_id,
    events: {
      onStateChange: handleStateChange,
      onReady: handleReady
    }
  })
})
```

### Перевод слов (server route)

```typescript
// server/api/translate.post.ts
export default defineEventHandler(async (event) => {
  const { word, targetLang } = await readBody(event)
  // Вариант 1: OpenAI
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: `Translate "${word}" to ${targetLang}. Return only the translation.` }]
  })
  return { translation: resp.choices[0].message.content }
})
```

### canvas-confetti

```bash
pnpm add canvas-confetti
pnpm add -D @types/canvas-confetti
```

```typescript
// shared/lib/confetti.ts
import confetti from 'canvas-confetti'

export const triggerConfetti = () => {
  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
}
```
