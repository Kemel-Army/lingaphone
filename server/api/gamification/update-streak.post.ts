/**
 * POST /api/gamification/update-streak
 * Called when student logs in or performs any activity.
 * Increments streak if consecutive day, resets if gap > 1 day.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export default defineEventHandler(async (event) => {
  const { studentId } = await getCurrentStudent(event)
  const supabase = useServerSupabase(event)

  // Get or create game profile
  // eslint-disable-next-line prefer-const
  let { data: profile, error: profileError } = await supabase
    .from('StudentGameProfile')
    .select('*')
    .eq('studentId', studentId)
    .single()

  if (profileError && profileError.code === 'PGRST116') {
    const { data: newProfile, error: insertErr } = await supabase
      .from('StudentGameProfile')
      .insert({ studentId } as never)
      .select()
      .single()
    if (insertErr) throw createError({ statusCode: 500, message: insertErr.message })
    profile = newProfile
  } else if (profileError) {
    throw createError({ statusCode: 500, message: profileError.message })
  }

  if (!profile) {
    throw createError({ statusCode: 500, message: 'Failed to get or create game profile' })
  }

  const p = profile as Record<string, any>
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const lastDate = p.lastActiveDate ? new Date(p.lastActiveDate).toISOString().slice(0, 10) : null

  // Already active today
  if (lastDate === today) {
    return {
      currentStreak: p.currentStreak,
      longestStreak: p.longestStreak,
      isNewDay: false,
      bonusXP: 0
    }
  }

  let newStreak = 1
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  if (lastDate === yesterdayStr) {
    // Consecutive day
    newStreak = (p.currentStreak ?? 0) + 1
  } else if (lastDate && lastDate < yesterdayStr) {
    // Gap > 1 day — check for streak freeze
    const freezes = (p.streakFreezes as number) ?? 0
    if (freezes > 0) {
      // Use a streak freeze to preserve the streak
      newStreak = (p.currentStreak ?? 0) + 1
      await supabase
        .from('StudentGameProfile')
        .update({ streakFreezes: freezes - 1 } as never)
        .eq('id', p.id)
    }
    // else newStreak stays at 1 (reset)
  }

  const newLongest = Math.max(p.longestStreak ?? 0, newStreak)

  await supabase
    .from('StudentGameProfile')
    .update({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveDate: now.toISOString(),
      updatedAt: now.toISOString()
    } as never)
    .eq('id', p.id)

  // Award streak milestone bonuses
  let bonusXP = 0
  let bonusGems = 0
  const milestones = [7, 14, 30, 60, 100]
  if (milestones.includes(newStreak)) {
    bonusXP = newStreak >= 100 ? 200 : newStreak >= 30 ? 100 : 50

    await supabase
      .from('XPTransaction')
      .insert({
        studentId,
        amount: bonusXP,
        action: 'STREAK_BONUS',
        description: `Streak ${newStreak} дней`
      } as never)

    // Streak gem rewards
    const streakGemMap: Record<number, number> = { 7: 20, 14: 30, 30: 50, 60: 100, 100: 150 }
    bonusGems = streakGemMap[newStreak] ?? 0

    if (bonusGems > 0) {
      await supabase.from('GemTransaction').insert({
        studentId,
        amount: bonusGems,
        sourceType: 'STREAK',
        description: `Streak ${newStreak} дней`
      } as never)
    }

    // Update XP + gems in profile
    await supabase
      .from('StudentGameProfile')
      .update({
        xp: (p.xp ?? 0) + bonusXP,
        gems: (p.gems ?? 0) + bonusGems,
        updatedAt: new Date().toISOString()
      } as never)
      .eq('id', p.id)
  }

  // Update STREAK_DAYS quest progress via internal-only route
  const internalToken = (useRuntimeConfig().internalApiKey as string | undefined) ?? ''
  if (internalToken) {
    try {
      await $fetch('/api/gamification/update-quest-progress', {
        method: 'POST',
        body: { studentId, questType: 'STREAK_DAYS', increment: 1 },
        headers: { 'x-internal-token': internalToken }
      })
    } catch { /* best-effort */ }
  }

  return {
    currentStreak: newStreak,
    longestStreak: newLongest,
    isNewDay: true,
    bonusXP,
    bonusGems
  }
})
