<script setup lang="ts">
import { useMockStudent } from '~/shared/mock'

definePageMeta({ layout: 'dashboard' })

const { certificates, profile } = useMockStudent()

const ACCENT: Record<string, { gradient: string, ring: string, text: string }> = {
  gold: { gradient: 'from-yellow-300 via-amber-400 to-yellow-500', ring: 'ring-yellow-400/40', text: 'text-yellow-800 dark:text-yellow-200' },
  silver: { gradient: 'from-gray-300 via-gray-400 to-slate-400', ring: 'ring-gray-400/40', text: 'text-gray-800 dark:text-gray-200' },
  blue: { gradient: 'from-primary-400 via-sky-500 to-violet-600', ring: 'ring-sky-400/40', text: 'text-sky-900 dark:text-sky-100' },
  emerald: { gradient: 'from-emerald-400 via-teal-500 to-emerald-600', ring: 'ring-emerald-400/40', text: 'text-emerald-900 dark:text-emerald-100' }
}

const KIND_LABEL: Record<string, string> = {
  LEVEL_COMPLETION: 'Уровень пройден',
  CONTEST_WINNER: 'Победа в конкурсе',
  YEAR_END: 'Итоги года',
  STREAK_BONUS: 'Бонус за streak'
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', {
  day: 'numeric', month: 'long', year: 'numeric'
})
</script>

<template>
  <div class="relative">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden"
    >
      <div class="absolute -top-32 -right-20 size-96 rounded-full bg-yellow-400/15 blur-3xl" />
      <div class="absolute -top-20 -left-10 size-72 rounded-full bg-violet-400/15 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      <header class="space-y-2">
        <p class="text-sm font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider">
          🏆 Стена достижений
        </p>
        <h1 class="text-3xl sm:text-4xl font-black tracking-tight">
          Сертификаты
        </h1>
        <p class="text-sm text-muted">
          Каждый — это твой шаг к английскому как ко второму родному
        </p>
      </header>

      <!-- Counter -->
      <section class="flex items-center justify-center">
        <div class="rounded-3xl border border-default bg-default px-8 py-6 text-center">
          <p class="text-5xl font-black tabular-nums bg-linear-to-r from-primary-500 to-violet-600 bg-clip-text text-transparent">
            {{ certificates.length }}
          </p>
          <p class="text-sm font-bold uppercase tracking-wider text-muted mt-1">
            сертификатов получено
          </p>
        </div>
      </section>

      <!-- Wall of certificates -->
      <section class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <article
          v-for="c in certificates"
          :key="c.id"
          class="group relative rounded-3xl overflow-hidden ring-1 transition-all hover:scale-[1.02] hover:shadow-2xl"
          :class="ACCENT[c.accent].ring"
        >
          <!-- Inner certificate "paper" -->
          <div
            class="relative p-6 sm:p-7 bg-linear-to-br"
            :class="ACCENT[c.accent].gradient"
          >
            <!-- Decorative seal -->
            <div class="absolute top-4 right-4 size-14 rounded-full bg-white/25 backdrop-blur flex items-center justify-center group-hover:rotate-12 transition-transform">
              <UIcon
                name="i-lucide-award"
                class="size-7 text-white"
              />
            </div>

            <p class="text-xs font-bold uppercase tracking-widest opacity-80 text-white">
              {{ KIND_LABEL[c.kind] ?? 'Сертификат' }}
            </p>
            <h2 class="mt-2 text-xl sm:text-2xl font-black tracking-tight text-white pr-16">
              {{ c.title }}
            </h2>
            <p
              v-if="c.subtitle"
              class="text-sm text-white/85 mt-2"
            >
              {{ c.subtitle }}
            </p>

            <div class="mt-6 pt-4 border-t border-white/20 flex items-center justify-between text-white">
              <div>
                <p class="text-[10px] uppercase tracking-wider opacity-70 font-bold">
                  Выдан
                </p>
                <p class="text-sm font-bold">
                  {{ formatDate(c.issuedAt) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-[10px] uppercase tracking-wider opacity-70 font-bold">
                  Ученик
                </p>
                <p class="text-sm font-bold">
                  {{ profile.name }} {{ profile.surname }}
                </p>
              </div>
            </div>

            <!-- Signature line -->
            <div class="mt-4 flex items-end gap-3">
              <div class="flex-1">
                <p class="font-cursive italic text-white text-lg leading-tight">
                  Lingaphone
                </p>
                <div class="h-px bg-white/40 mt-1" />
                <p class="text-[10px] uppercase tracking-wider opacity-70 mt-1 text-white">
                  English school · Almaty 2013
                </p>
              </div>
              <UButton
                icon="i-lucide-download"
                color="neutral"
                variant="solid"
                size="xs"
                class="bg-white/15 hover:bg-white/25 text-white backdrop-blur"
                label="PDF"
              />
            </div>
          </div>
        </article>
      </section>

      <!-- Empty -->
      <div
        v-if="certificates.length === 0"
        class="rounded-3xl border-2 border-dashed border-default p-12 text-center"
      >
        <UIcon
          name="i-lucide-award"
          class="size-12 text-muted mx-auto"
        />
        <p class="mt-3 font-bold text-lg">
          Первый сертификат уже близко
        </p>
        <p class="text-sm text-muted mt-1">
          Заверши свой текущий уровень и получи официальный сертификат Lingaphone
        </p>
      </div>
    </div>
  </div>
</template>
