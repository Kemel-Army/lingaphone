<script setup lang="ts">
/**
 * StudentLeaderboard — XP leaderboard table with avatars, names, levels.
 */
import { UserAvatar } from '~/entities/user'

interface LeaderEntry {
  rank: number
  name: string
  surname?: string
  avatarUrl?: string
  xp: number
  level: number
  isCurrentUser?: boolean
}

defineProps<{
  entries: LeaderEntry[]
  loading?: boolean
}>()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-trophy"
          class="size-5 text-[var(--color-xp)]"
        />
        <h3 class="text-title">
          Таблица лидеров
        </h3>
      </div>
    </template>

    <div
      v-if="loading"
      class="space-y-3"
    >
      <div
        v-for="i in 5"
        :key="i"
        class="skeleton h-12 w-full"
      />
    </div>

    <ul
      v-else-if="entries.length"
      class="divide-y divide-[var(--color-border-muted)]"
    >
      <li
        v-for="entry in entries"
        :key="entry.rank"
        class="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
        :class="entry.isCurrentUser ? 'rounded-lg bg-primary/5 px-2 -mx-2' : ''"
      >
        <!-- Rank -->
        <span
          class="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          :class="entry.rank <= 3 ? 'bg-[var(--color-xp-soft)] text-[var(--color-xp)]' : 'text-[var(--color-text-muted)]'"
        >
          {{ entry.rank }}
        </span>

        <!-- Avatar -->
        <UserAvatar
          :name="entry.name"
          :surname="entry.surname ?? ''"
          :src="entry.avatarUrl"
          size="xs"
        />

        <!-- Name -->
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-[var(--color-text-primary)]">
            {{ entry.name }} {{ entry.surname ?? '' }}
          </p>
        </div>

        <!-- Level -->
        <UBadge
          :label="`Ур. ${entry.level}`"
          color="primary"
          variant="soft"
          size="xs"
        />

        <!-- XP -->
        <span class="shrink-0 text-sm font-semibold text-[var(--color-xp)]">
          {{ entry.xp.toLocaleString('ru-RU') }} XP
        </span>
      </li>
    </ul>

    <EmptyState
      v-else
      icon="i-lucide-trophy"
      title="Пока нет данных"
      description="Таблица лидеров появится когда ученики наберут XP"
    />
  </UCard>
</template>
