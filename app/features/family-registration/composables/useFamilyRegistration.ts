import type { ChildFormData, FamilyRegistrationResult, ParentFormData } from '../model/types'

/**
 * Multi-step family self-registration: one flow creates a PENDING parent
 * account (+ optional second parent) and N PENDING child accounts, all
 * grouped by `batchId` for admin approval. See
 * server/api/auth/register-family.post.ts.
 */
export const useFamilyRegistration = () => {
  const toast = useAppToast()
  const loading = ref(false)
  const error = ref<string | null>(null)
  const result = ref<FamilyRegistrationResult | null>(null)

  const submit = async (payload: {
    parent1: ParentFormData
    parent2: ParentFormData | null
    children: ChildFormData[]
  }) => {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<FamilyRegistrationResult>('/api/auth/register-family', {
        method: 'POST',
        body: {
          parent1: payload.parent1,
          parent2: payload.parent2,
          children: payload.children.map(c => ({
            name: c.name,
            surname: c.surname,
            patronymic: c.patronymic || null,
            age: c.age ?? null,
            schoolGrade: c.schoolGrade ?? null,
            schoolName: c.schoolName || null
          }))
        }
      })
      result.value = data
      return data
    } catch (e: unknown) {
      const message = (e as { data?: { message?: string } })?.data?.message
        ?? (e instanceof Error ? e.message : 'Ошибка отправки заявки')
      error.value = message
      toast.error('Ошибка', message)
      return null
    } finally {
      loading.value = false
    }
  }

  return { submit, loading, error, result }
}
