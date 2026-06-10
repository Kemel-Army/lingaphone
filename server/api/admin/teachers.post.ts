import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const role = (user as unknown as { user_role?: string }).user_role
    ?? user.user_metadata?.role
  if (role !== 'ADMIN') throw createError({ statusCode: 403, message: 'Forbidden' })

  const supabase = serverSupabaseServiceRole(event)
  const body = await readBody(event)
  const { name, surname, patronymic, email, password, phone, yearsOfExperience, specialization, category, bio } = body

  if (!name?.trim() || !surname?.trim() || !email?.trim() || !password) {
    throw createError({ statusCode: 400, message: 'name, surname, email, password обязательны' })
  }

  // Create auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: {}
  })

  if (authErr || !authData.user) {
    const isDuplicate = authErr?.message?.toLowerCase().includes('already registered') || authErr?.message?.toLowerCase().includes('already been registered')
    throw createError({
      statusCode: isDuplicate ? 409 : 500,
      message: isDuplicate ? 'Пользователь с таким email уже существует' : (authErr?.message ?? 'Ошибка создания аккаунта')
    })
  }

  const userId = authData.user.id

  // Create User record
  const { data: userRecord, error: userErr } = await supabase
    .from('User')
    .insert({
      authId: userId,
      name: name.trim(),
      surname: surname.trim(),
      patronymic: patronymic?.trim() || null,
      email: email.trim(),
      phone: phone?.trim() || null,
      role: 'TEACHER',
      iin: null
    })
    .select('id')
    .single()

  if (userErr || !userRecord) {
    await supabase.auth.admin.deleteUser(userId)
    const isDuplicate = userErr?.message?.includes('duplicate key') || userErr?.code === '23505'
    throw createError({
      statusCode: isDuplicate ? 409 : 500,
      message: isDuplicate ? 'Пользователь с таким email уже существует' : (userErr?.message ?? 'Ошибка создания пользователя')
    })
  }

  const userInternalId = userRecord.id

  // Create Teacher record
  const { data: teacher, error: teacherErr } = await supabase
    .from('Teacher')
    .insert({
      userId: userInternalId,
      bio: bio?.trim() || null,
      yearsOfExperience: yearsOfExperience ?? null,
      specialization: specialization || null,
      category: category || null,
      rating: 0,
      reviewCount: 0
    })
    .select('id')
    .single()

  if (teacherErr) {
    await supabase.from('User').delete().eq('id', userInternalId)
    await supabase.auth.admin.deleteUser(userId)
    throw createError({ statusCode: 500, message: teacherErr.message })
  }

  return { id: teacher.id, userId: userInternalId }
})
