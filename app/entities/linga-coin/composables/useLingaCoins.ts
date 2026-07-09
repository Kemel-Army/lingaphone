import { useCurrentUser } from '~/entities/user'
import type { Database } from '~/shared/types/database.types'
import {
  coinMedal,
  type LingaCoinReason,
  type LingaCoinTransactionRow,
  type CoinWallet
} from '../model/types'

/** Linga Coins (ТЗ разд. 8). Баланс = сумма транзакций. RLS по ролям. */
export const useLingaCoins = () => {
  const supabase = useSupabaseClient<Database>()
  const { internalId } = useCurrentUser()

  const sumOf = (rows: LingaCoinTransactionRow[]) => rows.reduce((s, t) => s + t.delta, 0)

  /** Начислить монеты (учитель/админ). */
  const award = async (input: {
    studentId: string
    delta: number
    reason: LingaCoinReason
    note?: string | null
  }): Promise<void> => {
    const { error } = await supabase.from('LingaCoinTransaction').insert({
      studentId: input.studentId,
      delta: input.delta,
      reason: input.reason,
      note: input.note ?? null,
      awardedBy: internalId.value
    } as never)
    if (error) throw error
  }

  /** Кошелёк текущего ученика. */
  const fetchMyWallet = async (): Promise<CoinWallet> => {
    const { data, error } = await supabase
      .from('LingaCoinTransaction')
      .select('*')
      .order('createdAt', { ascending: false })
    if (error) throw error
    const transactions = (data ?? []) as LingaCoinTransactionRow[]
    const balance = sumOf(transactions)
    return { balance, transactions, medal: coinMedal(balance) }
  }

  /** Транзакции конкретного ученика (учитель/админ/родитель). */
  const fetchTransactions = async (studentId: string): Promise<LingaCoinTransactionRow[]> => {
    const { data, error } = await supabase
      .from('LingaCoinTransaction')
      .select('*')
      .eq('studentId', studentId)
      .order('createdAt', { ascending: false })
    if (error) throw error
    return (data ?? []) as LingaCoinTransactionRow[]
  }

  /** Балансы по списку учеников → Map(studentId → balance). */
  const fetchBalancesFor = async (studentIds: string[]): Promise<Map<string, number>> => {
    const map = new Map<string, number>()
    if (!studentIds.length) return map
    const { data, error } = await supabase
      .from('LingaCoinTransaction')
      .select('studentId, delta')
      .in('studentId', studentIds)
    if (error) throw error
    for (const row of (data ?? []) as { studentId: string, delta: number }[]) {
      map.set(row.studentId, (map.get(row.studentId) ?? 0) + row.delta)
    }
    return map
  }

  return { award, fetchMyWallet, fetchTransactions, fetchBalancesFor }
}
