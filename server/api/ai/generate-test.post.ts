import { z } from 'zod'
import { isAiAvailable, getMockTestQuestions } from '../../utils/ai-mock'

const bodySchema = z.object({
  subjectId: z.string().uuid(),
  topicId: z.string().uuid().optional(),
  studentModelId: z.string().uuid().optional(),
  difficulty: z.number().min(1).max(10).default(5),
  count: z.number().min(1).max(20).default(5),
  type: z.enum(['diagnostic', 'adaptive', 'mock']).default('adaptive'),
  // For adaptive diagnostics: context of previous answers for smarter generation
  previousAnswers: z.array(z.object({
    questionId: z.string(),
    isCorrect: z.boolean(),
    topicId: z.string().optional()
  })).optional(),
  excludeQuestionIds: z.array(z.string()).optional(),
  // If true, load topics from DB for the subject to assign topic IDs
  includeTopics: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  // Load subject info
  const { data: subject } = await supabase
    .from('Subject')
    .select('name')
    .eq('id', body.subjectId)
    .single()

  const subjectName = (subject as any)?.name ?? 'Общий'

  // Load topics for the subject to give AI context
  let topicList: { id: string, name: string }[] = []
  if (body.includeTopics !== false) {
    const { data: topics } = await supabase
      .from('Topic')
      .select('id, name')
      .eq('subjectId', body.subjectId)
      .order('orderIndex')
    topicList = (topics as any[]) ?? []
  }

  // ── Demo mode: return mock questions ──
  if (!isAiAvailable()) {
    const mockQuestions = getMockTestQuestions(subjectName, body.count, body.difficulty)
    // Assign real topic IDs if available
    const questions = mockQuestions.map((q, i) => ({
      ...q,
      topicId: topicList.length ? topicList[i % topicList.length]!.id : null
    }))
    return { questions }
  }

  // ── Production mode: real OpenAI ──
  const { useOpenAI } = await import('../../utils/ai-agent')
  const openai = useOpenAI()

  let topicName = ''
  if (body.topicId) {
    const found = topicList.find(t => t.id === body.topicId)
    topicName = found?.name ?? ''
    if (!topicName) {
      const { data: topic } = await supabase
        .from('Topic')
        .select('name')
        .eq('id', body.topicId)
        .single()
      topicName = (topic as any)?.name ?? ''
    }
  }

  // Load Student Model for adaptive difficulty
  let studentContext = ''
  if (body.studentModelId) {
    const { data: sm } = await supabase
      .from('StudentModel')
      .select('knowledgeMap, errorPatterns, difficultyLevel')
      .eq('id', body.studentModelId)
      .single()
    if (sm) {
      const km = (sm as any).knowledgeMap as Record<string, number> | null
      if (km) {
        const weak = Object.entries(km).filter(([_, v]) => v < 50).map(([k]) => k)
        if (weak.length) studentContext += `Слабые темы ученика: ${weak.join(', ')}. `
      }
    }
  }

  // Build context from previous answers (for adaptive diagnostics)
  let previousContext = ''
  if (body.previousAnswers?.length) {
    const correct = body.previousAnswers.filter(a => a.isCorrect).length
    const total = body.previousAnswers.length
    previousContext = `Ученик уже ответил на ${total} вопросов (${correct} правильно из ${total}). `

    const recentWrong = body.previousAnswers.filter(a => !a.isCorrect).slice(-3)
    if (recentWrong.length) {
      previousContext += `Последние ошибки в темах: ${recentWrong.map(a => a.topicId ?? 'неизвестная').join(', ')}. `
    }
    previousContext += 'Сгенерируй вопросы, которые помогут точнее определить уровень ученика. '
  }

  // Build topics list for AI to assign topicIds
  let topicsInstruction = ''
  if (topicList.length) {
    topicsInstruction = `\n\nДоступные темы предмета (обязательно используй ТОЧНЫЙ id из списка):\n${topicList.map(t => `- id: "${t.id}", name: "${t.name}"`).join('\n')}\n\nВ поле "topicId" указывай ТОЛЬКО id из этого списка.`
  }

  const systemPrompt = `Ты — генератор тестовых заданий по математике платформы FEMO.
Предмет: ${subjectName}
${topicName ? `Тема: ${topicName}` : ''}
${studentContext}
${previousContext}

Сгенерируй ${body.count} вопросов уровня сложности ${body.difficulty}/10.
Тип: ${body.type === 'diagnostic' ? 'диагностический тест для определения уровня знаний' : body.type === 'mock' ? 'пробный экзамен' : 'адаптивный тест'}.
${topicsInstruction}

Верни JSON объект с полем "questions" — массив вопросов:
{
  "questions": [
    {
      "id": "<уникальный uuid>",
      "topicId": "<id темы из списка выше или null>",
      "text": "<текст вопроса>",
      "difficulty": <1-10>,
      "type": "multiple_choice",
      "options": [
        { "id": "a", "text": "<вариант A>", "isCorrect": false },
        { "id": "b", "text": "<вариант B>", "isCorrect": true },
        { "id": "c", "text": "<вариант C>", "isCorrect": false },
        { "id": "d", "text": "<вариант D>", "isCorrect": false }
      ],
      "explanation": "<подробное объяснение правильного ответа>"
    }
  ]
}

Требования:
- Вопросы сложности вокруг ${body.difficulty}/10
- Каждый вопрос с 4 вариантами ответа, ровно один правильный (isCorrect: true)
- Объяснения подробные и понятные
- id вопросов — уникальные строки
- Ответы на русском языке`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Сгенерируй ${body.count} вопросов.` }
    ],
    temperature: 0.8,
    response_format: { type: 'json_object' }
  })

  const rawResponse = completion.choices[0]?.message?.content ?? '{"questions":[]}'
  let questions: any[]
  try {
    const parsed = JSON.parse(rawResponse)
    questions = Array.isArray(parsed) ? parsed : parsed.questions ?? []
  } catch {
    questions = []
  }

  // Validate and normalize question structure
  questions = questions.map((q: any, i: number) => ({
    id: q.id ?? `q-${Date.now()}-${i}`,
    topicId: q.topicId ?? (topicList.length ? topicList[i % topicList.length]!.id : null),
    text: q.text ?? q.question ?? '',
    difficulty: q.difficulty ?? body.difficulty,
    type: q.type ?? 'multiple_choice',
    options: (q.options ?? []).map((o: any) => ({
      id: o.id ?? String(Math.random()),
      text: o.text ?? '',
      isCorrect: o.isCorrect ?? (o.id === q.correctOptionId)
    })),
    explanation: q.explanation ?? ''
  }))

  return { questions }
})
