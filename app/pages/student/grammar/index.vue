<script setup lang="ts">
import {
  useGrammarTopics,
  useGrammarProgress,
  GrammarTopicCard,
  LEVEL_META
} from '~/entities/grammar'
import type { GrammarLevel, GrammarTopicWithProgress } from '~/entities/grammar'

definePageMeta({ layout: 'dashboard' })

const { fetchTopics } = useGrammarTopics()
const { fetchMyProgress } = useGrammarProgress()

const { data, pending } = useAsyncData('grammar-index', async () => {
  const [topics, progress] = await Promise.all([fetchTopics(), fetchMyProgress()])
  return { topics, progress }
})

const LEVELS: GrammarLevel[] = ['A1', 'A2', 'B1', 'B2']

const topicsByLevel = computed(() => {
  const progressMap = new Map((data.value?.progress ?? []).map(p => [p.topicId, p]))
  const result: Record<GrammarLevel, GrammarTopicWithProgress[]> = { A1: [], A2: [], B1: [], B2: [] }
  for (const topic of data.value?.topics ?? []) {
    result[topic.level as GrammarLevel].push({
      ...topic,
      progress: progressMap.get(topic.id) ?? null
    })
  }
  return result
})

const levelStats = computed(() => {
  const stats: Record<GrammarLevel, { total: number, mastered: number, inProgress: number }> = {
    A1: { total: 0, mastered: 0, inProgress: 0 },
    A2: { total: 0, mastered: 0, inProgress: 0 },
    B1: { total: 0, mastered: 0, inProgress: 0 },
    B2: { total: 0, mastered: 0, inProgress: 0 }
  }
  for (const level of LEVELS) {
    for (const t of topicsByLevel.value[level]) {
      stats[level].total++
      const m = t.progress?.mastery ?? 0
      if (m >= 0.7) stats[level].mastered++
      else if (m > 0) stats[level].inProgress++
    }
  }
  return stats
})

const totalTopics = computed(() => data.value?.topics.length ?? 0)
const totalMastered = computed(() =>
  LEVELS.reduce((sum, l) => sum + levelStats.value[l].mastered, 0)
)
const overallPercent = computed(() =>
  totalTopics.value ? Math.round((totalMastered.value / totalTopics.value) * 100) : 0
)
</script>

<template>
  <div class="relative min-h-screen">
    <!-- Decorative blobs -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden"
    >
      <div class="absolute -top-32 left-1/4 size-96 -translate-x-1/2 rounded-full bg-violet-400/15 blur-3xl" />
      <div class="absolute top-20 right-8 size-72 rounded-full bg-sky-400/10 blur-3xl" />
    </div>

    <div class="mx-auto max-w-4xl p-4 pb-16 sm:p-6 lg:p-8">
      <!-- Header -->
      <header class="mb-8 text-center">
        <p class="text-sm font-bold uppercase tracking-widest text-primary">
          📚 Grammar Platform
        </p>
        <h1 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Грамматика английского
        </h1>
        <p class="mx-auto mt-2 max-w-md text-sm text-muted">
          40 тем от A1 до B2. Теория + упражнения + мгновенная обратная связь.
        </p>

        <!-- Overall progress pill -->
        <div
          v-if="!pending"
          class="mt-5 inline-flex items-center gap-3 rounded-full border border-default bg-default px-5 py-2 shadow-sm"
        >
          <UIcon
            name="i-lucide-graduation-cap"
            class="size-5 text-primary"
          />
          <div class="text-sm">
            <span class="font-bold">{{ totalMastered }}</span>
            <span class="text-muted"> / {{ totalTopics }} тем освоено</span>
          </div>
          <div class="h-4 w-px bg-border" />
          <span class="text-sm font-black text-primary">{{ overallPercent }}%</span>
        </div>
      </header>

      <!-- Skeleton -->
      <div
        v-if="pending"
        class="space-y-10"
      >
        <div
          v-for="i in 4"
          :key="i"
          class="space-y-3"
        >
          <div class="skeleton h-8 w-48 rounded-lg" />
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            <div
              v-for="j in 4"
              :key="j"
              class="skeleton h-28 rounded-2xl"
            />
          </div>
        </div>
      </div>

      <!-- Level sections -->
      <div
        v-else
        class="space-y-10"
      >
        <section
          v-for="level in LEVELS"
          :key="level"
        >
          <div class="mb-4 flex items-center justify-between gap-4">
            <!-- Level badge + title -->
            <div class="flex items-center gap-3">
              <span
                class="inline-flex items-center rounded-xl px-3 py-1 text-sm font-black"
                :class="[LEVEL_META[level].bg, LEVEL_META[level].color]"
              >
                {{ level }}
              </span>
              <div>
                <h2 class="text-base font-black">
                  {{ LEVEL_META[level].label }}
                </h2>
                <p class="hidden text-xs text-muted sm:block">
                  {{ LEVEL_META[level].description }}
                </p>
              </div>
            </div>

            <!-- Level progress -->
            <div class="flex shrink-0 items-center gap-2 text-sm">
              <div class="hidden w-28 sm:block">
                <div class="h-1.5 w-full overflow-hidden rounded-full bg-elevated">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="['bg-linear-to-r', LEVEL_META[level].gradient]"
                    :style="{
                      width: levelStats[level].total
                        ? `${Math.round(levelStats[level].mastered / levelStats[level].total * 100)}%`
                        : '0%'
                    }"
                  />
                </div>
              </div>
              <span class="font-semibold text-muted">
                {{ levelStats[level].mastered }}/{{ levelStats[level].total }}
              </span>
            </div>
          </div>

          <!-- Topic grid -->
          <div
            v-if="topicsByLevel[level].length"
            class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
          >
            <GrammarTopicCard
              v-for="topic in topicsByLevel[level]"
              :key="topic.id"
              :topic="topic"
            />
          </div>
          <p
            v-else
            class="text-sm text-muted"
          >
            Темы для этого уровня скоро появятся.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>
