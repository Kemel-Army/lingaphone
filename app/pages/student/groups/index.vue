<script setup lang="ts">
import { useLingafonStudent } from '~/shared/composables/useLingafonStudent'
import type { Database } from '~/shared/types/database.types'

definePageMeta({ layout: 'dashboard' })

type EnglishLevel = Database['public']['Enums']['EnglishLevel']

const { myGroups, upcomingLessons } = useLingafonStudent()

const LEVEL_DESC: Record<EnglishLevel, string> = {
  A1: 'Starter — первые шаги',
  A2: 'Elementary — базовое общение',
  S1: 'Pre-Intermediate — уверенный быт',
  S2: 'Intermediate — свободные диалоги',
  B2: 'Upper-Intermediate — экзаменный уровень',
  F1: 'Advanced — академический',
  F2: 'Advanced+ — углубление',
  F3: 'Proficient — почти носитель',
  F4: 'Mastery — носитель'
}

const WEEKDAY_LONG = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']

const nextLessonByGroup = computed(() => {
  const map: Record<string, string | undefined> = {}
  for (const l of upcomingLessons.value) {
    if (!map[l.groupId]) map[l.groupId] = l.startsAt
  }
  return map
})

const formatDateTime = (iso: string) => new Date(iso).toLocaleString('ru-RU', {
  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
})
</script>

<template>
  <div class="relative">
    <!-- Background blob -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden"
    >
      <div class="absolute -top-20 left-1/4 size-80 rounded-full bg-primary-400/15 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-6xl mx-auto">
      <!-- Hero header -->
      <header class="space-y-2">
        <p class="text-sm font-bold text-primary uppercase tracking-wider">
          👥 Twoja команда обучения
        </p>
        <h1 class="text-3xl sm:text-4xl font-black tracking-tight">
          Мои группы
        </h1>
        <p class="text-sm text-muted">
          Группы, в которых ты сейчас занимаешься — расписание, педагоги, состав
        </p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <article
          v-for="g in myGroups"
          :key="g.id"
          class="group relative rounded-3xl border border-default bg-default overflow-hidden hover:border-primary-300 hover:shadow-xl transition-all duration-300"
        >
          <!-- Decorative ribbon -->
          <div
            aria-hidden="true"
            class="absolute -top-12 -right-12 size-40 rounded-full bg-linear-to-br from-primary-400/20 to-sky-600/20 blur-2xl group-hover:from-primary-400/30 transition-all"
          />

          <div class="relative p-6 space-y-5">
            <!-- Header: level + name + badges -->
            <div>
              <div class="flex items-center gap-2 flex-wrap mb-2">
                <div class="px-3 py-1 rounded-full bg-linear-to-r from-primary-500 to-sky-700 text-white text-sm font-black tracking-wider shadow-md">
                  {{ g.level }}
                </div>
                <UBadge
                  :label="g.branch.kind === 'ONLINE' ? '🌐 Online' : '📍 Offline'"
                  :color="g.branch.kind === 'ONLINE' ? 'info' : 'success'"
                  variant="subtle"
                  size="sm"
                />
              </div>
              <h2 class="text-2xl font-black tracking-tight">
                {{ g.name }}
              </h2>
              <p class="text-sm text-muted mt-1">
                {{ LEVEL_DESC[g.level] }}
              </p>
            </div>

            <!-- Teacher card -->
            <div class="flex items-center gap-4 rounded-2xl bg-elevated p-4">
              <div class="size-14 shrink-0 rounded-2xl bg-linear-to-br from-primary-400 to-sky-700 text-white font-black text-xl flex items-center justify-center shadow-md group-hover:rotate-3 transition-transform">
                {{ g.teacher.name.charAt(0) }}{{ g.teacher.surname.charAt(0) }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[10px] uppercase tracking-wider text-muted font-bold">
                  Твой педагог
                </p>
                <p class="font-bold truncate">
                  {{ g.teacher.name }} {{ g.teacher.surname }}
                </p>
                <p class="text-xs text-muted">
                  {{ g.teacher.yearsOfExperience }} лет опыта
                </p>
              </div>
            </div>

            <!-- Branch + capacity -->
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl bg-elevated p-3">
                <p class="text-[10px] uppercase tracking-wider text-muted font-bold">
                  Филиал
                </p>
                <p class="font-bold mt-1 text-sm flex items-center gap-1.5">
                  <UIcon
                    :name="g.branch.kind === 'ONLINE' ? 'i-lucide-globe' : 'i-lucide-map-pin'"
                    class="size-4 text-primary shrink-0"
                  />
                  <span class="truncate">{{ g.branch.name }}</span>
                </p>
                <p
                  v-if="g.branch.address"
                  class="text-xs text-muted mt-0.5"
                >
                  {{ g.branch.address }}
                </p>
              </div>
              <div class="rounded-xl bg-elevated p-3">
                <p class="text-[10px] uppercase tracking-wider text-muted font-bold">
                  В группе
                </p>
                <p class="font-black text-lg mt-1 tabular-nums">
                  {{ g.studentsCount }}<span class="text-dimmed text-sm">/{{ g.maxStudents }}</span>
                </p>
                <div class="mt-1.5 h-1.5 rounded-full bg-default overflow-hidden">
                  <div
                    class="h-full bg-linear-to-r from-primary-400 to-sky-700 transition-all"
                    :style="{ width: `${(g.studentsCount / g.maxStudents) * 100}%` }"
                  />
                </div>
              </div>
            </div>

            <!-- Schedule -->
            <div>
              <p class="text-[10px] uppercase tracking-wider text-muted font-bold mb-2 flex items-center gap-1.5">
                <UIcon
                  name="i-lucide-calendar"
                  class="size-3.5"
                />
                Расписание
              </p>
              <div class="space-y-1.5">
                <div
                  v-for="(slot, idx) in g.schedule"
                  :key="idx"
                  class="flex items-center justify-between text-sm rounded-lg px-3 py-2 bg-elevated"
                >
                  <span class="font-medium">{{ WEEKDAY_LONG[slot.weekday] }}</span>
                  <span class="font-mono font-bold text-primary">{{ slot.startTime }} · {{ slot.durationMin }} мин</span>
                </div>
              </div>
            </div>

            <!-- Next lesson CTA -->
            <div
              v-if="nextLessonByGroup[g.id]"
              class="rounded-2xl bg-linear-to-r from-primary-500 to-sky-700 px-4 py-3 text-white flex items-center justify-between shadow-md"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <UIcon
                  name="i-lucide-clock"
                  class="size-5 shrink-0"
                />
                <div class="min-w-0">
                  <p class="text-[10px] uppercase tracking-wider opacity-80 font-bold">
                    Ближайший урок
                  </p>
                  <p class="font-bold truncate text-sm">
                    {{ formatDateTime(nextLessonByGroup[g.id]!) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>

      <!-- Empty state -->
      <div
        v-if="myGroups.length === 0"
        class="rounded-3xl border-2 border-dashed border-default p-12 text-center"
      >
        <div class="size-16 mx-auto rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
          <UIcon
            name="i-lucide-users"
            class="size-8 text-primary"
          />
        </div>
        <p class="mt-4 font-bold text-lg">
          Ты пока не в группе
        </p>
        <p class="text-sm text-muted mt-1">
          Пройди тест уровня и запишись на пробный урок
        </p>
      </div>
    </div>
  </div>
</template>
