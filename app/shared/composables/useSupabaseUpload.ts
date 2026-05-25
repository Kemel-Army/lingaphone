/**
 * File upload composable for Supabase Storage.
 * Named useSupabaseUpload to avoid conflict with @nuxt/ui's useFileUpload.
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  'avatars': ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  'homework-submissions': [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/webm', 'audio/wav'
  ],
  'lesson-recordings': ['video/mp4', 'video/webm', 'audio/webm'],
  'documents': [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
}

export const useSupabaseUpload = () => {
  const supabase = useTypedSupabaseClient()
  const uploading = ref(false)

  const validateFile = (bucket: string, file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `Файл слишком большой. Максимум: ${MAX_FILE_SIZE / 1024 / 1024} МБ`
    }

    const allowedTypes = ALLOWED_MIME_TYPES[bucket]
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return `Недопустимый тип файла: ${file.type}`
    }

    return null
  }

  const upload = async (
    bucket: string,
    path: string,
    file: File
  ): Promise<string | null> => {
    const validationError = validateFile(bucket, file)
    if (validationError) {
      console.error('Upload validation error:', validationError)
      return null
    }

    uploading.value = true
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true })

      if (error) throw error

      const { data: publicUrl } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      return publicUrl.publicUrl
    } catch (err) {
      console.error('Upload error:', err)
      return null
    } finally {
      uploading.value = false
    }
  }

  const remove = async (bucket: string, paths: string[]) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths)

    if (error) console.error('Remove error:', error)
  }

  return { upload, remove, uploading, validateFile }
}
