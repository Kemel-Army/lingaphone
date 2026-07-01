<script setup lang="ts">
/**
 * StoryFrames — мини-комикс из 3-5 кадров для Hook-слоя.
 *
 * Каждый кадр — большой эмодзи + 1 короткое предложение. Кадры листаются:
 * автоматически по таймеру или по тапу. Анимация переноса — slide+fade.
 *
 * Это замена обычной "стены текста" в начале капсулы — для второклассника
 * сюжет с эмодзи понятнее и запоминается лучше.
 */
import type { HookFrame } from '~/entities/learning-path'

const props = withDefaults(defineProps<{
  frames: HookFrame[]
  /** Авто-прокрутка кадров. По умолчанию true. */
  autoplay?: boolean
  /** Длительность одного кадра до авто-перехода (ms). */
  intervalMs?: number
  /** Цветовой фон-паттерн */
  bgPattern?: 'stars' | 'dots' | 'waves' | 'confetti' | 'none'
}>(), {
  autoplay: true,
  intervalMs: 2800,
  bgPattern: 'stars'
})

const emit = defineEmits<{
  done: []
}>()

const idx = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const accentMap: Record<string, string> = {
  amber: 'from-amber-300/30 to-orange-300/20',
  sky: 'from-sky-300/30 to-cyan-300/20',
  emerald: 'from-emerald-300/30 to-teal-300/20',
  violet: 'from-violet-300/30 to-purple-300/20',
  rose: 'from-rose-300/30 to-pink-300/20',
  cyan: 'from-cyan-300/30 to-blue-300/20',
  yellow: 'from-yellow-300/30 to-amber-300/20'
}

const accentClass = (frame: HookFrame) => accentMap[frame.accent ?? 'amber'] ?? accentMap.amber

const goNext = () => {
  if (idx.value < props.frames.length - 1) {
    idx.value++
  } else {
    emit('done')
  }
}

const goTo = (i: number) => {
  idx.value = i
  // Перезапускаем таймер от текущей позиции
  if (timer) clearInterval(timer)
  if (props.autoplay) startTimer()
}

const startTimer = () => {
  timer = setInterval(() => {
    if (idx.value < props.frames.length - 1) {
      idx.value++
    } else {
      if (timer) clearInterval(timer)
    }
  }, props.intervalMs)
}

onMounted(() => {
  if (props.autoplay && props.frames.length > 1) startTimer()
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const currentFrame = computed(() => props.frames[idx.value] ?? null)
</script>

<template>
  <div
    class="relative w-full overflow-hidden rounded-3xl border border-default p-6 sm:p-8 min-h-56 bg-linear-to-br"
    :class="currentFrame ? accentClass(currentFrame) : ''"
  >
    <!-- Декоративный фон-паттерн -->
    <div
      v-if="bgPattern === 'stars'"
      class="pointer-events-none absolute inset-0 opacity-40"
      aria-hidden="true"
    >
      <span
        v-for="n in 8"
        :key="`s-${n}`"
        class="absolute text-xs"
        :style="{
          left: `${(n * 13) % 95}%`,
          top: `${(n * 23) % 80}%`,
          animation: `story-twinkle ${2 + (n % 3)}s ease-in-out infinite`,
          animationDelay: `${n * 0.18}s`
        }"
      >
        ✨
      </span>
    </div>
    <div
      v-else-if="bgPattern === 'dots'"
      class="pointer-events-none absolute inset-0 opacity-20"
      aria-hidden="true"
      style="background-image: radial-gradient(currentColor 1px, transparent 1px); background-size: 18px 18px;"
    />
    <div
      v-else-if="bgPattern === 'confetti'"
      class="pointer-events-none absolute inset-0 opacity-50"
      aria-hidden="true"
    >
      <span
        v-for="n in 10"
        :key="`c-${n}`"
        class="absolute text-base"
        :style="{
          left: `${(n * 11) % 95}%`,
          top: `${(n * 17) % 70}%`,
          animation: `story-twinkle ${1.6 + (n % 4) * 0.4}s ease-in-out infinite`,
          animationDelay: `${n * 0.12}s`
        }"
      >
        {{ ['🎉', '⭐', '🌟', '💫'][n % 4] }}
      </span>
    </div>

    <!-- Кадр -->
    <transition
      name="story-frame"
      mode="out-in"
    >
      <div
        v-if="currentFrame"
        :key="idx"
        class="relative flex flex-col items-center gap-4 text-center"
      >
        <div
          v-if="currentFrame.emoji"
          class="text-6xl sm:text-7xl"
          aria-hidden="true"
        >
          {{ currentFrame.emoji }}
        </div>
        <UIcon
          v-else-if="currentFrame.icon"
          :name="currentFrame.icon"
          class="size-16 sm:size-20 text-primary"
        />

        <p class="line-clamp-4 max-w-prose text-lg sm:text-xl font-bold text-highlighted leading-snug wrap-break-word">
          {{ currentFrame.caption }}
        </p>
        <p
          v-if="currentFrame.subCaption"
          class="line-clamp-2 text-sm text-muted wrap-break-word"
        >
          {{ currentFrame.subCaption }}
        </p>
      </div>
    </transition>

    <!-- Прогресс-точки -->
    <div class="relative mt-6 flex items-center justify-center gap-2">
      <button
        v-for="(_, i) in frames"
        :key="i"
        type="button"
        class="size-2.5 rounded-full transition-all hover:scale-125"
        :class="i === idx ? 'bg-primary w-6' : 'bg-muted'"
        :aria-label="`Кадр ${i + 1}`"
        @click="goTo(i)"
      />
    </div>

    <!-- Tap-to-advance overlay (на мобиле работает удобно) -->
    <button
      v-if="idx < frames.length - 1"
      type="button"
      class="absolute inset-0 z-0 cursor-pointer"
      aria-label="Следующий кадр"
      @click="goNext"
    />
  </div>
</template>

<style scoped>
.story-frame-enter-active,
.story-frame-leave-active {
  transition: opacity 0.35s cubic-bezier(0.25, 0.8, 0.4, 1), transform 0.35s cubic-bezier(0.25, 0.8, 0.4, 1);
}
.story-frame-enter-from {
  opacity: 0;
  transform: translateX(20px) scale(0.96);
}
.story-frame-leave-to {
  opacity: 0;
  transform: translateX(-16px) scale(0.96);
}

@keyframes story-twinkle {
  0%, 100% {
    opacity: 0.4;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}
</style>
