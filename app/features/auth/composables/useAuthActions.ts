import type { LoginFormData, RegisterFormData } from '~/shared/lib/validators'
import type { UserRole } from '~/shared/types/common'
import { ROLE_HOME_ROUTES } from '~/shared/types/common'

/**
 * Auth actions — login, register, logout.
 * Uses Supabase Auth.
 */
export const useAuthActions = () => {
  const supabase = useTypedSupabaseClient()
  const toast = useAppToast()
  const router = useRouter()

  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
     * Log in with email and password.
     */
  const login = async (data: LoginFormData) => {
    loading.value = true
    error.value = null
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })
      if (authError) throw authError

      // Refresh session so JWT hook populates custom claims (user_role)
      const { data: refreshData } = await supabase.auth.refreshSession()
      toast.success('Успешный вход', 'Добро пожаловать!')

      const refreshedUser = refreshData.session?.user ?? authData.user
      const jwtRole = (refreshedUser as unknown as Record<string, unknown>)?.user_role as UserRole | undefined
      const metaRole = refreshedUser?.user_metadata?.role as UserRole | undefined
      const role = jwtRole ?? metaRole
      // Honor ?redirect=/some/path from role-guard, but only same-origin paths.
      const rawRedirect = router.currentRoute.value.query.redirect as string | undefined
      const safeRedirect = rawRedirect?.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : undefined
      const homeRoute = safeRedirect ?? (role ? ROLE_HOME_ROUTES[role] : '/student')
      await navigateTo(homeRoute)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Ошибка входа'
      toast.error('Ошибка', error.value!)
    } finally {
      loading.value = false
    }
  }

  /**
     * Register a new user. Creates Supabase auth + inserts User row via server route.
     */
  const register = async (data: RegisterFormData) => {
    loading.value = true
    error.value = null
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            surname: data.surname,
            role: data.role
          }
        }
      })
      if (authError) throw authError

      // 2. Create User record in database via server route
      if (authData.user) {
        await $fetch('/api/auth/register', {
          method: 'POST',
          body: {
            authId: authData.user.id,
            email: data.email,
            name: data.name,
            surname: data.surname,
            role: data.role,
            phone: data.phone || null,
            grade: data.grade || null
          }
        })
      }

      // 3. If session exists (email confirmation disabled), auto-login
      if (authData.session) {
        // Refresh session so JWT hook populates custom claims (user_role)
        await supabase.auth.refreshSession()
        toast.success('Регистрация успешна', 'Добро пожаловать!')
        const role = data.role as UserRole
        // Respect ?next= query param (e.g. from /checkout redirect). Strip to path only for security.
        const rawNext = router.currentRoute.value.query.next as string | undefined
        const safeNext = rawNext?.startsWith('/') && !rawNext.startsWith('//') ? rawNext : undefined
        // Students go to diagnostics first to create their Student Model
        const homeRoute = safeNext ?? (role === 'STUDENT' ? '/student/diagnostics' : (ROLE_HOME_ROUTES[role] ?? '/student'))
        await navigateTo(homeRoute)
      } else {
        // Email confirmation required — redirect to login
        toast.success('Регистрация успешна', 'Проверьте почту для подтверждения')
        await router.push('/login')
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Ошибка регистрации'
      toast.error('Ошибка', error.value!)
    } finally {
      loading.value = false
    }
  }

  /**
     * Log out the current user.
     */
  const logout = async () => {
    loading.value = true
    try {
      await supabase.auth.signOut()
      toast.success('До свидания!')
      await router.push('/')
    } catch (e: unknown) {
      toast.error('Ошибка', e instanceof Error ? e.message : 'Ошибка выхода')
    } finally {
      loading.value = false
    }
  }

  /**
     * Send password reset email.
     */
  const resetPassword = async (email: string) => {
    loading.value = true
    error.value = null
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/confirm`
      })
      if (authError) throw authError
      toast.success('Письмо отправлено', 'Проверьте почту для сброса пароля')
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Ошибка отправки'
      toast.error('Ошибка', error.value!)
    } finally {
      loading.value = false
    }
  }

  return {
    login,
    register,
    logout,
    resetPassword,
    loading,
    error
  }
}
