<script setup lang="ts">
import type { Book } from '../model/types'
import { BOOK_LEVEL_META } from '../model/types'

const props = defineProps<{ book: Book }>()

const levelMeta = computed(() => BOOK_LEVEL_META[props.book.level])
</script>

<template>
  <NuxtLink
    :to="`/student/books/${book.id}`"
    class="group relative flex flex-col rounded-2xl border border-default bg-default p-4 transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
  >
    <!-- Cover / placeholder -->
    <div
      class="mb-3 flex aspect-3/4 w-full items-center justify-center overflow-hidden rounded-xl bg-linear-to-br"
      :class="levelMeta.gradient"
    >
      <img
        v-if="book.coverUrl"
        :src="book.coverUrl"
        :alt="book.title"
        class="size-full object-cover"
      >
      <UIcon
        v-else
        name="i-lucide-book-marked"
        class="size-12 text-white/90"
      />
    </div>

    <div class="mb-2 flex items-center gap-2">
      <span
        class="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-black"
        :class="[levelMeta.bg, levelMeta.color]"
      >
        {{ book.level }}
      </span>
      <span class="text-xs text-muted">{{ levelMeta.label }}</span>
    </div>

    <h3 class="mb-1 line-clamp-2 text-sm font-bold leading-snug group-hover:text-primary transition-colors">
      {{ book.title }}
    </h3>

    <p
      v-if="book.description"
      class="line-clamp-2 text-xs text-muted"
    >
      {{ book.description }}
    </p>
  </NuxtLink>
</template>
