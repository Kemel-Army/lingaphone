import type { AppNotification } from '../model/types'
import type { TablesUpdate } from '~/shared/types/database.types'

/**
 * Entity composable for notifications.
 */
export const useNotifications = () => {
  const supabase = useTypedSupabaseClient()

  const fetchNotifications = async (userId: string, limit = 20): Promise<AppNotification[]> => {
    const { data, error } = await supabase
      .from('Notification')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data as unknown as AppNotification[]
  }

  const unreadCount = async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('Notification')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId)
      .eq('isRead', false)
    if (error) throw error
    return count ?? 0
  }

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('Notification')
      .update({ isRead: true } as TablesUpdate<'Notification'>)
      .eq('id', id)
    if (error) throw error
  }

  const markAllAsRead = async (userId: string) => {
    const { error } = await supabase
      .from('Notification')
      .update({ isRead: true } as TablesUpdate<'Notification'>)
      .eq('userId', userId)
      .eq('isRead', false)
    if (error) throw error
  }

  return { fetchNotifications, unreadCount, markAsRead, markAllAsRead }
}
