/**
 * Pronunciation practice decks for Lingafon AI-tutor.
 * Each deck targets a level + topic, with British English phonetics.
 *
 * When real DB lands: replace with Supabase query of PronunciationCard table.
 */

export type PracticeKind = 'WORD' | 'PHRASE' | 'MIN_PAIR'

export interface PronunciationCard {
  id: string
  kind: PracticeKind
  /** the English text the student must say aloud */
  target: string
  /** IPA transcription, British accent */
  ipa: string
  /** Russian translation */
  translation: string
  /** Optional example sentence using the target */
  example?: string
}

export interface PracticeDeck {
  id: string
  level: 'A1' | 'A2' | 'S1' | 'S2' | 'B2'
  title: string
  description: string
  emoji: string
  cards: PronunciationCard[]
}

export const PRACTICE_DECKS: PracticeDeck[] = [
  // ════════════════════════════════════════════════════════════════════
  // A1 — STARTER
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'deck-a1-numbers',
    level: 'A1',
    title: 'Numbers 1-20',
    description: 'Произношение чисел от 1 до 20 + основы счёта',
    emoji: '🔢',
    cards: [
      { id: 'n1', kind: 'WORD', target: 'One', ipa: '/wʌn/', translation: 'один' },
      { id: 'n2', kind: 'WORD', target: 'Two', ipa: '/tuː/', translation: 'два' },
      { id: 'n3', kind: 'WORD', target: 'Three', ipa: '/θriː/', translation: 'три', example: 'Three trees on the hill.' },
      { id: 'n4', kind: 'WORD', target: 'Four', ipa: '/fɔː/', translation: 'четыре' },
      { id: 'n5', kind: 'WORD', target: 'Five', ipa: '/faɪv/', translation: 'пять' },
      { id: 'n6', kind: 'WORD', target: 'Seven', ipa: '/ˈsevn/', translation: 'семь' },
      { id: 'n7', kind: 'WORD', target: 'Eight', ipa: '/eɪt/', translation: 'восемь', example: 'I wake up at eight.' },
      { id: 'n8', kind: 'WORD', target: 'Eleven', ipa: '/ɪˈlevn/', translation: 'одиннадцать' },
      { id: 'n9', kind: 'WORD', target: 'Twelve', ipa: '/twelv/', translation: 'двенадцать' },
      { id: 'n10', kind: 'WORD', target: 'Thirteen', ipa: '/θɜːˈtiːn/', translation: 'тринадцать' },
      { id: 'n11', kind: 'WORD', target: 'Twenty', ipa: '/ˈtwenti/', translation: 'двадцать' },
      { id: 'n12', kind: 'PHRASE', target: 'I am ten years old.', ipa: '/aɪ æm ten jɪəz əʊld/', translation: 'Мне десять лет.' }
    ]
  },
  {
    id: 'deck-a1-colors',
    level: 'A1',
    title: 'Colors',
    description: 'Основные цвета — для описаний и игр',
    emoji: '🎨',
    cards: [
      { id: 'col1', kind: 'WORD', target: 'Red', ipa: '/red/', translation: 'красный' },
      { id: 'col2', kind: 'WORD', target: 'Blue', ipa: '/bluː/', translation: 'синий', example: 'The sky is blue.' },
      { id: 'col3', kind: 'WORD', target: 'Green', ipa: '/ɡriːn/', translation: 'зелёный' },
      { id: 'col4', kind: 'WORD', target: 'Yellow', ipa: '/ˈjeləʊ/', translation: 'жёлтый', example: 'A yellow sun.' },
      { id: 'col5', kind: 'WORD', target: 'Black', ipa: '/blæk/', translation: 'чёрный' },
      { id: 'col6', kind: 'WORD', target: 'White', ipa: '/waɪt/', translation: 'белый' },
      { id: 'col7', kind: 'WORD', target: 'Orange', ipa: '/ˈɒrɪndʒ/', translation: 'оранжевый' },
      { id: 'col8', kind: 'WORD', target: 'Purple', ipa: '/ˈpɜːpl/', translation: 'фиолетовый' },
      { id: 'col9', kind: 'WORD', target: 'Brown', ipa: '/braʊn/', translation: 'коричневый' },
      { id: 'col10', kind: 'PHRASE', target: 'My favourite colour is blue.', ipa: '/maɪ ˈfeɪvərɪt ˈkʌlə ɪz bluː/', translation: 'Мой любимый цвет — синий.' }
    ]
  },
  {
    id: 'deck-a1-family',
    level: 'A1',
    title: 'Family members',
    description: 'Слова о семье — мама, папа, брат, сестра',
    emoji: '👨‍👩‍👧',
    cards: [
      { id: 'fam1', kind: 'WORD', target: 'Mother', ipa: '/ˈmʌðə/', translation: 'мама' },
      { id: 'fam2', kind: 'WORD', target: 'Father', ipa: '/ˈfɑːðə/', translation: 'папа' },
      { id: 'fam3', kind: 'WORD', target: 'Brother', ipa: '/ˈbrʌðə/', translation: 'брат' },
      { id: 'fam4', kind: 'WORD', target: 'Sister', ipa: '/ˈsɪstə/', translation: 'сестра' },
      { id: 'fam5', kind: 'WORD', target: 'Grandmother', ipa: '/ˈɡrænˌmʌðə/', translation: 'бабушка' },
      { id: 'fam6', kind: 'WORD', target: 'Grandfather', ipa: '/ˈɡrænˌfɑːðə/', translation: 'дедушка' },
      { id: 'fam7', kind: 'WORD', target: 'Aunt', ipa: '/ɑːnt/', translation: 'тётя', example: 'My aunt lives in London.' },
      { id: 'fam8', kind: 'WORD', target: 'Uncle', ipa: '/ˈʌŋkl/', translation: 'дядя' },
      { id: 'fam9', kind: 'WORD', target: 'Cousin', ipa: '/ˈkʌzn/', translation: 'двоюродный брат/сестра' },
      { id: 'fam10', kind: 'WORD', target: 'Daughter', ipa: '/ˈdɔːtə/', translation: 'дочь' },
      { id: 'fam11', kind: 'PHRASE', target: 'I have one brother.', ipa: '/aɪ hæv wʌn ˈbrʌðə/', translation: 'У меня есть один брат.' },
      { id: 'fam12', kind: 'PHRASE', target: 'This is my mother.', ipa: '/ðɪs ɪz maɪ ˈmʌðə/', translation: 'Это моя мама.' }
    ]
  },
  {
    id: 'deck-a1-food',
    level: 'A1',
    title: 'Basic food',
    description: 'Базовая еда и напитки',
    emoji: '🍎',
    cards: [
      { id: 'fd1', kind: 'WORD', target: 'Apple', ipa: '/ˈæpl/', translation: 'яблоко' },
      { id: 'fd2', kind: 'WORD', target: 'Bread', ipa: '/bred/', translation: 'хлеб', example: 'I eat bread for breakfast.' },
      { id: 'fd3', kind: 'WORD', target: 'Cheese', ipa: '/tʃiːz/', translation: 'сыр' },
      { id: 'fd4', kind: 'WORD', target: 'Milk', ipa: '/mɪlk/', translation: 'молоко' },
      { id: 'fd5', kind: 'WORD', target: 'Water', ipa: '/ˈwɔːtə/', translation: 'вода', example: 'A glass of water, please.' },
      { id: 'fd6', kind: 'WORD', target: 'Tea', ipa: '/tiː/', translation: 'чай', example: 'Tea, please. (British classic)' },
      { id: 'fd7', kind: 'WORD', target: 'Coffee', ipa: '/ˈkɒfi/', translation: 'кофе' },
      { id: 'fd8', kind: 'WORD', target: 'Chocolate', ipa: '/ˈtʃɒklət/', translation: 'шоколад' },
      { id: 'fd9', kind: 'WORD', target: 'Banana', ipa: '/bəˈnɑːnə/', translation: 'банан' },
      { id: 'fd10', kind: 'WORD', target: 'Chicken', ipa: '/ˈtʃɪkɪn/', translation: 'курица' },
      { id: 'fd11', kind: 'PHRASE', target: 'I like pizza.', ipa: '/aɪ laɪk ˈpiːtsə/', translation: 'Я люблю пиццу.' },
      { id: 'fd12', kind: 'PHRASE', target: 'Can I have some water?', ipa: '/kæn aɪ hæv sʌm ˈwɔːtə/', translation: 'Можно мне воды?' }
    ]
  },

  // ════════════════════════════════════════════════════════════════════
  // A2 — ELEMENTARY
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'deck-a2-daily',
    level: 'A2',
    title: 'Daily routines',
    description: 'Базовые слова и фразы про повседневную жизнь',
    emoji: '☀️',
    cards: [
      { id: 'c1', kind: 'WORD', target: 'Breakfast', ipa: '/ˈbrekfəst/', translation: 'завтрак', example: 'I have breakfast at 7.' },
      { id: 'c2', kind: 'WORD', target: 'Schedule', ipa: '/ˈʃedjuːl/', translation: 'расписание', example: 'My schedule is busy.' },
      { id: 'c3', kind: 'WORD', target: 'Weather', ipa: '/ˈweðə/', translation: 'погода', example: 'The weather is lovely.' },
      { id: 'c4', kind: 'PHRASE', target: 'How are you today?', ipa: '/haʊ ɑː juː təˈdeɪ/', translation: 'Как ты сегодня?', example: '— How are you today? — I\'m fine, thanks.' },
      { id: 'c5', kind: 'PHRASE', target: 'I usually wake up early.', ipa: '/aɪ ˈjuːʒəli weɪk ʌp ˈɜːli/', translation: 'Я обычно встаю рано.' },
      { id: 'c6', kind: 'WORD', target: 'Library', ipa: '/ˈlaɪbrəri/', translation: 'библиотека', example: 'I read in the library.' },
      { id: 'c7', kind: 'WORD', target: 'Vegetable', ipa: '/ˈvedʒtəbl/', translation: 'овощ', example: 'I love vegetables.' },
      { id: 'c8', kind: 'PHRASE', target: 'See you tomorrow.', ipa: '/siː juː təˈmɒrəʊ/', translation: 'Увидимся завтра.' }
    ]
  },
  {
    id: 'deck-a2-travel',
    level: 'A2',
    title: 'Travel phrases',
    description: 'Фразы для путешествий и аэропорта',
    emoji: '✈️',
    cards: [
      { id: 't1', kind: 'PHRASE', target: 'Where is the bus stop?', ipa: '/weər ɪz ðə ˈbʌs stɒp/', translation: 'Где автобусная остановка?' },
      { id: 't2', kind: 'PHRASE', target: 'I would like a coffee, please.', ipa: '/aɪ wʊd laɪk ə ˈkɒfi pliːz/', translation: 'Я бы хотел кофе, пожалуйста.' },
      { id: 't3', kind: 'WORD', target: 'Passport', ipa: '/ˈpɑːspɔːt/', translation: 'паспорт' },
      { id: 't4', kind: 'WORD', target: 'Luggage', ipa: '/ˈlʌɡɪdʒ/', translation: 'багаж' },
      { id: 't5', kind: 'PHRASE', target: 'How much does it cost?', ipa: '/haʊ mʌtʃ dʌz ɪt kɒst/', translation: 'Сколько это стоит?' },
      { id: 't6', kind: 'PHRASE', target: 'Excuse me, can you help me?', ipa: '/ɪkˈskjuːz miː kæn juː help miː/', translation: 'Извините, не могли бы вы помочь?' }
    ]
  },
  {
    id: 'deck-a2-pairs',
    level: 'A2',
    title: 'Minimal pairs — ship vs sheep',
    description: 'Тренируй различение похожих звуков (/ɪ/ vs /iː/)',
    emoji: '🎯',
    cards: [
      { id: 'p1', kind: 'MIN_PAIR', target: 'Ship', ipa: '/ʃɪp/', translation: 'корабль' },
      { id: 'p2', kind: 'MIN_PAIR', target: 'Sheep', ipa: '/ʃiːp/', translation: 'овца' },
      { id: 'p3', kind: 'MIN_PAIR', target: 'Bit', ipa: '/bɪt/', translation: 'кусочек' },
      { id: 'p4', kind: 'MIN_PAIR', target: 'Beat', ipa: '/biːt/', translation: 'бить, ритм' },
      { id: 'p5', kind: 'MIN_PAIR', target: 'Live', ipa: '/lɪv/', translation: 'жить' },
      { id: 'p6', kind: 'MIN_PAIR', target: 'Leave', ipa: '/liːv/', translation: 'уходить, оставлять' },
      { id: 'p7', kind: 'MIN_PAIR', target: 'Hit', ipa: '/hɪt/', translation: 'ударить' },
      { id: 'p8', kind: 'MIN_PAIR', target: 'Heat', ipa: '/hiːt/', translation: 'жар, тепло' }
    ]
  },
  {
    id: 'deck-a2-weather',
    level: 'A2',
    title: 'Weather',
    description: 'Описание погоды — must-have для small talk по-британски ☂️',
    emoji: '🌦️',
    cards: [
      { id: 'w1', kind: 'WORD', target: 'Sunny', ipa: '/ˈsʌni/', translation: 'солнечно' },
      { id: 'w2', kind: 'WORD', target: 'Rainy', ipa: '/ˈreɪni/', translation: 'дождливо' },
      { id: 'w3', kind: 'WORD', target: 'Cloudy', ipa: '/ˈklaʊdi/', translation: 'облачно' },
      { id: 'w4', kind: 'WORD', target: 'Windy', ipa: '/ˈwɪndi/', translation: 'ветрено' },
      { id: 'w5', kind: 'WORD', target: 'Snow', ipa: '/snəʊ/', translation: 'снег' },
      { id: 'w6', kind: 'WORD', target: 'Foggy', ipa: '/ˈfɒɡi/', translation: 'туманно', example: 'Britain is famous for foggy mornings.' },
      { id: 'w7', kind: 'PHRASE', target: 'It is raining.', ipa: '/ɪt ɪz ˈreɪnɪŋ/', translation: 'Идёт дождь.' },
      { id: 'w8', kind: 'PHRASE', target: 'It is very cold today.', ipa: '/ɪt ɪz ˈveri kəʊld təˈdeɪ/', translation: 'Сегодня очень холодно.' },
      { id: 'w9', kind: 'PHRASE', target: 'Lovely weather, isn\'t it?', ipa: '/ˈlʌvli ˈweðə ˈɪznt ɪt/', translation: 'Прекрасная погода, не так ли?', example: 'Классический британский small talk' },
      { id: 'w10', kind: 'PHRASE', target: 'It might rain later.', ipa: '/ɪt maɪt reɪn ˈleɪtə/', translation: 'Возможно, позже пойдёт дождь.' }
    ]
  },
  {
    id: 'deck-a2-shopping',
    level: 'A2',
    title: 'Shopping',
    description: 'Фразы для магазина и кассы',
    emoji: '🛒',
    cards: [
      { id: 'sh1', kind: 'WORD', target: 'Price', ipa: '/praɪs/', translation: 'цена' },
      { id: 'sh2', kind: 'WORD', target: 'Receipt', ipa: '/rɪˈsiːt/', translation: 'чек', example: 'Note: silent «p» in receipt' },
      { id: 'sh3', kind: 'WORD', target: 'Change', ipa: '/tʃeɪndʒ/', translation: 'сдача / обмен' },
      { id: 'sh4', kind: 'WORD', target: 'Cashier', ipa: '/kæˈʃɪə/', translation: 'кассир' },
      { id: 'sh5', kind: 'PHRASE', target: 'How much is this?', ipa: '/haʊ mʌtʃ ɪz ðɪs/', translation: 'Сколько это стоит?' },
      { id: 'sh6', kind: 'PHRASE', target: 'Do you have a smaller size?', ipa: '/duː juː hæv ə ˈsmɔːlə saɪz/', translation: 'У вас есть размер поменьше?' },
      { id: 'sh7', kind: 'PHRASE', target: 'Can I try this on?', ipa: '/kæn aɪ traɪ ðɪs ɒn/', translation: 'Можно это примерить?' },
      { id: 'sh8', kind: 'PHRASE', target: 'I\'ll take it.', ipa: '/aɪl teɪk ɪt/', translation: 'Я возьму это.' },
      { id: 'sh9', kind: 'PHRASE', target: 'Do you accept card?', ipa: '/duː juː əkˈsept kɑːd/', translation: 'Вы принимаете карты?' },
      { id: 'sh10', kind: 'PHRASE', target: 'Just looking, thanks.', ipa: '/dʒʌst ˈlʊkɪŋ θæŋks/', translation: 'Просто смотрю, спасибо.', example: 'Стандартный ответ продавцу-консультанту' },
      { id: 'sh11', kind: 'PHRASE', target: 'Where is the changing room?', ipa: '/weər ɪz ðə ˈtʃeɪndʒɪŋ ruːm/', translation: 'Где примерочная?' },
      { id: 'sh12', kind: 'PHRASE', target: 'It\'s a bit expensive.', ipa: '/ɪts ə bɪt ɪkˈspensɪv/', translation: 'Немного дороговато.' }
    ]
  },
  {
    id: 'deck-a2-hobbies',
    level: 'A2',
    title: 'Hobbies & free time',
    description: 'Чем заняться — спорт, музыка, чтение',
    emoji: '🎸',
    cards: [
      { id: 'hb1', kind: 'WORD', target: 'Reading', ipa: '/ˈriːdɪŋ/', translation: 'чтение' },
      { id: 'hb2', kind: 'WORD', target: 'Swimming', ipa: '/ˈswɪmɪŋ/', translation: 'плавание' },
      { id: 'hb3', kind: 'WORD', target: 'Painting', ipa: '/ˈpeɪntɪŋ/', translation: 'рисование' },
      { id: 'hb4', kind: 'WORD', target: 'Cooking', ipa: '/ˈkʊkɪŋ/', translation: 'готовка' },
      { id: 'hb5', kind: 'WORD', target: 'Football', ipa: '/ˈfʊtbɔːl/', translation: 'футбол', example: 'In Britain «football» = soccer' },
      { id: 'hb6', kind: 'WORD', target: 'Photography', ipa: '/fəˈtɒɡrəfi/', translation: 'фотография' },
      { id: 'hb7', kind: 'PHRASE', target: 'I love playing the guitar.', ipa: '/aɪ lʌv ˈpleɪɪŋ ðə ɡɪˈtɑː/', translation: 'Я обожаю играть на гитаре.' },
      { id: 'hb8', kind: 'PHRASE', target: 'I\'m really into chess.', ipa: '/aɪm ˈrɪəli ˈɪntə tʃes/', translation: 'Я серьёзно увлекаюсь шахматами.' },
      { id: 'hb9', kind: 'PHRASE', target: 'I go running every morning.', ipa: '/aɪ ɡəʊ ˈrʌnɪŋ ˈevri ˈmɔːnɪŋ/', translation: 'Я бегаю каждое утро.' },
      { id: 'hb10', kind: 'PHRASE', target: 'What do you do for fun?', ipa: '/wɒt duː juː duː fə fʌn/', translation: 'Чем ты любишь заниматься?' }
    ]
  },

  // ════════════════════════════════════════════════════════════════════
  // S1 — PRE-INTERMEDIATE
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'deck-s1-past-tense',
    level: 'S1',
    title: 'Past tense verbs',
    description: 'Неправильные глаголы в прошедшем времени',
    emoji: '⏪',
    cards: [
      { id: 'pt1', kind: 'WORD', target: 'Went', ipa: '/went/', translation: 'пошёл (go → went)', example: 'I went to school yesterday.' },
      { id: 'pt2', kind: 'WORD', target: 'Saw', ipa: '/sɔː/', translation: 'увидел (see → saw)', example: 'I saw a great film.' },
      { id: 'pt3', kind: 'WORD', target: 'Bought', ipa: '/bɔːt/', translation: 'купил (buy → bought)', example: 'She bought new shoes.' },
      { id: 'pt4', kind: 'WORD', target: 'Thought', ipa: '/θɔːt/', translation: 'думал (think → thought)' },
      { id: 'pt5', kind: 'WORD', target: 'Brought', ipa: '/brɔːt/', translation: 'принёс (bring → brought)' },
      { id: 'pt6', kind: 'WORD', target: 'Taught', ipa: '/tɔːt/', translation: 'учил (teach → taught)' },
      { id: 'pt7', kind: 'WORD', target: 'Caught', ipa: '/kɔːt/', translation: 'поймал (catch → caught)' },
      { id: 'pt8', kind: 'WORD', target: 'Spoke', ipa: '/spəʊk/', translation: 'говорил (speak → spoke)' },
      { id: 'pt9', kind: 'WORD', target: 'Broke', ipa: '/brəʊk/', translation: 'сломал (break → broke)' },
      { id: 'pt10', kind: 'PHRASE', target: 'I went to London last summer.', ipa: '/aɪ went tə ˈlʌndən lɑːst ˈsʌmə/', translation: 'Я ездил в Лондон прошлым летом.' },
      { id: 'pt11', kind: 'PHRASE', target: 'She thought it was funny.', ipa: '/ʃiː θɔːt ɪt wɒz ˈfʌni/', translation: 'Она подумала, что это смешно.' },
      { id: 'pt12', kind: 'PHRASE', target: 'They bought a new house.', ipa: '/ðeɪ bɔːt ə njuː haʊs/', translation: 'Они купили новый дом.' }
    ]
  },
  {
    id: 'deck-s1-th-pairs',
    level: 'S1',
    title: 'Minimal pairs — think vs sink',
    description: 'Тренировка «th»-звуков /θ/ и /ð/ — главная боль русскоговорящих',
    emoji: '👅',
    cards: [
      { id: 'th1', kind: 'MIN_PAIR', target: 'Think', ipa: '/θɪŋk/', translation: 'думать (звук /θ/)' },
      { id: 'th2', kind: 'MIN_PAIR', target: 'Sink', ipa: '/sɪŋk/', translation: 'раковина (звук /s/)' },
      { id: 'th3', kind: 'MIN_PAIR', target: 'Three', ipa: '/θriː/', translation: 'три (звук /θ/)' },
      { id: 'th4', kind: 'MIN_PAIR', target: 'Free', ipa: '/friː/', translation: 'свободный (звук /f/)' },
      { id: 'th5', kind: 'MIN_PAIR', target: 'Thin', ipa: '/θɪn/', translation: 'тонкий' },
      { id: 'th6', kind: 'MIN_PAIR', target: 'Tin', ipa: '/tɪn/', translation: 'жесть, банка' },
      { id: 'th7', kind: 'MIN_PAIR', target: 'This', ipa: '/ðɪs/', translation: 'этот (звонкий /ð/)' },
      { id: 'th8', kind: 'MIN_PAIR', target: 'Diss', ipa: '/dɪs/', translation: 'оскорбить (slang)' },
      { id: 'th9', kind: 'MIN_PAIR', target: 'Bath', ipa: '/bɑːθ/', translation: 'ванна (звук /θ/)' },
      { id: 'th10', kind: 'MIN_PAIR', target: 'Bath', ipa: '/bæθ/', translation: 'ванна (американское произношение)' }
    ]
  },

  // ════════════════════════════════════════════════════════════════════
  // S2 — INTERMEDIATE
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'deck-s2-opinions',
    level: 'S2',
    title: 'Opinions & agreement',
    description: 'Как высказать мнение, согласиться и не согласиться',
    emoji: '💭',
    cards: [
      { id: 'op1', kind: 'PHRASE', target: 'In my opinion, it\'s the best option.', ipa: '/ɪn maɪ əˈpɪnjən ɪts ðə best ˈɒpʃən/', translation: 'По моему мнению, это лучший вариант.' },
      { id: 'op2', kind: 'PHRASE', target: 'I completely agree with you.', ipa: '/aɪ kəmˈpliːtli əˈɡriː wɪð juː/', translation: 'Я полностью согласен с тобой.' },
      { id: 'op3', kind: 'PHRASE', target: 'I see your point, but…', ipa: '/aɪ siː jɔː pɔɪnt bʌt/', translation: 'Я понимаю твою точку, но…' },
      { id: 'op4', kind: 'PHRASE', target: 'I\'m not so sure about that.', ipa: '/aɪm nɒt səʊ ʃʊər əˈbaʊt ðæt/', translation: 'Я в этом не уверен.' },
      { id: 'op5', kind: 'PHRASE', target: 'That\'s a good point.', ipa: '/ðæts ə ɡʊd pɔɪnt/', translation: 'Это хороший аргумент.' },
      { id: 'op6', kind: 'PHRASE', target: 'I\'d rather say it\'s complicated.', ipa: '/aɪd ˈrɑːðə seɪ ɪts ˈkɒmplɪkeɪtɪd/', translation: 'Я бы сказал, это сложно.' },
      { id: 'op7', kind: 'PHRASE', target: 'It depends on the situation.', ipa: '/ɪt dɪˈpendz ɒn ðə ˌsɪtʃuˈeɪʃən/', translation: 'Зависит от ситуации.' },
      { id: 'op8', kind: 'PHRASE', target: 'I beg to differ.', ipa: '/aɪ beɡ tə ˈdɪfə/', translation: 'Позволю себе не согласиться.', example: 'Очень британски-вежливо' },
      { id: 'op9', kind: 'WORD', target: 'Definitely', ipa: '/ˈdefɪnətli/', translation: 'определённо' },
      { id: 'op10', kind: 'WORD', target: 'Probably', ipa: '/ˈprɒbəbli/', translation: 'вероятно' },
      { id: 'op11', kind: 'PHRASE', target: 'I couldn\'t agree more.', ipa: '/aɪ ˈkʊdnt əˈɡriː mɔː/', translation: 'Не могу больше согласиться.' },
      { id: 'op12', kind: 'PHRASE', target: 'That\'s absolutely right.', ipa: '/ðæts ˈæbsəluːtli raɪt/', translation: 'Это абсолютно верно.' }
    ]
  },
  {
    id: 'deck-s2-idioms',
    level: 'S2',
    title: 'British idioms',
    description: 'Идиомы, которые слышно в Лондоне каждый день',
    emoji: '🇬🇧',
    cards: [
      { id: 'id1', kind: 'PHRASE', target: 'It\'s raining cats and dogs.', ipa: '/ɪts ˈreɪnɪŋ kæts ən dɒɡz/', translation: 'Льёт как из ведра.' },
      { id: 'id2', kind: 'PHRASE', target: 'A piece of cake.', ipa: '/ə piːs əv keɪk/', translation: 'Проще простого.' },
      { id: 'id3', kind: 'PHRASE', target: 'Break a leg!', ipa: '/breɪk ə leɡ/', translation: 'Удачи! (буквально «сломай ногу»)' },
      { id: 'id4', kind: 'PHRASE', target: 'Cost an arm and a leg.', ipa: '/kɒst ən ɑːm ən ə leɡ/', translation: 'Стоить очень дорого.' },
      { id: 'id5', kind: 'PHRASE', target: 'Bob\'s your uncle.', ipa: '/bɒbz jɔːr ˈʌŋkl/', translation: 'И всё готово.', example: 'Классическая британская идиома' },
      { id: 'id6', kind: 'PHRASE', target: 'Hit the nail on the head.', ipa: '/hɪt ðə neɪl ɒn ðə hed/', translation: 'Попасть в точку.' },
      { id: 'id7', kind: 'PHRASE', target: 'Once in a blue moon.', ipa: '/wʌns ɪn ə bluː muːn/', translation: 'Очень редко.' },
      { id: 'id8', kind: 'PHRASE', target: 'Spill the beans.', ipa: '/spɪl ðə biːnz/', translation: 'Разболтать секрет.' },
      { id: 'id9', kind: 'PHRASE', target: 'Under the weather.', ipa: '/ˈʌndə ðə ˈweðə/', translation: 'Неважно себя чувствовать.' },
      { id: 'id10', kind: 'PHRASE', target: 'The ball is in your court.', ipa: '/ðə bɔːl ɪz ɪn jɔː kɔːt/', translation: 'Решение за тобой.' }
    ]
  },

  // ════════════════════════════════════════════════════════════════════
  // B2 — UPPER-INTERMEDIATE
  // ════════════════════════════════════════════════════════════════════
  {
    id: 'deck-b2-business',
    level: 'B2',
    title: 'Business English',
    description: 'Презентации, встречи, email — деловой английский',
    emoji: '💼',
    cards: [
      { id: 'bz1', kind: 'PHRASE', target: 'Let\'s get started, shall we?', ipa: '/lets ɡet ˈstɑːtɪd ʃæl wiː/', translation: 'Давайте начнём, согласны?' },
      { id: 'bz2', kind: 'PHRASE', target: 'Could you elaborate on that?', ipa: '/kʊd juː ɪˈlæbəreɪt ɒn ðæt/', translation: 'Не могли бы вы это уточнить?' },
      { id: 'bz3', kind: 'PHRASE', target: 'I\'m afraid I have to disagree.', ipa: '/aɪm əˈfreɪd aɪ hæv tə ˌdɪsəˈɡriː/', translation: 'Боюсь, я вынужден не согласиться.' },
      { id: 'bz4', kind: 'PHRASE', target: 'Let me get back to you on that.', ipa: '/let miː ɡet bæk tə juː ɒn ðæt/', translation: 'Позвольте я вернусь к вам с этим позже.' },
      { id: 'bz5', kind: 'PHRASE', target: 'We need to think outside the box.', ipa: '/wiː niːd tə θɪŋk ˌaʊtˈsaɪd ðə bɒks/', translation: 'Нужно мыслить нестандартно.' },
      { id: 'bz6', kind: 'PHRASE', target: 'Let\'s touch base next week.', ipa: '/lets tʌtʃ beɪs nekst wiːk/', translation: 'Давайте свяжемся на следующей неделе.' },
      { id: 'bz7', kind: 'WORD', target: 'Stakeholder', ipa: '/ˈsteɪkˌhəʊldə/', translation: 'заинтересованная сторона' },
      { id: 'bz8', kind: 'WORD', target: 'Deliverable', ipa: '/dɪˈlɪvərəbl/', translation: 'результат, итог' },
      { id: 'bz9', kind: 'WORD', target: 'Quarterly', ipa: '/ˈkwɔːtəli/', translation: 'ежеквартально' },
      { id: 'bz10', kind: 'PHRASE', target: 'It\'s a win-win situation.', ipa: '/ɪts ə wɪn wɪn ˌsɪtʃuˈeɪʃən/', translation: 'Это взаимовыгодная ситуация.' },
      { id: 'bz11', kind: 'PHRASE', target: 'We are on the same page.', ipa: '/wiː ɑːr ɒn ðə seɪm peɪdʒ/', translation: 'Мы понимаем друг друга.' },
      { id: 'bz12', kind: 'PHRASE', target: 'I look forward to hearing from you.', ipa: '/aɪ lʊk ˈfɔːwəd tə ˈhɪərɪŋ frəm juː/', translation: 'С нетерпением жду вашего ответа.', example: 'Стандартная фраза в конце email' }
    ]
  }
]

export const getDeck = (id: string) => PRACTICE_DECKS.find(d => d.id === id)
