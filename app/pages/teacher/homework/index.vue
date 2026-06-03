<script setup lang="ts">
import { useTeacher, type TeacherHomework } from '~/entities/teacher'

definePageMeta({ layout: 'dashboard' })

const { fetchMyHomework, fetchMyGroups } = useTeacher()

const [{ data: homework, pending }, { data: groups }] = await Promise.all([
  useAsyncData('teacher-homework', fetchMyHomework),
  useAsyncData('teacher-groups-hw', fetchMyGroups)
])

const selectedGroup = ref('')

const filtered = computed((): TeacherHomework[] => {
  if (!homework.value) return []
  let list = homework.value
  if (selectedGroup.value) list = list.filter(h => h.groupId === selectedGroup.value)
  return list
})

const groupOptions = computed(() => [
  { value: '', label: 'Все группы' },
  ...(groups.value ?? []).map(g => ({ value: g.id, label: g.name }))
])

const formatLabel: Record<string, string> = {
  TEST: 'Тест', INPUT: 'Ввод', TEXT: 'Текст', ORAL: 'Устный', FILE: 'Файл', INTERACTIVE: 'Интерактив'
}

const formatColor = (f: string): 'info' | 'warning' | 'success' | 'neutral' | 'error' => {
  const map: Record<string, 'info' | 'warning' | 'success' | 'neutral' | 'error'> = {
    TEST: 'info', INPUT: 'neutral', TEXT: 'neutral', ORAL: 'warning', FILE: 'neutral', INTERACTIVE: 'success'
  }
  return map[f] ?? 'neutral'
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })

const isPast = (d: string) => new Date(d) < new Date()
</script>

<template>
  <div class="p-6 space-y-4 max-w-6xl mx-auto">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">
          Задания
        </h1>
        <p class="text-sm text-muted mt-1">
          {{ filtered.length }} заданий
        </p>
      </div>
      <UButton
        to="/teacher/homework/create"
        icon="i-lucide-plus"
      >
        Создать ДЗ
      </UButton>
    </div>

    <USelect
      v-model="selectedGroup"
      :items="groupOptions"
      class="max-w-xs"
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

    <UCard
      v-else
      :ui="{ body: 'p-0' }"
    >
      <table class="w-full text-sm">
        <thead class="border-b border-subtle">
          <tr class="text-left text-xs text-muted uppercase tracking-wide">
            <th class="px-4 py-3 font-medium">
              Задание
            </th>
            <th class="px-4 py-3 font-medium">
              Формат
            </th>
            <th class="px-4 py-3 font-medium">
              Группа
            </th>
            <th class="px-4 py-3 font-medium">
              Сдано
            </th>
            <th class="px-4 py-3 font-medium">
              Проверено
            </th>
            <th class="px-4 py-3 font-medium">
              Срок
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="h in (filtered as TeacherHomework[])"
            :key="h.id"
            class="border-b border-subtle last:border-0 hover:bg-muted/30 transition-colors"
          >
            <td class="px-4 py-3">
              <p class="font-medium">
                {{ h.title }}
              </p>
              <p class="text-xs text-muted">
                {{ h.lessonTopic }}
              </p>
            </td>
            <td class="px-4 py-3">
              <UBadge
                :color="formatColor(h.format)"
                variant="subtle"
                size="sm"
              >
                {{ formatLabel[h.format] ?? h.format }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-muted">
              {{ h.groupName }}
            </td>
            <td class="px-4 py-3">
              <span :class="h.submittedCount > 0 ? 'text-orange-500 font-medium' : 'text-muted'">
                {{ h.submittedCount }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span :class="h.checkedCount > 0 ? 'text-green-600 font-medium' : 'text-muted'">
                {{ h.checkedCount }}
              </span>
            </td>
            <td
              class="px-4 py-3"
              :class="isPast(h.dueAt) ? 'text-error' : 'text-muted'"
            >
              {{ formatDate(h.dueAt) }}
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td
              colspan="6"
              class="px-4 py-12 text-center text-muted"
            >
              Заданий не найдено
            </td>
          </tr>
        </tbody>
      </table>
    </UCard>
  </div>
</template>
