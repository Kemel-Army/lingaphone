<script setup lang="ts">
import { useLingafonStudent } from '~/shared/composables/useLingafonStudent'
import type { Database } from '~/shared/types/database.types'

definePageMeta({ layout: 'dashboard' })

type HomeworkFormatCode = Database['public']['Enums']['HomeworkFormat']
type HomeworkStatusCode = Database['public']['Enums']['HomeworkStatus']
type HomeworkExtended = ReturnType<typeof useLingafonStudent>['homeworkList']['value'][number]

const { homeworkList } = useLingafonStudent()

const FORMAT_META: Record<HomeworkFormatCode, { label: string, icon: string, color: string }> = {
  TEST: { label: 'Тест', icon: 'i-lucide-list-checks', color: 'primary' },
  INPUT: { label: 'Впиши ответ', icon: 'i-lucide-pen-line', color: 'info' },
  TEXT: { label: 'Эссе', icon: 'i-lucide-file-text', color: 'secondary' },
  ORAL: { label: 'Speaking', icon: 'i-lucide-mic', color: 'success' },
  FILE: { label: 'Файл', icon: 'i-lucide-upload', color: 'warning' },
  INTERACTIVE: { label: 'Интерактив', icon: 'i-lucide-mouse-pointer-click', color: 'neutral' }
}

const STATUS_META: Record<HomeworkStatusCode, { label: string, color: string }> = {
  ASSIGNED: { label: 'Назначено', color: 'info' },
  IN_PROGRESS: { label: 'В процессе', color: 'warning' },
  SUBMITTED: { label: 'Отправлено', color: 'primary' },
  CHECKED: { label: 'Проверено', color: 'success' },
  OVERDUE: { label: 'Просрочено', color: 'error' }
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', {
  weekday: 'short', day: 'numeric', month: 'long'
})

const dueLabel = (hw: HomeworkExtended) => {
  const ms = new Date(hw.dueAt).getTime() - Date.now()
  const days = Math.floor(ms / 86400000)
  if (hw.status === 'CHECKED' || hw.status === 'SUBMITTED') return formatDate(hw.dueAt)
  if (days < 0) return `просрочено на ${Math.abs(days)} дн`
  if (days === 0) return 'сегодня'
  if (days === 1) return 'завтра'
  if (days < 7) return `через ${days} дн`
  return formatDate(hw.dueAt)
}

const active = computed(() => homeworkList.value.filter(h => h.status !== 'CHECKED'))
const completed = computed(() => homeworkList.value.filter(h => h.status === 'CHECKED'))
</script>

<template>
  <div class="relative">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden"
    >
      <div class="absolute -top-20 right-1/3 size-80 rounded-full bg-primary-400/15 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      <!-- Hero header -->
      <header class="space-y-2">
        <p class="text-sm font-bold text-primary uppercase tracking-wider">
          📚 Домашка
        </p>
        <h1 class="text-3xl sm:text-4xl font-black tracking-tight">
          Активные задания
        </h1>
        <p class="text-sm text-muted">
          Тесты, тексты, speaking, listening — всё что задают на уроках
        </p>
      </header>

      <!-- Active homework -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <UIcon
              name="i-lucide-zap"
              class="size-5 text-primary"
            />
            К выполнению
          </h2>
          <p class="text-sm font-bold tabular-nums text-primary">
            {{ active.length }}
          </p>
        </div>

        <div
          v-if="active.length === 0"
          class="rounded-2xl border-2 border-dashed border-default p-10 text-center"
        >
          <div class="size-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <UIcon
              name="i-lucide-check-circle-2"
              class="size-7 text-emerald-500"
            />
          </div>
          <p class="mt-3 font-bold text-lg">
            Всё сделано!
          </p>
          <p class="text-sm text-muted">
            Новые задания появятся после уроков
          </p>
        </div>

        <div
          v-else
          class="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <NuxtLink
            v-for="hw in active"
            :key="hw.id"
            :to="`/student/homework/${hw.id}`"
            class="group relative rounded-2xl border border-default bg-default p-5 hover:border-primary-300 hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden"
          >
            <UIcon
              :name="FORMAT_META[hw.format].icon"
              aria-hidden="true"
              class="absolute -bottom-3 -right-3 size-24 opacity-5 group-hover:opacity-10 transition-opacity"
            />

            <div class="relative space-y-3">
              <div class="flex items-center justify-between gap-2">
                <UBadge
                  :label="FORMAT_META[hw.format].label"
                  :icon="FORMAT_META[hw.format].icon"
                  :color="FORMAT_META[hw.format].color as any"
                  variant="subtle"
                  size="xs"
                />
                <UBadge
                  :label="STATUS_META[hw.status].label"
                  :color="STATUS_META[hw.status].color as any"
                  variant="solid"
                  size="xs"
                />
              </div>

              <h3 class="font-bold text-lg leading-tight">
                {{ hw.title }}
              </h3>
              <p
                v-if="hw.description"
                class="text-sm text-muted line-clamp-2"
              >
                {{ hw.description }}
              </p>

              <div class="flex items-center justify-between pt-2 border-t border-default">
                <p class="text-sm text-muted flex items-center gap-1.5">
                  <UIcon
                    name="i-lucide-calendar-clock"
                    class="size-4"
                  />
                  Срок: <span class="font-semibold text-default">{{ dueLabel(hw) }}</span>
                </p>
                <span class="text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
                  Открыть →
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- Completed -->
      <section v-if="completed.length > 0">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <UIcon
              name="i-lucide-check-circle-2"
              class="size-5 text-emerald-500"
            />
            Выполненные
          </h2>
        </div>

        <div class="space-y-2">
          <article
            v-for="hw in completed"
            :key="hw.id"
            class="rounded-xl border border-default p-4 flex items-center gap-4"
          >
            <UIcon
              :name="FORMAT_META[hw.format].icon"
              class="size-5 text-muted shrink-0"
            />
            <div class="min-w-0 flex-1">
              <p class="font-bold truncate">
                {{ hw.title }}
              </p>
              <p class="text-xs text-muted">
                {{ FORMAT_META[hw.format].label }} · {{ formatDate(hw.dueAt) }}
              </p>
            </div>
            <div
              v-if="hw.teacherGrade"
              class="text-right shrink-0"
            >
              <p
                class="text-lg font-black tabular-nums"
                :class="hw.teacherGrade >= 4 ? 'text-emerald-600 dark:text-emerald-400' : hw.teacherGrade >= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500'"
              >
                {{ hw.teacherGrade }}
              </p>
              <p class="text-[10px] uppercase tracking-wider text-muted font-bold">
                оценка
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>
