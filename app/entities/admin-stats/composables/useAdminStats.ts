import type {
  AdminKpi,
  AdminStudent,
  AdminTeacher,
  AdminGroup,
  AdminMedal,
  AdminPayout,
  XpChartPoint
} from '../model/types'

// Raw row shapes returned by Supabase (typed loosely to avoid `never` inference on complex joins)
interface RawStudentRow {
  id: string
  userId: string
  level: string
  schoolGrade: number | null
  birthdate: string | null
  totalXp: number
  dailyStreak: number
  goldStreak: number
  totalEarnings: number
  lastActiveDate: string | null
  createdAt: string
  User: {
    name: string
    surname: string
    patronymic: string | null
    email: string
    phone: string | null
    avatarUrl: string | null
    iin: string | null
  } | null
}

interface RawTeacherRow {
  id: string
  userId: string
  bio: string | null
  yearsOfExperience: number | null
  specialization: string | null
  category: string | null
  rating: number
  reviewCount: number
  createdAt: string
  User: { name: string, surname: string, email: string, phone: string | null, avatarUrl: string | null } | null
}

interface RawGroupRow {
  id: string
  name: string
  level: string
  teacherId: string
  branchId: string
  schedule: unknown
  maxStudents: number
  createdAt: string
  Teacher: {
    User: { name: string, surname: string } | null
  } | null
}

interface RawMedalRow {
  id: string
  studentId: string
  month: string
  averageGrade: number
  medal: string
  payout: number
  confirmedBy: string | null
  confirmedAt: string
  Student: {
    User: { name: string, surname: string } | null
  } | null
  Payout: { id: string, status: string } | null
}

interface RawPayoutRow {
  id: string
  studentId: string
  amount: number
  status: string
  method: string | null
  kind: string | null
  paidAt: string | null
  createdAt: string
  Student: {
    User: { name: string, surname: string } | null
  } | null
}

const pickUser = (raw: RawStudentRow | RawTeacherRow) =>
  (Array.isArray(raw.User) ? raw.User[0] : raw.User) ?? null

export const useAdminStats = () => {
  const supabase = useTypedSupabaseClient()

  // ─── KPI ────────────────────────────────────────────────────────────────────

  const fetchKpi = async (): Promise<AdminKpi> => {
    const now = new Date()
    const ago7d = new Date(now.getTime() - 7 * 86400_000).toISOString().slice(0, 10)
    const ago30d = new Date(now.getTime() - 30 * 86400_000).toISOString()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const [
      { count: totalStudents },
      { count: activeStudents7d },
      { count: totalTeachers },
      { count: totalGroups },
      { data: medals },
      { data: payouts },
      { count: newStudents30d }
    ] = await Promise.all([
      supabase.from('Student').select('*', { count: 'exact', head: true }),
      supabase.from('Student').select('*', { count: 'exact', head: true }).gte('lastActiveDate', ago7d),
      supabase.from('Teacher').select('*', { count: 'exact', head: true }),
      supabase.from('Group').select('*', { count: 'exact', head: true }),
      supabase.from('MonthlyMedal').select('medal').eq('month', currentMonth),
      supabase.from('Payout').select('amount, status').eq('status', 'PENDING'),
      supabase.from('Student').select('*', { count: 'exact', head: true }).gte('createdAt', ago30d)
    ])

    const medalCounts = { gold: 0, silver: 0, bronze: 0 }
    for (const m of (medals ?? []) as { medal: string }[]) {
      if (m.medal === 'GOLD') medalCounts.gold++
      else if (m.medal === 'SILVER') medalCounts.silver++
      else if (m.medal === 'BRONZE') medalCounts.bronze++
    }

    const pendingPayoutsAmount = ((payouts ?? []) as { amount: number }[])
      .reduce((s, p) => s + p.amount, 0)

    return {
      totalStudents: totalStudents ?? 0,
      activeStudents7d: activeStudents7d ?? 0,
      totalTeachers: totalTeachers ?? 0,
      totalGroups: totalGroups ?? 0,
      currentMonthMedals: medalCounts,
      pendingPayouts: (payouts ?? []).length,
      pendingPayoutsAmount,
      newStudents30d: newStudents30d ?? 0
    }
  }

  // ─── Students (paginated) ─────────────────────────────────────────────────────

  // Normalize Kazakh-specific chars so К↔Қ, О↔Ө, У↔Ү/Ұ, А↔Ә, И/Ы↔І, Н↔Ң
  const normalizeKz = (s: string) =>
    s.toLowerCase()
      .replace(/[қ]/g, 'к')
      .replace(/[ө]/g, 'о')
      .replace(/[үұ]/g, 'у')
      .replace(/[ә]/g, 'а')
      .replace(/[і]/g, 'и')
      .replace(/[ң]/g, 'н')

  const fetchStudentsPaged = async (
    page: number,
    pageSize: number,
    search?: string
  ): Promise<{ students: AdminStudent[], total: number }> => {
    const from = page * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('Student')
      .select('id, userId, level, schoolGrade, birthdate, totalXp, dailyStreak, goldStreak, totalEarnings, lastActiveDate, createdAt, User!userId ( name, surname, patronymic, email, phone, avatarUrl, iin )', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(from, to) as unknown as { data: RawStudentRow[] | null, error: unknown, count: number | null }

    if (error) throw error

    let rows = data ?? []

    // Client-side Kazakh-aware filtering when search term provided
    if (search?.trim()) {
      const q = normalizeKz(search.trim())
      rows = rows.filter((s) => {
        const user = pickUser(s)
        const full = normalizeKz(`${user?.surname ?? ''} ${user?.name ?? ''} ${user?.patronymic ?? ''} ${user?.email ?? ''} ${user?.iin ?? ''} ${s.level}`)
        return full.includes(q)
      })
    }

    const studentIds = rows.map(s => s.id)
    const countMap: Record<string, number> = {}

    if (studentIds.length > 0) {
      const { data: gm } = await supabase
        .from('GroupMember')
        .select('studentId')
        .in('studentId', studentIds) as unknown as { data: { studentId: string }[] | null }

      for (const row of gm ?? []) {
        countMap[row.studentId] = (countMap[row.studentId] ?? 0) + 1
      }
    }

    const students = rows.map((s) => {
      const user = pickUser(s)
      return {
        id: s.id,
        userId: s.userId,
        name: user?.name ?? '',
        surname: user?.surname ?? '',
        patronymic: user?.patronymic ?? null,
        email: user?.email ?? '',
        phone: user?.phone ?? null,
        avatarUrl: user?.avatarUrl ?? null,
        iin: user?.iin ?? null,
        birthdate: s.birthdate,
        level: s.level,
        schoolGrade: s.schoolGrade,
        totalXp: s.totalXp,
        dailyStreak: s.dailyStreak,
        goldStreak: s.goldStreak,
        totalEarnings: s.totalEarnings,
        lastActiveDate: s.lastActiveDate,
        createdAt: s.createdAt,
        groupCount: countMap[s.id] ?? 0
      } as AdminStudent
    })

    return { students, total: count ?? 0 }
  }

  // ─── Students (legacy full fetch for exports) ─────────────────────────────────

  const fetchStudents = async (): Promise<AdminStudent[]> => {
    const { data, error } = await supabase
      .from('Student')
      .select('id, userId, level, schoolGrade, birthdate, totalXp, dailyStreak, goldStreak, totalEarnings, lastActiveDate, createdAt, User!userId ( name, surname, patronymic, email, phone, avatarUrl, iin )')
      .order('createdAt', { ascending: false }) as unknown as { data: RawStudentRow[] | null, error: unknown }

    if (error) throw error

    const studentIds = (data ?? []).map(s => s.id)
    const countMap: Record<string, number> = {}

    if (studentIds.length > 0) {
      const { data: gm } = await supabase
        .from('GroupMember')
        .select('studentId')
        .in('studentId', studentIds) as unknown as { data: { studentId: string }[] | null }

      for (const row of gm ?? []) {
        countMap[row.studentId] = (countMap[row.studentId] ?? 0) + 1
      }
    }

    return (data ?? []).map((s) => {
      const user = pickUser(s)
      return {
        id: s.id,
        userId: s.userId,
        name: user?.name ?? '',
        surname: user?.surname ?? '',
        patronymic: user?.patronymic ?? null,
        email: user?.email ?? '',
        phone: user?.phone ?? null,
        avatarUrl: user?.avatarUrl ?? null,
        iin: user?.iin ?? null,
        birthdate: s.birthdate,
        level: s.level,
        schoolGrade: s.schoolGrade,
        totalXp: s.totalXp,
        dailyStreak: s.dailyStreak,
        goldStreak: s.goldStreak,
        totalEarnings: s.totalEarnings,
        lastActiveDate: s.lastActiveDate,
        createdAt: s.createdAt,
        groupCount: countMap[s.id] ?? 0
      }
    })
  }

  const fetchStudentById = async (studentId: string) => {
    const { data, error } = await supabase
      .from('Student')
      .select('id, userId, level, schoolGrade, birthdate, totalXp, dailyStreak, goldStreak, totalEarnings, lastActiveDate, createdAt, User!userId ( name, surname, patronymic, email, phone, avatarUrl, iin )')
      .eq('id', studentId)
      .single() as unknown as { data: RawStudentRow | null, error: unknown }

    if (error) throw error
    if (!data) throw new Error('Student not found')

    const { data: medals } = await supabase
      .from('MonthlyMedal')
      .select('id, studentId, month, averageGrade, medal, payout, confirmedBy, confirmedAt')
      .eq('studentId', studentId)
      .order('month', { ascending: false })
      .limit(12)

    // Fetch all XP logs (no limit) — used for totalXp sum and streak calc
    const { data: xpLogs } = await supabase
      .from('XpLog')
      .select('amount, createdAt')
      .eq('studentId', studentId)
      .order('createdAt', { ascending: true }) as unknown as { data: { amount: number, createdAt: string }[] | null }

    const allLogs = (xpLogs ?? []) as { amount: number, createdAt: string }[]

    // Compute totalXp from XpLog (Student.totalXp is a stale denorm field, never updated)
    const computedTotalXp = allLogs.reduce((s, r) => s + r.amount, 0)

    // Compute current daily streak (consecutive active days ending today or yesterday)
    const activityDays = new Set<string>()
    for (const r of allLogs) activityDays.add(r.createdAt.slice(0, 10))
    let computedStreak = 0
    const cursor = new Date()
    for (let i = 0; i < 365; i++) {
      const key = cursor.toISOString().slice(0, 10)
      if (activityDays.has(key)) {
        computedStreak++
        cursor.setDate(cursor.getDate() - 1)
      } else {
        if (i === 0) {
          cursor.setDate(cursor.getDate() - 1)
          continue
        }
        break
      }
    }

    // Compute goldStreak and totalEarnings from medals (Student fields are never updated)
    const medalList = (medals ?? []) as { medal: string, payout: number }[]
    const computedGoldStreak = medalList.filter(m => m.medal === 'GOLD').length
    const computedTotalEarnings = medalList.reduce((s, m) => s + (m.payout ?? 0), 0)

    const user = pickUser(data)
    return {
      student: {
        id: data.id,
        userId: data.userId,
        name: user?.name ?? '',
        surname: user?.surname ?? '',
        patronymic: user?.patronymic ?? null,
        email: user?.email ?? '',
        phone: user?.phone ?? null,
        avatarUrl: user?.avatarUrl ?? null,
        iin: user?.iin ?? null,
        birthdate: data.birthdate,
        level: data.level,
        schoolGrade: data.schoolGrade,
        totalXp: computedTotalXp,
        dailyStreak: computedStreak,
        goldStreak: computedGoldStreak,
        totalEarnings: computedTotalEarnings,
        lastActiveDate: data.lastActiveDate,
        createdAt: data.createdAt,
        groupCount: 0
      } as AdminStudent,
      medals: (medals ?? []) as {
        id: string
        studentId: string
        month: string
        averageGrade: number
        medal: string
        payout: number
        confirmedBy: string | null
        confirmedAt: string
      }[],
      xpHistory: allLogs.map(l => ({
        date: l.createdAt.slice(0, 10),
        xp: l.amount
      })) as XpChartPoint[]
    }
  }

  // ─── Teachers ────────────────────────────────────────────────────────────────

  const fetchTeachers = async (): Promise<AdminTeacher[]> => {
    const { data, error } = await supabase
      .from('Teacher')
      .select('id, userId, bio, yearsOfExperience, specialization, category, rating, reviewCount, createdAt, User!userId ( name, surname, email, phone, avatarUrl )')
      .order('createdAt', { ascending: false }) as unknown as { data: RawTeacherRow[] | null, error: unknown }

    if (error) throw error

    const teacherIds = (data ?? []).map(t => t.id)
    const groupMap: Record<string, string[]> = {}

    if (teacherIds.length > 0) {
      const { data: groupRows } = await supabase
        .from('Group')
        .select('teacherId, id')
        .in('teacherId', teacherIds) as unknown as { data: { teacherId: string, id: string }[] | null }

      for (const g of groupRows ?? []) {
        if (!groupMap[g.teacherId]) groupMap[g.teacherId] = []
        groupMap[g.teacherId]!.push(g.id)
      }
    }

    const allGroupIds = Object.values(groupMap).flat()
    let memberRows: { groupId: string, studentId: string }[] = []

    if (allGroupIds.length > 0) {
      const { data: rows } = await supabase
        .from('GroupMember')
        .select('groupId, studentId')
        .in('groupId', allGroupIds) as unknown as { data: { groupId: string, studentId: string }[] | null }
      memberRows = rows ?? []
    }

    // Build teacherId → unique studentIds map
    const groupToTeacher: Record<string, string> = {}
    for (const [tid, gids] of Object.entries(groupMap)) {
      for (const gid of gids) groupToTeacher[gid] = tid
    }
    const studentsByTeacher: Record<string, Set<string>> = {}
    for (const m of memberRows) {
      const tid = groupToTeacher[m.groupId]
      if (tid) {
        if (!studentsByTeacher[tid]) studentsByTeacher[tid] = new Set()
        studentsByTeacher[tid].add(m.studentId)
      }
    }

    return (data ?? []).map((t) => {
      const user = pickUser(t)
      return {
        id: t.id,
        userId: t.userId,
        name: user?.name ?? '',
        surname: user?.surname ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? null,
        avatarUrl: user?.avatarUrl ?? null,
        bio: t.bio,
        yearsOfExperience: t.yearsOfExperience,
        specialization: t.specialization ?? null,
        category: t.category ?? null,
        rating: t.rating,
        reviewCount: t.reviewCount,
        groupCount: (groupMap[t.id] ?? []).length,
        studentCount: (studentsByTeacher[t.id] ?? new Set()).size,
        createdAt: t.createdAt
      }
    })
  }

  // ─── Groups ──────────────────────────────────────────────────────────────────

  const fetchGroups = async (): Promise<AdminGroup[]> => {
    const { data, error } = await supabase
      .from('Group')
      .select('id, name, level, teacherId, branchId, schedule, maxStudents, createdAt, Teacher!teacherId ( User!userId ( name, surname ) )')
      .order('createdAt', { ascending: false }) as unknown as { data: RawGroupRow[] | null, error: unknown }

    if (error) throw error

    const groupIds = (data ?? []).map(g => g.id)
    const countMap: Record<string, number> = {}

    if (groupIds.length > 0) {
      const { data: members } = await supabase
        .from('GroupMember')
        .select('groupId')
        .in('groupId', groupIds) as unknown as { data: { groupId: string }[] | null }

      for (const m of members ?? []) {
        countMap[m.groupId] = (countMap[m.groupId] ?? 0) + 1
      }
    }

    return (data ?? []).map((g) => {
      const teacher = Array.isArray(g.Teacher) ? g.Teacher[0] : g.Teacher
      const tUser = teacher ? (Array.isArray(teacher.User) ? teacher.User[0] : teacher.User) : null
      const teacherName = tUser ? `${tUser.name} ${tUser.surname}`.trim() : '—'

      return {
        id: g.id,
        name: g.name,
        level: g.level,
        teacherId: g.teacherId,
        teacherName,
        branchId: g.branchId ?? null,
        schedule: g.schedule as Record<string, unknown>,
        maxStudents: g.maxStudents,
        studentCount: countMap[g.id] ?? 0,
        createdAt: g.createdAt
      }
    })
  }

  // ─── Medals ──────────────────────────────────────────────────────────────────

  const fetchMedals = async (month?: string): Promise<AdminMedal[]> => {
    const now = new Date()
    const targetMonth = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('MonthlyMedal')
      .select('id, studentId, month, averageGrade, medal, payout, confirmedBy, confirmedAt, Student!studentId ( User!userId ( name, surname ) ), Payout!medalId ( id, status )')
      .eq('month', targetMonth)
      .order('averageGrade', { ascending: false }) as unknown as { data: RawMedalRow[] | null, error: unknown }

    if (error) throw error

    return (data ?? []).map((m) => {
      const student = Array.isArray(m.Student) ? m.Student[0] : m.Student
      const user = student ? (Array.isArray(student.User) ? student.User[0] : student.User) : null
      const payoutRow = Array.isArray(m.Payout) ? m.Payout[0] : m.Payout

      return {
        id: m.id,
        studentId: m.studentId,
        studentName: user?.name ?? '',
        studentSurname: user?.surname ?? '',
        month: m.month,
        averageGrade: m.averageGrade,
        medal: m.medal as AdminMedal['medal'],
        payout: m.payout,
        confirmedAt: m.confirmedAt ?? null,
        confirmedBy: m.confirmedBy,
        payoutStatus: payoutRow?.status ?? null,
        payoutId: payoutRow?.id ?? null
      }
    })
  }

  // ─── Payouts ─────────────────────────────────────────────────────────────────

  const fetchPayouts = async (): Promise<AdminPayout[]> => {
    const { data, error } = await supabase
      .from('Payout')
      .select('id, studentId, amount, status, method, kind, paidAt, createdAt, Student!studentId ( User!userId ( name, surname ) )')
      .order('createdAt', { ascending: false })
      .limit(100) as unknown as { data: RawPayoutRow[] | null, error: unknown }

    if (error) throw error

    return (data ?? []).map((p) => {
      const student = Array.isArray(p.Student) ? p.Student[0] : p.Student
      const user = student ? (Array.isArray(student.User) ? student.User[0] : student.User) : null

      return {
        id: p.id,
        studentId: p.studentId,
        studentName: user?.name ?? '',
        studentSurname: user?.surname ?? '',
        amount: p.amount,
        status: p.status,
        method: p.method,
        kind: p.kind,
        paidAt: p.paidAt,
        createdAt: p.createdAt
      }
    })
  }

  // ─── XP Chart ────────────────────────────────────────────────────────────────

  const fetchXpChart = async (): Promise<XpChartPoint[]> => {
    const ago30d = new Date(Date.now() - 30 * 86400_000).toISOString()

    const { data } = await supabase
      .from('XpLog')
      .select('amount, createdAt')
      .gte('createdAt', ago30d)
      .order('createdAt', { ascending: true }) as unknown as { data: { amount: number, createdAt: string }[] | null }

    const byDay: Record<string, number> = {}
    for (const row of data ?? []) {
      const day = row.createdAt.slice(0, 10)
      byDay[day] = (byDay[day] ?? 0) + row.amount
    }

    return Object.entries(byDay).map(([date, xp]) => ({ date, xp }))
  }

  // ─── Student CRUD ────────────────────────────────────────────────────────────

  const createStudent = async (payload: {
    name: string
    surname: string
    patronymic?: string
    email: string
    password: string
    phone?: string
    birthdate?: string
    schoolGrade?: number
    iin?: string
    level?: string
  }) => {
    return await $fetch('/api/admin/students', {
      method: 'POST',
      body: payload
    })
  }

  const updateStudent = async (studentId: string, payload: {
    name?: string
    surname?: string
    patronymic?: string | null
    phone?: string | null
    iin?: string | null
    birthdate?: string | null
    schoolGrade?: number | null
    level?: string
  }) => {
    return await $fetch(`/api/admin/students/${studentId}`, {
      method: 'PATCH',
      body: payload
    })
  }

  return {
    fetchKpi,
    fetchStudents,
    fetchStudentsPaged,
    fetchStudentById,
    fetchTeachers,
    fetchGroups,
    fetchMedals,
    fetchPayouts,
    fetchXpChart,
    createStudent,
    updateStudent
  }
}
