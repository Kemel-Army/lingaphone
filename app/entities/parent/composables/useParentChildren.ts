import type { Database } from '~/shared/types/database.types'
import type {
  ParentChild,
  ChildAttendanceRow,
  ChildPayment,
  ChildSubscription,
  AttendanceStatus,
  PaymentStatus,
  SubscriptionStatus
} from '../model/types'

/**
 * Родитель: агрегированные данные по детям (ТЗ разд. 6) — успеваемость,
 * посещаемость, ДЗ, финансы. Всё под RLS (только свои дети).
 */
export const useParentChildren = () => {
  const supabase = useSupabaseClient<Database>()

  const fetchChildren = async (): Promise<ParentChild[]> => {
    const { data: links, error: linksErr } = await supabase
      .from('ParentToStudent')
      .select('student:Student(id, level, user:User(name, surname, avatarUrl))')
    if (linksErr) throw linksErr

    type LinkRow = { student: { id: string, level: string, user: { name: string, surname: string, avatarUrl: string | null } | null } | null }
    const children = ((links ?? []) as unknown as LinkRow[])
      .map(l => l.student)
      .filter((s): s is NonNullable<LinkRow['student']> => !!s)
    const ids = children.map(c => c.id)
    if (!ids.length) return []

    const [gradesRes, attRes, hwRes, subsRes, payRes, memRes] = await Promise.all([
      supabase.from('Grade').select('studentId, value, gradedAt').in('studentId', ids),
      supabase.from('Attendance').select('id, studentId, status, markedAt, lesson:Lesson(startsAt, topic)').in('studentId', ids),
      supabase.from('HomeworkSubmission').select('studentId, status').in('studentId', ids),
      supabase.from('Subscription').select('studentId, plan, price, status, nextPaymentAt, lessonsUsed, lessonsTotal, createdAt').in('studentId', ids),
      supabase.from('Payment').select('id, studentId, amount, paidAt, status').in('studentId', ids).order('paidAt', { ascending: false }),
      supabase.from('GroupMember').select('studentId, group:Group(id, name)').in('studentId', ids).eq('status', 'ACTIVE')
    ])

    const grades = gradesRes.data ?? []
    const att = (attRes.data ?? []) as unknown as Array<{ id: string, studentId: string, status: AttendanceStatus, markedAt: string, lesson: { startsAt: string, topic: string } | null }>
    const hw = hwRes.data ?? []
    const subs = (subsRes.data ?? []) as unknown as Array<{ studentId: string, plan: string, price: number, status: SubscriptionStatus, nextPaymentAt: string | null, lessonsUsed: number, lessonsTotal: number, createdAt: string }>
    const pay = (payRes.data ?? []) as unknown as Array<{ id: string, studentId: string, amount: number, paidAt: string, status: PaymentStatus }>
    const mem = (memRes.data ?? []) as unknown as Array<{ studentId: string, group: { id: string, name: string } | null }>

    return children.map((c) => {
      const cGrades = grades.filter(g => g.studentId === c.id)
      const avgGrade = cGrades.length ? cGrades.reduce((s, g) => s + g.value, 0) / cGrades.length : 0

      const cAtt = att.filter(a => a.studentId === c.id)
      const present = cAtt.filter(a => a.status === 'PRESENT').length
      const absent = cAtt.filter(a => a.status === 'ABSENT').length
      const late = cAtt.filter(a => a.status === 'LATE').length
      const total = cAtt.length
      const attendanceRows: ChildAttendanceRow[] = cAtt
        .sort((a, b) => new Date(b.markedAt).getTime() - new Date(a.markedAt).getTime())
        .slice(0, 30)
        .map(a => ({
          id: a.id,
          status: a.status,
          markedAt: a.markedAt,
          date: a.lesson?.startsAt ?? null,
          topic: a.lesson?.topic ?? ''
        }))

      const cHw = hw.filter(h => h.studentId === c.id)
      const done = cHw.filter(h => h.status === 'SUBMITTED' || h.status === 'CHECKED').length

      const cSubs = subs.filter(s => s.studentId === c.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      const activeSub = cSubs.find(s => s.status === 'ACTIVE') ?? cSubs[0] ?? null
      const subscription: ChildSubscription | null = activeSub
        ? {
            plan: activeSub.plan,
            price: Number(activeSub.price),
            status: activeSub.status,
            nextPaymentAt: activeSub.nextPaymentAt,
            lessonsUsed: activeSub.lessonsUsed,
            lessonsTotal: activeSub.lessonsTotal
          }
        : null

      const payments: ChildPayment[] = pay
        .filter(p => p.studentId === c.id)
        .map(p => ({ id: p.id, amount: Number(p.amount), paidAt: p.paidAt, status: p.status }))

      return {
        studentId: c.id,
        name: c.user?.name ?? '',
        surname: c.user?.surname ?? '',
        avatarUrl: c.user?.avatarUrl ?? null,
        level: c.level,
        groups: mem.filter(m => m.studentId === c.id && m.group).map(m => ({ id: m.group!.id, name: m.group!.name })),
        avgGrade,
        gradeCount: cGrades.length,
        attendance: { total, present, absent, late, pct: total ? Math.round((present / total) * 100) : 0 },
        attendanceRows,
        homework: { done, total: cHw.length },
        subscription,
        payments
      } satisfies ParentChild
    })
  }

  return { fetchChildren }
}
