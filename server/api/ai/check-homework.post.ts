import { z } from 'zod'
import { isAiAvailable, getMockHomeworkCheck } from '../../utils/ai-mock'

const bodySchema = z.object({
  homeworkId: z.string().uuid(),
  submissionId: z.string().uuid(),
  format: z.enum(['TEST', 'INPUT', 'TEXT', 'ORAL', 'FILE', 'INTERACTIVE']),
  content: z.string().optional(),
  fileUrl: z.string().optional(),
  oralTranscription: z.string().optional(),
  homeworkTitle: z.string().optional(),
  homeworkDescription: z.string().optional(),
  maxScore: z.number().optional(),
  studentModelId: z.string().uuid().optional()
})

export default defineEventHandler(async (event) => {
  const { studentId: callerStudentId } = await getCurrentStudent(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  // Ownership check: submission must belong to the calling student.
  const { data: submissionRow, error: subErr } = await supabase
    .from('HomeworkSubmission')
    .select('id, studentId')
    .eq('id', body.submissionId)
    .maybeSingle()
  if (subErr || !submissionRow) {
    throw createError({ statusCode: 404, message: 'Submission not found' })
  }
  if ((submissionRow as { studentId: string }).studentId !== callerStudentId) {
    throw createError({ statusCode: 403, message: 'Not your submission' })
  }

  // Ownership check on StudentModel — must belong to the same student.
  if (body.studentModelId) {
    const { data: smOwner } = await supabase
      .from('StudentModel')
      .select('studentId')
      .eq('id', body.studentModelId)
      .maybeSingle()
    if (!smOwner || (smOwner as { studentId: string }).studentId !== callerStudentId) {
      throw createError({ statusCode: 403, message: 'Not your student model' })
    }
  }

  // Load Student Model for context
  let studentContext = ''
  if (body.studentModelId) {
    const { data: sm } = await supabase
      .from('StudentModel')
      .select('knowledgeMap, errorPatterns, difficultyLevel')
      .eq('id', body.studentModelId)
      .single()
    if (sm) {
      studentContext = `Уровень ученика: ${(sm as any).difficultyLevel}/10. `
      const km = (sm as any).knowledgeMap as Record<string, number> | null
      if (km) {
        const weak = Object.entries(km).filter(([_, v]) => v < 50).map(([k]) => k)
        if (weak.length) studentContext += `Слабые темы: ${weak.join(', ')}. `
      }
    }
  }

  // Build content to analyze
  let contentToAnalyze = ''
  if (body.format === 'TEXT' || body.format === 'INPUT') {
    contentToAnalyze = body.content ?? ''
  } else if (body.format === 'ORAL') {
    contentToAnalyze = body.oralTranscription ?? ''
  } else if (body.format === 'TEST') {
    contentToAnalyze = body.content ?? '' // JSON of answers
  } else if (body.format === 'INTERACTIVE') {
    contentToAnalyze = body.content ?? '' // JSON of answers
  } else if (body.format === 'FILE') {
    contentToAnalyze = `[Файл загружен: ${body.fileUrl}]`
  }

  const systemPrompt = `Ты — AI-проверщик домашних заданий по математике платформы FEMO.
${studentContext}
Задание: "${body.homeworkTitle ?? 'Без названия'}"
${body.homeworkDescription ? `Описание: ${body.homeworkDescription}` : ''}
Максимальный балл: ${body.maxScore ?? 100}
Формат: ${body.format}

Проанализируй ответ ученика и верни JSON-объект в следующем формате:
{
  "score": <число баллов>,
  "maxScore": ${body.maxScore ?? 100},
  "feedback": "<общий отзыв>",
  "strengths": ["<сильная сторона 1>", ...],
  "weaknesses": ["<что улучшить 1>", ...],
  "detailedAnalysis": [
    {
      "isCorrect": true/false,
      "explanation": "<объяснение>",
      "suggestion": "<рекомендация>"
    }
  ]
}

Будь конструктивным и подбадривающим. Объясняй ошибки подробно. Отвечай на русском.`

  let analysis: any

  // ── Demo mode: mock AI response ──
  if (!isAiAvailable()) {
    analysis = getMockHomeworkCheck(body.format, body.maxScore ?? 100)
  } else {
    // ── Production mode: real OpenAI ──
    const { useOpenAI } = await import('../../utils/ai-agent')
    const openai = useOpenAI()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contentToAnalyze || '[Пустой ответ]' }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const rawResponse = completion.choices[0]?.message?.content ?? '{}'
    try {
      analysis = JSON.parse(rawResponse)
    } catch {
      console.error('Failed to parse AI homework check response')
      analysis = { score: 0, maxScore: body.maxScore ?? 100, feedback: 'Не удалось обработать ответ AI. Попробуйте снова.', strengths: [], weaknesses: [], detailedAnalysis: [] }
    }
  }

  // Update submission with AI analysis + set status to CHECKED
  await supabase.from('HomeworkSubmission').update({
    status: 'CHECKED',
    aiScore: analysis.score,
    aiFeedback: analysis.feedback,
    aiAnalysis: analysis,
    aiCheckedAt: new Date().toISOString()
  } as any).eq('id', body.submissionId)

  // Update Student Model: adjust knowledge map based on score
  if (body.studentModelId && analysis.score !== undefined && analysis.maxScore) {
    const scoreRatio = analysis.score / analysis.maxScore

    // Resolve the actual topicId from the Homework table
    const { data: homework } = await supabase
      .from('Homework')
      .select('topicId')
      .eq('id', body.homeworkId)
      .single()

    const topicKey = (homework as any)?.topicId as string | null

    // Only update knowledgeMap if the homework is linked to a real topic
    if (topicKey) {
      const { data: currentModel } = await supabase
        .from('StudentModel')
        .select('knowledgeMap')
        .eq('id', body.studentModelId)
        .single()

      if (currentModel) {
        const km = ((currentModel as any).knowledgeMap as Record<string, number>) ?? {}
        const current = km[topicKey] ?? 50
        // EMA: 70% existing + 30% new score
        km[topicKey] = Math.round(current * 0.7 + scoreRatio * 100 * 0.3)

        await supabase.from('StudentModel').update({
          knowledgeMap: km,
          updatedAt: new Date().toISOString()
        } as any).eq('id', body.studentModelId)
      }
    }
  }

  return analysis
})
