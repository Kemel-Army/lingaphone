/**
 * Lesson materials — teachers upload lecture files / presentations / documents
 * for a specific lesson; the group's students can download them.
 *
 * Files live in the existing private `documents` storage bucket under
 * `lesson-materials/<lessonId>/<timestamp>-<name>`. No extra table is needed —
 * the bucket listing is the source of truth. Downloads use short-lived signed
 * URLs because the bucket is private.
 */

const BUCKET = 'documents'
const folder = (lessonId: string) => `lesson-materials/${lessonId}`

export interface LessonMaterial {
  name: string
  path: string
  size: number
  mimeType: string
  createdAt: string
}

export const useLessonMaterials = () => {
  const supabase = useTypedSupabaseClient()
  const uploading = ref(false)

  const list = async (lessonId: string): Promise<LessonMaterial[]> => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(folder(lessonId), { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
    if (error) throw error
    return (data ?? [])
      .filter(f => f.id) // drop folder placeholders
      .map(f => ({
        name: f.name.replace(/^\d+-/, ''),
        path: `${folder(lessonId)}/${f.name}`,
        size: (f.metadata?.size as number) ?? 0,
        mimeType: (f.metadata?.mimetype as string) ?? '',
        createdAt: f.created_at ?? ''
      }))
  }

  const upload = async (lessonId: string, file: File): Promise<void> => {
    uploading.value = true
    try {
      const safe = file.name.replace(/[^\w.-]+/g, '_')
      const path = `${folder(lessonId)}/${Date.now()}-${safe}`
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type || undefined })
      if (error) throw error
    } finally {
      uploading.value = false
    }
  }

  const remove = async (path: string): Promise<void> => {
    const { error } = await supabase.storage.from(BUCKET).remove([path])
    if (error) throw error
  }

  const downloadUrl = async (path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
    if (error) return null
    return data?.signedUrl ?? null
  }

  return { list, upload, remove, downloadUrl, uploading }
}
