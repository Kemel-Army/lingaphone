/**
 * useAvatarUpload — uploads avatar and saves URL to User table.
 */
export const useAvatarUpload = () => {
  const supabase = useTypedSupabaseClient()
  const toast = useAppToast()

  /** Save avatar URL to User table for the given authId */
  const saveAvatarUrl = async (authId: string, avatarUrl: string) => {
    const { error } = await supabase
      .from('User')
      .update({ avatarUrl })
      .eq('authId', authId)

    if (error) {
      toast.error('Ошибка', 'Не удалось сохранить аватар')
      throw error
    }

    toast.success('Фото профиля обновлено')
  }

  return { saveAvatarUrl }
}
