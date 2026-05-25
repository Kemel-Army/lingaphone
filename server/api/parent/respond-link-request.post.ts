import { z } from 'zod'

const bodySchema = z.object({
  linkId: z.string().uuid(),
  accept: z.boolean()
})

/**
 * Student responds to a PENDING parent-link request.
 * accept=true  → set link.status = 'ACTIVE'
 * accept=false → delete the link
 */
export default defineEventHandler(async (event) => {
  const { studentId } = await getCurrentStudent(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  const { data: link, error: linkErr } = await supabase
    .from('ParentToStudent')
    .select('id, studentId, status')
    .eq('id', body.linkId)
    .maybeSingle()

  if (linkErr) throw createError({ statusCode: 500, message: linkErr.message })
  if (!link) throw createError({ statusCode: 404, message: 'Link request not found' })
  if ((link as { studentId: string }).studentId !== studentId) {
    throw createError({ statusCode: 403, message: 'Not your link request' })
  }
  if ((link as { status: string }).status !== 'PENDING') {
    throw createError({ statusCode: 409, message: 'Link request already resolved' })
  }

  if (body.accept) {
    const { error: updErr } = await supabase
      .from('ParentToStudent')
      .update({
        status: 'ACTIVE',
        respondedAt: new Date().toISOString()
      } as never)
      .eq('id', body.linkId)
    if (updErr) throw createError({ statusCode: 500, message: updErr.message })
    return { result: 'accepted' as const, linkId: body.linkId }
  }

  const { error: delErr } = await supabase
    .from('ParentToStudent')
    .delete()
    .eq('id', body.linkId)
  if (delErr) throw createError({ statusCode: 500, message: delErr.message })
  return { result: 'rejected' as const, linkId: body.linkId }
})
