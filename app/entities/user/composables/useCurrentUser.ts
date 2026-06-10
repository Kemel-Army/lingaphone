import type { CurrentUser, UserDisplayInfo } from '../model/types'
import { UserRole, ROLE_HOME_ROUTES } from '~/shared/types/common'

interface SupabaseUserWithClaims {
  user_id?: string
  user_role?: string
  user_name?: string
  user_surname?: string
  user_metadata?: {
    role?: string
    name?: string
    surname?: string
  }
}

/**
 * Provides the currently authenticated user from Supabase JWT claims.
 *
 * JWT custom claims: user_id, user_role, user_name, user_surname
 * Standard claim: sub = authId, email
 *
 * avatarUrl is loaded separately from the User table (not in JWT) and cached
 * via useAsyncData. Call refreshProfile() after avatar upload to refetch.
 */
export const useCurrentUser = () => {
  const user = useSupabaseUser()
  const supabase = useTypedSupabaseClient()

  const { data: profile, refresh: refreshProfile } = useAsyncData(
    'current-user-profile',
    async (): Promise<{ avatarUrl: string | null, phone: string | null, name: string | null, surname: string | null } | null> => {
      if (!user.value) return null
      const { data, error } = await supabase
        .from('User')
        .select('avatarUrl, phone, name, surname')
        .eq('authId', user.value.sub)
        .maybeSingle()
      if (error) return null
      return data ?? null
    },
    { watch: [user], default: () => null }
  )

  const avatarUrl = computed<string | null>(() => profile.value?.avatarUrl ?? null)
  const phone = computed<string | null>(() => profile.value?.phone ?? null)

  /** Internal DB User.id from JWT claim (added via custom_access_token_hook). */
  const internalId = computed<string | null>(() => {
    if (!user.value) return null
    const claims = user.value as unknown as SupabaseUserWithClaims
    return claims.user_id ?? null
  })

  /** The current user extracted from JWT. Null when not authenticated. */
  const currentUser = computed<CurrentUser | null>(() => {
    if (!user.value) return null
    const claims = user.value as unknown as SupabaseUserWithClaims
    const resolvedRole = (claims.user_role ?? UserRole.STUDENT) as UserRole
    return {
      id: user.value.sub,
      sub: user.value.sub,
      email: user.value.email ?? '',
      role: resolvedRole,
      name: profile.value?.name ?? claims.user_name ?? claims.user_metadata?.name ?? '',
      surname: profile.value?.surname ?? claims.user_surname ?? claims.user_metadata?.surname ?? ''
    }
  })

  const isAuthenticated = computed(() => !!user.value)

  const role = computed(() => currentUser.value?.role ?? null)

  const isStudent = computed(() => role.value === UserRole.STUDENT)
  const isParent = computed(() => role.value === UserRole.PARENT)
  const isTeacher = computed(() => role.value === UserRole.TEACHER)
  const isAdmin = computed(() => role.value === UserRole.ADMIN)

  const fullName = computed(() => {
    if (!currentUser.value) return ''
    return `${currentUser.value.name} ${currentUser.value.surname}`.trim()
  })

  const initials = computed(() => {
    if (!currentUser.value) return ''
    const first = currentUser.value.name?.charAt(0) ?? ''
    const last = currentUser.value.surname?.charAt(0) ?? ''
    return `${first}${last}`.toUpperCase()
  })

  const homeRoute = computed(() => {
    if (!role.value) return '/'
    return ROLE_HOME_ROUTES[role.value] ?? '/'
  })

  const displayInfo = computed<UserDisplayInfo | null>(() => {
    if (!currentUser.value) return null
    return {
      fullName: fullName.value,
      initials: initials.value,
      avatarUrl: avatarUrl.value,
      role: currentUser.value.role
    }
  })

  return {
    user,
    currentUser,
    internalId,
    isAuthenticated,
    role,
    isStudent,
    isParent,
    isTeacher,
    isAdmin,
    fullName,
    initials,
    homeRoute,
    displayInfo,
    avatarUrl,
    phone,
    refreshProfile
  }
}
