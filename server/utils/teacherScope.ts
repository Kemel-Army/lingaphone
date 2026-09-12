/**
 * Границы видимости преподавателя.
 *
 * Маршруты «мотивашки» ходят в базу под service role, то есть RLS их не
 * ограничивает. Без явной проверки учитель мог бы передать чужой `groupId` и
 * прочитать журнал или бонусы чужого класса, поэтому область видимости
 * считаем здесь, в одном месте.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface TeacherScope {
  /** null = роль без ограничений (ADMIN / DIRECTOR). */
  groupIds: string[] | null
  teacherId: string | null
  userId: string
}

export const resolveTeacherScope = async (
  supabase: any,
  authId: string
): Promise<TeacherScope> => {
  const { data: userRow } = await supabase
    .from('User').select('id, role').eq('authId', authId).maybeSingle() as {
    data: { id: string, role: string } | null
  }
  if (!userRow) throw createError({ statusCode: 403, message: 'User not found' })

  if (userRow.role !== 'TEACHER') {
    return { groupIds: null, teacherId: null, userId: userRow.id }
  }

  const { data: teacherRow } = await supabase
    .from('Teacher').select('id').eq('userId', userRow.id).maybeSingle() as {
    data: { id: string } | null
  }
  if (!teacherRow) throw createError({ statusCode: 403, message: 'Teacher profile not found' })

  const { data: groups } = await supabase
    .from('Group').select('id').eq('teacherId', teacherRow.id) as {
    data: { id: string }[] | null
  }

  return {
    groupIds: (groups ?? []).map(g => g.id),
    teacherId: teacherRow.id,
    userId: userRow.id
  }
}

/** Бросает 403, если группа не входит в область видимости преподавателя. */
export const assertGroupInScope = (scope: TeacherScope, groupId: string): void => {
  if (scope.groupIds === null) return
  if (!scope.groupIds.includes(groupId)) {
    throw createError({ statusCode: 403, message: 'Нет доступа к этой группе' })
  }
}
