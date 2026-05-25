<script setup lang="ts">
import { useGameLevels } from '~/shared/composables/useGameLevels'

definePageMeta({ layout: 'dashboard' })

const { levelPath, PASS_THRESHOLD } = useGameLevels()

const TIER_BADGE: Record<string, string> = {
  A1: 'primary', A2: 'info', S1: 'warning', S2: 'error'
}

const totalPassed = computed(() => levelPath.value.filter(l => l.passed).length)
const totalLevels = computed(() => levelPath.value.length)
</script>

<template>
  <div class="relative min-h-screen">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden"
    >
      <div class="absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full bg-violet-400/20 blur-3xl" />
      <div class="absolute top-40 right-10 size-60 rounded-full bg-primary-400/15 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 pb-12 max-w-3xl mx-auto">
      <!-- Header -->
      <header class="mb-8 text-center">
        <p class="text-sm font-bold text-primary uppercase tracking-widest">
          🎮 Мини-игры
        </p>
        <h1 class="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
          Путь знаний
        </h1>
        <p class="mt-2 text-sm text-muted max-w-md mx-auto">
          Проходи уровни, чтобы открыть следующие. Каждый уровень — смесь тестов, ввода текста и голосовых ответов.
          Порог прохождения — <span class="font-black text-default">{{ PASS_THRESHOLD }}%</span>
        </p>

        <!-- Overall progress -->
        <div class="mt-5 inline-flex items-center gap-3 rounded-full bg-default border border-default px-4 py-2 shadow-sm">
          <UIcon
            name="i-lucide-trophy"
            class="size-5 text-amber-500"
          />
          <p class="font-bold text-sm">
            Пройдено: <span class="tabular-nums">{{ totalPassed }}</span> / {{ totalLevels }}
          </p>
        </div>
      </header>

      <!-- Path -->
      <div class="relative space-y-6 sm:space-y-8">
        <!-- Connecting line -->
        <div
          aria-hidden="true"
          class="absolute left-8 sm:left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-linear-to-b from-primary-200 via-default to-default dark:from-primary-700"
        />

        <div
          v-for="(l, idx) in levelPath"
          :key="l.id"
          class="relative flex items-center gap-4"
          :class="idx % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'"
        >
          <!-- Node (centered on desktop) -->
          <div
            class="relative z-10 size-16 sm:size-20 shrink-0 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-lg transition-all"
            :class="l.passed
              ? 'bg-linear-to-br from-emerald-400 to-emerald-600 text-white'
              : l.unlocked
                ? 'bg-linear-to-br from-violet-500 to-fuchsia-600 text-white ring-4 ring-violet-300/40 animate-pulse'
                : 'bg-elevated text-muted ring-1 ring-default'"
          >
            <UIcon
              v-if="!l.unlocked"
              name="i-lucide-lock"
              class="size-7"
            />
            <UIcon
              v-else-if="l.passed"
              name="i-lucide-check"
              class="size-8"
            />
            <span v-else>{{ l.emoji }}</span>
          </div>

          <!-- Card -->
          <NuxtLink
            :to="l.unlocked ? `/student/game/${l.id}` : ''"
            class="flex-1 block rounded-2xl border bg-default p-4 sm:p-5 transition-all"
            :class="l.unlocked
              ? 'border-default hover:border-violet-300 hover:shadow-md cursor-pointer'
              : 'border-default opacity-60 pointer-events-none cursor-default'"
          >
            <div class="flex items-center gap-2 mb-1">
              <UBadge
                :label="`Уровень ${l.order}`"
                color="neutral"
                variant="subtle"
                size="xs"
              />
              <UBadge
                :label="l.tier"
                :color="TIER_BADGE[l.tier] as any"
                variant="subtle"
                size="xs"
              />
              <UBadge
                v-if="l.passed"
                label="✓ Пройден"
                color="success"
                variant="subtle"
                size="xs"
              />
              <UBadge
                v-else-if="!l.unlocked"
                label="🔒 Закрыт"
                color="neutral"
                variant="subtle"
                size="xs"
              />
            </div>

            <h3 class="font-black text-base sm:text-lg flex items-center gap-2">
              <span class="hidden sm:inline">{{ l.emoji }}</span>
              {{ l.title }}
            </h3>
            <p class="text-xs sm:text-sm text-muted mt-1 line-clamp-2">
              {{ l.description }}
            </p>

            <div class="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-default">
              <div class="flex items-center gap-3 text-xs">
                <span class="text-muted inline-flex items-center gap-1">
                  <UIcon
                    name="i-lucide-list"
                    class="size-3.5"
                  />
                  {{ l.questionsPerAttempt }} вопросов
                </span>
                <span
                  v-if="l.attempts > 0"
                  class="text-muted inline-flex items-center gap-1"
                >
                  <UIcon
                    name="i-lucide-rotate-ccw"
                    class="size-3.5"
                  />
                  {{ l.attempts }} попыт{{ l.attempts === 1 ? 'ка' : l.attempts < 5 ? 'ки' : 'ок' }}
                </span>
                <span
                  v-if="l.bestScore > 0"
                  class="font-bold tabular-nums"
                  :class="l.bestScore >= PASS_THRESHOLD ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'"
                >
                  best {{ l.bestScore }}%
                </span>
              </div>
              <div
                v-if="l.unlocked && !l.passed"
                class="inline-flex items-center gap-1 text-xs font-black text-violet-600 dark:text-violet-400"
              >
                Играть
                <UIcon
                  name="i-lucide-arrow-right"
                  class="size-3.5"
                />
              </div>
              <div
                v-else-if="l.passed"
                class="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400"
              >
                Пройти ещё раз
                <UIcon
                  name="i-lucide-rotate-ccw"
                  class="size-3.5"
                />
              </div>
              <div
                v-else
                class="inline-flex items-center gap-1 text-xs text-muted"
              >
                Пройди уровень {{ l.order - 1 }}, чтобы открыть
              </div>
            </div>

            <!-- XP teaser -->
            <p
              v-if="l.unlocked && !l.passed"
              class="mt-2 text-[11px] text-muted"
            >
              💎 Награда: <span class="font-bold">+{{ l.xpReward }} XP</span> · бонус за 100%: <span class="font-bold">+{{ l.perfectBonusXp }} XP</span>
            </p>
          </NuxtLink>
        </div>

        <!-- Finale teaser -->
        <div
          v-if="totalPassed === totalLevels && totalLevels > 0"
          class="relative z-10 mt-4 rounded-3xl bg-linear-to-br from-amber-300 via-yellow-400 to-amber-500 p-6 text-center text-white shadow-2xl"
        >
          <UIcon
            name="i-lucide-crown"
            class="size-12 mx-auto mb-2"
          />
          <p class="text-xs font-black uppercase tracking-widest opacity-90">
            🏆 Все уровни пройдены
          </p>
          <h3 class="mt-1 text-2xl font-black">
            Master of Lingaphone
          </h3>
          <p class="mt-2 text-sm opacity-90">
            Новые уровни появятся скоро. А пока — попробуй улучшить результаты в существующих
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
