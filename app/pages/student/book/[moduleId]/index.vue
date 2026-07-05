<script setup lang="ts">
import { useMyPath } from '~/entities/book'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const moduleId = computed(() => route.params.moduleId as string)

const { fetchMyPath } = useMyPath()
const { data: path, pending } = await useAsyncData('my-path', fetchMyPath)

const block = computed(() => path.value?.blocks.find(b => b.id === moduleId.value) ?? null)
const locked = computed(() => !block.value || block.value.status === 'LOCKED')

// Lessons first, then the block test — the natural block flow.
const steps = computed(() => {
  const b = block.value
  if (!b) return []
  const lessons = b.lessons.map(l => ({
    id: l.id, title: l.title, kind: 'LESSON' as const,
    done: l.completed, meta: `${l.doneCount}/${l.exerciseCount} заданий`
  }))
  const test = b.test
    ? [{
        id: b.test.unitId, title: b.test.title, kind: 'TEST' as const,
        done: b.test.passed,
        meta: b.test.attempts > 0 ? `Лучший: ${b.test.bestScore}% · порог ${b.test.passThreshold}%` : `Порог ${b.test.passThreshold}%`
      }]
    : []
  return [...lessons, ...test]
})
</script>

<template>
  <div class="p-3 sm:p-6 lg:p-8 space-y-7 w-full max-w-3xl mx-auto">
    <!-- hero -->
    <header class="card-rise relative flex items-center gap-4 overflow-hidden rounded-3xl bg-primary-50 px-5 py-6 ring-1 ring-primary-100 dark:bg-primary-950/40 dark:ring-primary-900/50 sm:px-7">
      <UButton
        to="/student/book"
        icon="i-lucide-arrow-left"
        color="primary"
        variant="soft"
        size="sm"
        class="relative shrink-0"
      />
      <div class="relative min-w-0">
        <p class="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary-600/80 dark:text-primary-300/80">
          <UIcon
            name="i-lucide-book-marked"
            class="size-3.5"
          />Блок {{ block?.order ?? '' }}
        </p>
        <h1 class="mt-1 font-display text-2xl font-black tracking-tight text-primary-900 dark:text-primary-50 sm:text-3xl">
          {{ block?.title ?? 'Блок' }}
        </h1>
      </div>
    </header>

    <!-- loading -->
    <div
      v-if="pending"
      class="flex flex-col gap-3"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="flex items-center gap-4 rounded-2xl border border-default bg-default p-4"
      >
        <div class="book-skeleton size-12 shrink-0 rounded-2xl" />
        <div class="flex-1 space-y-2">
          <div class="book-skeleton h-4 w-2/3 rounded-full" />
          <div class="book-skeleton h-3 w-1/3 rounded-full" />
        </div>
      </div>
    </div>

    <!-- locked -->
    <div
      v-else-if="locked"
      class="card-rise flex flex-col items-center gap-3 rounded-3xl border border-dashed border-default py-16 text-center text-muted"
    >
      <UIcon
        name="i-lucide-lock"
        class="size-12 text-primary/40"
      />
      <p class="max-w-sm text-sm font-medium">
        Этот блок закрыт. Сначала сдай тест предыдущего блока.
      </p>
      <UButton
        to="/student/book"
        color="primary"
        variant="soft"
        label="К карте «Мой путь»"
      />
    </div>

    <!-- steps: lessons + test -->
    <div
      v-else
      class="flex flex-col gap-3"
    >
      <NuxtLink
        v-for="(s, i) in steps"
        :key="s.id"
        :to="`/student/book/${moduleId}/${s.id}`"
        class="duo-pop duo-card duo-card-hover group relative flex items-center gap-4 overflow-hidden bg-default p-4"
        :class="s.kind === 'TEST' ? 'ring-1 ring-amber-200 dark:ring-amber-900/50' : ''"
        :style="{ animationDelay: Math.min(i, 8) * 0.06 + 's' }"
      >
        <div
          class="grid size-12 shrink-0 place-items-center rounded-2xl text-lg font-black shadow-[0_3px_0_0_rgba(0,0,0,0.08)]"
          :class="s.done
            ? 'bg-primary-500 text-white'
            : s.kind === 'TEST'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200'
              : 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-200'"
        >
          <UIcon
            v-if="s.done"
            name="i-lucide-check"
            class="size-6"
          />
          <UIcon
            v-else-if="s.kind === 'TEST'"
            name="i-lucide-clipboard-list"
            class="size-6"
          />
          <template v-else>{{ i + 1 }}</template>
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span
              v-if="s.kind === 'TEST'"
              class="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            >Тест блока</span>
          </div>
          <h3 class="truncate font-bold">
            {{ s.title }}
          </h3>
          <p class="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-primary/70">
            <UIcon
              name="i-lucide-pencil-line"
              class="size-3"
            />{{ s.meta }}
          </p>
        </div>
        <div class="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
          <UIcon
            name="i-lucide-play"
            class="play-nudge size-4"
          />
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
