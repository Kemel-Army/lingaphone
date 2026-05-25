import type { NotificationType } from '~/shared/types/common'

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string | null
  payload: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}
