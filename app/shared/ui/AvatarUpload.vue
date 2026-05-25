<script setup lang="ts">
/**
 * AvatarUpload — clickable avatar with camera overlay for photo upload.
 * Uploads to Supabase Storage 'avatars' bucket.
 */
interface Props {
  /** Current avatar URL */
  src?: string | null
  /** User name for initials fallback */
  name?: string
  /** User surname for initials fallback */
  surname?: string
  /** Avatar display size */
  size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}

const props = withDefaults(defineProps<Props>(), {
  src: null,
  name: '',
  surname: '',
  size: '3xl'
})

const emit = defineEmits<{
  'update:src': [url: string]
  'error': [message: string]
}>()

const { upload, uploading } = useSupabaseUpload()
const fileInput = ref<HTMLInputElement | null>(null)

const initials = computed(() => {
  const first = props.name?.charAt(0) ?? ''
  const last = props.surname?.charAt(0) ?? ''
  return `${first}${last}`.toUpperCase()
})

const sizeClasses: Record<string, string> = {
  'md': 'size-10',
  'lg': 'size-12',
  'xl': 'size-16',
  '2xl': 'size-20',
  '3xl': 'size-24'
}

const initialsTextSize: Record<string, string> = {
  'md': 'text-sm',
  'lg': 'text-base',
  'xl': 'text-lg',
  '2xl': 'text-xl',
  '3xl': 'text-2xl'
}

function openPicker() {
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Reset input so same file can be re-selected
  if (fileInput.value) fileInput.value.value = ''

  const user = useSupabaseUser()
  const userId = user.value?.sub ?? 'unknown'
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const url = await upload('avatars', path, file)
  if (url) {
    emit('update:src', url)
  } else {
    emit('error', 'Не удалось загрузить фото')
  }
}
</script>

<template>
  <div
    class="relative inline-block cursor-pointer group"
    @click="openPicker"
  >
    <!-- Avatar image or initials -->
    <div :class="['rounded-full overflow-hidden', sizeClasses[size]]">
      <img
        v-if="src"
        :src="src"
        :alt="initials"
        :class="['object-cover w-full h-full']"
      >
      <div
        v-else
        :class="[
          'flex items-center justify-center w-full h-full rounded-full bg-primary/10 font-semibold text-primary',
          initialsTextSize[size]
        ]"
      >
        {{ initials }}
      </div>
    </div>

    <!-- Camera overlay -->
    <div
      :class="[
        'absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity',
        uploading ? 'opacity-100' : 'group-hover:opacity-100'
      ]"
    >
      <UIcon
        :name="uploading ? 'i-lucide-loader-2' : 'i-lucide-camera'"
        :class="['text-white', uploading ? 'animate-spin' : '', size === 'md' || size === 'lg' ? 'size-4' : 'size-6']"
      />
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="hidden"
      @change="onFileChange"
    >
  </div>
</template>
