<script setup lang="ts">
import { useTeacher, type TeacherStudent } from '~/entities/teacher'

definePageMeta({ layout: 'dashboard' })

const { fetchMyStudents } = useTeacher()
const { data: students, pending } = await useAsyncData('teacher-students', fetchMyStudents)

const search = ref('')

const filtered = computed((): TeacherStudent[] => {
  if (!students.value) return []
  const q = search.value.toLowerCase().trim()
  if (!q) return students.value
  return students.value.filter(s =>
    `${s.name} ${s.surname} ${s.email} ${s.groupName}`.toLowerCase().includes(q)
  )
})

const levelGradient = (level: string): string => {
  const map: Record<string, string> = {
    A1: 'from-sky-400 to-blue-500',
    A2: 'from-blue-400 to-indigo-500',
    S1: 'from-amber-400 to-orange-500',
    S2: 'from-orange-400 to-red-500',
    B2: 'from-emerald-400 to-teal-500',
    F1: 'from-red-400 to-rose-500'
  }
  return map[level] ?? 'from-neutral-400 to-neutral-500'
}

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('ru-RU') : 'Нет данных'
</script>

<template>
  <div class="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">
          Мои ученики
        </h1>
        <p class="text-sm text-muted mt-0.5">
          {{ students?.length ?? 0 }} учеников
        </p>
      </div>
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Поиск..."
        class="max-w-xs"
      />
    </div>

    <!-- Loading -->
    <div
      v-if="pending"
      class="flex justify-center py-20"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <!-- Empty -->
    <div
      v-else-if="!filtered.length"
      class="rounded-3xl border-2 border-dashed border-default p-16 text-center"
    >
      <UIcon
        name="i-lucide-users"
        class="size-10 text-muted mx-auto"
      />
      <p class="mt-3 font-bold">
        {{ search ? 'Ничего не найдено' : 'Учеников пока нет' }}
      </p>
      <p class="text-sm text-muted mt-1">
        {{ search ? 'Попробуйте другой запрос' : 'Ученики появятся после добавления в группу' }}
      </p>
    </div>

    <!-- Cards grid -->
    <div
      v-else
      class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <NuxtLink
        v-for="s in filtered"
        :key="s.studentId"
        :to="`/teacher/students/${s.studentId}`"
        class="block group"
      >
        <div class="rounded-2xl border border-default bg-default overflow-hidden hover:shadow-lg hover:-translate-y-1 hover:border-primary/40 transition-all duration-200 h-full flex flex-col">
          <!-- Thin level accent -->
          <div
            class="h-1.5 bg-linear-to-r shrink-0"
            :class="levelGradient(s.level)"
          />

          <div class="p-4 flex flex-col gap-3 flex-1">
            <!-- Avatar + name -->
            <div class="flex items-center gap-3">
              <UAvatar
                :src="s.avatarUrl ?? undefined"
                :alt="`${s.name} ${s.surname}`"
                size="lg"
                class="shrink-0"
              />
              <div class="min-w-0 flex-1">
                <p class="font-bold text-sm truncate group-hover:text-primary transition-colors">
                  {{ s.name }} {{ s.surname }}
                </p>
                <p class="text-xs text-muted truncate">
                  {{ s.email }}
                </p>
              </div>
              <span
                class="shrink-0 inline-flex items-center rounded-full bg-linear-to-r px-2 py-0.5 text-xs font-bold text-white"
                :class="levelGradient(s.level)"
              >
                {{ s.level }}
              </span>
            </div>

            <!-- Group -->
            <div class="flex items-center gap-1.5 text-xs">
              <UIcon
                name="i-lucide-layers"
                class="size-3.5 text-muted shrink-0"
              />
              <span class="truncate text-muted">{{ s.groupName || 'Без группы' }}</span>
            </div>

            <!-- Stats row -->
            <div class="grid grid-cols-3 gap-2 mt-auto pt-3 border-t border-subtle">
              <div class="text-center">
                <p class="text-sm font-black tabular-nums">
                  {{ s.totalXp.toLocaleString() }}
                </p>
                <p class="text-[10px] text-muted uppercase tracking-wide">
                  XP
                </p>
              </div>
              <div class="text-center border-x border-subtle">
                <div class="flex items-center justify-center gap-0.5">
                  <UIcon
                    name="i-lucide-flame"
                    class="size-3.5 text-orange-400"
                  />
                  <p class="text-sm font-black tabular-nums">
                    {{ s.dailyStreak }}
                  </p>
                </div>
                <p class="text-[10px] text-muted uppercase tracking-wide">
                  Стрик
                </p>
              </div>
              <div class="text-center">
                <p class="text-sm font-black tabular-nums text-green-600 dark:text-green-400">
                  {{ s.totalEarnings > 0 ? s.totalEarnings.toLocaleString() + '₸' : '—' }}
                </p>
                <p class="text-[10px] text-muted uppercase tracking-wide">
                  Заработал
                </p>
              </div>
            </div>

            <!-- Last active -->
            <div class="flex items-center justify-between text-xs">
              <span class="text-muted">Активность</span>
              <span :class="s.lastActiveDate ? 'font-medium' : 'text-muted'">{{ formatDate(s.lastActiveDate) }}</span>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
