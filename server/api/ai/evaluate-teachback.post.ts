/**
 * POST /api/ai/evaluate-teachback
 *
 * Evaluates a student's "teach-back" explanation. Deterministic keyword +
 * sentence-count heuristic (no external LLM required) so the capsule's
 * speaking layer always works. Returns a kid-friendly verdict.
 */
import { z } from 'zod'
import type { H3Event } from 'h3'

const schema = z.object({
  text: z.string().min(1).max(4000),
  audiencePersona: z.string().max(200).default('младшему брату'),
  referenceAnswer: z.string().max(2000).default(''),
  requiredConcepts: z.array(z.string()).max(12).default([]),
  minSentences: z.number().int().min(1).max(20).default(3)
})

interface TeachBackVerdict {
  coverage: number
  coveredConcepts: string[]
  missingConcepts: string[]
  sentenceCount: number
  encouragement: string
  improvementTip: string
  passed: boolean
}

export default defineEventHandler(async (event: H3Event): Promise<TeachBackVerdict> => {
  await requireAuth(event)
  const body = await readValidatedBody(event, schema.parse)

  const lc = body.text.toLowerCase()
  const covered: string[] = []
  const missing: string[] = []
  for (const c of body.requiredConcepts) {
    if (lc.includes(c.toLowerCase())) covered.push(c)
    else missing.push(c)
  }
  const sentences = (body.text.match(/[^.!?]+[.!?]+/g) ?? []).length || (body.text.trim() ? 1 : 0)
  const coverage = body.requiredConcepts.length ? covered.length / body.requiredConcepts.length : 1
  const verbose = body.text.trim().length >= 40
  const passed = coverage >= 0.5 && sentences >= body.minSentences && verbose

  return {
    coverage,
    coveredConcepts: covered,
    missingConcepts: missing,
    sentenceCount: sentences,
    encouragement: passed
      ? 'Отличное объяснение! Ты уверенно рассказываешь своими словами.'
      : 'Хорошее начало! Попробуй добавить чуть больше деталей и пример.',
    improvementTip: missing.length
      ? `Добавь в рассказ: ${missing.slice(0, 2).join(', ')}.`
      : 'Приведи свой пример — так идея запомнится лучше.',
    passed
  }
})
