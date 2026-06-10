import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const supabase = serverSupabaseServiceRole(event)

  // Check admin role via JWT claim
  const role = (user as unknown as { user_role?: string }).user_role
    ?? user.user_metadata?.role
  if (role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody(event)
  const { name, level, teacherId, maxStudents, studentIds, schedule } = body

  if (!name?.trim() || !teacherId) {
    throw createError({ statusCode: 400, message: 'name и teacherId обязательны' })
  }

  // Create the group
  const { data: group, error: groupErr } = await supabase
    .from('Group')
    .insert({
      name: name.trim(),
      level: level ?? 'A1',
      teacherId,
      maxStudents: maxStudents ?? 12,
      schedule: schedule ?? {},
      branchId: null
    })
    .select('id')
    .single()

  if (groupErr || !group) {
    throw createError({ statusCode: 500, message: groupErr?.message ?? 'Ошибка создания группы' })
  }

  // Add students if provided
  if (Array.isArray(studentIds) && studentIds.length > 0) {
    const members = studentIds.map((sid: string) => ({
      groupId: group.id,
      studentId: sid
    }))
    const { error: memberErr } = await supabase
      .from('GroupMember')
      .insert(members)

    if (memberErr) {
      // Non-fatal — group was created, just members failed
      console.error('GroupMember insert error:', memberErr.message)
    }
  }

  return { id: group.id }
})
