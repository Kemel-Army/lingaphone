<script setup lang="ts">
import { useLeaderboard, type LeaderboardPeriod, type LeaderEntry } from '~/entities/game-profile'
import { UserAvatar } from '~/entities/user'

definePageMeta({ layout: 'dashboard' })

const { fetchLeaderboard } = useLeaderboard()

type PeriodTab = { key: LeaderboardPeriod, label: string, icon: string }
const PERIODS: PeriodTab[] = [
  { key: 'school', label: 'Школа', icon: 'i-lucide-globe' },
  { key: 'week', label: 'Неделя', icon: 'i-lucide-calendar' },
  { key: 'month', label: 'Месяц', icon: 'i-lucide-calendar-range' }
]

const activePeriod = ref<LeaderboardPeriod>('school')
const entries = ref<LeaderEntry[]>([])
const loading = ref(false)

const top3 = computed(() => entries.value.slice(0, 3))
const rest = computed(() => entries.value.slice(3))
const myEntry = computed(() => entries.value.find(e => e.isCurrentUser) ?? null)
const myEntryVisible = computed(() => (myEntry.value?.rank ?? 99) <= entries.value.length && (myEntry.value?.rank ?? 99) <= 3 + rest.value.length)

const podiumOrder = computed(() => {
  // Visual order: 2nd (left), 1st (center), 3rd (right)
  const [first, second, third] = top3.value
  return [second, first, third].filter(Boolean) as LeaderEntry[]
})

const PODIUM_META = [
  { height: 'h-20', crown: 'i-lucide-medal', crownColor: 'text-slate-400', badge: '🥈', label: '2-е место' },
  { height: 'h-28', crown: 'i-lucide-crown', crownColor: 'text-yellow-500', badge: '🥇', label: '1-е место' },
  { height: 'h-14', crown: 'i-lucide-medal', crownColor: 'text-amber-600', badge: '🥉', label: '3-е место' }
]

const load = async () => {
  loading.value = true
  try {
    entries.value = await fetchLeaderboard(activePeriod.value, 50)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(activePeriod, load)

const periodLabel = computed(() => PERIODS.find(p => p.key === activePeriod.value)?.label ?? '')
</script>

<template>
  <UDashboardPage>
    <UDashboardPageHeader
      title="Таблица лидеров"
      description="Сравни свои успехи с другими учениками"
    >
      <template #leading>
        <UIcon
          name="i-lucide-trophy"
          class="size-6 text-yellow-500"
        />
      </template>
    </UDashboardPageHeader>

    <UDashboardPageBody>
      <!-- Period selector -->
      <div class="mb-6 flex gap-2">
        <UButton
          v-for="tab in PERIODS"
          :key="tab.key"
          :icon="tab.icon"
          :label="tab.label"
          :color="activePeriod === tab.key ? 'primary' : 'neutral'"
          :variant="activePeriod === tab.key ? 'solid' : 'outline'"
          size="sm"
          @click="activePeriod = tab.key"
        />
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="space-y-4"
      >
        <div class="flex justify-center gap-4">
          <div
            v-for="i in 3"
            :key="i"
            class="skeleton h-36 w-32 rounded-xl"
          />
        </div>
        <div
          v-for="i in 5"
          :key="i"
          class="skeleton h-14 w-full rounded-lg"
        />
      </div>

      <template v-else-if="entries.length">
        <!-- Podium (top 3) -->
        <div
          v-if="top3.length"
          class="mb-8"
        >
          <div class="flex items-end justify-center gap-3">
            <div
              v-for="(entry, idx) in podiumOrder"
              :key="entry.studentId"
              class="flex flex-col items-center gap-2"
              :class="idx === 1 ? 'order-first sm:order-0' : ''"
            >
              <!-- Crown / medal icon -->
              <UIcon
                :name="PODIUM_META[idx]!.crown"
                class="size-6"
                :class="PODIUM_META[idx]!.crownColor"
              />

              <!-- Avatar -->
              <div class="relative">
                <UserAvatar
                  :name="entry.name"
                  :surname="entry.surname"
                  :src="entry.avatarUrl ?? undefined"
                  :size="idx === 1 ? 'lg' : 'md'"
                  :class="entry.isCurrentUser ? 'ring-2 ring-primary ring-offset-2' : ''"
                />
                <span class="absolute -bottom-1 -right-1 text-base leading-none">
                  {{ PODIUM_META[idx]!.badge }}
                </span>
              </div>

              <!-- Name -->
              <div class="text-center">
                <p
                  class="max-w-28 truncate text-sm font-semibold"
                  :class="entry.isCurrentUser ? 'text-primary' : ''"
                >
                  {{ entry.name }}
                </p>
                <p class="text-xs text-muted">
                  {{ entry.xp.toLocaleString('ru-RU') }} XP
                </p>
              </div>

              <!-- Pedestal -->
              <div
                class="flex w-24 items-center justify-center rounded-t-lg font-bold text-white"
                :class="[
                  PODIUM_META[idx]!.height,
                  idx === 1 ? 'bg-yellow-400' : idx === 0 ? 'bg-slate-400' : 'bg-amber-600'
                ]"
              >
                {{ entry.rank }}
              </div>
            </div>
          </div>
        </div>

        <!-- Rest of the list (4th place and below) -->
        <UCard
          v-if="rest.length"
          class="mb-4"
        >
          <ul class="divide-y divide-(--color-border-muted)">
            <li
              v-for="entry in rest"
              :key="entry.studentId"
              class="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              :class="entry.isCurrentUser ? '-mx-2 rounded-lg bg-primary/5 px-2' : ''"
            >
              <span class="w-6 shrink-0 text-center text-sm font-semibold text-muted">
                {{ entry.rank }}
              </span>

              <UserAvatar
                :name="entry.name"
                :surname="entry.surname"
                :src="entry.avatarUrl ?? undefined"
                size="xs"
              />

              <div class="min-w-0 flex-1">
                <p
                  class="truncate text-sm font-medium"
                  :class="entry.isCurrentUser ? 'text-primary' : ''"
                >
                  {{ entry.name }} {{ entry.surname }}
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <UBadge
                  :label="`Ур. ${entry.level}`"
                  color="primary"
                  variant="soft"
                  size="xs"
                />
                <span class="text-sm font-semibold text-(--color-xp)">
                  {{ entry.xp.toLocaleString('ru-RU') }} XP
                </span>
              </div>
            </li>
          </ul>
        </UCard>

        <!-- My position (if outside visible range) -->
        <UCard
          v-if="myEntry && !myEntryVisible"
          class="border-primary/30 bg-primary/5"
        >
          <div class="flex items-center gap-3">
            <span class="w-6 shrink-0 text-center text-sm font-semibold text-primary">
              {{ myEntry.rank }}
            </span>
            <UserAvatar
              :name="myEntry.name"
              :surname="myEntry.surname"
              :src="myEntry.avatarUrl ?? undefined"
              size="xs"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-primary">
                {{ myEntry.name }} {{ myEntry.surname }}
                <span class="ml-1 text-xs font-normal text-muted">(Вы)</span>
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <UBadge
                :label="`Ур. ${myEntry.level}`"
                color="primary"
                variant="soft"
                size="xs"
              />
              <span class="text-sm font-semibold text-(--color-xp)">
                {{ myEntry.xp.toLocaleString('ru-RU') }} XP
              </span>
            </div>
          </div>
        </UCard>
      </template>

      <!-- Empty state -->
      <EmptyState
        v-else
        icon="i-lucide-trophy"
        title="Пока нет данных"
        :description="`За ${periodLabel.toLowerCase()} ещё никто не набрал XP`"
      />
    </UDashboardPageBody>
  </UDashboardPage>
</template>
