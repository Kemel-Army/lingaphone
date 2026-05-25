<script setup lang="ts">
import { STREAK_VISUAL_MILESTONES } from '~/shared/types/common'

/**
 * Visual streak calendar showing last 7 days + flame tier.
 */
const props = defineProps<{
  streak: number
  longestStreak?: number
  lastActiveDate?: string | null
}>()

const flameTier = computed(() => {
  return STREAK_VISUAL_MILESTONES.find(
    m => props.streak >= m.min && props.streak <= m.max
  ) ?? STREAK_VISUAL_MILESTONES[0]
})

/** Generate last 7 days with active/inactive state */
const weekDays = computed(() => {
  const days: Array<{ label: string, active: boolean }> = []
  const today = new Date()
  const lastActive = props.lastActiveDate ? new Date(props.lastActiveDate) : null

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dayStr = d.toISOString().slice(0, 10)
    const dayLabel = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d.getDay()]!

    // A day is "active" if it falls within the current streak range
    let active = false
    if (lastActive && props.streak > 0) {
      const streakStart = new Date(lastActive)
      streakStart.setDate(streakStart.getDate() - (props.streak - 1))
      const streakStartStr = streakStart.toISOString().slice(0, 10)
      const lastStr = lastActive.toISOString().slice(0, 10)
      active = dayStr >= streakStartStr && dayStr <= lastStr
    }

    days.push({ label: dayLabel!, active })
  }
  return days
})
</script>

<template>
  <div class="space-y-3">
    <!-- Flame tier badge -->
    <div class="flex items-center gap-3">
      <div
        class="flex size-12 items-center justify-center rounded-xl"
        :class="flameTier!.color.replace('text-', 'bg-').replace(/\d+/, '100') + '/20'"
      >
        <UIcon
          :name="flameTier!.icon"
          class="size-6"
          :class="flameTier!.color"
        />
      </div>
      <div>
        <p class="font-bold text-lg">
          {{ streak }} {{ streak === 1 ? 'день' : 'дней' }}
        </p>
        <p class="text-xs text-muted">
          {{ flameTier!.label }}
          <span v-if="longestStreak"> · Рекорд: {{ longestStreak }}</span>
        </p>
      </div>
    </div>

    <!-- Week calendar -->
    <div class="flex gap-1.5">
      <div
        v-for="(day, idx) in weekDays"
        :key="idx"
        class="flex flex-1 flex-col items-center gap-1"
      >
        <div
          class="size-8 flex items-center justify-center rounded-full text-xs font-medium transition-colors"
          :class="day.active
            ? 'bg-primary text-white'
            : 'bg-elevated text-muted'"
        >
          <UIcon
            v-if="day.active"
            name="i-lucide-flame"
            class="size-4"
          />
          <span v-else>{{ idx + 1 }}</span>
        </div>
        <span class="text-[10px] text-muted">{{ day.label }}</span>
      </div>
    </div>
  </div>
</template>
