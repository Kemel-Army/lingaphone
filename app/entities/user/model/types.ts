import type { UserRole } from '~/shared/types/common'

/**
 * User types used across the application.
 */
export interface UserProfile {
  id: string
  authId: string
  email: string
  name: string
  surname: string
  role: UserRole
  phone: string | null
  avatarUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Minimal user info returned from JWT claims.
 */
export interface CurrentUser {
  id: string // authId (sub)
  internalId?: string | null // internal DB User.id (from user_id JWT claim)
  email: string
  role: UserRole
  name: string
  surname: string
  phone?: string | null
  avatarUrl?: string | null
}

/**
 * User display helper type.
 */
export interface UserDisplayInfo {
  fullName: string
  initials: string
  avatarUrl: string | null
  role: UserRole
}
