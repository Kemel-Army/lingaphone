<script setup lang="ts">
/**
 * SpeechInputButton — кнопка голосового ввода.
 * Монтирует useSpeechToText и добавляет результат в v-model.
 * Использование:
 *   <SpeechInputButton v-model="text" />
 */

const props = withDefaults(defineProps<{
  modelValue: string
  lang?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  disabled?: boolean
}>(), {
  lang: 'ru-RU',
  size: 'sm',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { isListening, isSupported, transcript, interimTranscript, error, toggle } = useSpeechToText({
  lang: props.lang,
  mode: 'append'
})

// Когда пришёл финальный транскрипт — добавляем к modelValue
watch(transcript, (val) => {
  if (!val) return
  const current = props.modelValue
  emit('update:modelValue', current ? current + ' ' + val : val)
  // Сбрасываем внутренний transcript чтобы не дублировать
  transcript.value = ''
})

const toast = useAppToast()
watch(error, (val) => {
  if (val) toast.error('Голосовой ввод', val)
})

const handleClick = () => {
  if (!isSupported.value) {
    toast.error('Голосовой ввод', 'Ваш браузер не поддерживает распознавание речи')
    return
  }
  toggle()
}
</script>

<template>
  <div class="relative inline-flex items-center">
    <!-- Пульсирующий круг во время записи -->
    <span
      v-if="isListening"
      class="absolute inset-0 rounded-full bg-red-500/20 animate-ping"
    />

    <UButton
      :icon="isListening ? 'i-lucide-mic-off' : 'i-lucide-mic'"
      :size="size"
      :variant="isListening ? 'soft' : 'ghost'"
      :color="isListening ? 'error' : 'neutral'"
      :disabled="disabled"
      :class="isListening ? 'text-red-500' : ''"
      :aria-label="isListening ? 'Остановить запись' : 'Говорить'"
      @click="handleClick"
    />

    <!-- Промежуточный текст (во время речи) -->
    <Transition name="fade">
      <div
        v-if="isListening && interimTranscript"
        class="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-gray-100 dark:text-gray-900"
      >
        <span class="italic text-gray-400 dark:text-gray-500">{{ interimTranscript }}</span>
        <span class="ml-1 inline-block size-1.5 rounded-full bg-red-500 animate-pulse" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
