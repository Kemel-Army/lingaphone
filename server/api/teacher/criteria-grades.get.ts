/**
 * GET /api/teacher/criteria-grades?groupId=…&month=YYYY-MM   (TEACHER | ADMIN | DIRECTOR)
 *
 * Журнал «мотивашки» за месяц: уроки группы, ученики и оценки по 5 критериям.
 * Заменяет ручную Google-таблицу — учитель ставит 5 оценок за каждый урок.
 */
import { GRADE_CRITERIA, monthRange, type GradeCriterion } from '../../utils/motivation'
import { resolveTeacherScope, assertGroupInScope } from '../../utils/teacherScope'

interface LessonRow { id: string, topic: string, startsAt: string }
interface MemberRow {
  studentId: string
  Student: { User: { name: string, surname: string } | null } | null
}
interface GradeRow {
  lessonId: string
  studentId: string
  criterion: GradeCriterion
  value: number
}

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['TEACHER', 'ADMIN', 'DIRECTOR'])
  const supabase = useServerSupabase(event)

  const query = getQuery(event)
  const groupId = (query.groupId as string | undefined) ?? ''
  const month = (query.month as string | undefined) ?? ''

  if (!groupId) throw createError({ statusCode: 400, message: 'groupId обязателен' })
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw createError({ statusCode: 400, message: 'month должен быть в формате YYYY-MM' })
  }

  // Запрос идёт под service role, RLS не сработает — проверяем сами, иначе
  // любой учитель прочитал бы журнал чужой группы по её id.
  const scope = await resolveTeacherScope(supabase, (user.sub as string | undefined) ?? user.id)
  assertGroupInScope(scope, groupId)

  const { from, to } = monthRange(month)

  const [{ data: lessonRows }, { data: memberRows }] = await Promise.all([
    supabase
      .from('Lesson')
      .select('id, topic, startsAt')
      .eq('groupId', groupId)
      .gte('startsAt', from)
      .lt('startsAt', to)
      .order('startsAt', { ascending: true }) as unknown as { data: LessonRow[] | null },

    supabase
      .from('GroupMember')
      .select('studentId, Student!studentId ( User!userId ( name, surname ) )')
      .eq('groupId', groupId)
      .eq('status', 'ACTIVE') as unknown as { data: MemberRow[] | null }
  ])

  const lessons = lessonRows ?? []
  const lessonIds = lessons.map(l => l.id)

  const students = (memberRows ?? [])
    .map((m) => {
      const student = Array.isArray(m.Student) ? m.Student[0] : m.Student
      const user = student ? (Array.isArray(student.User) ? student.User[0] : student.User) : null
      return { studentId: m.studentId, name: user?.name ?? '', surname: user?.surname ?? '' }
    })
    .sort((a, b) => a.surname.localeCompare(b.surname, 'ru'))

  let grades: GradeRow[] = []
  if (lessonIds.length) {
    const { data } = await supabase
      .from('LessonCriterionGrade')
      .select('lessonId, studentId, criterion, value')
      .in('lessonId', lessonIds) as unknown as { data: GradeRow[] | null }
    grades = data ?? []
  }

  // studentId → lessonId → criterion → value
  const gradeMap: Record<string, Record<string, Partial<Record<GradeCriterion, number>>>> = {}
  for (const g of grades) {
    const byLesson = gradeMap[g.studentId] ?? (gradeMap[g.studentId] = {})
    const byCriterion = byLesson[g.lessonId] ?? (byLesson[g.lessonId] = {})
    byCriterion[g.criterion] = g.value
  }

  return { month, lessons, students, gradeMap, criteria: GRADE_CRITERIA }
})
