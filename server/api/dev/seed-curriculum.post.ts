import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * POST /api/dev/seed-curriculum
 *
 * Populates the curriculum tree for Математика 1–6 класс:
 *   · PathTopic   — thematic sections (e.g. "Смысл умножения")
 *   · PathLesson  — capsule-level entries inside a topic (metadata only;
 *                   CapsuleLayer content is authored separately)
 *
 * Idempotent. Re-running wipes existing PathTopic/PathLesson for the
 * grade-bound subjects and re-inserts from scratch. Primary demo capsule
 * (2 класс → Смысл умножения → Что такое умножение) is tagged with
 * difficulty=STANDARD and gets a noticeable xpReward so demo builds
 * can seed layer content against it by lesson title.
 */

type TopicSeed = {
  name: string
  description: string
  icon: string
  color: string
  durationMinutes: number
  totalXp: number
  lessons: LessonSeed[]
}

type LessonSeed = {
  title: string
  subtitle?: string
  durationMinutes?: number
  xpReward?: number
  masteryThreshold?: number
  difficulty?: 'LIGHT' | 'STANDARD' | 'DEEP'
}

// ────────────────────────────────────────────────────────────────────
// КТП 1 класс · Первые числа
// ────────────────────────────────────────────────────────────────────
const GRADE_1: TopicSeed[] = [
  {
    name: 'Числа от 1 до 10',
    description: 'Учимся считать, писать и сравнивать первые числа',
    icon: 'i-lucide-hash',
    color: 'sky',
    durationMinutes: 80,
    totalXp: 300,
    lessons: [
      { title: 'Счёт до 10', subtitle: 'Пальцы, предметы, картинки' },
      { title: 'Сравнение чисел', subtitle: 'Больше, меньше, равно' },
      { title: 'Порядок чисел', subtitle: 'Какое число стоит до и после' }
    ]
  },
  {
    name: 'Состав числа',
    description: 'Разбираем, из каких частей складывается число',
    icon: 'i-lucide-split-square-vertical',
    color: 'violet',
    durationMinutes: 90,
    totalXp: 320,
    lessons: [
      { title: 'Состав числа 5', subtitle: 'Сколькими способами получить 5' },
      { title: 'Состав числа 10', subtitle: 'Главная пятёрка первого класса' },
      { title: 'Домики чисел', subtitle: 'Игра с парами слагаемых' }
    ]
  },
  {
    name: 'Сложение в пределах 10',
    description: 'Складываем без перехода через десяток',
    icon: 'i-lucide-plus-circle',
    color: 'green',
    durationMinutes: 100,
    totalXp: 360,
    lessons: [
      { title: 'Знак плюс и смысл сложения' },
      { title: 'Сложение по рисунку' },
      { title: 'Задачи на сложение' }
    ]
  },
  {
    name: 'Вычитание в пределах 10',
    description: 'Учимся забирать и находить разницу',
    icon: 'i-lucide-minus-circle',
    color: 'orange',
    durationMinutes: 100,
    totalXp: 360,
    lessons: [
      { title: 'Знак минус и смысл вычитания' },
      { title: 'Связь сложения и вычитания' },
      { title: 'Задачи на вычитание' }
    ]
  },
  {
    name: 'Числа от 11 до 20',
    description: 'Переходим через десяток',
    icon: 'i-lucide-binary',
    color: 'sky',
    durationMinutes: 90,
    totalXp: 320,
    lessons: [
      { title: 'Десяток и единицы' },
      { title: 'Чтение и запись чисел до 20' }
    ]
  },
  {
    name: 'Сложение и вычитание до 20',
    description: 'С переходом через десяток',
    icon: 'i-lucide-calculator',
    color: 'emerald',
    durationMinutes: 110,
    totalXp: 400,
    lessons: [
      { title: 'Сложение с переходом через 10' },
      { title: 'Вычитание с переходом через 10' }
    ]
  },
  {
    name: 'Геометрические фигуры',
    description: 'Круг, квадрат, треугольник, прямоугольник',
    icon: 'i-lucide-shapes',
    color: 'violet',
    durationMinutes: 70,
    totalXp: 250,
    lessons: [
      { title: 'Плоские фигуры' },
      { title: 'Точка, отрезок, луч' }
    ]
  },
  {
    name: 'Измерения',
    description: 'Сантиметры, килограммы, литры, минуты',
    icon: 'i-lucide-ruler',
    color: 'cyan',
    durationMinutes: 80,
    totalXp: 280,
    lessons: [
      { title: 'Длина в сантиметрах' },
      { title: 'Масса, объём, время — первые шаги' }
    ]
  }
]

// ────────────────────────────────────────────────────────────────────
// 2 класс · полный годовой курс по КТП «Атамура»
// ────────────────────────────────────────────────────────────────────
const GRADE_2: TopicSeed[] = [
  {
    name: 'Двузначные числа',
    description: 'Десятки, единицы, разряды и сравнение',
    icon: 'i-lucide-hash',
    color: 'sky',
    durationMinutes: 90,
    totalXp: 330,
    lessons: [
      { title: 'Образование двузначных чисел и счёт десятками', subtitle: 'Десяток как новая единица счёта' },
      { title: 'Чтение, запись и сравнение двузначных', subtitle: 'Кто больше: 47 или 74?' },
      { title: 'Разрядный состав и графические модели', subtitle: 'Разбираем число на десятки и единицы' }
    ]
  },
  {
    name: 'Сложение и вычитание в пределах 100',
    description: 'Устные приёмы — без перехода и с переходом через десяток',
    icon: 'i-lucide-plus-square',
    color: 'green',
    durationMinutes: 130,
    totalXp: 480,
    lessons: [
      { title: 'Выражения со скобками и без них', subtitle: 'Где сначала, где потом' },
      { title: 'Сложение и вычитание без перехода через разряд', subtitle: '40 + 17, 57 − 23, 35 ± 12' },
      { title: 'Сложение однозначных с переходом через десяток', subtitle: 'Опираемся на 10' },
      { title: 'Сложение и вычитание двузначных с переходом', subtitle: '45 ± 9, 40 − 14' }
    ]
  },
  {
    name: 'Решение простых задач',
    description: 'Моделирование и схемы. Один и тот же сюжет — разные вопросы',
    icon: 'i-lucide-clipboard-list',
    color: 'amber',
    durationMinutes: 90,
    totalXp: 330,
    lessons: [
      { title: 'Задачи на нахождение суммы и остатка', subtitle: 'Сколько было — сколько стало' },
      { title: 'Задачи на увеличение и уменьшение на несколько единиц', subtitle: 'Стало больше или меньше на ...' },
      { title: 'Задачи на разностное сравнение', subtitle: 'На сколько больше / меньше' }
    ]
  },
  {
    name: 'Величины и их измерение',
    description: 'Длина, масса, объём — измеряем мир',
    icon: 'i-lucide-ruler',
    color: 'cyan',
    durationMinutes: 90,
    totalXp: 330,
    lessons: [
      { title: 'Длина: сантиметр, дециметр, метр', subtitle: 'Измеряем рулеткой и линейкой' },
      { title: 'Масса: килограмм, центнер', subtitle: 'Чашечные весы и гири' },
      { title: 'Объём: литр', subtitle: 'Сколько помещается в сосуд' }
    ]
  },
  {
    name: 'Письменное сложение и вычитание',
    description: 'В столбик: красиво и без ошибок',
    icon: 'i-lucide-columns-3',
    color: 'green',
    durationMinutes: 100,
    totalXp: 360,
    lessons: [
      { title: 'Сложение в столбик без перехода через разряд', subtitle: 'Единицы под единицами, десятки под десятками' },
      { title: 'Сложение в столбик с переходом через разряд', subtitle: 'Запоминаем десяток сверху' },
      { title: 'Вычитание в столбик с переходом через разряд', subtitle: 'Занимаем десяток' }
    ]
  },
  {
    name: 'Сотни. Числа до 1000',
    description: 'Сотня — новая единица счёта',
    icon: 'i-lucide-hash',
    color: 'violet',
    durationMinutes: 70,
    totalXp: 260,
    lessons: [
      { title: 'Счёт сотнями. Круглые сотни до 1000', subtitle: '100, 200, 300 ...' },
      { title: 'Сложение и вычитание круглых сотен', subtitle: '300 + 200, 700 − 400' }
    ]
  },
  {
    name: 'Составные задачи',
    description: 'Задача в два действия — делим на шаги',
    icon: 'i-lucide-layers-2',
    color: 'orange',
    durationMinutes: 90,
    totalXp: 330,
    lessons: [
      { title: 'Что такое составная задача', subtitle: 'Промежуточный вопрос' },
      { title: 'Решение составных задач в два действия', subtitle: 'План решения' },
      { title: 'Преобразование простой задачи в составную', subtitle: 'Добавляем второй шаг' }
    ]
  },
  {
    name: 'Время и римская нумерация',
    description: 'Часы, минуты и таинственные римские цифры',
    icon: 'i-lucide-clock',
    color: 'cyan',
    durationMinutes: 90,
    totalXp: 330,
    lessons: [
      { title: 'Римская нумерация чисел до 12', subtitle: 'I, V, X — буквы вместо цифр' },
      { title: 'Часы и минуты. Определение времени по циферблату', subtitle: 'Часовая и минутная стрелки' },
      { title: 'Единицы времени и их преобразование', subtitle: 'Сутки, месяц, год' }
    ]
  },
  {
    name: 'Множества и их элементы',
    description: 'Знаки ∈ и ∉, объединение и пересечение',
    icon: 'i-lucide-circle-dot',
    color: 'indigo',
    durationMinutes: 120,
    totalXp: 440,
    lessons: [
      { title: 'Множество и его элементы. Знаки ∈ и ∉', subtitle: 'Что входит, а что нет' },
      { title: 'Объединение и пересечение множеств', subtitle: 'Знаки ∪ и ∩' },
      { title: 'Истинные и ложные высказывания', subtitle: 'Правда или неправда' },
      { title: 'Комбинации «по три»', subtitle: 'Сколько разных вариантов' }
    ]
  },
  {
    name: 'Углы и многоугольники',
    description: 'Прямой, острый, тупой. Прямоугольник, квадрат, треугольник',
    icon: 'i-lucide-triangle',
    color: 'rose',
    durationMinutes: 90,
    totalXp: 330,
    lessons: [
      { title: 'Виды углов: прямой, острый, тупой', subtitle: 'Учимся узнавать угол на глаз' },
      { title: 'Классификация многоугольников', subtitle: 'По числу сторон и углов' },
      { title: 'Построение геометрических фигур и прямого угол', subtitle: 'Угольник и точечная бумага' }
    ]
  },
  {
    name: 'Смысл умножения',
    description: 'Умножение как повторяющееся сложение',
    icon: 'i-lucide-x-square',
    color: 'amber',
    durationMinutes: 150,
    totalXp: 600,
    lessons: [
      {
        title: 'Что такое умножение',
        subtitle: 'Массивы, группы, повторяющееся сложение',
        durationMinutes: 30,
        xpReward: 200,
        masteryThreshold: 80,
        difficulty: 'STANDARD'
      },
      { title: 'Переместительный закон умножения', subtitle: '3·4 = 4·3 и почему', xpReward: 150 },
      { title: 'Умножение на 1 и на 0', subtitle: 'Особые случаи', xpReward: 130 },
      { title: 'Первые задачи на умножение', subtitle: 'Коробки, ряды, цена × количество', xpReward: 120 }
    ]
  },
  {
    name: 'Смысл деления',
    description: 'Деление как разбиение на равные части',
    icon: 'i-lucide-divide',
    color: 'violet',
    durationMinutes: 145,
    totalXp: 530,
    lessons: [
      { title: 'Что такое деление', subtitle: 'Делим поровну' },
      { title: 'Компоненты действия деления', subtitle: 'Делимое, делитель, частное' },
      { title: 'Связь умножения и деления', subtitle: 'Взаимообратные действия' },
      { title: 'Деление на 1 и само на себя', subtitle: 'Особые случаи: a÷1=a, a÷a=1' }
    ]
  },
  {
    name: 'Таблица умножения на 2, 3, 4, 5',
    description: 'Учим базовые строки таблицы',
    icon: 'i-lucide-grid-3x3',
    color: 'emerald',
    durationMinutes: 160,
    totalXp: 560,
    lessons: [
      { title: 'Умножение на 2', subtitle: 'Парами' },
      { title: 'Умножение на 3', subtitle: 'Тройками' },
      { title: 'Умножение на 4', subtitle: 'Четвёрками' },
      { title: 'Умножение на 5', subtitle: 'Пятёрками — самые лёгкие' }
    ]
  },
  {
    name: 'Деньги. Монеты и купюры',
    description: 'Считаем тенге: 50, 100, 200, 500',
    icon: 'i-lucide-coins',
    color: 'yellow',
    durationMinutes: 30,
    totalXp: 120,
    lessons: [
      { title: 'Монеты и купюры. Покупки и сдача', subtitle: 'Сколько заплатить и сколько получить' }
    ]
  },
  {
    name: 'Числовые и буквенные выражения',
    description: 'Алгебра с буквами вместо чисел',
    icon: 'i-lucide-variable',
    color: 'teal',
    durationMinutes: 90,
    totalXp: 330,
    lessons: [
      { title: 'Числовые выражения и порядок действий', subtitle: 'Что считаем сначала' },
      { title: 'Буквенные выражения', subtitle: 'a + b — что это значит' },
      { title: 'Свойства сложения и умножения', subtitle: 'a + b = b + a, a · b = b · a' }
    ]
  },
  {
    name: 'Уравнения и неравенства',
    description: 'Находим неизвестное число',
    icon: 'i-lucide-equal',
    color: 'sky',
    durationMinutes: 90,
    totalXp: 330,
    lessons: [
      { title: 'Простейшие уравнения', subtitle: 'x + 5 = 12' },
      { title: 'Неравенства x < и x >', subtitle: 'Подходящие числа' },
      { title: 'Уравнения сложной структуры', subtitle: 'x + (25 − 6) = 38' }
    ]
  },
  {
    name: 'Задачи на умножение и деление',
    description: 'В несколько раз больше, в несколько раз меньше',
    icon: 'i-lucide-scaling',
    color: 'orange',
    durationMinutes: 165,
    totalXp: 610,
    lessons: [
      { title: 'Задачи на нахождение неизвестных компонентов', subtitle: 'Найди множитель или делитель' },
      { title: 'Задачи на увеличение и уменьшение в несколько раз', subtitle: 'В 3 раза больше / в 4 раза меньше' },
      { title: 'Задачи на кратное сравнение', subtitle: 'Во сколько раз больше' },
      { title: 'Задачи с косвенным вопросом', subtitle: 'Внимание к формулировке' },
      { title: 'Цена, количество, стоимость', subtitle: 'Цена × количество = стоимость' }
    ]
  },
  {
    name: 'Рациональные способы вычислений',
    description: 'Считаем умно — экономим время',
    icon: 'i-lucide-zap',
    color: 'lime',
    durationMinutes: 90,
    totalXp: 330,
    lessons: [
      { title: 'Сравнение числовых выражений', subtitle: 'Без полного вычисления' },
      { title: 'Сравнение буквенных выражений', subtitle: 'Тот же смысл — другая запись' },
      { title: 'Применение свойств для рационализации', subtitle: 'Группируем удобно' }
    ]
  },
  {
    name: 'Периметр',
    description: 'Длина границы фигуры',
    icon: 'i-lucide-square',
    color: 'rose',
    durationMinutes: 90,
    totalXp: 330,
    lessons: [
      { title: 'Что такое периметр', subtitle: 'Обходим фигуру по сторонам' },
      { title: 'Формулы периметра прямоугольника, квадрата и треугольника', subtitle: 'P = 2(a+b), P = 4a, P = a+b+c' },
      { title: 'Построение фигур по заданному периметру', subtitle: 'Обратная задача' }
    ]
  },
  {
    name: 'Геометрические построения и логика',
    description: 'Точки, отрезки, головоломки',
    icon: 'i-lucide-shapes',
    color: 'fuchsia',
    durationMinutes: 90,
    totalXp: 330,
    lessons: [
      { title: 'Обозначение фигур латинскими буквами', subtitle: 'Точка A, отрезок BC' },
      { title: 'Деление и составление композиций фигур', subtitle: 'Танграм и пазл' },
      { title: 'Логические задачи и головоломки', subtitle: 'Переливания и взвешивания' }
    ]
  }
]

// ────────────────────────────────────────────────────────────────────
// КТП 3 класс · Таблица и доли
// ────────────────────────────────────────────────────────────────────
const GRADE_3: TopicSeed[] = [
  {
    name: 'Полная таблица умножения',
    description: 'Все 10×10 клеток — от 6 до 9 включительно',
    icon: 'i-lucide-grid-3x3',
    color: 'emerald',
    durationMinutes: 180,
    totalXp: 640,
    lessons: [
      { title: 'Умножение на 6 и 7' },
      { title: 'Умножение на 8 и 9' },
      { title: 'Квадраты чисел' },
      { title: 'Скорость счёта — тренажёр' }
    ]
  },
  {
    name: 'Внетабличное умножение и деление',
    description: 'Двузначное × однозначное',
    icon: 'i-lucide-calculator',
    color: 'green',
    durationMinutes: 150,
    totalXp: 530,
    lessons: [
      { title: 'Умножение двузначного на однозначное' },
      { title: 'Деление двузначного на однозначное' },
      { title: 'Деление с остатком' }
    ]
  },
  {
    name: 'Порядок действий',
    description: 'Скобки, умножение, сложение — что раньше',
    icon: 'i-lucide-list-ordered',
    color: 'orange',
    durationMinutes: 80,
    totalXp: 290,
    lessons: [
      { title: 'Приоритет действий' },
      { title: 'Скобки и сложные выражения' }
    ]
  },
  {
    name: 'Доли и введение дробей',
    description: 'Части целого — первый контакт',
    icon: 'i-lucide-pie-chart',
    color: 'violet',
    durationMinutes: 120,
    totalXp: 430,
    lessons: [
      { title: 'Что такое доля' },
      { title: 'Сравнение долей' },
      { title: 'Первые дроби на картинке' }
    ]
  },
  {
    name: 'Числа до 1000',
    description: 'Сотни, десятки, единицы',
    icon: 'i-lucide-hash',
    color: 'sky',
    durationMinutes: 110,
    totalXp: 390,
    lessons: [
      { title: 'Разряды числа' },
      { title: 'Сложение и вычитание до 1000' }
    ]
  },
  {
    name: 'Площадь прямоугольника',
    description: 'Считаем содержимое фигуры в квадратах',
    icon: 'i-lucide-square-stack',
    color: 'amber',
    durationMinutes: 90,
    totalXp: 320,
    lessons: [
      { title: 'Единицы площади' },
      { title: 'Формула площади' },
      { title: 'Задачи на площадь' }
    ]
  },
  {
    name: 'Задачи на движение',
    description: 'Скорость, время, расстояние',
    icon: 'i-lucide-car-front',
    color: 'rose',
    durationMinutes: 100,
    totalXp: 360,
    lessons: [
      { title: 'Что такое скорость' },
      { title: 'Формула пути' }
    ]
  },
  {
    name: 'Единицы длины и массы',
    description: 'Миллиметры, метры, граммы, килограммы',
    icon: 'i-lucide-ruler',
    color: 'cyan',
    durationMinutes: 70,
    totalXp: 250,
    lessons: [
      { title: 'От миллиметра до километра' },
      { title: 'От грамма до тонны' }
    ]
  }
]

// ────────────────────────────────────────────────────────────────────
// КТП 4 класс · Большие числа
// ────────────────────────────────────────────────────────────────────
const GRADE_4: TopicSeed[] = [
  {
    name: 'Многозначные числа',
    description: 'Миллионы, миллиарды, классы чисел',
    icon: 'i-lucide-hash',
    color: 'sky',
    durationMinutes: 120,
    totalXp: 430,
    lessons: [
      { title: 'Классы и разряды' },
      { title: 'Чтение и запись миллионов' },
      { title: 'Сравнение больших чисел' }
    ]
  },
  {
    name: 'Сложение и вычитание многозначных',
    description: 'В столбик и в уме',
    icon: 'i-lucide-plus-minus',
    color: 'green',
    durationMinutes: 110,
    totalXp: 390,
    lessons: [
      { title: 'Сложение столбиком' },
      { title: 'Вычитание столбиком' }
    ]
  },
  {
    name: 'Умножение многозначных',
    description: 'В столбик на двузначное и трёхзначное',
    icon: 'i-lucide-x-square',
    color: 'emerald',
    durationMinutes: 150,
    totalXp: 530,
    lessons: [
      { title: 'Умножение на однозначное' },
      { title: 'Умножение на двузначное' },
      { title: 'Умножение на трёхзначное' }
    ]
  },
  {
    name: 'Деление многозначных',
    description: 'В столбик и с остатком',
    icon: 'i-lucide-divide',
    color: 'violet',
    durationMinutes: 160,
    totalXp: 570,
    lessons: [
      { title: 'Деление на однозначное' },
      { title: 'Деление на двузначное' },
      { title: 'Деление с остатком — большие числа' }
    ]
  },
  {
    name: 'Обыкновенные дроби',
    description: 'Введение: части целого',
    icon: 'i-lucide-pie-chart',
    color: 'pink',
    durationMinutes: 130,
    totalXp: 470,
    lessons: [
      { title: 'Что такое дробь' },
      { title: 'Правильные и неправильные дроби' },
      { title: 'Сравнение дробей с одинаковыми знаменателями' }
    ]
  },
  {
    name: 'Задачи на движение, работу, стоимость',
    description: 'Три класса текстовых задач',
    icon: 'i-lucide-car-front',
    color: 'orange',
    durationMinutes: 140,
    totalXp: 500,
    lessons: [
      { title: 'Задачи на движение' },
      { title: 'Задачи на работу' },
      { title: 'Задачи на стоимость' }
    ]
  },
  {
    name: 'Углы и многоугольники',
    description: 'Виды углов, сумма углов треугольника',
    icon: 'i-lucide-triangle',
    color: 'amber',
    durationMinutes: 90,
    totalXp: 320,
    lessons: [
      { title: 'Виды углов' },
      { title: 'Треугольники и четырёхугольники' }
    ]
  },
  {
    name: 'Круг и окружность',
    description: 'Центр, радиус, диаметр',
    icon: 'i-lucide-circle',
    color: 'cyan',
    durationMinutes: 70,
    totalXp: 250,
    lessons: [
      { title: 'Круг и окружность — разница' },
      { title: 'Радиус и диаметр' }
    ]
  }
]

// ────────────────────────────────────────────────────────────────────
// КТП 5 класс · Числа и формы
// ────────────────────────────────────────────────────────────────────
const GRADE_5: TopicSeed[] = [
  {
    name: 'Натуральные числа и нуль',
    description: 'Учимся работать с большими числами',
    icon: 'i-lucide-hash',
    color: 'sky',
    durationMinutes: 90,
    totalXp: 320,
    lessons: [
      { title: 'Натуральный ряд' },
      { title: 'Ноль и его свойства' },
      { title: 'Сравнение натуральных чисел' }
    ]
  },
  {
    name: 'Сложение и вычитание натуральных чисел',
    description: 'Свойства и приёмы',
    icon: 'i-lucide-plus-minus',
    color: 'green',
    durationMinutes: 100,
    totalXp: 360,
    lessons: [
      { title: 'Свойства сложения' },
      { title: 'Вычитание и его свойства' },
      { title: 'Буквенные выражения' }
    ]
  },
  {
    name: 'Умножение и деление натуральных чисел',
    description: 'Приёмы и свойства',
    icon: 'i-lucide-x-square',
    color: 'emerald',
    durationMinutes: 120,
    totalXp: 430,
    lessons: [
      { title: 'Умножение столбиком' },
      { title: 'Деление столбиком' },
      { title: 'Деление с остатком' },
      { title: 'Распределительный закон' }
    ]
  },
  {
    name: 'Площади и объёмы',
    description: 'Измеряем пространство',
    icon: 'i-lucide-box',
    color: 'amber',
    durationMinutes: 90,
    totalXp: 320,
    lessons: [
      { title: 'Единицы площади' },
      { title: 'Площадь прямоугольника' },
      { title: 'Объём параллелепипеда' }
    ]
  },
  {
    name: 'Обыкновенные дроби',
    description: 'Делим целое на равные части',
    icon: 'i-lucide-pie-chart',
    color: 'pink',
    durationMinutes: 155,
    totalXp: 560,
    lessons: [
      { title: 'Что такое дробь' },
      { title: 'Правильные и неправильные дроби' },
      { title: 'Сложение и вычитание дробей с одинаковыми знаменателями' },
      { title: 'Сложение и вычитание смешанных чисел' },
      { title: 'Нахождение дроби от числа' }
    ]
  },
  {
    name: 'Десятичные дроби',
    description: 'Новый способ записи дробей',
    icon: 'i-lucide-percent',
    color: 'violet',
    durationMinutes: 120,
    totalXp: 430,
    lessons: [
      { title: 'Что такое десятичная дробь' },
      { title: 'Сравнение десятичных дробей' },
      { title: 'Сложение и вычитание десятичных дробей' },
      { title: 'Округление' }
    ]
  },
  {
    name: 'Умножение и деление десятичных дробей',
    description: 'Работаем с десятичными дробями',
    icon: 'i-lucide-divide',
    color: 'emerald',
    durationMinutes: 130,
    totalXp: 470,
    lessons: [
      { title: 'Умножение десятичной дроби на натуральное число' },
      { title: 'Умножение десятичных дробей' },
      { title: 'Деление десятичных дробей' }
    ]
  },
  {
    name: 'Проценты',
    description: 'Скидки, налоги и всё, что вокруг',
    icon: 'i-lucide-percent',
    color: 'orange',
    durationMinutes: 80,
    totalXp: 290,
    lessons: [
      { title: 'Что такое процент' },
      { title: 'Нахождение процента от числа' },
      { title: 'Нахождение числа по его проценту' }
    ]
  },
  {
    name: 'Итоговое повторение',
    description: 'Готовимся к переходу в 6 класс',
    icon: 'i-lucide-refresh-cw',
    color: 'cyan',
    durationMinutes: 80,
    totalXp: 290,
    lessons: [
      { title: 'Повторение числовых действий' },
      { title: 'Повторение дробей и процентов' }
    ]
  }
]

// ────────────────────────────────────────────────────────────────────
// КТП 6 класс · Рациональный мир
// ────────────────────────────────────────────────────────────────────
const GRADE_6: TopicSeed[] = [
  {
    name: 'Делимость чисел',
    description: 'НОД, НОК, признаки делимости',
    icon: 'i-lucide-scissors',
    color: 'violet',
    durationMinutes: 110,
    totalXp: 390,
    lessons: [
      { title: 'Делители и кратные' },
      { title: 'Признаки делимости' },
      { title: 'НОД и НОК' }
    ]
  },
  {
    name: 'Обыкновенные дроби — углубление',
    description: 'Разные знаменатели, умножение, деление',
    icon: 'i-lucide-pie-chart',
    color: 'pink',
    durationMinutes: 160,
    totalXp: 570,
    lessons: [
      { title: 'Приведение к общему знаменателю' },
      { title: 'Сложение и вычитание дробей с разными знаменателями' },
      { title: 'Умножение дробей' },
      { title: 'Деление дробей' }
    ]
  },
  {
    name: 'Отношения и пропорции',
    description: 'Сравнение величин',
    icon: 'i-lucide-scale',
    color: 'amber',
    durationMinutes: 100,
    totalXp: 360,
    lessons: [
      { title: 'Что такое отношение' },
      { title: 'Пропорции и их свойства' },
      { title: 'Прямая и обратная пропорциональность' }
    ]
  },
  {
    name: 'Положительные и отрицательные числа',
    description: 'Числа по обе стороны от нуля',
    icon: 'i-lucide-minus-plus',
    color: 'rose',
    durationMinutes: 110,
    totalXp: 390,
    lessons: [
      { title: 'Координатная прямая' },
      { title: 'Противоположные числа' },
      { title: 'Модуль числа' }
    ]
  },
  {
    name: 'Сложение и вычитание рациональных чисел',
    description: 'Правила работы со знаками',
    icon: 'i-lucide-plus-minus',
    color: 'green',
    durationMinutes: 110,
    totalXp: 390,
    lessons: [
      { title: 'Сложение чисел с одинаковыми знаками' },
      { title: 'Сложение чисел с разными знаками' },
      { title: 'Вычитание рациональных чисел' }
    ]
  },
  {
    name: 'Умножение и деление рациональных чисел',
    description: 'Правила знаков в действиях',
    icon: 'i-lucide-x-square',
    color: 'emerald',
    durationMinutes: 110,
    totalXp: 390,
    lessons: [
      { title: 'Правило знаков' },
      { title: 'Умножение и деление рациональных чисел' },
      { title: 'Действия смешанные' }
    ]
  },
  {
    name: 'Решение уравнений',
    description: 'Первая буква в равенстве',
    icon: 'i-lucide-equal',
    color: 'sky',
    durationMinutes: 120,
    totalXp: 430,
    lessons: [
      { title: 'Что такое уравнение' },
      { title: 'Простейшие уравнения' },
      { title: 'Задачи с уравнениями' }
    ]
  },
  {
    name: 'Координатная плоскость',
    description: 'Точки на двух осях',
    icon: 'i-lucide-axis-3d',
    color: 'cyan',
    durationMinutes: 90,
    totalXp: 320,
    lessons: [
      { title: 'Оси и координаты точек' },
      { title: 'Построение точек и фигур' }
    ]
  },
  {
    name: 'Статистика и диаграммы',
    description: 'Читаем и строим графики',
    icon: 'i-lucide-bar-chart-3',
    color: 'orange',
    durationMinutes: 80,
    totalXp: 290,
    lessons: [
      { title: 'Среднее арифметическое' },
      { title: 'Столбчатые и круговые диаграммы' }
    ]
  }
]

const CURRICULUM: Record<number, TopicSeed[]> = {
  1: GRADE_1,
  2: GRADE_2,
  3: GRADE_3,
  4: GRADE_4,
  5: GRADE_5,
  6: GRADE_6
}

export default defineEventHandler(async (event) => {
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 403, message: 'Not allowed in production' })
  }

  const supabase = serverSupabaseServiceRole(event)
  const log: string[] = []

  // 1. Load grade-bound Math subjects
  const { data: subjects, error: subErr } = await supabase
    .from('Subject')
    .select('id, grade')
    .not('grade', 'is', null)
    .order('grade')

  if (subErr) throw createError({ statusCode: 500, message: `Subject fetch: ${subErr.message}` })

  const subjectByGrade: Record<number, string> = {}
  for (const s of subjects ?? []) {
    if (s.grade != null) subjectByGrade[s.grade] = s.id
  }

  const missing = [1, 2, 3, 4, 5, 6].filter(g => !subjectByGrade[g])
  if (missing.length) {
    throw createError({
      statusCode: 500,
      message: `Missing grade-bound Math subjects for: ${missing.join(', ')}. Run subject seed first.`
    })
  }

  // 2. Wipe existing PathTopic/PathLesson for these subjects (cascades)
  const subjectIds = Object.values(subjectByGrade)
  const { error: delErr } = await supabase
    .from('PathTopic')
    .delete()
    .in('subjectId', subjectIds)

  if (delErr) throw createError({ statusCode: 500, message: `Wipe PathTopic: ${delErr.message}` })
  log.push(`Wiped existing topics for ${subjectIds.length} subjects`)

  // 3. Build rows
  type TopicInsert = {
    id?: string
    subjectId: string
    name: string
    description: string
    icon: string
    color: string
    orderIndex: number
    gradeLevel: number
    totalXp: number
    durationMinutes: number
  }
  type LessonInsert = {
    pathTopicId: string
    title: string
    subtitle: string | null
    orderIndex: number
    durationMinutes: number
    xpReward: number
    masteryThreshold: number
    difficulty: 'LIGHT' | 'STANDARD' | 'DEEP'
  }

  let totalTopics = 0
  let totalLessons = 0

  for (const [gradeStr, topics] of Object.entries(CURRICULUM)) {
    const grade = Number(gradeStr)
    const subjectId = subjectByGrade[grade]!

    const topicRows: TopicInsert[] = topics.map((t, i) => ({
      subjectId,
      name: t.name,
      description: t.description,
      icon: t.icon,
      color: t.color,
      orderIndex: i + 1,
      gradeLevel: grade,
      totalXp: t.totalXp,
      durationMinutes: t.durationMinutes
    }))

    const { data: insertedTopics, error: tErr } = await supabase
      .from('PathTopic')
      .insert(topicRows)
      .select('id, orderIndex')

    if (tErr) throw createError({ statusCode: 500, message: `Grade ${grade} topics: ${tErr.message}` })
    if (!insertedTopics) continue

    totalTopics += insertedTopics.length

    // Map order → id for lesson linking
    const idByOrder: Record<number, string> = {}
    for (const t of insertedTopics) idByOrder[t.orderIndex] = t.id

    const lessonRows: LessonInsert[] = []
    topics.forEach((t, tIdx) => {
      const topicId = idByOrder[tIdx + 1]
      if (!topicId) return
      t.lessons.forEach((l, lIdx) => {
        lessonRows.push({
          pathTopicId: topicId,
          title: l.title,
          subtitle: l.subtitle ?? null,
          orderIndex: lIdx + 1,
          durationMinutes: l.durationMinutes ?? 25,
          xpReward: l.xpReward ?? 100,
          masteryThreshold: l.masteryThreshold ?? 80,
          difficulty: l.difficulty ?? 'STANDARD'
        })
      })
    })

    if (lessonRows.length) {
      const { error: lErr } = await supabase.from('PathLesson').insert(lessonRows)
      if (lErr) throw createError({ statusCode: 500, message: `Grade ${grade} lessons: ${lErr.message}` })
      totalLessons += lessonRows.length
    }

    log.push(`Grade ${grade}: ${insertedTopics.length} topics, ${lessonRows.length} lessons`)
  }

  return {
    ok: true,
    totalTopics,
    totalLessons,
    log
  }
})
