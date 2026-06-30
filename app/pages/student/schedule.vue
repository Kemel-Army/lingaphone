<script setup lang="ts">
import { useLingafonStudent, type StudentGroup } from '~/shared/composables/useLingafonStudent'
import type { GridLesson } from '~/shared/ui/WeekScheduleGrid.vue'

definePageMeta({ layout: 'dashboard' })

const { allLessons, myGroups } = useLingafonStudent()

const groupById = computed(() => {
  const map: Record<string, StudentGroup> = {}
  for (const g of myGroups.value) map[g.id] = g
  return map
})

// All my lessons mapped to the grid shape (group name resolved from my groups).
const gridLessons = computed<GridLesson[]>(() =>
  (allLessons.value ?? []).map(l => ({
    id: l.id,
    startsAt: l.startsAt,
    durationMin: l.durationMin,
    topic: l.topic,
    status: l.status,
    groupId: l.groupId,
    groupName: groupById.value[l.groupId]?.name ?? 'Группа',
    groupLevel: groupById.value[l.groupId]?.level
  }))
)

// ── Detail ────────────────────────────────────────────────────
const selected = ref<GridLesson | null>(null)
const selectedGroup = computed(() => selected.value ? groupById.value[selected.value.groupId] : null)

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', {
  timeZone: 'Asia/Almaty', hour: '2-digit', minute: '2-digit'
})
const formatFull = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', {
  timeZone: 'Asia/Almaty', weekday: 'long', day: 'numeric', month: 'long'
})

const minutesUntil = (iso: string) => Math.floor((new Date(iso).getTime() - Date.now()) / 60000)
const canJoin = (iso: string) => {
  const m = minutesUntil(iso)
  return m >= -15 && m <= 5
}
</script>

<template>
  <div class="relative">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden"
    >
      <div class="absolute -top-20 right-1/4 size-80 rounded-full bg-primary-400/15 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 space-y-5 max-w-6xl mx-auto">
      <!-- Header -->
      <header>
        <p class="text-xs sm:text-sm font-bold text-primary uppercase tracking-wider">
          📅 Что впереди
        </p>
        <h1 class="text-2xl sm:text-4xl font-black tracking-tight mt-1">
          Расписание
        </h1>
        <p class="text-sm text-muted mt-1">
          Твои уроки · время по Алматы
        </p>
      </header>

      <WeekScheduleGrid
        :lessons="gridLessons"
        @select="selected = $event"
      />
    </div>

    <!-- Lesson detail modal -->
    <UModal
      :open="!!selected"
      @update:open="selected = null"
    >
      <template #content>
        <div
          v-if="selected"
          class="p-6 space-y-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <div
                  v-if="selectedGroup?.level"
                  class="px-2 py-0.5 rounded-md bg-linear-to-r from-primary-500 to-sky-700 text-white text-[10px] font-black tracking-wider"
                >
                  {{ selectedGroup.level }}
                </div>
                <UBadge
                  v-if="selectedGroup?.branch?.kind === 'ONLINE'"
                  icon="i-lucide-video"
                  label="Online"
                  color="info"
                  variant="subtle"
                  size="xs"
                />
                <UBadge
                  v-else-if="selectedGroup?.branch"
                  icon="i-lucide-map-pin"
                  label="Offline"
                  color="success"
                  variant="subtle"
                  size="xs"
                />
              </div>
              <h2 class="text-xl font-bold truncate">
                {{ selected.topic || 'Урок' }}
              </h2>
              <p class="text-sm text-muted capitalize">
                {{ formatFull(selected.startsAt) }}
              </p>
            </div>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              size="sm"
              @click="selected = null"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl bg-muted/40 p-3">
              <p class="text-xs text-muted mb-1">
                Группа
              </p>
              <p class="font-semibold truncate">
                {{ selected.groupName }}
              </p>
            </div>
            <div class="rounded-xl bg-muted/40 p-3">
              <p class="text-xs text-muted mb-1">
                Время
              </p>
              <p class="font-semibold">
                {{ formatTime(selected.startsAt) }} · {{ selected.durationMin }} мин
              </p>
            </div>
            <div
              v-if="selectedGroup?.teacher"
              class="rounded-xl bg-muted/40 p-3"
            >
              <p class="text-xs text-muted mb-1">
                Педагог
              </p>
              <p class="font-semibold truncate">
                {{ selectedGroup.teacher.name }} {{ selectedGroup.teacher.surname }}
              </p>
            </div>
            <div
              v-if="selectedGroup?.branch"
              class="rounded-xl bg-muted/40 p-3"
            >
              <p class="text-xs text-muted mb-1">
                Филиал
              </p>
              <p class="font-semibold truncate">
                {{ selectedGroup.branch.name }}
              </p>
            </div>
          </div>

          <UButton
            v-if="selectedGroup?.branch?.kind === 'ONLINE' && canJoin(selected.startsAt)"
            label="Подключиться к уроку"
            color="primary"
            icon="i-lucide-video"
            block
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
