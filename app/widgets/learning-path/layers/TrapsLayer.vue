<script setup lang="ts">
/**
 * TrapsLayer · S4 v2 · 3 режима + 3D flip + bug-hunter
 *
 * mode='flip'   (default) — классическая карточка с настоящим 3D flip:
 *                лицо «как часто пишут», тыл «правильно».
 * mode='spot'   — на экране набор вариантов решения, нужно тапнуть тот,
 *                где ошибка. На правильный тап раскрывается reveal.
 * mode='fix-it' — после reveal показываем поле ввода: «исправь» —
 *                ребёнок вводит правильный ответ.
 *
 * Все режимы поддерживают one-card-at-a-time flow + bug-hunter бейдж
 * (если задан в content) при завершении всех ловушек.
 */
import type { CapsuleLayer, LayerProgress, TrapsContent, TrapMode } from '~/entities/learning-path'

const props = defineProps<{
  layer: CapsuleLayer
  progress: LayerProgress | null
}>()

const emit = defineEmits<{
  complete: [payload: { interactionData: Record<string, unknown>, score?: number, maxScore?: number, timeSpentSeconds: number }]
}>()

const content = computed(() => props.layer.content as TrapsContent)
const traps = computed(() => content.value.traps ?? [])
const mode = computed<TrapMode>(() => content.value.mode ?? 'flip')
const startedAt = Date.now()
const isCompleted = computed(() => props.progress?.status === 'COMPLETED')

// S14 — Феми приветствует ребёнка голосом при входе в слой.
const { greetLayer } = useFemiDialogue()
onMounted(() => greetLayer('TRAPS'))

const { play } = useSound()
const xpFloater = useTemplateRef<{ spawn: (n: number, pos?: { x: number, y: number }, hue?: 'amber' | 'emerald' | 'sky' | 'rose') => void }>('xpFloater')

const idx = ref(0)
const flipped = ref<Record<string, boolean>>({})
const acknowledged = ref<Record<string, boolean>>({})
const spotPicked = ref<Record<string, number | null>>({})
const fixAnswer = ref<Record<string, string>>({})
const fixCorrect = ref<Record<string, boolean>>({})
const wrongFlash = ref<{ trapId: string, optIdx: number } | null>(null)
const submitting = ref(false)

const current = computed(() => traps.value[idx.value] ?? null)
const currentFlipped = computed(() => !!(current.value && flipped.value[current.value.id]))
const currentAck = computed(() => !!(current.value && acknowledged.value[current.value.id]))
const currentSpotPicked = computed(() => current.value ? spotPicked.value[current.value.id] : null)

// ── Flip mode actions ────────────────────────────────────────────
const flip = () => {
  if (!current.value) return
  flipped.value[current.value.id] = true
  play('whoosh')
}

const acknowledge = () => {
  if (!current.value) return
  acknowledged.value[current.value.id] = true
  play('pop')
}

// ── Spot mode actions ────────────────────────────────────────────
const pickSpot = (i: number, ev: MouseEvent) => {
  if (!current.value || currentFlipped.value || isCompleted.value) return
  const wrong = current.value.spotWrongIndex ?? -1
  spotPicked.value[current.value.id] = i
  if (i === wrong) {
    // Правильно нашёл ошибку
    play('correct')
    flipped.value[current.value.id] = true
    xpFloater.value?.spawn(10, { x: ev.clientX, y: ev.clientY }, 'emerald')
  } else {
    play('wrong')
    wrongFlash.value = { trapId: current.value.id, optIdx: i }
    setTimeout(() => {
      wrongFlash.value = null
    }, 600)
  }
}

// ── Fix-it actions ───────────────────────────────────────────────
const setFixAnswer = (val: string) => {
  if (!current.value) return
  fixAnswer.value[current.value.id] = val
}

const checkFix = (ev?: MouseEvent) => {
  const t = current.value
  if (!t) return
  const expected = t.fixCorrectAnswer
  const a = fixAnswer.value[t.id] ?? ''
  let ok = false
  if (typeof expected === 'number') ok = Number(a) === expected
  else if (typeof expected === 'string') ok = String(a).trim().toLowerCase() === expected.trim().toLowerCase()
  fixCorrect.value[t.id] = ok
  acknowledged.value[t.id] = true
  play(ok ? 'correct' : 'wrong')
  if (ok) xpFloater.value?.spawn(10, ev ? { x: ev.clientX, y: ev.clientY } : undefined, 'emerald')
}

// ── Navigation ────────────────────────────────────────────────────
const goNext = () => {
  if (idx.value < traps.value.length - 1) idx.value += 1
}
const goPrev = () => {
  if (idx.value > 0) idx.value -= 1
}

const allDone = computed(() =>
  traps.value.length > 0 && traps.value.every(t => acknowledged.value[t.id])
)
const ackCount = computed(() => Object.values(acknowledged.value).filter(Boolean).length)
const fixSuccessCount = computed(() => Object.values(fixCorrect.value).filter(Boolean).length)

const finish = async () => {
  if (submitting.value || isCompleted.value || !allDone.value) return
  submitting.value = true
  play('cheer')
  try {
    emit('complete', {
      interactionData: {
        mode: mode.value,
        interactions: traps.value.map(t => ({
          id: t.id,
          acknowledged: !!acknowledged.value[t.id],
          spotPicked: spotPicked.value[t.id] ?? null,
          fixAnswer: fixAnswer.value[t.id] ?? null,
          fixCorrect: fixCorrect.value[t.id] ?? null
        })),
        ackCount: ackCount.value,
        fixSuccessCount: fixSuccessCount.value
      },
      score: 1,
      maxScore: 1,
      timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000)
    })
  } finally {
    submitting.value = false
  }
}

const spotOptionClass = (trapId: string, optIdx: number) => {
  const picked = spotPicked.value[trapId]
  const wrong = current.value?.spotWrongIndex ?? -1
  if (currentFlipped.value && optIdx === wrong) return 'border-rose-500 bg-rose-500/10'
  if (currentFlipped.value && optIdx !== wrong) return 'border-emerald-500/40 bg-emerald-500/5 opacity-70'
  if (wrongFlash.value?.trapId === trapId && wrongFlash.value.optIdx === optIdx) return 'border-rose-500 bg-rose-500/10 animate-shake'
  if (picked === optIdx) return 'border-primary bg-primary/5'
  return 'border-default bg-elevated hover:border-primary/40 hover:-translate-y-0.5'
}
</script>

<template>
  <div class="space-y-6">
    <FloatingXp ref="xpFloater" />

    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-300">
        <UIcon
          name="i-lucide-alert-triangle"
          class="size-3.5"
        />
        Ловушки · Частые ошибки
      </div>
      <div
        v-if="content.bugHunterBadge"
        class="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-300"
      >
        <span aria-hidden="true">{{ content.bugHunterBadge.emoji }}</span>
        {{ content.bugHunterBadge.label }} · {{ ackCount }}/{{ traps.length }}
      </div>
    </div>

    <div class="flex items-start gap-4">
      <FemiMascot
        state="warn"
        size="md"
      />
      <div class="flex-1 min-w-0">
        <h2 class="text-xl sm:text-2xl font-black text-highlighted">
          {{ layer.title }}
        </h2>
        <p
          v-if="content.intro"
          class="mt-1 text-sm text-muted wrap-break-word"
        >
          {{ content.intro }}
        </p>
      </div>
    </div>

    <!-- Прогресс карточек -->
    <div class="flex items-center gap-2 text-xs">
      <span class="font-semibold text-highlighted">
        Карточка {{ idx + 1 }} из {{ traps.length }}
      </span>
      <span class="flex-1 h-1 rounded-full bg-muted overflow-hidden">
        <span
          class="block h-full bg-rose-500 transition-all duration-300"
          :style="{ width: `${(ackCount / (traps.length || 1)) * 100}%` }"
        />
      </span>
    </div>

    <!-- ════════════════════ MODE: FLIP (legacy + 3D flip) ════════════════════ -->
    <template v-if="mode === 'flip' && current">
      <div class="trap-scene perspective-flip">
        <div
          class="trap-card rounded-3xl"
          :class="currentFlipped ? 'is-flipped' : ''"
        >
          <!-- FRONT: ошибка -->
          <div class="trap-face trap-face--front rounded-3xl border-2 border-rose-500/30 bg-rose-500/5 p-5">
            <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-300">
              <UIcon
                name="i-lucide-x-circle"
                class="size-3.5"
              />
              Типичная ошибка
            </div>
            <p
              class="mt-4 text-base sm:text-lg font-bold text-highlighted line-through decoration-rose-500 decoration-2 wrap-break-word"
              v-html="renderMath(current.wrongStatement)"
            />
            <div class="mt-6 flex justify-end">
              <UButton
                color="primary"
                size="sm"
                @click="flip"
              >
                <UIcon
                  name="i-lucide-rotate-cw"
                  class="size-4"
                />
                Перевернуть
              </UButton>
            </div>
          </div>
          <!-- BACK: правильно -->
          <div class="trap-face trap-face--back rounded-3xl border-2 border-emerald-500/30 bg-emerald-500/5 p-5">
            <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">
              <UIcon
                name="i-lucide-search"
                class="size-3.5"
              />
              Почему так нельзя
            </div>
            <p
              class="mt-2 text-sm text-highlighted leading-snug wrap-break-word"
              v-html="renderMath(current.whyWrong)"
            />
            <div class="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
                <UIcon
                  name="i-lucide-check-circle-2"
                  class="size-3.5"
                />
                Как правильно
              </div>
              <p
                class="mt-1 text-base font-bold text-highlighted wrap-break-word"
                v-html="renderMath(current.correctStatement)"
              />
              <p
                v-if="current.example"
                class="mt-1 text-xs italic text-muted wrap-break-word"
              >
                {{ current.example }}
              </p>
            </div>
            <div class="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-highlighted wrap-break-word">
              <span class="font-bold text-amber-600 dark:text-amber-300">Запомни: </span>
              {{ current.rememberNote }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ════════════════════ MODE: SPOT ════════════════════ -->
    <template v-else-if="mode === 'spot' && current">
      <div class="rounded-2xl border border-default bg-default p-5">
        <p class="text-sm font-semibold text-highlighted mb-3">
          Найди решение с ошибкой:
        </p>
        <div class="grid gap-2 sm:grid-cols-2">
          <button
            v-for="(opt, oi) in current.spotOptions ?? []"
            :key="oi"
            type="button"
            :disabled="currentFlipped || isCompleted"
            class="flex w-full min-w-0 items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-all duration-200 disabled:cursor-not-allowed"
            :class="spotOptionClass(current.id, oi)"
            @click="pickSpot(oi, $event)"
          >
            <span
              class="flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
              :class="currentSpotPicked === oi ? 'border-primary bg-primary text-white' : 'border-default text-muted'"
            >
              {{ String.fromCharCode(65 + oi) }}
            </span>
            <span
              class="min-w-0 flex-1 text-highlighted wrap-break-word"
              v-html="renderMath(opt)"
            />
            <UIcon
              v-if="currentFlipped && oi === current.spotWrongIndex"
              name="i-lucide-target"
              class="ml-auto size-4 shrink-0 text-rose-500"
            />
          </button>
        </div>

        <!-- После находки — показываем reveal -->
        <div
          v-if="currentFlipped"
          class="mt-4 space-y-3"
        >
          <div class="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
            <div class="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-300">
              В чём ошибка
            </div>
            <p
              class="mt-1 text-sm text-highlighted wrap-break-word"
              v-html="renderMath(current.whyWrong)"
            />
          </div>
          <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div class="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
              Как правильно
            </div>
            <p
              class="mt-1 text-base font-bold text-highlighted wrap-break-word"
              v-html="renderMath(current.correctStatement)"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- ════════════════════ MODE: FIX-IT ════════════════════ -->
    <template v-else-if="mode === 'fix-it' && current">
      <div class="rounded-2xl border-2 border-rose-500/30 bg-rose-500/5 p-5">
        <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-300">
          <UIcon
            name="i-lucide-x-circle"
            class="size-3.5"
          />
          Так бывает неправильно
        </div>
        <p
          class="mt-2 text-base font-bold text-highlighted line-through decoration-rose-500 decoration-2 wrap-break-word"
          v-html="renderMath(current.wrongStatement)"
        />
        <p
          class="mt-2 text-sm text-highlighted wrap-break-word"
          v-html="renderMath(current.whyWrong)"
        />
      </div>

      <div class="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-5">
        <p class="text-sm font-bold text-highlighted">
          {{ current.fixPrompt ?? 'Исправь ошибку:' }}
        </p>
        <div class="mt-3 mx-auto w-full max-w-xs">
          <MathNumpad
            :model-value="fixAnswer[current.id] ?? ''"
            :expression="current.fixPrompt ?? ''"
            :show-expression="false"
            :disabled="currentAck && fixCorrect[current.id]"
            @update:model-value="setFixAnswer($event)"
            @submit="checkFix()"
          />
        </div>
        <div
          v-if="currentAck"
          class="mt-3 rounded-lg border px-3 py-2 text-xs"
          :class="fixCorrect[current.id]
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-rose-500/30 bg-rose-500/5'"
        >
          <span
            class="font-semibold"
            :class="fixCorrect[current.id] ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'"
          >
            {{ fixCorrect[current.id] ? '✓ Верно!' : '✗ Не совсем.' }}
          </span>
          <span v-if="!fixCorrect[current.id] && current.fixHint"> {{ current.fixHint }}</span>
        </div>
        <div class="mt-3 flex justify-end gap-2">
          <UButton
            v-if="!currentAck"
            color="primary"
            size="sm"
            :disabled="!fixAnswer[current.id]"
            @click="checkFix($event)"
          >
            Проверить
          </UButton>
        </div>
      </div>
    </template>

    <!-- ════════════════════ Card-level controls (общий блок) ════════════════════ -->
    <div
      v-if="current"
      class="flex items-center justify-between gap-2"
    >
      <UButton
        variant="ghost"
        size="sm"
        :disabled="idx === 0"
        @click="goPrev"
      >
        <UIcon
          name="i-lucide-chevron-left"
          class="size-4"
        />
        Назад
      </UButton>

      <div class="flex gap-2">
        <!-- Flip-mode: после переворота — «понял, не попадусь» -->
        <UButton
          v-if="mode === 'flip' && currentFlipped && !currentAck"
          color="success"
          variant="soft"
          size="sm"
          @click="acknowledge"
        >
          Понял, не попадусь
        </UButton>
        <UButton
          v-if="(currentAck || (mode === 'spot' && currentFlipped)) && idx < traps.length - 1"
          color="primary"
          size="sm"
          @click="(mode === 'spot' && currentFlipped && !currentAck) ? acknowledge() : goNext()"
        >
          Следующая карточка
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4"
          />
        </UButton>
      </div>
    </div>

    <!-- Finish -->
    <div
      v-if="allDone && !isCompleted"
      class="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
    >
      <div class="flex items-start gap-4">
        <FemiMascot
          state="celebrate"
          size="md"
        />
        <div class="flex-1">
          <p class="text-sm font-bold text-highlighted">
            Ты теперь знаешь, где подстерегают ошибки.
          </p>
          <p class="mt-1 text-xs text-muted">
            Эти карточки можно пересмотреть перед финалом. Впереди — объяснение своими словами.
          </p>
          <UButton
            class="mt-3"
            :loading="submitting"
            color="primary"
            size="lg"
            @click="finish"
          >
            Теперь — расскажи сам
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4"
            />
          </UButton>
        </div>
      </div>
    </div>

    <div
      v-else-if="isCompleted"
      class="flex items-center gap-2 text-sm text-muted"
    >
      <UIcon
        name="i-lucide-check-circle-2"
        class="size-4 text-emerald-500"
      />
      Слой пройден — нажми «Далее» слева.
    </div>
  </div>
</template>

<style scoped>
/* ═══════════ 3D Flip mechanics ═══════════ */
.perspective-flip {
  perspective: 1400px;
}
.trap-card {
  position: relative;
  width: 100%;
  min-height: 280px;
  transform-style: preserve-3d;
  transition: transform 0.7s cubic-bezier(0.25, 0.8, 0.4, 1);
}
.trap-card.is-flipped {
  transform: rotateY(180deg);
}
.trap-face {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.trap-face--back {
  transform: rotateY(180deg);
}

/* ═══════════ Shake on wrong spot pick ═══════════ */
@keyframes trap-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}
.animate-shake {
  animation: trap-shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

/* Когда карточка перевёрнута — даём «лицу-сзади» нормальный absolute, чтобы не перекрывалось */
.trap-card.is-flipped .trap-face--front {
  pointer-events: none;
}
</style>
