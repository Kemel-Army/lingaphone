import OpenAI from 'openai'

let _client: OpenAI | null = null

/**
 * Singleton OpenAI client for server-side usage.
 */
export const useOpenAI = (): OpenAI => {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY || useRuntimeConfig().openaiApiKey
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
    _client = new OpenAI({ apiKey })
  }
  return _client
}

/**
 * Build IAE system prompt based on Student Model.
 */
export const buildIaeSystemPrompt = (opts: {
  mode: string
  subject?: string
  topic?: string
  studentModel?: {
    knowledgeMap?: Record<string, number>
    errorPatterns?: Record<string, string[]>
    learningStyle?: string
    difficultyLevel?: number
    speed?: string
  }
  language?: string
}) => {
  const { mode, subject, topic, studentModel, language = 'ru' } = opts

  const langLabel = language === 'kz' ? 'казахском' : 'русском'

  let base = `Ты — AI-репетитор по математике платформы FEMO. Отвечай на ${langLabel} языке. `

  if (subject) base += `Предмет: ${subject}. `
  if (topic) base += `Тема: ${topic}. `

  if (studentModel) {
    if (studentModel.difficultyLevel) {
      base += `Уровень сложности ученика: ${studentModel.difficultyLevel}/10. `
    }
    if (studentModel.learningStyle) {
      base += `Стиль обучения: ${studentModel.learningStyle}. `
    }
    if (studentModel.speed) {
      base += `Скорость: ${studentModel.speed}. `
    }
    if (studentModel.knowledgeMap) {
      const weak = Object.entries(studentModel.knowledgeMap)
        .filter(([_, v]) => v < 50)
        .map(([k]) => k)
      if (weak.length > 0) {
        base += `Слабые темы: ${weak.join(', ')}. `
      }
    }
    if (studentModel.errorPatterns) {
      const patterns = Object.entries(studentModel.errorPatterns)
        .map(([k, v]) => `${k}: ${v.join(', ')}`)
      if (patterns.length > 0) {
        base += `Частые ошибки: ${patterns.join('; ')}. `
      }
    }
  }

  switch (mode) {
    case 'EXPLAIN':
      base += 'Режим: подробное объяснение темы. Используй аналогии, KaTeX для формул. Адаптируй глубину под уровень ученика. Спрашивай, всё ли понятно.'
      break
    case 'PRACTICE':
      base += 'Режим: практика (Сократический метод). Задавай задачи нарастающей сложности. Не давай ответ сразу — подводи ученика наводящими вопросами. Хвали за прогресс.'
      break
    case 'CHECK_HW':
      base += 'Режим: проверка домашнего задания. Анализируй ответ ученика. Укажи ошибки, объясни правильное решение. Дай конструктивную обратную связь.'
      break
    case 'MOCK_TEST':
      base += 'Режим: пробный тест. Генерируй по одному вопросу за раз. После ответа — переходи к следующему. В конце дай сводку результатов.'
      break
    case 'FREE':
    default:
      base += 'Режим: свободный вопрос. Отвечай максимально полно и понятно, адаптируясь под уровень ученика.'
      break
  }

  return base
}
