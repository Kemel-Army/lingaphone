<script setup lang="ts">
import type { Achievement } from '../model/types'
import { ACHIEVEMENT_TIER_COLORS } from '~/shared/types/common'

defineProps<{
  achievement: Achievement
  earned?: boolean
}>()

const tierBorder = (tier: string) => {
  const map: Record<string, string> = {
    BRONZE: 'border-amber-500/40',
    SILVER: 'border-gray-400/40',
    GOLD: 'border-yellow-500/40',
    PLATINUM: 'border-cyan-500/40',
    COSMOS: 'border-purple-500/40'
  }
  return map[tier] ?? 'border-default'
}
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-xl border p-3 transition"
    :class="[
      earned ? tierBorder(achievement.tier) + ' bg-primary/5' : 'border-default opacity-50 grayscale',
      achievement.isHidden && !earned ? 'blur-sm' : ''
    ]"
  >
    <div
      class="flex size-10 shrink-0 items-center justify-center rounded-full"
      :class="earned ? 'bg-primary/10' : 'bg-elevated'"
    >
      <UIcon
        :name="achievement.isHidden && !earned ? 'i-lucide-help-circle' : (achievement.icon || 'i-lucide-award')"
        class="size-5"
        :class="earned ? 'text-primary' : 'text-muted'"
      />
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-1.5">
        <p class="text-sm font-semibold truncate">
          {{ achievement.isHidden && !earned ? '???' : achievement.name }}
        </p>
        <span
          v-if="achievement.tier"
          class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
          :class="ACHIEVEMENT_TIER_COLORS[achievement.tier as keyof typeof ACHIEVEMENT_TIER_COLORS]"
        >
          {{ achievement.tier }}
        </span>
      </div>
      <p class="text-xs text-muted truncate">
        {{ achievement.isHidden && !earned ? 'Скрытое достижение' : achievement.description }}
      </p>
    </div>
    <div class="shrink-0 text-right space-y-0.5">
      <p
        v-if="achievement.xpReward"
        class="text-xs font-medium"
        :class="earned ? 'text-primary' : 'text-muted'"
      >
        +{{ achievement.xpReward }} XP
      </p>
      <p
        v-if="achievement.gemReward"
        class="text-xs font-medium text-cyan-500"
      >
        +{{ achievement.gemReward }}
        <UIcon
          name="i-lucide-gem"
          class="inline-block size-3"
        />
      </p>
    </div>
  </div>
</template>
