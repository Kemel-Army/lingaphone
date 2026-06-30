import type {
  TeacherGroup,
  TeacherStudent,
  TeacherLesson,
  TeacherHomework,
  TeacherSubmission,
  TeacherKpi
} from '../model/types'

interface RawGroupRow {
  id: string
  name: string
  level: string
  maxStudents: number
  schedule: unknown
  branchId: string
  createdAt: string
}

interface RawMemberRow {
  groupId: string
  studentId: string
  joinedAt: string
  status: string
  Student: {
    id: string
    userId: string
    level: string
    totalXp: number
    dailyStreak: number
    goldStreak: number
    totalEarnings: number
    lastActiveDate: string | null
    User: { name: string, surname: string, email: string, avatarUrl: string | null } | null
  } | null
}

interface RawLessonRow {
  id: string
  groupId: string
  topic: string
  startsAt: string
  status: string
  durationMin: number
  meetingUrl: string | null
  createdAt: string
  Group: { name: string } | null
}

interface RawHomeworkRow {
  id: string
  lessonId: string
  format: string
  title: string
  description: string | null
  dueAt: string
  maxScore: number
  createdAt: string
  Lesson: {
    groupId: string
    topic: string
    Group: { name: string } | null
  } | null
}

interface RawSubmissionRow {
  id: string
  homeworkId: string
  studentId: string
  status: string
  answers: unknown | null
  audioUrl: string | null
  fileUrl: string | null
  aiScore: number | null
  aiFeedback: unknown | null
  teacherGrade: number | null
  teacherComment: string | null
  submittedAt: string | null
  createdAt: string
  Homework: {
    title: string
    format: string
    maxScore: number
    lessonId: string
    Lesson: {
      groupId: string
      topic: string
      Group: { name: string } | null
    } | null
  } | null
  Student: {
    User: { name: string, surname: string, avatarUrl: string | null } | null
  } | null
}

interface RawGradeRow {
  lessonId: string
  studentId: string
  value: number
  comment: string | null
  gradedAt: string
  Lesson: { topic: string, startsAt: string } | null
  Student: {
    User: { name: string, surname: string } | null
  } | null
}

const pickRelation = <T>(val: T | T[] | null): T | null =>
  Array.isArray(val) ? (val[0] ?? null) : val

export const useTeacher = () => {
  const supabase = useTypedSupabaseClient()

  // ─── Group IDs helper ────────────────────────────────────────────────────────

  const getGroupIds = async (): Promise<string[]> => {
    const { data } = await supabase.rpc('get_current_teacher_group_ids') as unknown as { data: string[] | null }
    return data ?? []
  }

  const getLessonIds = async (): Promise<string[]> => {
    const { data } = await supabase.rpc('get_current_teacher_lesson_ids') as unknown as { data: string[] | null }
    return data ?? []
  }

  // ─── KPI ─────────────────────────────────────────────────────────────────────

  const fetchKpi = async (): Promise<TeacherKpi> => {
    const groupIds = await getGroupIds()
    if (groupIds.length === 0) {
      return { totalStudents: 0, totalGroups: 0, lessonsThisWeek: 0, pendingSubmissions: 0 }
    }

    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const [
      { data: members },
      { count: lessonsThisWeek }
    ] = await Promise.all([
      supabase
        .from('GroupMember')
        .select('studentId')
        .in('groupId', groupIds)
        .eq('status', 'ACTIVE') as unknown as { data: { studentId: string }[] | null },
      supabase
        .from('Lesson')
        .select('*', { count: 'exact', head: true })
        .in('groupId', groupIds)
        .gte('startsAt', weekStart.toISOString())
        .lt('startsAt', weekEnd.toISOString())
    ])

    const uniqueStudents = new Set((members ?? []).map(m => m.studentId)).size

    // Get pending submissions count
    const lessonIds = await getLessonIds()
    let pendingSubmissions = 0
    if (lessonIds.length > 0) {
      const { data: hwIds } = await supabase
        .from('Homework')
        .select('id')
        .in('lessonId', lessonIds) as unknown as { data: { id: string }[] | null }

      const homeworkIds = (hwIds ?? []).map(h => h.id)
      if (homeworkIds.length > 0) {
        const { count } = await supabase
          .from('HomeworkSubmission')
          .select('*', { count: 'exact', head: true })
          .in('homeworkId', homeworkIds)
          .eq('status', 'SUBMITTED')
        pendingSubmissions = count ?? 0
      }
    }

    return {
      totalStudents: uniqueStudents,
      totalGroups: groupIds.length,
      lessonsThisWeek: lessonsThisWeek ?? 0,
      pendingSubmissions
    }
  }

  // ─── Groups ──────────────────────────────────────────────────────────────────

  const fetchMyGroups = async (): Promise<TeacherGroup[]> => {
    const groupIds = await getGroupIds()
    if (groupIds.length === 0) return []

    const { data, error } = await supabase
      .from('Group')
      .select('id, name, level, maxStudents, schedule, branchId, createdAt')
      .in('id', groupIds)
      .order('name') as unknown as { data: RawGroupRow[] | null, error: unknown }

    if (error) throw error

    const { data: members } = await supabase
      .from('GroupMember')
      .select('groupId')
      .in('groupId', groupIds)
      .eq('status', 'ACTIVE') as unknown as { data: { groupId: string }[] | null }

    const countMap: Record<string, number> = {}
    for (const m of members ?? []) {
      countMap[m.groupId] = (countMap[m.groupId] ?? 0) + 1
    }

    return (data ?? []).map(g => ({
      id: g.id,
      name: g.name,
      level: g.level,
      maxStudents: g.maxStudents,
      studentCount: countMap[g.id] ?? 0,
      schedule: g.schedule as Record<string, unknown>,
      branchId: g.branchId,
      createdAt: g.createdAt
    }))
  }

  const fetchGroupById = async (groupId: string): Promise<{
    group: TeacherGroup
    members: TeacherStudent[]
    lessons: TeacherLesson[]
  }> => {
    const [{ data: gData, error: gErr }, { data: mData }, { data: lData }] = await Promise.all([
      supabase
        .from('Group')
        .select('id, name, level, maxStudents, schedule, branchId, createdAt')
        .eq('id', groupId)
        .single() as unknown as { data: RawGroupRow | null, error: unknown },

      supabase
        .from('GroupMember')
        .select('groupId, studentId, joinedAt, status, Student!studentId ( id, userId, level, totalXp, dailyStreak, goldStreak, totalEarnings, lastActiveDate, User!userId ( name, surname, email, avatarUrl ) )')
        .eq('groupId', groupId)
        .eq('status', 'ACTIVE') as unknown as { data: RawMemberRow[] | null, error: unknown },

      supabase
        .from('Lesson')
        .select('id, groupId, topic, startsAt, status, durationMin, meetingUrl, createdAt, Group!groupId ( name )')
        .eq('groupId', groupId)
        .order('startsAt', { ascending: true })
        .limit(200) as unknown as { data: RawLessonRow[] | null, error: unknown }
    ])

    if (gErr || !gData) throw new Error('Group not found')

    const members: TeacherStudent[] = (mData ?? []).map((m) => {
      const student = pickRelation(m.Student)
      const user = student ? pickRelation(student.User) : null
      return {
        studentId: m.studentId,
        userId: student?.userId ?? '',
        name: user?.name ?? '',
        surname: user?.surname ?? '',
        email: user?.email ?? '',
        avatarUrl: user?.avatarUrl ?? null,
        level: student?.level ?? '',
        totalXp: student?.totalXp ?? 0,
        dailyStreak: student?.dailyStreak ?? 0,
        goldStreak: student?.goldStreak ?? 0,
        totalEarnings: student?.totalEarnings ?? 0,
        lastActiveDate: student?.lastActiveDate ?? null,
        groupId,
        groupName: gData.name
      }
    })

    const lessons: TeacherLesson[] = (lData ?? []).map(l => ({
      id: l.id,
      groupId: l.groupId,
      groupName: gData.name,
      topic: l.topic,
      startsAt: l.startsAt,
      status: l.status,
      durationMin: l.durationMin,
      meetingUrl: l.meetingUrl,
      createdAt: l.createdAt
    }))

    return {
      group: {
        id: gData.id,
        name: gData.name,
        level: gData.level,
        maxStudents: gData.maxStudents,
        studentCount: members.length,
        schedule: gData.schedule as Record<string, unknown>,
        branchId: gData.branchId,
        createdAt: gData.createdAt
      },
      members,
      lessons
    }
  }

  // ─── Students ────────────────────────────────────────────────────────────────

  const fetchMyStudents = async (): Promise<TeacherStudent[]> => {
    const groupIds = await getGroupIds()
    if (groupIds.length === 0) return []

    const { data: groupNames } = await supabase
      .from('Group')
      .select('id, name')
      .in('id', groupIds) as unknown as { data: { id: string, name: string }[] | null }

    const nameMap: Record<string, string> = {}
    for (const g of groupNames ?? []) nameMap[g.id] = g.name

    const { data, error } = await supabase
      .from('GroupMember')
      .select('groupId, studentId, Student!studentId ( id, userId, level, totalXp, dailyStreak, goldStreak, totalEarnings, lastActiveDate, User!userId ( name, surname, email, avatarUrl ) )')
      .in('groupId', groupIds)
      .eq('status', 'ACTIVE') as unknown as { data: RawMemberRow[] | null, error: unknown }

    if (error) throw error

    const seen = new Set<string>()
    const result: TeacherStudent[] = []

    for (const m of data ?? []) {
      if (seen.has(m.studentId)) continue
      seen.add(m.studentId)
      const student = pickRelation(m.Student)
      const user = student ? pickRelation(student.User) : null
      result.push({
        studentId: m.studentId,
        userId: student?.userId ?? '',
        name: user?.name ?? '',
        surname: user?.surname ?? '',
        email: user?.email ?? '',
        avatarUrl: user?.avatarUrl ?? null,
        level: student?.level ?? '',
        totalXp: student?.totalXp ?? 0,
        dailyStreak: student?.dailyStreak ?? 0,
        goldStreak: student?.goldStreak ?? 0,
        totalEarnings: student?.totalEarnings ?? 0,
        lastActiveDate: student?.lastActiveDate ?? null,
        groupId: m.groupId,
        groupName: nameMap[m.groupId] ?? ''
      })
    }

    return result.sort((a, b) => a.surname.localeCompare(b.surname))
  }

  const fetchStudentById = async (studentId: string) => {
    const [{ data: sData }, { data: gradeRows }] = await Promise.all([
      supabase
        .from('Student')
        .select('id, userId, level, totalXp, dailyStreak, goldStreak, totalEarnings, lastActiveDate, createdAt, User!userId ( name, surname, email, avatarUrl )')
        .eq('id', studentId)
        .single() as unknown as {
        data: {
          id: string
          userId: string
          level: string
          totalXp: number
          dailyStreak: number
          goldStreak: number
          totalEarnings: number
          lastActiveDate: string | null
          createdAt: string
          User: { name: string, surname: string, email: string, avatarUrl: string | null } | null
        } | null
        error: unknown
      },

      supabase
        .from('Grade')
        .select('lessonId, studentId, value, comment, gradedAt, Lesson!lessonId ( topic, startsAt )')
        .eq('studentId', studentId)
        .order('gradedAt', { ascending: false })
        .limit(50) as unknown as { data: RawGradeRow[] | null, error: unknown }
    ])

    const user = sData ? pickRelation(sData.User) : null
    const grades = (gradeRows ?? []).map((g) => {
      const lesson = pickRelation(g.Lesson)
      return {
        lessonId: g.lessonId,
        lessonTopic: lesson?.topic ?? '',
        lessonStartsAt: lesson?.startsAt ?? '',
        studentId: g.studentId,
        studentName: '',
        studentSurname: '',
        value: g.value,
        comment: g.comment,
        gradedAt: g.gradedAt
      }
    })

    return {
      student: sData
        ? {
            studentId: sData.id,
            userId: sData.userId,
            name: user?.name ?? '',
            surname: user?.surname ?? '',
            email: user?.email ?? '',
            avatarUrl: user?.avatarUrl ?? null,
            level: sData.level,
            totalXp: sData.totalXp,
            dailyStreak: sData.dailyStreak,
            goldStreak: sData.goldStreak,
            totalEarnings: sData.totalEarnings,
            lastActiveDate: sData.lastActiveDate,
            groupId: '',
            groupName: ''
          } as TeacherStudent
        : null,
      grades
    }
  }

  // ─── Lessons ─────────────────────────────────────────────────────────────────

  const fetchMyLessons = async (groupId?: string): Promise<TeacherLesson[]> => {
    let query = supabase
      .from('Lesson')
      .select('id, groupId, topic, startsAt, status, durationMin, meetingUrl, createdAt, Group!groupId ( name )')
      .order('startsAt', { ascending: true })
      .limit(200)

    if (groupId) {
      query = query.eq('groupId', groupId)
    } else {
      const groupIds = await getGroupIds()
      if (groupIds.length === 0) return []
      query = query.in('groupId', groupIds)
    }

    const { data, error } = await query as unknown as { data: RawLessonRow[] | null, error: unknown }
    if (error) throw error

    return (data ?? []).map(l => ({
      id: l.id,
      groupId: l.groupId,
      groupName: (pickRelation(l.Group) as { name: string } | null)?.name ?? '',
      topic: l.topic,
      startsAt: l.startsAt,
      status: l.status,
      durationMin: l.durationMin,
      meetingUrl: l.meetingUrl,
      createdAt: l.createdAt
    }))
  }

  // ─── Homework ─────────────────────────────────────────────────────────────────

  const fetchMyHomework = async (groupId?: string): Promise<TeacherHomework[]> => {
    let lessonIds: string[]

    if (groupId) {
      const { data: lRows } = await supabase
        .from('Lesson')
        .select('id')
        .eq('groupId', groupId) as unknown as { data: { id: string }[] | null }
      lessonIds = (lRows ?? []).map(l => l.id)
    } else {
      lessonIds = await getLessonIds()
    }

    if (lessonIds.length === 0) return []

    const { data, error } = await supabase
      .from('Homework')
      .select('id, lessonId, format, title, description, dueAt, maxScore, createdAt, Lesson!lessonId ( groupId, topic, Group!groupId ( name ) )')
      .in('lessonId', lessonIds)
      .order('dueAt', { ascending: false }) as unknown as { data: RawHomeworkRow[] | null, error: unknown }

    if (error) throw error

    const hwIds = (data ?? []).map(h => h.id)
    const submittedMap: Record<string, number> = {}
    const checkedMap: Record<string, number> = {}

    if (hwIds.length > 0) {
      const { data: subs } = await supabase
        .from('HomeworkSubmission')
        .select('homeworkId, status')
        .in('homeworkId', hwIds)
        .in('status', ['SUBMITTED', 'CHECKED']) as unknown as { data: { homeworkId: string, status: string }[] | null }

      for (const s of subs ?? []) {
        if (s.status === 'SUBMITTED') submittedMap[s.homeworkId] = (submittedMap[s.homeworkId] ?? 0) + 1
        if (s.status === 'CHECKED') checkedMap[s.homeworkId] = (checkedMap[s.homeworkId] ?? 0) + 1
      }
    }

    return (data ?? []).map((h) => {
      const lesson = pickRelation(h.Lesson)
      const group = lesson ? pickRelation(lesson.Group) : null
      return {
        id: h.id,
        lessonId: h.lessonId,
        lessonTopic: lesson?.topic ?? '',
        groupId: lesson?.groupId ?? '',
        groupName: (group as { name: string } | null)?.name ?? '',
        format: h.format,
        title: h.title,
        description: h.description,
        dueAt: h.dueAt,
        maxScore: h.maxScore,
        createdAt: h.createdAt,
        submittedCount: submittedMap[h.id] ?? 0,
        checkedCount: checkedMap[h.id] ?? 0
      }
    })
  }

  // ─── Submissions ─────────────────────────────────────────────────────────────

  const fetchSubmissions = async (opts?: {
    status?: string
    homeworkId?: string
  }): Promise<TeacherSubmission[]> => {
    const lessonIds = await getLessonIds()
    if (lessonIds.length === 0) return []

    const { data: hwRows } = await supabase
      .from('Homework')
      .select('id')
      .in('lessonId', lessonIds) as unknown as { data: { id: string }[] | null }

    const hwIds = (hwRows ?? []).map(h => h.id)
    if (hwIds.length === 0) return []

    let query = supabase
      .from('HomeworkSubmission')
      .select('id, homeworkId, studentId, status, answers, audioUrl, fileUrl, aiScore, aiFeedback, teacherGrade, teacherComment, submittedAt, createdAt, Homework!homeworkId ( title, format, maxScore, lessonId, Lesson!lessonId ( groupId, topic, Group!groupId ( name ) ) ), Student!studentId ( User!userId ( name, surname, avatarUrl ) )')
      .in('homeworkId', opts?.homeworkId ? [opts.homeworkId] : hwIds)
      .order('submittedAt', { ascending: false })
      .limit(200)

    if (opts?.status) {
      query = query.eq('status', opts.status as never)
    }

    if (opts?.homeworkId) {
      query = query.eq('homeworkId', opts.homeworkId)
    }

    const { data, error } = await query as unknown as { data: RawSubmissionRow[] | null, error: unknown }
    if (error) throw error

    return (data ?? []).map((s) => {
      const hw = pickRelation(s.Homework)
      const lesson = hw ? pickRelation(hw.Lesson) : null
      const group = lesson ? pickRelation(lesson.Group) : null
      const student = pickRelation(s.Student)
      const user = student ? pickRelation(student.User) : null

      return {
        id: s.id,
        homeworkId: s.homeworkId,
        homeworkTitle: hw?.title ?? '',
        homeworkFormat: hw?.format ?? '',
        homeworkMaxScore: hw?.maxScore ?? 10,
        lessonId: hw?.lessonId ?? '',
        groupId: lesson?.groupId ?? '',
        groupName: (group as { name: string } | null)?.name ?? '',
        studentId: s.studentId,
        studentName: (user as { name: string } | null)?.name ?? '',
        studentSurname: (user as { surname: string } | null)?.surname ?? '',
        studentAvatarUrl: (user as { avatarUrl: string | null } | null)?.avatarUrl ?? null,
        status: s.status,
        answers: s.answers,
        audioUrl: s.audioUrl,
        fileUrl: s.fileUrl,
        aiScore: s.aiScore,
        aiFeedback: s.aiFeedback,
        teacherGrade: s.teacherGrade,
        teacherComment: s.teacherComment,
        submittedAt: s.submittedAt,
        createdAt: s.createdAt
      }
    })
  }

  // ─── Grades journal ───────────────────────────────────────────────────────────

  const fetchGradesForGroup = async (groupId: string) => {
    const [{ data: lRows }, { data: mRows }] = await Promise.all([
      supabase
        .from('Lesson')
        .select('id, topic, startsAt')
        .eq('groupId', groupId)
        .order('startsAt', { ascending: true })
        .limit(60) as unknown as { data: { id: string, topic: string, startsAt: string }[] | null },

      supabase
        .from('GroupMember')
        .select('studentId, Student!studentId ( User!userId ( name, surname ) )')
        .eq('groupId', groupId)
        .eq('status', 'ACTIVE') as unknown as {
        data: {
          studentId: string
          Student: { User: { name: string, surname: string } | null } | null
        }[] | null
      }
    ])

    const lessons = lRows ?? []
    const lessonIds = lessons.map(l => l.id)

    const students = (mRows ?? []).map((m) => {
      const student = pickRelation(m.Student)
      const user = student ? pickRelation(student.User) : null
      return {
        studentId: m.studentId,
        name: (user as { name: string } | null)?.name ?? '',
        surname: (user as { surname: string } | null)?.surname ?? ''
      }
    }).sort((a, b) => a.surname.localeCompare(b.surname))

    let grades: { lessonId: string, studentId: string, value: number, comment: string | null }[] = []
    if (lessonIds.length > 0) {
      const { data: gRows } = await supabase
        .from('Grade')
        .select('lessonId, studentId, value, comment')
        .in('lessonId', lessonIds) as unknown as {
        data: { lessonId: string, studentId: string, value: number, comment: string | null }[] | null
      }
      grades = gRows ?? []
    }

    const gradeMap: Record<string, Record<string, { value: number, comment: string | null }>> = {}
    for (const g of grades) {
      if (!gradeMap[g.studentId]) gradeMap[g.studentId] = {}
      gradeMap[g.studentId]![g.lessonId] = { value: g.value, comment: g.comment }
    }

    return { lessons, students, gradeMap }
  }

  // ─── Teacher Profile ─────────────────────────────────────────────────────────

  const fetchTeacherProfile = async () => {
    const user = useSupabaseUser()
    const authId = user.value?.sub ?? ''

    const { data: uRow } = await supabase
      .from('User')
      .select('id, name, surname, email, avatarUrl')
      .eq('authId', authId)
      .maybeSingle() as unknown as {
      data: { id: string, name: string, surname: string, email: string, avatarUrl: string | null } | null
    }

    if (!uRow) return null

    const { data: tRow } = await supabase
      .from('Teacher')
      .select('id, bio, rating, yearsOfExperience')
      .eq('userId', uRow.id)
      .maybeSingle() as unknown as {
      data: { id: string, bio: string | null, rating: number, yearsOfExperience: number } | null
    }

    return {
      ...uRow,
      teacherId: tRow?.id ?? '',
      bio: tRow?.bio ?? null,
      rating: tRow?.rating ?? 0,
      yearsOfExperience: tRow?.yearsOfExperience ?? 0
    }
  }

  const updateTeacherProfile = async (teacherId: string, bio: string, yearsOfExperience: number) => {
    const { error } = await supabase
      .from('Teacher')
      .update({ bio: bio || null, yearsOfExperience })
      .eq('id', teacherId)
    if (error) throw error
  }

  // ─── Attendance ───────────────────────────────────────────────────────────────

  const fetchAttendanceForLesson = async (lessonId: string): Promise<Record<string, string>> => {
    const { data } = await supabase
      .from('Attendance')
      .select('studentId, status')
      .eq('lessonId', lessonId) as unknown as { data: { studentId: string, status: string }[] | null }

    const map: Record<string, string> = {}
    for (const row of data ?? []) map[row.studentId] = row.status
    return map
  }

  // ─── Weekly Stats ─────────────────────────────────────────────────────────────

  const fetchWeeklyStats = async (): Promise<{ checkedCount: number, attendancePercent: number }> => {
    const lessonIds = await getLessonIds()
    if (lessonIds.length === 0) return { checkedCount: 0, attendancePercent: 0 }

    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const { data: hwIds } = await supabase
      .from('Homework')
      .select('id')
      .in('lessonId', lessonIds) as unknown as { data: { id: string }[] | null }

    let checkedCount = 0
    if (hwIds && hwIds.length > 0) {
      const { count } = await supabase
        .from('HomeworkSubmission')
        .select('*', { count: 'exact', head: true })
        .in('homeworkId', hwIds.map(h => h.id))
        .eq('status', 'CHECKED')
      checkedCount = count ?? 0
    }

    const { data: weekLessons } = await supabase
      .from('Lesson')
      .select('id')
      .in('id', lessonIds)
      .gte('startsAt', weekStart.toISOString())
      .lt('startsAt', weekEnd.toISOString()) as unknown as { data: { id: string }[] | null }

    let attendancePercent = 0
    if (weekLessons && weekLessons.length > 0) {
      const { data: attRows } = await supabase
        .from('Attendance')
        .select('status')
        .in('lessonId', weekLessons.map(l => l.id)) as unknown as { data: { status: string }[] | null }

      const total = attRows?.length ?? 0
      const present = (attRows ?? []).filter(a => a.status === 'PRESENT' || a.status === 'LATE').length
      attendancePercent = total > 0 ? Math.round((present / total) * 100) : 0
    }

    return { checkedCount, attendancePercent }
  }

  // ─── Tests ────────────────────────────────────────────────────────────────────

  const fetchMyTests = async () => {
    const lessonIds = await getLessonIds()
    if (lessonIds.length === 0) return []

    const { data: hwRows } = await supabase
      .from('Homework')
      .select('id, lessonId, title, dueAt, maxScore, createdAt, Lesson!lessonId ( groupId, topic, Group!groupId ( name ) )')
      .in('lessonId', lessonIds)
      .eq('format', 'TEST')
      .order('createdAt', { ascending: false }) as unknown as { data: RawHomeworkRow[] | null }

    const hwIds = (hwRows ?? []).map(h => h.id)
    const submittedMap: Record<string, number> = {}
    const checkedMap: Record<string, number> = {}
    const scoreMap: Record<string, number[]> = {}

    if (hwIds.length > 0) {
      const { data: subs } = await supabase
        .from('HomeworkSubmission')
        .select('homeworkId, status, aiScore, teacherGrade')
        .in('homeworkId', hwIds) as unknown as {
        data: { homeworkId: string, status: string, aiScore: number | null, teacherGrade: number | null }[] | null
      }

      for (const s of subs ?? []) {
        if (s.status === 'SUBMITTED') submittedMap[s.homeworkId] = (submittedMap[s.homeworkId] ?? 0) + 1
        if (s.status === 'CHECKED') {
          checkedMap[s.homeworkId] = (checkedMap[s.homeworkId] ?? 0) + 1
          const score = s.teacherGrade ?? s.aiScore ?? null
          if (score !== null) {
            if (!scoreMap[s.homeworkId]) scoreMap[s.homeworkId] = []
            scoreMap[s.homeworkId]!.push(score)
          }
        }
      }
    }

    return (hwRows ?? []).map((h) => {
      const lesson = pickRelation(h.Lesson)
      const group = lesson ? pickRelation(lesson.Group) : null
      const scores = scoreMap[h.id] ?? []
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
      return {
        id: h.id,
        lessonId: h.lessonId,
        lessonTopic: lesson?.topic ?? '',
        groupId: lesson?.groupId ?? '',
        groupName: (group as { name: string } | null)?.name ?? '',
        title: h.title,
        dueAt: h.dueAt,
        maxScore: h.maxScore,
        createdAt: h.createdAt,
        submittedCount: submittedMap[h.id] ?? 0,
        checkedCount: checkedMap[h.id] ?? 0,
        avgScore
      }
    })
  }

  const fetchTestSubmissions = async (homeworkId: string) => {
    const { data, error } = await supabase
      .from('HomeworkSubmission')
      .select('id, studentId, status, aiScore, teacherGrade, submittedAt, Student!studentId ( User!userId ( name, surname ) )')
      .eq('homeworkId', homeworkId)
      .order('submittedAt', { ascending: false }) as unknown as {
      data: {
        id: string
        studentId: string
        status: string
        aiScore: number | null
        teacherGrade: number | null
        submittedAt: string | null
        Student: { User: { name: string, surname: string } | null } | null
      }[] | null
      error: unknown
    }

    if (error) throw error

    return (data ?? []).map((s) => {
      const student = pickRelation(s.Student)
      const user = student ? pickRelation(student.User) : null
      return {
        id: s.id,
        studentId: s.studentId,
        studentName: (user as { name: string } | null)?.name ?? '',
        studentSurname: (user as { surname: string } | null)?.surname ?? '',
        status: s.status,
        aiScore: s.aiScore,
        teacherGrade: s.teacherGrade,
        score: s.teacherGrade ?? s.aiScore,
        submittedAt: s.submittedAt
      }
    })
  }

  const resetTestSubmission = async (submissionId: string) => {
    const { error } = await supabase
      .from('HomeworkSubmission')
      .update({ status: 'ASSIGNED', teacherGrade: null, teacherComment: null, aiScore: null, aiFeedback: null, submittedAt: null })
      .eq('id', submissionId)
    if (error) throw error
  }

  // ─── Lesson creation ──────────────────────────────────────────────────────────

  const createLesson = async (payload: {
    groupId: string
    topic: string
    startsAt: string
    durationMin?: number
    meetingUrl?: string
  }): Promise<TeacherLesson> => {
    const data = await $fetch<TeacherLesson>('/api/teacher/lessons', {
      method: 'POST',
      body: payload
    })
    return data
  }

  return {
    fetchKpi,
    fetchMyGroups,
    fetchGroupById,
    fetchMyStudents,
    fetchStudentById,
    fetchMyLessons,
    fetchMyHomework,
    fetchSubmissions,
    fetchGradesForGroup,
    fetchTeacherProfile,
    updateTeacherProfile,
    fetchAttendanceForLesson,
    fetchWeeklyStats,
    fetchMyTests,
    fetchTestSubmissions,
    resetTestSubmission,
    createLesson,
    getGroupIds,
    getLessonIds
  }
}
