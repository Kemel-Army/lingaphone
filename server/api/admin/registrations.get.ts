import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/shared/types/database.types'

/**
 * GET /api/admin/registrations
 * Lists pending/rejected family self-registration batches, grouped by
 * `registrationBatchId` (see /api/auth/register-family.post.ts).
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })
  const role = (user as unknown as { user_role?: string }).user_role
  if (role !== 'ADMIN') throw createError({ statusCode: 403, message: 'Forbidden' })

  const supabase = serverSupabaseServiceRole<Database>(event)

  const { data: users, error } = await supabase
    .from('User')
    .select('id, name, surname, patronymic, email, phone, role, status, initialPassword, registrationBatchId, createdAt')
    .not('registrationBatchId', 'is', null)
    .in('status', ['PENDING', 'REJECTED'])
    .order('createdAt', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!users?.length) return { batches: [] }

  const userIds = users.map(u => u.id)
  const [{ data: parents }, { data: students }] = await Promise.all([
    supabase.from('Parent').select('id, userId').in('userId', userIds),
    supabase.from('Student').select('id, userId, schoolGrade, schoolName, age').in('userId', userIds)
  ])

  const parentByUserId = new Map((parents ?? []).map(p => [p.userId, p]))
  const studentByUserId = new Map((students ?? []).map(s => [s.userId, s]))

  const batches = new Map<string, {
    batchId: string
    createdAt: string
    status: string
    parents: Record<string, unknown>[]
    children: Record<string, unknown>[]
  }>()

  for (const u of users) {
    const batchId = u.registrationBatchId as string
    if (!batches.has(batchId)) {
      batches.set(batchId, { batchId, createdAt: u.createdAt, status: u.status, parents: [], children: [] })
    }
    const batch = batches.get(batchId)!
    const base = {
      userId: u.id,
      name: u.name,
      surname: u.surname,
      patronymic: u.patronymic,
      email: u.email,
      phone: u.phone,
      password: u.initialPassword
    }
    if (u.role === 'PARENT') {
      batch.parents.push({ ...base, parentId: parentByUserId.get(u.id)?.id })
    } else if (u.role === 'STUDENT') {
      const s = studentByUserId.get(u.id)
      batch.children.push({ ...base, studentId: s?.id, schoolGrade: s?.schoolGrade, schoolName: s?.schoolName, age: s?.age })
    }
  }

  return { batches: Array.from(batches.values()) }
})
