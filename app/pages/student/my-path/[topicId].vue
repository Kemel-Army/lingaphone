<script setup lang="ts">
/**
 * /student/my-path/[topicId] — тема с уроками-капсулами.
 */
import { useLearningPath, type PathTopic } from '~/entities/learning-path'
import { useStudent } from '~/entities/student'
import { TopicDetailWidget } from '~/widgets/learning-path'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const topicId = computed(() => route.params.topicId as string)
const lessonId = computed(() => {
  const raw = route.params.lessonId
  return typeof raw === 'string' ? raw : null
})
const isLessonRoute = computed(() => !!lessonId.value)

const { studentId } = useStudent()
const { fetchPathTopic } = useLearningPath()

const topic = shallowRef<PathTopic | null>(null)
const status = ref<'pending' | 'success' | 'error'>('pending')

const loadTopic = async () => {
  if (isLessonRoute.value) {
    topic.value = null
    status.value = 'success'
    return
  }
  status.value = 'pending'
  try {
    const result = await fetchPathTopic(topicId.value, studentId.value)
    topic.value = result ? markRaw(JSON.parse(JSON.stringify(result))) as PathTopic : null
    status.value = 'success'
  } catch (e) {
    console.error('[my-path/topic] failed to load topic', e)
    topic.value = null
    status.value = 'error'
  }
}

watch([topicId, studentId, isLessonRoute], () => {
  void loadTopic()
}, { immediate: true })

useHead({ title: computed(() => topic.value?.name ?? 'Тема') })
</script>

<template>
  <div v-if="isLessonRoute">
    <NuxtPage />
  </div>

  <div v-else>
    <div
      v-if="status === 'pending'"
      class="flex flex-col items-center justify-center gap-4 py-20"
    >
      <FemiMascot
        state="think"
        size="lg"
        line="Загружаю тему..."
      />
    </div>

    <div
      v-else-if="status === 'error'"
      class="flex flex-col items-center justify-center gap-5 py-20 text-center"
    >
      <FemiMascot
        state="confused"
        size="md"
        line="Что-то пошло не так..."
      />
      <UButton
        icon="i-lucide-refresh-cw"
        variant="outline"
        @click="loadTopic"
      >
        Попробовать снова
      </UButton>
    </div>

    <div
      v-else-if="!topic"
      class="py-20 text-center text-muted"
    >
      Тема не найдена.
    </div>

    <TopicDetailWidget
      v-else
      :topic="topic"
    />
  </div>
</template>
