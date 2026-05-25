import type { AIMode } from '~/shared/types/common'

export interface AiSessionConfig {
  studentId: string
  subjectId?: string
  topicId?: string
  mode: AIMode
}

export interface AiStreamChunk {
  type: 'content' | 'done' | 'error'
  content?: string
  usage?: { promptTokens: number, completionTokens: number }
  error?: string
}

export const AI_MODE_LABELS: Record<AIMode, { label: string, description: string, icon: string }> = {
  EXPLAIN: {
    label: 'Объясни тему',
    description: 'AI объяснит тему на твоём уровне с примерами и формулами',
    icon: 'i-lucide-book-open'
  },
  PRACTICE: {
    label: 'Потренируемся',
    description: 'Сократический метод — AI ведёт тебя через задачи и подсказки',
    icon: 'i-lucide-brain'
  },
  CHECK_HW: {
    label: 'Проверь решение',
    description: 'Загрузи фото или текст — AI разберёт ошибки и подскажет',
    icon: 'i-lucide-clipboard-check'
  },
  MOCK_TEST: {
    label: 'Пробная олимпиада',
    description: 'Адаптивный тест с таймером и аналитикой по темам',
    icon: 'i-lucide-trophy'
  },
  FREE: {
    label: 'Любой вопрос',
    description: 'Задай что угодно по математике — отвечу как другу',
    icon: 'i-lucide-message-circle'
  }
}
