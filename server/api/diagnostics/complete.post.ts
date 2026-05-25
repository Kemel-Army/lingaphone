import { z } from 'zod'

/* eslint-disable @typescript-eslint/no-explicit-any */

const bodySchema = z.object({
  diagnosticResultId: z.string().uuid(),
  /** Map from questionId → topicId (provided by client since questions
   *  come from the public API; server doesn't trust topic correctness
   *  but uses the client's topic mapping as best-effort labeling). */
  topicMap: z.record(z.string(), z.string()).default({})
})

/**
 * POST /api/diagnostics/complete
 *
 * Finalizes a diagnostic session. Server reads the recorded answers from
 * DiagnosticResult (written by /submit-answer), computes overallScore /
 * topicScores, then upserts StudentModel and inserts Progress rows.
 *
 * Client never controls the score — fakes are impossible.
 */
export default defineEventHandler(async (event) => {
  const { studentId } = await getCurrentStudent(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  const { data: result, error: resErr } = await supabase
    .from('DiagnosticResult')
    .select('*')
    .eq('id', body.diagnosticResultId)
    .maybeSingle()

  if (resErr) throw createError({ statusCode: 500, message: resErr.message })
  if (!result) throw createError({ statusCode: 404, message: 'Diagnostic session not found' })

  const r = result as Record<string, any>
  if (r.studentId !== studentId) {
    throw createError({ statusCode: 403, message: 'Not your diagnostic session' })
  }
  if (r.status === 'COMPLETED') {
    return {
      diagnosticResultId: r.id as string,
      overallScore: r.overallScore as number,
      topicScores: r.topicScores,
      idempotent: true
    }
  }

  const answers = (r.answers as Array<{
    questionId: string
    answer: string
    isCorrect: boolean
    timeSpent: number
    difficulty: number
  }> | null) ?? []

  if (answers.length === 0) {
    throw createError({ statusCode: 400, message: 'No answers recorded' })
  }

  // Per-topic aggregates
  const topicResults: Record<string, {
    mastery: number
    correct: number
    total: number
    avgDifficulty: number
  }> = {}

  for (const a of answers) {
    const tid = body.topicMap[a.questionId] ?? 'unknown'
    const t = topicResults[tid] ?? (topicResults[tid] = {
      mastery: 0, correct: 0, total: 0, avgDifficulty: 0
    })
    t.total++
    if (a.isCorrect) t.correct++
    t.avgDifficulty += a.difficulty
  }
  for (const t of Object.values(topicResults)) {
    t.mastery = Math.round((t.correct / t.total) * 100)
    t.avgDifficulty = Math.round(t.avgDifficulty / t.total)
  }

  const totalCorrect = answers.filter(a => a.isCorrect).length
  const totalTime = answers.reduce((sum, a) => sum + (a.timeSpent ?? 0), 0)
  const avgTimePerQ = totalTime / answers.length
  const overallScore = Math.round((totalCorrect / answers.length) * 100)

  // Build StudentModel inputs
  const knowledgeMap: Record<string, number> = {}
  const errorPatterns: Record<string, string[]> = {}
  const strengths: string[] = []
  const weaknesses: string[] = []

  for (const [topicId, data] of Object.entries(topicResults)) {
    knowledgeMap[topicId] = data.mastery
    if (data.mastery < 40) {
      weaknesses.push(topicId)
      errorPatterns[topicId] = ['Низкий уровень владения темой']
    } else if (data.mastery < 60) {
      errorPatterns[topicId] = ['Требуется дополнительная практика']
    } else if (data.mastery >= 80) {
      strengths.push(topicId)
    }
  }

  // Finalize DiagnosticResult
  const { error: updErr } = await supabase
    .from('DiagnosticResult')
    .update({
      status: 'COMPLETED',
      overallScore,
      topicScores: topicResults,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as never)
    .eq('id', r.id as string)
  if (updErr) throw createError({ statusCode: 500, message: updErr.message })

  // Upsert StudentModel for (studentId, subjectId)
  const subjectId = r.subjectId as string
  const finalDifficulty = Math.max(1, Math.min(10, Math.round(
    answers.reduce((s, a) => s + a.difficulty, 0) / answers.length
  )))
  await supabase
    .from('StudentModel')
    .upsert({
      studentId,
      subjectId,
      knowledgeMap,
      errorPatterns,
      difficultyLevel: finalDifficulty / 10,
      speed: avgTimePerQ,
      strengths,
      weaknesses,
      learningStyle: null,
      updatedAt: new Date().toISOString()
    } as never, { onConflict: 'studentId,subjectId' })

  // Progress per topic (diagnostic baseline)
  const progressRecords = Object.entries(knowledgeMap).map(([topicId, mastery]) => ({
    studentId,
    topicId,
    masteryBefore: 0,
    masteryAfter: mastery / 100,
    source: 'DIAGNOSTIC',
    sourceId: r.id as string
  }))
  if (progressRecords.length > 0) {
    await supabase.from('Progress').insert(progressRecords as never)
  }

  return {
    diagnosticResultId: r.id as string,
    overallScore,
    topicScores: topicResults,
    totalQuestions: answers.length,
    totalCorrect,
    totalTime,
    avgTimePerQ,
    difficultyLevel: finalDifficulty
  }
})
