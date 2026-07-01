<script setup lang="ts">
import type { CapsuleLayer, LayerStatus, ScenarioTheme, LayerType } from '~/entities/learning-path'
import { LAYER_META } from '~/entities/learning-path'
import { useMascotReactions } from '~/shared/composables/useMascotReactions'

const props = defineProps<{
  capsuleName: string
  capsuleSubtitle?: string | null
  difficulty: string
  totalXp: number
  durationMinutes: number
  layers: CapsuleLayer[]
  layerStatus: Record<string, LayerStatus>
  currentIndex: number
  masteryPercent: number
  topicId: string
  /** Темa оформления капсулы (S10). Берётся из SCENARIO-слоя; задаёт фон-частицы. */
  topicTheme?: ScenarioTheme | null
  /** Тип текущего слоя — чтобы не дублировать ThemeBackground поверх SCENARIO. */
  currentLayerType?: LayerType | null
}>()

const runtimeConfig = useRuntimeConfig()
const isDemoFreeSwitch = computed(() => runtimeConfig.public.capsuleDemoFreeSwitch !== 'false')

// S10 — Ambient atmospherics: рендерим тематический фон во всех слоях
// (кроме SCENARIO — у него собственный фон внутри сцены).
const showAmbient = computed(() =>
  !!props.topicTheme && props.currentLayerType !== 'SCENARIO'
)

// S10 — edge-glow реагирует на «эмоциональные» вспышки Феми.
// celebrate/trophy/proud/dance — зелёное/янтарное свечение,
// warn/confused — мягкое розовое.
const { flashState } = useMascotReactions()
const glowClass = computed(() => {
  switch (flashState.value) {
    case 'trophy':
    case 'proud':
    case 'dance':
      return 'runner-glow-trophy'
    case 'celebrate':
      return 'runner-glow-success'
    case 'warn':
    case 'confused':
      return 'runner-glow-warn'
    default:
      return ''
  }
})

const emit = defineEmits<{
  select: [index: number]
}>()

const statusMeta = (status: LayerStatus) => {
  switch (status) {
    case 'COMPLETED': return { dot: 'bg-emerald-500', ring: 'ring-emerald-500/30', icon: 'i-lucide-check' }
    case 'IN_PROGRESS': return { dot: 'bg-primary', ring: 'ring-primary/30', icon: 'i-lucide-play' }
    case 'AVAILABLE': return { dot: 'bg-primary/50', ring: 'ring-primary/15', icon: '' }
    case 'FAILED': return { dot: 'bg-rose-500', ring: 'ring-rose-500/30', icon: 'i-lucide-refresh-cw' }
    case 'LOCKED':
    default: return { dot: 'bg-elevated', ring: 'ring-default', icon: 'i-lucide-lock' }
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- ═══════════════════════════════════════════════════════════════
         TOP STRIP — back link + title + progress
         ═══════════════════════════════════════════════════════════════ -->
    <NuxtLink
      :to="`/student/my-path/${topicId}`"
      class="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-primary transition-colors"
    >
      <UIcon
        name="i-lucide-chevron-left"
        class="size-4"
      />
      К разделу
    </NuxtLink>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary">
          <span>Капсула</span>
          <span class="text-muted">·</span>
          <span class="text-muted">{{ difficulty }}</span>
        </div>
        <h1 class="mt-1 text-2xl sm:text-3xl font-black text-highlighted capsule-clamp-2">
          {{ capsuleName }}
        </h1>
        <p
          v-if="capsuleSubtitle"
          class="mt-1 text-sm text-muted capsule-clamp-2"
        >
          {{ capsuleSubtitle }}
        </p>
      </div>

      <!-- Meta chips -->
      <div class="flex flex-wrap items-center gap-2 shrink-0 sm:gap-3">
        <div class="flex items-center gap-1.5 rounded-full bg-elevated border border-default px-3 py-1.5 text-xs font-semibold whitespace-nowrap">
          <UIcon
            name="i-lucide-clock"
            class="size-3.5 text-muted"
          />
          {{ durationMinutes }} мин
        </div>
        <div class="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-300 whitespace-nowrap">
          <UIcon
            name="i-lucide-star"
            class="size-3.5"
          />
          {{ totalXp }} XP
        </div>
        <div class="hidden sm:flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-bold text-primary whitespace-nowrap">
          <UIcon
            name="i-lucide-trending-up"
            class="size-3.5"
          />
          {{ masteryPercent }}%
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════
         MAIN GRID — sidebar stepper + content
         ═══════════════════════════════════════════════════════════════ -->
    <div class="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      <!-- ────── Sidebar stepper ────── -->
      <aside class="space-y-2">
        <div class="flex items-center justify-between px-1 pb-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted">
            {{ layers.length }} слоёв
          </span>
          <span class="text-[10px] font-bold uppercase tracking-wider text-primary">
            {{ masteryPercent }}%
          </span>
        </div>

        <ul class="space-y-1.5">
          <li
            v-for="(layer, idx) in layers"
            :key="layer.id"
          >
            <button
              type="button"
              :disabled="layerStatus[layer.id] === 'LOCKED' && !isDemoFreeSwitch"
              class="group flex w-full items-center gap-3 rounded-xl border border-default bg-elevated px-3 py-2.5 text-left transition-all hover:border-primary/40 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-default disabled:hover:shadow-none"
              :class="currentIndex === idx ? 'border-primary bg-primary/5 shadow-sm' : ''"
              @click="emit('select', idx)"
            >
              <!-- Status dot/number -->
              <div
                class="relative flex size-8 shrink-0 items-center justify-center rounded-full ring-2 font-bold text-xs tabular-nums transition-colors"
                :class="[statusMeta(layerStatus[layer.id] ?? 'LOCKED').dot, statusMeta(layerStatus[layer.id] ?? 'LOCKED').ring, statusMeta(layerStatus[layer.id] ?? 'LOCKED').dot === 'bg-elevated' ? 'text-muted' : 'text-white']"
              >
                <UIcon
                  v-if="statusMeta(layerStatus[layer.id] ?? 'LOCKED').icon"
                  :name="statusMeta(layerStatus[layer.id] ?? 'LOCKED').icon"
                  class="size-4"
                />
                <span v-else>{{ idx + 1 }}</span>
              </div>

              <!-- Title + time -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 min-w-0">
                  <UIcon
                    :name="layer.icon"
                    class="size-3.5 shrink-0 text-muted"
                  />
                  <span
                    class="min-w-0 truncate text-sm font-semibold"
                    :class="currentIndex === idx ? 'text-primary' : 'text-highlighted'"
                  >
                    {{ layer.title }}
                  </span>
                </div>
                <div class="mt-0.5 text-[11px] text-muted truncate">
                  ≈ {{ layer.estimatedMinutes }} мин · {{ LAYER_META[layer.layerType]?.shortLabel }}
                </div>
              </div>
            </button>
          </li>
        </ul>
      </aside>

      <!-- ────── Active layer content (rendered via slot by parent) ────── -->
      <section
        data-capsule
        class="runner-section relative min-w-0 min-h-100 overflow-hidden rounded-3xl border border-default bg-elevated p-5 sm:p-6 transition-shadow duration-300"
        :class="glowClass"
      >
        <ThemeBackground
          v-if="showAmbient && topicTheme"
          :theme="topicTheme"
          class="opacity-60!"
        />
        <div class="relative z-10">
          <slot />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* S10 — edge-glow на «эмоциональные» вспышки Феми. Лёгкий пульс-кольцо
   вокруг капсулы, поверх существующих границ. Затухает за 0.7s после
   снятия класса (transition-shadow на самом section). */
.runner-glow-success {
  box-shadow: 0 0 0 3px rgb(16 185 129 / 0.35), 0 0 28px 4px rgb(16 185 129 / 0.25);
}
.runner-glow-trophy {
  box-shadow: 0 0 0 3px rgb(245 158 11 / 0.45), 0 0 32px 6px rgb(245 158 11 / 0.30);
}
.runner-glow-warn {
  box-shadow: 0 0 0 3px rgb(244 114 182 / 0.30), 0 0 22px 3px rgb(244 114 182 / 0.20);
}

@media (prefers-reduced-motion: reduce) {
  .runner-section {
    transition: none !important;
  }
}
</style>
