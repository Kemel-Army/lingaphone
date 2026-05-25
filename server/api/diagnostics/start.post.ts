import { z } from 'zod'

const bodySchema = z.object({
  subjectId: z.string().uuid()
})

/**
 * POST /api/diagnostics/start
 * Creates a new IN_PROGRESS DiagnosticResult for the calling student.
 * Returns the result id — used as the session token for subsequent
 * submit-answer / complete calls.
 */
export default defineEventHandler(async (event) => {
  const { studentId } = await getCurrentStudent(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  const { data, error } = await supabase
    .from('DiagnosticResult')
    .insert({
      studentId,
      subjectId: body.subjectId,
      status: 'IN_PROGRESS',
      answers: []
    } as never)
    .select('id')
    .single()

  if (error || !data) {
    throw createError({ statusCode: 500, message: error?.message ?? 'Failed to create diagnostic session' })
  }

  return { diagnosticResultId: (data as { id: string }).id }
})
