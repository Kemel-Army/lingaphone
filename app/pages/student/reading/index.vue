<script setup lang="ts">
import {
  ReadingCard,
  useReadingLibrary,
  useReadingProgress,
  READING_LEVEL_META,
  READING_GENRE_META
} from '~/entities/reading'
import type { ReadingLevel, ReadingGenre, ReadingTextWithProgress } from '~/entities/reading'

definePageMeta({ layout: 'dashboard' })

const { fetchTexts } = useReadingLibrary()
const { fetchMyProgress } = useReadingProgress()

const { data, pending } = useAsyncData('reading-index', async () => {
  const [texts, progress] = await Promise.all([fetchTexts(), fetchMyProgress()])
  return { texts, progress }
})

const LEVELS: ReadingLevel[] = ['A1', 'A2', 'B1', 'B2']
const GENRES: ReadingGenre[] = ['story', 'article', 'comic', 'dialogue']

const activeLevel = ref<ReadingLevel | 'all'>('all')
const activeGenre = ref<ReadingGenre | 'all'>('all')

const textsWithProgress = computed((): ReadingTextWithProgress[] => {
  const progressMap = new Map((data.value?.progress ?? []).map(p => [p.textId, p]))
  return (data.value?.texts ?? []).map(t => ({
    ...t,
    progress: progressMap.get(t.id) ?? null
  }))
})

const filtered = computed(() =>
  textsWithProgress.value.filter((t) => {
    if (activeLevel.value !== 'all' && t.level !== activeLevel.value) return false
    if (activeGenre.value !== 'all' && t.genre !== activeGenre.value) return false
    return true
  })
)

const totalCompleted = computed(() =>
  textsWithProgress.value.filter(t => !!t.progress?.completedAt).length
)

const totalTexts = computed(() => textsWithProgress.value.length)
</script>

<template>
  <div class="relative min-h-screen">
    <!-- Decorative blobs -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden"
    >
      <div class="absolute -top-32 left-1/4 size-96 -translate-x-1/2 rounded-full bg-sky-400/15 blur-3xl" />
      <div class="absolute top-24 right-12 size-72 rounded-full bg-indigo-400/10 blur-3xl" />
    </div>

    <div class="mx-auto max-w-5xl p-4 pb-16 sm:p-6 lg:p-8">
      <!-- Header -->
      <header class="mb-8 text-center">
        <p class="text-sm font-bold uppercase tracking-widest text-primary">
          📚 Reading Library
        </p>
        <h1 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Библиотека чтения
        </h1>
        <p class="mx-auto mt-2 max-w-md text-sm text-muted">
          Тексты A1–B2 с вопросами на понимание. Читай, отвечай, получай XP.
        </p>

        <!-- Overall progress pill -->
        <div
          v-if="!pending && totalTexts > 0"
          class="mt-5 inline-flex items-center gap-3 rounded-full border border-default bg-default px-5 py-2 shadow-sm"
        >
          <UIcon
            name="i-lucide-book-open"
            class="size-5 text-primary"
          />
          <div class="text-sm">
            <span class="font-bold">{{ totalCompleted }}</span>
            <span class="text-muted"> / {{ totalTexts }} текстов прочитано</span>
          </div>
          <div class="h-4 w-px bg-border" />
          <span class="text-sm font-black text-primary">
            {{ totalTexts ? Math.round(totalCompleted / totalTexts * 100) : 0 }}%
          </span>
        </div>
      </header>

      <!-- Filters -->
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <!-- Level filter -->
        <div class="flex items-center gap-1.5 rounded-xl border border-default bg-default p-1">
          <button
            class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
            :class="activeLevel === 'all' ? 'bg-primary text-white' : 'text-muted hover:text-default'"
            @click="activeLevel = 'all'"
          >
            Все
          </button>
          <button
            v-for="lvl in LEVELS"
            :key="lvl"
            class="rounded-lg px-3 py-1.5 text-xs font-black transition-all"
            :class="activeLevel === lvl
              ? [READING_LEVEL_META[lvl].bg, READING_LEVEL_META[lvl].color]
              : 'text-muted hover:text-default'"
            @click="activeLevel = lvl"
          >
            {{ lvl }}
          </button>
        </div>

        <!-- Genre filter -->
        <div class="flex items-center gap-1.5 rounded-xl border border-default bg-default p-1">
          <button
            class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
            :class="activeGenre === 'all' ? 'bg-primary text-white' : 'text-muted hover:text-default'"
            @click="activeGenre = 'all'"
          >
            Все жанры
          </button>
          <button
            v-for="g in GENRES"
            :key="g"
            class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
            :class="activeGenre === g ? 'bg-primary text-white' : 'text-muted hover:text-default'"
            @click="activeGenre = g"
          >
            <UIcon
              :name="READING_GENRE_META[g].icon"
              class="size-3.5"
            />
            {{ READING_GENRE_META[g].label }}
          </button>
        </div>

        <!-- Result count -->
        <p
          v-if="!pending"
          class="ml-auto text-sm text-muted"
        >
          {{ filtered.length }} {{ filtered.length === 1 ? 'текст' : 'текстов' }}
        </p>
      </div>

      <!-- Skeleton -->
      <div
        v-if="pending"
        class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      >
        <div
          v-for="i in 8"
          :key="i"
          class="skeleton h-44 rounded-2xl"
        />
      </div>

      <!-- Grid -->
      <div
        v-else-if="filtered.length"
        class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      >
        <ReadingCard
          v-for="text in filtered"
          :key="text.id"
          :text="text"
        />
      </div>

      <!-- Empty state -->
      <EmptyState
        v-else
        icon="i-lucide-book-open"
        title="Тексты не найдены"
        description="Попробуй изменить фильтры или загляни позже — контент пополняется"
      />
    </div>
  </div>
</template>
