<script setup lang="ts">
import { useParentChildren, type ParentChild } from '~/entities/parent'
import { useCurrentUser } from '~/entities/user'

definePageMeta({ layout: 'dashboard' })

const { fullName } = useCurrentUser()
const { fetchChildren } = useParentChildren()
const { data: children, pending } = await useAsyncData('parent-children', fetchChildren)

const money = (n: number) => `${n.toLocaleString('ru-RU')} ₸`
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'
const subColor = (s: ParentChild['subscription']) => {
  if (!s) return 'neutral'
  return s.status === 'ACTIVE' ? 'success' : s.status === 'EXPIRED' ? 'error' : 'warning'
}
const attColor = (pct: number) => pct >= 85 ? 'text-green-500' : pct >= 60 ? 'text-amber-500' : 'text-red-500'
</script>

<template>
  <div class="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
    <div>
      <p class="text-sm font-bold text-primary uppercase tracking-wider">
        Родитель
      </p>
      <h1 class="text-2xl font-black tracking-tight mt-0.5">
        Здравствуйте, {{ fullName }}!
      </h1>
      <p class="text-sm text-muted mt-0.5">
        Прогресс, посещаемость и оплаты ваших детей
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

    <div
      v-else-if="!children?.length"
      class="text-center py-16"
    >
      <UIcon
        name="i-lucide-users"
        class="size-10 text-muted mx-auto mb-3"
      />
      <p class="text-muted">
        Дети ещё не привязаны к вашему аккаунту.
      </p>
      <p class="text-sm text-muted mt-1">
        Обратитесь к администратору школы.
      </p>
    </div>

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <UCard
        v-for="child in children"
        :key="child.studentId"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <UAvatar
              :src="child.avatarUrl ?? undefined"
              :alt="`${child.name} ${child.surname}`"
              size="md"
            />
            <div class="min-w-0">
              <p class="font-bold truncate">
                {{ child.surname }} {{ child.name }}
              </p>
              <UBadge
                color="info"
                variant="subtle"
                size="sm"
              >
                {{ child.level }}
              </UBadge>
            </div>
            <UButton
              :to="`/parent/children/${child.studentId}`"
              icon="i-lucide-arrow-right"
              variant="ghost"
              color="neutral"
              size="sm"
              class="ml-auto"
            />
          </div>
        </template>

        <!-- Metrics -->
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="rounded-lg bg-muted/30 p-3">
            <p class="text-xs text-muted">
              Средний балл
            </p>
            <p class="text-xl font-bold mt-0.5">
              {{ child.avgGrade ? child.avgGrade.toFixed(1) : '—' }}
            </p>
          </div>
          <div class="rounded-lg bg-muted/30 p-3">
            <p class="text-xs text-muted">
              Посещаемость
            </p>
            <p
              class="text-xl font-bold mt-0.5"
              :class="attColor(child.attendance.pct)"
            >
              {{ child.attendance.total ? `${child.attendance.pct}%` : '—' }}
            </p>
          </div>
          <div class="rounded-lg bg-muted/30 p-3">
            <p class="text-xs text-muted">
              Домашки
            </p>
            <p class="text-xl font-bold mt-0.5">
              {{ child.homework.done }}/{{ child.homework.total }}
            </p>
          </div>
        </div>

        <!-- Subscription -->
        <div class="mt-4 flex items-center justify-between gap-2 rounded-lg border border-subtle p-3">
          <div class="min-w-0">
            <p class="text-xs text-muted">
              Абонемент
            </p>
            <p class="text-sm font-medium truncate">
              {{ child.subscription?.plan ?? 'Нет активного' }}
            </p>
            <p
              v-if="child.subscription?.nextPaymentAt"
              class="text-xs text-muted mt-0.5"
            >
              След. оплата: {{ fmtDate(child.subscription.nextPaymentAt) }}
            </p>
          </div>
          <div class="text-right shrink-0">
            <UBadge
              :color="subColor(child.subscription)"
              variant="subtle"
              size="sm"
            >
              {{ child.subscription ? money(child.subscription.price) : '—' }}
            </UBadge>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
