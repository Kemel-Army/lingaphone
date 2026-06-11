# Features Plan — Lingaphone English Platform

> Дата: 2026-06-10
> Обновлено: 2026-06-11
> Статус: Итерации 1–4 завершены ✅

---

## Статус реализации

| Раздел | Статус | DB | Entity | Feature | Pages | Seed | Sidebar |
|--------|--------|----|--------|---------|-------|------|---------|
| 🏆 Leaderboard | ✅ Готово | — | ✅ | — | ✅ | — | ✅ |
| 📖 Grammar Platform | ✅ Готово | ✅ Applied | ✅ | ✅ | ✅ | ✅ 40 тем / 120 упр. | ✅ |
| 📚 Reading Library | ✅ Готово | ✅ Applied | ✅ | ✅ | ✅ | ✅ 8 текстов / 32 вопр. | ✅ |
| 🎵 Songs Practice | ✅ Готово | ✅ Applied | ✅ | ✅ | ✅ | ✅ 3 песни | ✅ |

---

## Что сделано

### ✅ Leaderboard

- `server/api/leaderboard/index.get.ts` — API с режимами school / week / month
- `app/entities/game-profile/composables/useLeaderboard.ts`
- `app/pages/student/leaderboard/index.vue` — подиум топ-3 + таблица + переключение периодов
- `app/entities/game-profile/ui/StudentLeaderboard.vue` (CSS исправлен под Tailwind v4)
- Sidebar: пункт «Рейтинг» в `STUDENT_SIDEBAR`

---

### ✅ Grammar Platform

**DB (применено через Supabase MCP):**
- `GrammarTopic` — 40 тем: A1(8), A2(10), B1(12), B2(10)
- `GrammarExercise` — 120 упражнений: по 3 на тему (MCQ + FILL)
- `GrammarProgress` — mastery, attempts, bestScore; UNIQUE(studentId, topicId)
- RLS-политики на все 3 таблицы
- `ALTER TYPE "XpActionKind" ADD VALUE 'GRAMMAR_COMPLETE'`
- `ALTER TYPE "XpActionKind" ADD VALUE 'GRAMMAR_PERFECT'`

**Frontend:**
- `app/entities/grammar/model/types.ts`
- `app/entities/grammar/composables/useGrammarTopics.ts`
- `app/entities/grammar/composables/useGrammarProgress.ts`
- `app/entities/grammar/ui/GrammarTopicCard.vue`
- `app/entities/grammar/index.ts`
- `app/features/practice-grammar/composables/usePracticeGrammar.ts`
- `app/features/practice-grammar/ui/GrammarExerciseRunner.vue`
- `app/features/practice-grammar/index.ts`
- `app/pages/student/grammar/index.vue` — каталог по уровням A1–B2
- `app/pages/student/grammar/[slug].vue` — 3 фазы: теория → упражнения → результат
- `XPActionType.GRAMMAR_COMPLETE / GRAMMAR_PERFECT` в `common.ts`
- Sidebar: пункт «Грамматика» (badge NEW)

---

### ✅ Reading Library

**DB (применено через Supabase MCP):**
- `ReadingText` — title, body, level (A1–B2), genre, topic, wordCount, vocabulary JSONB, isPublished
- `ReadingQuestion` — textId FK, type (MCQ/TRUE_FALSE/FILL/OPEN), question, options JSONB, answer, points, order
- `ReadingProgress` — studentId FK, textId FK, score, maxScore, completedAt, xpEarned; UNIQUE(studentId, textId)
- RLS-политики на все 3 таблицы
- `ALTER TYPE "XpActionKind" ADD VALUE 'READING_COMPLETE'`
- `ALTER TYPE "XpActionKind" ADD VALUE 'READING_PERFECT'`

**Seed (применено):**
- A1: *My Family* (87 слов, story), *At the Cafe* (83 слова, dialogue)
- A2: *Weekend Plans* (112 слов, story), *The Perfect Hobby* (128 слов, article)
- B1: *The Science of Sleep* (158 слов, article), *Social Media: Friend or Enemy?* (169 слов, article)
- B2: *The Psychology of Procrastination* (178 слов, article), *The Hidden Language of Colour* (175 слов, article)
- По 4 вопроса на текст (MCQ / TRUE_FALSE / FILL)

**Frontend:**
- `app/entities/reading/model/types.ts` — ReadingLevel, ReadingGenre, READING_LEVEL_META, READING_GENRE_META, EFL_READING_WPM
- `app/entities/reading/composables/useReadingLibrary.ts`
- `app/entities/reading/composables/useReadingProgress.ts`
- `app/entities/reading/ui/ReadingCard.vue`
- `app/entities/reading/index.ts`
- `app/features/complete-reading/composables/useCompleteReading.ts`
- `app/features/complete-reading/ui/ReadingQuiz.vue`
- `app/features/complete-reading/index.ts`
- `app/pages/student/reading/index.vue` — каталог с фильтрами уровень + жанр
- `app/pages/student/reading/[id].vue` — 3 фазы: чтение → вопросы → результат
- `XPActionType.READING_COMPLETE / READING_PERFECT` в `common.ts`
- Sidebar: пункт «Чтение» (badge NEW)

---

### ✅ Songs Practice

**DB (применено через Supabase MCP):**
- `Song` — title, artist, youtubeId, level (A2/B1/B2), genre, lyrics JSONB, vocabulary JSONB, isPublished
- `SongProgress` — studentId FK, songId FK, score, maxScore, completedAt, xpEarned; UNIQUE(studentId, songId)
- RLS-политики на обе таблицы
- `ALTER TYPE "XpActionKind" ADD VALUE 'SONG_COMPLETE'`
- `ALTER TYPE "XpActionKind" ADD VALUE 'SONG_PERFECT'`

**Seed (применено):**
- *Let Her Go* — Passenger (A2, pop, youtubeId: `RBumgng_BS4`, 4 пропуска)
- *Somewhere Only We Know* — Keane (B1, indie, youtubeId: `GCKiBO8RI5c`, 5 пропусков)
- *The Scientist* — Coldplay (B2, rock, youtubeId: `RB-RcX5DS5A`, 6 пропусков)

**Frontend:**
- `app/entities/song/model/types.ts` — SongLevel, SongGenre, LyricLine, SONG_LEVEL_META, SONG_GENRE_LABELS
- `app/entities/song/composables/useSongs.ts`
- `app/entities/song/composables/useSongProgress.ts`
- `app/entities/song/ui/SongCard.vue`
- `app/entities/song/index.ts`
- `app/features/practice-song/composables/usePracticeSong.ts`
- `app/features/practice-song/ui/LyricsGapFill.vue`
- `app/features/practice-song/index.ts`
- `app/pages/student/songs/index.vue` — каталог с фильтрами уровень + жанр
- `app/pages/student/songs/[id].vue` — 4 фазы: слушать → пропуски → словарь → результат
- `XPActionType.SONG_COMPLETE / SONG_PERFECT` в `common.ts`
- Sidebar: пункт «Песни» (badge NEW)

---

## XP Actions — итоговый статус

| Action | В `common.ts` | В DB (`XpActionKind`) | XP |
|--------|:---:|:---:|-----|
| `GRAMMAR_COMPLETE` | ✅ | ✅ | 40 |
| `GRAMMAR_PERFECT` | ✅ | ✅ | 90 |
| `READING_COMPLETE` | ✅ | ✅ | 30 |
| `READING_PERFECT` | ✅ | ✅ | 70 |
| `SONG_COMPLETE` | ✅ | ✅ | 25 |
| `SONG_PERFECT` | ✅ | ✅ | 60 |

---

## Sidebar — итоговый статус (STUDENT)

```typescript
{ label: 'Рейтинг',    icon: 'i-lucide-bar-chart-2',    to: '/student/leaderboard' }, // ✅
{ label: 'Грамматика', icon: 'i-lucide-book-marked',    to: '/student/grammar',     badge: 'NEW' }, // ✅
{ label: 'Чтение',     icon: 'i-lucide-book-open-text', to: '/student/reading',     badge: 'NEW' }, // ✅
{ label: 'Песни',      icon: 'i-lucide-music',          to: '/student/songs',       badge: 'NEW' }, // ✅
```

---

## Применённые миграции

| Файл | Содержимое |
|------|-----------|
| `20260628000000_grammar_platform.sql` | GrammarTopic, GrammarExercise, GrammarProgress + RLS |
| `20260628100000_grammar_seed.sql` | 40 тем + 120 упражнений |
| `20260629000000_reading_library.sql` | ReadingText, ReadingQuestion, ReadingProgress + RLS |
| `20260629100000_songs_practice.sql` | Song, SongProgress + RLS |
| `20260629200000_reading_seed_a1_a2.sql` | 4 текста A1/A2 + 16 вопросов |
| `20260629300000_reading_seed_b1_b2.sql` | 4 текста B1/B2 + 16 вопросов |
| `20260629400000_songs_seed.sql` | 3 песни с lyrics и vocabulary |

---

## CSS/Tailwind v4 — исправления (задокументировано)

- `flex-shrink-0` → `shrink-0`
- `bg-gradient-to-r` → `bg-linear-to-r`
- `var(--color-*)` из `:root` → Tailwind-классы (`text-amber-600`, `text-muted`, `divide-muted`)
- Все camelCase колонки в SQL всегда в кавычках: `"isPublished"`, `"topicId"` и т.д.
- Vue `:class` тернарные выражения всегда должны иметь `else`-ветку

---

## Что дальше (Итерация 5 — Polish)

- [ ] Виджет «Сегодня практикуй» на `/student` — рекомендация грамматической темы + текста для чтения
- [ ] Leaderboard: Realtime-подписка (обновление без перезагрузки)
- [ ] Добавить больше текстов (цель: 20-30) и песен (цель: 10-15)
- [ ] Quest seeds: «Прочитай 3 текста за неделю», «Разучи 1 песню за неделю»
- [ ] Achievement seeds: FIRST_READER, BOOKWORM, MUSIC_LOVER
