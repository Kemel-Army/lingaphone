<script setup lang="ts">
import { useLingafonStudent } from '~/shared/composables/useLingafonStudent'
import type { Database } from '~/shared/types/database.types'

definePageMeta({ layout: 'dashboard' })

type MedalKind = Database['public']['Enums']['MedalKind']

const { profile, medalHistory, payouts, predictedMedal, predictedPayout } = useLingafonStudent()

const MEDAL_META: Record<MedalKind, {
  icon: string
  label: string
  color: string
  bg: string
  gradient: string
  ring: string
  glow: string
}> = {
  GOLD: {
    icon: 'i-lucide-medal',
    label: 'Золото',
    color: 'text-yellow-700 dark:text-yellow-300',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    gradient: 'from-yellow-300 via-amber-400 to-yellow-500',
    ring: 'ring-yellow-300/60',
    glow: 'shadow-[0_0_30px_-5px_rgb(234_179_8/0.4)]'
  },
  SILVER: {
    icon: 'i-lucide-medal',
    label: 'Серебро',
    color: 'text-gray-700 dark:text-gray-200',
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    gradient: 'from-gray-300 via-gray-400 to-slate-400',
    ring: 'ring-gray-300/60',
    glow: 'shadow-[0_0_30px_-5px_rgb(148_163_184/0.4)]'
  },
  BRONZE: {
    icon: 'i-lucide-medal',
    label: 'Бронза',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    gradient: 'from-amber-400 via-orange-400 to-amber-500',
    ring: 'ring-amber-300/60',
    glow: 'shadow-[0_0_30px_-5px_rgb(245_158_11/0.4)]'
  },
  NONE: {
    icon: 'i-lucide-circle-dashed',
    label: 'Без медали',
    color: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-900',
    gradient: 'from-gray-200 to-gray-300',
    ring: 'ring-gray-200/40',
    glow: ''
  }
}

const formatTenge = (v: number) => `${v.toLocaleString('ru-RU')} ₸`
const formatMonth = (yyyymm: string) => {
  const [y, m] = yyyymm.split('-').map(Number)
  return new Date(y!, m! - 1, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
}

const totalPaid = computed(() =>
  payouts.value.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)
)

/** map medalId → paidAt (or null when not yet paid) */
const paidByMedal = computed(() => {
  const m = new Map<string, string | null>()
  for (const p of payouts.value) {
    if (!p.medalId) continue
    if (p.status === 'PAID' && p.paidAt) m.set(p.medalId, p.paidAt)
    else if (!m.has(p.medalId)) m.set(p.medalId, null)
  }
  return m
})

const goldCount = computed(() => medalHistory.value.filter(m => m.medal === 'GOLD').length)
const silverCount = computed(() => medalHistory.value.filter(m => m.medal === 'SILVER').length)
const bronzeCount = computed(() => medalHistory.value.filter(m => m.medal === 'BRONZE').length)

const predictedMeta = computed(() => MEDAL_META[predictedMedal.value])

const STREAK_MILESTONES = [
  { months: 3, bonus: 5000, emoji: '🥉' },
  { months: 6, bonus: 10000, emoji: '🥈' },
  { months: 9, bonus: 15000, emoji: '🥇' }
]
</script>

<template>
  <div class="relative">
    <!-- Decorative background -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-125 overflow-hidden"
    >
      <div class="absolute -top-32 -right-32 size-125 rounded-full bg-emerald-400/20 blur-3xl" />
      <div class="absolute -top-20 -left-20 size-80 rounded-full bg-yellow-300/20 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      <!-- Hero header -->
      <header class="space-y-2">
        <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          🏆 Маркет Достижений
        </p>
        <h1 class="text-3xl sm:text-4xl font-black tracking-tight">
          Зал твоей славы
        </h1>
        <p class="text-sm text-muted">
          Каждая золотая медаль = реальные деньги. Каждое усилие — твоя зарплата.
        </p>
      </header>

      <!-- BIG hero: total earnings -->
      <section class="relative rounded-3xl bg-linear-to-br from-emerald-500 via-emerald-600 to-teal-700 p-6 sm:p-10 text-white overflow-hidden shadow-2xl">
        <!-- Pattern: floating coins -->
        <div
          aria-hidden="true"
          class="absolute inset-0 opacity-10"
        >
          <UIcon
            name="i-lucide-coins"
            class="absolute top-6 right-8 size-32 rotate-12"
          />
          <UIcon
            name="i-lucide-trophy"
            class="absolute bottom-4 right-32 size-20 -rotate-12"
          />
          <UIcon
            name="i-lucide-sparkles"
            class="absolute top-10 left-1/3 size-12"
          />
          <UIcon
            name="i-lucide-medal"
            class="absolute bottom-8 left-8 size-24 rotate-6"
          />
        </div>

        <div class="relative max-w-2xl">
          <p class="text-sm font-bold uppercase tracking-widest opacity-90">
            Заработано в школе
          </p>
          <p class="mt-3 text-4xl sm:text-7xl font-black tracking-tight tabular-nums">
            {{ formatTenge(profile?.totalEarnings ?? 0) }}
          </p>
          <p class="mt-3 text-base sm:text-lg opacity-90">
            Это {{ medalHistory.length }} месяцев упорной работы в Lingaphone 💪
          </p>

          <div class="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur ring-1 ring-white/20 text-sm font-bold">
            <UIcon
              name="i-lucide-trending-up"
              class="size-4"
            />
            Слоган школы: «Ваша гордость — их первая зарплата»
          </div>
        </div>
      </section>

      <!-- Medal stats -->
      <section class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="group rounded-2xl ring-1 ring-yellow-200/60 dark:ring-yellow-700/30 bg-linear-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/20 p-5 text-center hover:scale-105 transition-transform">
          <div class="size-12 mx-auto rounded-full bg-linear-to-br from-yellow-300 to-amber-500 p-0.5 group-hover:rotate-12 transition-transform">
            <div class="size-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
              <UIcon
                name="i-lucide-medal"
                class="size-7 text-yellow-600"
              />
            </div>
          </div>
          <p class="mt-2 text-3xl font-black tabular-nums text-yellow-700 dark:text-yellow-300">
            {{ goldCount }}
          </p>
          <p class="text-xs font-bold uppercase tracking-wider text-yellow-700/70 dark:text-yellow-300/70">
            Золото
          </p>
        </div>

        <div class="group rounded-2xl ring-1 ring-gray-200/60 dark:ring-gray-700/30 bg-linear-to-br from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/20 p-5 text-center hover:scale-105 transition-transform">
          <div class="size-12 mx-auto rounded-full bg-linear-to-br from-gray-300 to-slate-400 p-0.5 group-hover:rotate-12 transition-transform">
            <div class="size-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
              <UIcon
                name="i-lucide-medal"
                class="size-7 text-gray-500"
              />
            </div>
          </div>
          <p class="mt-2 text-3xl font-black tabular-nums">
            {{ silverCount }}
          </p>
          <p class="text-xs font-bold uppercase tracking-wider text-muted">
            Серебро
          </p>
        </div>

        <div class="group rounded-2xl ring-1 ring-amber-200/60 dark:ring-amber-700/30 bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 p-5 text-center hover:scale-105 transition-transform">
          <div class="size-12 mx-auto rounded-full bg-linear-to-br from-amber-400 to-orange-500 p-0.5 group-hover:rotate-12 transition-transform">
            <div class="size-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
              <UIcon
                name="i-lucide-medal"
                class="size-7 text-amber-600"
              />
            </div>
          </div>
          <p class="mt-2 text-3xl font-black tabular-nums text-amber-700 dark:text-amber-400">
            {{ bronzeCount }}
          </p>
          <p class="text-xs font-bold uppercase tracking-wider text-amber-700/70 dark:text-amber-300/70">
            Бронза
          </p>
        </div>

        <div class="group rounded-2xl ring-1 ring-orange-200/60 dark:ring-orange-700/30 bg-linear-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/20 p-5 text-center hover:scale-105 transition-transform">
          <div class="size-12 mx-auto rounded-full bg-linear-to-br from-orange-400 to-red-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <UIcon
              name="i-lucide-flame"
              class="size-7 text-white"
            />
          </div>
          <p class="mt-2 text-3xl font-black tabular-nums text-orange-600">
            {{ (profile?.goldStreak ?? 0) }}
          </p>
          <p class="text-xs font-bold uppercase tracking-wider text-orange-700/70 dark:text-orange-300/70">
            Streak золота
          </p>
        </div>
      </section>

      <!-- Current month forecast -->
      <section
        class="relative rounded-3xl ring-1 p-6 sm:p-8 overflow-hidden"
        :class="[predictedMeta.bg, predictedMeta.ring, predictedMeta.glow]"
      >
        <div
          aria-hidden="true"
          class="absolute inset-0 bg-linear-to-br opacity-20"
          :class="predictedMeta.gradient"
        />
        <div class="relative flex flex-wrap items-center gap-6">
          <div
            class="size-24 rounded-3xl bg-linear-to-br p-1 shadow-xl shrink-0"
            :class="predictedMeta.gradient"
          >
            <div class="size-full rounded-3xl bg-white/95 dark:bg-gray-900/90 flex items-center justify-center">
              <UIcon
                :name="predictedMeta.icon"
                class="size-14"
                :class="predictedMeta.color"
              />
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-bold uppercase tracking-widest opacity-70">
              Текущий месяц · прогноз
            </p>
            <p
              class="mt-1 text-3xl sm:text-4xl font-black"
              :class="predictedMeta.color"
            >
              {{ predictedMeta.label }}
            </p>
            <p class="text-sm mt-1 opacity-90">
              Средний балл <span class="font-bold tabular-nums">{{ (profile?.currentMonthAverage ?? 0).toFixed(1) }}</span>
              <template v-if="predictedPayout > 0">
                · <span class="font-bold">+{{ formatTenge(predictedPayout) }}</span>
              </template>
            </p>
            <p class="text-xs text-muted mt-3">
              Финальная медаль выставляется педагогом в конце месяца
            </p>
          </div>
        </div>
      </section>

      <!-- Streak progress -->
      <section
        v-if="(profile?.goldStreak ?? 0) > 0"
        class="rounded-3xl border border-default bg-default p-6 sm:p-7"
      >
        <div class="flex items-start gap-3 mb-5">
          <div class="size-12 rounded-2xl bg-linear-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md shrink-0">
            <UIcon
              name="i-lucide-flame"
              class="size-6 text-white"
            />
          </div>
          <div>
            <p class="font-black text-lg">
              Золотая серия — {{ (profile?.goldStreak ?? 0) }} мес
            </p>
            <p class="text-sm text-muted">
              Каждый подряд идущий золотой месяц приближает к бонусам
            </p>
          </div>
        </div>

        <div class="space-y-3">
          <div
            v-for="ms in STREAK_MILESTONES"
            :key="ms.months"
            class="flex items-center gap-3"
          >
            <UIcon
              :name="(profile?.goldStreak ?? 0) >= ms.months ? 'i-lucide-circle-check-big' : 'i-lucide-circle'"
              class="size-6 shrink-0"
              :class="(profile?.goldStreak ?? 0) >= ms.months ? 'text-emerald-500' : 'text-dimmed'"
            />
            <div class="flex-1 min-w-0">
              <div class="flex justify-between text-sm mb-1.5">
                <span class="font-semibold">{{ ms.emoji }} {{ ms.months }} мес подряд</span>
                <span
                  class="font-black tabular-nums"
                  :class="(profile?.goldStreak ?? 0) >= ms.months ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'"
                >+{{ formatTenge(ms.bonus) }}</span>
              </div>
              <div class="h-2 rounded-full bg-elevated overflow-hidden">
                <div
                  class="h-full bg-linear-to-r from-orange-400 to-yellow-500 transition-all duration-700"
                  :style="{ width: `${Math.min(100, ((profile?.goldStreak ?? 0) / ms.months) * 100)}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- History timeline -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <UIcon
              name="i-lucide-history"
              class="size-5 text-primary"
            />
            История медалей
          </h2>
          <p class="text-sm text-muted">
            Всего выплачено: <span class="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{{ formatTenge(totalPaid) }}</span>
          </p>
        </div>

        <div class="space-y-2">
          <article
            v-for="m in medalHistory"
            :key="m.id"
            class="group rounded-2xl ring-1 transition-all hover:scale-[1.01] hover:shadow-md p-4 flex items-center gap-4"
            :class="[MEDAL_META[m.medal].bg, MEDAL_META[m.medal].ring]"
          >
            <div
              class="size-12 rounded-2xl p-0.5 bg-linear-to-br shrink-0 group-hover:rotate-6 transition-transform"
              :class="MEDAL_META[m.medal].gradient"
            >
              <div class="size-full rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center">
                <UIcon
                  :name="MEDAL_META[m.medal].icon"
                  class="size-6"
                  :class="MEDAL_META[m.medal].color"
                />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <p
                class="font-bold capitalize"
                :class="MEDAL_META[m.medal].color"
              >
                {{ MEDAL_META[m.medal].label }} · {{ formatMonth(m.month) }}
              </p>
              <p class="text-xs text-muted mt-0.5">
                Средний балл: <span class="font-mono font-bold tabular-nums">{{ m.averageGrade.toFixed(1) }}</span>
                <span
                  v-if="paidByMedal.get(m.id)"
                  class="mx-1"
                >·</span>
                <span v-if="paidByMedal.get(m.id)">Выплачено {{ new Date(paidByMedal.get(m.id)).toLocaleDateString('ru-RU') }}</span>
              </p>
            </div>
            <div
              v-if="m.payout > 0"
              class="text-right shrink-0"
            >
              <p class="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{{ formatTenge(m.payout) }}
              </p>
              <UBadge
                :label="paidByMedal.get(m.id) ? '✓ Выплачено' : 'Ожидает'"
                :color="paidByMedal.get(m.id) ? 'success' : 'warning'"
                variant="subtle"
                size="xs"
                class="mt-1"
              />
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>
