import type { Database } from '~/shared/types/database.types'
import type {
  PaymentWithStudent,
  SubscriptionWithStudent,
  PaymentInsert,
  SubscriptionInsert,
  SubscriptionUpdate,
  StudentLite
} from '../model/types'

const PAYMENT_SELECT = `
  *,
  student:Student!Payment_studentId_fkey(id, user:User(name, surname))
` as const

const SUBSCRIPTION_SELECT = `
  *,
  student:Student!Subscription_studentId_fkey(id, user:User(name, surname))
` as const

/**
 * Финансы (ТЗ разд. 2.6): абонементы + платежи. RLS — ADMIN.
 */
export const useFinance = () => {
  const supabase = useSupabaseClient<Database>()

  const fetchPayments = async (): Promise<PaymentWithStudent[]> => {
    const { data, error } = await supabase
      .from('Payment')
      .select(PAYMENT_SELECT)
      .order('paidAt', { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as PaymentWithStudent[]
  }

  const fetchSubscriptions = async (): Promise<SubscriptionWithStudent[]> => {
    const { data, error } = await supabase
      .from('Subscription')
      .select(SUBSCRIPTION_SELECT)
      .order('createdAt', { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as SubscriptionWithStudent[]
  }

  const createPayment = async (payload: PaymentInsert): Promise<void> => {
    const { error } = await supabase.from('Payment').insert(payload)
    if (error) throw error
  }

  const deletePayment = async (id: string): Promise<void> => {
    const { error } = await supabase.from('Payment').delete().eq('id', id)
    if (error) throw error
  }

  const createSubscription = async (payload: SubscriptionInsert): Promise<void> => {
    const { error } = await supabase.from('Subscription').insert(payload)
    if (error) throw error
  }

  const updateSubscription = async (id: string, patch: SubscriptionUpdate): Promise<void> => {
    const { error } = await supabase.from('Subscription').update(patch).eq('id', id)
    if (error) throw error
  }

  const deleteSubscription = async (id: string): Promise<void> => {
    const { error } = await supabase.from('Subscription').delete().eq('id', id)
    if (error) throw error
  }

  /** Ученики для селектов в формах платежа/абонемента. */
  const fetchStudentsLite = async (): Promise<StudentLite[]> => {
    const { data, error } = await supabase
      .from('Student')
      .select('id, user:User(name, surname)')
    if (error) throw error
    type Row = { id: string, user: { name: string, surname: string } | null }
    return ((data ?? []) as unknown as Row[])
      .map(s => ({ id: s.id, name: s.user?.name ?? '', surname: s.user?.surname ?? '' }))
      .sort((a, b) => a.surname.localeCompare(b.surname, 'ru'))
  }

  return {
    fetchPayments,
    fetchSubscriptions,
    createPayment,
    deletePayment,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    fetchStudentsLite
  }
}
