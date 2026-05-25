# LINGAFON — Модель данных и связи

> Источник истины для сущностей, полей и связей между ними. Когда пишем mock-данные, новые экраны или будущие Supabase-миграции — сверяемся с этим документом.
>
> Обновляется по мере добавления экранов. См. также [lingafon_pages_map.md](lingafon_pages_map.md) (карта UI) и [app/shared/mock/](app/shared/mock/) (фактическая реализация типов).

---

## Где живут типы

| Тип / группа | Файл | Назначение |
| --- | --- | --- |
| Все базовые типы (Branch, Teacher, Group, Lesson, Grade, Medal, Homework, ...) | [app/shared/mock/types.ts](app/shared/mock/types.ts) | Зеркало будущей БД |
| Статические mock-данные | [app/shared/mock/data.ts](app/shared/mock/data.ts) | Группы, медали, ДЗ для разработки |
| Колоды произношения | [app/shared/mock/pronunciation.ts](app/shared/mock/pronunciation.ts) | A2 daily / travel / minimal pairs |
| Composable `useMockStudent()` | [app/shared/mock/index.ts](app/shared/mock/index.ts) | Точка входа для UI |
| Enum'ы ролей и др. | [app/shared/types/common.ts](app/shared/types/common.ts) | UserRole, HomeworkFormat, MedalKind |

---

## ER-карта (high level)

```
User ────┬──── Student ──── GroupMember ──── Group ──── Branch
         │         │                            └── Teacher (Teacher → User)
         │         │
         │         ├── Attendance ── Lesson ── Group
         │         ├── Grade ─────── Lesson
         │         ├── HomeworkSubmission ── Homework ── Lesson
         │         ├── MonthlyMedal ── Payout
         │         ├── PracticeAttempt ── PronunciationCard ── PracticeDeck
         │         ├── Certificate
         │         └── EventParticipant ── Event
         │
         ├──── Parent ──── ParentToStudent ──── Student (M:N)
         │         └── Payment
         ├──── Teacher ──── Group (1:N)
         └──── Admin
```

---

## Ядро: User & роли

### `User`
| Поле | Тип | Заметки |
| --- | --- | --- |
| `id` | uuid PK | Внутренний ID |
| `authId` | text UNIQUE | Соответствует `auth.users.id` Supabase |
| `email` | text UNIQUE | |
| `name`, `surname` | text | Используется в JWT claims |
| `role` | UserRole | STUDENT \| PARENT \| TUTOR \| ADMIN |
| `phone`, `avatarUrl` | text? | |
| `status` | UserStatus | ACTIVE \| INACTIVE \| BANNED |

**Связи:** `Student.userId` / `Parent.userId` / `Teacher.userId` / `Admin.userId` → `User.id` (по одному на роль).

**JWT claims** (через `custom_access_token_hook`): `user_role`, `user_name`, `user_surname`, `user_id`.

### `Student`
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `userId` | uuid → User.id (UNIQUE) |
| `level` | EnglishLevel |
| `grade` | int? | Школьный класс (для детей) |
| `goldStreak` | int | Подряд идущих золотых месяцев |
| `totalEarnings` | int | Всего заработано в тенге |
| `currentMonthAverage` | float | Кэш среднего балла текущего месяца |

### `Parent`, `Teacher`, `Admin`
Минимум: `id`, `userId` (UNIQUE → User.id).

`Teacher` дополнительно: `bio`, `yearsOfExperience`, `verificationStatus`, `rating`, `reviewCount`.

### `ParentToStudent` (M:N)
| Поле | Тип |
| --- | --- |
| `parentId` | uuid → Parent.id |
| `studentId` | uuid → Student.id |
| `status` | PENDING \| ACTIVE | Подтверждение связи |
| `linkedAt` | timestamp |

---

## Учебный контур

### `Branch` (филиал)
| Поле | Тип | Значения |
| --- | --- | --- |
| `id` | uuid PK | |
| `name` | text | "Алматы — Достык" |
| `kind` | BranchKind | OFFLINE \| ONLINE |
| `address`, `city` | text? | |

Mock: 3 филиала в Алматы + один синтетический "ONLINE".

### `Level` (англ. уровень)
Enum-таблица (или TS enum) `EnglishLevel`: `A1 | A2 | S1 | S2 | B2 | F1 | F2 | F3 | F4`.

### `Group` (учебная группа)
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `name` | text | "A2 Tuesday Stars" |
| `level` | EnglishLevel |
| `teacherId` | uuid → Teacher.id |
| `branchId` | uuid → Branch.id |
| `schedule` | jsonb | Массив `{ weekday, startTime, durationMin }` |
| `maxStudents` | int |

### `GroupMember` (M:N: Student ↔ Group)
| Поле | Тип |
| --- | --- |
| `studentId` | uuid → Student.id |
| `groupId` | uuid → Group.id |
| `joinedAt` | timestamp |
| `status` | ACTIVE \| LEFT |

### `Lesson` (один конкретный урок)
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `groupId` | uuid → Group.id |
| `startsAt` | timestamptz |
| `durationMin` | int |
| `topic` | text |
| `status` | SCHEDULED \| IN_PROGRESS \| COMPLETED \| CANCELLED |
| `recordingUrl` | text? | После окончания (для online) |
| `materialsUrl` | text[]? | Аудио / PDF / видео |

### `Attendance`
| Поле | Тип |
| --- | --- |
| `studentId` | uuid → Student.id |
| `lessonId` | uuid → Lesson.id |
| `status` | PRESENT \| ABSENT \| LATE |
| `markedBy` | uuid → Teacher.id |

PK = (studentId, lessonId).

### `Grade`
| Поле | Тип |
| --- | --- |
| `studentId` | uuid → Student.id |
| `lessonId` | uuid → Lesson.id |
| `value` | int (1-5) |
| `comment` | text? |
| `gradedBy` | uuid → Teacher.id |
| `gradedAt` | timestamp |

PK = (studentId, lessonId).

---

## Маркет Достижений (главная фишка)

### `MonthlyMedal`
Агрегат за месяц на ученика.

| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `studentId` | uuid → Student.id |
| `month` | text | формат `YYYY-MM` |
| `averageGrade` | float |
| `medal` | MedalKind | GOLD \| SILVER \| BRONZE \| NONE |
| `payout` | int | в тенге |
| `confirmedBy` | uuid → Teacher.id | педагог финализирует |
| `confirmedAt` | timestamp? |

UNIQUE (`studentId`, `month`).

**Правило выставления медали** (вычисляется/проверяется при `confirm`):
- average ≥ 4.6 → GOLD → 5 000 ₸
- average ≥ 4.0 → SILVER → 3 000 ₸
- average ≥ 3.6 → BRONZE → 1 000 ₸
- < 3.6 → NONE → 0 ₸

### `GoldStreak`
Денормализованный счётчик подряд идущих GOLD месяцев. Хранится в `Student.goldStreak`, можно пересчитать из `MonthlyMedal`.

**Бонусы:**
- 3 мес GOLD подряд → +5 000 ₸
- 6 мес → +10 000 ₸
- 9 мес → +15 000 ₸

### `Payout`
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `medalId` | uuid → MonthlyMedal.id |
| `amount` | int |
| `status` | PENDING \| PAID |
| `paidAt` | timestamp? |
| `method` | text? | Kaspi / cash / иное |

---

## Домашка (планируется)

### `Homework`
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `lessonId` | uuid → Lesson.id |
| `title` | text |
| `description` | text? |
| `format` | HomeworkFormat | TEST \| INPUT \| TEXT \| ORAL \| FILE \| INTERACTIVE |
| `payload` | jsonb | Зависит от формата: вопросы, эталоны, и т.д. |
| `dueAt` | timestamptz |
| `maxScore` | int |

### `HomeworkSubmission`
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `homeworkId` | uuid → Homework.id |
| `studentId` | uuid → Student.id |
| `submittedAt` | timestamp? |
| `status` | HomeworkStatus | ASSIGNED \| IN_PROGRESS \| SUBMITTED \| CHECKED \| OVERDUE |
| `answers` | jsonb | Структура зависит от format |
| `audioUrl` | text? | Для ORAL |
| `fileUrl` | text? | Для FILE |
| `aiScore` | float? | 0-100, для авто-форматов |
| `aiFeedback` | jsonb? |
| `teacherGrade` | int? | 1-5 итоговая оценка |
| `teacherComment` | text? |

UNIQUE (`homeworkId`, `studentId`).

---

## AI-тренажёр произношения

### `PracticeDeck`
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `level` | EnglishLevel |
| `title`, `description`, `emoji` | text |

### `PronunciationCard`
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `deckId` | uuid → PracticeDeck.id |
| `kind` | PracticeKind | WORD \| PHRASE \| MIN_PAIR |
| `target` | text | "Breakfast" |
| `ipa` | text | "/ˈbrekfəst/" |
| `translation` | text | "завтрак" |
| `example` | text? | пример в предложении |
| `audioUrl` | text? | (опционально — для нативных записей вместо TTS) |

### `PracticeAttempt`
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `studentId` | uuid → Student.id |
| `cardId` | uuid → PronunciationCard.id |
| `transcript` | text | Что услышал Whisper / Web Speech |
| `score` | int (0-100) | Levenshtein similarity |
| `attemptedAt` | timestamp |

Хранится для статистики, daily quest, retry-аналитики.

---

## Материалы (планируется)

### `Material`
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `lessonId` | uuid → Lesson.id (nullable — общешкольные ресурсы) |
| `kind` | AUDIO \| VIDEO \| PDF \| LINK |
| `title` | text |
| `url` | text |
| `durationSec` | int? |
| `tag` | text? | "headphones", "homework-prep" |

### `VocabularyEntry` (личный словарь ученика)
| Поле | Тип |
| --- | --- |
| `studentId` | uuid → Student.id |
| `word` | text |
| `translation` | text |
| `addedFromCardId` | uuid? → PronunciationCard.id |
| `addedAt` | timestamp |

---

## Воронка и заявки

### `Application` (заявка с лендоса)
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `kind` | TRIAL \| QUESTION \| TRANSFER |
| `name`, `phone`, `email` | text |
| `desiredLevel` | EnglishLevel? |
| `status` | NEW \| ASSIGNED \| CONVERTED \| REJECTED |
| `levelTestId` | uuid? → LevelTestAttempt.id |

### `LevelTestAttempt` (тест уровня на лендосе)
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `anonId` | text | localStorage UUID для анонимов |
| `userId` | uuid? → User.id (если зашёл позже) |
| `answers` | jsonb |
| `computedLevel` | EnglishLevel |
| `completedAt` | timestamp |
| `source` | text? | utm/referrer |

### `TrialLesson`
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `applicationId` | uuid → Application.id |
| `teacherId` | uuid → Teacher.id |
| `scheduledAt` | timestamptz |
| `format` | OFFLINE \| ONLINE |
| `branchId` | uuid? → Branch.id |
| `result` | text? | Заметки педагога |
| `convertedToGroupId` | uuid? → Group.id |

---

## Ивенты и сертификаты

### `Event`
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `kind` | CAMP \| HOLIDAY \| WORKSHOP \| CONTEST |
| `title`, `description` | text |
| `startsAt`, `endsAt` | timestamptz |
| `price` | int (в тенге) |
| `capacity` | int |
| `branchId` | uuid? → Branch.id |
| `posterUrl` | text? |

### `EventParticipant`
| Поле | Тип |
| --- | --- |
| `eventId` | uuid → Event.id |
| `studentId` | uuid → Student.id |
| `paymentId` | uuid? → Payment.id |
| `status` | REGISTERED \| ATTENDED \| CANCELLED |

### `Certificate`
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `studentId` | uuid → Student.id |
| `kind` | LEVEL_COMPLETION \| CONTEST_WINNER \| YEAR_END |
| `title` | text |
| `issuedAt` | date |
| `pdfUrl` | text |

---

## Финансы

### `Package` (тарифные пакеты)
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `level` | EnglishLevel |
| `format` | OFFLINE \| ONLINE \| BOTH |
| `lessonsPerMonth` | int |
| `priceMonth` | int (в тенге) |

### `Payment`
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `parentId` | uuid → Parent.id |
| `studentId` | uuid → Student.id |
| `packageId` | uuid? → Package.id |
| `eventId` | uuid? → Event.id |
| `amount` | int |
| `status` | PaymentStatus | PENDING \| COMPLETED \| FAILED \| REFUNDED |
| `paidAt` | timestamp? |

---

## Коммуникации

### `Conversation`
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `kind` | DIRECT \| GROUP |
| `groupId` | uuid? → Group.id (для GROUP) |
| `participants` | uuid[] → User.id |

### `Message`
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `conversationId` | uuid → Conversation.id |
| `senderId` | uuid → User.id |
| `body` | text |
| `attachments` | jsonb? |
| `readBy` | uuid[] |
| `createdAt` | timestamp |

### `Notification`
| Поле | Тип |
| --- | --- |
| `id` | uuid PK |
| `userId` | uuid → User.id |
| `type` | NotificationType |
| `title`, `body` | text |
| `isRead` | bool |
| `payload` | jsonb? | Ссылка на entity (medalId, lessonId, etc.) |

---

## Геймификация (вторичная, опционально)

XP/Quest-система из femo уже есть в [common.ts](app/shared/types/common.ts) (`XPActionType`, `GEM_REWARDS`, `QuestType`). Используем только если решим добавить daily-streak/мини-квесты помимо ежемесячных медалей.

---

## RLS-намёки (для будущих миграций)

| Таблица | STUDENT | PARENT | TEACHER | ADMIN |
| --- | --- | --- | --- | --- |
| `User` (own row) | SELECT own | SELECT own | SELECT own | SELECT all |
| `Student` | SELECT own | SELECT own children (через ParentToStudent ACTIVE) | SELECT через GroupMember | SELECT all |
| `Group` | SELECT через GroupMember | SELECT через children | SELECT own (Group.teacherId) | * |
| `Lesson`, `Attendance`, `Grade` | SELECT по studentId=own | SELECT по child | SELECT по своей группе | * |
| `MonthlyMedal`, `Payout` | SELECT own | SELECT по детям | SELECT по своим группам | UPDATE на confirm |
| `HomeworkSubmission` | CRUD own | SELECT по детям | SELECT+UPDATE (оценить) по своей группе | * |
| `Application`, `TrialLesson` | ❌ | ❌ | SELECT назначенные | * |
| `Payment`, `Package` | ❌ | SELECT own + INSERT own | ❌ | * |
| `PracticeAttempt` | CRUD own | SELECT по детям | ❌ | SELECT all (для аналитики) |
| `Certificate`, `Event` (own participation) | SELECT own | SELECT по детям | SELECT (для своих учеников) | * |
| `Conversation`, `Message` | SELECT через participants | SELECT через participants | SELECT через participants | * |

`Parent → child` всегда через `ParentToStudent.status = 'ACTIVE'` ([helper `get_active_child_ids()` уже есть в femo-схеме](C:/Users/Admin/.claude/projects/c--Users-Admin-arna-tutor/memory/parent_link_approval_flow.md)).

---

## Что зеркалится в `app/shared/mock/`

| Сущность из этого документа | Файл | Composable |
| --- | --- | --- |
| Branch, Teacher, Group, Lesson | [types.ts](app/shared/mock/types.ts) + [data.ts](app/shared/mock/data.ts) | `useMockStudent()` |
| MonthlyMedal, Homework, StudentProfile | [data.ts](app/shared/mock/data.ts) | `useMockStudent()` |
| PracticeDeck, PronunciationCard | [pronunciation.ts](app/shared/mock/pronunciation.ts) | импорт `PRACTICE_DECKS`, `getDeck()` |
| Material, VocabularyEntry, Event, Certificate, Conversation, Message | _ещё не добавлено_ | — |

**При добавлении новой сущности:** сначала тип в `types.ts`, mock-данные в новом файле, экспорт через `index.ts` — и обновляешь этот документ.

---

*Документ от 2026-05-18. Обновлять по мере добавления экранов и сущностей.*
