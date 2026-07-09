<script setup lang="ts">
import { useMyPath } from '~/entities/book'
import { MyPathMap } from '~/widgets/my-path'

definePageMeta({ layout: 'dashboard' })

const { fetchMyPath } = useMyPath()
const { data: path, pending } = await useAsyncData('my-path', fetchMyPath)
</script>

<template>
  <div class="p-3 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
    <!-- loading -->
    <div
      v-if="pending"
      class="space-y-4"
    >
      <div class="book-skeleton h-32 rounded-3xl" />
      <div
        v-for="n in 3"
        :key="n"
        class="flex items-start gap-4 rounded-3xl border border-default bg-default p-5"
      >
        <div class="book-skeleton size-12 shrink-0 rounded-2xl" />
        <div class="flex-1 space-y-2.5 pt-1">
          <div class="book-skeleton h-3.5 w-24 rounded-full" />
          <div class="book-skeleton h-4 w-3/4 rounded-full" />
          <div class="book-skeleton h-3 w-1/2 rounded-full" />
        </div>
      </div>
    </div>

    <template v-else-if="path">
      <!-- Отсканированный учебник — читать постранично -->
      <NuxtLink
        v-if="path.scanModule"
        :to="`/student/book/scan/${path.scanModule.id}`"
        class="duo-card duo-card-hover group flex items-center gap-4 rounded-3xl bg-primary-50 p-5 ring-1 ring-primary-100 dark:bg-primary-950/40 dark:ring-primary-900/50"
      >
        <div class="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-500 text-white shadow-[0_3px_0_0_rgba(0,0,0,0.08)]">
          <UIcon
            name="i-lucide-book-open-text"
            class="size-6"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-black uppercase tracking-widest text-primary-600/80 dark:text-primary-300/80">
            Учебник
          </p>
          <h3 class="truncate font-bold">
            {{ path.book?.title }} — читать книгу
          </h3>
          <p class="text-xs font-semibold text-primary/70">
            {{ path.scanModule.pageCount }} страниц
          </p>
        </div>
        <div class="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4"
          />
        </div>
      </NuxtLink>

      <MyPathMap :path="path" />
    </template>
  </div>
</template>
