<script setup lang="ts">
import { useLingaCoins, COIN_REASON_MAP, COIN_MEDALS } from '~/entities/linga-coin'

definePageMeta({ layout: 'dashboard' })

const { fetchMyWallet } = useLingaCoins()
const { data: wallet, pending } = await useAsyncData('student-coins', fetchMyWallet)

const balance = computed(() => wallet.value?.balance ?? 0)
const medal = computed(() => wallet.value?.medal ?? { current: null, next: null, toNext: 0, progressPct: 0 })
const transactions = computed(() => wallet.value?.transactions ?? [])

const fmtDate = (d: string) => new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })
</script>

<template>
  <div class="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
    <div>
      <h1 class="text-2xl font-black tracking-tight flex items-center gap-2">
        <UIcon
          name="i-lucide-coins"
          class="size-7 text-yellow-500"
        />
        Linga Coins
      </h1>
      <p class="text-sm text-muted mt-0.5">
        Монеты за поведение, посещаемость и старание
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

    <template v-else>
      <!-- Balance + medal -->
      <UCard class="bg-linear-to-br from-yellow-400/10 to-amber-500/10 border-yellow-500/20">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p class="text-xs text-muted uppercase tracking-wide">
              Баланс
            </p>
            <p class="text-4xl font-black tabular-nums flex items-center gap-2 mt-1">
              <UIcon
                name="i-lucide-coins"
                class="size-8 text-yellow-500"
              />
              {{ balance.toLocaleString('ru-RU') }}
            </p>
          </div>
          <div
            v-if="medal.current"
            class="text-right"
          >
            <p class="text-4xl">
              {{ medal.current.emoji }}
            </p>
            <p
              class="text-sm font-semibold"
              :class="medal.current.color"
            >
              {{ medal.current.label }}
            </p>
          </div>
        </div>

        <!-- Progress to next medal -->
        <div
          v-if="medal.next"
          class="mt-4"
        >
          <div class="flex items-center justify-between text-xs text-muted mb-1">
            <span>До «{{ medal.next.label }}»</span>
            <span>ещё {{ medal.toNext.toLocaleString('ru-RU') }}</span>
          </div>
          <div class="h-2.5 rounded-full bg-muted/40 overflow-hidden">
            <div
              class="h-full rounded-full bg-linear-to-r from-yellow-400 to-amber-500 transition-all"
              :style="`width: ${medal.progressPct}%`"
            />
          </div>
        </div>
        <p
          v-else
          class="mt-4 text-sm font-medium text-yellow-600"
        >
          🏆 Максимальная медаль достигнута!
        </p>
      </UCard>

      <!-- Medal thresholds -->
      <div class="grid grid-cols-3 gap-3">
        <UCard
          v-for="m in COIN_MEDALS"
          :key="m.key"
          :class="balance >= m.threshold ? 'ring-1 ring-yellow-500/40' : 'opacity-60'"
        >
          <p class="text-3xl text-center">
            {{ m.emoji }}
          </p>
          <p class="text-center text-sm font-semibold mt-1">
            {{ m.label }}
          </p>
          <p class="text-center text-xs text-muted">
            {{ m.threshold.toLocaleString('ru-RU') }} монет
          </p>
        </UCard>
      </div>

      <!-- History -->
      <UCard :ui="{ body: 'p-0' }">
        <template #header>
          <p class="font-semibold text-sm">
            История начислений
          </p>
        </template>
        <div class="divide-y divide-subtle">
          <div
            v-for="t in transactions"
            :key="t.id"
            class="flex items-center gap-3 px-4 py-3"
          >
            <div
              class="rounded-lg p-2 shrink-0"
              :class="t.delta >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'"
            >
              <UIcon
                :name="COIN_REASON_MAP[t.reason]?.icon ?? 'i-lucide-coins'"
                class="size-4"
                :class="t.delta >= 0 ? 'text-green-500' : 'text-red-500'"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium">
                {{ COIN_REASON_MAP[t.reason]?.label ?? t.reason }}
              </p>
              <p
                v-if="t.note"
                class="text-xs text-muted truncate"
              >
                {{ t.note }}
              </p>
              <p class="text-xs text-muted">
                {{ fmtDate(t.createdAt) }}
              </p>
            </div>
            <span
              class="font-bold tabular-nums"
              :class="t.delta >= 0 ? 'text-green-500' : 'text-red-500'"
            >{{ t.delta >= 0 ? '+' : '' }}{{ t.delta }}</span>
          </div>
          <p
            v-if="!transactions.length"
            class="px-4 py-12 text-center text-muted text-sm"
          >
            Пока нет начислений. Ходи на уроки, делай ДЗ и получай монеты!
          </p>
        </div>
      </UCard>
    </template>
  </div>
</template>
