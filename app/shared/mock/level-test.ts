/**
 * English level placement test pool (~400 questions).
 *
 * Stratified by CEFR-ish tier (A1, A2, S1=B1, S2=B2, F1=C1) — 10 questions
 * sampled from each tier per attempt = 50 total per test, so every test
 * is different. Pool is ≥ 80 per tier (80 C 10 ≈ 1.6 trillion combos).
 *
 * Anonymous landing-page tool — no DB persistence by design. Result is
 * computed client-side and shown immediately.
 *
 * Level determination:
 *   Start at A1, climb to the highest tier where score ≥ TIER_PASS_THRESHOLD
 *   AND every lower tier also met threshold. Otherwise stop at last passed tier.
 */

export type LevelTestTier = 'A1' | 'A2' | 'S1' | 'S2' | 'F1'

export interface LevelTestQuestion {
  id: string
  level: LevelTestTier
  prompt: string
  options: string[]
  correctIndex: number
}

export const LEVEL_TEST_TIERS: LevelTestTier[] = ['A1', 'A2', 'S1', 'S2', 'F1']

// ════════════════════════════════════════════════════════════════════════════
// A1 — Beginner (80 questions)
// ════════════════════════════════════════════════════════════════════════════
const A1: LevelTestQuestion[] = [
  // Greetings & introductions
  { id: 'a1-1', level: 'A1', prompt: '«Hello!» = ?', options: ['Пока!', 'Привет!', 'Спасибо!', 'Прости!'], correctIndex: 1 },
  { id: 'a1-2', level: 'A1', prompt: 'Choose: «Меня зовут Анна»', options: ['I am Anna', 'My name Anna', 'My name is Anna', 'I name Anna'], correctIndex: 2 },
  { id: 'a1-3', level: 'A1', prompt: '«Good morning» — это…', options: ['Доброе утро', 'Добрый вечер', 'Спокойной ночи', 'Добрый день'], correctIndex: 0 },
  { id: 'a1-4', level: 'A1', prompt: '«Nice to meet you» = ?', options: ['Давно не виделись', 'Приятно познакомиться', 'Извини, не помню', 'До скорой встречи'], correctIndex: 1 },
  { id: 'a1-5', level: 'A1', prompt: 'How are you? — …', options: ['I am 9 years old', 'I am fine, thanks', 'My name is Tom', 'Yes, please'], correctIndex: 1 },
  { id: 'a1-6', level: 'A1', prompt: '«Goodbye» — это…', options: ['Привет', 'Извини', 'До свидания', 'Спасибо'], correctIndex: 2 },
  { id: 'a1-7', level: 'A1', prompt: 'Where are you from? — I am from _____', options: ['Almaty', 'on Almaty', 'in Almaty', 'at Almaty'], correctIndex: 0 },
  { id: 'a1-8', level: 'A1', prompt: 'How old are you? — _____', options: ['I am ten', 'I have ten', 'I ten', 'My ten'], correctIndex: 0 },
  { id: 'a1-9', level: 'A1', prompt: 'Choose: «До свидания»', options: ['Hello', 'Sorry', 'Goodbye', 'Please'], correctIndex: 2 },
  { id: 'a1-10', level: 'A1', prompt: '«Sorry» — это…', options: ['Привет', 'Спасибо', 'Извини', 'Пожалуйста'], correctIndex: 2 },

  // Numbers
  { id: 'a1-11', level: 'A1', prompt: 'How do you write 13?', options: ['thirty', 'thirteen', 'three teen', 'threeteen'], correctIndex: 1 },
  { id: 'a1-12', level: 'A1', prompt: 'How do you write 20?', options: ['twelve', 'twenty', 'two teen', 'twoty'], correctIndex: 1 },
  { id: 'a1-13', level: 'A1', prompt: 'Eight + two = ?', options: ['ten', 'nine', 'eleven', 'twelve'], correctIndex: 0 },
  { id: 'a1-14', level: 'A1', prompt: 'What number is «forty»?', options: ['4', '14', '40', '44'], correctIndex: 2 },
  { id: 'a1-15', level: 'A1', prompt: 'What time is «half past five»?', options: ['4:30', '5:00', '5:15', '5:30'], correctIndex: 3 },

  // Be / have basics
  { id: 'a1-16', level: 'A1', prompt: 'I _____ a student.', options: ['am', 'is', 'are', 'be'], correctIndex: 0 },
  { id: 'a1-17', level: 'A1', prompt: 'She _____ my sister.', options: ['am', 'is', 'are', 'be'], correctIndex: 1 },
  { id: 'a1-18', level: 'A1', prompt: 'We _____ from Kazakhstan.', options: ['am', 'is', 'are', 'be'], correctIndex: 2 },
  { id: 'a1-19', level: 'A1', prompt: 'They _____ in the park.', options: ['am', 'is', 'are', 'be'], correctIndex: 2 },
  { id: 'a1-20', level: 'A1', prompt: 'I _____ a dog at home.', options: ['have', 'has', 'am', 'is'], correctIndex: 0 },
  { id: 'a1-21', level: 'A1', prompt: 'Tom _____ a new bike.', options: ['have', 'has', 'is', 'are'], correctIndex: 1 },
  { id: 'a1-22', level: 'A1', prompt: 'My friends _____ blue eyes.', options: ['has', 'have', 'is', 'are'], correctIndex: 1 },
  { id: 'a1-23', level: 'A1', prompt: 'She _____ from London.', options: ['is', 'are', 'am', 'have'], correctIndex: 0 },
  { id: 'a1-24', level: 'A1', prompt: 'My name _____ Olga.', options: ['am', 'are', 'is', 'be'], correctIndex: 2 },
  { id: 'a1-25', level: 'A1', prompt: 'It _____ a cat, not a dog.', options: ['am', 'is', 'are', 'be'], correctIndex: 1 },

  // Articles a/an
  { id: 'a1-26', level: 'A1', prompt: '_____ apple', options: ['a', 'an', 'the', '—'], correctIndex: 1 },
  { id: 'a1-27', level: 'A1', prompt: '_____ pen', options: ['a', 'an', 'the', '—'], correctIndex: 0 },
  { id: 'a1-28', level: 'A1', prompt: '_____ umbrella', options: ['a', 'an', 'the', '—'], correctIndex: 1 },
  { id: 'a1-29', level: 'A1', prompt: '_____ banana', options: ['a', 'an', 'the', '—'], correctIndex: 0 },
  { id: 'a1-30', level: 'A1', prompt: '_____ hour', options: ['a', 'an', 'the', '—'], correctIndex: 1 },

  // Plurals
  { id: 'a1-31', level: 'A1', prompt: 'Plural of «book»', options: ['books', 'bookes', 'book', 'bookies'], correctIndex: 0 },
  { id: 'a1-32', level: 'A1', prompt: 'Plural of «child»', options: ['childs', 'childes', 'children', 'childen'], correctIndex: 2 },
  { id: 'a1-33', level: 'A1', prompt: 'Plural of «man»', options: ['mans', 'mens', 'men', 'mansen'], correctIndex: 2 },
  { id: 'a1-34', level: 'A1', prompt: 'Plural of «foot»', options: ['foots', 'feet', 'feets', 'feeties'], correctIndex: 1 },
  { id: 'a1-35', level: 'A1', prompt: 'Plural of «mouse»', options: ['mouses', 'mice', 'mices', 'mousen'], correctIndex: 1 },

  // Possessive pronouns / object pronouns
  { id: 'a1-36', level: 'A1', prompt: 'This is _____ book. (моя)', options: ['I', 'my', 'me', 'mine'], correctIndex: 1 },
  { id: 'a1-37', level: 'A1', prompt: '_____ is my brother. (он)', options: ['Him', 'Her', 'He', 'His'], correctIndex: 2 },
  { id: 'a1-38', level: 'A1', prompt: 'Give it to _____. (ей)', options: ['her', 'she', 'hers', 'him'], correctIndex: 0 },
  { id: 'a1-39', level: 'A1', prompt: '_____ name is Anna.', options: ['Her', 'She', 'Hers', 'She is'], correctIndex: 0 },
  { id: 'a1-40', level: 'A1', prompt: 'The dog is _____. (наша)', options: ['us', 'we', 'our', 'ours'], correctIndex: 2 },

  // Family
  { id: 'a1-41', level: 'A1', prompt: '«Mother» — это…', options: ['отец', 'мать', 'сестра', 'тётя'], correctIndex: 1 },
  { id: 'a1-42', level: 'A1', prompt: '«Brother» — это…', options: ['брат', 'сестра', 'дядя', 'двоюродный'], correctIndex: 0 },
  { id: 'a1-43', level: 'A1', prompt: '«Grandfather» — это…', options: ['дядя', 'отец', 'дедушка', 'бабушка'], correctIndex: 2 },
  { id: 'a1-44', level: 'A1', prompt: '«Daughter» — это…', options: ['сын', 'дочь', 'тётя', 'племянница'], correctIndex: 1 },
  { id: 'a1-45', level: 'A1', prompt: '«Aunt» — это…', options: ['тётя', 'дядя', 'бабушка', 'крёстная'], correctIndex: 0 },

  // Food / drink
  { id: 'a1-46', level: 'A1', prompt: '«Bread» — это…', options: ['молоко', 'сыр', 'хлеб', 'мясо'], correctIndex: 2 },
  { id: 'a1-47', level: 'A1', prompt: '«Tea» — это…', options: ['кофе', 'чай', 'сок', 'вода'], correctIndex: 1 },
  { id: 'a1-48', level: 'A1', prompt: 'I want _____ glass of water.', options: ['a', 'an', 'the', '—'], correctIndex: 0 },
  { id: 'a1-49', level: 'A1', prompt: '«Cheese» — это…', options: ['рыба', 'сыр', 'масло', 'хлеб'], correctIndex: 1 },
  { id: 'a1-50', level: 'A1', prompt: '«Apple» — это…', options: ['банан', 'груша', 'яблоко', 'апельсин'], correctIndex: 2 },

  // Colors / weather
  { id: 'a1-51', level: 'A1', prompt: '«Red» — это…', options: ['синий', 'красный', 'зелёный', 'жёлтый'], correctIndex: 1 },
  { id: 'a1-52', level: 'A1', prompt: '«Black» — это…', options: ['белый', 'серый', 'чёрный', 'коричневый'], correctIndex: 2 },
  { id: 'a1-53', level: 'A1', prompt: 'The sky is _____.', options: ['blue', 'green', 'red', 'yellow'], correctIndex: 0 },
  { id: 'a1-54', level: 'A1', prompt: 'It is _____ today. (солнечно)', options: ['rainy', 'snowy', 'sunny', 'windy'], correctIndex: 2 },
  { id: 'a1-55', level: 'A1', prompt: '«It is cold» = ?', options: ['Жарко', 'Холодно', 'Тепло', 'Сухо'], correctIndex: 1 },

  // Daily routines / verbs
  { id: 'a1-56', level: 'A1', prompt: 'I _____ at 7 in the morning.', options: ['wake up', 'wakes up', 'waking up', 'woke up'], correctIndex: 0 },
  { id: 'a1-57', level: 'A1', prompt: 'She _____ TV every evening.', options: ['watch', 'watches', 'watching', 'is watch'], correctIndex: 1 },
  { id: 'a1-58', level: 'A1', prompt: 'They _____ to school by bus.', options: ['goes', 'go', 'going', 'gone'], correctIndex: 1 },
  { id: 'a1-59', level: 'A1', prompt: 'He _____ in the park on Sundays.', options: ['run', 'runs', 'running', 'ran'], correctIndex: 1 },
  { id: 'a1-60', level: 'A1', prompt: 'I _____ tea, not coffee.', options: ['like', 'likes', 'liking', 'liked'], correctIndex: 0 },

  // Prepositions of place
  { id: 'a1-61', level: 'A1', prompt: 'The cat is _____ the table.', options: ['on', 'at', 'in', 'by'], correctIndex: 0 },
  { id: 'a1-62', level: 'A1', prompt: 'The keys are _____ the bag.', options: ['on', 'in', 'at', 'by'], correctIndex: 1 },
  { id: 'a1-63', level: 'A1', prompt: 'I live _____ Almaty.', options: ['on', 'in', 'at', 'by'], correctIndex: 1 },
  { id: 'a1-64', level: 'A1', prompt: 'The picture is _____ the wall.', options: ['on', 'in', 'at', 'under'], correctIndex: 0 },
  { id: 'a1-65', level: 'A1', prompt: 'The dog is _____ the chair. (под)', options: ['on', 'in', 'under', 'over'], correctIndex: 2 },

  // Negation / questions
  { id: 'a1-66', level: 'A1', prompt: 'I _____ like fish.', options: ['don\'t', 'doesn\'t', 'no', 'am not'], correctIndex: 0 },
  { id: 'a1-67', level: 'A1', prompt: 'She _____ speak French.', options: ['don\'t', 'doesn\'t', 'isn\'t', 'aren\'t'], correctIndex: 1 },
  { id: 'a1-68', level: 'A1', prompt: '_____ you like music?', options: ['Are', 'Is', 'Do', 'Does'], correctIndex: 2 },
  { id: 'a1-69', level: 'A1', prompt: '_____ he play tennis?', options: ['Do', 'Does', 'Is', 'Has'], correctIndex: 1 },
  { id: 'a1-70', level: 'A1', prompt: '_____ they at home now?', options: ['Do', 'Does', 'Are', 'Is'], correctIndex: 2 },

  // Misc easy
  { id: 'a1-71', level: 'A1', prompt: 'Choose: «Я хочу пить»', options: ['I am hungry', 'I am thirsty', 'I am tired', 'I am cold'], correctIndex: 1 },
  { id: 'a1-72', level: 'A1', prompt: 'Choose: «Я голоден»', options: ['I am hungry', 'I am thirsty', 'I am angry', 'I am happy'], correctIndex: 0 },
  { id: 'a1-73', level: 'A1', prompt: '«Open the door» = ?', options: ['Закрой дверь', 'Открой дверь', 'Запри дверь', 'Постучи'], correctIndex: 1 },
  { id: 'a1-74', level: 'A1', prompt: 'How many days in a week?', options: ['five', 'six', 'seven', 'ten'], correctIndex: 2 },
  { id: 'a1-75', level: 'A1', prompt: 'What is the first month of the year?', options: ['March', 'July', 'January', 'December'], correctIndex: 2 },
  { id: 'a1-76', level: 'A1', prompt: '«Big» — opposite is…', options: ['tall', 'small', 'long', 'wide'], correctIndex: 1 },
  { id: 'a1-77', level: 'A1', prompt: '«Hot» — opposite is…', options: ['cold', 'warm', 'cool', 'wet'], correctIndex: 0 },
  { id: 'a1-78', level: 'A1', prompt: '«Old» — opposite is…', options: ['short', 'tall', 'young', 'new'], correctIndex: 2 },
  { id: 'a1-79', level: 'A1', prompt: 'Where do you sleep?', options: ['kitchen', 'bedroom', 'bathroom', 'garage'], correctIndex: 1 },
  { id: 'a1-80', level: 'A1', prompt: 'Where do you cook?', options: ['kitchen', 'bedroom', 'bathroom', 'study'], correctIndex: 0 }
]

// ════════════════════════════════════════════════════════════════════════════
// A2 — Elementary (80 questions)
// ════════════════════════════════════════════════════════════════════════════
const A2: LevelTestQuestion[] = [
  // Past simple regular
  { id: 'a2-1', level: 'A2', prompt: 'I _____ TV yesterday.', options: ['watch', 'watched', 'watching', 'have watched'], correctIndex: 1 },
  { id: 'a2-2', level: 'A2', prompt: 'She _____ in the park last Sunday.', options: ['walk', 'walked', 'walking', 'walks'], correctIndex: 1 },
  { id: 'a2-3', level: 'A2', prompt: 'They _____ football two days ago.', options: ['play', 'plays', 'played', 'playing'], correctIndex: 2 },
  { id: 'a2-4', level: 'A2', prompt: 'He _____ to the music last night.', options: ['listen', 'listened', 'listens', 'listening'], correctIndex: 1 },
  { id: 'a2-5', level: 'A2', prompt: 'We _____ in a small hotel.', options: ['stay', 'stayed', 'stays', 'staying'], correctIndex: 1 },

  // Past simple irregular
  { id: 'a2-6', level: 'A2', prompt: 'Past of «go» = ?', options: ['goed', 'gone', 'went', 'going'], correctIndex: 2 },
  { id: 'a2-7', level: 'A2', prompt: 'Past of «see» = ?', options: ['seen', 'saw', 'seed', 'sawed'], correctIndex: 1 },
  { id: 'a2-8', level: 'A2', prompt: 'Past of «buy» = ?', options: ['buyed', 'buied', 'bought', 'brought'], correctIndex: 2 },
  { id: 'a2-9', level: 'A2', prompt: 'Past of «come» = ?', options: ['comed', 'came', 'cum', 'coming'], correctIndex: 1 },
  { id: 'a2-10', level: 'A2', prompt: 'Past of «have» = ?', options: ['haved', 'had', 'hath', 'has'], correctIndex: 1 },
  { id: 'a2-11', level: 'A2', prompt: 'Past of «eat» = ?', options: ['eated', 'ate', 'eaten', 'eats'], correctIndex: 1 },
  { id: 'a2-12', level: 'A2', prompt: 'Past of «drink» = ?', options: ['drinked', 'drunk', 'drank', 'drinking'], correctIndex: 2 },

  // Past simple questions / negatives
  { id: 'a2-13', level: 'A2', prompt: '_____ you see the new film?', options: ['Do', 'Did', 'Have', 'Are'], correctIndex: 1 },
  { id: 'a2-14', level: 'A2', prompt: 'She _____ go to the party yesterday.', options: ['don\'t', 'doesn\'t', 'didn\'t', 'isn\'t'], correctIndex: 2 },
  { id: 'a2-15', level: 'A2', prompt: 'Where _____ you yesterday?', options: ['was', 'were', 'are', 'did'], correctIndex: 1 },

  // Going to / will
  { id: 'a2-16', level: 'A2', prompt: 'Tomorrow I _____ visit my granny.', options: ['am going to', 'go to', 'goes to', 'went to'], correctIndex: 0 },
  { id: 'a2-17', level: 'A2', prompt: 'It is cloudy. It _____ rain.', options: ['is going to', 'go to', 'going', 'goes'], correctIndex: 0 },
  { id: 'a2-18', level: 'A2', prompt: 'I _____ help you with your bag.', options: ['will', 'am will', 'going', 'shall'], correctIndex: 0 },
  { id: 'a2-19', level: 'A2', prompt: '_____ you call me later?', options: ['Will', 'Are', 'Do', 'Have'], correctIndex: 0 },
  { id: 'a2-20', level: 'A2', prompt: 'I think it _____ be cold tomorrow.', options: ['is', 'will', 'are', 'has'], correctIndex: 1 },

  // Comparatives / superlatives
  { id: 'a2-21', level: 'A2', prompt: 'My brother is _____ than me.', options: ['tall', 'taller', 'tallest', 'more tall'], correctIndex: 1 },
  { id: 'a2-22', level: 'A2', prompt: 'This is the _____ book I have ever read.', options: ['good', 'better', 'best', 'goodest'], correctIndex: 2 },
  { id: 'a2-23', level: 'A2', prompt: 'Today is _____ than yesterday.', options: ['hotter', 'more hot', 'hottest', 'hot'], correctIndex: 0 },
  { id: 'a2-24', level: 'A2', prompt: 'She is the _____ student in class.', options: ['smart', 'smarter', 'smartest', 'most smart'], correctIndex: 2 },
  { id: 'a2-25', level: 'A2', prompt: 'Math is _____ than English for me.', options: ['difficult', 'difficulter', 'more difficult', 'most difficult'], correctIndex: 2 },
  { id: 'a2-26', level: 'A2', prompt: 'The Nile is the _____ river in the world.', options: ['long', 'longer', 'longest', 'more long'], correctIndex: 2 },

  // Frequency adverbs
  { id: 'a2-27', level: 'A2', prompt: 'I _____ go to bed late.', options: ['never', 'no', 'not', 'don\'t'], correctIndex: 0 },
  { id: 'a2-28', level: 'A2', prompt: 'She is _____ late for class.', options: ['often late', 'late often', 'lates often', 'often lates'], correctIndex: 0 },
  { id: 'a2-29', level: 'A2', prompt: 'How _____ do you go to the gym?', options: ['much', 'often', 'long', 'many'], correctIndex: 1 },
  { id: 'a2-30', level: 'A2', prompt: 'I _____ have coffee in the morning.', options: ['usually', 'usual', 'use', 'usuals'], correctIndex: 0 },

  // Prepositions of time
  { id: 'a2-31', level: 'A2', prompt: 'My birthday is _____ June.', options: ['at', 'in', 'on', 'by'], correctIndex: 1 },
  { id: 'a2-32', level: 'A2', prompt: 'The meeting is _____ 9 o\'clock.', options: ['at', 'in', 'on', 'by'], correctIndex: 0 },
  { id: 'a2-33', level: 'A2', prompt: 'I was born _____ Friday.', options: ['at', 'in', 'on', 'by'], correctIndex: 2 },
  { id: 'a2-34', level: 'A2', prompt: 'We will meet _____ the weekend.', options: ['at', 'in', 'on', 'over'], correctIndex: 0 },
  { id: 'a2-35', level: 'A2', prompt: 'See you _____ Monday morning.', options: ['at', 'in', 'on', 'by'], correctIndex: 2 },

  // Some / any / much / many
  { id: 'a2-36', level: 'A2', prompt: 'Is there _____ milk in the fridge?', options: ['some', 'any', 'much', 'many'], correctIndex: 1 },
  { id: 'a2-37', level: 'A2', prompt: 'I bought _____ apples.', options: ['some', 'any', 'much', 'an'], correctIndex: 0 },
  { id: 'a2-38', level: 'A2', prompt: 'There aren\'t _____ chairs.', options: ['some', 'any', 'much', 'a lot'], correctIndex: 1 },
  { id: 'a2-39', level: 'A2', prompt: 'How _____ sugar do you take?', options: ['much', 'many', 'long', 'few'], correctIndex: 0 },
  { id: 'a2-40', level: 'A2', prompt: 'How _____ books do you have?', options: ['much', 'many', 'long', 'few'], correctIndex: 1 },
  { id: 'a2-41', level: 'A2', prompt: 'There is _____ water in the bottle.', options: ['many', 'a little', 'a few', 'few'], correctIndex: 1 },
  { id: 'a2-42', level: 'A2', prompt: 'I have _____ friends in London.', options: ['a little', 'a few', 'much', 'less'], correctIndex: 1 },

  // Present continuous
  { id: 'a2-43', level: 'A2', prompt: 'Look! It _____ snowing.', options: ['is', 'are', 'was', 'will'], correctIndex: 0 },
  { id: 'a2-44', level: 'A2', prompt: 'They _____ playing in the garden.', options: ['is', 'are', 'was', 'be'], correctIndex: 1 },
  { id: 'a2-45', level: 'A2', prompt: 'I _____ reading a great book now.', options: ['am', 'is', 'are', 'be'], correctIndex: 0 },
  { id: 'a2-46', level: 'A2', prompt: '«Я учу английский» (сейчас)', options: ['I learn English', 'I am learning English', 'I have learned', 'I learnt'], correctIndex: 1 },

  // Imperatives
  { id: 'a2-47', level: 'A2', prompt: '«Не открывай окно» = ?', options: ['Don\'t open the window', 'You don\'t open', 'No open window', 'Not open window'], correctIndex: 0 },
  { id: 'a2-48', level: 'A2', prompt: '«Закрой дверь, пожалуйста» = ?', options: ['Close door please', 'Please close the door', 'The door close please', 'Closing the door'], correctIndex: 1 },

  // Time expressions
  { id: 'a2-49', level: 'A2', prompt: '«How long does it take?» — это вопрос про…', options: ['цену', 'время', 'количество', 'место'], correctIndex: 1 },
  { id: 'a2-50', level: 'A2', prompt: 'I am tired. I worked _____ 10 hours.', options: ['since', 'for', 'during', 'from'], correctIndex: 1 },

  // Short situations
  { id: 'a2-51', level: 'A2', prompt: 'In a restaurant: «Can I _____, please?»', options: ['have the menu', 'ask menu', 'see receipt', 'do menu'], correctIndex: 0 },
  { id: 'a2-52', level: 'A2', prompt: 'On the phone: «_____ I speak to John?»', options: ['May', 'Do', 'Have', 'Am'], correctIndex: 0 },
  { id: 'a2-53', level: 'A2', prompt: 'Shopping: «How _____ is this?»', options: ['many', 'much', 'long', 'old'], correctIndex: 1 },
  { id: 'a2-54', level: 'A2', prompt: 'Asking direction: «_____ is the metro?»', options: ['Where', 'When', 'How', 'What'], correctIndex: 0 },
  { id: 'a2-55', level: 'A2', prompt: 'Saying age: «I _____ 17 years old.»', options: ['am', 'have', 'is', 'be'], correctIndex: 0 },

  // Verbs of feeling
  { id: 'a2-56', level: 'A2', prompt: '«To be afraid of» = ?', options: ['любить', 'ненавидеть', 'бояться', 'удивляться'], correctIndex: 2 },
  { id: 'a2-57', level: 'A2', prompt: '«To enjoy» — это…', options: ['не любить', 'наслаждаться', 'забывать', 'присоединяться'], correctIndex: 1 },
  { id: 'a2-58', level: 'A2', prompt: '«To hate» = ?', options: ['любить', 'ненавидеть', 'жалеть', 'обижаться'], correctIndex: 1 },
  { id: 'a2-59', level: 'A2', prompt: '«I am bored» — это…', options: ['Мне страшно', 'Мне скучно', 'Я устал', 'Я обижен'], correctIndex: 1 },
  { id: 'a2-60', level: 'A2', prompt: '«I am excited» = ?', options: ['Я устал', 'Я взволнован/в восторге', 'Я расстроен', 'Я голоден'], correctIndex: 1 },

  // Articles the / a / —
  { id: 'a2-61', level: 'A2', prompt: 'I love _____ pizza.', options: ['a', 'an', 'the', '—'], correctIndex: 3 },
  { id: 'a2-62', level: 'A2', prompt: '_____ Earth is round.', options: ['A', 'An', 'The', '—'], correctIndex: 2 },
  { id: 'a2-63', level: 'A2', prompt: 'I play _____ guitar.', options: ['a', 'an', 'the', '—'], correctIndex: 2 },
  { id: 'a2-64', level: 'A2', prompt: 'She is _____ engineer.', options: ['a', 'an', 'the', '—'], correctIndex: 1 },
  { id: 'a2-65', level: 'A2', prompt: 'We had dinner at _____ home.', options: ['a', 'an', 'the', '—'], correctIndex: 3 },

  // Adjectives / -ing -ed
  { id: 'a2-66', level: 'A2', prompt: 'The film was _____ . (interesting/interested)', options: ['interesting', 'interested', 'interest', 'interestly'], correctIndex: 0 },
  { id: 'a2-67', level: 'A2', prompt: 'I am _____ in football. (interesting/interested)', options: ['interesting', 'interested', 'interest', 'interestly'], correctIndex: 1 },
  { id: 'a2-68', level: 'A2', prompt: 'The lesson was _____ . (boring/bored)', options: ['bore', 'bored', 'boring', 'borely'], correctIndex: 2 },
  { id: 'a2-69', level: 'A2', prompt: 'I am _____ . (tired/tiring)', options: ['tire', 'tired', 'tiring', 'tiredly'], correctIndex: 1 },

  // Common phrases
  { id: 'a2-70', level: 'A2', prompt: '«What does it mean?» = ?', options: ['Что это значит?', 'Что ты делаешь?', 'Что случилось?', 'Что ты сказал?'], correctIndex: 0 },
  { id: 'a2-71', level: 'A2', prompt: '«How do you spell it?» = ?', options: ['Что это?', 'Как пишется?', 'Когда?', 'Откуда?'], correctIndex: 1 },
  { id: 'a2-72', level: 'A2', prompt: '«It depends» = ?', options: ['Зависит', 'Не зависит', 'Зависает', 'Не работает'], correctIndex: 0 },
  { id: 'a2-73', level: 'A2', prompt: '«I have no idea» = ?', options: ['Я не понимаю', 'Понятия не имею', 'Нет мыслей', 'У меня нет идей'], correctIndex: 1 },
  { id: 'a2-74', level: 'A2', prompt: '«Never mind» = ?', options: ['Никогда', 'Не бери в голову', 'Я не возражаю', 'Никогда не думай'], correctIndex: 1 },

  // Verbs of movement
  { id: 'a2-75', level: 'A2', prompt: '«To drive» — это…', options: ['ходить', 'плавать', 'водить машину', 'летать'], correctIndex: 2 },
  { id: 'a2-76', level: 'A2', prompt: '«To fly» = ?', options: ['прыгать', 'плавать', 'летать', 'падать'], correctIndex: 2 },
  { id: 'a2-77', level: 'A2', prompt: 'Past of «leave» = ?', options: ['leaved', 'left', 'lived', 'leaving'], correctIndex: 1 },
  { id: 'a2-78', level: 'A2', prompt: 'Past of «meet» = ?', options: ['meeted', 'meet', 'met', 'meting'], correctIndex: 2 },
  { id: 'a2-79', level: 'A2', prompt: 'Past of «say» = ?', options: ['saided', 'sayed', 'said', 'sayd'], correctIndex: 2 },
  { id: 'a2-80', level: 'A2', prompt: 'Past of «put» = ?', options: ['putted', 'put', 'pat', 'putting'], correctIndex: 1 }
]

// ════════════════════════════════════════════════════════════════════════════
// S1 / B1 — Pre-Intermediate (80 questions)
// ════════════════════════════════════════════════════════════════════════════
const S1: LevelTestQuestion[] = [
  // Present perfect
  { id: 's1-1', level: 'S1', prompt: 'I _____ already _____ my homework.', options: ['have / done', 'has / done', 'am / doing', 'did / did'], correctIndex: 0 },
  { id: 's1-2', level: 'S1', prompt: 'She _____ to Paris three times.', options: ['has been', 'has gone', 'have been', 'is going'], correctIndex: 0 },
  { id: 's1-3', level: 'S1', prompt: 'Past participle of «see» = ?', options: ['saw', 'seen', 'seed', 'sawn'], correctIndex: 1 },
  { id: 's1-4', level: 'S1', prompt: 'Past participle of «take» = ?', options: ['took', 'taken', 'taked', 'taking'], correctIndex: 1 },
  { id: 's1-5', level: 'S1', prompt: '«I have lost my keys» — это про…', options: ['прошлое и нашёл', 'сейчас не могу найти', 'будущее', 'привычку'], correctIndex: 1 },
  { id: 's1-6', level: 'S1', prompt: 'How long _____ you _____ here?', options: ['do / live', 'are / live', 'have / lived', 'did / live'], correctIndex: 2 },
  { id: 's1-7', level: 'S1', prompt: 'They _____ never _____ sushi.', options: ['have / try', 'have / tried', 'has / tried', 'do / try'], correctIndex: 1 },
  { id: 's1-8', level: 'S1', prompt: 'I _____ him since 2020.', options: ['know', 'knew', 'have known', 'am knowing'], correctIndex: 2 },
  { id: 's1-9', level: 'S1', prompt: '«Just/already/yet» используются с…', options: ['Past Simple', 'Present Perfect', 'Future', 'Past Continuous'], correctIndex: 1 },
  { id: 's1-10', level: 'S1', prompt: 'Have you finished _____ ? (уже)', options: ['ever', 'never', 'yet', 'just'], correctIndex: 2 },

  // Past continuous
  { id: 's1-11', level: 'S1', prompt: 'I _____ TV when she called.', options: ['watched', 'was watching', 'have watched', 'am watching'], correctIndex: 1 },
  { id: 's1-12', level: 'S1', prompt: 'They _____ in the garden at 5pm yesterday.', options: ['play', 'played', 'were playing', 'have played'], correctIndex: 2 },
  { id: 's1-13', level: 'S1', prompt: 'What _____ you _____ at 8 o\'clock last night?', options: ['did / do', 'were / doing', 'have / done', 'do / doing'], correctIndex: 1 },
  { id: 's1-14', level: 'S1', prompt: 'While I _____ , the phone _____ .', options: ['cooked / rang', 'was cooking / rang', 'cooked / was ringing', 'have cooked / rang'], correctIndex: 1 },
  { id: 's1-15', level: 'S1', prompt: 'It _____ heavily when we left.', options: ['rained', 'was raining', 'has rained', 'rains'], correctIndex: 1 },

  // First conditional
  { id: 's1-16', level: 'S1', prompt: 'If it _____ tomorrow, we _____ stay home.', options: ['rain / will', 'rains / will', 'will rain / will', 'rained / would'], correctIndex: 1 },
  { id: 's1-17', level: 'S1', prompt: 'I _____ you if I _____ time.', options: ['help / have', 'will help / have', 'help / will have', 'would help / had'], correctIndex: 1 },
  { id: 's1-18', level: 'S1', prompt: 'If you _____ now, you _____ the bus.', options: ['leave / catch', 'leave / will catch', 'will leave / catch', 'left / caught'], correctIndex: 1 },
  { id: 's1-19', level: 'S1', prompt: 'She _____ angry if you _____ late.', options: ['will be / are', 'is / will be', 'would / are', 'is / would'], correctIndex: 0 },
  { id: 's1-20', level: 'S1', prompt: 'If we _____ harder, we _____ better grades.', options: ['study / get', 'study / will get', 'will study / get', 'studied / get'], correctIndex: 1 },

  // Modals must/should/have to
  { id: 's1-21', level: 'S1', prompt: 'You _____ smoke here — forbidden.', options: ['can', 'must not', 'should', 'might'], correctIndex: 1 },
  { id: 's1-22', level: 'S1', prompt: 'I _____ go to the doctor — I feel ill.', options: ['should', 'shouldn\'t', 'can\'t', 'must not'], correctIndex: 0 },
  { id: 's1-23', level: 'S1', prompt: '«Ему пришлось работать» = ?', options: ['He must work', 'He had to work', 'He should work', 'He can work'], correctIndex: 1 },
  { id: 's1-24', level: 'S1', prompt: 'You _____ wear a uniform at school.', options: ['have to', 'must to', 'should to', 'are to'], correctIndex: 0 },
  { id: 's1-25', level: 'S1', prompt: 'You _____ pay — it is free.', options: ['don\'t have to', 'must not', 'should not', 'cannot'], correctIndex: 0 },
  { id: 's1-26', level: 'S1', prompt: '«Might» означает…', options: ['должен', 'может быть', 'обязан', 'не может'], correctIndex: 1 },

  // Relative pronouns
  { id: 's1-27', level: 'S1', prompt: 'The girl _____ lives next door is my friend.', options: ['which', 'who', 'whose', 'where'], correctIndex: 1 },
  { id: 's1-28', level: 'S1', prompt: 'The book _____ I read was great.', options: ['who', 'which', 'whose', 'where'], correctIndex: 1 },
  { id: 's1-29', level: 'S1', prompt: 'This is the house _____ I was born.', options: ['which', 'who', 'where', 'what'], correctIndex: 2 },
  { id: 's1-30', level: 'S1', prompt: 'The man _____ car is red is my uncle.', options: ['who', 'which', 'whose', 'where'], correctIndex: 2 },

  // Reported speech basic
  { id: 's1-31', level: 'S1', prompt: 'Direct: «I am tired.» Reported: He said he _____ tired.', options: ['is', 'was', 'were', 'has been'], correctIndex: 1 },
  { id: 's1-32', level: 'S1', prompt: 'Direct: «I will call you.» Reported: She said she _____ me.', options: ['will call', 'would call', 'calls', 'called'], correctIndex: 1 },
  { id: 's1-33', level: 'S1', prompt: 'Direct: «I work hard.» Reported: He said he _____ hard.', options: ['works', 'worked', 'had worked', 'is working'], correctIndex: 1 },
  { id: 's1-34', level: 'S1', prompt: 'Direct: «I can swim.» Reported: She said she _____ swim.', options: ['can', 'could', 'will', 'must'], correctIndex: 1 },

  // Passive
  { id: 's1-35', level: 'S1', prompt: 'English _____ in many countries.', options: ['is spoken', 'speaks', 'is speaking', 'spoke'], correctIndex: 0 },
  { id: 's1-36', level: 'S1', prompt: 'The cake _____ by my mother.', options: ['made', 'is made', 'was made', 'is making'], correctIndex: 2 },
  { id: 's1-37', level: 'S1', prompt: 'This bridge _____ in 1900.', options: ['built', 'was built', 'is built', 'has built'], correctIndex: 1 },
  { id: 's1-38', level: 'S1', prompt: 'The room _____ every day.', options: ['cleans', 'is cleaned', 'was cleaned', 'cleaned'], correctIndex: 1 },

  // Phrasal verbs basic
  { id: 's1-39', level: 'S1', prompt: 'I usually _____ at 7am.', options: ['get up', 'get on', 'get out', 'get off'], correctIndex: 0 },
  { id: 's1-40', level: 'S1', prompt: '«Turn down» the music = ?', options: ['громче', 'тише', 'сменить', 'выключить'], correctIndex: 1 },
  { id: 's1-41', level: 'S1', prompt: 'I _____ smoking last year.', options: ['gave up', 'gave in', 'gave away', 'gave back'], correctIndex: 0 },
  { id: 's1-42', level: 'S1', prompt: 'The plane _____ at 6am.', options: ['took on', 'took out', 'took off', 'took up'], correctIndex: 2 },
  { id: 's1-43', level: 'S1', prompt: '«Look after» = ?', options: ['искать', 'присматривать за', 'смотреть назад', 'выглядеть как'], correctIndex: 1 },

  // Adjective order
  { id: 's1-44', level: 'S1', prompt: 'a _____ car (big/red)', options: ['big red', 'red big', 'big-red', 'red-big'], correctIndex: 0 },
  { id: 's1-45', level: 'S1', prompt: 'a _____ dress (long/silk)', options: ['silk long', 'long silk', 'long-silk', 'silked long'], correctIndex: 1 },

  // Vocabulary mid
  { id: 's1-46', level: 'S1', prompt: '«To borrow» = ?', options: ['давать в долг', 'брать в долг', 'покупать', 'продавать'], correctIndex: 1 },
  { id: 's1-47', level: 'S1', prompt: '«To lend» = ?', options: ['давать в долг', 'брать в долг', 'терять', 'находить'], correctIndex: 0 },
  { id: 's1-48', level: 'S1', prompt: '«Through» = ?', options: ['над', 'под', 'сквозь', 'позади'], correctIndex: 2 },
  { id: 's1-49', level: 'S1', prompt: '«Although» = ?', options: ['потому что', 'хотя', 'когда', 'если'], correctIndex: 1 },
  { id: 's1-50', level: 'S1', prompt: '«To remind» = ?', options: ['помнить сам', 'напоминать кому-то', 'забывать', 'игнорировать'], correctIndex: 1 },

  // Word formation
  { id: 's1-51', level: 'S1', prompt: 'happy → noun: _____', options: ['happiness', 'happily', 'happier', 'happity'], correctIndex: 0 },
  { id: 's1-52', level: 'S1', prompt: 'decide → noun: _____', options: ['decider', 'decidance', 'decision', 'decideness'], correctIndex: 2 },
  { id: 's1-53', level: 'S1', prompt: 'noisy → noun: _____', options: ['noise', 'noisiness', 'noisily', 'noisiest'], correctIndex: 0 },
  { id: 's1-54', level: 'S1', prompt: 'safe → adverb: _____', options: ['safely', 'safety', 'savely', 'safer'], correctIndex: 0 },

  // Used to
  { id: 's1-55', level: 'S1', prompt: 'I _____ play football when I was a child.', options: ['use to', 'used to', 'using to', 'am used to'], correctIndex: 1 },
  { id: 's1-56', level: 'S1', prompt: 'She _____ smoke, but she quit.', options: ['used to', 'is used to', 'uses', 'using to'], correctIndex: 0 },
  { id: 's1-57', level: 'S1', prompt: '_____ you _____ to live in London?', options: ['Did / use', 'Did / used', 'Do / use', 'Are / used'], correctIndex: 0 },

  // Articles tricky
  { id: 's1-58', level: 'S1', prompt: 'He plays _____ piano.', options: ['a', 'an', 'the', '—'], correctIndex: 2 },
  { id: 's1-59', level: 'S1', prompt: 'I had dinner at _____ home.', options: ['a', 'an', 'the', '—'], correctIndex: 3 },
  { id: 's1-60', level: 'S1', prompt: 'I went to _____ school by bus.', options: ['a', 'an', 'the', '—'], correctIndex: 3 },

  // Verbs + gerund/infinitive
  { id: 's1-61', level: 'S1', prompt: 'I enjoy _____ books.', options: ['read', 'to read', 'reading', 'reads'], correctIndex: 2 },
  { id: 's1-62', level: 'S1', prompt: 'I want _____ home.', options: ['go', 'to go', 'going', 'gone'], correctIndex: 1 },
  { id: 's1-63', level: 'S1', prompt: 'She avoided _____ him.', options: ['see', 'to see', 'seeing', 'seen'], correctIndex: 2 },
  { id: 's1-64', level: 'S1', prompt: 'They decided _____ to Italy.', options: ['go', 'to go', 'going', 'gone'], correctIndex: 1 },
  { id: 's1-65', level: 'S1', prompt: 'I don\'t mind _____ early.', options: ['get up', 'to get up', 'getting up', 'got up'], correctIndex: 2 },

  // So / such
  { id: 's1-66', level: 'S1', prompt: 'It was _____ a good film!', options: ['so', 'such', 'too', 'very'], correctIndex: 1 },
  { id: 's1-67', level: 'S1', prompt: 'She is _____ kind.', options: ['so', 'such', 'too', 'such a'], correctIndex: 0 },
  { id: 's1-68', level: 'S1', prompt: 'The coffee is _____ hot to drink.', options: ['so', 'such', 'too', 'very'], correctIndex: 2 },

  // Idioms intro
  { id: 's1-69', level: 'S1', prompt: '«A piece of cake» = ?', options: ['Кусок торта', 'Проще простого', 'Очень дорого', 'Долгий процесс'], correctIndex: 1 },
  { id: 's1-70', level: 'S1', prompt: '«Hit the road» = ?', options: ['Двинуться в путь', 'Удариться', 'Потеряться', 'Объехать'], correctIndex: 0 },
  { id: 's1-71', level: 'S1', prompt: '«Break the ice» = ?', options: ['Разбить лёд', 'Растопить лёд', 'Растопить обстановку', 'Замёрзнуть'], correctIndex: 2 },

  // Linking words
  { id: 's1-72', level: 'S1', prompt: 'I was tired, _____ I went home.', options: ['so', 'because', 'although', 'but'], correctIndex: 0 },
  { id: 's1-73', level: 'S1', prompt: 'I stayed _____ I was tired.', options: ['so', 'although', 'because', 'and'], correctIndex: 1 },
  { id: 's1-74', level: 'S1', prompt: 'She left _____ she felt sick.', options: ['so', 'because', 'although', 'but'], correctIndex: 1 },

  // Quantifiers tricky
  { id: 's1-75', level: 'S1', prompt: 'Hardly _____ people came.', options: ['no', 'any', 'some', 'a few'], correctIndex: 1 },
  { id: 's1-76', level: 'S1', prompt: 'Both of us _____ tired.', options: ['is', 'are', 'was', 'has'], correctIndex: 1 },
  { id: 's1-77', level: 'S1', prompt: 'Either Tom or Mike _____ wrong.', options: ['is', 'are', 'were', 'have'], correctIndex: 0 },

  // Mixed B1
  { id: 's1-78', level: 'S1', prompt: '«I am looking forward to _____ you.»', options: ['see', 'seeing', 'have seen', 'to see'], correctIndex: 1 },
  { id: 's1-79', level: 'S1', prompt: '_____ playing chess for years.', options: ['I am', 'I have been', 'I was', 'I will'], correctIndex: 1 },
  { id: 's1-80', level: 'S1', prompt: 'How long ago _____ you _____ here?', options: ['have / moved', 'did / move', 'do / move', 'are / moving'], correctIndex: 1 }
]

// ════════════════════════════════════════════════════════════════════════════
// S2 / B2 — Intermediate / Upper-Intermediate (80 questions)
// ════════════════════════════════════════════════════════════════════════════
const S2: LevelTestQuestion[] = [
  // Second conditional
  { id: 's2-1', level: 'S2', prompt: 'If I _____ rich, I _____ travel the world.', options: ['am / will', 'were / would', 'was / will', 'be / would'], correctIndex: 1 },
  { id: 's2-2', level: 'S2', prompt: 'If she _____ harder, she _____ pass.', options: ['studies / will', 'studied / would', 'study / would', 'will study / would'], correctIndex: 1 },
  { id: 's2-3', level: 'S2', prompt: 'I _____ a new car if I _____ money.', options: ['would buy / had', 'will buy / have', 'buy / had', 'bought / would have'], correctIndex: 0 },
  { id: 's2-4', level: 'S2', prompt: '«If I were you, I _____ go.»', options: ['will', 'would', 'do', 'shall'], correctIndex: 1 },
  { id: 's2-5', level: 'S2', prompt: 'What _____ you _____ if you won?', options: ['will / do', 'would / do', 'do / do', 'are / doing'], correctIndex: 1 },

  // Third conditional
  { id: 's2-6', level: 'S2', prompt: 'If you _____ told me, I _____ helped.', options: ['told / would', 'had told / would have', 'tell / will', 'would tell / had'], correctIndex: 1 },
  { id: 's2-7', level: 'S2', prompt: 'She _____ passed if she _____ studied.', options: ['would / had', 'will / has', 'would have / had', 'had / would'], correctIndex: 2 },
  { id: 's2-8', level: 'S2', prompt: 'If I _____ known, I _____ come.', options: ['had / would have', 'have / will', 'know / would', 'knew / had'], correctIndex: 0 },
  { id: 's2-9', level: 'S2', prompt: 'We _____ missed the bus if we _____ later.', options: ['would have / left', 'will / leave', 'had / left', 'would have / had left'], correctIndex: 3 },
  { id: 's2-10', level: 'S2', prompt: 'Third conditional describes…', options: ['будущее', 'настоящее', 'прошлое, что не случилось', 'привычку'], correctIndex: 2 },

  // Present perfect continuous
  { id: 's2-11', level: 'S2', prompt: 'I _____ for two hours.', options: ['wait', 'am waiting', 'have been waiting', 'waited'], correctIndex: 2 },
  { id: 's2-12', level: 'S2', prompt: 'She _____ since morning.', options: ['runs', 'is running', 'has been running', 'ran'], correctIndex: 2 },
  { id: 's2-13', level: 'S2', prompt: 'They _____ this house since 2015.', options: ['live in', 'have lived in', 'have been living in', 'lived'], correctIndex: 2 },
  { id: 's2-14', level: 'S2', prompt: 'How long _____ you _____ ?', options: ['have / studied English', 'do / study English', 'have / been studying English', 'are / studying English'], correctIndex: 2 },

  // Past perfect
  { id: 's2-15', level: 'S2', prompt: 'When I arrived, they _____ left.', options: ['have', 'has', 'had', 'were'], correctIndex: 2 },
  { id: 's2-16', level: 'S2', prompt: 'She told me she _____ him before.', options: ['saw', 'has seen', 'had seen', 'sees'], correctIndex: 2 },
  { id: 's2-17', level: 'S2', prompt: 'I _____ never _____ such a film before.', options: ['have / seen', 'had / seen', 'has / saw', 'did / see'], correctIndex: 1 },
  { id: 's2-18', level: 'S2', prompt: 'By 8am he _____ already _____ .', options: ['has / left', 'had / left', 'have / leaved', 'did / leave'], correctIndex: 1 },

  // Mixed modals (past)
  { id: 's2-19', level: 'S2', prompt: '«You could have told me» = ?', options: ['Ты мог сказать (но не сказал)', 'Ты можешь сказать', 'Ты скажешь', 'Ты сказал'], correctIndex: 0 },
  { id: 's2-20', level: 'S2', prompt: 'You _____ have called — I was worried.', options: ['should', 'must', 'can', 'will'], correctIndex: 0 },
  { id: 's2-21', level: 'S2', prompt: 'It _____ have been him — he is abroad.', options: ['couldn\'t', 'mustn\'t', 'shouldn\'t', 'wouldn\'t'], correctIndex: 0 },
  { id: 's2-22', level: 'S2', prompt: 'He _____ have won — he looks happy.', options: ['must', 'mustn\'t', 'shouldn\'t', 'won\'t'], correctIndex: 0 },
  { id: 's2-23', level: 'S2', prompt: 'You _____ have done it differently.', options: ['might', 'must', 'will', 'are'], correctIndex: 0 },

  // Reported speech complex
  { id: 's2-24', level: 'S2', prompt: 'He asked me _____ I lived.', options: ['where', 'that', 'what', 'how'], correctIndex: 0 },
  { id: 's2-25', level: 'S2', prompt: 'She asked _____ I needed help.', options: ['if', 'that', 'when', 'how'], correctIndex: 0 },
  { id: 's2-26', level: 'S2', prompt: '«I have seen it.» → He said he _____ it.', options: ['has seen', 'had seen', 'sees', 'saw'], correctIndex: 1 },
  { id: 's2-27', level: 'S2', prompt: '«I went there.» → She said she _____ there.', options: ['went', 'has gone', 'had gone', 'goes'], correctIndex: 2 },

  // Passive complex
  { id: 's2-28', level: 'S2', prompt: 'The Mona Lisa _____ by Da Vinci.', options: ['painted', 'is painted', 'was painted', 'has painted'], correctIndex: 2 },
  { id: 's2-29', level: 'S2', prompt: 'The road _____ at the moment.', options: ['repairs', 'is repaired', 'is being repaired', 'has repaired'], correctIndex: 2 },
  { id: 's2-30', level: 'S2', prompt: 'The book _____ since last week.', options: ['has read', 'has been read', 'was reading', 'reads'], correctIndex: 1 },
  { id: 's2-31', level: 'S2', prompt: 'Coffee _____ grown in Brazil.', options: ['is', 'are', 'has', 'was'], correctIndex: 0 },

  // Causative
  { id: 's2-32', level: 'S2', prompt: 'I _____ my hair _____ yesterday.', options: ['had / cut', 'have / cut', 'got / cutting', 'made / cut'], correctIndex: 0 },
  { id: 's2-33', level: 'S2', prompt: 'She _____ her car _____ at the garage.', options: ['repairs / fixed', 'has / fixed', 'made / fix', 'gets / fix'], correctIndex: 1 },

  // Wishes / I would rather
  { id: 's2-34', level: 'S2', prompt: 'I wish I _____ taller.', options: ['am', 'were', 'will be', 'have been'], correctIndex: 1 },
  { id: 's2-35', level: 'S2', prompt: 'I wish I _____ that.', options: ['didn\'t say', 'hadn\'t said', 'haven\'t said', 'don\'t say'], correctIndex: 1 },
  { id: 's2-36', level: 'S2', prompt: 'I\'d rather _____ at home.', options: ['stay', 'to stay', 'staying', 'stayed'], correctIndex: 0 },
  { id: 's2-37', level: 'S2', prompt: 'I\'d rather you _____ here.', options: ['stayed', 'stay', 'staying', 'to stay'], correctIndex: 0 },

  // Phrasal verbs advanced
  { id: 's2-38', level: 'S2', prompt: '«To put up with» = ?', options: ['предложить', 'мириться с', 'наряжать', 'воспитывать'], correctIndex: 1 },
  { id: 's2-39', level: 'S2', prompt: '«To come across» = ?', options: ['наткнуться, обнаружить', 'переходить', 'возвращаться', 'переплывать'], correctIndex: 0 },
  { id: 's2-40', level: 'S2', prompt: '«To get on with» = ?', options: ['садиться в', 'ладить с', 'продолжать', 'спорить'], correctIndex: 1 },
  { id: 's2-41', level: 'S2', prompt: '«To run out of» = ?', options: ['выбежать', 'избегать', 'закончиться (запас)', 'превышать'], correctIndex: 2 },
  { id: 's2-42', level: 'S2', prompt: '«To look forward to» + …', options: ['inf', 'gerund (-ing)', 'past', 'noun only'], correctIndex: 1 },

  // Idioms
  { id: 's2-43', level: 'S2', prompt: '«Once in a blue moon» = ?', options: ['Очень редко', 'Часто', 'Никогда', 'Один раз в жизни'], correctIndex: 0 },
  { id: 's2-44', level: 'S2', prompt: '«Cost an arm and a leg» = ?', options: ['Дёшево', 'Невозможно', 'Очень дорого', 'Опасно'], correctIndex: 2 },
  { id: 's2-45', level: 'S2', prompt: '«Under the weather» = ?', options: ['Промок', 'Неважно себя чувствую', 'Загорает', 'Прячется'], correctIndex: 1 },
  { id: 's2-46', level: 'S2', prompt: '«To spill the beans» = ?', options: ['Готовить', 'Уронить', 'Выдать секрет', 'Опоздать'], correctIndex: 2 },
  { id: 's2-47', level: 'S2', prompt: '«Hit the nail on the head» = ?', options: ['Попасть в точку', 'Удариться', 'Сломать', 'Заколотить'], correctIndex: 0 },

  // Collocations
  { id: 's2-48', level: 'S2', prompt: '«Make» or «do» a decision?', options: ['make', 'do', 'take', 'have'], correctIndex: 0 },
  { id: 's2-49', level: 'S2', prompt: '«Make» or «do» homework?', options: ['make', 'do', 'take', 'have'], correctIndex: 1 },
  { id: 's2-50', level: 'S2', prompt: '«Take» or «have» a shower?', options: ['take', 'do', 'make', 'either take or have'], correctIndex: 3 },
  { id: 's2-51', level: 'S2', prompt: '_____ a party (устроить вечеринку)', options: ['make', 'do', 'have', 'take'], correctIndex: 2 },
  { id: 's2-52', level: 'S2', prompt: '_____ a mistake', options: ['make', 'do', 'have', 'take'], correctIndex: 0 },
  { id: 's2-53', level: 'S2', prompt: '_____ a photo', options: ['make', 'do', 'have', 'take'], correctIndex: 3 },

  // Vocabulary upper-int
  { id: 's2-54', level: 'S2', prompt: '«Eventually» = ?', options: ['возможно', 'в итоге', 'случайно', 'обычно'], correctIndex: 1 },
  { id: 's2-55', level: 'S2', prompt: '«Hardly ever» = ?', options: ['тяжело', 'почти никогда', 'часто', 'усердно'], correctIndex: 1 },
  { id: 's2-56', level: 'S2', prompt: '«To deal with» = ?', options: ['торговать', 'справляться с', 'игнорировать', 'продавать'], correctIndex: 1 },
  { id: 's2-57', level: 'S2', prompt: '«Whereas» = ?', options: ['тогда как', 'хотя', 'поскольку', 'кроме того'], correctIndex: 0 },
  { id: 's2-58', level: 'S2', prompt: '«To carry out» = ?', options: ['нести', 'выполнять, проводить', 'выносить', 'продолжать'], correctIndex: 1 },
  { id: 's2-59', level: 'S2', prompt: '«To bring up» = ?', options: ['принести наверх', 'воспитывать', 'обсуждать', 'и 2, и 3'], correctIndex: 3 },

  // Articles tricky
  { id: 's2-60', level: 'S2', prompt: 'He is in _____ hospital. (как пациент)', options: ['a', 'an', 'the', '—'], correctIndex: 3 },
  { id: 's2-61', level: 'S2', prompt: 'Mary went to _____ Alps.', options: ['a', 'an', 'the', '—'], correctIndex: 2 },
  { id: 's2-62', level: 'S2', prompt: 'I love _____ Beatles.', options: ['a', 'an', 'the', '—'], correctIndex: 2 },

  // Inversion/emphasis basics
  { id: 's2-63', level: 'S2', prompt: 'Not only _____ but also amazed.', options: ['I was', 'was I', 'I am', 'am I'], correctIndex: 1 },
  { id: 's2-64', level: 'S2', prompt: 'Never _____ such a sight.', options: ['I saw', 'have I seen', 'I have seen', 'saw I'], correctIndex: 1 },

  // Linking
  { id: 's2-65', level: 'S2', prompt: '_____ the rain, we went out.', options: ['Despite', 'Although', 'Because', 'Even'], correctIndex: 0 },
  { id: 's2-66', level: 'S2', prompt: '_____ it was raining, we went out.', options: ['Despite', 'Although', 'In spite', 'In case'], correctIndex: 1 },
  { id: 's2-67', level: 'S2', prompt: 'I took an umbrella _____ it rained.', options: ['in case', 'unless', 'whether', 'as long'], correctIndex: 0 },
  { id: 's2-68', level: 'S2', prompt: 'You can\'t enter _____ you have a ticket.', options: ['unless', 'until', 'if', 'in case'], correctIndex: 0 },

  // Future forms
  { id: 's2-69', level: 'S2', prompt: 'The train _____ at 6.', options: ['leaves', 'will leave', 'is leaving', 'will be leaving'], correctIndex: 0 },
  { id: 's2-70', level: 'S2', prompt: 'By 2030 we _____ on Mars.', options: ['live', 'will be living', 'are living', 'have lived'], correctIndex: 1 },
  { id: 's2-71', level: 'S2', prompt: 'By next year I _____ this course.', options: ['finish', 'will finish', 'will have finished', 'am finishing'], correctIndex: 2 },

  // Quantifiers / determiners
  { id: 's2-72', level: 'S2', prompt: 'There is hardly _____ time left.', options: ['no', 'any', 'some', 'a little'], correctIndex: 1 },
  { id: 's2-73', level: 'S2', prompt: '_____ of them came.', options: ['Both', 'Neither', 'Each', 'All'], correctIndex: 1 },
  { id: 's2-74', level: 'S2', prompt: 'I have _____ good news.', options: ['some', 'any', 'many', 'few'], correctIndex: 0 },

  // Mixed
  { id: 's2-75', level: 'S2', prompt: 'She suggested _____ a film.', options: ['watch', 'to watch', 'watching', 'watched'], correctIndex: 2 },
  { id: 's2-76', level: 'S2', prompt: 'He admitted _____ the cake.', options: ['eat', 'to eat', 'eating', 'eaten'], correctIndex: 2 },
  { id: 's2-77', level: 'S2', prompt: 'I refuse _____ this.', options: ['accept', 'to accept', 'accepting', 'accepted'], correctIndex: 1 },
  { id: 's2-78', level: 'S2', prompt: 'It is no use _____ now.', options: ['try', 'to try', 'trying', 'tried'], correctIndex: 2 },
  { id: 's2-79', level: 'S2', prompt: 'He is used to _____ early.', options: ['get up', 'getting up', 'got up', 'gets up'], correctIndex: 1 },
  { id: 's2-80', level: 'S2', prompt: 'There is no point _____ about it.', options: ['talk', 'to talk', 'talking', 'in talking either OK'], correctIndex: 3 }
]

// ════════════════════════════════════════════════════════════════════════════
// F1 / C1 — Advanced (80 questions)
// ════════════════════════════════════════════════════════════════════════════
const F1: LevelTestQuestion[] = [
  // Inversion
  { id: 'f1-1', level: 'F1', prompt: 'Hardly _____ when the phone rang.', options: ['I had arrived', 'had I arrived', 'I arrived', 'I have arrived'], correctIndex: 1 },
  { id: 'f1-2', level: 'F1', prompt: 'No sooner _____ home than it started raining.', options: ['I got', 'had I got', 'got I', 'I had got'], correctIndex: 1 },
  { id: 'f1-3', level: 'F1', prompt: 'Seldom _____ such generosity.', options: ['I see', 'do I see', 'I have seen', 'I am seeing'], correctIndex: 1 },
  { id: 'f1-4', level: 'F1', prompt: 'Not only _____ late, but he was also rude.', options: ['he was', 'was he', 'he is', 'is he'], correctIndex: 1 },
  { id: 'f1-5', level: 'F1', prompt: 'Only after _____ the truth, did I forgive him.', options: ['hearing', 'I heard', 'I had heard', 'to hear'], correctIndex: 0 },
  { id: 'f1-6', level: 'F1', prompt: 'Little _____ that we were being watched.', options: ['we knew', 'did we know', 'we did know', 'knew we'], correctIndex: 1 },
  { id: 'f1-7', level: 'F1', prompt: 'Under no circumstances _____ this office.', options: ['you should leave', 'should you leave', 'you leave', 'leave you'], correctIndex: 1 },

  // Cleft sentences
  { id: 'f1-8', level: 'F1', prompt: '_____ was Anna who solved it.', options: ['That', 'It', 'There', 'This'], correctIndex: 1 },
  { id: 'f1-9', level: 'F1', prompt: '_____ I love most is the silence.', options: ['That', 'What', 'Which', 'Where'], correctIndex: 1 },
  { id: 'f1-10', level: 'F1', prompt: 'The reason _____ I called is to apologise.', options: ['why', 'because', 'that', 'as'], correctIndex: 0 },
  { id: 'f1-11', level: 'F1', prompt: 'It _____ in 1815 that Waterloo was fought.', options: ['was', 'is', 'has been', 'had been'], correctIndex: 0 },

  // Subjunctive / unreal
  { id: 'f1-12', level: 'F1', prompt: 'I suggest that he _____ on time.', options: ['be', 'is', 'was', 'has been'], correctIndex: 0 },
  { id: 'f1-13', level: 'F1', prompt: 'It is essential that she _____ the news.', options: ['knew', 'know', 'knows', 'has known'], correctIndex: 1 },
  { id: 'f1-14', level: 'F1', prompt: 'If only I _____ younger.', options: ['am', 'were', 'will be', 'have been'], correctIndex: 1 },
  { id: 'f1-15', level: 'F1', prompt: 'He demanded that she _____ at once.', options: ['leaves', 'leave', 'left', 'has left'], correctIndex: 1 },

  // Advanced phrasal verbs
  { id: 'f1-16', level: 'F1', prompt: '«To stem from» = ?', options: ['происходить из', 'отказываться от', 'продолжать', 'останавливать'], correctIndex: 0 },
  { id: 'f1-17', level: 'F1', prompt: '«To wear off» = ?', options: ['износиться', 'постепенно исчезать', 'надевать', 'отменять'], correctIndex: 1 },
  { id: 'f1-18', level: 'F1', prompt: '«To go through with» = ?', options: ['пройти через', 'довести до конца', 'просматривать', 'забывать'], correctIndex: 1 },
  { id: 'f1-19', level: 'F1', prompt: '«To live up to» = ?', options: ['жить ради', 'соответствовать (ожиданиям)', 'выживать', 'переезжать'], correctIndex: 1 },
  { id: 'f1-20', level: 'F1', prompt: '«To boil down to» = ?', options: ['кипятить', 'сводиться к', 'упрощаться', 'и 2 и 3'], correctIndex: 3 },
  { id: 'f1-21', level: 'F1', prompt: '«To put forward» (a proposal) = ?', options: ['отодвинуть', 'выдвинуть', 'отменить', 'продлить'], correctIndex: 1 },
  { id: 'f1-22', level: 'F1', prompt: '«To bring about» = ?', options: ['принести', 'приводить к', 'обсуждать', 'разговаривать'], correctIndex: 1 },

  // Idioms native
  { id: 'f1-23', level: 'F1', prompt: '«Bite the bullet» = ?', options: ['Сопротивляться', 'Стиснуть зубы и сделать', 'Промахнуться', 'Ранить'], correctIndex: 1 },
  { id: 'f1-24', level: 'F1', prompt: '«Burn the midnight oil» = ?', options: ['Тратить деньги', 'Работать допоздна', 'Сжигать мосты', 'Опаздывать'], correctIndex: 1 },
  { id: 'f1-25', level: 'F1', prompt: '«Cut to the chase» = ?', options: ['Догонять', 'Перейти к сути', 'Обрезать', 'Гнаться за'], correctIndex: 1 },
  { id: 'f1-26', level: 'F1', prompt: '«Beat around the bush» = ?', options: ['Биться с кустами', 'Ходить вокруг да около', 'Преуспевать', 'Прятаться'], correctIndex: 1 },
  { id: 'f1-27', level: 'F1', prompt: '«Throw in the towel» = ?', options: ['Бросить полотенце', 'Сдаться', 'Уехать в отпуск', 'Устроить вечеринку'], correctIndex: 1 },
  { id: 'f1-28', level: 'F1', prompt: '«To rain on someone\'s parade» = ?', options: ['Подвезти', 'Испортить настрой', 'Поддержать', 'Удивить'], correctIndex: 1 },
  { id: 'f1-29', level: 'F1', prompt: '«To go down a treat» = ?', options: ['Понизиться', 'Очень понравиться', 'Угоститься', 'Обмануть'], correctIndex: 1 },

  // Advanced vocabulary
  { id: 'f1-30', level: 'F1', prompt: '«To exacerbate» = ?', options: ['облегчить', 'усугубить', 'устранить', 'оправдать'], correctIndex: 1 },
  { id: 'f1-31', level: 'F1', prompt: '«Ubiquitous» = ?', options: ['редкий', 'вездесущий', 'странный', 'неизвестный'], correctIndex: 1 },
  { id: 'f1-32', level: 'F1', prompt: '«Plethora of» = ?', options: ['недостаток', 'избыток, множество', 'один', 'нет'], correctIndex: 1 },
  { id: 'f1-33', level: 'F1', prompt: '«Mitigate» = ?', options: ['усилить', 'смягчить', 'игнорировать', 'отменить'], correctIndex: 1 },
  { id: 'f1-34', level: 'F1', prompt: '«Inevitable» = ?', options: ['желательный', 'неизбежный', 'случайный', 'возможный'], correctIndex: 1 },
  { id: 'f1-35', level: 'F1', prompt: '«To advocate (something)» = ?', options: ['быть против', 'отстаивать, поддерживать', 'избегать', 'забывать'], correctIndex: 1 },
  { id: 'f1-36', level: 'F1', prompt: '«Cunning» = ?', options: ['честный', 'хитрый', 'трусливый', 'наивный'], correctIndex: 1 },
  { id: 'f1-37', level: 'F1', prompt: '«To procrastinate» = ?', options: ['откладывать', 'спешить', 'провозглашать', 'отрицать'], correctIndex: 0 },
  { id: 'f1-38', level: 'F1', prompt: '«Implication» = ?', options: ['прямое заявление', 'подразумевание / последствие', 'просьба', 'отказ'], correctIndex: 1 },
  { id: 'f1-39', level: 'F1', prompt: '«To scrutinize» = ?', options: ['критиковать', 'тщательно изучать', 'игнорировать', 'хвалить'], correctIndex: 1 },

  // Collocations advanced
  { id: 'f1-40', level: 'F1', prompt: '_____ a conclusion (прийти к)', options: ['make', 'do', 'reach', 'go'], correctIndex: 2 },
  { id: 'f1-41', level: 'F1', prompt: '_____ a difference (изменить ситуацию)', options: ['do', 'make', 'have', 'take'], correctIndex: 1 },
  { id: 'f1-42', level: 'F1', prompt: '_____ progress', options: ['do', 'make', 'have', 'take'], correctIndex: 1 },
  { id: 'f1-43', level: 'F1', prompt: '_____ an opinion (выразить мнение)', options: ['express', 'tell', 'do', 'say'], correctIndex: 0 },
  { id: 'f1-44', level: 'F1', prompt: '_____ attention', options: ['do', 'make', 'pay', 'have'], correctIndex: 2 },

  // Discourse markers
  { id: 'f1-45', level: 'F1', prompt: '«Notwithstanding» = ?', options: ['однако, несмотря на', 'кроме того', 'затем', 'потому'], correctIndex: 0 },
  { id: 'f1-46', level: 'F1', prompt: '«Albeit» = ?', options: ['всегда', 'хотя', 'возможно', 'кроме того'], correctIndex: 1 },
  { id: 'f1-47', level: 'F1', prompt: '«Henceforth» = ?', options: ['отныне', 'однако', 'отсюда (с этого места)', 'наоборот'], correctIndex: 0 },
  { id: 'f1-48', level: 'F1', prompt: '«Inasmuch as» = ?', options: ['поскольку', 'постоянно', 'однажды', 'тем не менее'], correctIndex: 0 },

  // Future-perfect / advanced tenses
  { id: 'f1-49', level: 'F1', prompt: 'By 2030, scientists _____ a cure.', options: ['will find', 'will have found', 'have found', 'find'], correctIndex: 1 },
  { id: 'f1-50', level: 'F1', prompt: 'By next month, I _____ here for ten years.', options: ['work', 'will work', 'will have been working', 'have been working'], correctIndex: 2 },
  { id: 'f1-51', level: 'F1', prompt: 'She _____ in Berlin for six years by next June.', options: ['lives', 'will live', 'will have lived', 'has lived'], correctIndex: 2 },

  // Mixed conditional
  { id: 'f1-52', level: 'F1', prompt: 'If you _____ to the party, you _____ him now.', options: ['went / would know', 'had gone / would know', 'go / will know', 'went / knew'], correctIndex: 1 },
  { id: 'f1-53', level: 'F1', prompt: 'If she _____ tall, she _____ a model.', options: ['were / would have been', 'was / would', 'had been / would be', 'were / would be'], correctIndex: 3 },

  // Reduced relative clauses
  { id: 'f1-54', level: 'F1', prompt: 'The book _____ on the table is mine.', options: ['lying', 'lays', 'who lies', 'that lays'], correctIndex: 0 },
  { id: 'f1-55', level: 'F1', prompt: 'People _____ in cities live faster.', options: ['live', 'living', 'lived', 'are living'], correctIndex: 1 },

  // Passive advanced
  { id: 'f1-56', level: 'F1', prompt: 'He is said _____ a millionaire.', options: ['to be', 'being', 'is', 'be'], correctIndex: 0 },
  { id: 'f1-57', level: 'F1', prompt: 'They are reported _____ found the cure.', options: ['to have', 'having', 'to having', 'have'], correctIndex: 0 },
  { id: 'f1-58', level: 'F1', prompt: 'The thief is believed _____ already.', options: ['to escape', 'to have escaped', 'escaping', 'has escaped'], correctIndex: 1 },

  // Subtle vocab nuance
  { id: 'f1-59', level: 'F1', prompt: '«Eligible» = ?', options: ['неприемлемый', 'подходящий, имеющий право', 'обязательный', 'опытный'], correctIndex: 1 },
  { id: 'f1-60', level: 'F1', prompt: '«Discreet» (not «discrete») = ?', options: ['осмотрительный', 'отдельный', 'тихий', 'честный'], correctIndex: 0 },
  { id: 'f1-61', level: 'F1', prompt: '«Compliment» vs «complement» — «дополнять» это…', options: ['compliment', 'complement', 'either', 'neither'], correctIndex: 1 },
  { id: 'f1-62', level: 'F1', prompt: '«Affect» = глагол, означает…', options: ['влиять', 'эффект (сущ.)', 'отрицать', 'предполагать'], correctIndex: 0 },
  { id: 'f1-63', level: 'F1', prompt: '«Effect» используется как…', options: ['глагол всегда', 'существительное обычно', 'прилагательное', 'наречие'], correctIndex: 1 },

  // Style / register
  { id: 'f1-64', level: 'F1', prompt: 'Formal: «I would like to inform you that…» — informal version?', options: ['Just so you know…', 'I beg to inform', 'Be it known', 'Hereby announce'], correctIndex: 0 },
  { id: 'f1-65', level: 'F1', prompt: 'Formal email opening (don\'t know recipient): «Dear _____ ,»', options: ['Sir', 'Friend', 'Sir or Madam', 'Hi'], correctIndex: 2 },
  { id: 'f1-66', level: 'F1', prompt: 'Formal close (don\'t know name): «Yours _____»', options: ['sincerely', 'truly', 'faithfully', 'cordially'], correctIndex: 2 },

  // Tag questions
  { id: 'f1-67', level: 'F1', prompt: 'You haven\'t met him, _____ ?', options: ['have you', 'haven\'t you', 'do you', 'don\'t you'], correctIndex: 0 },
  { id: 'f1-68', level: 'F1', prompt: 'Let\'s go, _____ ?', options: ['shall we', 'will we', 'do we', 'aren\'t we'], correctIndex: 0 },
  { id: 'f1-69', level: 'F1', prompt: 'Nobody called, _____ ?', options: ['did they', 'didn\'t they', 'did he', 'didn\'t he'], correctIndex: 0 },

  // Advanced reading inference
  { id: 'f1-70', level: 'F1', prompt: '«She managed to finish.» = ?', options: ['Хотела закончить', 'Сумела закончить (с усилием)', 'Не закончила', 'Управляет ею'], correctIndex: 1 },
  { id: 'f1-71', level: 'F1', prompt: '«He is reluctant to leave.» = ?', options: ['Хочет уйти', 'Не хочет уходить', 'Готов уйти', 'Запрещено уходить'], correctIndex: 1 },
  { id: 'f1-72', level: 'F1', prompt: '«He yielded.» = ?', options: ['победил', 'уступил', 'отказался', 'попросил'], correctIndex: 1 },
  { id: 'f1-73', level: 'F1', prompt: '«Lest he forget» = ?', options: ['Когда он забудет', 'Чтобы он не забыл', 'Поскольку он забыл', 'Хотя он забыл'], correctIndex: 1 },

  // Mixed tricky
  { id: 'f1-74', level: 'F1', prompt: '«Whom» is used after…', options: ['subject', 'preposition or as object', 'always', 'only formal SMS'], correctIndex: 1 },
  { id: 'f1-75', level: 'F1', prompt: 'It was high time he _____ that.', options: ['does', 'did', 'done', 'has done'], correctIndex: 1 },
  { id: 'f1-76', level: 'F1', prompt: 'Would that I _____ younger!', options: ['am', 'were', 'will be', 'be'], correctIndex: 1 },
  { id: 'f1-77', level: 'F1', prompt: '«By and large» = ?', options: ['большой', 'в целом', 'постепенно', 'отдельно'], correctIndex: 1 },
  { id: 'f1-78', level: 'F1', prompt: '«In a nutshell» = ?', options: ['замкнутый', 'вкратце', 'тайно', 'опасно'], correctIndex: 1 },
  { id: 'f1-79', level: 'F1', prompt: '«To touch base» = ?', options: ['тронуть', 'связаться', 'подтвердить', 'основа'], correctIndex: 1 },
  { id: 'f1-80', level: 'F1', prompt: '«To pull the wool over someone\'s eyes» = ?', options: ['Натянуть шапку', 'Обмануть', 'Защитить', 'Согреть'], correctIndex: 1 }
]

export const LEVEL_TEST_POOL: LevelTestQuestion[] = [...A1, ...A2, ...S1, ...S2, ...F1]
