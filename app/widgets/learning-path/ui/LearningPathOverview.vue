<script setup lang="ts">
import type { PathTopic } from '~/entities/learning-path'
import { PathTopicCard, useLearningPath } from '~/entities/learning-path'

const props = defineProps<{
  topics: PathTopic[]
  grade?: number | null
  studentName?: string | null
}>()

const { computeOverallStats } = useLearningPath()

const stats = computed(() => computeOverallStats(props.topics))

// Contextual speech-bubble for Феми — adapts to progress.
const mascotLine = computed(() => {
  const p = stats.value.overallProgress
  const name = props.studentName ?? 'друг'
  if (p === 0) return `Привет, ${name}! Готов начать математику? Давай!`
  if (p < 30) return `Отличный старт, ${name}! Продолжаем двигаться.`
  if (p < 70) return `Молодец, ${name}! Ты прошёл уже половину!`
  if (p < 100) return `Ещё чуть-чуть, ${name} — финиш близко!`
  return `Ого, ${name}! Ты молодец — 100%!`
})

const mascotState = computed(() => {
  const p = stats.value.overallProgress
  if (p === 0) return 'greet'
  if (p < 70) return 'think'
  if (p < 100) return 'teach'
  return 'celebrate'
})

const gradeTitle = computed(() => (props.grade != null ? `${props.grade} класс` : 'Математика'))
</script>

<template>
  <div class="space-y-6">
    <!-- ═══════════════════════════════════════════════════════════════
         HERO — FEMO educational hub card
         ═══════════════════════════════════════════════════════════════ -->
    <div class="relative overflow-hidden rounded-3xl bg-linear-to-br from-red-500 via-rose-500 to-orange-500 p-6 sm:p-8">
      <!-- Decorative blobs -->
      <div class="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-white/10 blur-2xl" />
      <div class="pointer-events-none absolute top-1/2 -right-6 size-32 rounded-full bg-yellow-300/20 blur-xl" />
      <div class="pointer-events-none absolute -bottom-12 left-1/3 size-40 rounded-full bg-white/5 blur-3xl" />

      <div class="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        <!-- Mascot -->
        <div class="shrink-0">
          <FemiMascot
            :state="mascotState"
            size="xl"
            :line="mascotLine"
          />
        </div>

        <!-- Title + subject pill -->
        <div class="flex-1 text-white">
          <div class="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
            <UIcon
              name="i-lucide-calculator"
              class="size-3.5"
            />
            {{ gradeTitle }}
          </div>
          <h1 class="text-3xl sm:text-4xl font-black drop-shadow-sm">
            Математика
          </h1>
          <p class="mt-2 max-w-lg text-sm sm:text-base text-white/85">
            Твой образовательный центр. Здесь живут все темы по математике, твой прогресс и награды.
          </p>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════
           STATS STRIP — embedded inside hero
           ═══════════════════════════════════════════════════════════════ -->
      <div class="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-2xl bg-white/15 backdrop-blur px-4 py-3 ring-1 ring-white/20">
          <div class="flex items-center justify-between text-white/80 text-[10px] font-semibold uppercase tracking-wider">
            <span>Прогресс</span>
            <UIcon
              name="i-lucide-trending-up"
              class="size-3.5"
            />
          </div>
          <div class="mt-1 text-2xl font-black text-white tabular-nums">
            {{ stats.overallProgress }}<span class="text-base">%</span>
          </div>
        </div>

        <div class="rounded-2xl bg-white/15 backdrop-blur px-4 py-3 ring-1 ring-white/20">
          <div class="flex items-center justify-between text-white/80 text-[10px] font-semibold uppercase tracking-wider">
            <span>Уроков</span>
            <UIcon
              name="i-lucide-book-open"
              class="size-3.5"
            />
          </div>
          <div class="mt-1 text-2xl font-black text-white tabular-nums">
            {{ stats.completedLessons }}<span class="text-base text-white/60">/{{ stats.totalLessons }}</span>
          </div>
        </div>

        <div class="rounded-2xl bg-white/15 backdrop-blur px-4 py-3 ring-1 ring-white/20">
          <div class="flex items-center justify-between text-white/80 text-[10px] font-semibold uppercase tracking-wider">
            <span>XP</span>
            <UIcon
              name="i-lucide-star"
              class="size-3.5"
            />
          </div>
          <div class="mt-1 text-2xl font-black text-white tabular-nums">
            {{ stats.totalXp }}
          </div>
        </div>

        <div class="rounded-2xl bg-white/15 backdrop-blur px-4 py-3 ring-1 ring-white/20">
          <div class="flex items-center justify-between text-white/80 text-[10px] font-semibold uppercase tracking-wider">
            <span>Тем</span>
            <UIcon
              name="i-lucide-layers"
              class="size-3.5"
            />
          </div>
          <div class="mt-1 text-2xl font-black text-white tabular-nums">
            {{ topics.length }}
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════
         TOPICS LIST
         ═══════════════════════════════════════════════════════════════ -->
    <div
      v-if="topics.length"
      class="space-y-3"
    >
      <PathTopicCard
        v-for="(topic, idx) in topics"
        :key="topic.id"
        :topic="topic"
        :index="idx + 1"
      />
    </div>

    <EmptyState
      v-else
      icon="i-lucide-route"
      title="Темы скоро появятся"
      description="Твой учитель ещё настраивает программу. Загляни чуть позже!"
    />
  </div>
</template>
