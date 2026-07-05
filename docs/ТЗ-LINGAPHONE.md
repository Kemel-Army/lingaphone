Бизнес-логика и функциональные требования
2.1. Ролевая модель и регистрация
Регистрация Студента: При создании аккаунта пользователю присваивается роль STUDENT. В профиле в обязательном порядке фиксируется начальный уровень английского языка (например, выбранный вручную или по результатам вводного тестирования).

Преподаватель (TEACHER): Имеет доступ к специализированной панели (Dashboard), где отображаются только те группы, которые он ведет. Доступ к чужим группам или общему списку студентов платформы запрещен.

Администратор (ADMIN): Обладает полными правами: управление всеми пользователями, создание групп, привязка преподавателей к группам, загрузка учебных материалов (книг, модулей) и добавление новых мини-игр.

2.2. Модуль учебных материалов (Книги и Модули)
Формат хранения:

Сами файлы учебников (PDF-версии разделов/модулей) хранятся в бакете books в Supabase Storage.

Структура книги, метаданные и логическая привязка к уровням описываются в базе данных через Prisma (Book -> Module).

Дистрибуция контента: Студент получает доступ только к тем книгам и модулям, уровень которых строго соответствует текущему уровню английского языка в его профиле (User.level == Book.level).

2.3. Модуль адаптивных мини-игр и геймификации
Существующая база: В системе уже реализована механика начисления XP (очков опыта) и базовые интерфейсы игр.

Уровневое разделение: Механика самих мини-игр (компоненты фронтенда) остается универсальной, но контент (слова, фразы, правила, аудиофайлы) становится динамическим.

JSON-конфигурация: Каждая игра получает поле config типа Json.

Пример для игры "Сборка слова" (уровень A1): {"words": ["cat", "apple", "door"]}

Пример для игры "Сборка слова" (уровень B2): {"words": ["ambiguous", "redundant", "exaggerate"]}

Игры фильтруются на бэкенде под уровень студента или привязываются к конкретному изучаемому модулю книги.

3. Архитектура базы данных (Prisma Schema)
Фрагмент кода
enum Role {
  ADMIN
  TEACHER
  STUDENT
}

enum EnglishLevel {
  A1
  A2
  B1
  B2
  C1
  C2
}

model User {
  id           String        @id @default(uuid())
  email        String        @unique
  role         Role          @default(STUDENT)
  level        EnglishLevel? // Задается при создании аккаунта
  xp           Int           @default(0)   // Текущая геймификация

  // Связи для преподавателя
  managedGroups Group[]      @relation("TeacherGroups")

  // Связи для студента
  groupId      String?
  group        Group?        @relation("GroupStudents", fields: [groupId], references: [id], onDelete: SetNull)
  
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Group {
  id         String       @id @default(uuid())
  name       String
  level      EnglishLevel

  // Преподаватель группы
  teacherId  String
  teacher    User         @relation("TeacherGroups", fields: [teacherId], references: [id], onDelete: Restrict)
  
  // Список студентов в группе
  students   User[]       @relation("GroupStudents")
  
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt
}

model Book {
  id          String       @id @default(uuid())
  title       String
  level       EnglishLevel // Ограничение доступа по уровню
  coverUrl    String?      // Обложка книги в Supabase Storage
  modules     Module[]
  
  createdAt   DateTime     @default(now())
}

model Module {
  id          String       @id @default(uuid())
  title       String
  order       Int          // Порядок модуля в книге (1, 2, 3...)
  pdfUrl      String?      // Ссылка на файл модуля в Supabase Storage
  bookId      String
  book        Book         @relation(fields: [bookId], references: [id], onDelete: Cascade)
  games       Game[]       // Игры, закрепленные за конкретным модулем
  
  createdAt   DateTime     @default(now())
}

model Game {
  id          String       @id @default(uuid())
  slug        String       // Идентификатор механики игры (н-р: "drag-drop", "word-puzzle")
  title       String
  level       EnglishLevel // Уровень сложности контента
  config      Json         // Динамический контент (слова, задания, правильные ответы)
  
  moduleId    String?
  module      Module?      @relation(fields: [moduleId], references: [id], onDelete: SetNull)
  
  createdAt   DateTime     @default(now())
}
4. Архитектурная структура проекта по FSD (Nuxt 4)
Реализация должна строго следовать структуре папок Nuxt 4 и методологии Feature-Sliced Design.

Plaintext
app/
  entities/
    user/                  # Стейт пользователя, типы ролей и уровней
    group/                 # Компоненты карточки группы, хуки получения данных групп
    book/                  # Отображение книг и модулей (BookCard, ModuleList)
    game/                  # Враппер мини-игры, логика парсинга JSON-конфигов
  features/
    auth-set-level/        # Фича выбора уровня при регистрации
    view-teacher-groups/   # Логика фильтрации и отображения групп для преподавателя
    play-level-game/       # Контроллер прохождения игры с отправкой результатов (XP)
  pages/
    student/
      dashboard.vue        # Главная студента: его книги, текущий прогресс
      game-[slug].vue      # Страница конкретной игры с динамической загрузкой уровня
    teacher/
      dashboard.vue        # Панель учителя (список только его групп)
  server/
    api/
      auth/                # Обработка хуков сессии и синхронизация ролей
      teacher/
        groups.get.ts      # Получение групп авторизованного преподавателя
      books/
        index.get.ts       # Получение книг под уровень текущего студента
      games/
        [id].get.ts        # Получение конфигурации конкретной игры
        progress.post.ts   # Эндпоинт для начисления XP за прохождение таска
5. Требования к API Эндпоинтам (Nitro)
5.1. GET /api/teacher/groups
Доступ: Только TEACHER и ADMIN.

Логика: Сервер валидирует сессию пользователя через Supabase Auth. Если роль пользователя TEACHER, выполняется запрос к Prisma:

TypeScript
const groups = await prisma.group.findMany({
  where: { teacherId: currentUser.id },
  include: { students: true }
})
5.2. GET /api/books
Доступ: Авторизованные пользователи.

Логика: Возвращает массив книг. Если запрос делает студент, то применяется автоматический фильтр по его текущему уровню:

TypeScript
where: { level: currentUser.level }
5.3. GET /api/games?moduleId={id}
Доступ: Авторизованные пользователи.

Логика: Возвращает список доступных игр для конкретного модуля или уровня, включая поле config. Данные из config напрямую прокидываются во фронтенд-компонент игры.

6. Критерии приемки (Acceptance Criteria)
Безопасность данных групп: Преподаватель А при попытке выполнить запрос или перейти на страницу группы Преподавателя Б получает ошибку 403 Forbidden.

Изоляция контента по уровням: Студент с уровнем A1 в интерфейсе видит исключительно книги уровня A1. Доступ к материалам более высоких уровней заблокирован (если иное не разрешено администратором).

Универсальность мини-игр: При добавлении новой книги/модуля администратор может через админ-панель (или напрямую в БД) связать игру drag-drop с новым JSON-конфигом, и она корректно отрендерится у студента без необходимости переписывать фронтенд-код самой игры.

Сохранение прогресса: По окончании игры набранные очки (XP) успешно отправляются на бэкенд, обновляют поле User.xp и корректно отображаются в текущем виджете геймификации.
