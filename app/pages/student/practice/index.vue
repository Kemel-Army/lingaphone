<script setup lang="ts">
import { PRACTICE_DECKS } from '~/shared/mock'

definePageMeta({ layout: 'dashboard' })

const KIND_LABEL: Record<string, { label: string, color: string }> = {
  WORD: { label: 'Слова', color: 'primary' },
  PHRASE: { label: 'Фразы', color: 'info' },
  MIN_PAIR: { label: 'Минимальные пары', color: 'warning' }
}

const deckStats = (deckId: string) => {
  const deck = PRACTICE_DECKS.find(d => d.id === deckId)!
  const kinds = new Set(deck.cards.map(c => c.kind))
  return { cardCount: deck.cards.length, kinds: Array.from(kinds) }
}
</script>

<template>
  <div class="relative">
    <!-- Decorative background -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden"
    >
      <div class="absolute -top-32 left-1/3 size-96 rounded-full bg-primary-400/20 blur-3xl" />
      <div class="absolute -top-20 right-1/4 size-80 rounded-full bg-violet-400/15 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      <!-- Hero header -->
      <header class="space-y-2">
        <p class="text-sm font-bold text-primary uppercase tracking-wider">
          🎧 Тренируй произношение
        </p>
        <h1 class="text-3xl sm:text-4xl font-black tracking-tight">
          AI-тренажёр
          <span class="bg-linear-to-r from-primary-500 to-violet-600 bg-clip-text text-transparent">British Accent</span>
        </h1>
        <p class="text-sm text-muted max-w-2xl">
          Слушай носителя, повторяй вслух, получай мгновенную оценку. AI сравнивает твоё произношение с эталоном и подсвечивает, что улучшить.
        </p>
      </header>

      <!-- How it works -->
      <section class="rounded-3xl bg-linear-to-br from-primary-500 via-sky-600 to-violet-600 p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <UIcon
          name="i-lucide-headphones"
          aria-hidden="true"
          class="absolute -bottom-6 -right-6 size-48 opacity-15"
        />

        <div class="relative grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="space-y-2">
            <div class="size-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <UIcon
                name="i-lucide-volume-2"
                class="size-6"
              />
            </div>
            <p class="font-black">
              1. Listen
            </p>
            <p class="text-sm opacity-90">
              Британский голос произносит слово или фразу
            </p>
          </div>
          <div class="space-y-2">
            <div class="size-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <UIcon
                name="i-lucide-mic"
                class="size-6"
              />
            </div>
            <p class="font-black">
              2. Repeat
            </p>
            <p class="text-sm opacity-90">
              Повтори вслух, AI запишет твою речь
            </p>
          </div>
          <div class="space-y-2">
            <div class="size-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <UIcon
                name="i-lucide-sparkles"
                class="size-6"
              />
            </div>
            <p class="font-black">
              3. Compare
            </p>
            <p class="text-sm opacity-90">
              Получи процент точности и разбор ошибок
            </p>
          </div>
        </div>
      </section>

      <!-- Decks -->
      <section>
        <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
          <UIcon
            name="i-lucide-layers"
            class="size-5 text-primary"
          />
          Колоды для практики
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <NuxtLink
            v-for="deck in PRACTICE_DECKS"
            :key="deck.id"
            :to="`/student/practice/${deck.id}`"
            class="group relative rounded-3xl border border-default bg-default p-6 hover:border-primary-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <!-- Decorative emoji -->
            <span class="absolute -top-2 -right-2 text-7xl opacity-10 group-hover:opacity-20 group-hover:rotate-12 transition-all">
              {{ deck.emoji }}
            </span>

            <div class="relative space-y-3">
              <div class="flex items-center gap-2">
                <UBadge
                  :label="deck.level"
                  color="primary"
                  variant="solid"
                  size="xs"
                />
                <span class="text-2xl">{{ deck.emoji }}</span>
              </div>

              <div>
                <h3 class="text-lg font-black tracking-tight">
                  {{ deck.title }}
                </h3>
                <p class="text-sm text-muted mt-1">
                  {{ deck.description }}
                </p>
              </div>

              <div class="flex items-center gap-2 flex-wrap pt-2">
                <UBadge
                  v-for="k in deckStats(deck.id).kinds"
                  :key="k"
                  :label="KIND_LABEL[k]!.label"
                  :color="KIND_LABEL[k]!.color as any"
                  variant="subtle"
                  size="xs"
                />
              </div>

              <div class="flex items-center justify-between pt-3 border-t border-default">
                <p class="text-sm text-muted">
                  <span class="font-bold tabular-nums text-default">{{ deckStats(deck.id).cardCount }}</span> карточек
                </p>
                <span class="text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
                  Начать →
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- Tip -->
      <aside class="rounded-2xl border border-default bg-elevated p-5 flex items-start gap-3">
        <div class="size-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
          <UIcon
            name="i-lucide-lightbulb"
            class="size-5 text-amber-600"
          />
        </div>
        <div>
          <p class="font-bold text-sm">
            Совет
          </p>
          <p class="text-sm text-muted mt-1">
            Тренажёр работает в Chrome, Edge и Safari. Разреши доступ к микрофону при первом запросе.
            Для лучшего результата надень наушники — как на уроках Lingaphone 🎧
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>
