<script setup lang="ts">
import { LessonPage } from '~/widgets/lesson-player'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const moduleId = route.params.moduleId as string
const unitId = computed(() => route.params.unitId as string)
</script>

<template>
  <div class="p-3 sm:p-6 lg:p-8 space-y-4">
    <div class="mx-auto w-full max-w-3xl">
      <UButton
        :to="`/student/book/${moduleId}`"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        size="sm"
        label="К юнитам"
      />
    </div>
    <LessonPage :unit-id="unitId" />
  </div>
</template>
