/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * GET /api/student/parent-requests
 * Returns PENDING parent-link requests addressed to the current student,
 * with the requesting parent's display info. Uses service_role because the
 * student cannot SELECT the Parent/User rows directly under RLS.
 */
export default defineEventHandler(async (event) => {
  const { studentId } = await getCurrentStudent(event)
  const supabase = useServerSupabase(event)

  const { data, error } = await supabase
    .from('ParentToStudent')
    .select('id, parentId, status, createdAt, Parent(User(name, surname, email, avatarUrl))')
    .eq('studentId', studentId)
    .eq('status', 'PENDING')
    .order('createdAt', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return {
    requests: (data ?? []).map((row: any) => ({
      id: row.id as string,
      parentId: row.parentId as string,
      status: row.status as string,
      createdAt: row.createdAt as string,
      parent: {
        name: row.Parent?.User?.name ?? null,
        surname: row.Parent?.User?.surname ?? null,
        email: row.Parent?.User?.email ?? null,
        avatarUrl: row.Parent?.User?.avatarUrl ?? null
      }
    }))
  }
})
