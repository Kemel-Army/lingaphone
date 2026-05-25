/**
 * useParentActions — rule-driven weekly action plan + conversation starters
 * + Femi-verdict + Mood-indicator + Peer-rank for the parent dashboard.
 *
 * Pulls live signals (mastery, streak, decaying topics, HW completion,
 * activity) and turns them into 3 specific weekly actions a parent can
 * actually do.
 */

export interface WeeklyAction {
  id: string
  icon: string
  title: string
  detail: string
  when: string
}

export interface ConversationStarter {
  id: string
  prompt: string
  topic: string
}

export interface ParentDashboardSignals {
  femiVerdict: string
  mood: 'happy' | 'neutral' | 'worried'
  moodLabel: string
  moodReason: string
  peerPercentile: number
  peerLabel: string
  participationPct: number
  actions: WeeklyAction[]
  starters: ConversationStarter[]
  bookSuggestion: { title: string, author: string, note: string }
  avoid: string[]
}

export const useParentActions = () => {
  const supabase = useTypedSupabaseClient()

  const fetchSignals = async (studentId: string): Promise<ParentDashboardSignals> => {
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Lessons connect to students via LessonStudent; AIMessage has no student
    // column, so we filter through AIConversation.id.
    const [lessonLinks, convs] = await Promise.all([
      supabase.from('LessonStudent').select('lessonId').eq('studentId', studentId),
      supabase.from('AIConversation').select('id').eq('studentId', studentId).gte('createdAt', since7).limit(200)
    ])
    const lessonIds = ((lessonLinks.data ?? []) as Array<{ lessonId: string }>).map(l => l.lessonId)
    const convIds = ((convs.data ?? []) as Array<{ id: string }>).map(c => c.id)

    const [modelRes, gameRes, hwRes, lessonsRes, msgsRes] = await Promise.all([
      supabase
        .from('StudentModel')
        .select('knowledgeMap')
        .eq('studentId', studentId)
        .limit(10),
      supabase
        .from('StudentGameProfile')
        .select('xp, currentStreak, lastActiveAt')
        .eq('studentId', studentId)
        .maybeSingle(),
      supabase
        .from('HomeworkSubmission')
        .select('status, aiScore, createdAt')
        .eq('studentId', studentId)
        .gte('createdAt', since30)
        .limit(200),
      lessonIds.length
        ? supabase
            .from('Lesson')
            .select('status, scheduledAt')
            .in('id', lessonIds)
            .gte('scheduledAt', since30)
            .limit(60)
        : Promise.resolve({ data: [] as unknown[] }),
      convIds.length
        ? supabase
            .from('AIMessage')
            .select('role, createdAt')
            .in('conversationId', convIds)
            .gte('createdAt', since7)
            .limit(500)
        : Promise.resolve({ data: [] as unknown[] })
    ])

    const models = (modelRes.data ?? []) as Array<{ knowledgeMap: Record<string, number> | null }>
    let kmSum = 0
    let kmN = 0
    const weakTopics: Array<{ id: string, name: string, mastery: number }> = []
    for (const m of models) {
      const km = m.knowledgeMap ?? {}
      for (const [id, val] of Object.entries(km)) {
        kmSum += val
        kmN++
        if (val < 55) weakTopics.push({ id, name: '', mastery: val })
      }
    }
    const mastery = kmN > 0 ? Math.round(kmSum / kmN) : 0

    if (weakTopics.length) {
      const { data: topicRows } = await supabase
        .from('Topic')
        .select('id, name')
        .in('id', weakTopics.map(t => t.id))
      const nameById = new Map(((topicRows ?? []) as Array<{ id: string, name: string }>).map(t => [t.id, t.name]))
      for (const t of weakTopics) t.name = nameById.get(t.id) ?? 'Тема'
    }

    const game = (gameRes.data ?? null) as { currentStreak?: number, lastActiveAt?: string | null } | null
    const streak = game?.currentStreak ?? 0
    const lastActiveDays = game?.lastActiveAt
      ? Math.floor((Date.now() - new Date(game.lastActiveAt).getTime()) / (24 * 60 * 60 * 1000))
      : 99

    const hwRows = (hwRes.data ?? []) as Array<{ status: string, aiScore: number | null }>
    const hwDone = hwRows.filter(h => h.status === 'CHECKED' || h.status === 'SUBMITTED').length
    const hwOverdue = hwRows.filter(h => h.status === 'OVERDUE').length
    const hwTotal = hwRows.length
    const hwCompletionRate = hwTotal > 0 ? Math.round((hwDone / hwTotal) * 100) : 0
    const hwAvgScore = (() => {
      const scored = hwRows.filter(h => h.aiScore != null)
      if (!scored.length) return 0
      return Math.round(scored.reduce((s, h) => s + (h.aiScore ?? 0), 0) / scored.length)
    })()

    const lessons = ((lessonsRes as { data?: unknown[] }).data ?? []) as Array<{ status: string }>
    const _lessonsDone = lessons.filter(l => l.status === 'COMPLETED').length

    const msgs = ((msgsRes as { data?: unknown[] }).data ?? []) as Array<{ role: string }>
    const userMsgs = msgs.filter(m => m.role === 'user').length

    // ── Mood
    let mood: ParentDashboardSignals['mood'] = 'neutral'
    let moodReason = 'Ритм обучения стабильный.'
    if (mastery >= 70 && streak >= 7 && hwCompletionRate >= 70) {
      mood = 'happy'
      moodReason = `Mastery ${mastery}%, streak ${streak} дн., 70%+ ДЗ — ребёнок в потоке.`
    } else if (mastery < 50 || hwCompletionRate < 40 || lastActiveDays > 5) {
      mood = 'worried'
      if (mastery < 50) moodReason = `Mastery ${mastery}% — пробелы накапливаются.`
      else if (lastActiveDays > 5) moodReason = `Не заходил ${lastActiveDays} дн. Streak в опасности.`
      else moodReason = `Только ${hwCompletionRate}% ДЗ выполнены — нужно подключиться.`
    }

    // ── Femi verdict (rule-based; replace with /api/parent/femi-verdict for true LLM)
    let verdict = ''
    if (streak >= 14 && hwAvgScore >= 70) {
      verdict = `Айдос на пике формы — ${streak} дней подряд + средняя оценка ${hwAvgScore}% по ДЗ.`
    } else if (lastActiveDays > 3) {
      verdict = `Айдос не появлялся ${lastActiveDays} дн. Streak ${streak} — успейте сохранить.`
    } else if (hwOverdue > 0) {
      verdict = `${hwOverdue} ДЗ просрочены. Самое время сесть и разобрать вместе одно из них.`
    } else if (mastery > 0 && weakTopics.length > 0) {
      verdict = `Mastery ${mastery}% — растёт. Сейчас работаем над ${weakTopics.length} слабыми темами.`
    } else {
      verdict = 'Стабильный ритм. Femi следит за каждой сессией.'
    }

    // ── Peer percentile (demo formula — without per-grade cohort data)
    const peerPercentile = Math.max(5, Math.min(98, Math.round(mastery * 0.95 + (streak * 0.4) + (hwAvgScore * 0.1))))
    const peerLabel = peerPercentile >= 80
      ? `Лучше ${peerPercentile}% сверстников`
      : peerPercentile >= 50
        ? `Лучше ${peerPercentile}% сверстников`
        : `${peerPercentile}-й процентиль — есть пространство для роста`

    // ── Participation (demo: depends on hw + msgs)
    const participationPct = Math.max(15, Math.min(100, Math.round(hwCompletionRate * 0.6 + Math.min(40, userMsgs) * 1.0)))

    // ── 3 actions
    const actions: WeeklyAction[] = []

    if (hwOverdue > 0) {
      actions.push({
        id: 'overdue',
        icon: 'i-lucide-clipboard-list',
        title: `Разобрать ${hwOverdue} просроченных ДЗ вместе`,
        detail: 'Откройте кабинет → ДЗ → выберите задание и пройдитесь по решению. Достаточно 20 минут.',
        when: 'Эта суббота, 30 мин'
      })
    }

    if (weakTopics.length > 0) {
      actions.push({
        id: 'weak-topic',
        icon: 'i-lucide-target',
        title: `Прокачать ${weakTopics.length} слабых темы — поможет AI-репетитор`,
        detail: 'Не нужно объяснять самим. Откройте AI-репетитор в режиме «Объяснение» — Femi подберёт подсказки.',
        when: 'Будний день, 25 мин'
      })
    }

    if (lastActiveDays > 3) {
      actions.push({
        id: 'streak',
        icon: 'i-lucide-flame',
        title: 'Помочь сохранить streak',
        detail: `Streak — ${streak} дн. Если не зайти ещё ${lastActiveDays > 6 ? 'сегодня' : 'в течение дня'}, обнулится.`,
        when: 'Сегодня, 10 мин'
      })
    }

    if (actions.length < 3) {
      actions.push({
        id: 'praise',
        icon: 'i-lucide-trophy',
        title: 'Похвалить за прогресс этой недели',
        detail: 'Конкретная похвала за усилие ("ты упорно решал задачи, я заметил") работает лучше общей.',
        when: 'Вечером перед сном'
      })
    }

    if (actions.length < 3) {
      actions.push({
        id: 'rhythm',
        icon: 'i-lucide-calendar',
        title: 'Зафиксировать расписание AI-сессий',
        detail: 'Рекомендуем 4 сессии в неделю по 25 минут — после школы, до 18:00.',
        when: 'Воскресенье, 5 мин'
      })
    }

    // ── Conversation starters (3)
    const starters: ConversationStarter[] = [
      { id: 'cs-1', prompt: 'Какая задача за неделю была самой интересной — и почему?', topic: 'Любопытство' },
      { id: 'cs-2', prompt: weakTopics.length > 0 ? `Объясни мне «${weakTopics[0]!.name}» как будто я ничего не знаю.` : 'Объясни мне любую тему за неделю как будто я ничего не знаю.', topic: 'Метакогнитивность' },
      { id: 'cs-3', prompt: 'Когда тебе было сложно — что помогло справиться?', topic: 'Резилентность' }
    ]

    const bookSuggestion = {
      title: weakTopics.some(t => /геом|угол|треуг/i.test(t.name))
        ? 'Перельман — Занимательная геометрия'
        : 'Перельман — Занимательная арифметика',
      author: 'Я. И. Перельман',
      note: '15 минут перед сном. Глава по теме, которую сейчас проходим.'
    }

    const avoid = [
      'Не сравнивайте с другими: «Васе же удалось…»',
      'Не давите на streak — это мотивация ребёнка, не KPI родителя.'
    ]

    return {
      femiVerdict: verdict,
      mood,
      moodLabel: mood === 'happy' ? 'В потоке' : mood === 'worried' ? 'Нужна поддержка' : 'Стабильно',
      moodReason,
      peerPercentile,
      peerLabel,
      participationPct,
      actions: actions.slice(0, 3),
      starters,
      bookSuggestion,
      avoid
    }
  }

  return { fetchSignals }
}
