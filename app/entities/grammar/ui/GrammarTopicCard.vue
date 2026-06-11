<script setup lang="ts">
import type { GrammarTopicWithProgress } from '../model/types'
import { MASTERY_LABEL } from '../model/types'

const props = defineProps<{
  topic: GrammarTopicWithProgress
}>()

const mastery = computed(() => props.topic.progress?.mastery ?? 0)
const masteryInfo = computed(() => MASTERY_LABEL(mastery.value))
const masteryPercent = computed(() => Math.round(mastery.value * 100))
const attempts = computed(() => props.topic.progress?.attempts ?? 0)
</script>

<template>
  <NuxtLink
    :to="`/student/grammar/${topic.slug}`"
    class="group relative flex flex-col gap-3 rounded-2xl border bg-default p-4 transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
  >
    <!-- Status icon top-right -->
    <div class="absolute right-3 top-3">
      <UIcon
        :name="masteryInfo.icon"
        class="size-4 transition-transform group-hover:scale-110"
        :class="masteryInfo.color"
      />
    </div>

    <!-- Title -->
    <div class="pr-6">
      <p class="text-sm font-bold leading-snug text-default">
        {{ topic.title }}
      </p>
      <p
        v-if="attempts > 0"
        class="mt-0.5 text-xs text-muted"
      >
        {{ attempts }} {{ attempts === 1 ? 'попытка' : attempts < 5 ? 'попытки' : 'попыток' }}
      </p>
    </div>

    <!-- Mastery bar -->
    <div class="space-y-1">
      <div class="flex items-center justify-between">
        <span
          class="text-xs font-medium"
          :class="masteryInfo.color"
        >
          {{ masteryInfo.label }}
        </span>
        <span
          v-if="mastery > 0"
          class="text-xs tabular-nums text-muted"
        >
          {{ masteryPercent }}%
        </span>
      </div>
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-elevated">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="mastery >= 1.0
            ? 'bg-yellow-400'
            : mastery >= 0.7
              ? 'bg-emerald-500'
              : mastery >= 0.35
                ? 'bg-sky-500'
                : 'bg-transparent'"
          :style="{ width: `${masteryPercent}%` }"
        />
      </div>
    </div>
  </NuxtLink>
</template>
