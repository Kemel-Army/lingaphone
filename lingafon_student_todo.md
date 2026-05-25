# LINGAFON — Студент: что работает vs что мок

> Аудит после первой UI-итерации. Цель — превратить весь Student role из моков в реальный продукт.
>
> Зависимости: см. [lingafon_data_model.md](lingafon_data_model.md) (схема) и [app/shared/mock/](app/shared/mock/) (откуда сейчас берётся «данные»).

---

## Условные обозначения

- ✅ **РАБОТАЕТ** — реально функционирует на текущем коде
- 🟡 **UI-only** — экран рисует мок-данные, никакой логики за ним
- ❌ **СЛОМАНО** — кнопка/виджет не делает того, что обещает
- 🆕 **NEED** — то, что нужно построить (схема / API / composable / asset)

---

## 1. Авторизация и навигация

| Что | Статус | Заметки |
| --- | --- | --- |
| Login / Register / Logout через Supabase | ✅ | JWT-хук возвращает `user_role` |
| Role-guard (редирект на свою роль) | ✅ | Работает на 4 ролях |
| Sidebar + 11 пунктов | ✅ | UI |
| Avatar / profile | 🟡 | Берётся из `User.avatarUrl` (нет загрузки в lingafon) |

**NEED:** загрузка аватара (страница `/student/settings` пока пустая).

---

## 2. Главная — `/student/`

| Виджет | Статус |
| --- | --- |
| Прогноз медали месяца | 🟡 Берёт `currentMonthAverage` из мок-профиля. Реально должно агрегироваться из `Grade` за месяц |
| Streak золота | 🟡 Хардкод `goldStreak: 2` |
| Заработано всего | 🟡 Хардкод `totalEarnings: 18000` |
| Ближайший урок | 🟡 Из `MOCK_UPCOMING_LESSONS` |
| Word of the Day + кнопка Listen | 🟡 / ✅ Слово хардкод, но **озвучка реальная** через Web Speech API |
| Daily quests (3 шт) | ❌ Прогресс хардкод. Кнопки нет — невозможно «выполнить» |
| Daily streak (`12 🔥`) | ❌ Тоже хардкод |
| Список «Мои группы» / «Последние медали» / «Активная домашка» | 🟡 Все из моков |

**🆕 NEED:**
1. **Supabase-таблицы:** `Group`, `GroupMember`, `Lesson`, `Grade`, `MonthlyMedal`
2. **Server view/RPC** `student_dashboard_summary(studentId)` — одним запросом отдаёт всё для главной
3. **DailyQuest система:** таблица `DailyQuestProgress(studentId, questCode, date, progress)`, серверный квест-движок (как в femo), endpoint `/api/lingafon/quests/tick`
4. **Daily streak:** считать на основе `DailyQuestProgress` (был ли любой прогресс сегодня)
5. **Word of the Day:** таблица `WordOfTheDay(date, word, ipa, translation, example, funFact)` — админ заполняет, фронт берёт за сегодня

---

## 3. AI-тренажёр — `/student/practice` и `/student/practice/[deckId]`

| Что | Статус |
| --- | --- |
| Listen (TTS) — британский голос | ✅ Web Speech API |
| Repeat (микрофон + распознавание) | ✅ `webkitSpeechRecognition` в en-GB |
| Similarity score (Levenshtein) | ✅ Локально |
| Прогресс по карточкам внутри сессии | ✅ В памяти страницы |
| Финальный экран `+XP` | ❌ XP нигде не сохраняется |
| История попыток (для статистики, daily quest tick) | ❌ Не сохраняется |
| Колоды | 🟡 Хардкод в `pronunciation.ts` (3 колоды × 22 карточки) |

**🆕 NEED:**
1. Таблицы `PracticeDeck`, `PronunciationCard`, `PracticeAttempt` (см. data_model)
2. `POST /api/lingafon/practice/attempt` — сохраняет попытку + начисляет XP + двигает daily quest
3. Composable `useMockStudent` заменить на `usePracticeDecks()` с реальным `from('PracticeDeck')`
4. Сохранять «лучший score по карточке» для аналитики

---

## 4. Группы — `/student/groups` и `/student/groups/[id]`

| Что | Статус |
| --- | --- |
| Список моих групп | 🟡 Из `MOCK_GROUPS` |
| Карточка с педагогом, расписанием, числом учеников | 🟡 Полностью мок |
| Одногруппники | ❌ Хардкод имён (Айгерим / Данияр / Софья…) |
| Кнопка «Написать педагогу» → `/student/messenger` | 🟡 Открывает мессенджер, но не открывает чат именно с этим педагогом |

**🆕 NEED:**
1. `useGroups(studentId)` — `from('GroupMember').select('group:Group(*, teacher:Teacher(*, user:User(*)), branch:Branch(*))').eq('studentId', ...)`
2. На странице `[id]` отдельный запрос участников: `from('GroupMember').select('student:Student(*, user:User(*))')`
3. Кнопка «Написать» — параметр `?with=teacherUserId` в мессенджер

---

## 5. Расписание — `/student/schedule`

| Что | Статус |
| --- | --- |
| Список уроков по дням | 🟡 Из `MOCK_UPCOMING_LESSONS` (8 синтетических) |
| Бейджи «Сегодня», «Завтра» | ✅ Логика дат корректная |
| Кнопка «Подключиться» (online за 5-15 мин) | ❌ Кнопка есть — но никуда не ведёт. Нет lesson-room |

**🆕 NEED:**
1. `useLessons({ studentId, from, to })` — `from('Lesson').select('*, group:Group(*)').gte('startsAt', ...)`
2. **Lesson room для online**: либо порт `widgets/lesson-room` из femo (WebRTC), либо MVP через Google Meet / Zoom link, лежащий в `Lesson.meetingUrl`
3. Маркер «прошёл / отменён» при `Lesson.status`

---

## 6. Домашка — `/student/homework` и `/student/homework/[id]`

| Что | Статус |
| --- | --- |
| Список ДЗ (активные + выполненные) | 🟡 Из `MOCK_HOMEWORK_LIST` |
| Формат TEST (radio) | ✅ Локально считает баллы |
| Формат INPUT (поле ввода + acceptableAnswers) | ✅ Локально |
| Формат TEXT (textarea + word counter) | ✅ Локально |
| Формат ORAL (Listen + Repeat) | ✅ Распознавание реальное |
| Формат FILE / INTERACTIVE | ❌ Заглушка «в разработке» |
| Кнопка «Отправить на проверку» | ❌ Только показывает экран успеха. Никуда не сохраняется |
| Финальный балл / комментарий педагога | 🟡 Виден только в моках (CHECKED) |

**🆕 NEED:**
1. Таблицы `Homework`, `HomeworkSubmission` (см. data_model)
2. `useHomework()` — список + детальная по id
3. `POST /api/lingafon/homework/submit` — принимает answers / file / audio
4. Для ORAL: загрузка аудио в Supabase Storage → Whisper (порт `/api/ai/check-oral` из femo, адаптировать)
5. Для TEXT: AI-проверка через `/api/ai/chat` (грамматика, длина, тематичность)
6. Realtime-уведомление педагогу о новой submission
7. Возврат AI-score → ученику; teacherGrade ставит педагог
8. Дореализовать FILE (upload) и INTERACTIVE (drag-n-drop)

---

## 7. Журнал — `/student/grades`

| Что | Статус |
| --- | --- |
| Общий ср.балл, пятёрки, текущий месяц | 🟡 Из 10 хардкод-оценок |
| Группировка по месяцам с прогнозом медали | ✅ Логика корректная |

**🆕 NEED:**
1. `useGrades(studentId)` — `from('Grade').select('*, lesson:Lesson(topic, group:Group(name))').order('date', { ascending: false })`
2. Считать ср.балл реально по таблице

---

## 8. Материалы — `/student/materials`

| Что | Статус |
| --- | --- |
| Аудио карточки с псевдо-waveform | ❌ Кнопки play **ничего не воспроизводят** |
| Видеозаписи уроков | ❌ Кнопки play тоже не работают |
| PDF + ссылки | 🟡 Cambridge Dictionary линк работает, остальные `url: '#'` |
| Личный словарь | 🟡 5 мок-слов, кнопка «Тренировать» ведёт на `/student/practice` (общий деки, не словарь) |

**🆕 NEED:**
1. **Supabase Storage** bucket `lingafon-materials` (audio/video файлы) + bucket `lingafon-vocabulary-audio` (короткие записи слов)
2. Таблица `Material(lessonId?, kind, title, description, url, durationSec, tag)`
3. Реальный `<audio :src controls>` и `<video :src controls>` вместо псевдо-плееров
4. Альтернатива для аудио слов: Cambridge Dictionary API или [forvo.com](https://forvo.com) — бесплатные mp3 ссылки на каждое слово
5. Таблица `VocabularyEntry(studentId, word, ipa, translation, ...)` + ручка `POST /api/lingafon/vocabulary/add` (из практики, из материалов)
6. Колода «Мой словарь» в `/student/practice` — автоматическая из `VocabularyEntry`

---

## 9. Маркет Достижений — `/student/achievements`

| Что | Статус |
| --- | --- |
| Hero «заработано всего» | 🟡 Из `MOCK_STUDENT_PROFILE.totalEarnings` |
| Счётчики медалей (gold/silver/bronze) | 🟡 Из 6 мок-медалей |
| Streak progress (3/6/9 мес) | 🟡 Логика правильная, данные мок |
| История медалей | 🟡 Мок |

**🆕 NEED:**
1. Таблица `MonthlyMedal` + `Payout`
2. **Откуда берётся медаль:** педагог в конце месяца на странице `/teacher/monthly-grading/[groupId]` финализирует, триггер автоматом создаёт `MonthlyMedal` + `Payout` со статусом `PENDING`
3. **Откуда берутся деньги:** при `Payout.status = PAID` (после фактической выдачи админом — Kaspi или налом) — `Student.totalEarnings` инкрементируется. Делается через триггер `after_payout_paid()`
4. Streak считается из `MonthlyMedal` за последние N подряд месяцев с medal=GOLD
5. View `student_earnings_summary(studentId)` для hero-карточки

---

## 10. Сертификаты — `/student/certificates`

| Что | Статус |
| --- | --- |
| 3 мок-сертификата с градиентами | 🟡 |
| Кнопка «PDF» | ❌ Ничего не скачивает |

**🆕 NEED:**
1. Таблица `Certificate`
2. PDF-генерация на сервере: `GET /api/lingafon/certificate/[id]/pdf` через `pdf-lib` (как в femo)
3. Автогенерация при триггерах: завершён уровень, выиграл конкурс, 3 мес streak, итоги года

---

## 11. Мероприятия — `/student/events`

| Что | Статус |
| --- | --- |
| 4 мок-ивента (лагерь, Spring Vibes, Halloween, NY) | 🟡 |
| Кнопка «Записаться» / «Отменить» | ❌ Никуда не идёт |
| Статусы OPEN / REGISTERED | 🟡 Из мока |

**🆕 NEED:**
1. Таблицы `Event`, `EventParticipant`
2. `POST /api/lingafon/events/[id]/register` — создаёт `EventParticipant`, **если ивент платный — создаёт Payment**
3. `POST /api/lingafon/events/[id]/cancel`
4. Quota check (capacity)

---

## 12. Сообщения — `/student/messenger`

| Что | Статус |
| --- | --- |
| Список чатов | 🟡 3 фейковых (Айсауле, Жанель, Support) |
| Текст переписки | 🟡 Мок-сообщения |
| Кнопка «Отправить» | 🟡 Локально добавляет в `localMessages.value` — **не доходит ни до кого**. После refresh пропадает |
| Между ролями (ученик ↔ педагог ↔ админ) | ❌ Не реализовано |

**🆕 NEED:**
1. Таблицы `Conversation`, `Message` (см. data_model)
2. `useConversations(userId)` — `from('Conversation').select('*, participants:User(*)').contains('participantIds', [userId])`
3. `useMessages(conversationId)` — `from('Message').select('*')` + **Supabase Realtime subscribe** на INSERT
4. `POST /api/lingafon/messages/send` (или прямой insert через RLS)
5. **Cross-role:** педагог из своего `/teacher/messenger` шлёт ученику → Realtime доставка → запись в `Conversation`/`Message` видна обоим
6. Mark-as-read через update
7. Кнопка «Написать педагогу» с группы — `?with=<teacherUserId>` → `findOrCreateConversation`

---

## 13. Уведомления (колокольчик в navbar)

| Что | Статус |
| --- | --- |
| Дропдаун уведомлений | ✅ UI работает |
| Загрузка из `Notification` через `useNotifications` | ✅ Запрос идёт, но **таблицы `Notification` в lingafon-Supabase нет** → всегда пустой результат |
| Realtime новых уведомлений | ✅ Подписка установлена, но опять — таблицы нет |

**🆕 NEED:**
1. Таблица `Notification` (см. data_model)
2. Триггеры на ключевые события:
   - INSERT в `MonthlyMedal` → уведомление ученику «Тебе выставлена медаль!»
   - INSERT в `Payout` (status=PAID) → «Тебе выплачено N ₸»
   - INSERT в `HomeworkSubmission` (status=CHECKED) → «Педагог проверил твою домашку»
   - INSERT в `Message` (если получатель не в чате) → «Новое сообщение от X»
   - `Lesson` за час до старта → «Урок через 1 час» (через cron)
3. Realtime publication ALTER

---

## 14. Что нужно от АДМИНА чтобы запустить полноценный поток студента

| Действие админа | Где |
| --- | --- |
| Создать филиалы (3 шт + ONLINE) | `/admin/branches` |
| Создать педагогов | `/admin/teachers/new` |
| Создать группы и назначить туда учеников | `/admin/groups/new` |
| Создать уроки в группах (Lesson) | `/admin/groups/[id]/lessons/new` или auto-generation по расписанию |
| Заполнить материалы по урокам | `/admin/content/materials` |
| Заполнить Word of the Day | `/admin/content/word-of-day` |
| Создать мероприятия | `/admin/events/new` |
| Подтвердить оплату медалей | `/admin/finance/payouts` |

**Без всего этого ученик зайдёт в пустоту.** Поэтому Студент без Админа полностью оживить **нельзя** — но можно сделать seed-скрипт, который сразу засевает 1 группу, 1 педагога, 10 уроков, 1 ученика-демо.

---

## 15. Откуда берутся **деньги** и **XP** (явная карта)

### Деньги (тенге) — Маркет Достижений
**Только через педагога в конце месяца:**
1. Педагог открывает `/teacher/monthly-grading/[groupId]` 28-31 числа
2. Видит средний балл каждого ученика (рассчитан из `Grade`)
3. Подтверждает медаль (GOLD ≥4.6 / SILVER ≥4.0 / BRONZE ≥3.6 / NONE)
4. Триггер создаёт `MonthlyMedal` + `Payout(status='PENDING', amount=5000/3000/1000)`
5. Streak bonus: если `goldStreak`-после-этого-месяца кратен 3/6/9 → автоматический `Payout(amount=5000/10000/15000, kind='BONUS')`
6. Админ потом нажимает «Выплачено» на странице `/admin/finance/payouts` → `Payout.status = 'PAID'` → триггер инкрементирует `Student.totalEarnings`

**Никакая активность ученика напрямую не даёт деньги** — только средний балл за месяц от педагога.

### XP — не реальные деньги, gamification
Зарабатывается за активность:
| Действие | XP |
| --- | --- |
| Карточка в Practice ≥85% | +5 |
| Колода завершена ≥85% средняя | +50 |
| Daily quest выполнен | +20-40 |
| ДЗ отправлено вовремя | +50 |
| Урок посещён (PRESENT) | +40 |
| AI-сессия ≥10 мин | +30 |

Сейчас XP **нигде не сохраняется**. Нужно: таблица `XpLog(studentId, action, amount, refId, createdAt)` + ручка `tickXp()` + denormalized cache `Student.totalXp`. Используется только для отображения уровня в профиле и daily quest reward.

**XP в деньги НЕ конвертируется.** Это две разные мотивационные системы.

---

## 16. Краткий чек-лист «что СОВСЕМ не работает»

- [ ] Daily quests не двигаются (кнопок «выполнить» нет)
- [ ] Daily streak хардкод 12
- [ ] Word of the Day не меняется по дате
- [ ] Practice не начисляет XP и не пишется в БД
- [ ] Домашка submit ничего не отправляет
- [ ] Файлы/Аудио/Видео в Материалах не воспроизводятся
- [ ] PDF сертификата не скачивается
- [ ] Запись на ивент не работает
- [ ] Сообщения не уходят между пользователями
- [ ] Уведомления пустые (нет таблицы)
- [ ] Балансы (Earnings, MonthlyMedal) — всё хардкод

---

## 17. Рекомендуемый порядок «расхардкоживания»

В порядке от наибольшей бизнес-ценности к меньшей:

1. **Schema bootstrap** — миграция со всеми таблицами + RLS + seed демо-группы и педагога
2. **Practice attempts → XP** — потому что у нас уже есть рабочий тренажёр; быстрая победа
3. **Messenger** + Notifications через Realtime — критично для «живости» платформы
4. **Homework submit pipeline** — TEST/INPUT/TEXT/ORAL (FILE/INTERACTIVE позже)
5. **Groups + Lessons + Schedule** — для этого нужен MVP-админ (создать 1 группу из админки)
6. **Monthly medals + Payouts** — требует teacher monthly-grading
7. **Materials + Storage** — нужны реальные mp3/mp4 файлы (можно загрузить руками 3-5 шт)
8. **Events + EventParticipant** — последняя секция, мелкие фичи
9. **Certificates PDF** — финальная полировка

**Параллельно строим минимальный Admin** чтобы было кем создавать данные.

---

## 18. Что делаем ПРЯМО СЕЙЧАС (предложение)

**Шаг 1 — миграция:** написать `supabase/lingaphone/001_core_schema.sql` со всеми таблицами + RLS + сид одного демо-сценария (1 филиал, 1 группа, 1 педагог `teacher@linga.kz`, 1 ученик `student@linga.kz` как GroupMember, 10 уроков, 5 оценок, 1 MonthlyMedal). Запускается одной кнопкой в SQL Editor lingafon-Supabase.

**Шаг 2 — composable layer:** заменить `useMockStudent()` на 8 реальных composables (`useGroups`, `useLessons`, `useGrades`, и т.д.), которые читают из Supabase. Mock-папка остаётся как fallback / для типов, но импорты в страницах меняются.

**Шаг 3 — Practice → XP**: первый пример «обогащения» — `/api/lingafon/practice/attempt` сохраняет попытку и начисляет XP. Виджет XP в шапке начинает реально двигаться.

**Шаг 4 — Messenger + Realtime** — самая яркая «живая» фича.

Дальше по списку из секции 17.

---

*Документ от 2026-05-18. Каждый пункт со временем переезжает из 🟡/❌ в ✅.*
