/**
 * GET /api/student/motivation?month=YYYY-MM[&studentId=…]
 *
 * Мотивация глазами ученика: каждый урок месяца с пятью оценками, итоговый
 * балл, медаль и бонус — плюс история медалей за прошлые месяцы.
 *
 * Ученик видит только себя; родитель — своих детей (через `studentId`);
 * преподаватель — учеников своих групп; админ и директор — любого.
 */
import { buildStudentMonth } from '../../utils/motivationQuery'
import { monthKey } from '../../utils/motivation'

interface MedalHistoryRow {
  month: string
  medal: string
  averageGrade: number
  payout: number
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = useServerSupabase(event)

  const query = getQuery(event)
  const month = (query.month as string | undefined) || monthKey(new Date())
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw createError({ statusCode: 400, message: 'month должен быть в формате YYYY-MM' })
  }
  const requestedId = (query.studentId as string | undefined) || null

  const authId = (user.sub as string | undefined) ?? user.id
  const { data: userRow } = await supabase
    .from('User').select('id, role').eq('authId', authId).maybeSingle() as unknown as {
    data: { id: string, role: string } | null
  }
  if (!userRow) throw createError({ statusCode: 403, message: 'User not found' })

  const studentId = await resolveStudentId(supabase, userRow, requestedId)

  const [data, { data: medals }] = await Promise.all([
    buildStudentMonth(supabase, studentId, month),
    supabase
      .from('MonthlyMedal')
      .select('month, medal, averageGrade, payout')
      .eq('studentId', studentId)
      .order('month', { ascending: false })
      .limit(12) as unknown as Promise<{ data: MedalHistoryRow[] | null }>
  ])

  return { ...data, history: medals ?? [] }
})

/**
 * Чей дневник открываем. Запрос идёт под service role, поэтому родство и
 * принадлежность к группе проверяем здесь — RLS тут не защитит.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
async function resolveStudentId(
  supabase: any,
  userRow: { id: string, role: string },
  requestedId: string | null
): Promise<string> {
  if (userRow.role === 'STUDENT') {
    const { data } = await supabase
      .from('Student').select('id').eq('userId', userRow.id).maybeSingle() as {
      data: { id: string } | null
    }
    if (!data) throw createError({ statusCode: 403, message: 'Student profile not found' })
    // Ученик смотрит только свой дневник, даже если попросил чужой.
    return data.id
  }

  if (!requestedId) throw createError({ statusCode: 400, message: 'studentId обязателен' })

  if (userRow.role === 'ADMIN' || userRow.role === 'DIRECTOR') return requestedId

  if (userRow.role === 'PARENT') {
    const { data: parent } = await supabase
      .from('Parent').select('id').eq('userId', userRow.id).maybeSingle() as {
      data: { id: string } | null
    }
    if (!parent) throw createError({ statusCode: 403, message: 'Parent profile not found' })

    const { data: link } = await supabase
      .from('ParentToStudent')
      .select('studentId')
      .eq('parentId', parent.id)
      .eq('studentId', requestedId)
      .maybeSingle() as { data: { studentId: string } | null }
    if (!link) throw createError({ statusCode: 403, message: 'Это не ваш ребёнок' })
    return requestedId
  }

  if (userRow.role === 'TEACHER') {
    const { data: teacher } = await supabase
      .from('Teacher').select('id').eq('userId', userRow.id).maybeSingle() as {
      data: { id: string } | null
    }
    if (!teacher) throw createError({ statusCode: 403, message: 'Teacher profile not found' })

    const { data: groups } = await supabase
      .from('Group').select('id').eq('teacherId', teacher.id) as { data: { id: string }[] | null }
    const groupIds = (groups ?? []).map(g => g.id)
    if (!groupIds.length) throw createError({ statusCode: 403, message: 'Нет доступа к этому ученику' })

    const { data: member } = await supabase
      .from('GroupMember')
      .select('studentId')
      .eq('studentId', requestedId)
      .in('groupId', groupIds)
      .limit(1) as { data: { studentId: string }[] | null }
    if (!member?.length) throw createError({ statusCode: 403, message: 'Нет доступа к этому ученику' })
    return requestedId
  }

  throw createError({ statusCode: 403, message: 'Forbidden' })
}
