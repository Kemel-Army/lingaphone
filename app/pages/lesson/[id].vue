<script setup lang="ts">
import { JitsiRoom } from '~/widgets/online-lesson'
import { useOnlineLessons, lessonRoomName } from '~/features/online-lesson'
import { useCurrentUser } from '~/entities/user'

definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const lessonId = computed(() => route.params.id as string)

const { fullName, homeRoute } = useCurrentUser()
const { fetchLesson } = useOnlineLessons()
const { data: lesson, pending } = await useAsyncData(
  () => `lesson-room-${lessonId.value}`,
  () => fetchLesson(lessonId.value)
)

const room = computed(() => lessonRoomName(lessonId.value))
const leave = () => {
  router.push(homeRoute.value)
}
</script>

<template>
  <div class="h-dvh flex flex-col bg-slate-950 text-white">
    <div class="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 shrink-0">
      <UButton
        icon="i-lucide-arrow-left"
        variant="ghost"
        color="neutral"
        size="sm"
        @click="leave"
      />
      <div class="min-w-0">
        <p class="font-semibold text-sm truncate">
          {{ lesson?.topic || 'Онлайн-урок' }}
        </p>
        <p
          v-if="lesson?.groupName"
          class="text-xs text-white/60"
        >
          {{ lesson.groupName }}
        </p>
      </div>
    </div>

    <div class="flex-1 min-h-0">
      <div
        v-if="pending"
        class="h-full grid place-items-center"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="size-8 animate-spin text-white/60"
        />
      </div>
      <div
        v-else-if="!lesson"
        class="h-full grid place-items-center"
      >
        <div class="text-center">
          <UIcon
            name="i-lucide-lock"
            class="size-10 text-white/40 mx-auto mb-2"
          />
          <p class="text-white/70">
            Нет доступа к этому уроку
          </p>
          <UButton
            class="mt-4"
            color="neutral"
            @click="leave"
          >
            На главную
          </UButton>
        </div>
      </div>
      <JitsiRoom
        v-else
        :room="room"
        :display-name="fullName || 'Ученик'"
        :subject="lesson.topic"
        @left="leave"
      />
    </div>
  </div>
</template>
