<script setup lang="ts">
import { useAdminStats, type AdminGroup } from '~/entities/admin-stats'

definePageMeta({ layout: 'dashboard' })

const { fetchGroups } = useAdminStats()
const { data: groups, pending } = await useAsyncData('admin-groups', fetchGroups)

const search = ref('')
const filtered = computed((): AdminGroup[] => {
  if (!groups.value) return []
  const q = search.value.toLowerCase().trim()
  if (!q) return groups.value
  return groups.value.filter(g =>
    `${g.name} ${g.teacherName} ${g.level}`.toLowerCase().includes(q)
  )
})

type BadgeColor = 'info' | 'warning' | 'success' | 'error' | 'neutral'
const levelColor = (level: string): BadgeColor => {
  const map: Record<string, BadgeColor> = {
    A1: 'info', A2: 'info',
    S1: 'warning', S2: 'warning',
    B2: 'success',
    F1: 'error', F2: 'error', F3: 'error', F4: 'error'
  }
  return map[level] ?? 'neutral'
}
</script>

<template>
  <div class="p-6 space-y-4 max-w-6xl mx-auto">
    <div>
      <h1 class="text-2xl font-bold">
        Группы
      </h1>
      <p class="text-sm text-muted mt-1">
        {{ groups?.length ?? 0 }} активных групп
      </p>
    </div>

    <UInput
      v-model="search"
      icon="i-lucide-search"
      placeholder="Поиск по названию или учителю..."
      class="max-w-sm"
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
              Группа
            </th>
            <th class="px-4 py-3 font-medium">
              Уровень
            </th>
            <th class="px-4 py-3 font-medium">
              Учитель
            </th>
            <th class="px-4 py-3 font-medium">
              Заполненность
            </th>
            <th class="px-4 py-3 font-medium">
              Создана
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="g in filtered"
            :key="g.id"
            class="border-b border-subtle last:border-0 hover:bg-muted/30 transition-colors"
          >
            <td class="px-4 py-3 font-medium">
              {{ g.name }}
            </td>
            <td class="px-4 py-3">
              <UBadge
                :color="levelColor(g.level)"
                variant="subtle"
                size="sm"
              >
                {{ g.level }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-muted">
              {{ g.teacherName }}
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium">{{ g.studentCount }}</span>
                <span class="text-xs text-muted">/ {{ g.maxStudents }}</span>
                <UProgress
                  :model-value="g.maxStudents > 0 ? Math.round(g.studentCount / g.maxStudents * 100) : 0"
                  size="sm"
                  class="w-16"
                />
              </div>
            </td>
            <td class="px-4 py-3 text-muted">
              {{ new Date(g.createdAt).toLocaleDateString('ru-RU') }}
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td
              colspan="5"
              class="px-4 py-12 text-center text-muted"
            >
              Групп не найдено
            </td>
          </tr>
        </tbody>
      </table>
    </UCard>
  </div>
</template>
