<script setup lang="ts">
/**
 * ComicStrip — мини-комикс из 2-4 панелей подряд, без листания.
 *
 * Используется как chunk-type 'comic' в Explanation, и как visual.kind='comic'
 * в шагах Walkthrough. Каждая панель — большой эмодзи + 1 короткое
 * предложение, появляющееся stagger-анимацией.
 *
 * Отличие от StoryFrames: тут панели видны ВСЕ сразу (горизонтальная
 * лента), а не сменяются по таймеру. Это удобно для ОБЪЯСНЕНИЯ —
 * можно смотреть переход глазами.
 */

interface ComicPanel {
  emoji?: string
  icon?: string
  caption: string
  accent?: string
}

const props = defineProps<{
  panels: ComicPanel[]
  /** Заголовок над лентой */
  title?: string
}>()

const accentMap: Record<string, string> = {
  amber: 'from-amber-300/40 to-orange-300/30 text-amber-700 dark:text-amber-200',
  sky: 'from-sky-300/40 to-cyan-300/30 text-sky-700 dark:text-sky-200',
  emerald: 'from-emerald-300/40 to-teal-300/30 text-emerald-700 dark:text-emerald-200',
  violet: 'from-violet-300/40 to-purple-300/30 text-violet-700 dark:text-violet-200',
  rose: 'from-rose-300/40 to-pink-300/30 text-rose-700 dark:text-rose-200',
  yellow: 'from-yellow-300/40 to-amber-300/30 text-yellow-700 dark:text-yellow-200'
}

const accentClass = (panel: ComicPanel) => accentMap[panel.accent ?? 'amber'] ?? accentMap.amber

const seen = ref<Set<number>>(new Set())

onMounted(() => {
  // Stagger: каждая панель проявляется с задержкой 180ms
  props.panels.forEach((_, i) => {
    setTimeout(() => {
      seen.value = new Set([...seen.value, i])
    }, i * 180)
  })
})
</script>

<template>
  <div class="rounded-2xl border border-default bg-elevated p-4 sm:p-5">
    <div
      v-if="title"
      class="mb-3 text-xs font-bold uppercase tracking-wider text-muted text-center"
    >
      {{ title }}
    </div>
    <div class="grid gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 grid-cols-1">
      <template
        v-for="(p, i) in panels"
        :key="i"
      >
        <div
          class="comic-panel relative flex flex-col items-center gap-2 rounded-xl border border-default bg-linear-to-br p-4 text-center transition-all"
          :class="[accentClass(p), seen.has(i) ? 'comic-panel--in' : 'comic-panel--out']"
        >
          <!-- Номер панели -->
          <span class="absolute top-2 left-2 flex size-5 items-center justify-center rounded-full bg-white/70 dark:bg-white/15 text-[10px] font-black tabular-nums text-highlighted">
            {{ i + 1 }}
          </span>
          <!-- Иллюстрация -->
          <span
            v-if="p.emoji"
            class="text-4xl sm:text-5xl"
            aria-hidden="true"
          >{{ p.emoji }}</span>
          <UIcon
            v-else-if="p.icon"
            :name="p.icon"
            class="size-12"
          />
          <!-- Подпись -->
          <p class="text-sm font-bold leading-snug wrap-break-word">
            {{ p.caption }}
          </p>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.comic-panel {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.25, 0.8, 0.4, 1.1);
}
.comic-panel--out {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}
.comic-panel--in {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>
