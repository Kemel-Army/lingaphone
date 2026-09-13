/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Ежедневная задача уведомлений (ТЗ разд. 16) — время-зависимые триггеры:
 *   • Приближается оплата — активный абонемент с nextPaymentAt в ближайшие
 *     3 дня → родители + ученик.
 *   • Низкая успеваемость — средний балл за текущий месяц < 3.5 (≥3 оценки)
 *     → родители.
 * Идемпотентно: не дублируем один и тот же тип уведомления пользователю
 * чаще раза в несколько дней.
 * Событийные триггеры (пропуск урока, новое ДЗ) — на уровне БД.
 */

const PAYMENT_LOOKAHEAD_DAYS = 3
const LOW_GRADE_THRESHOLD = 3.5
const MIN_GRADES = 3
const DEDUPE_DAYS = 5

interface NotifRow { userId: string, type: string, title: string, body: string }

export default defineTask({
  meta: {
    name: 'notify-daily',
    description: 'Уведомления о приближающейся оплате и низкой успеваемости'
  },
  async run() {
    const supabase = taskServiceRoleClient()
    const now = new Date()
    const iso = (d: Date) => d.toISOString()
    const dayKey = (d: Date) => d.toISOString().slice(0, 10)

    // Карты: студент → userId, студент → [родительские userId].
    const { data: students } = await supabase.from('Student').select('id, userId')
    const userByStudent = new Map<string, string>()
    for (const s of (students ?? []) as any[]) userByStudent.set(s.id, s.userId)

    const { data: links } = await supabase
      .from('ParentToStudent')
      .select('studentId, Parent(userId)')
    const parentsByStudent = new Map<string, string[]>()
    for (const l of (links ?? []) as any[]) {
      const uid = l.Parent?.userId
      if (!uid) continue
      const arr = parentsByStudent.get(l.studentId) ?? []
      arr.push(uid)
      parentsByStudent.set(l.studentId, arr)
    }

    // Дедуп: уже отправленные уведомления этих типов за последние N дней.
    const since = new Date(now.getTime() - DEDUPE_DAYS * 86400000)
    const { data: recent } = await supabase
      .from('Notification')
      .select('userId, type, createdAt')
      .in('type', ['PAYMENT_DUE', 'LOW_PERFORMANCE'])
      .gte('createdAt', iso(since))
    const sentKeys = new Set<string>()
    for (const n of (recent ?? []) as any[]) sentKeys.add(`${n.userId}:${n.type}`)

    const out: NotifRow[] = []
    const push = (userId: string, type: string, title: string, body: string) => {
      const key = `${userId}:${type}`
      if (sentKeys.has(key)) return
      sentKeys.add(key)
      out.push({ userId, type, title, body })
    }

    // ─── Приближается оплата ─────────────────────────────────────────
    const horizon = new Date(now.getTime() + PAYMENT_LOOKAHEAD_DAYS * 86400000)
    const { data: subs } = await supabase
      .from('Subscription')
      .select('studentId, plan, price, nextPaymentAt, status')
      .eq('status', 'ACTIVE')
      .not('nextPaymentAt', 'is', null)
      .gte('nextPaymentAt', dayKey(now))
      .lte('nextPaymentAt', dayKey(horizon))
    for (const sub of (subs ?? []) as any[]) {
      const body = `${sub.plan} · ${Number(sub.price).toLocaleString('ru-RU')} ₸ до ${new Date(sub.nextPaymentAt).toLocaleDateString('ru-RU')}`
      const studentUser = userByStudent.get(sub.studentId)
      if (studentUser) push(studentUser, 'PAYMENT_DUE', 'Приближается оплата', body)
      for (const puid of parentsByStudent.get(sub.studentId) ?? []) {
        push(puid, 'PAYMENT_DUE', 'Приближается оплата обучения', body)
      }
    }

    // ─── Низкая успеваемость (текущий месяц) ─────────────────────────
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    // Оценки живут в LessonCriterionGrade — по пять строк на урок. Сначала
    // усредняем внутри урока, иначе MIN_GRADES срабатывал бы впятеро раньше,
    // чем задумано («3 оценки» превратились бы в 3 критерия одного занятия).
    const { data: grades } = await supabase
      .from('LessonCriterionGrade')
      .select('studentId, lessonId, value')
      .gte('gradedAt', iso(monthStart))
    const perLesson = new Map<string, { sum: number, n: number, studentId: string }>()
    for (const g of (grades ?? []) as any[]) {
      const key = `${g.studentId}|${g.lessonId}`
      const rec = perLesson.get(key) ?? { sum: 0, n: 0, studentId: g.studentId }
      rec.sum += g.value
      rec.n += 1
      perLesson.set(key, rec)
    }
    const acc = new Map<string, { sum: number, n: number }>()
    for (const l of perLesson.values()) {
      const rec = acc.get(l.studentId) ?? { sum: 0, n: 0 }
      rec.sum += l.sum / l.n
      rec.n += 1
      acc.set(l.studentId, rec)
    }
    for (const [studentId, rec] of acc) {
      if (rec.n < MIN_GRADES) continue
      const avg = rec.sum / rec.n
      if (avg >= LOW_GRADE_THRESHOLD) continue
      const body = `Средний балл за месяц: ${avg.toFixed(1)}`
      for (const puid of parentsByStudent.get(studentId) ?? []) {
        push(puid, 'LOW_PERFORMANCE', 'Снижение успеваемости', body)
      }
    }

    if (out.length) {
      for (let i = 0; i < out.length; i += 100) {
        await supabase.from('Notification').insert(
          out.slice(i, i + 100).map(n => ({ ...n, isRead: false }))
        )
      }
    }

    return { result: `notify-daily: created ${out.length} notifications` }
  }
})
