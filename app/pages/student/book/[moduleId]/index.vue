<script setup lang="ts">
import { useLessons } from '~/entities/book'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const moduleId = computed(() => route.params.moduleId as string)

const { fetchModuleUnits } = useLessons()
const { data: units, pending } = await useAsyncData(
  `lesson-units-${moduleId.value}`,
  () => fetchModuleUnits(moduleId.value)
)
</script>

<template>
  <div class="p-3 sm:p-6 lg:p-8 space-y-7 w-full max-w-3xl mx-auto">
    <!-- hero — soft -->
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
          />Учебник
        </p>
        <h1 class="mt-1 font-display text-2xl font-black tracking-tight text-primary-900 dark:text-primary-50 sm:text-3xl">
          Юниты
        </h1>
      </div>
    </header>

    <!-- loading -->
    <div
      v-if="pending"
      class="flex flex-col gap-3"
    >
      <div
        v-for="n in 5"
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

    <!-- empty -->
    <div
      v-else-if="!units?.length"
      class="card-rise flex flex-col items-center gap-3 rounded-3xl border border-dashed border-default py-16 text-center text-muted"
    >
      <UIcon
        name="i-lucide-book-dashed"
        class="animate-float-soft size-12 text-primary/50"
      />
      <p class="text-sm font-medium">
        В этом модуле пока нет юнитов.
      </p>
    </div>

    <!-- units -->
    <div
      v-else
      class="flex flex-col gap-3"
    >
      <NuxtLink
        v-for="(u, i) in units"
        :key="u.id"
        :to="`/student/book/${moduleId}/${u.id}`"
        class="duo-pop duo-card duo-card-hover group relative flex items-center gap-4 overflow-hidden bg-default p-4"
        :style="{ animationDelay: Math.min(i, 8) * 0.06 + 's' }"
      >
        <div class="pointer-events-none absolute inset-y-0 left-0 w-1.5 origin-left scale-y-0 bg-primary-400 transition-transform duration-300 group-hover:scale-y-100" />
        <div class="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-100 text-lg font-black text-primary-700 shadow-[0_3px_0_0_var(--color-primary-200,#bbf7d0)] dark:bg-primary-900/50 dark:text-primary-200 dark:shadow-[0_3px_0_0_rgba(0,0,0,0.3)]">
          {{ i + 1 }}
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="truncate font-bold">
            {{ u.title }}
          </h3>
          <p
            v-if="u.subtitle"
            class="truncate text-xs text-muted"
          >
            {{ u.subtitle }}
          </p>
          <p class="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-primary/70">
            <UIcon
              name="i-lucide-pencil-line"
              class="size-3"
            />{{ u.exerciseCount }} заданий
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
