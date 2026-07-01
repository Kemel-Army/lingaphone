<script setup lang="ts">
defineProps<{
  overallProgress: number
  completedLessons: number
  totalLessons: number
  totalXp: number
  topicsRemaining: number
}>()

const { t } = useI18n()
</script>

<template>
  <div class="grid gap-4 grid-cols-2 sm:grid-cols-4">
    <StatCard
      :title="t('learningPath.overallProgress')"
      :value="`${overallProgress}%`"
      icon="i-lucide-target"
      color="primary"
    />
    <StatCard
      :title="t('learningPath.lessonsCompleted')"
      :value="`${completedLessons}/${totalLessons}`"
      icon="i-lucide-check-circle"
      color="success"
    />
    <StatCard
      :title="t('learningPath.xpEarned')"
      :value="`${totalXp}`"
      icon="i-lucide-star"
      color="warning"
      suffix="XP"
    />
    <StatCard
      :title="t('learningPath.topicsToStudy')"
      :value="String(topicsRemaining)"
      icon="i-lucide-book-open"
      color="info"
    />
  </div>
</template>
