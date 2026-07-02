<script setup lang="ts">
import { useBookPages, BOOK_LEVEL_META } from '~/entities/book'
import type { BookLevel } from '~/entities/book'

definePageMeta({ layout: 'dashboard' })

const { fetchInteractiveModules } = useBookPages()
const { data: modules, pending } = await useAsyncData('interactive-modules', fetchInteractiveModules)

const levelMeta = (lvl: string) => BOOK_LEVEL_META[lvl as BookLevel] ?? BOOK_LEVEL_META.A1
</script>

<template>
  <div class="p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
    <!-- hero — soft, book-like -->
    <header class="card-rise relative overflow-hidden rounded-3xl bg-primary-50 px-6 py-8 ring-1 ring-primary-100 dark:bg-primary-950/40 dark:ring-primary-900/50 sm:px-9 sm:py-10">
      <UIcon
        name="i-lucide-book-open-text"
        class="pointer-events-none absolute -right-3 top-1/2 hidden size-32 -translate-y-1/2 text-primary/10 sm:block"
      />
      <span class="relative inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary-600 ring-1 ring-primary/10 dark:bg-white/10 dark:text-primary-300">
        <UIcon
          name="i-lucide-sparkles"
          class="size-3.5"
        />Учебник
      </span>
      <h1 class="relative mt-3 font-display text-3xl font-black tracking-tight text-primary-900 dark:text-primary-50 sm:text-4xl">
        Интерактивная книга
      </h1>
      <p class="relative mt-2 max-w-xl text-sm font-medium text-primary-700/70 dark:text-primary-200/70 sm:text-base">
        Настоящие страницы учебника — но задания выполняешь прямо на странице, с мгновенной проверкой.
      </p>
    </header>

    <!-- loading skeletons -->
    <div
      v-if="pending"
      class="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      <div
        v-for="n in 4"
        :key="n"
        class="flex items-start gap-4 rounded-2xl border border-default bg-default p-5"
      >
        <div class="book-skeleton size-12 shrink-0 rounded-2xl" />
        <div class="flex-1 space-y-2.5 pt-1">
          <div class="book-skeleton h-3.5 w-24 rounded-full" />
          <div class="book-skeleton h-4 w-3/4 rounded-full" />
          <div class="book-skeleton h-3 w-1/2 rounded-full" />
        </div>
      </div>
    </div>

    <!-- empty -->
    <div
      v-else-if="!modules?.length"
      class="card-rise flex flex-col items-center gap-3 rounded-3xl border border-dashed border-default py-16 text-center text-muted"
    >
      <UIcon
        name="i-lucide-book-dashed"
        class="animate-float-soft size-12 text-primary/50"
      />
      <p class="text-sm font-medium">
        Пока нет готовых книг. Скоро появятся!
      </p>
    </div>

    <!-- modules -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      <NuxtLink
        v-for="(m, i) in modules"
        :key="m.id"
        :to="`/student/book/${m.id}`"
        class="duo-pop duo-card duo-card-hover group relative overflow-hidden bg-default p-5"
        :style="{ animationDelay: Math.min(i, 8) * 0.06 + 's' }"
      >
        <div class="relative flex items-start gap-4">
          <div class="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-100 text-primary-600 shadow-[0_3px_0_0_var(--color-primary-200,#bbf7d0)] dark:bg-primary-900/50 dark:text-primary-300 dark:shadow-[0_3px_0_0_rgba(0,0,0,0.3)]">
            <UIcon
              name="i-lucide-book-open"
              class="duo-wiggle-hover size-6"
            />
          </div>
          <div class="min-w-0 flex-1">
            <div class="mb-1.5 flex items-center gap-2">
              <UBadge
                :label="m.level"
                :color="levelMeta(m.level).color as any"
                variant="subtle"
                size="xs"
              />
              <UBadge
                :label="`${m.pageCount} стр.`"
                color="neutral"
                variant="subtle"
                size="xs"
              />
            </div>
            <h3 class="truncate font-bold">
              {{ m.bookTitle }}
            </h3>
            <p class="mt-0.5 line-clamp-1 text-xs text-muted">
              {{ m.title }}
            </p>
          </div>
          <UIcon
            name="i-lucide-arrow-right"
            class="play-nudge size-5 shrink-0 text-muted transition group-hover:text-primary"
          />
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
