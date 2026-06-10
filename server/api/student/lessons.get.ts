export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['STUDENT'])
  const supabase = useServerSupabase(event)

  const query = getQuery(event)
  const groupId = query.groupId as string | undefined

  const authId = (user.sub as string | undefined) ?? user.id

  const { data: userRow } = await supabase
    .from('User')
    .select('id')
    .eq('authId', authId)
    .maybeSingle() as unknown as { data: { id: string } | null }

  if (!userRow) throw createError({ statusCode: 403, message: 'User not found' })

  const { data: studentRow } = await supabase
    .from('Student')
    .select('id')
    .eq('userId', userRow.id)
    .maybeSingle() as unknown as { data: { id: string } | null }

  if (!studentRow) throw createError({ statusCode: 403, message: 'Student profile not found' })

  // Find groups the student is an ACTIVE member of
  let memberQuery = supabase
    .from('GroupMember')
    .select('groupId')
    .eq('studentId', studentRow.id)
    .eq('status', 'ACTIVE')

  if (groupId) {
    memberQuery = memberQuery.eq('groupId', groupId) as typeof memberQuery
  }

  const { data: memberRows } = await memberQuery as unknown as { data: { groupId: string }[] | null }

  const groupIds = (memberRows ?? []).map(m => m.groupId)
  if (groupIds.length === 0) return []

  const { data: lessons, error } = await supabase
    .from('Lesson')
    .select('id, groupId, topic, startsAt, status, durationMin, meetingUrl, createdAt, Group!groupId(name)')
    .in('groupId', groupIds)
    .order('startsAt', { ascending: false })
    .limit(100) as unknown as {
    data: {
      id: string
      groupId: string
      topic: string
      startsAt: string
      status: string
      durationMin: number
      meetingUrl: string | null
      createdAt: string
      Group: { name: string } | null
    }[] | null
    error: unknown
  }

  if (error) throw createError({ statusCode: 500, message: String(error) })

  return (lessons ?? []).map(l => ({
    id: l.id,
    groupId: l.groupId,
    groupName: Array.isArray(l.Group) ? (l.Group[0]?.name ?? '') : (l.Group?.name ?? ''),
    topic: l.topic,
    startsAt: l.startsAt,
    status: l.status,
    durationMin: l.durationMin,
    meetingUrl: l.meetingUrl,
    createdAt: l.createdAt
  }))
})
