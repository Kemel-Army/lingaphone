<script setup lang="ts">
/**
 * /student/my-path — интерактивная карта приключений по книге.
 * Ученик 1–6 класса видит темы-острова с анимациями и проходит капсулы.
 */
import { useLearningPath, type PathTopic } from '~/entities/learning-path'
import { useStudent } from '~/entities/student'
import { MyPathAdventureMap } from '~/widgets/learning-path'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Мой путь' })

const { studentId, profile } = useStudent()
const { fetchPathTopics } = useLearningPath()

const firstName = computed(() => profile.value?.name ?? null)

const topics = shallowRef<PathTopic[]>([])
const status = ref<'pending' | 'success' | 'error'>('pending')

const loadTopics = async () => {
  status.value = 'pending'
  try {
    const result = await fetchPathTopics(studentId.value, null)
    topics.value = markRaw(JSON.parse(JSON.stringify(result))) as PathTopic[]
    status.value = 'success'
  } catch (e) {
    console.error('[my-path] failed to load topics', e)
    topics.value = []
    status.value = 'error'
  }
}

watch(studentId, () => {
  void loadTopics()
}, { immediate: true })
</script>

<template>
  <div>
    <!-- Loading -->
    <div
      v-if="status === 'pending'"
      class="flex flex-col items-center justify-center gap-5 py-24"
    >
      <FemiMascot
        state="think"
        size="lg"
        line="Строю твой маршрут..."
      />
      <p class="text-sm text-muted">
        Загружаем карту приключений...
      </p>
    </div>

    <!-- Error -->
    <div
      v-else-if="status === 'error'"
      class="flex flex-col items-center justify-center gap-5 py-24 text-center"
    >
      <FemiMascot
        state="confused"
        size="md"
        line="Что-то пошло не так..."
      />
      <p class="text-muted">
        Не удалось загрузить маршрут
      </p>
      <UButton
        icon="i-lucide-refresh-cw"
        variant="outline"
        @click="loadTopics"
      >
        Попробовать снова
      </UButton>
    </div>

    <!-- Empty -->
    <div
      v-else-if="status === 'success' && topics.length === 0"
      class="mx-auto max-w-xl py-16 text-center"
    >
      <div class="mb-8 flex justify-center">
        <FemiMascot
          state="greet"
          size="xl"
          line="Скоро здесь появится твой путь!"
        />
      </div>
      <h2 class="text-2xl font-bold">
        Твой путь ещё готовится
      </h2>
      <p class="mx-auto mt-3 max-w-sm text-muted">
        Учитель скоро добавит темы из учебника — и ты отправишься в путешествие по английскому!
      </p>
    </div>

    <!-- Adventure Map -->
    <MyPathAdventureMap
      v-else
      :topics="topics"
      :grade="null"
      :student-name="firstName"
      age-tier="middle"
    />
  </div>
</template>
