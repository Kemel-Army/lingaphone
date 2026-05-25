<script setup lang="ts">
/**
 * FileUpload — drag-and-drop or click file uploader with Supabase Storage.
 * Supports multiple files, file type/size validation, progress indicator.
 */

interface Props {
  /** Supabase Storage bucket name */
  bucket: string
  /** Folder path within the bucket */
  folder?: string
  /** Accepted file types (e.g. 'image/*,.pdf') */
  accept?: string
  /** Max file size in MB */
  maxSizeMb?: number
  /** Allow multiple files */
  multiple?: boolean
  /** Label text */
  label?: string
  /** Existing file URLs (for display) */
  modelValue?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  folder: '',
  accept: '*',
  maxSizeMb: 10,
  multiple: false,
  label: 'Загрузите файл',
  modelValue: () => []
})

const emit = defineEmits<{
  'update:modelValue': [urls: string[]]
  'upload-complete': [urls: string[]]
  'error': [message: string]
}>()

const supabase = useSupabaseClient()
const uploading = ref(false)
const dragOver = ref(false)
const uploadedUrls = ref<string[]>([...props.modelValue])
const fileInput = ref<HTMLInputElement | null>(null)

const maxSizeBytes = computed(() => props.maxSizeMb * 1024 * 1024)

function openFilePicker() {
  fileInput.value?.click()
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  dragOver.value = true
}

function onDragLeave() {
  dragOver.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragOver.value = false
  const files = Array.from(e.dataTransfer?.files ?? [])
  handleFiles(files)
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files ?? [])
  handleFiles(files)
  // Reset input so same file can be re-selected
  if (fileInput.value) fileInput.value.value = ''
}

async function handleFiles(files: File[]) {
  if (!files.length) return

  // Validate
  for (const file of files) {
    if (file.size > maxSizeBytes.value) {
      emit('error', `Файл "${file.name}" превышает ${props.maxSizeMb} МБ`)
      return
    }
  }

  uploading.value = true
  const newUrls: string[] = []

  try {
    for (const file of files) {
      const ext = file.name.split('.').pop() ?? ''
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const filePath = props.folder
        ? `${props.folder}/${timestamp}_${randomStr}.${ext}`
        : `${timestamp}_${randomStr}.${ext}`

      const { error } = await supabase.storage
        .from(props.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        emit('error', `Ошибка загрузки "${file.name}": ${error.message}`)
        continue
      }

      const { data: urlData } = supabase.storage
        .from(props.bucket)
        .getPublicUrl(filePath)

      newUrls.push(urlData.publicUrl)
    }

    if (props.multiple) {
      uploadedUrls.value = [...uploadedUrls.value, ...newUrls]
    } else {
      uploadedUrls.value = newUrls.slice(0, 1)
    }

    emit('update:modelValue', uploadedUrls.value)
    emit('upload-complete', newUrls)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ошибка загрузки'
    emit('error', message)
  } finally {
    uploading.value = false
  }
}

async function removeFile(url: string) {
  // Extract path from public URL
  const bucketUrl = `/storage/v1/object/public/${props.bucket}/`
  const idx = url.indexOf(bucketUrl)
  if (idx !== -1) {
    const filePath = url.substring(idx + bucketUrl.length)
    await supabase.storage.from(props.bucket).remove([filePath])
  }

  uploadedUrls.value = uploadedUrls.value.filter(u => u !== url)
  emit('update:modelValue', uploadedUrls.value)
}

function getFileName(url: string): string {
  try {
    const parts = url.split('/')
    return decodeURIComponent(parts[parts.length - 1] ?? 'file')
  } catch {
    return 'file'
  }
}
</script>

<template>
  <div class="space-y-3">
    <!-- Drop zone -->
    <div
      :class="[
        'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer',
        dragOver ? 'border-primary bg-primary/5' : 'border-default hover:border-primary/50',
        uploading ? 'opacity-50 pointer-events-none' : ''
      ]"
      @click="openFilePicker"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <UIcon
        :name="uploading ? 'i-lucide-loader-2' : 'i-lucide-upload-cloud'"
        :class="['size-8 text-dimmed', uploading ? 'animate-spin' : '']"
      />
      <div class="text-center">
        <p class="text-sm font-medium">
          {{ label }}
        </p>
        <p class="text-xs text-muted mt-1">
          Перетащите или нажмите для выбора
          <span v-if="maxSizeMb">(макс. {{ maxSizeMb }} МБ)</span>
        </p>
      </div>
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        :multiple="multiple"
        class="hidden"
        @change="onFileChange"
      >
    </div>

    <!-- Uploaded files list -->
    <ul
      v-if="uploadedUrls.length"
      class="space-y-2"
    >
      <li
        v-for="url in uploadedUrls"
        :key="url"
        class="flex items-center justify-between rounded-md bg-elevated px-3 py-2"
      >
        <div class="flex items-center gap-2 min-w-0">
          <UIcon
            name="i-lucide-file"
            class="size-4 text-muted shrink-0"
          />
          <a
            :href="url"
            target="_blank"
            class="text-sm truncate text-primary hover:underline"
          >
            {{ getFileName(url) }}
          </a>
        </div>
        <UButton
          icon="i-lucide-x"
          size="xs"
          color="neutral"
          variant="ghost"
          @click.stop="removeFile(url)"
        />
      </li>
    </ul>
  </div>
</template>
