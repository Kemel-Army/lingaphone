/**
 * POST /api/gamification/ensure-profile
 * Returns the caller's StudentGameProfile, creating it lazily.
 * Profile rows are server-managed (trigger blocks client INSERTs).
 */
export default defineEventHandler(async (event) => {
  const { studentId } = await getCurrentStudent(event)
  const supabase = useServerSupabase(event)

  const { data: existing } = await supabase
    .from('StudentGameProfile')
    .select('*')
    .eq('studentId', studentId)
    .maybeSingle()

  if (existing) return { profile: existing }

  const { data: created, error: insertErr } = await supabase
    .from('StudentGameProfile')
    .insert({ studentId } as never)
    .select()
    .single()
  if (insertErr) throw createError({ statusCode: 500, message: insertErr.message })

  return { profile: created }
})
