interface RegistrationPerson {
  userId: string
  name: string
  surname: string
  patronymic: string | null
  email: string
  phone: string | null
  password: string | null
}

interface RegistrationChild extends RegistrationPerson {
  studentId?: string
  schoolGrade: number | null
  schoolName: string | null
  age: number | null
}

export interface RegistrationBatch {
  batchId: string
  createdAt: string
  status: 'PENDING' | 'REJECTED'
  parents: RegistrationPerson[]
  children: RegistrationChild[]
}

/**
 * Admin management of family self-registration batches created via
 * /api/auth/register-family. Approve activates every account in the batch;
 * reject marks them REJECTED (they stay blocked at /pending-approval).
 */
export const useRegistrationRequests = () => {
  const toast = useAppToast()
  const batches = ref<RegistrationBatch[]>([])
  const loading = ref(false)
  const actingBatchId = ref<string | null>(null)

  const fetchBatches = async () => {
    loading.value = true
    try {
      const data = await $fetch<{ batches: RegistrationBatch[] }>('/api/admin/registrations')
      batches.value = data.batches
    } catch (e: unknown) {
      toast.error('Ошибка', e instanceof Error ? e.message : 'Не удалось загрузить заявки')
    } finally {
      loading.value = false
    }
  }

  const approve = async (batchId: string) => {
    actingBatchId.value = batchId
    try {
      await $fetch('/api/admin/registrations/approve', { method: 'POST', body: { batchId } })
      toast.success('Одобрено', 'Семья получила доступ к платформе')
      batches.value = batches.value.filter(b => b.batchId !== batchId)
    } catch (e: unknown) {
      toast.error('Ошибка', (e as { data?: { message?: string } })?.data?.message ?? 'Не удалось одобрить заявку')
    } finally {
      actingBatchId.value = null
    }
  }

  const reject = async (batchId: string) => {
    actingBatchId.value = batchId
    try {
      await $fetch('/api/admin/registrations/reject', { method: 'POST', body: { batchId } })
      toast.success('Отклонено', 'Заявка отклонена')
      batches.value = batches.value.filter(b => b.batchId !== batchId)
    } catch (e: unknown) {
      toast.error('Ошибка', (e as { data?: { message?: string } })?.data?.message ?? 'Не удалось отклонить заявку')
    } finally {
      actingBatchId.value = null
    }
  }

  return { batches, loading, actingBatchId, fetchBatches, approve, reject }
}
