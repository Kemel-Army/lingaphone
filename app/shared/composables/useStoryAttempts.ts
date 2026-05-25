/**
 * useStoryAttempts — Listen & Retell history.
 *
 *  - recordAttempt() — inserts StoryAttempt row + awards XP via XpLog
 *  - fetchHistoryForStory() — recent attempts for one storyId (best/recent list)
 *  - fetchAllAttempts() — all attempts (used by /student/progress)
 *
 * RLS keeps everything scoped to the current student via get_current_student_id().
 *
 * XP rules:
 *   ≥85% comprehension → +30 XP
 *   ≥60% comprehension → +15 XP
 *   <60%               → 0 XP (still recorded)
 */
import type { Database } from '~/shared/types/database.types'

type StoryAttemptRow = Database['public']['Tables']['StoryAttempt']['Row']

export interface StoryAttemptSummary {
  attempts: number
  bestScore: number
  averageScore: number
  lastAttemptedAt: string | null
}

const xpForScore = (score: number): number => {
  if (score >= 85) return 30
  if (score >= 60) return 15
  return 0
}

export const useStoryAttempts = () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  /** Resolve current student.id (cached per page-load). */
  const resolveStudentId = async (): Promise<string | null> => {
    if (!user.value) return null
    const { data } = await supabase.from('Student').select('id').single()
    return data?.id ?? null
  }

  const recordAttempt = async (params: {
    storyId: string
    storyTitle: string
    storyLevel: string
    transcript: string
    keyPointsTotal: number
    keyPointsCovered: number
    comprehensionScore: number
  }): Promise<{ ok: boolean, xpAwarded: number }> => {
    const studentId = await resolveStudentId()
    if (!studentId) return { ok: false, xpAwarded: 0 }

    const { error: insertError } = await supabase
      .from('StoryAttempt')
      .insert({
        studentId,
        storyId: params.storyId,
        storyTitle: params.storyTitle,
        storyLevel: params.storyLevel,
        transcript: params.transcript,
        keyPointsTotal: params.keyPointsTotal,
        keyPointsCovered: params.keyPointsCovered,
        comprehensionScore: params.comprehensionScore
      })

    if (insertError) {
      console.error('[useStoryAttempts] insert failed', insertError)
      return { ok: false, xpAwarded: 0 }
    }

    const xpAwarded = xpForScore(params.comprehensionScore)
    if (xpAwarded > 0) {
      const { error: xpError } = await supabase.from('XpLog').insert({
        studentId,
        action: 'STORY_RETELL',
        amount: xpAwarded,
        refId: params.storyId
      })
      if (xpError) {
        console.error('[useStoryAttempts] XP insert failed', xpError)
      }
    }

    return { ok: true, xpAwarded }
  }

  /** Get all attempts for one story (most recent first). */
  const fetchHistoryForStory = async (storyId: string): Promise<StoryAttemptRow[]> => {
    const { data, error } = await supabase
      .from('StoryAttempt')
      .select('*')
      .eq('storyId', storyId)
      .order('attemptedAt', { ascending: false })
      .limit(20)
    if (error) {
      console.error('[useStoryAttempts] fetchHistoryForStory failed', error)
      return []
    }
    return (data ?? []) as StoryAttemptRow[]
  }

  /** Get a one-shot summary for a single story (count, best, avg, last). */
  const summarizeStory = async (storyId: string): Promise<StoryAttemptSummary> => {
    const rows = await fetchHistoryForStory(storyId)
    if (rows.length === 0) {
      return { attempts: 0, bestScore: 0, averageScore: 0, lastAttemptedAt: null }
    }
    const sum = rows.reduce((s, r) => s + r.comprehensionScore, 0)
    const best = rows.reduce((m, r) => Math.max(m, r.comprehensionScore), 0)
    return {
      attempts: rows.length,
      bestScore: best,
      averageScore: Math.round(sum / rows.length),
      lastAttemptedAt: rows[0]?.attemptedAt ?? null
    }
  }

  /** All attempts for the current student (for /student/progress aggregation). */
  const fetchAllAttempts = async (): Promise<StoryAttemptRow[]> => {
    const { data, error } = await supabase
      .from('StoryAttempt')
      .select('*')
      .order('attemptedAt', { ascending: false })
    if (error) {
      console.error('[useStoryAttempts] fetchAllAttempts failed', error)
      return []
    }
    return (data ?? []) as StoryAttemptRow[]
  }

  return { recordAttempt, fetchHistoryForStory, summarizeStory, fetchAllAttempts }
}
