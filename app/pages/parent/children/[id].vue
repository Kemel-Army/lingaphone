<script setup lang="ts">
import { useParentChildren, type AttendanceStatus } from '~/entities/parent'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const childId = computed(() => route.params.id as string)

const { fetchChildren } = useParentChildren()
const { data: children, pending } = await useAsyncData('parent-children', fetchChildren)
const child = computed(() => (children.value ?? []).find(c => c.studentId === childId.value) ?? null)

const tab = ref<'progress' | 'attendance' | 'finance'>('progress')
const tabs = [
  { value: 'progress' as const, label: 'Прогресс', icon: 'i-lucide-line-chart' },
  { value: 'attendance' as const, label: 'Посещаемость', icon: 'i-lucide-calendar-check' },
  { value: 'finance' as const, label: 'Финансы', icon: 'i-lucide-wallet' }
]

const ATT_META: Record<AttendanceStatus, { label: string, color: 'success' | 'error' | 'warning', icon: string }> = {
  PRESENT: { label: 'Был на уроке', color: 'success', icon: 'i-lucide-check' },
  ABSENT: { label: 'Пропуск', color: 'error', icon: 'i-lucide-x' },
  LATE: { label: 'Опоздал', color: 'warning', icon: 'i-lucide-clock' }
}
const PAY_META: Record<string, { label: string, color: 'success' | 'warning' | 'neutral' | 'error' }> = {
  COMPLETED: { label: 'Оплачен', color: 'success' },
  PENDING: { label: 'Ожидает', color: 'warning' },
  REFUNDED: { label: 'Возврат', color: 'neutral' },
  FAILED: { label: 'Ошибка', color: 'error' }
}

const money = (n: number) => `${n.toLocaleString('ru-RU')} ₸`
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'
const fmtTime = (d: string) => new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <div class="p-4 sm:p-6 space-y-5 max-w-4xl mx-auto">
    <UButton
      to="/parent"
      icon="i-lucide-arrow-left"
      variant="ghost"
      color="neutral"
      size="sm"
    >
      Назад
    </UButton>

    <div
      v-if="pending"
      class="flex justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <div
      v-else-if="!child"
      class="text-center py-16 text-muted"
    >
      Ребёнок не найден
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex items-center gap-3">
        <UAvatar
          :src="child.avatarUrl ?? undefined"
          :alt="child.name"
          size="lg"
        />
        <div>
          <h1 class="text-2xl font-bold">
            {{ child.surname }} {{ child.name }}
          </h1>
          <div class="flex items-center gap-2 mt-0.5">
            <UBadge
              color="info"
              variant="subtle"
              size="sm"
            >
              {{ child.level }}
            </UBadge>
            <span
              v-for="g in child.groups"
              :key="g.id"
              class="text-xs text-muted"
            >{{ g.name }}</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex items-center gap-1 flex-wrap">
        <UButton
          v-for="t in tabs"
          :key="t.value"
          :icon="t.icon"
          :variant="tab === t.value ? 'solid' : 'ghost'"
          :color="tab === t.value ? 'primary' : 'neutral'"
          size="sm"
          @click="tab = t.value"
        >
          {{ t.label }}
        </UButton>
      </div>

      <!-- Progress -->
      <div
        v-if="tab === 'progress'"
        class="grid grid-cols-2 sm:grid-cols-3 gap-3"
      >
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide">
            Средний балл
          </p>
          <p class="text-3xl font-black mt-1">
            {{ child.avgGrade ? child.avgGrade.toFixed(1) : '—' }}
          </p>
          <p class="text-xs text-muted mt-1">
            {{ child.gradeCount }} оценок
          </p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide">
            Посещаемость
          </p>
          <p class="text-3xl font-black mt-1">
            {{ child.attendance.total ? `${child.attendance.pct}%` : '—' }}
          </p>
          <p class="text-xs text-muted mt-1">
            {{ child.attendance.present }} из {{ child.attendance.total }}
          </p>
        </UCard>
        <UCard>
          <p class="text-xs text-muted uppercase tracking-wide">
            Домашние задания
          </p>
          <p class="text-3xl font-black mt-1">
            {{ child.homework.done }}/{{ child.homework.total }}
          </p>
          <p class="text-xs text-muted mt-1">
            выполнено
          </p>
        </UCard>
      </div>

      <!-- Attendance -->
      <template v-else-if="tab === 'attendance'">
        <div class="grid grid-cols-3 gap-3">
          <UCard>
            <p class="text-xs text-muted">
              Присутствовал
            </p>
            <p class="text-2xl font-bold text-green-500 mt-1">
              {{ child.attendance.present }}
            </p>
          </UCard>
          <UCard>
            <p class="text-xs text-muted">
              Пропуски
            </p>
            <p class="text-2xl font-bold text-red-500 mt-1">
              {{ child.attendance.absent }}
            </p>
          </UCard>
          <UCard>
            <p class="text-xs text-muted">
              Опоздания
            </p>
            <p class="text-2xl font-bold text-amber-500 mt-1">
              {{ child.attendance.late }}
            </p>
          </UCard>
        </div>
        <UCard :ui="{ body: 'p-0' }">
          <div class="divide-y divide-subtle">
            <div
              v-for="row in child.attendanceRows"
              :key="row.id"
              class="flex items-center gap-3 px-4 py-3"
            >
              <UIcon
                :name="ATT_META[row.status].icon"
                class="size-4 shrink-0"
                :class="ATT_META[row.status].color === 'success' ? 'text-green-500' : ATT_META[row.status].color === 'error' ? 'text-red-500' : 'text-amber-500'"
              />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium truncate">
                  {{ row.topic || 'Урок' }}
                </p>
                <p class="text-xs text-muted">
                  {{ fmtDate(row.date) }} · отмечен в {{ fmtTime(row.markedAt) }}
                </p>
              </div>
              <UBadge
                :color="ATT_META[row.status].color"
                variant="subtle"
                size="sm"
              >
                {{ ATT_META[row.status].label }}
              </UBadge>
            </div>
            <p
              v-if="!child.attendanceRows.length"
              class="px-4 py-10 text-center text-muted text-sm"
            >
              Нет отметок о посещаемости
            </p>
          </div>
        </UCard>
      </template>

      <!-- Finance -->
      <template v-else>
        <UCard v-if="child.subscription">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs text-muted uppercase tracking-wide">
                Абонемент
              </p>
              <p class="text-lg font-bold mt-0.5">
                {{ child.subscription.plan }}
              </p>
              <p class="text-sm text-muted mt-1">
                Уроков: {{ child.subscription.lessonsUsed }}/{{ child.subscription.lessonsTotal }}
              </p>
              <p
                v-if="child.subscription.nextPaymentAt"
                class="text-sm mt-1"
              >
                Следующая оплата: <span class="font-medium">{{ fmtDate(child.subscription.nextPaymentAt) }}</span>
              </p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-black">
                {{ money(child.subscription.price) }}
              </p>
              <UBadge
                :color="child.subscription.status === 'ACTIVE' ? 'success' : 'warning'"
                variant="subtle"
                size="sm"
                class="mt-1"
              >
                {{ child.subscription.status === 'ACTIVE' ? 'Активен' : child.subscription.status }}
              </UBadge>
            </div>
          </div>
        </UCard>

        <UCard :ui="{ body: 'p-0' }">
          <template #header>
            <p class="font-semibold text-sm">
              История платежей
            </p>
          </template>
          <div class="divide-y divide-subtle">
            <div
              v-for="p in child.payments"
              :key="p.id"
              class="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p class="font-semibold text-sm">
                  {{ money(p.amount) }}
                </p>
                <p class="text-xs text-muted">
                  {{ fmtDate(p.paidAt) }}
                </p>
              </div>
              <UBadge
                :color="PAY_META[p.status]?.color ?? 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ PAY_META[p.status]?.label ?? p.status }}
              </UBadge>
            </div>
            <p
              v-if="!child.payments.length"
              class="px-4 py-10 text-center text-muted text-sm"
            >
              Платежей пока нет
            </p>
          </div>
        </UCard>
      </template>
    </template>
  </div>
</template>
