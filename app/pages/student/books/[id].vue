<script setup lang="ts">
import { ModuleList, BookPdfViewer, useBooks, BOOK_LEVEL_META } from '~/entities/book'
import type { BookModule } from '~/entities/book'
import { GameWrapper, useGames } from '~/entities/game'
import type { Game } from '~/entities/game'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const bookId = route.params.id as string

const { fetchBookWithModules } = useBooks()
const { fetchGamesByModule } = useGames()

const { data: book, pending } = useAsyncData(`book-${bookId}`, () => fetchBookWithModules(bookId))

const activeModule = ref<BookModule | null>(null)
const games = ref<Game[]>([])

watchEffect(() => {
  if (book.value && !activeModule.value && book.value.modules.length) {
    activeModule.value = book.value.modules[0] ?? null
  }
})

watch(activeModule, async (m) => {
  games.value = m ? await fetchGamesByModule(m.id) : []
})

const levelMeta = computed(() => book.value ? BOOK_LEVEL_META[book.value.level] : null)

const onGameComplete = async (game: Game, payload: { correct: number, total: number }) => {
  try {
    await $fetch('/api/games/progress', {
      method: 'POST',
      body: { gameId: game.id, correct: payload.correct, total: payload.total }
    })
  } catch { /* non-fatal */ }
}
</script>

<template>
  <div class="mx-auto max-w-6xl p-4 pb-16 sm:p-6 lg:p-8">
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
      v-else-if="!book"
      class="py-20 text-center text-muted"
    >
      Книга не найдена.
    </div>

    <template v-else>
      <UButton
        to="/student/books"
        variant="link"
        color="neutral"
        icon="i-lucide-arrow-left"
        label="Все книги"
        class="mb-4"
      />

      <header class="mb-6 flex items-center gap-2">
        <span
          v-if="levelMeta"
          class="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-black"
          :class="[levelMeta.bg, levelMeta.color]"
        >
          {{ book.level }}
        </span>
        <h1 class="text-2xl font-black tracking-tight">
          {{ book.title }}
        </h1>
      </header>

      <div class="grid gap-6 lg:grid-cols-[280px_1fr]">
        <!-- Modules -->
        <aside>
          <h2 class="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
            Модули
          </h2>
          <ModuleList
            :modules="book.modules"
            :active-id="activeModule?.id"
            @select="(m) => activeModule = m"
          />
        </aside>

        <!-- Module content -->
        <section
          v-if="activeModule"
          class="flex flex-col gap-6"
        >
          <!-- PDF viewer -->
          <BookPdfViewer
            v-if="activeModule.pdfUrl"
            id="book-pdf"
            :key="activeModule.id"
            :src="activeModule.pdfUrl"
            :title="activeModule.title"
          />
          <div
            v-else
            class="rounded-2xl border border-dashed border-default p-10 text-center text-sm text-muted"
          >
            PDF этого модуля ещё не загружен.
          </div>

          <!-- Module games -->
          <div v-if="games.length">
            <h2 class="mb-3 text-xs font-bold uppercase tracking-widest text-muted">
              Игры модуля
            </h2>
            <div class="flex flex-col gap-4">
              <GameWrapper
                v-for="g in games"
                :key="g.id"
                :game="g"
                @complete="(p) => onGameComplete(g, p)"
              />
            </div>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
