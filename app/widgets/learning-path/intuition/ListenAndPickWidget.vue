<script setup lang="ts">
/**
 * ListenAndPickWidget — послушай (TTS) и выбери правильный вариант.
 * Большая кнопка-динамик проигрывает фразу, ниже — варианты ответа.
 */
import type { IntuitionWidget } from '~/entities/learning-path'

const props = defineProps<{
  config: Extract<IntuitionWidget, { type: 'listen-and-pick' }>
}>()

const { speak } = useTTS()
const { play } = useSound()

const options = computed(() => props.config.options ?? [])
const picked = ref<number | null>(null)
const revealed = ref(false)

const listen = () => {
  speak(props.config.say, { lang: 'en-US' })
}

// Auto-play once on mount so the child hears the target.
onMounted(() => {
  setTimeout(listen, 400)
})

const pick = (i: number) => {
  if (revealed.value) return
  picked.value = i
  revealed.value = true
  play(i === props.config.correctIndex ? 'correct' : 'wrong')
}

const optClass = (i: number) => {
  if (!revealed.value) return 'border-default bg-elevated hover:border-primary/40'
  if (i === props.config.correctIndex) return 'border-emerald-500 bg-emerald-500/10'
  if (i === picked.value) return 'border-rose-500 bg-rose-500/10'
  return 'border-default opacity-60'
}
</script>

<template>
  <div class="rounded-2xl border border-default bg-linear-to-br from-cyan-500/5 to-sky-500/5 p-5">
    <div class="mb-4 flex flex-col items-center gap-3">
      <div class="text-xs font-semibold uppercase tracking-wider text-muted">
        Послушай и выбери
      </div>
      <button
        type="button"
        class="lap-pulse flex size-20 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:scale-105 active:scale-95"
        @click="listen"
      >
        <UIcon
          name="i-lucide-volume-2"
          class="size-9"
        />
      </button>
      <span class="text-[11px] text-muted">нажми, чтобы услышать ещё раз</span>
    </div>

    <div class="grid gap-2 sm:grid-cols-2">
      <button
        v-for="(opt, i) in options"
        :key="i"
        type="button"
        :disabled="revealed"
        class="rounded-xl border-2 px-4 py-3 text-center text-sm font-bold transition-all disabled:cursor-not-allowed"
        :class="optClass(i)"
        @click="pick(i)"
      >
        {{ opt }}
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes lap-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgb(22 163 74 / 0.35); }
  50% { box-shadow: 0 0 0 12px rgb(22 163 74 / 0); }
}
.lap-pulse { animation: lap-pulse 2s ease-in-out infinite; }
</style>
