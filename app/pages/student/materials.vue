<script setup lang="ts">
import { useLingafonStudent } from '~/shared/composables/useLingafonStudent'
import type { Database } from '~/shared/types/database.types'
import { MINUTE_STORIES, type StoryLevel } from '~/shared/mock'

definePageMeta({ layout: 'dashboard' })

type MaterialKind = Database['public']['Enums']['MaterialKind']

const { materials, vocabulary } = useLingafonStudent()

const STORY_LEVEL_COLOR: Record<StoryLevel, string> = {
  A1: 'primary', A2: 'info', S1: 'warning', S2: 'error', B2: 'neutral'
}

const estimateStoryDuration = (text: string) => {
  // ~150 wpm at 0.85x TTS rate ≈ 2.1 words/sec
  const words = text.trim().split(/\s+/).length
  return Math.max(40, Math.round(words / 2.1))
}

const KIND_META: Record<MaterialKind, { label: string, icon: string, color: string }> = {
  AUDIO: { label: 'Аудио', icon: 'i-lucide-headphones', color: 'primary' },
  VIDEO: { label: 'Видео', icon: 'i-lucide-video', color: 'info' },
  PDF: { label: 'PDF', icon: 'i-lucide-file-text', color: 'warning' },
  LINK: { label: 'Ссылка', icon: 'i-lucide-external-link', color: 'neutral' }
}

const formatDuration = (sec?: number) => {
  if (!sec) return ''
  if (sec < 60) return `${sec} с`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m < 60) return `${m}:${String(s).padStart(2, '0')}`
  const h = Math.floor(m / 60)
  return `${h} ч ${m % 60} мин`
}

const audio = computed(() => materials.value.filter(m => m.kind === 'AUDIO'))
const video = computed(() => materials.value.filter(m => m.kind === 'VIDEO'))
const other = computed(() => materials.value.filter(m => m.kind === 'PDF' || m.kind === 'LINK'))

const formatRelativeDate = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return 'сегодня'
  if (days === 1) return 'вчера'
  if (days < 7) return `${days} дн назад`
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <div class="relative">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden"
    >
      <div class="absolute -top-20 left-1/2 size-80 rounded-full bg-primary-400/15 blur-3xl" />
    </div>

    <div class="p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      <header class="space-y-2">
        <p class="text-sm font-bold text-primary uppercase tracking-wider">
          🎧 Материалы
        </p>
        <h1 class="text-3xl sm:text-4xl font-black tracking-tight">
          Библиотека уроков
        </h1>
        <p class="text-sm text-muted">
          Аудио для наушников, записи уроков, словари — всё, чтобы тренироваться между занятиями
        </p>
      </header>

      <!-- Audio (the Lingaphone signature) -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <UIcon
              name="i-lucide-headphones"
              class="size-5 text-primary"
            />
            Listen &amp; Repeat
          </h2>
          <UBadge
            label="🇬🇧 British"
            color="primary"
            variant="subtle"
            size="xs"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <article
            v-for="m in audio"
            :key="m.id"
            class="group rounded-2xl border border-default bg-default p-5 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <div class="flex items-center gap-4 mb-3">
              <div class="size-12 shrink-0 rounded-2xl bg-linear-to-br from-primary-500 to-sky-700 text-white flex items-center justify-center shadow-md">
                <UIcon
                  name="i-lucide-headphones"
                  class="size-6"
                />
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="font-bold truncate">
                  {{ m.title }}
                </h3>
                <p class="text-xs text-muted mt-0.5 line-clamp-1">
                  {{ m.description }}
                </p>
                <p
                  v-if="m.durationSec"
                  class="text-xs text-muted"
                >
                  {{ formatDuration(m.durationSec) }}
                </p>
              </div>
            </div>
            <audio
              :src="m.url"
              controls
              preload="metadata"
              class="w-full"
            />
          </article>
        </div>
      </section>

      <!-- Listen & Retell — 1-minute stories with AI comprehension check -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <UIcon
              name="i-lucide-book-open"
              class="size-5 text-violet-500"
            />
            Listen &amp; Retell
          </h2>
          <UBadge
            label="🤖 AI оценит понимание"
            color="primary"
            variant="subtle"
            size="xs"
          />
        </div>
        <p class="text-sm text-muted mb-4">
          Послушай минутный рассказ, перескажи своими словами — AI покажет, насколько правильно ты понял тему и какие моменты упустил
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NuxtLink
            v-for="s in MINUTE_STORIES"
            :key="s.id"
            :to="`/student/stories/${s.id}`"
            class="group rounded-2xl border border-default bg-default p-5 hover:border-violet-300 hover:shadow-md transition-all"
          >
            <div class="flex items-start gap-4">
              <div class="size-12 shrink-0 rounded-2xl bg-linear-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center shadow-md text-2xl">
                {{ s.emoji }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <UBadge
                    :label="s.level"
                    :color="STORY_LEVEL_COLOR[s.level] as any"
                    variant="subtle"
                    size="xs"
                  />
                  <UBadge
                    :label="s.topic"
                    color="neutral"
                    variant="subtle"
                    size="xs"
                  />
                </div>
                <h3 class="font-bold truncate">
                  {{ s.title }}
                </h3>
                <p class="text-xs text-muted mt-0.5 line-clamp-2">
                  {{ s.description }}
                </p>
              </div>
            </div>
            <div class="mt-4 pt-3 border-t border-default flex items-center justify-between text-xs">
              <span class="text-muted inline-flex items-center gap-1.5">
                <UIcon
                  name="i-lucide-clock"
                  class="size-3.5"
                />
                {{ formatDuration(estimateStoryDuration(s.text)) }}
              </span>
              <span class="text-muted inline-flex items-center gap-1.5">
                <UIcon
                  name="i-lucide-target"
                  class="size-3.5"
                />
                {{ s.keyPoints.length }} ключевых моментов
              </span>
              <span class="font-bold text-violet-600 dark:text-violet-400 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                Начать
                <UIcon
                  name="i-lucide-arrow-right"
                  class="size-3.5"
                />
              </span>
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- Video -->
      <section v-if="video.length > 0">
        <h2 class="text-xl font-bold flex items-center gap-2 mb-4">
          <UIcon
            name="i-lucide-video"
            class="size-5 text-info"
          />
          Видеозаписи уроков
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <article
            v-for="m in video"
            :key="m.id"
            class="group rounded-2xl border border-default bg-default overflow-hidden hover:border-info-300 hover:shadow-md transition-all"
          >
            <video
              :src="m.url"
              controls
              preload="metadata"
              class="w-full aspect-video bg-black"
            />
            <p
              v-if="m.durationSec"
              class="px-4 pt-2 text-xs text-muted"
            >
              {{ formatDuration(m.durationSec) }}
            </p>
            <div class="p-4">
              <h3 class="font-bold">
                {{ m.title }}
              </h3>
              <p class="text-xs text-muted mt-0.5 line-clamp-2">
                {{ m.description }}
              </p>
            </div>
          </article>
        </div>
      </section>

      <!-- PDF + Links -->
      <section v-if="other.length > 0">
        <h2 class="text-xl font-bold flex items-center gap-2 mb-4">
          <UIcon
            name="i-lucide-folder"
            class="size-5 text-warning"
          />
          Конспекты и ссылки
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a
            v-for="m in other"
            :key="m.id"
            :href="m.url"
            :target="m.kind === 'LINK' ? '_blank' : undefined"
            rel="noopener"
            class="group rounded-xl border border-default bg-default p-4 flex items-center gap-3 hover:border-primary-300 hover:shadow-md transition"
          >
            <div class="size-10 rounded-xl bg-elevated flex items-center justify-center shrink-0">
              <UIcon
                :name="KIND_META[m.kind].icon"
                class="size-5"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-bold truncate">
                {{ m.title }}
              </p>
              <p class="text-xs text-muted line-clamp-1">
                {{ m.description }}
              </p>
            </div>
            <UIcon
              :name="m.kind === 'LINK' ? 'i-lucide-external-link' : 'i-lucide-arrow-right'"
              class="size-4 text-muted shrink-0 group-hover:text-primary"
            />
          </a>
        </div>
      </section>

      <!-- Personal vocabulary -->
      <section v-if="vocabulary.length > 0">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <UIcon
              name="i-lucide-book-marked"
              class="size-5 text-emerald-500"
            />
            Мой словарь
          </h2>
          <NuxtLink
            to="/student/practice"
            class="text-sm font-bold text-primary hover:underline"
          >
            Тренировать →
          </NuxtLink>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <article
            v-for="v in vocabulary"
            :key="v.id"
            class="rounded-xl border border-default p-4 hover:border-emerald-300 transition"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <p class="font-black text-lg">
                  {{ v.word }}
                </p>
                <p
                  v-if="v.ipa"
                  class="text-xs font-mono text-muted"
                >
                  {{ v.ipa }}
                </p>
                <p class="text-sm text-muted mt-1">
                  {{ v.translation }}
                </p>
                <p
                  v-if="v.example"
                  class="text-xs italic text-muted mt-1.5"
                >
                  «{{ v.example }}»
                </p>
              </div>
              <div class="text-right shrink-0">
                <p
                  class="text-lg font-black tabular-nums"
                  :class="v.bestScore >= 85 ? 'text-emerald-600' : v.bestScore >= 60 ? 'text-amber-600' : 'text-red-500'"
                >
                  {{ v.bestScore }}%
                </p>
                <p class="text-[10px] uppercase tracking-wider text-muted font-bold">
                  лучший
                </p>
              </div>
            </div>
            <div class="flex items-center justify-between mt-3 pt-2 border-t border-default">
              <p class="text-xs text-muted">
                Добавлено {{ formatRelativeDate(v.addedAt) }}
              </p>
              <p class="text-xs text-muted">
                Повторено: <span class="font-bold tabular-nums text-default">{{ v.reviewCount }}</span>
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>
