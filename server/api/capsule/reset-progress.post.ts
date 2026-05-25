import { z } from 'zod'

const schema = z.object({
  lessonId: z.string().uuid()
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const parsed = schema.parse(body)
  const supabase = useServerSupabase(event)

  let resolvedUserId: string | null = null

  const { data: authUserRow } = await supabase
    .from('User')
    .select('id')
    .eq('authId', user.id)
    .maybeSingle()

  if (authUserRow?.id) {
    resolvedUserId = authUserRow.id
  } else if (user.email) {
    const { data: emailUserRow } = await supabase
      .from('User')
      .select('id, authId')
      .eq('email', user.email)
      .maybeSingle()

    if (emailUserRow?.id) {
      resolvedUserId = emailUserRow.id

      if (!emailUserRow.authId) {
        await supabase
          .from('User')
          .update({ authId: user.id })
          .eq('id', emailUserRow.id)
      }
    }
  }

  if (!resolvedUserId) {
    throw createError({ statusCode: 401, message: 'User not found' })
  }

  const { data: studentRow, error: studentErr } = await supabase
    .from('Student')
    .select('id')
    .eq('userId', resolvedUserId)
    .single()

  if (studentErr || !studentRow) {
    throw createError({ statusCode: 403, message: 'Student profile required' })
  }

  const studentId = (studentRow as { id: string }).id

  const { error: layerDeleteError } = await supabase
    .from('LayerProgress')
    .delete()
    .eq('studentId', studentId)
    .eq('lessonId', parsed.lessonId)

  if (layerDeleteError) throw layerDeleteError

  const { error: pathDeleteError } = await supabase
    .from('PathProgress')
    .delete()
    .eq('studentId', studentId)
    .eq('pathLessonId', parsed.lessonId)

  if (pathDeleteError) throw pathDeleteError

  return {
    success: true,
    lessonId: parsed.lessonId
  }
})
