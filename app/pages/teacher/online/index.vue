<script setup lang="ts">
import { OnlineLessonsList } from '~/widgets/online-lesson'
import { useOnlineLessons } from '~/features/online-lesson'
import { CreateLessonModal } from '~/features/create-lesson'
import { useTeacher } from '~/entities/teacher'

definePageMeta({ layout: 'dashboard' })

const { fetchLessons } = useOnlineLessons()
const { fetchMyGroups } = useTeacher()

const { data: lessons, pending, refresh } = await useAsyncData('teacher-online', fetchLessons)
const { data: groups } = await useAsyncData('teacher-online-groups', fetchMyGroups)

const upcoming = computed(() => (lessons.value ?? []).filter(l => !l.isPast))

const createOpen = ref(false)
</script>

<template>
  <div class="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <UIcon
            name="i-lucide-video"
            class="size-6 text-primary"
          />
          Онлайн-уроки
        </h1>
        <p class="text-sm text-muted mt-0.5">
          Начните занятие — ученики подключатся из своего кабинета
        </p>
      </div>

      <UButton
        icon="i-lucide-plus"
        :disabled="!groups?.length"
        @click="createOpen = true"
      >
        Создать урок
      </UButton>
    </div>

    <UAlert
      v-if="groups && !groups.length"
      color="warning"
      variant="subtle"
      icon="i-lucide-info"
      title="Нет групп"
      description="Уроки создаются для ваших групп. Обратитесь к администратору, чтобы вас назначили на группу."
    />

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
      schedule-hint-to="/teacher/schedule"
    />

    <p class="text-xs text-muted">
      Нужно позвать гостя без аккаунта (пробный урок)? Откройте комнату урока и
      нажмите «Ссылка для гостя».
    </p>

    <CreateLessonModal
      v-model:open="createOpen"
      :groups="groups ?? []"
      @created="refresh"
    />
  </div>
</template>
