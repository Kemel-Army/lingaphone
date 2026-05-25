<script setup lang="ts">
const props = withDefaults(defineProps<{
  disabled?: boolean
}>(), {
  disabled: false
})

const emit = defineEmits<{
  input: [text: string]
}>()

const input = ref('')
const _isExpanded = ref(false)

const handleSubmit = () => {
  if (!input.value.trim() || props.disabled) return
  emit('input', input.value.trim())
  input.value = ''
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}
</script>

<template>
  <div class="flex items-end gap-2 border-t border-default bg-default p-4">
    <UButton
      icon="i-lucide-paperclip"
      variant="ghost"
      color="neutral"
      size="sm"
      :disabled="disabled"
    />

    <UTextarea
      v-model="input"
      placeholder="Задайте вопрос AI-тренеру..."
      :rows="1"
      autoresize
      :disabled="disabled"
      class="flex-1"
      @keydown="handleKeydown"
    />

    <SpeechInputButton
      v-model="input"
      :disabled="disabled"
    />

    <UButton
      icon="i-lucide-send"
      :disabled="!input.trim() || disabled"
      @click="handleSubmit"
    />
  </div>
</template>
