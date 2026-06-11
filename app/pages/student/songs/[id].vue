<script setup lang="ts">
import { useSongs, useSongProgress, SONG_LEVEL_META, SONG_GENRE_LABELS } from '~/entities/song'
import { LyricsGapFill, usePracticeSong } from '~/features/practice-song'
import type { GapResult } from '~/features/practice-song'
import { LevelUpModal } from '~/entities/game-profile'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const id = computed(() => String(route.params.id))

const { fetchSongById } = useSongs()
const { fetchSongProgressById } = useSongProgress()
const { submitSong } = usePracticeSong()

const { data, pending } = useAsyncData(() => `song-${id.value}`, async () => {
  const song = await fetchSongById(id.value)
  if (!song) return null
  const progress = await fetchSongProgressById(song.id)
  return { song, progress }
})

// ── Phase machine ──────────────────────────────────────────────────────────────
type Phase = 'listen' | 'fill' | 'vocab' | 'result'
const phase = ref<Phase>('listen')

// ── Result state ───────────────────────────────────────────────────────────────
const gapResults = ref<GapResult[]>([])
const xpEarned = ref(0)
const score = ref(0)
const maxScore = ref(0)

watch(data, (val) => {
  if (!val?.progress) return
  score.value = val.progress.score
  maxScore.value = val.progress.maxScore
  if (val.progress.completedAt && phase.value === 'listen') {
    phase.value = 'result'
  }
}, { immediate: true })
const isPerfect = ref(false)
const levelUp = ref(false)
const showLevelUp = ref(false)
const submitting = ref(false)

const scorePercent = computed(() =>
  maxScore.value ? Math.round((score.value / maxScore.value) * 100) : 0
)
const wrongGaps = computed(() => gapResults.value.filter(r => !r.correct))

const onFillDone = async (results: GapResult[]) => {
  gapResults.value = results
  phase.value = 'vocab'
}

const onVocabFinish = async () => {
  submitting.value = true
  phase.value = 'result'

  try {
    const out = await submitSong(data.value!.song.id, gapResults.value)
    xpEarned.value = out.xpEarned
    score.value = out.score
    maxScore.value = out.maxScore
    isPerfect.value = out.isPerfect
    levelUp.value = out.levelUp
    if (out.levelUp) showLevelUp.value = true
  } finally {
    submitting.value = false
  }
}

const retry = () => {
  gapResults.value = []
  phase.value = 'fill'
}

const levelMeta = computed(() =>
  data.value?.song ? SONG_LEVEL_META[data.value.song.level] : null
)

const gapCount = computed(() =>
  data.value?.song.lyrics.filter(l => l.hasGap).length ?? 0
)

// Phase steps for indicator
const STEPS: Phase[] = ['listen', 'fill', 'vocab', 'result']
const STEP_LABELS: Record<Phase, string> = {
  listen: 'Слушать',
  fill: 'Пропуски',
  vocab: 'Словарь',
  result: 'Результат'
}
</script>

<template>
  <div
    v-if="pending"
    class="p-8"
  >
    <div class="skeleton mx-auto h-10 w-64 rounded-lg" />
    <div class="skeleton mx-auto mt-6 h-96 max-w-2xl rounded-2xl" />
  </div>

  <div
    v-else-if="data"
    class="relative min-h-screen"
  >
    <!-- Decorative blob -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 overflow-hidden"
    >
      <div
        class="absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full opacity-15 blur-3xl"
        :class="`bg-linear-to-r ${levelMeta?.gradient}`"
      />
    </div>

    <div class="mx-auto max-w-2xl p-4 pb-16 sm:p-6 lg:p-8">
      <!-- Breadcrumb -->
      <div class="mb-5 flex items-center gap-2 text-sm text-muted">
        <NuxtLink
          to="/student/songs"
          class="hover:text-default"
        >Песни</NuxtLink>
        <UIcon
          name="i-lucide-chevron-right"
          class="size-3.5"
        />
        <span
          class="rounded-md px-2 py-0.5 text-xs font-black"
          :class="[levelMeta?.bg, levelMeta?.color]"
        >
          {{ data.song.level }}
        </span>
        <span
          v-if="data.song.genre"
          class="text-xs"
        >
          {{ SONG_GENRE_LABELS[data.song.genre] }}
        </span>
      </div>

      <!-- Title -->
      <h1 class="mb-1 text-2xl font-black tracking-tight sm:text-3xl">
        {{ data.song.title }}
      </h1>
      <p class="mb-6 text-sm text-muted">
        {{ data.song.artist }}
      </p>

      <!-- Phase steps -->
      <div class="mb-8 flex items-center gap-0">
        <template
          v-for="(step, i) in STEPS"
          :key="step"
        >
          <div
            class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all"
            :class="phase === step
              ? 'bg-primary text-white'
              : STEPS.indexOf(phase) > i
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-muted'"
          >
            <UIcon
              v-if="STEPS.indexOf(phase) > i"
              name="i-lucide-check"
              class="size-3"
            />
            {{ STEP_LABELS[step] }}
          </div>
          <div
            v-if="i < STEPS.length - 1"
            class="mx-1 h-px w-5 bg-border"
          />
        </template>
      </div>

      <!-- ── LISTEN phase ─────────────────────────────────────────────────── -->
      <template v-if="phase === 'listen'">
        <!-- YouTube embed -->
        <div
          v-if="data.song.youtubeId"
          class="mb-6 overflow-hidden rounded-2xl shadow-lg"
        >
          <ClientOnly>
            <iframe
              :src="`https://www.youtube-nocookie.com/embed/${data.song.youtubeId}`"
              class="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              frameborder="0"
            />
            <template #fallback>
              <div class="aspect-video w-full animate-pulse rounded-2xl bg-elevated" />
            </template>
          </ClientOnly>
        </div>
        <div
          v-else
          class="mb-6 flex h-48 items-center justify-center rounded-2xl bg-linear-to-br text-white"
          :class="levelMeta?.gradient"
        >
          <div class="text-center">
            <UIcon
              name="i-lucide-music"
              class="size-12 opacity-80"
            />
            <p class="mt-2 text-sm font-semibold opacity-80">
              Видео недоступно
            </p>
          </div>
        </div>

        <!-- Info row -->
        <div class="mb-6 flex flex-wrap gap-3 text-sm text-muted">
          <span class="flex items-center gap-1.5">
            <UIcon
              name="i-lucide-underline"
              class="size-4"
            />
            {{ gapCount }} пропусков для заполнения
          </span>
          <span
            v-if="data.song.vocabulary?.length"
            class="flex items-center gap-1.5"
          >
            <UIcon
              name="i-lucide-bookmark"
              class="size-4"
            />
            {{ data.song.vocabulary.length }} слов в словаре
          </span>
        </div>

        <div class="flex items-center justify-between">
          <NuxtLink
            to="/student/songs"
            class="text-sm text-muted hover:text-default"
          >
            ← Все песни
          </NuxtLink>
          <UButton
            label="Заполнять пропуски"
            icon="i-lucide-pencil"
            trailing
            color="primary"
            size="lg"
            @click="phase = 'fill'"
          />
        </div>
      </template>

      <!-- ── FILL phase ──────────────────────────────────────────────────── -->
      <template v-else-if="phase === 'fill'">
        <p class="mb-4 text-sm text-muted">
          Заполни пропуски по памяти. Можно прокрутить наверх и послушать ещё раз.
        </p>
        <LyricsGapFill
          :lyrics="data.song.lyrics"
          @done="onFillDone"
        />
      </template>

      <!-- ── VOCAB phase ──────────────────────────────────────────────────── -->
      <template v-else-if="phase === 'vocab'">
        <p class="mb-5 text-sm text-muted">
          Изучи слова и выражения из этой песни, затем получи результат.
        </p>

        <div
          v-if="data.song.vocabulary?.length"
          class="mb-6 space-y-3"
        >
          <div
            v-for="entry in data.song.vocabulary"
            :key="entry.word"
            class="rounded-2xl border border-default bg-default p-4"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="font-bold">
                  {{ entry.word }}
                </p>
                <p class="mt-0.5 text-sm text-muted">
                  {{ entry.meaning }}
                </p>
                <p
                  v-if="entry.example"
                  class="mt-1.5 text-xs italic text-muted/70"
                >
                  "{{ entry.example }}"
                </p>
              </div>
              <UBadge
                :label="entry.type"
                color="neutral"
                variant="subtle"
                size="xs"
                class="shrink-0 capitalize"
              />
            </div>
          </div>
        </div>

        <div
          v-else
          class="mb-6 text-center text-sm text-muted py-8"
        >
          <UIcon
            name="i-lucide-bookmark"
            class="size-8 mx-auto mb-2 opacity-40"
          />
          <p>Словарь для этой песни пока не добавлен</p>
        </div>

        <div class="flex justify-end">
          <UButton
            label="Получить результат"
            icon="i-lucide-trophy"
            trailing
            color="primary"
            size="lg"
            :loading="submitting"
            @click="onVocabFinish"
          />
        </div>
      </template>

      <!-- ── RESULT phase ──────────────────────────────────────────────────── -->
      <template v-else-if="phase === 'result'">
        <UCard class="mb-6 text-center">
          <div
            class="mb-4 inline-flex size-24 items-center justify-center rounded-full text-3xl font-black shadow-inner"
            :class="isPerfect
              ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300'
              : scorePercent >= 70
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
                : maxScore === 0
                  ? 'bg-primary/10 text-primary'
                  : 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400'"
          >
            <template v-if="maxScore === 0">
              🎵
            </template>
            <template v-else>
              {{ scorePercent }}%
            </template>
          </div>

          <h2 class="text-xl font-black">
            <template v-if="isPerfect">
              Идеально! 🏆
            </template>
            <template v-else-if="scorePercent >= 70 || maxScore === 0">
              Отлично! 🎉
            </template>
            <template v-else>
              Попробуй ещё раз 💪
            </template>
          </h2>

          <p
            v-if="maxScore > 0"
            class="mt-1 text-sm text-muted"
          >
            {{ score / 10 }} из {{ maxScore / 10 }} пропусков правильно
          </p>

          <div
            v-if="!submitting && xpEarned"
            class="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-bold text-amber-600 dark:text-amber-400"
          >
            <UIcon
              name="i-lucide-zap"
              class="size-4"
            />
            +{{ xpEarned }} XP
          </div>
          <div
            v-else-if="submitting"
            class="mt-4 inline-flex items-center gap-2 text-sm text-muted"
          >
            <UIcon
              name="i-lucide-loader-circle"
              class="size-4 animate-spin"
            />
            Сохраняем...
          </div>
        </UCard>

        <!-- Wrong gaps -->
        <div
          v-if="wrongGaps.length"
          class="mb-6 space-y-2"
        >
          <h3 class="text-sm font-bold uppercase tracking-wide text-muted">
            Пропуски с ошибками
          </h3>
          <div
            v-for="r in wrongGaps"
            :key="r.lineIndex"
            class="rounded-xl border border-red-200 bg-red-50/50 p-3 text-sm dark:border-red-900/40 dark:bg-red-900/10"
          >
            <div class="flex flex-wrap gap-4">
              <span class="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                <UIcon
                  name="i-lucide-x"
                  class="size-3.5"
                />
                Твой ответ: <strong>{{ r.userAnswer }}</strong>
              </span>
              <span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <UIcon
                  name="i-lucide-check"
                  class="size-3.5"
                />
                Правильно: <strong>{{ r.correctAnswer }}</strong>
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <UButton
            v-if="gapCount > 0 && scorePercent < 100"
            label="Попробовать ещё раз"
            icon="i-lucide-rotate-ccw"
            color="neutral"
            variant="outline"
            size="lg"
            @click="retry"
          />
          <div class="flex gap-2 sm:ml-auto">
            <NuxtLink to="/student/songs">
              <UButton
                label="Все песни"
                icon="i-lucide-layout-grid"
                color="neutral"
                variant="ghost"
                size="lg"
              />
            </NuxtLink>
          </div>
        </div>
      </template>
    </div>

    <LevelUpModal
      v-if="showLevelUp"
      @close="showLevelUp = false"
    />
  </div>
</template>
