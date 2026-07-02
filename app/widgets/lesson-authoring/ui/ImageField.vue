<script setup lang="ts">
/** Image value for a lesson (emoji OR uploaded URL). Upload → public URL. */
import { useLessonAuthoring } from '~/features/lesson-authoring'

const model = defineModel<string>({ default: '' })
const { uploadImage } = useLessonAuthoring()
const uploading = ref(false)
const isUrl = (s?: string) => !!s && /^(https?:|\/)/.test(s)

const onFile = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (!f) return
  uploading.value = true
  try {
    model.value = await uploadImage(f)
  } catch { /* ignore */ } finally {
    uploading.value = false
    input.value = ''
  }
}
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-default bg-elevated">
      <img
        v-if="isUrl(model)"
        :src="model"
        alt=""
        class="size-full object-cover"
      >
      <span
        v-else-if="model"
        class="text-2xl"
      >{{ model }}</span>
      <UIcon
        v-else
        name="i-lucide-image"
        class="size-4 text-muted"
      />
    </div>
    <UInput
      v-model="model"
      size="xs"
      class="flex-1"
      placeholder="эмодзи или URL"
    />
    <label class="cursor-pointer">
      <UButton
        size="xs"
        color="neutral"
        variant="soft"
        icon="i-lucide-upload"
        :loading="uploading"
        as="span"
      />
      <input
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFile"
      >
    </label>
  </div>
</template>
