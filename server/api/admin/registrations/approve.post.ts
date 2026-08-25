import { z } from 'zod'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/shared/types/database.types'

const bodySchema = z.object({ batchId: z.string().uuid() })

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })
  const role = (user as unknown as { user_role?: string }).user_role
  if (role !== 'ADMIN') throw createError({ statusCode: 403, message: 'Forbidden' })

  const { batchId } = await readValidatedBody(event, bodySchema.parse)
  const supabase = serverSupabaseServiceRole<Database>(event)

  const { data, error } = await supabase
    .from('User')
    .update({ status: 'ACTIVE' })
    .eq('registrationBatchId', batchId)
    .select('id')

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!data?.length) throw createError({ statusCode: 404, message: 'Заявка не найдена' })

  return { success: true, updated: data.length }
})
