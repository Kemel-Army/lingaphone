<script setup lang="ts">
/**
 * TapPairBoard — игровое поле «соедини пары».
 *
 * Слева колонка выражений (`3·4`), справа — значений (`12`). Ребёнок
 * тапает любую ячейку слева — она подсвечивается, потом тапает справа.
 * Если совпало — пара подсвечивается зелёным и через 600ms «исчезает»
 * (становится disabled). Если нет — обе ячейки снимаются с подсветки.
 *
 * Эмитит:
 *   - 'pair'   при удачной паре (с её id)
 *   - 'mistake' при ошибке
 *   - 'done'   когда все пары собраны
 */

import type { TapPairProblem } from '~/entities/learning-path'

const props = defineProps<{
  problem: TapPairProblem
  /** Заблокировать ввод (например, после finish) */
  disabled?: boolean
}>()

const emit = defineEmits<{
  pair: [pairId: string]
  mistake: [pickedLeftId: string, pickedRightId: string]
  done: []
}>()

const { play } = useSound()

const pickedLeft = ref<string | null>(null)
const pickedRight = ref<string | null>(null)
const matched = ref<Set<string>>(new Set())
const wrongFlash = ref<{ left: string, right: string } | null>(null)

// Перемешиваем правую колонку, чтобы пары не были тривиально рядом
const shuffledRight = computed(() => {
  const arr = [...props.problem.right]
  // Простой детерминированный shuffle на основе problem.id
  let seed = props.problem.id.charCodeAt(0)
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280
    const j = Math.floor((seed / 233280) * (i + 1))
    ;[arr[i]!, arr[j]!] = [arr[j]!, arr[i]!]
  }
  return arr
})

const isLeftDone = (id: string) => matched.value.has(id)
const isRightDone = (pairId: string) => matched.value.has(pairId)

const tryMatch = () => {
  if (!pickedLeft.value || !pickedRight.value) return
  const rightItem = props.problem.right.find(r => r.id === pickedRight.value)
  if (!rightItem) {
    pickedLeft.value = null
    pickedRight.value = null
    return
  }
  if (rightItem.pairId === pickedLeft.value) {
    // Match!
    matched.value = new Set([...matched.value, pickedLeft.value])
    play('correct')
    emit('pair', pickedLeft.value)
    pickedLeft.value = null
    pickedRight.value = null
    if (matched.value.size === props.problem.left.length) {
      setTimeout(() => emit('done'), 350)
    }
  } else {
    // Mismatch — кратко мигаем красным и сбрасываем
    play('wrong')
    wrongFlash.value = { left: pickedLeft.value, right: pickedRight.value }
    emit('mistake', pickedLeft.value, pickedRight.value)
    setTimeout(() => {
      wrongFlash.value = null
      pickedLeft.value = null
      pickedRight.value = null
    }, 550)
  }
}

const onPickLeft = (id: string) => {
  if (props.disabled || isLeftDone(id) || wrongFlash.value) return
  pickedLeft.value = id
  // Если справа уже выбрано — сразу проверяем
  if (pickedRight.value) tryMatch()
}

const onPickRight = (id: string) => {
  if (props.disabled || wrongFlash.value) return
  const rightItem = props.problem.right.find(r => r.id === id)
  if (!rightItem || isRightDone(rightItem.pairId)) return
  pickedRight.value = id
  if (pickedLeft.value) tryMatch()
}

/** S8 Phase 3 — отслеживаем «недавно собранную» пару, чтобы дать
 * 600ms празднования (зелёный + scale + glow), потом анимируем «улёт»
 * и только после этого фактически прячем кнопку через opacity-60. */
const justMatched = ref<string | null>(null)
const flying = ref<string | null>(null)
const matchTimers: ReturnType<typeof setTimeout>[] = []

watch(matched, (next, prev) => {
  const newId = [...next].find(id => !prev || !prev.has(id))
  if (!newId) return
  justMatched.value = newId
  matchTimers.push(setTimeout(() => {
    flying.value = newId
  }, 350))
  matchTimers.push(setTimeout(() => {
    justMatched.value = null
    flying.value = null
  }, 900))
}, { deep: true })

onBeforeUnmount(() => {
  matchTimers.forEach(t => clearTimeout(t))
})

const leftCellClass = (id: string) => {
  if (justMatched.value === id) {
    return flying.value === id
      ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-200 animate-pair-fly'
      : 'border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 animate-pair-pop'
  }
  if (isLeftDone(id)) return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 opacity-50'
  if (wrongFlash.value?.left === id) return 'border-rose-500 bg-rose-500/10 animate-shake'
  if (pickedLeft.value === id) return 'border-primary bg-primary/10 scale-105'
  return 'border-default bg-elevated hover:border-primary/40 hover:-translate-y-0.5'
}

const rightCellClass = (rightId: string, pairId: string) => {
  if (justMatched.value === pairId) {
    return flying.value === pairId
      ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-200 animate-pair-fly'
      : 'border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 animate-pair-pop'
  }
  if (isRightDone(pairId)) return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 opacity-50'
  if (wrongFlash.value?.right === rightId) return 'border-rose-500 bg-rose-500/10 animate-shake'
  if (pickedRight.value === rightId) return 'border-primary bg-primary/10 scale-105'
  return 'border-default bg-elevated hover:border-primary/40 hover:-translate-y-0.5'
}
</script>

<template>
  <div class="space-y-3">
    <p
      v-if="problem.prompt"
      class="text-sm font-semibold text-highlighted"
    >
      {{ problem.prompt }}
    </p>

    <div class="grid grid-cols-2 gap-3">
      <!-- Левая колонка -->
      <div class="space-y-2">
        <button
          v-for="item in problem.left"
          :key="item.id"
          type="button"
          :disabled="disabled || isLeftDone(item.id)"
          class="flex w-full min-w-0 items-center justify-center rounded-xl border-2 px-3 py-3 sm:py-4 text-base sm:text-lg font-bold tabular-nums transition-all duration-200 disabled:cursor-not-allowed wrap-break-word"
          :class="leftCellClass(item.id)"
          @click="onPickLeft(item.id)"
        >
          {{ item.label }}
        </button>
      </div>
      <!-- Правая колонка -->
      <div class="space-y-2">
        <button
          v-for="item in shuffledRight"
          :key="item.id"
          type="button"
          :disabled="disabled || isRightDone(item.pairId)"
          class="flex w-full min-w-0 items-center justify-center rounded-xl border-2 px-3 py-3 sm:py-4 text-base sm:text-lg font-bold tabular-nums transition-all duration-200 disabled:cursor-not-allowed wrap-break-word"
          :class="rightCellClass(item.id, item.pairId)"
          @click="onPickRight(item.id)"
        >
          {{ item.label }}
        </button>
      </div>
    </div>

    <p class="text-[11px] text-muted text-center">
      Найдено пар:
      <strong class="text-primary">
        <AnimatedCounter
          :value="matched.size"
          :duration="450"
        />
      </strong>
      из {{ problem.left.length }}
    </p>
  </div>
</template>

<style scoped>
@keyframes pair-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}
.animate-shake {
  animation: pair-shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

/* S8 Phase 3 — пульс на свежей паре перед уходом */
@keyframes pair-pop {
  0%   { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  35%  { transform: scale(1.08); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.35); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}
.animate-pair-pop {
  animation: pair-pop 0.35s cubic-bezier(0.25, 0.8, 0.4, 1.4);
}

/* S8 Phase 3 — «улёт» пары: лёгкое уменьшение + opacity drift */
@keyframes pair-fly {
  0%   { transform: scale(1) translateY(0); opacity: 1; }
  60%  { transform: scale(0.85) translateY(-8px); opacity: 0.4; }
  100% { transform: scale(0.7) translateY(-12px); opacity: 0.15; }
}
.animate-pair-fly {
  animation: pair-fly 0.55s cubic-bezier(0.4, 0, 0.6, 1);
}

@media (prefers-reduced-motion: reduce) {
  .animate-pair-pop,
  .animate-pair-fly,
  .animate-shake {
    animation-duration: 0.01ms !important;
  }
}
</style>
