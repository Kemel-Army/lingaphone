/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'
import { isAiAvailable, getMockHomeworkTasks } from '../../utils/ai-mock'

const bodySchema = z.object({
  subjectId: z.string().uuid(),
  studentId: z.string().uuid(),
  studentModelId: z.string().uuid().optional(),
  format: z.enum(['TEST', 'INPUT', 'TEXT', 'INTERACTIVE']).default('TEST'),
  count: z.number().min(1).max(10).default(5),
  focusOnWeakTopics: z.boolean().default(true)
})

export default defineEventHandler(async (event) => {
  const authUser = await requireRole(event, ['ADMIN', 'PARENT'])
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  // For PARENT callers, verify there's an ACTIVE link to body.studentId.
  // ADMIN can target any student.
  const callerRole = (authUser as Record<string, unknown>).user_role as string | undefined
  if (callerRole === 'PARENT') {
    const { data: callerUser } = await supabase
      .from('User').select('id').eq('authId', (authUser as { id: string }).id).maybeSingle()
    if (!callerUser) {
      throw createError({ statusCode: 403, message: 'User not found' })
    }
    const { data: parentRow } = await supabase
      .from('Parent').select('id').eq('userId', (callerUser as { id: string }).id).maybeSingle()
    if (!parentRow) {
      throw createError({ statusCode: 403, message: 'Parent profile not found' })
    }
    const { data: link } = await supabase
      .from('ParentToStudent').select('id')
      .eq('parentId', (parentRow as { id: string }).id)
      .eq('studentId', body.studentId)
      .eq('status', 'ACTIVE')
      .maybeSingle()
    if (!link) {
      throw createError({ statusCode: 403, message: 'No access to this student' })
    }

    if (body.studentModelId) {
      const { data: sm } = await supabase
        .from('StudentModel').select('studentId').eq('id', body.studentModelId).maybeSingle()
      if (!sm || (sm as { studentId: string }).studentId !== body.studentId) {
        throw createError({ statusCode: 403, message: 'Student model does not belong to this student' })
      }
    }
  }

  // Load subject
  const { data: subject } = await supabase
    .from('Subject')
    .select('name')
    .eq('id', body.subjectId)
    .single()

  // Load Student Model for adaptive homework
  let weakTopics: string[] = []
  let difficultyLevel = 5
  if (body.studentModelId) {
    const { data: sm } = await supabase
      .from('StudentModel')
      .select('knowledgeMap, difficultyLevel')
      .eq('id', body.studentModelId)
      .single()
    if (sm) {
      difficultyLevel = (sm as any).difficultyLevel ?? 5
      const km = (sm as any).knowledgeMap as Record<string, number> | null
      if (km && body.focusOnWeakTopics) {
        weakTopics = Object.entries(km)
          .filter(([_, v]) => v < 60)
          .sort(([, a], [, b]) => a - b)
          .map(([k]) => k)
          .slice(0, 5)
      }
    }
  }

  let tasks: any[]

  // ── Demo mode: mock tasks ──
  if (!isAiAvailable()) {
    tasks = getMockHomeworkTasks(body.format, body.count)
  } else {
    // ── Production mode: real OpenAI ──
    const { useOpenAI } = await import('../../utils/ai-agent')
    const openai = useOpenAI()

    const formatInstructions: Record<string, string> = {
      TEST: `Каждое задание — вопрос с 4 вариантами ответа.
Формат: { "question": "...", "options": [{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}], "correctOptionId": "...", "explanation": "..." }`,
      INPUT: `Каждое задание — вопрос с коротким ответом (число, слово, фраза).
Формат: { "question": "...", "correctAnswer": "...", "explanation": "..." }`,
      TEXT: `Каждое задание — открытый вопрос для развёрнутого ответа.
Формат: { "question": "...", "rubric": "...", "sampleAnswer": "..." }`,
      INTERACTIVE: `Каждое задание — задание на сопоставление или порядок.
Формат: { "question": "...", "type": "matching"|"ordering", "items": [...], "correctOrder": [...] }`
    }

    const systemPrompt = `Ты — генератор адаптивных домашних заданий по математике платформы FEMO.
Предмет: ${(subject as any)?.name ?? 'Общий'}
Уровень сложности: ${difficultyLevel}/10
${weakTopics.length ? `Фокус на слабых темах: ${weakTopics.join(', ')}` : ''}

Сгенерируй ${body.count} заданий формата ${body.format}.
${formatInstructions[body.format] ?? ''}

Верни JSON: { "tasks": [...] }

Задания должны быть адаптированы под уровень ученика. Ответы на русском.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Сгенерируй ${body.count} заданий.` }
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' }
    })

    const rawResponse = completion.choices[0]?.message?.content ?? '{"tasks":[]}'
    try {
      const parsed = JSON.parse(rawResponse)
      tasks = parsed.tasks ?? []
    } catch {
      tasks = []
    }
  }

  // Save generated homework (store AI tasks in `questions` JSONB)
  const { data: homework, error } = await supabase.from('Homework').insert({
    title: `Адаптивное ДЗ: ${(subject as any)?.name ?? 'Предмет'}`,
    description: weakTopics.length ? `Фокус: ${weakTopics.join(', ')}` : 'Адаптивное задание',
    format: body.format,
    isAiGenerated: true,
    questions: tasks,
    maxScore: body.count * 10
  } as any).select().single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Assign to student — create a HomeworkSubmission with ASSIGNED status
  await supabase.from('HomeworkSubmission').insert({
    homeworkId: (homework as any).id,
    studentId: body.studentId,
    status: 'ASSIGNED'
  })

  return { homework, tasks }
})
