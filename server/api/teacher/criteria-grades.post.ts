/**
 * POST /api/teacher/criteria-grades   (TEACHER | ADMIN | DIRECTOR)
 *
 * Сохраняет оценки ученика за урок по 5 критериям «мотивашки».
 * Пустое/нулевое значение критерия = оценка снята (строка удаляется), чтобы
 * «не выставлено» не считалось нулём в месячном среднем.
 *
 * Body: { lessonId, studentId, values: { ATTENDANCE?: 1..5, … } }
 */
import { GRADE_CRITERIA, type GradeCriterion } from '../../utils/motivation'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['TEACHER', 'ADMIN', 'DIRECTOR'])
  const supabase = useServerSupabase(event)

  const body = await readBody(event) as {
    lessonId?: string
    studentId?: string
    values?: Partial<Record<GradeCriterion, number | null>>
  }

  const { lessonId, studentId } = body
  const values = body.values ?? {}

  if (!lessonId || !studentId) {
    throw createError({ statusCode: 400, message: 'lessonId и studentId обязательны' })
  }

  const unknown = Object.keys(values).filter(k => !GRADE_CRITERIA.includes(k as GradeCriterion))
  if (unknown.length) {
    throw createError({ statusCode: 400, message: `Неизвестные критерии: ${unknown.join(', ')}` })
  }

  const authId = (user.sub as string | undefined) ?? user.id

  const { data: userRow } = await supabase
    .from('User').select('id, role').eq('authId', authId).maybeSingle() as unknown as {
    data: { id: string, role: string } | null
  }
  if (!userRow) throw createError({ statusCode: 403, message: 'User not found' })

  let teacherId: string | null = null
  if (userRow.role === 'TEACHER') {
    const { data: teacherRow } = await supabase
      .from('Teacher').select('id').eq('userId', userRow.id).maybeSingle() as unknown as {
      data: { id: string } | null
    }
    if (!teacherRow) throw createError({ statusCode: 403, message: 'Teacher profile not found' })
    teacherId = teacherRow.id

    // Учитель ставит оценки только на своих уроках. Сервис-роль обходит RLS,
    // поэтому проверяем принадлежность урока здесь явно.
    const { data: lesson } = await supabase
      .from('Lesson')
      .select('id, Group!groupId ( teacherId )')
      .eq('id', lessonId)
      .maybeSingle() as unknown as {
      data: { id: string, Group: { teacherId: string } | { teacherId: string }[] | null } | null
    }
    const group = Array.isArray(lesson?.Group) ? lesson?.Group[0] : lesson?.Group
    if (!lesson || group?.teacherId !== teacherId) {
      throw createError({ statusCode: 403, message: 'Нет доступа к этому уроку' })
    }
  }

  const toUpsert: {
    lessonId: string
    studentId: string
    criterion: GradeCriterion
    value: number
    gradedBy: string | null
    gradedAt: string
  }[] = []
  const toDelete: GradeCriterion[] = []
  const now = new Date().toISOString()

  for (const criterion of GRADE_CRITERIA) {
    if (!(criterion in values)) continue
    const raw = values[criterion]
    if (raw === null || raw === undefined || raw === 0) {
      toDelete.push(criterion)
      continue
    }
    const value = Number(raw)
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw createError({ statusCode: 400, message: `${criterion}: оценка должна быть целым числом 1–5` })
    }
    toUpsert.push({ lessonId, studentId, criterion, value, gradedBy: teacherId, gradedAt: now })
  }

  if (toDelete.length) {
    const { error } = await supabase
      .from('LessonCriterionGrade')
      .delete()
      .eq('lessonId', lessonId)
      .eq('studentId', studentId)
      .in('criterion', toDelete)
    if (error) throw createError({ statusCode: 500, message: error.message })
  }

  if (toUpsert.length) {
    const { error } = await supabase
      .from('LessonCriterionGrade')
      .upsert(toUpsert, { onConflict: 'lessonId,studentId,criterion' })
    if (error) throw createError({ statusCode: 500, message: error.message })
  }

  return { ok: true, saved: toUpsert.length, cleared: toDelete.length }
})
