<script setup lang="ts">
/**
 * FemiMascot — попугай «Lingo», гид-маскот платформы FEMO.
 *
 * Placeholder SVG implementation. Designed to be drop-in replaceable with
 * Lottie animations when artwork is ready — the <FemiMascot> public API
 * (state / size / line) will stay stable.
 */

import { useMascotReactions } from '~/shared/composables/useMascotReactions'

type MascotState
  = | 'greet'
    | 'think'
    | 'celebrate'
    | 'warn'
    | 'teach'
    | 'trophy'
  // S9 — расширенный набор состояний (программные SVG-вариации)
    | 'wink' // подмигивание — playful greeting
    | 'proud' // гордость — после большого успеха
    | 'confused' // запутался — squiggle eyes + ?
    | 'sleepy' // зевает — для idle-таймаутов / неактивности
    | 'dance' // пляшет — для streak-успехов
    | 'shy' // застенчиво — лёгкий румянец, опустил голову
type MascotSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  state?: MascotState
  size?: MascotSize
  /** Optional speech line shown in a bubble next to Феми. */
  line?: string
  /** Hide speech bubble even when line is set — for compact layouts. */
  silent?: boolean
  /** Игнорировать глобальные real-time реакции (flashState из useMascotReactions).
   * Полезно когда нужен «фиксированный» маскот (например в onboarding-tutorial). */
  ignoreReactions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  state: 'greet',
  size: 'md',
  line: '',
  silent: false,
  ignoreReactions: false
})

const { flashState, flashLine } = useMascotReactions()

/** Эффективное состояние = глобальная вспышка (если есть) > локальный props.state.
 * Так любой слой может через `flash('celebrate', 800)` заставить ВСЕ маскоты
 * на странице синхронно отреагировать на правильный/неправильный ответ. */
const effectiveState = computed<MascotState>(() => {
  if (!props.ignoreReactions && flashState.value) return flashState.value
  return props.state
})

const sizePx: Record<MascotSize, number> = {
  xs: 40,
  sm: 64,
  md: 96,
  lg: 144,
  xl: 200
}

const pixels = computed(() => sizePx[props.size])

/** Per-state visual tweaks — eyes, mouth, accessory, body tilt, idle-anim, blush. */
const config = computed(() => {
  switch (effectiveState.value) {
    case 'think':
      return { eyes: 'squint', mouth: 'pinch', tilt: -4, accessory: 'chin-paw', glow: false, blush: false, anim: 'none' }
    case 'celebrate':
      return { eyes: 'happy', mouth: 'smile-wide', tilt: 0, accessory: 'arms-up', glow: true, blush: false, anim: 'none' }
    case 'warn':
      return { eyes: 'wide', mouth: 'o', tilt: 0, accessory: 'finger-up', glow: false, blush: false, anim: 'shake' }
    case 'teach':
      return { eyes: 'focused', mouth: 'talk', tilt: 0, accessory: 'board', glow: false, blush: false, anim: 'none' }
    case 'trophy':
      return { eyes: 'happy', mouth: 'smile', tilt: -2, accessory: 'trophy', glow: true, blush: false, anim: 'bob-fast' }
    // ── S9 расширенные ─────────────────────────────────────────────
    case 'wink':
      return { eyes: 'wink', mouth: 'smile', tilt: 0, accessory: 'wave', glow: false, blush: false, anim: 'idle-bob' }
    case 'proud':
      return { eyes: 'happy', mouth: 'smile-wide', tilt: 2, accessory: 'arms-up', glow: true, blush: false, anim: 'idle-bob' }
    case 'confused':
      return { eyes: 'squiggle', mouth: 'pinch', tilt: 6, accessory: 'question', glow: false, blush: false, anim: 'idle-tilt' }
    case 'sleepy':
      return { eyes: 'closed', mouth: 'pinch', tilt: -2, accessory: 'zzz', glow: false, blush: false, anim: 'breathe' }
    case 'dance':
      return { eyes: 'happy', mouth: 'smile-wide', tilt: 0, accessory: 'arms-up', glow: true, blush: false, anim: 'dance' }
    case 'shy':
      return { eyes: 'squint', mouth: 'smile', tilt: -3, accessory: 'wave', glow: false, blush: true, anim: 'idle-bob' }
    case 'greet':
    default:
      return { eyes: 'happy', mouth: 'smile', tilt: 0, accessory: 'wave', glow: false, blush: false, anim: 'idle-bob' }
  }
})

/** Eye-blink: моргание раз в ~5s на 200ms (только для состояний, где
 * глаза «нормальные» — не closed/squint/squiggle/wink). Делает Феми живым. */
const isBlinking = ref(false)
let blinkTimer: ReturnType<typeof setTimeout> | null = null

const scheduleBlink = () => {
  if (blinkTimer) clearTimeout(blinkTimer)
  // Случайный интервал 4-7s
  const next = 4000 + Math.random() * 3000
  blinkTimer = setTimeout(() => {
    if (config.value.eyes === 'happy' || config.value.eyes === 'focused') {
      isBlinking.value = true
      setTimeout(() => {
        isBlinking.value = false
        scheduleBlink()
      }, 180)
    } else {
      scheduleBlink()
    }
  }, next)
}

onMounted(() => scheduleBlink())
onBeforeUnmount(() => {
  if (blinkTimer) clearTimeout(blinkTimer)
})
</script>

<template>
  <div
    class="inline-flex items-end gap-2"
    :style="{ lineHeight: 0 }"
  >
    <div
      class="relative shrink-0 transition-transform"
      :class="[
        config.anim === 'idle-bob' && 'femi-idle-bob',
        config.anim === 'idle-tilt' && 'femi-idle-tilt',
        config.anim === 'breathe' && 'femi-breathe',
        config.anim === 'bob-fast' && 'femi-bob-fast',
        config.anim === 'shake' && 'femi-shake',
        config.anim === 'dance' && 'femi-dance'
      ]"
      :style="{ width: `${pixels}px`, height: `${pixels}px`, transform: `rotate(${config.tilt}deg)` }"
    >
      <!-- Glow halo for celebratory states -->
      <div
        v-if="config.glow"
        class="pointer-events-none absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse"
      />

      <svg
        viewBox="0 0 200 200"
        class="relative size-full drop-shadow-sm"
        :aria-label="`Lingo (${effectiveState})`"
      >
        <!-- Drop shadow under feet -->
        <ellipse
          cx="100"
          cy="186"
          rx="45"
          ry="5"
          fill="currentColor"
          class="text-black/15"
        />

        <!-- Body — попугай Lingo -->
        <!-- Tail feathers -->
        <path
          d="M80 172 Q70 186 66 198"
          stroke="#DC2626"
          stroke-width="9"
          stroke-linecap="round"
          fill="none"
        />
        <path
          d="M100 174 Q99 190 99 200"
          stroke="#3B82F6"
          stroke-width="9"
          stroke-linecap="round"
          fill="none"
        />
        <path
          d="M120 172 Q130 186 134 198"
          stroke="#22C55E"
          stroke-width="9"
          stroke-linecap="round"
          fill="none"
        />
        <!-- Body (зелёный) -->
        <path
          d="M58 135 Q58 108 100 108 Q142 108 142 135 L146 175 Q146 182 138 182 L62 182 Q54 182 54 175 Z"
          fill="#22C55E"
        />
        <!-- Belly -->
        <ellipse
          cx="100"
          cy="152"
          rx="26"
          ry="27"
          fill="#86EFAC"
        />
        <!-- Wing left -->
        <path
          d="M58 138 Q38 150 40 170 Q50 176 62 164 Q66 148 66 136 Z"
          fill="#16A34A"
        />
        <!-- Wing right -->
        <path
          d="M142 138 Q162 150 160 170 Q150 176 138 164 Q134 148 134 136 Z"
          fill="#16A34A"
        />
        <!-- Wing feathers left -->
        <path
          d="M42 156 Q52 161 62 160"
          stroke="#15803D"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
        />
        <path
          d="M42 163 Q52 168 62 167"
          stroke="#15803D"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
        />
        <!-- Wing feathers right -->
        <path
          d="M158 156 Q148 161 138 160"
          stroke="#15803D"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
        />
        <path
          d="M158 163 Q148 168 138 167"
          stroke="#15803D"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
        />
        <!-- Head (круглая) -->
        <circle
          cx="100"
          cy="84"
          r="46"
          fill="#22C55E"
        />
        <!-- Хохолок (crest) -->
        <path
          d="M82 46 Q76 28 73 14"
          stroke="#DC2626"
          stroke-width="7"
          stroke-linecap="round"
          fill="none"
        />
        <circle
          cx="73"
          cy="13"
          r="5"
          fill="#DC2626"
        />
        <path
          d="M97 42 Q94 24 95 9"
          stroke="#F59E0B"
          stroke-width="7"
          stroke-linecap="round"
          fill="none"
        />
        <circle
          cx="95"
          cy="8"
          r="5"
          fill="#F59E0B"
        />
        <path
          d="M112 46 Q118 28 121 14"
          stroke="#3B82F6"
          stroke-width="7"
          stroke-linecap="round"
          fill="none"
        />
        <circle
          cx="121"
          cy="13"
          r="5"
          fill="#3B82F6"
        />
        <!-- White eye patches (parrot-style) -->
        <circle
          cx="82"
          cy="78"
          r="14"
          fill="#FFFFFF"
        />
        <circle
          cx="118"
          cy="78"
          r="14"
          fill="#FFFFFF"
        />
        <!-- White face patch (beak area) -->
        <ellipse
          cx="100"
          cy="98"
          rx="20"
          ry="18"
          fill="#F0FFF4"
        />
        <!-- Beak upper mandible -->
        <path
          d="M90 90 Q100 83 110 90 Q107 103 100 107 Q93 103 90 90 Z"
          fill="#F97316"
        />
        <path
          d="M93 91 Q100 86 107 91"
          stroke="#FED7AA"
          stroke-width="1.5"
          fill="none"
          stroke-linecap="round"
        />

        <!-- Blush (S9 — для shy state) -->
        <template v-if="config.blush">
          <ellipse
            cx="78"
            cy="100"
            rx="7"
            ry="4"
            fill="#F472B6"
            opacity="0.55"
          />
          <ellipse
            cx="122"
            cy="100"
            rx="7"
            ry="4"
            fill="#F472B6"
            opacity="0.55"
          />
        </template>

        <!-- Eyes -->
        <g>
          <!-- Left eye -->
          <template v-if="isBlinking || config.eyes === 'closed'">
            <!-- Закрытый глаз — горизонтальная дуга (моргание / сон) -->
            <path
              d="M74 78 Q82 82 90 78"
              stroke="#1E293B"
              stroke-width="3"
              stroke-linecap="round"
              fill="none"
            />
          </template>
          <template v-else-if="config.eyes === 'squiggle'">
            <!-- Запутался — волна вместо глаза -->
            <path
              d="M74 78 Q78 73 82 78 Q86 83 90 78"
              stroke="#1E293B"
              stroke-width="2.5"
              fill="none"
              stroke-linecap="round"
            />
          </template>
          <template v-else-if="config.eyes === 'happy' || config.eyes === 'wink'">
            <path
              d="M75 78 Q82 72 89 78"
              stroke="#1E293B"
              stroke-width="3"
              fill="none"
              stroke-linecap="round"
            />
          </template>
          <template v-else-if="config.eyes === 'wide'">
            <circle
              cx="82"
              cy="78"
              r="6"
              fill="#FFFFFF"
              stroke="#1E293B"
              stroke-width="2"
            />
            <circle
              cx="82"
              cy="79"
              r="3"
              fill="#1E293B"
            />
          </template>
          <template v-else-if="config.eyes === 'squint'">
            <path
              d="M74 78 L90 78"
              stroke="#1E293B"
              stroke-width="3"
              stroke-linecap="round"
              fill="none"
            />
          </template>
          <template v-else>
            <!-- focused / default -->
            <ellipse
              cx="82"
              cy="78"
              rx="4"
              ry="5"
              fill="#1E293B"
            />
            <circle
              cx="83"
              cy="76"
              r="1.2"
              fill="#FFFFFF"
            />
          </template>

          <!-- Right eye -->
          <template v-if="isBlinking || config.eyes === 'closed' || config.eyes === 'wink'">
            <!-- Wink-режим: только правый глаз закрыт; моргание / sleepy: оба -->
            <path
              d="M110 78 Q118 82 126 78"
              stroke="#1E293B"
              stroke-width="3"
              stroke-linecap="round"
              fill="none"
            />
          </template>
          <template v-else-if="config.eyes === 'squiggle'">
            <path
              d="M110 78 Q114 73 118 78 Q122 83 126 78"
              stroke="#1E293B"
              stroke-width="2.5"
              fill="none"
              stroke-linecap="round"
            />
          </template>
          <template v-else-if="config.eyes === 'happy'">
            <path
              d="M111 78 Q118 72 125 78"
              stroke="#1E293B"
              stroke-width="3"
              fill="none"
              stroke-linecap="round"
            />
          </template>
          <template v-else-if="config.eyes === 'wide'">
            <circle
              cx="118"
              cy="78"
              r="6"
              fill="#FFFFFF"
              stroke="#1E293B"
              stroke-width="2"
            />
            <circle
              cx="118"
              cy="79"
              r="3"
              fill="#1E293B"
            />
          </template>
          <template v-else-if="config.eyes === 'squint'">
            <path
              d="M110 78 L126 78"
              stroke="#1E293B"
              stroke-width="3"
              stroke-linecap="round"
              fill="none"
            />
          </template>
          <template v-else>
            <ellipse
              cx="118"
              cy="78"
              rx="4"
              ry="5"
              fill="#1E293B"
            />
            <circle
              cx="119"
              cy="76"
              r="1.2"
              fill="#FFFFFF"
            />
          </template>
        </g>

        <!-- Nostrils -->
        <ellipse
          cx="97"
          cy="91"
          rx="2"
          ry="1.5"
          fill="#EA580C"
          opacity="0.7"
        />
        <ellipse
          cx="103"
          cy="91"
          rx="2"
          ry="1.5"
          fill="#EA580C"
          opacity="0.7"
        />

        <!-- Mouth -->
        <g
          stroke="#1E293B"
          stroke-width="2.5"
          fill="none"
          stroke-linecap="round"
        >
          <path
            v-if="config.mouth === 'smile'"
            d="M92 102 Q100 110 108 102"
          />
          <path
            v-else-if="config.mouth === 'smile-wide'"
            d="M88 100 Q100 116 112 100"
          />
          <path
            v-else-if="config.mouth === 'pinch'"
            d="M95 105 L105 105"
          />
          <circle
            v-else-if="config.mouth === 'o'"
            cx="100"
            cy="105"
            r="4"
            fill="#1E293B"
            stroke="none"
          />
          <path
            v-else-if="config.mouth === 'talk'"
            d="M94 103 Q100 108 106 103"
          />
        </g>

        <!-- Accessory overlays -->
        <!-- Wave (wing tip) -->
        <g v-if="config.accessory === 'wave'">
          <path
            d="M36 104 Q24 116 26 132 Q34 138 44 128"
            fill="#16A34A"
          />
          <path
            d="M28 118 Q34 124 42 122"
            stroke="#15803D"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
          />
        </g>
        <!-- Chin wing (thinking) -->
        <g v-else-if="config.accessory === 'chin-paw'">
          <path
            d="M95 112 Q90 120 95 128 Q100 130 105 128 Q110 120 105 112 Z"
            fill="#16A34A"
          />
          <circle
            cx="100"
            cy="122"
            r="2"
            fill="#15803D"
            opacity="0.4"
          />
        </g>
        <!-- Wing up (warn) -->
        <g v-else-if="config.accessory === 'finger-up'">
          <rect
            x="55"
            y="70"
            width="10"
            height="50"
            rx="5"
            fill="#16A34A"
          />
          <circle
            cx="60"
            cy="68"
            r="6"
            fill="#22C55E"
          />
        </g>
        <!-- Wings up (celebrate) -->
        <g v-else-if="config.accessory === 'arms-up'">
          <circle
            cx="44"
            cy="66"
            r="11"
            fill="#22C55E"
          />
          <circle
            cx="156"
            cy="66"
            r="11"
            fill="#22C55E"
          />
          <rect
            x="49"
            y="72"
            width="8"
            height="40"
            rx="4"
            fill="#16A34A"
            transform="rotate(-25 53 92)"
          />
          <rect
            x="143"
            y="72"
            width="8"
            height="40"
            rx="4"
            fill="#16A34A"
            transform="rotate(25 147 92)"
          />
        </g>
        <!-- Teaching board -->
        <g v-else-if="config.accessory === 'board'">
          <rect
            x="30"
            y="120"
            width="48"
            height="32"
            rx="4"
            fill="#1F2937"
          />
          <rect
            x="30"
            y="120"
            width="48"
            height="32"
            rx="4"
            fill="none"
            stroke="#D6D3D1"
            stroke-width="2"
          />
          <path
            d="M38 130 L56 130 M38 138 L64 138 M38 146 L48 146"
            stroke="#F9FAFB"
            stroke-width="2"
            stroke-linecap="round"
          />
        </g>
        <!-- Trophy -->
        <g v-else-if="config.accessory === 'trophy'">
          <path
            d="M140 70 L160 70 L158 95 Q150 102 142 95 Z"
            fill="#FCD34D"
            stroke="#B45309"
            stroke-width="2"
          />
          <rect
            x="146"
            y="95"
            width="8"
            height="10"
            fill="#B45309"
          />
          <rect
            x="140"
            y="105"
            width="20"
            height="4"
            rx="1"
            fill="#B45309"
          />
          <path
            d="M140 76 Q132 78 134 86 Q138 88 140 86"
            fill="none"
            stroke="#B45309"
            stroke-width="2"
          />
          <path
            d="M160 76 Q168 78 166 86 Q162 88 160 86"
            fill="none"
            stroke="#B45309"
            stroke-width="2"
          />
        </g>
        <!-- S9 — zzz accessory (sleepy) -->
        <g v-else-if="config.accessory === 'zzz'">
          <text
            x="148"
            y="60"
            text-anchor="middle"
            class="fill-sky-400"
            font-size="22"
            font-weight="900"
            opacity="0.6"
          >z</text>
          <text
            x="158"
            y="48"
            text-anchor="middle"
            class="fill-sky-500"
            font-size="18"
            font-weight="900"
            opacity="0.8"
          >z</text>
          <text
            x="166"
            y="38"
            text-anchor="middle"
            class="fill-sky-600"
            font-size="14"
            font-weight="900"
          >z</text>
        </g>
        <!-- S9 — question mark accessory (confused) -->
        <g v-else-if="config.accessory === 'question'">
          <circle
            cx="160"
            cy="50"
            r="14"
            fill="#FCD34D"
            stroke="#92400E"
            stroke-width="2"
          />
          <text
            x="160"
            y="58"
            text-anchor="middle"
            class="fill-amber-900 dark:fill-amber-100"
            font-size="20"
            font-weight="900"
          >?</text>
        </g>
      </svg>
    </div>

    <!-- S9 flash speech bubble — приоритет над статическим line.
         Показывается на длительность flash() и автоматически исчезает. -->
    <Transition name="femi-bubble">
      <div
        v-if="!silent && (flashLine || line)"
        class="relative max-w-65 rounded-2xl rounded-bl-sm bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm ring-1 ring-black/5"
        :class="flashLine && 'femi-bubble-active'"
      >
        <span class="block leading-snug text-gray-800 dark:text-gray-100 font-semibold">
          {{ flashLine ?? line }}
        </span>
        <span
          class="absolute -left-1.5 bottom-2 size-3 rotate-45 bg-white dark:bg-gray-800 ring-1 ring-black/5"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* === S9 — idle and reactive animations ===
 * Бережно к производительности: только transform + scale, без layout-triggers.
 * GPU-ускорено на Galaxy A20+. */

@keyframes femi-bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}
.femi-idle-bob {
  animation: femi-bob 2.4s ease-in-out infinite;
  will-change: transform;
}

@keyframes femi-bob-fast {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-7px); }
}
.femi-bob-fast {
  animation: femi-bob-fast 0.9s ease-in-out infinite;
  will-change: transform;
}

@keyframes femi-tilt {
  0%, 100% { transform: rotate(6deg); }
  50%      { transform: rotate(-2deg); }
}
.femi-idle-tilt {
  animation: femi-tilt 1.6s ease-in-out infinite;
  will-change: transform;
}

@keyframes femi-breathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.04); }
}
.femi-breathe {
  animation: femi-breathe 3s ease-in-out infinite;
  will-change: transform;
}

@keyframes femi-shake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-3px); }
  40%      { transform: translateX(3px); }
  60%      { transform: translateX(-2px); }
  80%      { transform: translateX(2px); }
}
.femi-shake {
  animation: femi-shake 0.5s ease-in-out;
}

@keyframes femi-dance {
  0%   { transform: rotate(-6deg) translateY(0); }
  25%  { transform: rotate(6deg) translateY(-4px); }
  50%  { transform: rotate(-4deg) translateY(0); }
  75%  { transform: rotate(4deg) translateY(-3px); }
  100% { transform: rotate(-6deg) translateY(0); }
}
.femi-dance {
  animation: femi-dance 0.7s ease-in-out infinite;
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .femi-idle-bob,
  .femi-bob-fast,
  .femi-idle-tilt,
  .femi-breathe,
  .femi-shake,
  .femi-dance {
    animation: none !important;
  }
}

/* === S9 — flash speech bubble transition === */
.femi-bubble-enter-active,
.femi-bubble-leave-active {
  transition: opacity 180ms ease, transform 220ms cubic-bezier(0.25, 0.8, 0.4, 1.4);
}
.femi-bubble-enter-from {
  opacity: 0;
  transform: translateY(6px) scale(0.85);
}
.femi-bubble-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.95);
}

/* Активное (flash) сообщение слегка пульсирует, чтобы взгляд ребёнка
 * приклеился к маскоту, а не к кнопке. */
@keyframes femi-bubble-pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.05); }
}
.femi-bubble-active {
  animation: femi-bubble-pulse 0.7s ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  .femi-bubble-enter-active,
  .femi-bubble-leave-active,
  .femi-bubble-active {
    transition-duration: 0.01ms !important;
    animation: none !important;
  }
}
</style>
