import type { UserRole } from '~/shared/types/common'

export interface UserListItem {
  id: string
  name: string
  surname: string
  email: string
  role: UserRole
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED'
  avatarUrl: string | null
  phone: string | null
  createdAt: string
}

/**
 * Entity composable: admin-level user queries.
 */
export const useUsers = () => {
  const supabase = useTypedSupabaseClient()

  const fetchUsers = async (opts?: {
    role?: 'STUDENT' | 'PARENT' | 'ADMIN' | 'ALL' | string
    limit?: number
    offset?: number
    search?: string
  }): Promise<{ users: UserListItem[], total: number }> => {
    let query = supabase
      .from('User')
      .select('id, name, surname, email, role, status, avatarUrl, phone, createdAt', { count: 'exact' })
      .order('createdAt', { ascending: false })

    if (opts?.role && opts.role !== 'ALL') {
      query = query.eq('role', opts.role as 'STUDENT' | 'PARENT' | 'ADMIN')
    }

    if (opts?.search) {
      query = query.or(`name.ilike.%${opts.search}%,surname.ilike.%${opts.search}%,email.ilike.%${opts.search}%`)
    }

    const limit = opts?.limit ?? 50
    const offset = opts?.offset ?? 0
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error
    return {
      users: data as unknown as UserListItem[],
      total: count ?? 0
    }
  }

  const fetchUserById = async (userId: string): Promise<UserListItem | null> => {
    const { data, error } = await supabase
      .from('User')
      .select('id, name, surname, email, role, avatarUrl, phone, createdAt')
      .eq('id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data as unknown as UserListItem | null
  }

  /** Admin: update user fields */
  const updateUser = async (userId: string, data: Partial<{
    name: string
    surname: string
    email: string
    phone: string
    role: string
    status: 'ACTIVE' | 'INACTIVE' | 'BANNED'
  }>) => {
    const { error } = await supabase
      .from('User')
      .update({ ...data, updatedAt: new Date().toISOString() } as any)
      .eq('id', userId)
    if (error) throw error
  }

  /** Admin: update user status */
  const updateUserStatus = async (userId: string, status: 'ACTIVE' | 'INACTIVE' | 'BANNED') => {
    const { error } = await supabase
      .from('User')
      .update({ status, updatedAt: new Date().toISOString() })
      .eq('id', userId)
    if (error) throw error
  }

  return { fetchUsers, fetchUserById, updateUser, updateUserStatus }
}
