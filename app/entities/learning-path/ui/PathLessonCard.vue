<script setup lang="ts">
import type { PathLesson } from '../model/types'

const props = defineProps<{
  lesson: PathLesson
  index: number
  isNext?: boolean
  topicId: string
}>()

const { t } = useI18n()

const isCompleted = computed(() => !!props.lesson.progress?.completedAt)
const statusLabel = computed(() => {
  if (isCompleted.value) return 'Пройти заново'
  if (props.isNext) return t('learningPath.next')
  return null
})
</script>

<template>
  <NuxtLink :to="`/student/my-path/${topicId}/${lesson.id}`">
    <UCard
      class="transition-all hover:shadow-md cursor-pointer"
      :class="isNext ? 'ring-2 ring-primary/50' : ''"
    >
      <div class="flex items-center gap-4">
        <!-- Icon / Number -->
        <div
          class="flex size-12 shrink-0 items-center justify-center rounded-full text-base font-bold"
          :class="isCompleted
            ? 'bg-primary/10 text-primary'
            : isNext
              ? 'bg-primary/10 text-primary'
              : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'"
        >
          <UIcon
            v-if="isCompleted"
            name="i-lucide-rotate-ccw"
            class="size-5"
          />
          <UIcon
            v-else-if="isNext"
            name="i-lucide-play"
            class="size-5"
          />
          <span v-else>{{ index }}</span>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div
            v-if="statusLabel"
            class="mb-1"
          >
            <UBadge
              :label="statusLabel"
              variant="subtle"
              size="xs"
              :color="isCompleted ? 'neutral' : 'primary'"
            />
          </div>
          <h4 class="font-semibold text-sm">{{ lesson.title }}</h4>
          <p
            v-if="lesson.subtitle"
            class="text-xs text-muted mt-0.5 truncate"
          >
            {{ lesson.subtitle }}
          </p>

          <!-- Meta -->
          <div class="flex items-center gap-3 mt-2 text-xs text-muted">
            <span class="flex items-center gap-1">
              <UIcon
                name="i-lucide-clock"
                class="size-3"
              />
              {{ lesson.durationMinutes }} {{ t('common.minutes') }}
            </span>
            <span class="flex items-center gap-1">
              <UIcon
                name="i-lucide-star"
                class="size-3"
              />
              {{ lesson.xpReward }} XP
            </span>
            <span class="flex items-center gap-1">
              <UIcon
                name="i-lucide-layers"
                class="size-3"
              />
              {{ lesson.layers?.length ?? 11 }} {{ t('learningPath.layers') }}
            </span>
            <span class="flex items-center gap-1">
              <UIcon
                name="i-lucide-target"
                class="size-3"
              />
              {{ lesson.masteryThreshold }}% {{ t('learningPath.mastery') }}
            </span>
          </div>
        </div>

        <!-- Arrow -->
        <UIcon
          name="i-lucide-chevron-right"
          class="size-5 text-muted shrink-0"
        />
      </div>
    </UCard>
  </NuxtLink>
</template>
