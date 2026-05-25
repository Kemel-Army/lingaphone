<script setup lang="ts">
import { useLingafonStudent, type StudentGroup } from '~/shared/composables/useLingafonStudent'

definePageMeta({ layout: 'dashboard' })

const { upcomingLessons, myGroups } = useLingafonStudent()

const groupById = computed(() => {
  const map: Record<string, StudentGroup> = {}
  for (const g of myGroups.value) map[g.id] = g
  return map
})

interface DayBucket {
  date: Date
  dateKey: string
  weekdayLong: string
  dayNum: number
  monthShort: string
  lessons: typeof upcomingLessons.value
}

const lessonsByDay = computed<DayBucket[]>(() => {
  const buckets: Record<string, DayBucket> = {}
  for (const l of upcomingLessons.value) {
    const d = new Date(l.startsAt)
    const key = d.toISOString().slice(0, 10)
    if (!buckets[key]) {
      buckets[key] = {
        date: d,
        dateKey: key,
        weekdayLong: d.toLocaleDateString('ru-RU', { weekday: 'long' }),
        dayNum: d.getDate(),
        monthShort: d.toLocaleDateString('ru-RU', { month: 'short' }),
        lessons: []
      }
    }
    buckets[key]!.lessons.push(l)
  }
  return Object.values(buckets).sort((a, b) => a.date.getTime() - b.date.getTime())
})

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', {
  hour: '2-digit', minute: '2-digit'
})

const isToday = (d: Date) => {
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

const isTomorrow = (d: Date) => {
  const t = new Date()
  t.setDate(t.getDate() + 1)
  return d.toDateString() === t.toDateString()
}

const minutesUntil = (iso: string) => Math.floor((new Date(iso).getTime() - Date.now()) / 60000)
const canJoin = (iso: string) => {
  const m = minutesUntil(iso)
  return m >= -15 && m <= 5
}

const totalUpcoming = computed(() => upcomingLessons.value.length)
const onlineCount = computed(() =>
  upcomingLessons.value.filter(l => groupById.value[l.groupId]?.branch?.kind === 'ONLINE').length
)
const offlineCount = computed(() => totalUpcoming.value - onlineCount.value)
</script>

<template>
  <div class="relative">
    <!-- Background blob -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden"
    >
      <div class="absolute -top-20 right-1/4 size-80 rounded-full bg-primary-400/15 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-5xl mx-auto">
      <!-- Hero header -->
      <header class="space-y-3">
        <div>
          <p class="text-xs sm:text-sm font-bold text-primary uppercase tracking-wider">
            📅 Что впереди
          </p>
          <h1 class="text-2xl sm:text-4xl font-black tracking-tight mt-1">
            Расписание
          </h1>
          <p class="text-sm text-muted mt-1">
            Уроки во всех твоих группах
          </p>
        </div>

        <!-- Quick stats -->
        <div class="grid grid-cols-3 gap-2">
          <div class="px-3 py-2 rounded-xl bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-200/50 dark:ring-primary-700/30">
            <p class="text-[10px] uppercase tracking-wider text-primary font-bold">
              всего
            </p>
            <p class="text-xl font-black text-primary tabular-nums">
              {{ totalUpcoming }}
            </p>
          </div>
          <div class="px-3 py-2 rounded-xl bg-info-50 dark:bg-info-900/30 ring-1 ring-info-200/50 dark:ring-info-700/30">
            <p class="text-[10px] uppercase tracking-wider font-bold text-info-600 dark:text-info-400">
              🌐 online
            </p>
            <p class="text-xl font-black text-info-600 dark:text-info-400 tabular-nums">
              {{ onlineCount }}
            </p>
          </div>
          <div class="px-3 py-2 rounded-xl bg-success-50 dark:bg-success-900/30 ring-1 ring-success-200/50 dark:ring-success-700/30">
            <p class="text-[10px] uppercase tracking-wider font-bold text-success-600 dark:text-success-400">
              📍 offline
            </p>
            <p class="text-xl font-black text-success-600 dark:text-success-400 tabular-nums">
              {{ offlineCount }}
            </p>
          </div>
        </div>
      </header>

      <!-- Day buckets -->
      <div class="space-y-8">
        <section
          v-for="bucket in lessonsByDay"
          :key="bucket.dateKey"
          class="relative"
        >
          <!-- Date header (sticky-ish) -->
          <div class="flex items-center gap-4 mb-3">
            <div
              class="size-14 sm:size-16 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-md"
              :class="isToday(bucket.date)
                ? 'bg-linear-to-br from-primary-500 to-sky-700 text-white'
                : 'bg-elevated text-default'"
            >
              <p class="text-xl sm:text-2xl font-black tabular-nums leading-none">
                {{ bucket.dayNum }}
              </p>
              <p class="text-[10px] uppercase tracking-wider opacity-80 font-bold mt-0.5">
                {{ bucket.monthShort }}
              </p>
            </div>
            <div>
              <h2 class="font-bold text-lg capitalize">
                {{ bucket.weekdayLong }}
              </h2>
              <div class="flex items-center gap-2 mt-0.5">
                <UBadge
                  v-if="isToday(bucket.date)"
                  label="Сегодня"
                  color="primary"
                  variant="solid"
                  size="xs"
                />
                <UBadge
                  v-else-if="isTomorrow(bucket.date)"
                  label="Завтра"
                  color="info"
                  variant="solid"
                  size="xs"
                />
                <p class="text-xs text-muted">
                  {{ bucket.lessons.length }} {{ bucket.lessons.length === 1 ? 'урок' : bucket.lessons.length < 5 ? 'урока' : 'уроков' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Lessons -->
          <div class="space-y-3 pl-4 sm:pl-8 relative">
            <!-- Vertical timeline -->
            <div
              aria-hidden="true"
              class="absolute left-2 sm:left-6 top-2 bottom-2 w-0.5 bg-default"
            />

            <article
              v-for="l in bucket.lessons"
              :key="l.id"
              class="group relative rounded-2xl border border-default bg-default p-4 sm:p-5 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <!-- Timeline dot -->
              <div
                aria-hidden="true"
                class="absolute -left-[1.6rem] sm:-left-[2.6rem] top-1/2 -translate-y-1/2 size-3 rounded-full bg-primary ring-4 ring-default"
              />

              <div class="flex flex-wrap items-center gap-4">
                <!-- Time -->
                <div class="shrink-0 text-center">
                  <p class="text-2xl font-black tabular-nums leading-tight">
                    {{ formatTime(l.startsAt) }}
                  </p>
                  <p class="text-[10px] uppercase tracking-wider text-muted font-bold">
                    {{ l.durationMin }} мин
                  </p>
                </div>

                <div class="w-px h-12 bg-default" />

                <!-- Content -->
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <div class="px-2 py-0.5 rounded-md bg-linear-to-r from-primary-500 to-sky-700 text-white text-[10px] font-black tracking-wider">
                      {{ groupById[l.groupId]?.level }}
                    </div>
                    <UBadge
                      v-if="groupById[l.groupId]?.branch?.kind === 'ONLINE'"
                      icon="i-lucide-video"
                      label="Online"
                      color="info"
                      variant="subtle"
                      size="xs"
                    />
                    <UBadge
                      v-else
                      icon="i-lucide-map-pin"
                      label="Offline"
                      color="success"
                      variant="subtle"
                      size="xs"
                    />
                  </div>
                  <p class="font-bold truncate">
                    {{ l.topic }}
                  </p>
                  <p class="text-xs text-muted mt-0.5 truncate">
                    {{ groupById[l.groupId]?.name }} ·
                    {{ groupById[l.groupId]?.teacher.name }} {{ groupById[l.groupId]?.teacher.surname }} ·
                    {{ groupById[l.groupId]?.branch?.name }}
                  </p>
                </div>

                <!-- Action -->
                <UButton
                  v-if="groupById[l.groupId]?.branch?.kind === 'ONLINE' && canJoin(l.startsAt)"
                  label="Подключиться"
                  color="primary"
                  size="sm"
                  icon="i-lucide-video"
                  class="shrink-0"
                />
                <UBadge
                  v-else-if="groupById[l.groupId]?.branch?.kind === 'ONLINE' && minutesUntil(l.startsAt) > 0"
                  :label="`через ${minutesUntil(l.startsAt) < 60 ? minutesUntil(l.startsAt) + ' мин' : Math.floor(minutesUntil(l.startsAt) / 60) + ' ч'}`"
                  color="neutral"
                  variant="subtle"
                  size="xs"
                  class="shrink-0"
                />
              </div>
            </article>
          </div>
        </section>

        <!-- Empty state -->
        <div
          v-if="lessonsByDay.length === 0"
          class="rounded-3xl border-2 border-dashed border-default p-12 text-center"
        >
          <div class="size-16 mx-auto rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
            <UIcon
              name="i-lucide-calendar-x"
              class="size-8 text-primary"
            />
          </div>
          <p class="mt-4 font-bold text-lg">
            Уроков пока не запланировано
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
