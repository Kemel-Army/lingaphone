import { z } from 'zod'

/* eslint-disable @typescript-eslint/no-explicit-any */

const bodySchema = z.object({
  diagnosticResultId: z.string().uuid().optional(),
  questionId: z.string().uuid(),
  answerId: z.string().min(1),
  timeSpent: z.number().int().nonnegative().optional(),
  difficulty: z.number().int().min(1).max(10).optional()
})

/**
 * POST /api/diagnostics/submit-answer
 *
 * Verifies the answer server-side and returns { isCorrect, explanation }.
 *
 * If `diagnosticResultId` is supplied AND the caller is an authenticated
 * student, the answer is appended to DiagnosticResult.answers and the
 * endpoint refuses to score the SAME questionId a second time
 * (one-shot per question, prevents the "try every option" cheat).
 *
 * If `diagnosticResultId` is omitted (guest flow), correctness is computed
 * without state — guests can probe, but they have no score to falsify.
 */
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  const { data: q, error: qErr } = await supabase
    .from('DiagnosticQuestion')
    .select('id, options, explanation')
    .eq('id', body.questionId)
    .maybeSingle()

  if (qErr) throw createError({ statusCode: 500, message: qErr.message })
  if (!q) throw createError({ statusCode: 404, message: 'Question not found' })

  const options = ((q as any).options as Array<{ id: string, isCorrect?: boolean }> | null) ?? []
  const picked = options.find(o => o.id === body.answerId)
  const isCorrect = !!picked?.isCorrect
  const explanation = ((q as any).explanation as string | null) ?? ''

  if (!body.diagnosticResultId) {
    // Stateless guest path.
    return { isCorrect, explanation }
  }

  // Authenticated student path: track first answer per question.
  const auth = await requireAuth(event).catch(() => null)
  if (!auth) {
    throw createError({ statusCode: 401, message: 'Authentication required for tracked session' })
  }

  const { data: result, error: resErr } = await supabase
    .from('DiagnosticResult')
    .select('id, studentId, answers, status')
    .eq('id', body.diagnosticResultId)
    .maybeSingle()

  if (resErr) throw createError({ statusCode: 500, message: resErr.message })
  if (!result) throw createError({ statusCode: 404, message: 'Diagnostic session not found' })

  // Verify ownership
  const { studentId } = await getCurrentStudent(event)
  if ((result as any).studentId !== studentId) {
    throw createError({ statusCode: 403, message: 'Not your diagnostic session' })
  }
  if ((result as any).status === 'COMPLETED') {
    throw createError({ statusCode: 409, message: 'Diagnostic already completed' })
  }

  const existing = (((result as any).answers as Array<{ questionId: string }> | null) ?? [])
  if (existing.some(a => a.questionId === body.questionId)) {
    // Idempotent: return the recorded verdict instead of re-scoring (no cheat).
    const prior = existing.find(a => a.questionId === body.questionId) as any
    return {
      isCorrect: !!prior.isCorrect,
      explanation,
      replayed: true
    }
  }

  const nextAnswers = [
    ...existing,
    {
      questionId: body.questionId,
      answer: body.answerId,
      isCorrect,
      timeSpent: body.timeSpent ?? 0,
      difficulty: body.difficulty ?? 5
    }
  ]

  const { error: updErr } = await supabase
    .from('DiagnosticResult')
    .update({ answers: nextAnswers, updatedAt: new Date().toISOString() } as never)
    .eq('id', body.diagnosticResultId)

  if (updErr) throw createError({ statusCode: 500, message: updErr.message })

  return { isCorrect, explanation }
})
