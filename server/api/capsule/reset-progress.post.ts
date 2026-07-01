/**
 * POST /api/capsule/reset-progress
 *
 * Wipes the caller's progress for one capsule (all LayerProgress rows +
 * the PathProgress row). Used by the capsule page on mount in demo mode.
 */
import { z } from 'zod'
import type { H3Event } from 'h3'

const bodySchema = z.object({ lessonId: z.string().uuid() })

export default defineEventHandler(async (event: H3Event) => {
  const { studentId } = await getCurrentStudent(event)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: 'Некорректные данные' })
  const { lessonId } = parsed.data

  const supabase = useServerSupabase(event)
  await supabase.from('LayerProgress').delete().eq('studentId', studentId).eq('lessonId', lessonId)
  await supabase.from('PathProgress').delete().eq('studentId', studentId).eq('pathLessonId', lessonId)

  return { success: true, lessonId }
})
