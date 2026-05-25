import { z } from 'zod'

const bodySchema = z.object({
  studentId: z.string().uuid()
})

/**
 * Parent removes a (possibly active) link to a child.
 * Deletes the ParentToStudent row via service_role — RLS otherwise blocks
 * client DELETEs on this table. If the link was ACTIVE, drops a notification
 * to the child so the removal isn't silent.
 */
export default defineEventHandler(async (event) => {
  const authUser = await requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = useServerSupabase(event)

  const { data: caller, error: callerErr } = await supabase
    .from('User').select('id, role, name').eq('authId', authUser.id).single()
  if (callerErr || !caller) throw createError({ statusCode: 401, message: 'User profile not found' })
  if (caller.role !== 'PARENT') throw createError({ statusCode: 403, message: 'Forbidden' })

  const { data: parentRow } = await supabase
    .from('Parent').select('id').eq('userId', caller.id).single()
  if (!parentRow) throw createError({ statusCode: 403, message: 'Parent profile not found' })

  // Capture the link (and its status) before deleting so we know whether the
  // student was previously visible to the parent — only then is a notification
  // warranted; a PENDING-cancellation doesn't need to bother the child.
  const { data: link } = await supabase
    .from('ParentToStudent')
    .select('status')
    .eq('parentId', (parentRow as { id: string }).id)
    .eq('studentId', body.studentId)
    .maybeSingle()

  const { error } = await supabase
    .from('ParentToStudent')
    .delete()
    .eq('parentId', (parentRow as { id: string }).id)
    .eq('studentId', body.studentId)
  if (error) throw createError({ statusCode: 500, message: error.message })

  if ((link as { status?: string } | null)?.status === 'ACTIVE') {
    const { data: studentRow } = await supabase
      .from('Student').select('userId').eq('id', body.studentId).maybeSingle()
    const studentUserId = (studentRow as { userId?: string } | null)?.userId
    if (studentUserId) {
      const who = (caller as { name?: string | null }).name ?? 'Родитель'
      await supabase.from('Notification').insert({
        userId: studentUserId,
        type: 'PARENT_LINK_REMOVED',
        title: 'Связь с родителем удалена',
        body: `${who} отвязал(а) ваш профиль. Доступ к данным больше не предоставляется.`,
        data: { link: '/student/parent-requests' }
      } as never)
    }
  }

  return { ok: true }
})
