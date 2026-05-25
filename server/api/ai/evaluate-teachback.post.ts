import { z } from 'zod'
import { isAiAvailable } from '../../utils/ai-mock'

/**
 * POST /api/ai/evaluate-teachback
 *
 * Evaluates a student's "teach-back" explanation of the topic.
 * Returns a kid-friendly verdict: concept coverage, warmth, next-step tip.
 *
 * The LLM is asked to return JSON with stable keys so the client can render
 * a visual rubric without string parsing. Falls back to a deterministic
 * keyword-based heuristic when OPENAI_API_KEY is absent.
 */

const schema = z.object({
  text: z.string().min(1).max(4000),
  audiencePersona: z.string().max(200).default('младшему брату'),
  referenceAnswer: z.string().max(2000),
  requiredConcepts: z.array(z.string()).max(12).default([]),
  minSentences: z.number().int().min(1).max(20).default(3)
})

interface TeachBackVerdict {
  coverage: number // 0..1 fraction of concepts clearly covered
  coveredConcepts: string[]
  missingConcepts: string[]
  sentenceCount: number
  encouragement: string
  improvementTip: string
  passed: boolean
}

/** Fallback heuristic — keyword match + sentence count + reasonable verbosity. */
function heuristicEvaluate(input: {
  text: string
  requiredConcepts: string[]
  minSentences: number
}): TeachBackVerdict {
  const lc = input.text.toLowerCase()
  const covered: string[] = []
  const missing: string[] = []
  for (const c of input.requiredConcepts) {
    const key = c.toLowerCase()
    if (lc.includes(key)) covered.push(c)
    else missing.push(c)
  }
  const sentences = (input.text.match(/[^.!?]+[.!?]+/g) ?? []).length || (input.text.trim() ? 1 : 0)
  const coverage = input.requiredConcepts.length
    ? covered.length / input.requiredConcepts.length
    : 1
  const verbose = input.text.trim().length >= 80
  const passed = coverage >= 0.5 && sentences >= input.minSentences && verbose

  return {
    coverage,
    coveredConcepts: covered,
    missingConcepts: missing,
    sentenceCount: sentences,
    encouragement: passed
      ? 'Очень хорошее объяснение! Ты уверенно рассказываешь своими словами.'
      : 'Хорошее начало. Попробуй добавить ещё немного деталей и примеров.',
    improvementTip: missing.length
      ? `Добавь в объяснение: ${missing.slice(0, 2).join(', ')}.`
      : 'Попробуй привести свой пример из жизни — это поможет закрепить идею.',
    passed
  }
}

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const body = await readValidatedBody(event, schema.parse)

  // No key → heuristic path (demo still works).
  if (!isAiAvailable()) {
    return heuristicEvaluate(body)
  }

  const openai = useOpenAI()

  const systemPrompt = `Ты — добрый наставник в детской образовательной платформе FEMO для 1–6 классов.
Ты оцениваешь, как ребёнок объясняет математическую тему "своими словами" воображаемому собеседнику (${body.audiencePersona}).

Правила:
- Оцениваешь только ПОКРЫТИЕ идей. Не придирайся к формулировкам.
- Тон — тёплый, поддерживающий. Никакой критики. Всегда находи, за что похвалить.
- Советы — короткие и конкретные, на "ты", не больше одного предложения.
- Отвечай ТОЛЬКО валидным JSON, без markdown, без преамбулы.

Структура ответа (все поля обязательны):
{
  "coverage": число от 0 до 1 — доля покрытых понятий,
  "coveredConcepts": [строки — какие понятия из списка ребёнок назвал или раскрыл],
  "missingConcepts": [строки — какие понятия упустил],
  "sentenceCount": число предложений,
  "encouragement": "тёплая фраза-похвала (1 предложение, детский язык)",
  "improvementTip": "одно конкретное улучшение (1 предложение)",
  "passed": true если coverage ≥ 0.5 и предложений ≥ ${body.minSentences}
}

Эталонное объяснение для сравнения:
"""
${body.referenceAnswer}
"""

Обязательные понятия: ${body.requiredConcepts.map(c => `"${c}"`).join(', ') || '— не заданы —'}`

  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: body.text }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500
    })

    const raw = resp.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw) as Partial<TeachBackVerdict>

    const verdict: TeachBackVerdict = {
      coverage: typeof parsed.coverage === 'number' ? Math.max(0, Math.min(1, parsed.coverage)) : 0,
      coveredConcepts: Array.isArray(parsed.coveredConcepts) ? parsed.coveredConcepts : [],
      missingConcepts: Array.isArray(parsed.missingConcepts) ? parsed.missingConcepts : [],
      sentenceCount: typeof parsed.sentenceCount === 'number' ? parsed.sentenceCount : 0,
      encouragement: typeof parsed.encouragement === 'string' ? parsed.encouragement : 'Молодец, что рассказал своими словами!',
      improvementTip: typeof parsed.improvementTip === 'string' ? parsed.improvementTip : 'В следующий раз попробуй добавить пример.',
      passed: parsed.passed === true
    }
    return verdict
  } catch {
    // On any LLM/JSON failure — never break the student's flow.
    return heuristicEvaluate(body)
  }
})
