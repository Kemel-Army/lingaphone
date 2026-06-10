/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'
import { isAiAvailable, getMockOralCheck } from '../../utils/ai-mock'

const bodySchema = z.object({
  submissionId: z.string().uuid(),
  audioUrl: z.string().url().refine(
    url => url.includes('supabase') || url.includes('homework-submissions'),
    'Audio URL must be from Supabase Storage'
  ),
  homeworkTitle: z.string().max(500).optional(),
  homeworkDescription: z.string().max(2000).optional(),
  maxScore: z.number().min(1).max(1000).optional(),
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

  // ── Demo mode: return mock transcription + analysis ──
  if (!isAiAvailable()) {
    const mock = getMockOralCheck(body.maxScore ?? 100)

    // Save mock transcription
    await supabase.from('HomeworkSubmission').update({
      oralTranscription: mock.transcription
    } as any).eq('id', body.submissionId)

    // Update submission with mock analysis
    await supabase.from('HomeworkSubmission').update({
      status: 'CHECKED',
      aiScore: mock.analysis.score,
      aiFeedback: mock.analysis.feedback,
      aiAnalysis: mock.analysis,
      aiCheckedAt: new Date().toISOString()
    } as any).eq('id', body.submissionId)

    return { transcription: mock.transcription, analysis: mock.analysis }
  }

  // ── Production mode: real OpenAI ──
  const { useOpenAI } = await import('../../utils/ai-agent')
  const openai = useOpenAI()

  // Step 1: Download audio from Supabase Storage
  const storagePath = body.audioUrl.replace(/^.*homework-submissions\//, '')
  if (storagePath.includes('..') || storagePath.startsWith('/')) {
    throw createError({ statusCode: 400, message: 'Invalid audio file path' })
  }
  const { data: fileData } = await supabase.storage
    .from('homework-submissions')
    .download(storagePath)

  if (!fileData) {
    throw createError({ statusCode: 400, message: 'Failed to download audio file' })
  }

  // Step 2: Transcribe with Whisper
  const transcription = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file: new File([fileData], 'audio.webm', { type: 'audio/webm' }),
    language: 'ru'
  })

  const transcript = transcription.text

  // Step 3: Save transcription to submission
  await supabase.from('HomeworkSubmission').update({
    oralTranscription: transcript
  } as any).eq('id', body.submissionId)

  // Step 4: AI analysis of transcription
  const systemPrompt = `Ты — AI-проверщик устных ответов по математике платформы FEMO.
Задание: "${body.homeworkTitle ?? 'Устный ответ'}"
${body.homeworkDescription ? `Описание: ${body.homeworkDescription}` : ''}
Максимальный балл: ${body.maxScore ?? 100}

Ученик дал устный ответ (транскрибирован). Проанализируй содержание и качество ответа.
Верни JSON:
{
  "score": <баллы>,
  "maxScore": ${body.maxScore ?? 100},
  "feedback": "<общий отзыв>",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "detailedAnalysis": [
    { "isCorrect": true/false, "explanation": "...", "suggestion": "..." }
  ]
}

Оценивай: полноту ответа, правильность, речевую связность, использование терминологии. Отвечай на русском.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Транскрипция устного ответа ученика:\n\n${transcript}` }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  })

  const rawResponse = completion.choices[0]?.message?.content ?? '{}'
  let analysis: any
  try {
    analysis = JSON.parse(rawResponse)
  } catch {
    console.error('Failed to parse AI oral check response')
    analysis = { score: 0, maxScore: body.maxScore ?? 100, feedback: 'Не удалось обработать ответ AI. Попробуйте снова.', strengths: [], weaknesses: [], detailedAnalysis: [] }
  }

  // Update submission + set status to CHECKED
  await supabase.from('HomeworkSubmission').update({
    status: 'CHECKED',
    aiScore: analysis.score,
    aiFeedback: analysis.feedback,
    aiAnalysis: analysis,
    aiCheckedAt: new Date().toISOString()
  } as any).eq('id', body.submissionId)

  return { transcription: transcript, analysis }
})
