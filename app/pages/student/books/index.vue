<script setup lang="ts">
import { BookCard, useBooks, BOOK_LEVEL_META } from '~/entities/book'
import type { BookLevel } from '~/entities/book'

definePageMeta({ layout: 'dashboard' })

const { fetchBooks } = useBooks()
const { data: books, pending } = useAsyncData('student-books', () => fetchBooks())

const LEVELS: BookLevel[] = ['A1', 'A2', 'B1', 'B2']
const activeLevel = ref<BookLevel | 'all'>('all')

const filtered = computed(() =>
  (books.value ?? []).filter(b => activeLevel.value === 'all' || b.level === activeLevel.value)
)
</script>

<template>
  <div class="relative min-h-screen">
    <div class="mx-auto max-w-5xl p-4 pb-16 sm:p-6 lg:p-8">
      <header class="mb-8 text-center">
        <p class="text-sm font-bold uppercase tracking-widest text-primary">
          📚 Учебники
        </p>
        <h1 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Книги
        </h1>
        <p class="mx-auto mt-2 max-w-md text-sm text-muted">
          Учебники и модули по твоему уровню английского.
        </p>
      </header>

      <!-- Level filter -->
      <div class="mb-6 flex flex-wrap items-center justify-center gap-2">
        <UButton
          :variant="activeLevel === 'all' ? 'solid' : 'soft'"
          color="neutral"
          size="sm"
          label="Все"
          @click="activeLevel = 'all'"
        />
        <UButton
          v-for="lvl in LEVELS"
          :key="lvl"
          :variant="activeLevel === lvl ? 'solid' : 'soft'"
          color="primary"
          size="sm"
          :label="`${lvl} · ${BOOK_LEVEL_META[lvl].label}`"
          @click="activeLevel = lvl"
        />
      </div>

      <div
        v-if="pending"
        class="py-20 text-center text-muted"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin"
        />
      </div>

      <div
        v-else-if="!filtered.length"
        class="py-20 text-center text-muted"
      >
        <UIcon
          name="i-lucide-book-x"
          class="mx-auto mb-2 size-8"
        />
        Книг для этого уровня пока нет.
      </div>

      <div
        v-else
        class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      >
        <BookCard
          v-for="book in filtered"
          :key="book.id"
          :book="book"
        />
      </div>
    </div>
  </div>
</template>
