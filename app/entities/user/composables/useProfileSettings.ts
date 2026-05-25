/**
 * useProfileSettings — user-facing profile mutations for /student/settings.
 *
 * Splits cleanly:
 *  - updateProfile()       → User table (name, surname, phone)
 *  - updatePassword()      → verify current password via re-auth, then update
 *  - saveAvatarUrl()       → User table (re-export from useAvatarUpload)
 *
 * Email change is intentionally not exposed — verification emails aren't wired up.
 * All errors are toasted; the caller still gets a boolean for UI state.
 */
export const useProfileSettings = () => {
  const supabase = useTypedSupabaseClient()
  const toast = useAppToast()
  const user = useSupabaseUser()

  const saving = ref(false)

  const updateProfile = async (data: {
    name: string
    surname: string
    phone: string | null
  }): Promise<boolean> => {
    if (!user.value) return false
    saving.value = true
    try {
      const { error } = await supabase
        .from('User')
        .update({
          name: data.name.trim(),
          surname: data.surname.trim(),
          phone: data.phone?.trim() || null,
          updatedAt: new Date().toISOString()
        })
        .eq('authId', user.value.sub)

      if (error) {
        toast.error('Не удалось сохранить', error.message)
        return false
      }
      toast.success('Профиль обновлён', 'Имя обновится после перезахода')
      return true
    } finally {
      saving.value = false
    }
  }

  /**
   * Change password with current-password verification.
   * Supabase has no native "verify current password" API, so we re-authenticate
   * via signInWithPassword. The session is replaced but the user stays logged in.
   */
  const updatePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    if (!user.value?.email) {
      toast.error('Не удалось сменить пароль', 'Сессия не активна')
      return false
    }
    saving.value = true
    try {
      // Step 1: verify current password by attempting sign-in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.value.email,
        password: currentPassword
      })
      if (verifyError) {
        toast.error('Неверный текущий пароль', 'Проверь и попробуй ещё раз')
        return false
      }

      // Step 2: update to new password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) {
        toast.error('Не удалось сменить пароль', updateError.message)
        return false
      }
      toast.success('Пароль обновлён')
      return true
    } finally {
      saving.value = false
    }
  }

  return { saving, updateProfile, updatePassword }
}
