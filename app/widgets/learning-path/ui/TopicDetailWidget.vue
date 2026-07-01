<script setup lang="ts">
/**
 * TopicDetailWidget — детская страница темы.
 *
 * Аудитория: ученики 1–6 класс. Тот же «лесной» язык что и MyPathAdventureMap:
 *   - небо-трава градиенты, облака, маскот Феми
 *   - крупные «капсулы» уроков с цветными иконками
 *   - 1–3 звёздочки по mastery, кнопка «Играть» / «Сыграть снова» / 🔒
 *   - chunky shadows, bold rounded UI, доступно для младших
 *
 * Без карты — это вертикальный список «миссий», но в той же RPG-стилистике.
 */
import type { PathLesson, PathTopic } from '~/entities/learning-path'

const props = defineProps<{
  topic: PathTopic
}>()

const { t } = useI18n()

const lessons = computed<PathLesson[]>(() => props.topic.lessons ?? [])
const completedCount = computed(() => props.topic.completedLessonsCount ?? 0)
const totalLessons = computed(() => props.topic.lessonsCount ?? 0)
const progress = computed(() => props.topic.progress ?? 0)

// ──────────────────────────────────────────────────────────────────────
// Цветовая палитра темы → 2 градиента (hero и капсулы) + чанки-shadow.
// ──────────────────────────────────────────────────────────────────────
type ThemePalette = {
  hero: string
  pill: string
  pillText: string
  capsule: string
  capsuleShadow: string
  buttonShadow: string
  ring: string
}

const PALETTE: Record<string, ThemePalette> = {
  green: {
    hero: 'from-green-400 via-emerald-500 to-teal-600',
    pill: 'bg-emerald-100 text-emerald-700',
    pillText: 'text-emerald-900',
    capsule: 'from-green-400 to-emerald-500',
    capsuleShadow: 'shadow-[0_8px_0_rgb(22_163_74/0.6)]',
    buttonShadow: 'shadow-[0_4px_0_rgb(22_101_52)]',
    ring: 'ring-emerald-300'
  },
  emerald: {
    hero: 'from-emerald-400 via-teal-500 to-cyan-600',
    pill: 'bg-emerald-100 text-emerald-700',
    pillText: 'text-emerald-900',
    capsule: 'from-emerald-400 to-teal-500',
    capsuleShadow: 'shadow-[0_8px_0_rgb(16_185_129/0.6)]',
    buttonShadow: 'shadow-[0_4px_0_rgb(15_118_110)]',
    ring: 'ring-teal-300'
  },
  amber: {
    hero: 'from-amber-400 via-orange-500 to-yellow-500',
    pill: 'bg-amber-100 text-amber-700',
    pillText: 'text-amber-900',
    capsule: 'from-amber-400 to-orange-500',
    capsuleShadow: 'shadow-[0_8px_0_rgb(245_158_11/0.6)]',
    buttonShadow: 'shadow-[0_4px_0_rgb(146_64_14)]',
    ring: 'ring-amber-300'
  },
  orange: {
    hero: 'from-orange-400 via-rose-500 to-red-500',
    pill: 'bg-orange-100 text-orange-700',
    pillText: 'text-orange-900',
    capsule: 'from-orange-400 to-rose-500',
    capsuleShadow: 'shadow-[0_8px_0_rgb(249_115_22/0.6)]',
    buttonShadow: 'shadow-[0_4px_0_rgb(154_52_18)]',
    ring: 'ring-orange-300'
  },
  rose: {
    hero: 'from-rose-400 via-pink-500 to-fuchsia-500',
    pill: 'bg-rose-100 text-rose-700',
    pillText: 'text-rose-900',
    capsule: 'from-rose-400 to-pink-500',
    capsuleShadow: 'shadow-[0_8px_0_rgb(244_63_94/0.6)]',
    buttonShadow: 'shadow-[0_4px_0_rgb(159_18_57)]',
    ring: 'ring-rose-300'
  },
  pink: {
    hero: 'from-pink-400 via-fuchsia-500 to-purple-500',
    pill: 'bg-pink-100 text-pink-700',
    pillText: 'text-pink-900',
    capsule: 'from-pink-400 to-fuchsia-500',
    capsuleShadow: 'shadow-[0_8px_0_rgb(236_72_153/0.6)]',
    buttonShadow: 'shadow-[0_4px_0_rgb(157_23_77)]',
    ring: 'ring-pink-300'
  },
  violet: {
    hero: 'from-violet-400 via-purple-500 to-fuchsia-500',
    pill: 'bg-violet-100 text-violet-700',
    pillText: 'text-violet-900',
    capsule: 'from-violet-400 to-purple-500',
    capsuleShadow: 'shadow-[0_8px_0_rgb(139_92_246/0.6)]',
    buttonShadow: 'shadow-[0_4px_0_rgb(76_29_149)]',
    ring: 'ring-violet-300'
  },
  sky: {
    hero: 'from-sky-400 via-blue-500 to-indigo-500',
    pill: 'bg-sky-100 text-sky-700',
    pillText: 'text-sky-900',
    capsule: 'from-sky-400 to-blue-500',
    capsuleShadow: 'shadow-[0_8px_0_rgb(14_165_233/0.6)]',
    buttonShadow: 'shadow-[0_4px_0_rgb(30_64_175)]',
    ring: 'ring-sky-300'
  },
  cyan: {
    hero: 'from-cyan-400 via-sky-500 to-blue-500',
    pill: 'bg-cyan-100 text-cyan-700',
    pillText: 'text-cyan-900',
    capsule: 'from-cyan-400 to-sky-500',
    capsuleShadow: 'shadow-[0_8px_0_rgb(6_182_212/0.6)]',
    buttonShadow: 'shadow-[0_4px_0_rgb(14_116_144)]',
    ring: 'ring-cyan-300'
  },
  yellow: {
    hero: 'from-yellow-400 via-amber-500 to-orange-500',
    pill: 'bg-yellow-100 text-yellow-700',
    pillText: 'text-yellow-900',
    capsule: 'from-yellow-400 to-amber-500',
    capsuleShadow: 'shadow-[0_8px_0_rgb(234_179_8/0.6)]',
    buttonShadow: 'shadow-[0_4px_0_rgb(133_77_14)]',
    ring: 'ring-yellow-300'
  }
}

const palette = computed<ThemePalette>(() => PALETTE[props.topic.color] ?? PALETTE.rose!)

// ──────────────────────────────────────────────────────────────────────
// Mascot
// ──────────────────────────────────────────────────────────────────────
const mascotState = computed<'greet' | 'think' | 'teach' | 'celebrate'>(() => {
  if (progress.value === 0) return 'greet'
  if (progress.value < 70) return 'teach'
  if (progress.value < 100) return 'think'
  return 'celebrate'
})
const mascotLine = computed(() => {
  if (progress.value === 0) return `Поехали! Открываем «${props.topic.name}»!`
  if (progress.value < 50) return `Ты на ${progress.value}%. Идём дальше!`
  if (progress.value < 100) return 'Финиш близко! Ещё чуть-чуть!'
  return 'Ты прошёл всю тему! 🏆'
})

// ──────────────────────────────────────────────────────────────────────
// Уроки → визуальная модель: status, stars, action
// ──────────────────────────────────────────────────────────────────────
type LessonStatus = 'done' | 'active' | 'locked'

interface LessonView {
  lesson: PathLesson
  index: number
  status: LessonStatus
  stars: 0 | 1 | 2 | 3
  earnedXp: number
}

const lessonViews = computed<LessonView[]>(() => {
  let activeAssigned = false
  return lessons.value.map((lesson, idx): LessonView => {
    const p = lesson.progress
    const mastery = p?.masteryAchieved ?? false
    let status: LessonStatus
    if (mastery) {
      status = 'done'
    } else if (!activeAssigned) {
      status = 'active'
      activeAssigned = true
    } else {
      // На /my-path всё что не done — открыто, но визуально подсвечиваем только active.
      // Можно также «закрывать» уроки — но в IAE мы доверяем ученику.
      status = 'active'
    }
    const score = p?.masteryScore ?? 0
    const max = p?.masteryMaxScore ?? 100
    const pct = max > 0 ? (score / max) * 100 : 0
    let stars: 0 | 1 | 2 | 3 = 0
    if (mastery) {
      if (pct >= 95) stars = 3
      else if (pct >= 80) stars = 2
      else stars = 1
    }
    return {
      lesson,
      index: idx + 1,
      status,
      stars,
      earnedXp: p?.xpEarned ?? 0
    }
  })
})

// Облака для hero
const HERO_CLOUDS = [
  { top: '10%', left: '15%', size: 70, delay: '0s', duration: '22s' },
  { top: '20%', left: '70%', size: 90, delay: '-6s', duration: '28s' },
  { top: '60%', left: '10%', size: 60, delay: '-3s', duration: '25s' },
  { top: '70%', left: '78%', size: 80, delay: '-9s', duration: '30s' }
]

// Эмодзи-иконки уроков (по индексу — повторяющийся круг).
const LESSON_EMOJI = ['🌟', '🎯', '🎨', '🎈', '🚀', '🧩', '🎲', '🎁', '⚡', '🌈']
const lessonEmoji = (i: number) => LESSON_EMOJI[i % LESSON_EMOJI.length]
</script>

<template>
  <div class="space-y-6">
    <!-- ═══════════════════════════════════════════════════════════════
         Назад к карте
         ═══════════════════════════════════════════════════════════════ -->
    <NuxtLink
      to="/student/my-path"
      class="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-emerald-700 ring-2 ring-emerald-200 shadow-[0_4px_0_rgb(16_185_129/0.45)] hover:shadow-[0_2px_0_rgb(16_185_129/0.45)] hover:translate-y-0.5 transition-all"
    >
      <UIcon
        name="i-lucide-chevron-left"
        class="size-4"
      />
      На карту
    </NuxtLink>

    <!-- ═══════════════════════════════════════════════════════════════
         HERO — небо + Феми + название темы
         ═══════════════════════════════════════════════════════════════ -->
    <section
      class="relative overflow-hidden rounded-4xl p-6 sm:p-8 bg-linear-to-br"
      :class="palette.hero"
    >
      <!-- Солнце -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -top-8 -right-6 size-36 rounded-full bg-yellow-300 blur-3xl opacity-60"
      />
      <div
        aria-hidden="true"
        class="pointer-events-none absolute top-4 right-8 size-20 rounded-full bg-yellow-200 ring-8 ring-yellow-300/40"
      />

      <!-- Облачка -->
      <div
        v-for="(cloud, i) in HERO_CLOUDS"
        :key="`hero-cloud-${i}`"
        aria-hidden="true"
        class="topic-cloud pointer-events-none absolute"
        :style="{
          top: cloud.top,
          left: cloud.left,
          width: `${cloud.size}px`,
          height: `${cloud.size * 0.6}px`,
          animationDelay: cloud.delay,
          animationDuration: cloud.duration
        }"
      >
        <svg
          viewBox="0 0 100 60"
          class="size-full text-white drop-shadow-md"
        >
          <path
            d="M20 45 Q5 45 8 32 Q5 18 22 20 Q28 8 45 12 Q55 4 68 14 Q88 12 88 30 Q98 35 90 48 Q85 55 70 50 L30 50 Q22 52 20 45 Z"
            fill="currentColor"
            opacity="0.95"
          />
        </svg>
      </div>

      <div class="relative grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <!-- Маскот -->
        <div class="shrink-0">
          <FemiMascot
            :state="mascotState"
            size="xl"
            :line="mascotLine"
          />
        </div>

        <!-- Заголовок -->
        <div class="text-white">
          <div
            class="mb-2 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-black uppercase tracking-wider ring-2 ring-white"
            :class="palette.pillText"
          >
            <UIcon
              :name="topic.icon"
              class="size-3.5"
            />
            Тема {{ topic.orderIndex }}
          </div>
          <h1 class="text-3xl sm:text-5xl font-black drop-shadow-[0_3px_0_rgb(0_0_0/0.18)]">
            {{ topic.name }}
          </h1>
          <p
            v-if="topic.description"
            class="mt-2 max-w-xl text-sm sm:text-base font-semibold text-white/95"
          >
            {{ topic.description }}
          </p>
        </div>
      </div>

      <!-- Stats strip -->
      <div class="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-2xl bg-white/90 backdrop-blur px-4 py-3 ring-2 ring-white shadow-[0_4px_0_rgb(0_0_0/0.08)]">
          <div class="flex items-center justify-between text-emerald-700 text-[10px] font-black uppercase tracking-wider">
            <span>Прогресс</span>
            <UIcon
              name="i-lucide-trending-up"
              class="size-3.5"
            />
          </div>
          <div class="mt-1 text-2xl font-black text-emerald-900 tabular-nums">
            {{ progress }}<span class="text-base">%</span>
          </div>
        </div>

        <div class="rounded-2xl bg-white/90 backdrop-blur px-4 py-3 ring-2 ring-white shadow-[0_4px_0_rgb(0_0_0/0.08)]">
          <div class="flex items-center justify-between text-sky-700 text-[10px] font-black uppercase tracking-wider">
            <span>Уроков</span>
            <UIcon
              name="i-lucide-book-open"
              class="size-3.5"
            />
          </div>
          <div class="mt-1 text-2xl font-black text-sky-900 tabular-nums">
            {{ completedCount }}<span class="text-base text-sky-500">/{{ totalLessons }}</span>
          </div>
        </div>

        <div class="rounded-2xl bg-white/90 backdrop-blur px-4 py-3 ring-2 ring-white shadow-[0_4px_0_rgb(0_0_0/0.08)]">
          <div class="flex items-center justify-between text-violet-700 text-[10px] font-black uppercase tracking-wider">
            <span>Минут</span>
            <UIcon
              name="i-lucide-clock"
              class="size-3.5"
            />
          </div>
          <div class="mt-1 text-2xl font-black text-violet-900 tabular-nums">
            {{ topic.durationMinutes }}
          </div>
        </div>

        <div class="rounded-2xl bg-white/90 backdrop-blur px-4 py-3 ring-2 ring-white shadow-[0_4px_0_rgb(0_0_0/0.08)]">
          <div class="flex items-center justify-between text-amber-700 text-[10px] font-black uppercase tracking-wider">
            <span>XP</span>
            <UIcon
              name="i-lucide-star"
              class="size-3.5"
            />
          </div>
          <div class="mt-1 text-2xl font-black text-amber-900 tabular-nums">
            {{ topic.totalXp }}
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         Список уроков — «миссии» в стиле RPG
         ═══════════════════════════════════════════════════════════════ -->
    <section
      v-if="lessonViews.length"
      class="relative overflow-hidden rounded-4xl px-3 py-6 sm:px-6"
      :style="{
        background: 'linear-gradient(180deg, #ECFDF5 0%, #D1FAE5 50%, #A7F3D0 100%)'
      }"
    >
      <!-- Фоновый паттерн «трава» -->
      <svg
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 size-full"
        style="opacity: 0.05;"
      >
        <defs>
          <pattern
            id="topic-grass-dots"
            x="0"
            y="0"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="6"
              cy="16"
              r="1.6"
              fill="#064E3B"
            />
            <circle
              cx="22"
              cy="8"
              r="1.2"
              fill="#064E3B"
            />
            <circle
              cx="14"
              cy="26"
              r="1.4"
              fill="#064E3B"
            />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#topic-grass-dots)"
        />
      </svg>

      <!-- Заголовок секции -->
      <div class="relative mb-5 flex items-center gap-3">
        <div class="flex size-12 items-center justify-center rounded-2xl bg-white ring-2 ring-emerald-300 shadow-[0_4px_0_rgb(16_185_129/0.45)]">
          <span class="text-2xl">🗺️</span>
        </div>
        <div>
          <h2 class="text-2xl sm:text-3xl font-black text-emerald-900">
            Миссии
          </h2>
          <p class="text-xs sm:text-sm font-semibold text-emerald-800/80">
            Проходи капсулы по порядку и собирай звёздочки
          </p>
        </div>
      </div>

      <!-- Список уроков -->
      <ul class="relative space-y-4">
        <li
          v-for="view in lessonViews"
          :key="view.lesson.id"
        >
          <NuxtLink
            :to="`/student/my-path/${topic.id}/${view.lesson.id}`"
            class="group relative block rounded-3xl bg-white p-4 sm:p-5 ring-2 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_0_rgb(0_0_0/0.08)]"
            :class="[
              view.status === 'active'
                ? `${palette.ring} shadow-[0_6px_0_rgb(0_0_0/0.08)]`
                : 'ring-emerald-100 shadow-[0_4px_0_rgb(0_0_0/0.05)]'
            ]"
          >
            <!-- «Сейчас» бейдж -->
            <span
              v-if="view.status === 'active'"
              class="absolute -top-3 left-6 rounded-full bg-linear-to-r px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white ring-2 ring-white shadow-md"
              :class="palette.capsule"
            >
              ⚡ Сейчас
            </span>
            <span
              v-else-if="view.status === 'done'"
              class="absolute -top-3 left-6 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white ring-2 ring-white shadow-md"
            >
              ✓ Готово
            </span>

            <div class="flex items-center gap-4">
              <!-- Большая иконка-капсула -->
              <div
                class="relative flex size-20 sm:size-24 shrink-0 items-center justify-center rounded-3xl bg-linear-to-br ring-4 ring-white"
                :class="[palette.capsule, palette.capsuleShadow]"
              >
                <span class="text-3xl sm:text-4xl drop-shadow-md">
                  {{ lessonEmoji(view.index - 1) }}
                </span>
                <!-- Номер -->
                <span class="absolute -top-2 -left-2 flex size-7 items-center justify-center rounded-full bg-white text-xs font-black text-emerald-900 ring-2 ring-emerald-300 shadow-md">
                  {{ view.index }}
                </span>
              </div>

              <!-- Контент -->
              <div class="min-w-0 flex-1">
                <h4 class="text-base sm:text-lg font-black text-slate-900 truncate">
                  {{ view.lesson.title }}
                </h4>
                <p
                  v-if="view.lesson.subtitle"
                  class="mt-0.5 text-xs sm:text-sm font-medium text-slate-600 truncate"
                >
                  {{ view.lesson.subtitle }}
                </p>

                <!-- Звёзды -->
                <div class="mt-2 flex items-center gap-1.5">
                  <span
                    v-for="star in 3"
                    :key="`star-${view.lesson.id}-${star}`"
                    class="text-lg transition-transform"
                    :class="star <= view.stars ? 'text-yellow-400 drop-shadow-sm' : 'text-slate-200'"
                  >
                    ★
                  </span>
                  <span
                    v-if="view.stars === 3"
                    class="ml-1 text-[10px] font-black uppercase tracking-wider text-amber-600"
                  >
                    Идеально!
                  </span>
                </div>

                <!-- Метаданные -->
                <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs font-bold text-slate-600">
                  <span class="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-sky-700">
                    <UIcon
                      name="i-lucide-clock"
                      class="size-3"
                    />
                    {{ view.lesson.durationMinutes }} {{ t('common.minutes') }}
                  </span>
                  <span class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                    <UIcon
                      name="i-lucide-star"
                      class="size-3"
                    />
                    {{ view.lesson.xpReward }} XP
                  </span>
                  <span class="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-violet-700">
                    <UIcon
                      name="i-lucide-layers"
                      class="size-3"
                    />
                    {{ view.lesson.layers?.length ?? 11 }} шагов
                  </span>
                </div>
              </div>

              <!-- CTA-кнопка -->
              <div class="hidden sm:block shrink-0">
                <span
                  class="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white ring-2 ring-white transition-transform group-hover:translate-y-0.5 group-hover:shadow-none"
                  :class="[
                    view.status === 'done'
                      ? `bg-linear-to-br from-emerald-400 to-teal-500 ${palette.buttonShadow}`
                      : `bg-linear-to-br ${palette.capsule} ${palette.buttonShadow}`
                  ]"
                >
                  <UIcon
                    :name="view.status === 'done' ? 'i-lucide-rotate-ccw' : 'i-lucide-play'"
                    class="size-4"
                  />
                  {{ view.status === 'done' ? 'Сыграть снова' : 'Играть' }}
                </span>
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="block sm:hidden size-6 text-slate-400 shrink-0"
              />
            </div>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- Пустое состояние -->
    <section
      v-else
      class="rounded-4xl bg-linear-to-br from-emerald-100 to-sky-100 p-8 text-center ring-2 ring-white"
    >
      <div class="mx-auto mb-3 flex size-16 items-center justify-center rounded-3xl bg-white ring-2 ring-emerald-200 shadow-[0_4px_0_rgb(16_185_129/0.45)]">
        <span class="text-3xl">📚</span>
      </div>
      <h3 class="text-xl font-black text-emerald-900">
        {{ t('learningPath.noLessons') }}
      </h3>
      <p class="mt-1 text-sm font-semibold text-emerald-800/80">
        {{ t('learningPath.noLessonsDesc') }}
      </p>
    </section>
  </div>
</template>

<style scoped>
.topic-cloud {
  animation-name: topic-cloud-drift;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
  will-change: transform;
}

@keyframes topic-cloud-drift {
  0%   { transform: translateX(0); }
  50%  { transform: translateX(20px); }
  100% { transform: translateX(0); }
}

@media (prefers-reduced-motion: reduce) {
  .topic-cloud {
    animation: none !important;
  }
}
</style>
