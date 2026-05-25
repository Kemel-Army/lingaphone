<script setup lang="ts">
/**
 * MicButton — большая центральная кнопка-микрофон для голосового ввода.
 *
 * Используется в TeachBackLayer как PRIMARY input для второклассника:
 * у детей 7-8 лет печать медленная, голос — естественнее.
 *
 * UX:
 *   - В простое: круг, иконка mic, подсказка «нажми и говори»
 *   - При записи: пульсирующее кольцо + бегущие "звуковые волны"
 *   - При ошибке (no permission и др.): красный с иконкой ошибки
 *
 * События:
 *   - 'start' / 'stop'      — пользовательские триггеры
 *   - 'transcript'          — финальная фраза
 *   - 'interim'             — промежуточный (realtime) текст
 */

const props = withDefaults(defineProps<{
  /** Язык распознавания. По умолчанию 'ru-RU'. */
  lang?: string
  /** Размер: 'md' (default) | 'lg' */
  size?: 'md' | 'lg'
  /** Заблокирована ли кнопка */
  disabled?: boolean
  /** Полная подсказка под кнопкой */
  hint?: string
  /** Текст-стартер (например, начало фразы). Не отправляется в распознавание. */
  prompt?: string
}>(), {
  lang: 'ru-RU',
  size: 'md'
})

const emit = defineEmits<{
  start: []
  stop: []
  transcript: [text: string]
  interim: [text: string]
}>()

const {
  isListening, isSupported, transcript, interimTranscript, error,
  start, stop
} = useSpeechToText({ lang: props.lang, mode: 'append', continuous: true })

// Стрим: транслируем в parent
watch(transcript, (val) => {
  if (val) emit('transcript', val)
})
watch(interimTranscript, (val) => {
  emit('interim', val)
})

const handleClick = () => {
  if (props.disabled || !isSupported.value) return
  if (isListening.value) {
    stop()
    emit('stop')
  } else {
    start()
    emit('start')
  }
}

const sizeClasses = computed(() => props.size === 'lg'
  ? { btn: 'size-24 sm:size-28', icon: 'size-10 sm:size-12' }
  : { btn: 'size-20 sm:size-24', icon: 'size-8 sm:size-10' })
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <p
      v-if="prompt && !isListening"
      class="text-sm font-bold text-highlighted text-center wrap-break-word max-w-md"
    >
      {{ prompt }}
    </p>

    <!-- Mic кнопка -->
    <div class="relative">
      <!-- Pulsing rings во время записи -->
      <template v-if="isListening">
        <span
          v-for="n in 3"
          :key="`ring-${n}`"
          class="mic-ring absolute inset-0 rounded-full border-2 border-rose-400"
          :style="{ animationDelay: `${n * 0.4}s` }"
        />
      </template>

      <button
        type="button"
        :disabled="disabled || !isSupported"
        class="mic-btn relative flex shrink-0 items-center justify-center rounded-full transition-all duration-200 disabled:cursor-not-allowed"
        :class="[
          sizeClasses.btn,
          !isSupported ? 'bg-muted text-muted-foreground'
          : isListening ? 'bg-rose-500 text-white scale-110 shadow-lg shadow-rose-500/40'
            : error ? 'bg-rose-200 text-rose-700'
              : 'bg-primary text-white hover:scale-105 hover:shadow-lg'
        ]"
        :aria-pressed="isListening"
        :aria-label="isListening ? 'Остановить запись' : 'Начать запись'"
        @click="handleClick"
      >
        <UIcon
          v-if="!isSupported"
          name="i-lucide-mic-off"
          :class="sizeClasses.icon"
        />
        <UIcon
          v-else
          :name="isListening ? 'i-lucide-mic' : 'i-lucide-mic'"
          :class="[sizeClasses.icon, isListening ? 'animate-bounce-mic' : '']"
        />
      </button>
    </div>

    <!-- Hint / status -->
    <p
      v-if="!isSupported"
      class="text-xs text-muted text-center max-w-xs"
    >
      Голосовой ввод недоступен в этом браузере. Пиши текстом ниже.
    </p>
    <p
      v-else-if="error"
      class="text-xs text-rose-600 dark:text-rose-300 text-center max-w-xs wrap-break-word"
    >
      {{ error }}
    </p>
    <p
      v-else-if="isListening"
      class="text-xs font-bold text-rose-600 dark:text-rose-300 flex items-center gap-1"
    >
      <span class="size-2 rounded-full bg-rose-500 animate-pulse" />
      Слушаю…
    </p>
    <p
      v-else
      class="text-xs text-muted text-center wrap-break-word max-w-xs"
    >
      {{ hint ?? 'Нажми и расскажи своими словами' }}
    </p>

    <!-- Realtime interim transcript -->
    <p
      v-if="isListening && interimTranscript"
      class="text-sm italic text-muted text-center max-w-md wrap-break-word"
    >
      «{{ interimTranscript }}…»
    </p>
  </div>
</template>

<style scoped>
@keyframes mic-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
.animate-bounce-mic {
  animation: mic-bounce 0.9s ease-in-out infinite;
}

@keyframes mic-ring-anim {
  0% {
    transform: scale(1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}
.mic-ring {
  animation: mic-ring-anim 1.6s ease-out infinite;
  pointer-events: none;
}
</style>
