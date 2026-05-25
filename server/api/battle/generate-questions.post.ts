import { z } from 'zod'
import { useOpenAI } from '../../utils/ai-agent'

const bodySchema = z.object({
  gradeLevel: z.number().int().min(1).max(6),
  topic: z.string().min(1).max(120),
  count: z.number().int().min(3).max(15).default(5)
})

const questionSchema = z.object({
  text: z.string().min(3).max(300),
  options: z.array(z.string().min(1).max(80)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  difficulty: z.number().int().min(1).max(5).default(2),
  explanation: z.string().max(200).optional()
})
const responseSchema = z.object({
  questions: z.array(questionSchema).min(1).max(15)
})

/**
 * Generate fresh battle questions via OpenAI and insert them into BattleQuestion.
 * Returns count of inserted questions.
 *
 * Used from /battle/host/new wizard (button "✨ Сгенерировать вопросы от ИИ").
 */
export default defineEventHandler(async (event) => {
  // Require auth — this endpoint burns OpenAI tokens and writes to a shared
  // BattleQuestion bank. Anonymous access would let attackers spam it.
  await requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)
  const openai = useOpenAI()

  const prompt = `Сгенерируй ${body.count} математических вопросов для игры FEMO Battle (типа Kahoot).

Класс: ${body.gradeLevel}
Тема: ${body.topic}

Требования:
- Вопросы на русском, короткие (одна-две строки), понятные ребёнку.
- 4 варианта ответа, ровно один правильный.
- Сложность от 1 (простой) до 5 (сложный) — варьируй внутри подборки.
- Опционально короткое объяснение (1 предложение) для разбора.
- Не повторяй друг друга, придумывай разнообразные формулировки (примеры на бытовые ситуации, текстовые задачи, прямые вычисления).
- Возвращай СТРОГО валидный JSON по схеме:

{
  "questions": [
    { "text": "...", "options": ["A","B","C","D"], "correctIndex": 0, "difficulty": 2, "explanation": "..." }
  ]
}

Только JSON, никакого markdown.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Ты — методист по математике для 1–6 классов школ Казахстана. Возвращаешь только валидный JSON.' },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.8
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  let parsed
  try {
    parsed = responseSchema.parse(JSON.parse(raw))
  } catch (e) {
    throw createError({
      statusCode: 502,
      message: `Не удалось разобрать ответ ИИ: ${(e as Error).message}`
    })
  }

  // Insert into BattleQuestion
  const rows = parsed.questions.map(q => ({
    gradeLevel: body.gradeLevel,
    topic: body.topic,
    text: q.text,
    options: q.options,
    correctIndex: q.correctIndex,
    difficulty: q.difficulty,
    explanation: q.explanation ?? null
  }))

  const { error: insErr } = await supabase
    .from('BattleQuestion')
    .insert(rows)
  if (insErr) throw createError({ statusCode: 500, message: insErr.message })

  return { inserted: rows.length, topic: body.topic, gradeLevel: body.gradeLevel }
})
