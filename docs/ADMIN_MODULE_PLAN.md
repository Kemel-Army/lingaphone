# Admin Module — Implementation Plan

> Дата: 2026-06-05  
> Статус: В работе

---

## Что уже есть

| Файл | Состояние |
|------|-----------|
| `pages/admin/index.vue` | Есть — KPI cards + XP chart |
| `pages/admin/students/index.vue` | Есть — таблица + create modal (базовый) |
| `pages/admin/students/[id].vue` | Есть |
| `pages/admin/teachers/index.vue` | Есть — только просмотр |
| `pages/admin/groups/index.vue` | Есть — базовая таблица |
| `pages/admin/finance/index.vue` | Есть |
| `entities/admin-stats/` | Есть — KPI, студенты, учителя, группы, медали, выплаты |
| `server/api/admin/students.post.ts` | Есть |
| `server/api/admin/students/[id].patch.ts` | Есть |

---

## Что нужно построить

### 1. Sidebar — добавить пункты
- `Тестирование` → `/admin/testing`
- `Расписание` → `/admin/schedule`
- `Настройки` → `/admin/settings`

### 2. Dashboard (`/admin/index.vue`) — расширение
- [ ] Bar Chart: загруженность по дням недели (кол-во уроков)
- [ ] Line Chart: средний % выполнения ДЗ и тестов за 4 недели
- [ ] Pie Chart: топ-5 товаров маркета по покупкам XP

### 3. Students (`/admin/students/index.vue`) — улучшения
- [ ] Серверная пагинация (20 записей, `.range(from, to)`)
- [ ] Умный казахский поиск (К↔Қ, О↔Ө, У↔Ү/Ұ, А↔Ә, И/Ы↔І, Н↔Ң) через `useAdminStats`
- [ ] CSV-экспорт всех данных
- [ ] PDF-режим "Печать доступов" (ФИО + Логин + Пароль через jsPDF)
- [ ] Edit modal (редактирование профиля + смена пароля + статус Активен/Заморожен)

### 4. Teachers (`/admin/teachers/index.vue`) — улучшения
- [ ] Create teacher modal (ФИО, email, пароль + опыт, специализация, ставка/категория)
- [ ] Edit teacher modal
- [ ] `POST /api/admin/teachers` server route
- [ ] `PATCH /api/admin/teachers/[id]` server route

### 5. Groups (`/admin/groups/index.vue`) — полный рефакторинг
- [ ] Карточная сетка (UCard grid) вместо таблицы
- [ ] Индикатор загруженности (8/12 учеников + progress bar)
- [ ] Create group modal (название, уровень, учитель dropdown, ученики multiselect)
- [ ] Кнопка "Подробнее" → `/admin/groups/[id]`

### 6. Groups Detail (`/admin/groups/[id].vue`) — новая страница
- [ ] Полный список учеников группы
- [ ] История посещаемости
- [ ] Успеваемость (средний балл)
- [ ] Текущий модуль/тема

### 7. Testing (`/admin/testing/index.vue`) — новая страница
- [ ] Сводная таблица групп со средним % успеваемости
- [ ] Цветовая индикация: green (85-100%), amber (65-84%), red (0-64%)
- [ ] Фильтр по уровню (A1-F4) и по преподавателю
- [ ] Drill-down: список тестов группы + список провалившихся/пропустивших

### 8. Schedule (`/admin/schedule/index.vue`) — новая страница
- [ ] Глобальный таймлайн всех учителей
- [ ] Фильтр: По преподавателям / По группам
- [ ] Клик по уроку → UModal с темой, посещаемостью, ссылкой, кнопками отмены/переноса

### 9. Settings (`/admin/settings/index.vue`) — новая страница
- [ ] Форма редактирования профиля (ФИО, аватар, телефон, email)
- [ ] Блок смены пароля (текущий → новый → подтверждение)

---

## Технические детали

### Казахский умный поиск
```typescript
// Маппинг казахских специфичных букв к базовым
const KZ_MAP: Record<string, string[]> = {
  'к': ['қ', 'к'], 'о': ['ө', 'о'], 'у': ['ү', 'ұ', 'у'],
  'а': ['ә', 'а'], 'и': ['і', 'и'], 'ы': ['і', 'ы'], 'н': ['ң', 'н']
}
// На фронте: normalize search term перед фильтрацией
```

### Server-side pagination
```typescript
const { data, count } = await supabase
  .from('Student')
  .select('...', { count: 'exact' })
  .range(page * 20, (page + 1) * 20 - 1)
```

### PDF credentials (jsPDF)
```typescript
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
// Таблица: Фамилия Имя | Логин (email) | Пароль (из create response)
```

---

## Порядок реализации

1. ✅ Plan file (этот документ)
2. → Sidebar обновление
3. → Groups page overhaul + detail page
4. → Teachers enhancements + server routes
5. → Testing page
6. → Schedule page
7. → Settings page
8. → Students enhancements (pagination + export + edit)
9. → Dashboard chart additions
