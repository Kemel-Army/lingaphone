<script setup lang="ts">
import { OnlineLessonsList } from '~/widgets/online-lesson'
import { useOnlineLessons } from '~/features/online-lesson'

definePageMeta({ layout: 'dashboard' })

const { fetchLessons } = useOnlineLessons()
const { data: lessons, pending } = await useAsyncData('student-online', fetchLessons)

const upcoming = computed(() => (lessons.value ?? []).filter(l => !l.isPast))
</script>

<template>
  <div class="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
    <div>
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <UIcon
          name="i-lucide-video"
          class="size-6 text-primary"
        />
        Онлайн-уроки
      </h1>
      <p class="text-sm text-muted mt-0.5">
        Подключайся к занятиям в один клик
      </p>
    </div>
    <div
      v-if="pending"
      class="flex justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-muted"
      />
    </div>
    <OnlineLessonsList
      v-else
      :lessons="upcoming"
    />
  </div>
</template>
