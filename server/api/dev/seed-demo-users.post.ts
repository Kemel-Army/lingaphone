/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'

/**
 * Seed demo users for 1-6 grade self-paced platform.
 * Creates: 1 admin, 4 parents, 6 students (grades 1-6, one per grade).
 * Each parent linked to 1-2 children. Each student gets a StudentGameProfile.
 *
 * Idempotent: re-running upserts by email.
 */
const bodySchema = z.object({
  resetXp: z.boolean().default(false)
}).default(() => ({ resetXp: false }))

interface SeedUser {
  email: string
  name: string
  surname: string
  role: 'STUDENT' | 'PARENT' | 'ADMIN'
  phone?: string
}

const USERS: SeedUser[] = [
  { email: 'admin@femo.kz', name: 'Админ', surname: 'FEMO', role: 'ADMIN', phone: '+77001230000' },
  // Parents
  { email: 'parent1@femo.kz', name: 'Айгерим', surname: 'Серикова', role: 'PARENT', phone: '+77001230001' },
  { email: 'parent2@femo.kz', name: 'Бауржан', surname: 'Жумабаев', role: 'PARENT', phone: '+77001230002' },
  { email: 'parent3@femo.kz', name: 'Мадина', surname: 'Касенова', role: 'PARENT', phone: '+77001230003' },
  { email: 'parent4@femo.kz', name: 'Алмас', surname: 'Турсунов', role: 'PARENT', phone: '+77001230004' },
  // Students — one per grade 1..6
  { email: 'student1@femo.kz', name: 'Аяна', surname: 'Серикова', role: 'STUDENT', phone: '+77001230011' },
  { email: 'student2@femo.kz', name: 'Тимур', surname: 'Серикова', role: 'STUDENT', phone: '+77001230012' },
  { email: 'student3@femo.kz', name: 'Данияр', surname: 'Жумабаев', role: 'STUDENT', phone: '+77001230013' },
  { email: 'student4@femo.kz', name: 'Камила', surname: 'Касенова', role: 'STUDENT', phone: '+77001230014' },
  { email: 'student5@femo.kz', name: 'Арман', surname: 'Турсунов', role: 'STUDENT', phone: '+77001230015' },
  { email: 'student6@femo.kz', name: 'Айдана', surname: 'Турсунов', role: 'STUDENT', phone: '+77001230016' }
]

// Parent -> children mapping by email (M:N)
const PARENT_CHILDREN: Record<string, string[]> = {
  'parent1@femo.kz': ['student1@femo.kz', 'student2@femo.kz'],
  'parent2@femo.kz': ['student3@femo.kz'],
  'parent3@femo.kz': ['student4@femo.kz'],
  'parent4@femo.kz': ['student5@femo.kz', 'student6@femo.kz']
}

// Student email -> grade (1..6)
const STUDENT_GRADES: Record<string, number> = {
  'student1@femo.kz': 1,
  'student2@femo.kz': 2,
  'student3@femo.kz': 3,
  'student4@femo.kz': 4,
  'student5@femo.kz': 5,
  'student6@femo.kz': 6
}

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  await readValidatedBody(event, bodySchema.parse).catch(() => ({ resetXp: false }))

  const supabase = useServerSupabase(event)
  const created: Record<string, string> = {}

  // 1. Upsert User rows
  for (const u of USERS) {
    const { data: existing } = await supabase
      .from('User')
      .select('id')
      .eq('email', u.email)
      .maybeSingle()

    if (existing && (existing as any).id) {
      created[u.email] = (existing as any).id
      // Make sure role is up to date
      await supabase.from('User').update({
        name: u.name,
        surname: u.surname,
        role: u.role as any,
        phone: u.phone ?? null
      } as any).eq('id', (existing as any).id)
      continue
    }

    const { data: inserted, error } = await supabase.from('User').insert({
      email: u.email,
      name: u.name,
      surname: u.surname,
      role: u.role as any,
      phone: u.phone ?? null,
      status: 'ACTIVE'
    } as any).select('id').single()

    if (error) {
      throw createError({ statusCode: 500, message: `User insert failed (${u.email}): ${error.message}` })
    }
    created[u.email] = (inserted as any).id
  }

  // 2. Create Parent rows
  const parentIds: Record<string, string> = {}
  for (const u of USERS.filter(x => x.role === 'PARENT')) {
    const userId = created[u.email]
    if (!userId) continue
    const { data: existing } = await supabase
      .from('Parent')
      .select('id')
      .eq('userId', userId)
      .maybeSingle()
    if (existing && (existing as any).id) {
      parentIds[u.email] = (existing as any).id
      continue
    }
    const { data: inserted } = await supabase.from('Parent').insert({ userId } as any).select('id').single()
    if (inserted) parentIds[u.email] = (inserted as any).id
  }

  // 3. Create Student rows
  const studentIds: Record<string, string> = {}
  for (const u of USERS.filter(x => x.role === 'STUDENT')) {
    const userId = created[u.email]
    if (!userId) continue
    const grade = STUDENT_GRADES[u.email] ?? 1
    const { data: existing } = await supabase
      .from('Student')
      .select('id')
      .eq('userId', userId)
      .maybeSingle()
    if (existing && (existing as any).id) {
      studentIds[u.email] = (existing as any).id
      await supabase.from('Student').update({ grade } as any).eq('id', (existing as any).id)
      continue
    }
    const { data: inserted } = await supabase.from('Student').insert({
      userId,
      grade,
      availableLessons: 0
    } as any).select('id').single()
    if (inserted) studentIds[u.email] = (inserted as any).id
  }

  // 4. Link Parent <-> Student (M:N)
  for (const [parentEmail, childEmails] of Object.entries(PARENT_CHILDREN)) {
    const parentId = parentIds[parentEmail]
    if (!parentId) continue
    for (const childEmail of childEmails) {
      const studentId = studentIds[childEmail]
      if (!studentId) continue
      await supabase.from('ParentToStudent')
        .upsert({ parentId, studentId } as any, { onConflict: 'parentId,studentId' })
    }
  }

  // 5. Initialize StudentGameProfile for each student
  for (const studentId of Object.values(studentIds)) {
    const { data: existing } = await supabase
      .from('StudentGameProfile')
      .select('id, xp, currentStreak')
      .eq('studentId', studentId)
      .maybeSingle()
    if (existing && (existing as any).id) continue
    await supabase.from('StudentGameProfile').insert({
      studentId,
      xp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      gems: 0
    } as any)
  }

  return {
    ok: true,
    summary: {
      users: Object.keys(created).length,
      parents: Object.keys(parentIds).length,
      students: Object.keys(studentIds).length
    },
    credentials: USERS.map(u => ({ email: u.email, role: u.role }))
  }
})
