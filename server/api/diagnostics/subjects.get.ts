export default defineEventHandler(async (event) => {
  const supabase = useServerSupabase(event)

  const { data, error } = await supabase
    .from('Subject')
    .select('id, name, nameKz, grade, icon')
    .eq('isActive', true)
    .order('grade')

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { subjects: data ?? [] }
})
