/**
 * Сборка месячной сводной «мотивашки» из БД.
 *
 * Вынесено из route-хендлеров, потому что одну и ту же выборку используют
 * и просмотр сводной (`GET /api/admin/motivation`), и пересчёт медалей
 * (`POST /api/admin/motivation/recompute`).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computeMotivation, monthRange, type MedalKind } from './motivation'

export interface MotivationRow {
  studentId: string
  name: string
  surname: string
  fullName: string
  groupId: string | null
  groupName: string
  /** Сумма всех оценок учителя за месяц. */
  gradeSum: number
  gradesCount: number
  attendedLessons: number
  lessonsInMonth: number
  subscriptionLessons: number
  instagram: boolean
  paidOnTime: boolean
  books: boolean
  teacherAvg: number
  instagramPoints: number
  paymentPoints: number
  bookPoints: number
  lessonsCounted: number
  average: number
  participates: boolean
  medal: MedalKind
  payout: number
  /** Среднее кол-во оценок на посещённый урок — в таблице «должно быть 5». */
  avgGradesPerLesson: number
}

export interface MonthlySummary {
  month: string
  rows: MotivationRow[]
  totals: { bronze: number, silver: number, gold: number, none: number, payout: number }
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Заведомо пустой фильтр: `.in()` без значений возвращает всё, а нам нужно ничего. */
const NO_MATCH = ['00000000-0000-0000-0000-000000000000']

const pick = <T>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v)

/**
 * @param groupId      сузить до одной группы (null = все доступные)
 * @param allowedGroupIds область видимости вызывающего; null = без ограничений
 *                     (ADMIN/DIRECTOR), массив = только эти группы (TEACHER)
 */
export const buildMonthlySummary = async (
  supabase: any,
  month: string,
  groupId: string | null,
  allowedGroupIds: string[] | null = null
): Promise<MonthlySummary> => {
  const empty: MonthlySummary = {
    month,
    rows: [],
    totals: { bronze: 0, silver: 0, gold: 0, none: 0, payout: 0 }
  }

  // Преподаватель без единой группы не должен увидеть вообще ничего.
  if (allowedGroupIds !== null && allowedGroupIds.length === 0) return empty

  // ── Уроки месяца ──────────────────────────────────────────────────────────
  const { from, to } = monthRange(month)

  let lessonQuery = supabase
    .from('Lesson')
    .select('id, groupId')
    .gte('startsAt', from)
    .lt('startsAt', to)

  if (groupId) lessonQuery = lessonQuery.eq('groupId', groupId)
  else if (allowedGroupIds !== null) lessonQuery = lessonQuery.in('groupId', allowedGroupIds)

  const { data: lessonRows } = await lessonQuery as { data: { id: string, groupId: string }[] | null }
  const lessons = lessonRows ?? []
  const lessonIds = lessons.map(l => l.id)
  if (!lessons.length) return empty

  const groupIds = [...new Set(lessons.map(l => l.groupId))]

  // Сколько уроков было в каждой группе — основа для «занятий по абонементу»,
  // пока менеджер не проставил своё число.
  const lessonsPerGroup = new Map<string, number>()
  for (const l of lessons) lessonsPerGroup.set(l.groupId, (lessonsPerGroup.get(l.groupId) ?? 0) + 1)

  // ── Ученики этих групп ────────────────────────────────────────────────────
  const { data: memberRows } = await supabase
    .from('GroupMember')
    .select('studentId, groupId, Student!studentId ( User!userId ( name, surname ) ), Group!groupId ( name )')
    .eq('status', 'ACTIVE')
    .in('groupId', groupIds) as {
    data: { studentId: string, groupId: string, Student: any, Group: any }[] | null
  }

  // Ученик может состоять в нескольких группах; оценки и посещения мы считаем
  // по всем его урокам сразу, поэтому и «уроков в месяце» складываем по всем
  // его группам — иначе делитель занижен и балл необоснованно высокий.
  const students = new Map<string, {
    name: string
    surname: string
    groupIds: string[]
    groupNames: string[]
  }>()

  for (const m of memberRows ?? []) {
    const existing = students.get(m.studentId)
    const groupName = pick<{ name: string }>(m.Group)?.name ?? ''
    if (existing) {
      if (!existing.groupIds.includes(m.groupId)) {
        existing.groupIds.push(m.groupId)
        if (groupName) existing.groupNames.push(groupName)
      }
      continue
    }
    const student = pick<{ User: any }>(m.Student)
    const user = student ? pick<{ name: string, surname: string }>(student.User) : null
    students.set(m.studentId, {
      name: user?.name ?? '',
      surname: user?.surname ?? '',
      groupIds: [m.groupId],
      groupNames: groupName ? [groupName] : []
    })
  }

  const studentIds = [...students.keys()]
  if (!studentIds.length) return empty

  // ── Оценки по критериям, посещаемость, менеджерские параметры ─────────────
  const [{ data: gradeRows }, { data: attendanceRows }, { data: inputRows }] = await Promise.all([
    supabase
      .from('LessonCriterionGrade')
      .select('studentId, value')
      .in('lessonId', lessonIds.length ? lessonIds : NO_MATCH) as Promise<{
      data: { studentId: string, value: number }[] | null
    }>,
    supabase
      .from('Attendance')
      .select('studentId, status')
      .in('lessonId', lessonIds.length ? lessonIds : NO_MATCH) as Promise<{
      data: { studentId: string, status: string }[] | null
    }>,
    supabase
      .from('MonthlyMotivationInput')
      .select('studentId, instagram, paidOnTime, books, subscriptionLessons')
      .eq('month', month)
      .in('studentId', studentIds) as Promise<{
      data: {
        studentId: string
        instagram: boolean
        paidOnTime: boolean
        books: boolean
        subscriptionLessons: number
      }[] | null
    }>
  ])

  const gradeSum = new Map<string, number>()
  const gradeCount = new Map<string, number>()
  for (const g of gradeRows ?? []) {
    gradeSum.set(g.studentId, (gradeSum.get(g.studentId) ?? 0) + g.value)
    gradeCount.set(g.studentId, (gradeCount.get(g.studentId) ?? 0) + 1)
  }

  // «Посетил + отработал» (AH) — PRESENT и LATE считаем посещением.
  const attended = new Map<string, number>()
  for (const a of attendanceRows ?? []) {
    if (a.status === 'ABSENT') continue
    attended.set(a.studentId, (attended.get(a.studentId) ?? 0) + 1)
  }

  const inputs = new Map((inputRows ?? []).map(i => [i.studentId, i]))

  const rows: MotivationRow[] = studentIds.map((studentId) => {
    const s = students.get(studentId)!
    const input = inputs.get(studentId)
    const lessonsInMonth = s.groupIds.reduce((sum, gid) => sum + (lessonsPerGroup.get(gid) ?? 0), 0)
    const subscriptionLessons = input?.subscriptionLessons ?? lessonsInMonth
    const sum = gradeSum.get(studentId) ?? 0
    const count = gradeCount.get(studentId) ?? 0
    const attendedLessons = attended.get(studentId) ?? 0

    const calc = computeMotivation({
      gradeSum: sum,
      gradesCount: count,
      attendedLessons,
      subscriptionLessons,
      instagram: input?.instagram ?? false,
      paidOnTime: input?.paidOnTime ?? false,
      books: input?.books ?? false
    })

    return {
      studentId,
      name: s.name,
      surname: s.surname,
      fullName: `${s.surname} ${s.name}`.trim(),
      groupId: s.groupIds[0] ?? null,
      groupName: s.groupNames.join(', '),
      gradeSum: sum,
      gradesCount: count,
      attendedLessons,
      lessonsInMonth,
      subscriptionLessons,
      instagram: input?.instagram ?? false,
      paidOnTime: input?.paidOnTime ?? false,
      books: input?.books ?? false,
      avgGradesPerLesson: attendedLessons > 0 ? round2(count / attendedLessons) : 0,
      ...calc
    }
  }).sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'))

  const totals = rows.reduce(
    (acc, r) => {
      if (r.medal === 'BRONZE') acc.bronze++
      else if (r.medal === 'SILVER') acc.silver++
      else if (r.medal === 'GOLD') acc.gold++
      else acc.none++
      acc.payout += r.payout
      return acc
    },
    { bronze: 0, silver: 0, gold: 0, none: 0, payout: 0 }
  )

  return { month, rows, totals }
}
