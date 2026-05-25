import { UserRole, ROLE_HOME_ROUTES } from '~/shared/types/common'

/**
 * Global middleware — two responsibilities:
 *
 * 1. **Hard-block anonymous access** to any role-scoped path. The Supabase
 *    module's `redirectOptions.include` is the first line of defense but
 *    we don't trust it alone; pattern matching has burned us before.
 * 2. **Cross-role redirect** — an authenticated user trying to peek into
 *    another role's pages gets bounced to their own dashboard.
 */
const PROTECTED_PREFIXES = ['/student', '/parent', '/teacher', '/admin', '/lesson', '/messenger']

const isProtected = (path: string) =>
  PROTECTED_PREFIXES.some(p => path === p || path.startsWith(`${p}/`))

const ROLE_TO_PREFIX: Record<UserRole, string> = {
  [UserRole.STUDENT]: '/student',
  [UserRole.PARENT]: '/parent',
  [UserRole.TUTOR]: '/teacher',
  [UserRole.ADMIN]: '/admin'
}

export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const path = to.path

  // 1. Anonymous user trying to access a protected path → /login
  if (!user.value && isProtected(path)) {
    return navigateTo({
      path: '/login',
      query: { redirect: path }
    })
  }

  if (!user.value) return

  // 2. Authenticated — extract role from JWT claims (with metadata fallback)
  const role = ((user.value as unknown as { user_role?: string }).user_role
    ?? (user.value as { user_metadata?: { role?: string } }).user_metadata?.role) as UserRole | undefined
  if (!role) return

  // 3. Cross-role: if authenticated as STUDENT and trying to open /admin, send home.
  for (const [r, prefix] of Object.entries(ROLE_TO_PREFIX) as [UserRole, string][]) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      if (r !== role) return navigateTo(ROLE_HOME_ROUTES[role])
    }
  }

  // 4. Authenticated user hitting /login or /register → bounce to own home.
  if (path === '/login' || path === '/register') {
    return navigateTo(ROLE_HOME_ROUTES[role])
  }
})
