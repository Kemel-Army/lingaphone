<script setup lang="ts">
/**
 * «Мой путь» — the student's bound course book as a vertical, gated block map.
 * Blocks unlock sequentially: a block is LOCKED until the previous block's
 * test is passed. Locked blocks are not navigable. Lock state + progress are
 * computed server-side (/api/student/my-path).
 */
import type { MyPath, MyPathBlock } from '~/entities/book'

defineProps<{ path: MyPath }>()

// Resolve the real NuxtLink component (a string `:is="'NuxtLink'"` does not
// reliably render an <a>); locked blocks render as a plain <div>.
const NuxtLinkC = resolveComponent('NuxtLink')

const statusMeta = (b: MyPathBlock) => {
  if (b.status === 'COMPLETED') {
    return { icon: 'i-lucide-circle-check-big', ring: 'ring-primary-300 dark:ring-primary-800', badge: 'Пройден', badgeCls: 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300', locked: false }
  }
  if (b.status === 'AVAILABLE') {
    return { icon: 'i-lucide-circle-dot', ring: 'ring-primary-200 dark:ring-primary-900', badge: 'Доступен', badgeCls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', locked: false }
  }
  return { icon: 'i-lucide-lock', ring: 'ring-default', badge: 'Закрыт', badgeCls: 'bg-elevated text-muted', locked: true }
}
</script>

<template>
  <div class="space-y-6">
    <!-- bound book header -->
    <header class="card-rise relative overflow-hidden rounded-3xl bg-primary-50 px-5 py-6 ring-1 ring-primary-100 dark:bg-primary-950/40 dark:ring-primary-900/50 sm:px-7">
      <UIcon
        name="i-lucide-book-open-text"
        class="pointer-events-none absolute -right-3 top-1/2 hidden size-32 -translate-y-1/2 text-primary/10 sm:block"
      />
      <span class="relative inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary-600 ring-1 ring-primary/10 dark:bg-white/10 dark:text-primary-300">
        <UIcon
          name="i-lucide-sparkles"
          class="size-3.5"
        />Мой путь
      </span>
      <h1 class="relative mt-3 font-display text-3xl font-black tracking-tight text-primary-900 dark:text-primary-50 sm:text-4xl">
        {{ path.book?.title ?? 'Мой путь' }}
      </h1>
      <div
        v-if="path.book"
        class="relative mt-2 flex flex-wrap items-center gap-2"
      >
        <UBadge
          v-if="path.tier"
          :label="path.tier"
          color="primary"
          variant="subtle"
          size="sm"
        />
        <UBadge
          v-if="path.level"
          :label="`Уровень ${path.level}`"
          color="neutral"
          variant="subtle"
          size="sm"
        />
      </div>
    </header>

    <!-- no book bound yet -->
    <div
      v-if="!path.book"
      class="card-rise flex flex-col items-center gap-3 rounded-3xl border border-dashed border-default py-16 text-center text-muted"
    >
      <UIcon
        name="i-lucide-compass"
        class="animate-float-soft size-12 text-primary/50"
      />
      <p class="max-w-sm text-sm font-medium">
        <template v-if="!path.level">
          Куратор ещё не назначил тебе уровень. После пробного урока здесь появится твой учебник.
        </template>
        <template v-else>
          Уровень «{{ path.level }}» назначен, но учебник ещё готовится. Скоро он появится здесь!
        </template>
      </p>
    </div>

    <!-- block map -->
    <ol
      v-else
      class="relative space-y-4"
    >
      <li
        v-for="(b, i) in path.blocks"
        :key="b.id"
      >
        <component
          :is="statusMeta(b).locked ? 'div' : NuxtLinkC"
          :to="statusMeta(b).locked ? undefined : `/student/book/${b.id}`"
          class="group relative flex items-start gap-4 rounded-3xl bg-default p-5 ring-1 transition"
          :class="[statusMeta(b).ring, statusMeta(b).locked ? 'opacity-60' : 'duo-card-hover cursor-pointer']"
        >
          <!-- node -->
          <div
            class="grid size-12 shrink-0 place-items-center rounded-2xl text-lg font-black shadow-[0_3px_0_0_rgba(0,0,0,0.08)]"
            :class="statusMeta(b).locked
              ? 'bg-elevated text-muted'
              : b.status === 'COMPLETED'
                ? 'bg-primary-500 text-white'
                : 'bg-primary-100 text-primary-700 dark:bg-primary-900/60 dark:text-primary-200'"
          >
            <UIcon
              v-if="statusMeta(b).locked || b.status === 'COMPLETED'"
              :name="statusMeta(b).icon"
              class="size-6"
            />
            <template v-else>
              {{ i + 1 }}
            </template>
          </div>

          <div class="min-w-0 flex-1">
            <div class="mb-1 flex flex-wrap items-center gap-2">
              <span class="text-xs font-black uppercase tracking-widest text-primary-600/70 dark:text-primary-300/70">Блок {{ b.order }}</span>
              <span
                class="rounded-full px-2 py-0.5 text-[11px] font-bold"
                :class="statusMeta(b).badgeCls"
              >{{ statusMeta(b).badge }}</span>
            </div>
            <h3 class="truncate font-bold">
              {{ b.title }}
            </h3>

            <!-- lessons + test summary -->
            <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-muted">
              <span class="inline-flex items-center gap-1">
                <UIcon
                  name="i-lucide-book-open"
                  class="size-3.5"
                />{{ b.lessonsDone }}/{{ b.lessonsTotal }} уроков
              </span>
              <span
                v-if="b.test"
                class="inline-flex items-center gap-1"
                :class="b.test.passed ? 'text-primary' : ''"
              >
                <UIcon
                  :name="b.test.passed ? 'i-lucide-check-check' : 'i-lucide-clipboard-list'"
                  class="size-3.5"
                />
                Тест
                <template v-if="b.test.attempts > 0">· {{ b.test.bestScore }}% (порог {{ b.test.passThreshold }}%)</template>
                <template v-else>· порог {{ b.test.passThreshold }}%</template>
              </span>
            </div>
          </div>

          <UIcon
            v-if="!statusMeta(b).locked"
            name="i-lucide-arrow-right"
            class="mt-1 size-5 shrink-0 text-muted transition group-hover:text-primary"
          />
          <UIcon
            v-else
            name="i-lucide-lock"
            class="mt-1 size-5 shrink-0 text-muted"
          />
        </component>
      </li>
    </ol>
  </div>
</template>
