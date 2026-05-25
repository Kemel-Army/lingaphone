/**
 * Short 1-minute English stories for the "Listen & Retell" trainer.
 *
 * Each story is ~120-150 words (~60-70s with TTS at 0.85x).
 * `keyPoints` are the concepts the student should mention when retelling —
 * used by the trainer to compute a comprehension score.
 *
 * When DB lands: replace with Supabase query of `Story` table.
 */

export type StoryLevel = 'A1' | 'A2' | 'S1' | 'S2' | 'B2'

export interface StoryQuestion {
  q: string
  a: string
}

export interface MinuteStory {
  id: string
  level: StoryLevel
  title: string
  emoji: string
  /** Russian description of what the story is about */
  description: string
  /** Short Russian tag — "Семья", "Путешествие", etc. */
  topic: string
  /** The story body (English, ~120-150 words) */
  text: string
  /** Russian summary, revealed after listening */
  translation: string
  /**
   * Key concepts the student should mention when retelling.
   * Each entry is a list of synonyms / variants — if any one is detected,
   * the concept is counted as covered.
   */
  keyPoints: Array<{ label: string, synonyms: string[] }>
  /** Optional comprehension questions in Russian */
  questions?: StoryQuestion[]
}

export const MINUTE_STORIES: MinuteStory[] = [
  // ════════════════════════════════════════════════════════════════════
  // A1 — STARTER
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'story-a1-tom-morning',
    level: 'A1',
    title: 'Tom\'s Morning',
    emoji: '🌅',
    topic: 'Повседневная жизнь',
    description: 'Утренние привычки мальчика из Лондона — простые слова и времена',
    text: `Tom is ten years old. He lives in London with his mother and his sister. Every morning Tom wakes up at seven o'clock. First, he washes his face and brushes his teeth. Then he puts on his school uniform. His uniform is blue. For breakfast, Tom eats toast with butter and drinks a glass of milk. His sister Emma drinks tea. After breakfast, Tom takes his bag and walks to school. The school is close to his house. It takes only ten minutes. Tom loves school because he likes his English teacher, Mrs Brown. She is kind and funny. On Mondays, Tom has maths, English and art. Art is his favourite subject. After school, he plays football in the park with his friends.`,
    translation: `Тому десять лет. Он живёт в Лондоне с мамой и сестрой. Каждое утро Том встаёт в семь часов. Сначала умывается и чистит зубы, потом надевает школьную форму — синюю. На завтрак Том ест тост с маслом и пьёт стакан молока. Сестра Эмма пьёт чай. После завтрака Том берёт рюкзак и идёт в школу пешком — всего 10 минут. Он любит школу из-за учительницы английского, миссис Браун. По понедельникам — математика, английский и рисование. Рисование — любимый предмет. После школы Том играет с друзьями в футбол в парке.`,
    keyPoints: [
      { label: 'Том — 10 лет', synonyms: ['ten', 'years old', '10'] },
      { label: 'Живёт в Лондоне', synonyms: ['london', 'lives in london'] },
      { label: 'Встаёт в 7', synonyms: ['seven', 'wakes up', '7'] },
      { label: 'Завтрак: тост и молоко', synonyms: ['toast', 'butter', 'milk', 'breakfast'] },
      { label: 'Идёт в школу пешком', synonyms: ['walks to school', 'walk', 'school'] },
      { label: 'Любит учительницу Mrs Brown', synonyms: ['mrs brown', 'teacher', 'english teacher'] },
      { label: 'Рисование — любимый предмет', synonyms: ['art', 'favourite subject', 'favorite'] },
      { label: 'Играет в футбол с друзьями', synonyms: ['football', 'friends', 'park'] }
    ],
    questions: [
      { q: 'Сколько лет Тому?', a: 'Десять лет' },
      { q: 'Что Том ест на завтрак?', a: 'Тост с маслом и пьёт молоко' },
      { q: 'Какой любимый предмет у Тома?', a: 'Рисование (art)' }
    ]
  },

  // ════════════════════════════════════════════════════════════════════
  // A2 — ELEMENTARY
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'story-a2-weekend-park',
    level: 'A2',
    title: 'A Weekend in the Park',
    emoji: '🌳',
    topic: 'Выходные',
    description: 'Семейный пикник в выходной день — погода, занятия и планы',
    text: `Last Saturday was a beautiful sunny day. Anna and her family decided to go to Hyde Park for a picnic. They prepared sandwiches, fruit and some lemonade. They also brought a blanket and a small football. When they arrived, the park was full of people. Some were riding bicycles, others were walking their dogs. Anna's little brother, Jack, wanted to feed the ducks near the lake. He had a piece of bread in his pocket. After lunch, the family played football together. Anna's father is not very good at football, but he tried his best. In the afternoon, dark clouds appeared and it started to rain. They quickly packed everything and ran home, laughing all the way. It was a perfect weekend, even with the rain.`,
    translation: `В прошлую субботу был прекрасный солнечный день. Анна с семьёй решила устроить пикник в Гайд-парке. Они приготовили сэндвичи, фрукты и лимонад, взяли плед и маленький мяч. В парке было много людей: кто-то катался на велосипеде, кто-то выгуливал собак. Младший брат Анны Джек хотел покормить уток у пруда — у него в кармане был кусочек хлеба. После обеда вся семья играла в футбол. Папа играет плохо, но старался. Днём появились тучи и начался дождь. Все быстро собрались и побежали домой, смеясь. Получились отличные выходные, даже несмотря на дождь.`,
    keyPoints: [
      { label: 'Солнечная суббота', synonyms: ['saturday', 'sunny', 'beautiful day'] },
      { label: 'Пикник в Гайд-парке', synonyms: ['hyde park', 'picnic', 'park'] },
      { label: 'Семья Анны', synonyms: ['anna', 'family', 'brother', 'jack', 'father'] },
      { label: 'Бутерброды, фрукты, лимонад', synonyms: ['sandwiches', 'fruit', 'lemonade', 'food'] },
      { label: 'Джек кормил уток', synonyms: ['ducks', 'feed', 'bread', 'lake'] },
      { label: 'Играли в футбол', synonyms: ['football', 'played', 'play'] },
      { label: 'Начался дождь', synonyms: ['rain', 'clouds', 'started to rain'] },
      { label: 'Побежали домой', synonyms: ['ran home', 'went home', 'packed'] }
    ],
    questions: [
      { q: 'Куда поехала семья Анны?', a: 'В Гайд-парк на пикник' },
      { q: 'Что Джек делал у пруда?', a: 'Кормил уток хлебом' },
      { q: 'Почему они побежали домой?', a: 'Начался дождь' }
    ]
  },

  // ════════════════════════════════════════════════════════════════════
  // S1 — PRE-INTERMEDIATE
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'story-s1-job-interview',
    level: 'S1',
    title: 'The Job Interview',
    emoji: '💼',
    topic: 'Работа',
    description: 'Девушка идёт на собеседование — волнение, диалог, результат',
    text: `Sarah had been looking for a new job for three months. Finally, she received an invitation for an interview at a marketing company in central London. On the morning of the interview, she felt very nervous. She put on her best suit, drank a strong cup of coffee, and left her flat earlier than usual. The interview was scheduled for ten o'clock. When she arrived, the receptionist asked her to wait in a small meeting room. After ten minutes, two managers came in and introduced themselves. They asked her about her previous experience, her strengths, and her weaknesses. Sarah answered honestly and even made them laugh once or twice. At the end, the managers thanked her and said they would call her by Friday. Three days later, she got the job. She was absolutely delighted.`,
    translation: `Сара три месяца искала новую работу. Наконец её пригласили на собеседование в маркетинговую компанию в центре Лондона. Утром в день собеседования она нервничала: надела лучший костюм, выпила крепкий кофе и вышла раньше обычного. Собеседование было в 10:00. Когда Сара пришла, секретарь попросила её подождать в небольшой переговорной. Через 10 минут пришли два менеджера, представились и спросили её о прошлом опыте, сильных и слабых сторонах. Сара отвечала честно и пару раз даже рассмешила их. В конце менеджеры поблагодарили её и сказали, что перезвонят до пятницы. Через три дня Сара получила работу — была в восторге.`,
    keyPoints: [
      { label: 'Искала работу 3 месяца', synonyms: ['three months', 'looking for', 'job'] },
      { label: 'Маркетинговая компания в Лондоне', synonyms: ['marketing', 'london', 'company'] },
      { label: 'Нервничала перед собеседованием', synonyms: ['nervous', 'interview'] },
      { label: 'Надела костюм, выпила кофе', synonyms: ['suit', 'coffee', 'best suit'] },
      { label: 'Собеседование в 10 утра', synonyms: ['ten', 'morning', 'oclock'] },
      { label: 'Два менеджера задавали вопросы', synonyms: ['managers', 'questions', 'experience'] },
      { label: 'Спросили об опыте и слабостях', synonyms: ['experience', 'strengths', 'weaknesses'] },
      { label: 'Получила работу через 3 дня', synonyms: ['got the job', 'three days', 'delighted'] }
    ],
    questions: [
      { q: 'Сколько Сара искала работу?', a: 'Три месяца' },
      { q: 'Как Сара чувствовала себя утром?', a: 'Очень нервничала' },
      { q: 'Когда ей сказали ждать ответа?', a: 'До пятницы' }
    ]
  },

  // ════════════════════════════════════════════════════════════════════
  // S2 — INTERMEDIATE
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'story-s2-london-traveller',
    level: 'S2',
    title: 'A Traveller in London',
    emoji: '🚇',
    topic: 'Путешествия',
    description: 'Турист из Италии теряется в Лондоне и неожиданно встречает друзей',
    text: `Marco arrived in London last Wednesday for a short business trip. He had only visited the city once before, when he was a teenager, so most of it felt completely new. On his second evening, he decided to explore the area around Covent Garden. However, after wandering through several narrow streets, he realised he was completely lost. His phone battery was dead, and the rain had started to fall heavily. While he was trying to find a taxi, he noticed a small Italian restaurant on the corner. He went inside hoping to ask for directions. To his surprise, the owner recognised him immediately — they had gone to the same secondary school in Rome years ago. They spent the rest of the evening sharing stories over a glass of red wine. Marco often says that getting lost was the best thing that happened on that trip.`,
    translation: `Марко приехал в Лондон в прошлую среду в короткую деловую поездку. До этого он был в городе только однажды — подростком, поэтому почти всё было ему незнакомо. Во второй вечер он решил погулять у Ковент-Гарден. Поблуждав по узким улочкам, понял, что заблудился. Телефон разрядился, начался сильный дождь. Пока он искал такси, заметил маленький итальянский ресторан на углу. Зашёл, чтобы спросить дорогу. К его удивлению, хозяин сразу узнал его — они вместе учились в школе в Риме много лет назад. Остаток вечера они провели за бокалом красного вина, вспоминая истории. Марко часто говорит, что заблудиться было лучшее, что случилось в той поездке.`,
    keyPoints: [
      { label: 'Марко из Италии в Лондоне', synonyms: ['marco', 'italian', 'london', 'italy'] },
      { label: 'Деловая поездка', synonyms: ['business trip', 'business'] },
      { label: 'Гулял у Ковент-Гарден', synonyms: ['covent garden', 'walking', 'exploring'] },
      { label: 'Заблудился', synonyms: ['lost', 'got lost'] },
      { label: 'Телефон разрядился', synonyms: ['phone', 'battery', 'dead'] },
      { label: 'Начался дождь', synonyms: ['rain', 'raining'] },
      { label: 'Зашёл в итальянский ресторан', synonyms: ['restaurant', 'italian restaurant'] },
      { label: 'Хозяин — школьный друг из Рима', synonyms: ['rome', 'school', 'owner', 'recognised', 'recognized'] },
      { label: 'Провели вечер за вином', synonyms: ['wine', 'red wine', 'evening'] }
    ],
    questions: [
      { q: 'Зачем Марко приехал в Лондон?', a: 'В деловую поездку' },
      { q: 'Почему он не мог вызвать такси?', a: 'Телефон разрядился' },
      { q: 'Кем оказался хозяин ресторана?', a: 'Его школьным другом из Рима' }
    ]
  }
]

export const getStory = (id: string) => MINUTE_STORIES.find(s => s.id === id)
