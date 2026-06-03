<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

type EventKind = 'CAMP' | 'HOLIDAY' | 'WORKSHOP' | 'CONTEST'

const events = ref<{
  id: string
  kind: EventKind
  title: string
  description: string
  posterEmoji: string
  startsAt: string
  endsAt: string
  branchName: string
  price: number
  capacity: number
  registered: number
  myStatus: 'OPEN' | 'CLOSED' | 'REGISTERED' | 'ATTENDED'
}[]>([])

const KIND_META: Record<EventKind, { label: string, gradient: string }> = {
  CAMP: { label: 'Лагерь', gradient: 'from-emerald-500 to-teal-600' },
  HOLIDAY: { label: 'Праздник', gradient: 'from-orange-500 to-rose-600' },
  WORKSHOP: { label: 'Воркшоп', gradient: 'from-violet-500 to-purple-600' },
  CONTEST: { label: 'Конкурс', gradient: 'from-amber-500 to-yellow-600' }
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', {
  day: 'numeric', month: 'long'
})

const formatDateRange = (start: string, end: string) => {
  const s = new Date(start)
  const e = new Date(end)
  if (s.toDateString() === e.toDateString()) return formatDate(start)
  return `${formatDate(start)} — ${formatDate(end)}`
}

const formatTenge = (v: number) => v === 0 ? 'Бесплатно' : `${v.toLocaleString('ru-RU')} ₸`

const STATUS_META = {
  OPEN: { label: 'Открыта запись', color: 'success' },
  CLOSED: { label: 'Запись закрыта', color: 'error' },
  REGISTERED: { label: '✓ Ты записан', color: 'primary' },
  ATTENDED: { label: '✓ Посетил', color: 'success' }
} as const
</script>

<template>
  <div class="relative">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden"
    >
      <div class="absolute -top-20 left-1/3 size-80 rounded-full bg-orange-400/15 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-5xl mx-auto">
      <header class="space-y-2">
        <p class="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
          🎉 Мероприятия школы
        </p>
        <h1 class="text-3xl sm:text-4xl font-black tracking-tight">
          Лагерь, праздники, конкурсы
        </h1>
        <p class="text-sm text-muted">
          Дополнительные активности для учеников Lingaphone
        </p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <article
          v-for="ev in events"
          :key="ev.id"
          class="group rounded-3xl border border-default bg-default overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <!-- Poster (gradient + big emoji) -->
          <div
            class="relative h-32 bg-linear-to-br p-5 text-white overflow-hidden"
            :class="KIND_META[ev.kind].gradient"
          >
            <UBadge
              :label="KIND_META[ev.kind].label"
              color="neutral"
              variant="solid"
              size="xs"
              class="bg-white/15 backdrop-blur text-white"
            />
            <span class="absolute -bottom-2 -right-2 text-9xl opacity-30 group-hover:rotate-6 transition-transform">
              {{ ev.posterEmoji }}
            </span>
          </div>

          <div class="p-5 space-y-3">
            <h3 class="text-lg font-black tracking-tight">
              {{ ev.title }}
            </h3>
            <p class="text-sm text-muted line-clamp-2">
              {{ ev.description }}
            </p>

            <div class="grid grid-cols-2 gap-3 pt-3 border-t border-default">
              <div>
                <p class="text-[10px] uppercase tracking-wider text-muted font-bold">
                  Когда
                </p>
                <p class="text-sm font-bold mt-0.5">
                  {{ formatDateRange(ev.startsAt, ev.endsAt) }}
                </p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-wider text-muted font-bold">
                  Где
                </p>
                <p class="text-sm font-bold mt-0.5 truncate">
                  {{ ev.branchName }}
                </p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-wider text-muted font-bold">
                  Цена
                </p>
                <p
                  class="text-sm font-bold mt-0.5"
                  :class="ev.price === 0 && 'text-emerald-600 dark:text-emerald-400'"
                >
                  {{ formatTenge(ev.price) }}
                </p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-wider text-muted font-bold">
                  Свободно
                </p>
                <p class="text-sm font-bold mt-0.5 tabular-nums">
                  {{ ev.capacity - ev.registered }} / {{ ev.capacity }}
                </p>
              </div>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-default">
              <UBadge
                :label="STATUS_META[ev.myStatus].label"
                :color="STATUS_META[ev.myStatus].color as any"
                variant="subtle"
                size="sm"
              />
              <UButton
                v-if="ev.myStatus === 'OPEN'"
                label="Записаться"
                color="primary"
                size="sm"
                icon="i-lucide-check"
              />
              <UButton
                v-else-if="ev.myStatus === 'REGISTERED'"
                label="Отменить"
                color="neutral"
                variant="outline"
                size="sm"
              />
            </div>
          </div>
        </article>
      </div>

      <div
        v-if="events.length === 0"
        class="rounded-3xl border-2 border-dashed border-default p-12 text-center"
      >
        <UIcon
          name="i-lucide-party-popper"
          class="size-12 text-muted mx-auto"
        />
        <p class="mt-3 font-bold text-lg">
          Пока нет анонсов
        </p>
        <p class="text-sm text-muted mt-1">
          Следи за обновлениями — летом будет лагерь!
        </p>
      </div>
    </div>
  </div>
</template>
