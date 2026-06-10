import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const role = (user as unknown as { user_role?: string }).user_role
    ?? user.user_metadata?.role
  if (role !== 'ADMIN') throw createError({ statusCode: 403, message: 'Forbidden' })

  const supabase = serverSupabaseServiceRole(event)
  const teacherId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!teacherId) throw createError({ statusCode: 400, message: 'id обязателен' })

  // Get teacher to find userId
  const { data: teacher, error: fetchErr } = await supabase
    .from('Teacher')
    .select('id, userId')
    .eq('id', teacherId)
    .single()

  if (fetchErr || !teacher) {
    throw createError({ statusCode: 404, message: 'Учитель не найден' })
  }

  // Update User table fields
  const userPatch: Record<string, unknown> = {}
  if (body.name != null) userPatch.name = body.name
  if (body.surname != null) userPatch.surname = body.surname
  if (body.phone !== undefined) userPatch.phone = body.phone || null

  if (Object.keys(userPatch).length > 0) {
    const { error: userErr } = await supabase
      .from('User')
      .update(userPatch)
      .eq('id', teacher.userId)
    if (userErr) throw createError({ statusCode: 500, message: userErr.message })
  }

  // Update Teacher table fields
  const teacherPatch: Record<string, unknown> = {}
  if (body.yearsOfExperience !== undefined) teacherPatch.yearsOfExperience = body.yearsOfExperience ?? null
  if (body.specialization !== undefined) teacherPatch.specialization = body.specialization || null
  if (body.category !== undefined) teacherPatch.category = body.category || null
  if (body.bio !== undefined) teacherPatch.bio = body.bio || null
  if (body.rating !== undefined) teacherPatch.rating = Number(body.rating)

  if (Object.keys(teacherPatch).length > 0) {
    const { error: teacherErr } = await supabase
      .from('Teacher')
      .update(teacherPatch)
      .eq('id', teacherId)
    if (teacherErr) throw createError({ statusCode: 500, message: teacherErr.message })
  }

  return { ok: true }
})
