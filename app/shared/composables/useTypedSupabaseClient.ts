import type { Database } from '~/shared/types/database.types'

/**
 * Typed Supabase client composable.
 * Use this everywhere instead of raw useSupabaseClient().
 */
export const useTypedSupabaseClient = () => {
  return useSupabaseClient<Database>()
}
