<script setup lang="ts">
/**
 * TapReveal — карточка "нажми, чтобы узнать". Тизер видим всегда,
 * подробный ответ скрыт за тапом и плавно раскрывается.
 *
 * Поведение для 2 класса:
 *   - Большая иконка-вопрос для ясности.
 *   - SFX `pop` при раскрытии для дофамина.
 *   - После раскрытия в reveal-зоне опционально звучит TTS (если
 *     передан `speakOnReveal`).
 *
 * Использование:
 *   <TapReveal teaser="Почему так?" :speak-on-reveal="answer">
 *     <p>{{ answer }}</p>
 *   </TapReveal>
 */

const props = withDefaults(defineProps<{
  teaser: string
  hint?: string
  /** Если задан — будет произнесён при раскрытии */
  speakOnReveal?: string
  /** Цвет акцента карточки */
  accent?: 'amber' | 'emerald' | 'sky' | 'violet'
}>(), {
  accent: 'amber'
})

const emit = defineEmits<{
  reveal: []
}>()

const opened = ref(false)
const { play } = useSound()
const { speak } = useTTS()

const accentClasses = computed(() => ({
  amber: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5 hover:bg-amber-500/10',
    chip: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
    icon: 'text-amber-500'
  },
  emerald: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5 hover:bg-emerald-500/10',
    chip: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
    icon: 'text-emerald-500'
  },
  sky: {
    border: 'border-sky-500/30',
    bg: 'bg-sky-500/5 hover:bg-sky-500/10',
    chip: 'bg-sky-500/15 text-sky-600 dark:text-sky-300',
    icon: 'text-sky-500'
  },
  violet: {
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/5 hover:bg-violet-500/10',
    chip: 'bg-violet-500/15 text-violet-600 dark:text-violet-300',
    icon: 'text-violet-500'
  }
}[props.accent]))

const open = () => {
  if (opened.value) return
  opened.value = true
  play('pop')
  if (props.speakOnReveal) speak(props.speakOnReveal)
  emit('reveal')
}
</script>

<template>
  <div
    class="rounded-2xl border-2 transition-colors"
    :class="[accentClasses.border, accentClasses.bg]"
  >
    <button
      type="button"
      class="flex w-full items-center gap-3 px-4 py-3 text-left"
      @click="open"
    >
      <span
        class="flex size-9 shrink-0 items-center justify-center rounded-full transition-transform"
        :class="[accentClasses.chip, opened ? 'rotate-180' : '']"
      >
        <UIcon
          :name="opened ? 'i-lucide-chevron-up' : 'i-lucide-help-circle'"
          class="size-5"
          :class="accentClasses.icon"
        />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-sm font-bold text-highlighted wrap-break-word">{{ teaser }}</span>
        <span
          v-if="hint && !opened"
          class="mt-0.5 block text-[11px] text-muted"
        >
          {{ hint }}
        </span>
      </span>
      <span
        v-if="!opened"
        class="text-[10px] font-bold uppercase tracking-wider text-muted"
        aria-hidden="true"
      >
        Нажми
      </span>
    </button>

    <transition name="reveal">
      <div
        v-if="opened"
        class="px-4 pb-4 pt-1 text-sm text-highlighted"
      >
        <slot />
      </div>
    </transition>
  </div>
</template>

<style scoped>
.reveal-enter-active,
.reveal-leave-active {
  transition: opacity 0.3s ease, max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease;
  overflow: hidden;
}
.reveal-enter-from,
.reveal-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-6px);
}
.reveal-enter-to,
.reveal-leave-from {
  opacity: 1;
  max-height: 600px;
  transform: translateY(0);
}
</style>
