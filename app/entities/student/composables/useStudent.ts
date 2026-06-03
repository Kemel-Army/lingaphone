import type { Database } from '~/shared/types/database.types'
import { PRACTICE_DECKS } from '~/shared/mock'
import type { StudentCertificate, SchoolEvent } from '~/shared/mock'
import type { StudentGroup, FlatTeacher, Classmate } from '../model/types'

type Tables = Database['public']['Tables']
type TeacherRow = Tables['Teacher']['Row']
type BranchRow = Tables['Branch']['Row']
type GroupRow = Tables['Group']['Row']
type LessonRow = Tables['Lesson']['Row']
type GradeRow = Tables['Grade']['Row']
type MedalRow = Tables['MonthlyMedal']['Row']
type PayoutRow = Tables['Payout']['Row']
type HomeworkRow = Tables['Homework']['Row']
type HomeworkSubRow = Tables['HomeworkSubmission']['Row']
type MaterialRow = Tables['Material']['Row']
type VocabRow = Tables['VocabularyEntry']['Row']
type ConversationRow = Tables['Conversation']['Row']
type UserRow = Tables['User']['Row']

const MEDAL_PAYOUT: Record<Database['public']['Enums']['MedalKind'], number> = {
  GOLD: 5000, SILVER: 3000, BRONZE: 1000, NONE: 0
}

const computeMedal = (avg: number): Database['public']['Enums']['MedalKind'] => {
  if (avg >= 4.6) return 'GOLD'
  if (avg >= 4.0) return 'SILVER'
  if (avg >= 3.6) return 'BRONZE'
  return 'NONE'
}

export const useStudent = () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const { data, refresh, pending } = useAsyncData(
    'lingafon-student-bundle',
    async () => {
      if (!user.value) return null

      const { data: studentRow } = await supabase
        .from('Student')
        .select('*')
        .single()
      if (!studentRow) return null

      const studentId = studentRow.id

      const [
        groupsRes,
        lessonsRes,
        gradesRes,
        medalsRes,
        payoutsRes,
        homeworkRes,
        submissionsRes,
        materialsRes,
        vocabRes,
        conversationsRes,
        xpRes,
        practiceRes
      ] = await Promise.all([
        supabase
          .from('GroupMember')
          .select('group:Group(*, teacher:Teacher(*, user:User(name, surname, avatarUrl)), branch:Branch(*))')
          .eq('status', 'ACTIVE'),
        supabase
          .from('Lesson')
          .select('*')
          .order('startsAt', { ascending: true }),
        supabase
          .from('Grade')
          .select('*')
          .order('gradedAt', { ascending: false })
          .limit(50),
        supabase
          .from('MonthlyMedal')
          .select('*')
          .order('month', { ascending: false }),
        supabase
          .from('Payout')
          .select('*')
          .order('createdAt', { ascending: false }),
        supabase
          .from('Homework')
          .select('*')
          .order('dueAt', { ascending: true }),
        supabase
          .from('HomeworkSubmission')
          .select('*'),
        supabase
          .from('Material')
          .select('*')
          .order('createdAt', { ascending: false }),
        supabase
          .from('VocabularyEntry')
          .select('*')
          .order('addedAt', { ascending: false }),
        supabase
          .from('Conversation')
          .select('*')
          .order('updatedAt', { ascending: false }),
        supabase
          .from('XpLog')
          .select('amount, createdAt')
          .order('createdAt', { ascending: false }),
        supabase
          .from('PracticeAttempt')
          .select('attemptedAt')
          .order('attemptedAt', { ascending: false })
      ])

      const groupIds = (groupsRes.data ?? [])
        .map(gm => (gm.group as GroupRow | null)?.id)
        .filter((id): id is string => !!id)

      const { data: memberCounts } = groupIds.length > 0
        ? await supabase
            .from('GroupMember')
            .select('groupId')
            .in('groupId', groupIds)
            .eq('status', 'ACTIVE')
        : { data: [] }

      const countByGroup = new Map<string, number>()
      for (const m of memberCounts ?? []) {
        countByGroup.set(m.groupId, (countByGroup.get(m.groupId) ?? 0) + 1)
      }

      const classmatesByGroup = new Map<string, Classmate[]>()
      if (groupIds.length > 0) {
        const { data: members } = await supabase
          .from('GroupMember')
          .select('groupId, studentId, student:Student(id, user:User(id, name, surname, avatarUrl))')
          .in('groupId', groupIds)
          .eq('status', 'ACTIVE')
        type MemberRow = {
          groupId: string
          studentId: string
          student: { id: string, user: Pick<UserRow, 'id' | 'name' | 'surname' | 'avatarUrl'> | null } | null
        }
        for (const m of (members ?? []) as MemberRow[]) {
          const u = m.student?.user
          if (!u) continue
          const list = classmatesByGroup.get(m.groupId) ?? []
          list.push({
            studentId: m.studentId,
            userId: u.id,
            name: u.name,
            surname: u.surname,
            avatarUrl: u.avatarUrl,
            initials: `${u.name?.[0] ?? ''}${u.surname?.[0] ?? ''}`.toUpperCase() || '?'
          })
          classmatesByGroup.set(m.groupId, list)
        }
      }

      type GroupResolved = GroupRow & {
        teacher: (TeacherRow & { user: Pick<UserRow, 'name' | 'surname' | 'avatarUrl'> }) | null
        branch: BranchRow | null
      }
      const groups: StudentGroup[] = ((groupsRes.data ?? []) as Array<{ group: GroupResolved | null }>)
        .map(gm => gm.group)
        .filter((g): g is GroupResolved => !!g)
        .map(g => ({
          ...g,
          teacher: g.teacher
            ? {
                id: g.teacher.id,
                name: g.teacher.user?.name ?? '',
                surname: g.teacher.user?.surname ?? '',
                avatarUrl: g.teacher.user?.avatarUrl ?? null,
                bio: g.teacher.bio,
                yearsOfExperience: g.teacher.yearsOfExperience
              }
            : null,
          branch: g.branch,
          studentsCount: countByGroup.get(g.id) ?? 1
        }))

      const xpRows = (xpRes.data ?? []) as Array<{ amount: number, createdAt: string }>
      const totalXp = xpRows.reduce((s, r) => s + r.amount, 0)

      const activityDays = new Set<string>()
      for (const r of xpRows) activityDays.add(r.createdAt.slice(0, 10))
      for (const r of (practiceRes.data ?? []) as Array<{ attemptedAt: string }>) {
        activityDays.add(r.attemptedAt.slice(0, 10))
      }
      let streak = 0
      const cursor = new Date()
      for (let i = 0; i < 365; i++) {
        const key = cursor.toISOString().slice(0, 10)
        if (activityDays.has(key)) {
          streak++
          cursor.setDate(cursor.getDate() - 1)
        } else {
          if (i === 0) {
            cursor.setDate(cursor.getDate() - 1)
            continue
          }
          break
        }
      }
      const todayKey = new Date().toISOString().slice(0, 10)
      const practiceCountToday = ((practiceRes.data ?? []) as Array<{ attemptedAt: string }>)
        .filter(r => r.attemptedAt.startsWith(todayKey)).length

      return {
        studentRow,
        studentId,
        groups,
        classmatesByGroup,
        lessons: (lessonsRes.data ?? []) as LessonRow[],
        grades: (gradesRes.data ?? []) as GradeRow[],
        medals: (medalsRes.data ?? []) as MedalRow[],
        payouts: (payoutsRes.data ?? []) as PayoutRow[],
        homeworks: (homeworkRes.data ?? []) as HomeworkRow[],
        submissions: (submissionsRes.data ?? []) as HomeworkSubRow[],
        materials: (materialsRes.data ?? []) as MaterialRow[],
        vocabulary: (vocabRes.data ?? []) as VocabRow[],
        conversations: (conversationsRes.data ?? []) as ConversationRow[],
        totalXp,
        dailyStreak: streak,
        practiceCountToday
      }
    },
    { server: false, default: () => null, watch: [user] }
  )

  // ─── Derived refs ──────────────────────────────────────────────────────

  const studentId = computed(() => data.value?.studentId ?? null)

  const profile = computed(() => {
    const s = data.value?.studentRow
    if (!s || !user.value) return null
    const claims = user.value as unknown as { user_name?: string, user_surname?: string }
    return {
      id: s.id,
      name: claims.user_name ?? '',
      surname: claims.user_surname ?? '',
      level: s.level,
      goldStreak: s.goldStreak,
      totalEarnings: s.totalEarnings,
      currentMonthAverage: (() => {
        const yyyymm = new Date().toISOString().slice(0, 7)
        const monthGrades = (data.value?.grades ?? []).filter(g => g.gradedAt.startsWith(yyyymm))
        if (!monthGrades.length) return 0
        return monthGrades.reduce((s, g) => s + g.value, 0) / monthGrades.length
      })(),
      dailyStreak: data.value?.dailyStreak ?? s.dailyStreak,
      totalXp: data.value?.totalXp ?? s.totalXp
    }
  })

  const XP_PER_LEVEL = 100
  const level = computed(() => Math.floor((profile.value?.totalXp ?? 0) / XP_PER_LEVEL) + 1)
  const xpInCurrentLevel = computed(() => (profile.value?.totalXp ?? 0) % XP_PER_LEVEL)
  const xpToNextLevel = computed(() => XP_PER_LEVEL - xpInCurrentLevel.value)

  const classmatesOf = (groupId: string) => {
    const all = data.value?.classmatesByGroup.get(groupId) ?? []
    return all.filter(c => c.studentId !== data.value?.studentId)
  }

  const practiceCountToday = computed(() => data.value?.practiceCountToday ?? 0)

  const dailyQuests = computed(() => {
    const practiceTarget = 5
    const practiceDone = Math.min(practiceCountToday.value, practiceTarget)
    const attendedToday = (data.value?.grades ?? []).some(g => g.gradedAt.startsWith(new Date().toISOString().slice(0, 10)))
    const listenedAudio = (data.value?.vocabulary ?? []).some(v => v.addedAt.startsWith(new Date().toISOString().slice(0, 10)))
    return [
      {
        id: 'dq-practice',
        title: 'Произнеси 5 слов',
        description: 'Открой AI-тренажёр и пройди 5 карточек',
        icon: 'i-lucide-mic',
        progress: practiceTarget === 0 ? 1 : practiceDone / practiceTarget,
        rewardXp: 30,
        done: practiceDone >= practiceTarget,
        action: '/student/practice'
      },
      {
        id: 'dq-lesson',
        title: 'Получи оценку сегодня',
        description: 'Будь на уроке и получи отметку',
        icon: 'i-lucide-video',
        progress: attendedToday ? 1 : 0,
        rewardXp: 40,
        done: attendedToday,
        action: '/student/schedule'
      },
      {
        id: 'dq-vocab',
        title: 'Добавь слово в словарь',
        description: 'Сохрани новое слово в личный словарь',
        icon: 'i-lucide-book-marked',
        progress: listenedAudio ? 1 : 0,
        rewardXp: 20,
        done: listenedAudio,
        action: '/student/materials'
      }
    ]
  })

  const myGroups = computed(() => data.value?.groups ?? [])
  const upcomingLessons = computed(() => {
    const now = Date.now()
    return (data.value?.lessons ?? [])
      .filter(l => new Date(l.startsAt).getTime() >= now)
      .slice(0, 20)
  })
  const allLessons = computed(() => data.value?.lessons ?? [])
  const nextLesson = computed(() => upcomingLessons.value[0] ?? null)
  const gradeHistory = computed(() => data.value?.grades ?? [])

  const gradeJournal = computed(() => {
    const lessonById = new Map((data.value?.lessons ?? []).map(l => [l.id, l]))
    const groupById = new Map((data.value?.groups ?? []).map(g => [g.id, g]))
    return (data.value?.grades ?? []).map((g) => {
      const lesson = lessonById.get(g.lessonId)
      const group = lesson ? groupById.get(lesson.groupId) : null
      return {
        id: `${g.studentId}-${g.lessonId}`,
        lessonId: g.lessonId,
        groupId: lesson?.groupId ?? '',
        topic: lesson?.topic ?? '',
        date: g.gradedAt,
        value: g.value,
        comment: g.comment,
        teacherName: group?.teacher
          ? `${group.teacher.name} ${group.teacher.surname}`.trim()
          : ''
      }
    })
  })

  const medalHistory = computed(() => data.value?.medals ?? [])
  const payouts = computed(() => data.value?.payouts ?? [])

  const predictedMedal = computed<Database['public']['Enums']['MedalKind']>(() =>
    computeMedal(profile.value?.currentMonthAverage ?? 0)
  )
  const predictedPayout = computed(() => MEDAL_PAYOUT[predictedMedal.value])

  const homeworkList = computed(() => {
    const subs = data.value?.submissions ?? []
    const subByHw = new Map(subs.map(s => [s.homeworkId, s]))
    return (data.value?.homeworks ?? []).map((hw) => {
      const sub = subByHw.get(hw.id)
      return {
        id: hw.id,
        lessonId: hw.lessonId,
        title: hw.title,
        description: hw.description ?? undefined,
        format: hw.format,
        dueAt: hw.dueAt,
        maxScore: hw.maxScore,
        payload: hw.payload as Record<string, unknown>,
        status: sub?.status ?? 'ASSIGNED',
        submissionId: sub?.id,
        answers: sub?.answers ?? null,
        aiScore: sub?.aiScore ?? null,
        teacherGrade: sub?.teacherGrade ?? null,
        teacherComment: sub?.teacherComment ?? null,
        submittedAt: sub?.submittedAt ?? null,
        checkedAt: sub?.checkedAt ?? null
      }
    })
  })

  const materials = computed(() => data.value?.materials ?? [])
  const vocabulary = computed(() => data.value?.vocabulary ?? [])
  const conversations = computed(() => data.value?.conversations ?? [])

  const WORD_OF_DAY_POOL = [
    { word: 'Lovely', ipa: '/ˈlʌvli/', translation: 'прекрасный, чудесный', example: 'The weather is lovely today!', funFact: 'Британцы говорят "lovely" в среднем 12 раз в день 🇬🇧' },
    { word: 'Cosy', ipa: '/ˈkəʊzi/', translation: 'уютный', example: 'The café is so cosy.', funFact: 'Британцы используют «cosy», американцы — «cozy» 🇬🇧 vs 🇺🇸' },
    { word: 'Brilliant', ipa: '/ˈbrɪljənt/', translation: 'отличный', example: 'That\'s a brilliant idea!', funFact: 'В Британии «brilliant» = «cool» в Америке' },
    { word: 'Cheerful', ipa: '/ˈtʃɪəfʊl/', translation: 'радостный', example: 'She is always cheerful.', funFact: '«Cheers» в Британии — это и «спасибо», и «пока»' },
    { word: 'Delighted', ipa: '/dɪˈlaɪtɪd/', translation: 'очень рад', example: 'I\'m delighted to meet you.' },
    { word: 'Marvellous', ipa: '/ˈmɑːvələs/', translation: 'чудесный', example: 'What a marvellous day!', funFact: 'Британский spelling — с двумя «ll»' },
    { word: 'Splendid', ipa: '/ˈsplendɪd/', translation: 'великолепный', example: 'Splendid! Let\'s do it.' }
  ]
  const wordOfDay = computed(() => {
    const start = new Date(new Date().getFullYear(), 0, 0)
    const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000)
    return WORD_OF_DAY_POOL[dayOfYear % WORD_OF_DAY_POOL.length]!
  })

  return {
    pending,
    refresh,
    // Student identity — needed by features
    studentId,
    // Reactive data
    profile,
    myGroups,
    upcomingLessons,
    allLessons,
    nextLesson,
    gradeHistory,
    gradeJournal,
    medalHistory,
    payouts,
    predictedMedal,
    predictedPayout,
    homeworkList,
    materials,
    vocabulary,
    conversations,
    // Gamification
    level,
    xpInCurrentLevel,
    xpToNextLevel,
    practiceCountToday,
    dailyQuests,
    wordOfDay,
    classmatesOf,
    // Content (static until Certificate/Event tables are migrated)
    practiceDecks: PRACTICE_DECKS,
    certificates: [] as StudentCertificate[],
    events: [] as SchoolEvent[]
  }
}
