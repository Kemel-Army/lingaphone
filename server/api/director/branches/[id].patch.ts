import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/shared/types/database.types'

const bodySchema = z.object({
  name: z.string().min(1).max(120).trim().optional(),
  kind: z.enum(['OFFLINE', 'ONLINE']).optional(),
  address: z.string().max(200).trim().nullable().optional(),
  city: z.string().max(100).trim().nullable().optional()
})

export default defineEventHandler(async (event) => {
  await requireRole(event, ['DIRECTOR', 'ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'id required' })
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = serverSupabaseServiceRole<Database>(event)

  const { error } = await supabase.from('Branch').update(body as never).eq('id', id)
  if (error) throw createError({ statusCode: 500, message: error.message })
  return { success: true }
})
