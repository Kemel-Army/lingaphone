<script setup lang="ts">
import type { PathTopic } from '../model/types'

const props = defineProps<{
  topic: PathTopic
  index: number
}>()

const { t } = useI18n()

// Tailwind-safe palette lookup for dynamic topic colors.
// Keys match values seeded into PathTopic.color.
const PALETTE: Record<string, { bar: string, progressBar: string, chipBg: string, chipText: string, iconBg: string, iconText: string }> = {
  green: { bar: 'before:bg-green-500', progressBar: 'bg-green-500', chipBg: 'bg-green-500/15', chipText: 'text-green-600 dark:text-green-300', iconBg: 'bg-green-500/15', iconText: 'text-green-600 dark:text-green-300' },
  emerald: { bar: 'before:bg-emerald-500', progressBar: 'bg-emerald-500', chipBg: 'bg-emerald-500/15', chipText: 'text-emerald-600 dark:text-emerald-300', iconBg: 'bg-emerald-500/15', iconText: 'text-emerald-600 dark:text-emerald-300' },
  amber: { bar: 'before:bg-amber-500', progressBar: 'bg-amber-500', chipBg: 'bg-amber-500/15', chipText: 'text-amber-600 dark:text-amber-300', iconBg: 'bg-amber-500/15', iconText: 'text-amber-600 dark:text-amber-300' },
  orange: { bar: 'before:bg-orange-500', progressBar: 'bg-orange-500', chipBg: 'bg-orange-500/15', chipText: 'text-orange-600 dark:text-orange-300', iconBg: 'bg-orange-500/15', iconText: 'text-orange-600 dark:text-orange-300' },
  rose: { bar: 'before:bg-rose-500', progressBar: 'bg-rose-500', chipBg: 'bg-rose-500/15', chipText: 'text-rose-600 dark:text-rose-300', iconBg: 'bg-rose-500/15', iconText: 'text-rose-600 dark:text-rose-300' },
  pink: { bar: 'before:bg-pink-500', progressBar: 'bg-pink-500', chipBg: 'bg-pink-500/15', chipText: 'text-pink-600 dark:text-pink-300', iconBg: 'bg-pink-500/15', iconText: 'text-pink-600 dark:text-pink-300' },
  violet: { bar: 'before:bg-violet-500', progressBar: 'bg-violet-500', chipBg: 'bg-violet-500/15', chipText: 'text-violet-600 dark:text-violet-300', iconBg: 'bg-violet-500/15', iconText: 'text-violet-600 dark:text-violet-300' },
  sky: { bar: 'before:bg-sky-500', progressBar: 'bg-sky-500', chipBg: 'bg-sky-500/15', chipText: 'text-sky-600 dark:text-sky-300', iconBg: 'bg-sky-500/15', iconText: 'text-sky-600 dark:text-sky-300' },
  cyan: { bar: 'before:bg-cyan-500', progressBar: 'bg-cyan-500', chipBg: 'bg-cyan-500/15', chipText: 'text-cyan-600 dark:text-cyan-300', iconBg: 'bg-cyan-500/15', iconText: 'text-cyan-600 dark:text-cyan-300' },
  yellow: { bar: 'before:bg-yellow-500', progressBar: 'bg-yellow-500', chipBg: 'bg-yellow-500/15', chipText: 'text-yellow-600 dark:text-yellow-300', iconBg: 'bg-yellow-500/15', iconText: 'text-yellow-600 dark:text-yellow-300' }
}

const palette = computed(() => PALETTE[props.topic.color] ?? PALETTE.rose!)
const progress = computed(() => props.topic.progress ?? 0)
const isComplete = computed(() => progress.value >= 100)
</script>

<template>
  <NuxtLink
    :to="`/student/my-path/${topic.id}`"
    class="block group"
  >
    <div
      class="relative overflow-hidden rounded-2xl border border-default bg-elevated p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl before:absolute before:left-0 before:top-0 before:h-full before:w-1.5"
      :class="palette.bar"
    >
      <div class="flex items-start gap-4 pl-3">
        <!-- Numbered index chip -->
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm"
          :class="[palette.chipBg, palette.chipText]"
        >
          <UIcon
            v-if="isComplete"
            name="i-lucide-check"
            class="size-5"
          />
          <span v-else>{{ index }}</span>
        </div>

        <!-- Icon chip -->
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-xl"
          :class="[palette.iconBg, palette.iconText]"
        >
          <UIcon
            :name="topic.icon"
            class="size-5"
          />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span
              class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              :class="[palette.chipBg, palette.chipText]"
            >
              {{ t('learningPath.topicN', { n: index }) }}
            </span>
          </div>
          <h3 class="text-base font-semibold truncate text-highlighted">
            {{ topic.name }}
          </h3>
          <p
            v-if="topic.description"
            class="mt-1 text-sm text-muted line-clamp-2"
          >
            {{ topic.description }}
          </p>

          <!-- Meta row -->
          <div class="mt-3 flex items-center gap-4 text-xs text-muted">
            <span class="flex items-center gap-1">
              <UIcon
                name="i-lucide-book-open"
                class="size-3.5"
              />
              {{ topic.lessonsCount ?? 0 }} {{ t('learningPath.lessonsShort') }}
            </span>
            <span class="flex items-center gap-1">
              <UIcon
                name="i-lucide-clock"
                class="size-3.5"
              />
              {{ topic.durationMinutes }} {{ t('common.minutes') }}
            </span>
            <span class="flex items-center gap-1">
              <UIcon
                name="i-lucide-star"
                class="size-3.5"
              />
              {{ topic.totalXp }} XP
            </span>
          </div>

          <!-- Progress bar -->
          <div class="mt-3 flex items-center gap-2">
            <div class="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="palette.progressBar"
                :style="{ width: `${progress}%` }"
              />
            </div>
            <span
              class="text-xs font-semibold tabular-nums"
              :class="palette.chipText"
            >
              {{ progress }}%
            </span>
          </div>
        </div>

        <!-- Arrow -->
        <UIcon
          name="i-lucide-chevron-right"
          class="mt-3 size-5 shrink-0 text-muted transition-transform group-hover:translate-x-1"
        />
      </div>
    </div>
  </NuxtLink>
</template>
