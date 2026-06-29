<script setup lang="ts">
import { useTeacher } from '~/entities/teacher'

definePageMeta({ layout: 'dashboard' })

const toast = useToast()
const { fetchMyTests, fetchMyGroups, fetchTestSubmissions, resetTestSubmission } = useTeacher()

const [{ data: tests, pending, refresh: refreshTests }, { data: groups }] = await Promise.all([
  useAsyncData('teacher-tests', fetchMyTests),
  useAsyncData('teacher-groups-tests', fetchMyGroups)
])

// ── Filters ──────────────────────────────────────────────────────────────────
const selectedGroup = ref<string | null>(null)

const filtered = computed(() => {
  if (!tests.value) return []
  if (!selectedGroup.value) return tests.value
  return tests.value.filter(t => t.groupId === selectedGroup.value)
})

const groupOptions = computed(() => [
  { value: null, label: 'Все группы' },
  ...(groups.value ?? []).map(g => ({ value: g.id, label: g.name }))
])

// ── Detail drawer ─────────────────────────────────────────────────────────────
const selectedTestId = ref<string | null>(null)
const testSubs = ref<Awaited<ReturnType<typeof fetchTestSubmissions>>>([])
const subsLoading = ref(false)
const resetLoading = ref<Record<string, boolean>>({})

const openTest = async (id: string) => {
  selectedTestId.value = id
  subsLoading.value = true
  try {
    testSubs.value = await fetchTestSubmissions(id)
  } finally {
    subsLoading.value = false
  }
}

const closeDetail = () => { selectedTestId.value = null; testSubs.value = [] }

const selectedTest = computed(() => tests.value?.find(t => t.id === selectedTestId.value) ?? null)

// ── Reset submission ──────────────────────────────────────────────────────────
const doReset = async (subId: string) => {
  resetLoading.value[subId] = true
  try {
    await resetTestSubmission(subId)
    testSubs.value = testSubs.value.filter(s => s.id !== subId)
    await refreshTests()
    toast.add({ title: 'Пересдача открыта', color: 'success', icon: 'i-lucide-refresh-cw' })
  } catch {
    toast.add({ title: 'Ошибка', color: 'error', icon: 'i-lucide-x-circle' })
  } finally {
    resetLoading.value[subId] = false
  }
}

// ── Analytics helpers ─────────────────────────────────────────────────────────
const gradeColor = (score: number | null, max: number): 'success' | 'warning' | 'error' | 'neutral' => {
  if (score === null) return 'neutral'
  const pct = (score / max) * 100
  if (pct >= 80) return 'success'
  if (pct >= 50) return 'warning'
  return 'error'
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })

const isPast = (d: string) => new Date(d) < new Date()

// Score distribution for bar chart (visual only, no library)
const distribution = computed(() => {
  if (!testSubs.value.length) return { excellent: 0, good: 0, poor: 0, none: 0 }
  const total = testSubs.value.length
  const max = selectedTest.value?.maxScore ?? 10
  const excellent = testSubs.value.filter(s => s.score !== null && (s.score / max) >= 0.8).length
  const good = testSubs.value.filter(s => s.score !== null && (s.score / max) >= 0.5 && (s.score / max) < 0.8).length
  const poor = testSubs.value.filter(s => s.score !== null && (s.score / max) < 0.5).length
  const none = testSubs.value.filter(s => s.score === null).length
  return {
    excellent: Math.round((excellent / total) * 100),
    good: Math.round((good / total) * 100),
    poor: Math.round((poor / total) * 100),
    none: Math.round((none / total) * 100)
  }
})
</script>

<template>
  <div class="p-4 sm:p-6 space-y-4 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <p class="text-xs font-bold text-purple-500 uppercase tracking-wider">
          Контроль знаний
        </p>
        <h1 class="text-2xl font-black tracking-tight mt-0.5">
          Тестирование
        </h1>
      </div>
      <UButton
        to="/teacher/homework/create"
        icon="i-lucide-plus"
        size="sm"
      >
        Создать тест
      </UButton>
    </div>

    <!-- Filter -->
    <div class="flex gap-3 items-center flex-wrap">
      <USelect
        v-model="selectedGroup"
        :items="groupOptions"
        class="w-48"
      />
      <p class="text-sm text-muted">
        {{ filtered.length }} тестов
      </p>
    </div>

    <div
      v-if="pending"
      class="flex justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <!-- Tests list -->
    <template v-else>
      <div
        v-if="!filtered.length"
        class="text-center py-16 text-muted"
      >
        <UIcon
          name="i-lucide-clipboard-list"
          class="size-10 mx-auto mb-3"
        />
        <p>Тестов нет</p>
        <p class="text-xs mt-1">
          Создайте ДЗ с форматом «Тест»
        </p>
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <UCard
          v-for="t in filtered"
          :key="t.id"
          class="cursor-pointer hover:ring-1 hover:ring-purple-300 dark:hover:ring-purple-700 transition-all"
          @click="openTest(t.id)"
        >
          <div class="flex items-center gap-4 flex-wrap">
            <!-- Icon -->
            <div class="rounded-xl bg-purple-500/10 p-2.5 shrink-0">
              <UIcon
                name="i-lucide-clipboard-list"
                class="size-5 text-purple-500"
              />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="font-semibold truncate">
                {{ t.title }}
              </p>
              <p class="text-sm text-muted">
                {{ t.groupName }} · {{ t.lessonTopic }}
              </p>
            </div>

            <!-- Stats -->
            <div class="flex items-center gap-4 text-sm shrink-0">
              <div class="text-center">
                <p class="font-bold text-lg">
                  {{ t.submittedCount + t.checkedCount }}
                </p>
                <p class="text-xs text-muted">
                  Сдали
                </p>
              </div>
              <div class="text-center">
                <p
                  class="font-bold text-lg"
                  :class="t.avgScore !== null ? 'text-primary' : 'text-muted'"
                >
                  {{ t.avgScore !== null ? t.avgScore : '—' }}
                </p>
                <p class="text-xs text-muted">
                  Ср. балл
                </p>
              </div>
              <div class="text-center">
                <p
                  class="font-bold text-sm tabular-nums"
                  :class="isPast(t.dueAt) ? 'text-error' : 'text-muted'"
                >
                  {{ formatDate(t.dueAt) }}
                </p>
                <p class="text-xs text-muted">
                  Срок
                </p>
              </div>
            </div>

            <UIcon
              name="i-lucide-chevron-right"
              class="size-4 text-muted ml-auto"
            />
          </div>
        </UCard>
      </div>
    </template>

    <!-- Detail slideover -->
    <USlideover
      :open="!!selectedTestId"
      side="right"
      :ui="({ width: 'max-w-2xl' } as any)"
      @update:open="closeDetail"
    >
      <template #content>
        <div class="p-6 space-y-5 h-full overflow-y-auto">
          <!-- Header -->
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-bold text-purple-500 uppercase tracking-wide">
                Аналитика теста
              </p>
              <h2 class="text-xl font-bold mt-0.5">
                {{ selectedTest?.title }}
              </h2>
              <p class="text-sm text-muted">
                {{ selectedTest?.groupName }} · Макс. {{ selectedTest?.maxScore }} баллов
              </p>
            </div>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              size="sm"
              @click="closeDetail"
            />
          </div>

          <!-- Distribution chart (visual bars) -->
          <UCard v-if="testSubs.length">
            <template #header>
              <p class="text-sm font-semibold">
                Распределение результатов
              </p>
            </template>
            <div class="space-y-2">
              <div
                v-for="bar in [
                  { label: 'Отлично (≥80%)', value: distribution.excellent, color: 'bg-green-500' },
                  { label: 'Хорошо (50–79%)', value: distribution.good, color: 'bg-amber-400' },
                  { label: 'Слабо (<50%)', value: distribution.poor, color: 'bg-red-500' },
                  { label: 'Не сдали', value: distribution.none, color: 'bg-neutral-300 dark:bg-neutral-600' }
                ]"
                :key="bar.label"
                class="flex items-center gap-3 text-sm"
              >
                <span class="w-36 text-xs text-muted shrink-0">{{ bar.label }}</span>
                <div class="flex-1 h-3 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="bar.color"
                    :style="`width: ${bar.value}%`"
                  />
                </div>
                <span class="w-8 text-right font-mono text-xs tabular-nums">{{ bar.value }}%</span>
              </div>
            </div>
          </UCard>

          <!-- Loading -->
          <div
            v-if="subsLoading"
            class="flex justify-center py-8"
          >
            <UIcon
              name="i-lucide-loader-2"
              class="size-6 animate-spin text-muted"
            />
          </div>

          <!-- Per-student results -->
          <template v-else>
            <div
              v-if="!testSubs.length"
              class="text-center py-10 text-muted"
            >
              <UIcon
                name="i-lucide-inbox"
                class="size-8 mx-auto mb-2"
              />
              <p class="text-sm">
                Никто ещё не сдал
              </p>
            </div>

            <div
              v-else
              class="space-y-2"
            >
              <p class="text-xs font-bold uppercase tracking-wider text-muted">
                Результаты учеников
              </p>
              <div
                v-for="s in testSubs"
                :key="s.id"
                class="flex items-center gap-3 rounded-xl border border-subtle p-3 hover:bg-muted/20 transition-colors"
              >
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm truncate">
                    {{ s.studentName }} {{ s.studentSurname }}
                  </p>
                  <p class="text-xs text-muted">
                    {{ s.submittedAt ? formatDate(s.submittedAt) : 'Не сдано' }}
                  </p>
                </div>

                <!-- Score badge -->
                <UBadge
                  :color="gradeColor(s.score, selectedTest?.maxScore ?? 10)"
                  variant="subtle"
                  size="sm"
                >
                  {{ s.score !== null ? `${s.score} / ${selectedTest?.maxScore}` : 'Нет оценки' }}
                </UBadge>

                <!-- Status -->
                <UBadge
                  :color="s.status === 'CHECKED' ? 'success' : s.status === 'SUBMITTED' ? 'warning' : 'neutral'"
                  variant="outline"
                  size="xs"
                >
                  {{ s.status === 'CHECKED' ? 'Проверено' : s.status === 'SUBMITTED' ? 'Сдано' : 'Не сдано' }}
                </UBadge>

                <!-- Reset button -->
                <UTooltip text="Открыть пересдачу">
                  <UButton
                    icon="i-lucide-refresh-cw"
                    variant="ghost"
                    size="xs"
                    color="neutral"
                    :loading="resetLoading[s.id]"
                    :disabled="s.status === 'ASSIGNED'"
                    @click.stop="doReset(s.id)"
                  />
                </UTooltip>
              </div>
            </div>
          </template>
        </div>
      </template>
    </USlideover>
  </div>
</template>
