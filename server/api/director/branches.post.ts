import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/shared/types/database.types'

const bodySchema = z.object({
  name: z.string().min(1).max(120).trim(),
  kind: z.enum(['OFFLINE', 'ONLINE']).default('OFFLINE'),
  address: z.string().max(200).trim().optional(),
  city: z.string().max(100).trim().optional()
})

export default defineEventHandler(async (event) => {
  await requireRole(event, ['DIRECTOR', 'ADMIN'])
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = serverSupabaseServiceRole<Database>(event)

  const { data, error } = await supabase
    .from('Branch')
    .insert({ name: body.name, kind: body.kind, address: body.address || null, city: body.city || null } as never)
    .select('id')
    .single()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return { id: (data as { id: string }).id }
})
