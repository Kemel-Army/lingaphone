import type { Database } from '~/shared/types/database.types'
import type { ParentListItem } from '../model/types'

/** Админ: управление родителями и связями с детьми (ТЗ разд. 6). */
export const useParents = () => {
  const supabase = useSupabaseClient<Database>()

  const fetchParents = async (): Promise<ParentListItem[]> => {
    const { data, error } = await supabase
      .from('Parent')
      .select(`
        id,
        user:User!Parent_userId_fkey(id, name, surname, email, phone),
        links:ParentToStudent(student:Student(id, user:User(name, surname)))
      `)
      .order('createdAt', { ascending: false })
    if (error) throw error

    type Row = {
      id: string
      user: { id: string, name: string, surname: string, email: string, phone: string | null } | null
      links: { student: { id: string, user: { name: string, surname: string } | null } | null }[]
    }
    return ((data ?? []) as unknown as Row[]).map(p => ({
      parentId: p.id,
      userId: p.user?.id ?? '',
      name: p.user?.name ?? '',
      surname: p.user?.surname ?? '',
      email: p.user?.email ?? '',
      phone: p.user?.phone ?? null,
      children: p.links
        .filter(l => l.student)
        .map(l => ({
          studentId: l.student!.id,
          name: l.student!.user?.name ?? '',
          surname: l.student!.user?.surname ?? ''
        }))
    }))
  }

  const createParent = (payload: {
    name: string
    surname: string
    patronymic?: string
    email: string
    password: string
    phone?: string
    iin?: string
    studentIds: string[]
  }) => $fetch('/api/admin/parents', { method: 'POST', body: payload })

  const linkChild = async (parentId: string, studentId: string): Promise<void> => {
    const { error } = await supabase.from('ParentToStudent').insert({ parentId, studentId } as never)
    if (error) throw error
  }

  const unlinkChild = async (parentId: string, studentId: string): Promise<void> => {
    const { error } = await supabase
      .from('ParentToStudent')
      .delete()
      .eq('parentId', parentId)
      .eq('studentId', studentId)
    if (error) throw error
  }

  /** Ученики для привязки к родителю. */
  const fetchStudents = async (): Promise<{ id: string, name: string, surname: string }[]> => {
    const { data, error } = await supabase.from('Student').select('id, user:User(name, surname)')
    if (error) throw error
    type Row = { id: string, user: { name: string, surname: string } | null }
    return ((data ?? []) as unknown as Row[])
      .map(s => ({ id: s.id, name: s.user?.name ?? '', surname: s.user?.surname ?? '' }))
      .sort((a, b) => a.surname.localeCompare(b.surname, 'ru'))
  }

  return { fetchParents, createParent, linkChild, unlinkChild, fetchStudents }
}
