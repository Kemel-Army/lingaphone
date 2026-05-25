/**
 * POST /api/gamification/check-achievements
 * Check and award any newly earned achievements for a student.
 * Called after XP award, homework submission, lesson attendance, etc.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export default defineEventHandler(async (event) => {
  const { studentId } = await getCurrentStudent(event)
  const supabase = useServerSupabase(event)

  // 1. Get game profile
  const { data: profile, error: profileError } = await supabase
    .from('StudentGameProfile')
    .select('*')
    .eq('studentId', studentId)
    .single()

  if (profileError || !profile) {
    return { newAchievements: [] }
  }

  const p = profile as Record<string, any>

  // 2. Get all active achievements
  const { data: allAchievements } = await supabase
    .from('Achievement')
    .select('*')
    .eq('isActive', true)

  if (!allAchievements?.length) return { newAchievements: [] }

  // 3. Get already earned
  const { data: earned } = await supabase
    .from('StudentAchievement')
    .select('achievementId')
    .eq('studentProfileId', p.id)

  const earnedIds = new Set((earned ?? []).map((e: any) => e.achievementId))

  // 4. Gather context stats
  // Count homework on time
  const { count: hwCount } = await supabase
    .from('HomeworkSubmission')
    .select('*', { count: 'exact', head: true })
    .eq('studentId', studentId)
    .in('status', ['CHECKED', 'SUBMITTED'])

  // Count AI sessions
  const { count: aiCount } = await supabase
    .from('AIConversation')
    .select('*', { count: 'exact', head: true })
    .eq('studentId', studentId)

  // Count perfect tests (score = maxScore via TestAttempt)
  const { data: perfectTests } = await supabase
    .from('TestAttempt')
    .select('score, Test(maxScore)')
    .eq('studentId', studentId)
    .not('score', 'is', null)

  const perfectCount = (perfectTests ?? []).filter((t: any) => {
    const maxScore = t.Test?.maxScore ?? 100
    return t.score != null && t.score >= maxScore
  }).length

  // Count gaps closed: topics that went from <30% to >=80% mastery
  let gapsClosed = 0
  const { data: studentModels } = await supabase
    .from('StudentModel')
    .select('knowledgeMap')
    .eq('studentId', studentId)

  if (studentModels?.length) {
    for (const sm of studentModels as any[]) {
      const km = sm.knowledgeMap as Record<string, number> | null
      if (km) {
        gapsClosed += Object.values(km).filter(v => v >= 80).length
      }
    }
  }

  const context = {
    xp: p.xp ?? 0,
    level: p.level ?? 1,
    currentStreak: p.currentStreak ?? 0,
    homeworkOnTime: hwCount ?? 0,
    aiSessions: (aiCount as number) ?? 0,
    perfectTests: perfectCount,
    gapsClosed
  }

  // 5. Check each achievement
  const newlyEarned: any[] = []

  for (const ach of allAchievements) {
    const a = ach as Record<string, any>
    if (earnedIds.has(a.id)) continue

    const cond = a.condition as Record<string, any>
    if (!cond?.type) continue

    let met = false

    switch (cond.type) {
      case 'xp_total':
        met = context.xp >= (cond.value as number)
        break
      case 'level':
        met = context.level >= (cond.value as number)
        break
      case 'streak':
        met = context.currentStreak >= (cond.value as number)
        break
      case 'homework_on_time':
        met = context.homeworkOnTime >= (cond.value as number)
        break
      case 'ai_sessions':
        met = context.aiSessions >= (cond.value as number)
        break
      case 'perfect_test':
        met = context.perfectTests >= (cond.value as number)
        break
      case 'gap_closed':
        met = context.gapsClosed >= (cond.value as number)
        break
    }

    if (met) {
      const { data: sa, error: saError } = await supabase
        .from('StudentAchievement')
        .insert({
          studentProfileId: p.id,
          achievementId: a.id
        } as never)
        .select('*, Achievement(*)')
        .single()

      if (!saError && sa) {
        newlyEarned.push(sa)

        // Award XP for the achievement
        if (a.xpReward > 0) {
          await supabase.from('XPTransaction').insert({
            studentId,
            amount: a.xpReward,
            action: 'ACHIEVEMENT_REWARD',
            sourceId: a.id,
            description: `Достижение: ${a.name}`
          } as never)

          p.xp = (p.xp ?? 0) + a.xpReward
        }

        // Award gems for the achievement
        const gemReward = (a.gemReward as number) ?? 0
        if (gemReward > 0) {
          await supabase.from('GemTransaction').insert({
            studentId,
            amount: gemReward,
            sourceType: 'ACHIEVEMENT',
            sourceId: a.id,
            description: `Достижение: ${a.name}`
          } as never)

          p.gems = (p.gems ?? 0) + gemReward
        }

        // Update profile XP + gems together
        await supabase
          .from('StudentGameProfile')
          .update({
            xp: p.xp ?? 0,
            gems: p.gems ?? 0,
            updatedAt: new Date().toISOString()
          } as never)
          .eq('id', p.id)
      }
    }
  }

  return { newAchievements: newlyEarned }
})
