<script setup lang="ts">
/**
 * Lead-magnet section: tempts visitors to take the free /level-test.
 * Positioned mid-page on the landing so it catches users who scrolled
 * past the hero but haven't committed yet.
 */
</script>

<template>
  <section class="relative py-16 sm:py-24 overflow-hidden">
    <!-- Background blobs -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 -z-10"
    >
      <div class="absolute top-10 -left-20 size-72 rounded-full bg-primary-400/15 blur-3xl" />
      <div class="absolute bottom-0 -right-20 size-80 rounded-full bg-violet-400/15 blur-3xl" />
    </div>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="rounded-3xl bg-linear-to-br from-primary-500 via-sky-600 to-violet-700 p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
        <!-- Decorative blob -->
        <div
          aria-hidden="true"
          class="absolute -bottom-32 -right-32 size-96 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden="true"
          class="absolute top-8 right-8 text-9xl opacity-10 select-none"
        >
          🇬🇧
        </div>

        <div class="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-xs font-black uppercase tracking-widest">
              <UIcon
                name="i-lucide-sparkles"
                class="size-3.5"
              />
              Бесплатно · Без регистрации
            </div>

            <h2 class="mt-4 text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Не знаешь свой уровень?<br>
              <span class="bg-linear-to-r from-amber-200 to-yellow-100 bg-clip-text text-transparent">
                Узнай за 5 минут
              </span>
            </h2>

            <p class="mt-4 text-base sm:text-lg opacity-90 max-w-xl leading-relaxed">
              50 вопросов от A1 до C1, отобранных случайно из пула в 400+ заданий —
              у каждого студента тест уникальный. Сразу видишь результат и куда расти
            </p>

            <!-- Mini features -->
            <ul class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl">
              <li class="flex items-center gap-2 text-sm font-bold">
                <UIcon
                  name="i-lucide-check-circle-2"
                  class="size-5 shrink-0"
                />
                50 вопросов
              </li>
              <li class="flex items-center gap-2 text-sm font-bold">
                <UIcon
                  name="i-lucide-check-circle-2"
                  class="size-5 shrink-0"
                />
                5 минут
              </li>
              <li class="flex items-center gap-2 text-sm font-bold">
                <UIcon
                  name="i-lucide-check-circle-2"
                  class="size-5 shrink-0"
                />
                Уровень A1–C1
              </li>
            </ul>

            <!-- CTA buttons -->
            <div class="mt-7 flex flex-wrap gap-3">
              <UButton
                to="/level-test"
                label="Пройти тест"
                color="neutral"
                variant="solid"
                size="xl"
                icon="i-lucide-arrow-right"
                trailing
                class="bg-white text-primary hover:bg-white/90 font-black px-8"
              />
              <p class="self-center text-xs opacity-80">
                ~5 мин · никакой регистрации
              </p>
            </div>
          </div>

          <!-- Level badges visual -->
          <div class="hidden lg:block">
            <div class="grid grid-cols-1 gap-2">
              <div
                v-for="(tier, i) in [
                  { code: 'C1', label: 'Advanced', color: 'from-rose-500 to-pink-600' },
                  { code: 'B2', label: 'Upper-Int', color: 'from-amber-400 to-orange-600' },
                  { code: 'B1', label: 'Pre-Int', color: 'from-violet-500 to-fuchsia-600' },
                  { code: 'A2', label: 'Elementary', color: 'from-sky-400 to-blue-600' },
                  { code: 'A1', label: 'Starter', color: 'from-emerald-400 to-teal-600' }
                ]"
                :key="tier.code"
                class="flex items-center gap-3 rounded-xl px-4 py-2.5 bg-white/15 backdrop-blur ring-1 ring-white/20 transition hover:scale-[1.02]"
                :style="{ marginLeft: `${i * 8}px` }"
              >
                <div
                  class="size-10 rounded-lg bg-linear-to-br flex items-center justify-center font-black text-sm shadow-lg"
                  :class="tier.color"
                >
                  {{ tier.code }}
                </div>
                <span class="font-bold text-sm">{{ tier.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
