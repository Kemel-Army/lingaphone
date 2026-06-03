<script setup lang="ts">
import { useAdminStats, type AdminTeacher } from '~/entities/admin-stats'

definePageMeta({ layout: 'dashboard' })

const { fetchTeachers } = useAdminStats()
const { data: teachers, pending } = await useAsyncData('admin-teachers', fetchTeachers)

const search = ref('')
const filtered = computed((): AdminTeacher[] => {
  if (!teachers.value) return []
  const q = search.value.toLowerCase().trim()
  if (!q) return teachers.value
  return teachers.value.filter(t =>
    `${t.name} ${t.surname} ${t.email}`.toLowerCase().includes(q)
  )
})
</script>

<template>
  <div class="p-6 space-y-4 max-w-6xl mx-auto">
    <div>
      <h1 class="text-2xl font-bold">
        Учителя
      </h1>
      <p class="text-sm text-muted mt-1">
        {{ teachers?.length ?? 0 }} зарегистрировано
      </p>
    </div>

    <UInput
      v-model="search"
      icon="i-lucide-search"
      placeholder="Поиск по имени или email..."
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
              Учитель
            </th>
            <th class="px-4 py-3 font-medium">
              Групп
            </th>
            <th class="px-4 py-3 font-medium">
              Учеников
            </th>
            <th class="px-4 py-3 font-medium">
              Рейтинг
            </th>
            <th class="px-4 py-3 font-medium">
              Опыт
            </th>
            <th class="px-4 py-3 font-medium">
              На платформе
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="t in filtered"
            :key="t.id"
            class="border-b border-subtle last:border-0 hover:bg-muted/30 transition-colors"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <UAvatar
                  :src="t.avatarUrl ?? undefined"
                  :alt="`${t.name} ${t.surname}`"
                  size="sm"
                />
                <div>
                  <p class="font-medium">
                    {{ t.name }} {{ t.surname }}
                  </p>
                  <p class="text-xs text-muted">
                    {{ t.email }}
                  </p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <UBadge
                color="info"
                variant="subtle"
                size="sm"
              >
                {{ t.groupCount }}
              </UBadge>
            </td>
            <td class="px-4 py-3 font-medium">
              {{ t.studentCount }}
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-1">
                <UIcon
                  name="i-lucide-star"
                  class="size-4 text-yellow-500"
                />
                <span>{{ t.rating > 0 ? t.rating.toFixed(1) : '—' }}</span>
                <span
                  v-if="t.reviewCount > 0"
                  class="text-xs text-muted"
                >({{ t.reviewCount }})</span>
              </div>
            </td>
            <td class="px-4 py-3 text-muted">
              {{ t.yearsOfExperience != null ? `${t.yearsOfExperience} лет` : '—' }}
            </td>
            <td class="px-4 py-3 text-muted">
              {{ new Date(t.createdAt).toLocaleDateString('ru-RU') }}
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td
              colspan="6"
              class="px-4 py-12 text-center text-muted"
            >
              Учителей не найдено
            </td>
          </tr>
        </tbody>
      </table>
    </UCard>
  </div>
</template>
