<script setup lang="ts">
/**
 * One interactive exercise laid over the scanned page. Renders the right
 * interaction for the kind, all positioned by normalised (0..1) page coords:
 *   BLANK / SHORT_TEXT / ORAL → a text field on the blank
 *   CHOICE / UNDERLINE        → tap the correct printed option (circle / underline)
 *   TRUE_FALSE                → T / F toggle
 *   MATCH                     → tap a left then a right item to connect them
 * It never sees the answer key; correctness comes back from the server.
 */
import type { PageExercise, PageExerciseOption } from '~/entities/book'
import type { CheckResult } from '~/features/book-exercises'

const props = defineProps<{
  exercise: PageExercise
  response: Record<string, unknown>
  result: CheckResult | null
  pending: boolean
}>()

const emit = defineEmits<{
  (e: 'update', response: Record<string, unknown>): void
  (e: 'check'): void
}>()

const ex = computed(() => props.exercise)
const kind = computed(() => ex.value.kind)
const isBlank = computed(() => ['BLANK', 'SHORT_TEXT', 'ORAL'].includes(kind.value))
const isPick = computed(() => kind.value === 'CHOICE' || kind.value === 'UNDERLINE')
const options = computed<PageExerciseOption[]>(() => ex.value.options ?? [])

const pct = (v = 0) => `${v * 100}%`
const boxStyle = computed(() => ({ left: pct(ex.value.x), top: pct(ex.value.y), width: pct(ex.value.w), height: pct(ex.value.h) }))
const optStyle = (o: PageExerciseOption) => ({ left: pct(o.x), top: pct(o.y), width: pct(o.w), height: pct(o.h) })

const state = computed<'correct' | 'wrong' | 'pending' | 'idle'>(() => {
  if (props.pending) return 'pending'
  if (!props.result) return 'idle'
  if (props.result.isCorrect === true) return 'correct'
  if (props.result.isCorrect === false) return 'wrong'
  return 'idle'
})

// ── Text (BLANK / SHORT_TEXT / ORAL) ──────────────────────────
const text = computed({
  get: () => (props.response?.text as string) ?? '',
  set: (v: string) => emit('update', { text: v })
})
const submitText = () => { if (text.value.trim()) emit('check') }

const ringClass = computed(() => ({
  correct: 'ring-2 ring-green-500 bg-green-50/70 dark:bg-green-900/30',
  wrong: 'ring-2 ring-red-500 bg-red-50/70 dark:bg-red-900/30',
  pending: 'ring-2 ring-primary/60 bg-white/70 dark:bg-neutral-800/70',
  idle: 'ring-1 ring-primary/40 bg-white/70 dark:bg-neutral-800/70 hover:ring-primary'
}[state.value]))

const anim = ref('')
watch(state, (s) => {
  if (s === 'correct') { anim.value = 'ib-pop'; setTimeout(() => { anim.value = '' }, 450) } else if (s === 'wrong') { anim.value = 'ib-shake'; setTimeout(() => { anim.value = '' }, 450) }
})

// ── Pick (CHOICE / UNDERLINE) ─────────────────────────────────
const selectedId = computed(() => props.response?.optionId as string | undefined)
const correctId = computed(() => props.result?.correctAnswer)
const pickOption = (id?: string) => {
  if (!id) return
  emit('update', { optionId: id })
  nextTick(() => emit('check'))
}
// per-option visual after a result
const optOutcome = (o: PageExerciseOption): 'sel-ok' | 'sel-bad' | 'answer' | 'none' => {
  if (!props.result) return o.id && o.id === selectedId.value ? 'sel-ok' : 'none'
  if (o.id === selectedId.value) return props.result.isCorrect ? 'sel-ok' : 'sel-bad'
  if (correctId.value && o.id === correctId.value) return 'answer'
  return 'none'
}

// ── True / False ──────────────────────────────────────────────
const selectedBool = computed(() => props.response?.value as boolean | undefined)
const pickBool = (value: boolean) => { emit('update', { value }); nextTick(() => emit('check')) }

// ── Match (connect L ↔ R) ─────────────────────────────────────
const lefts = computed(() => options.value.filter(o => o.side === 'L'))
const rights = computed(() => options.value.filter(o => o.side === 'R'))
const pairs = computed<Record<string, string>>(() => {
  const p = (props.response?.pairs as { l: string, r: string }[]) ?? []
  return Object.fromEntries(p.map(x => [x.l, x.r]))
})
const armedLeft = ref<string | null>(null)
const setPairs = (map: Record<string, string>) => {
  emit('update', { pairs: Object.entries(map).map(([l, r]) => ({ l, r })) })
}
const tapLeft = (id?: string) => {
  if (!id) return
  if (pairs.value[id]) { const m = { ...pairs.value }; delete m[id]; setPairs(m); armedLeft.value = null; return }
  armedLeft.value = armedLeft.value === id ? null : id
}
const tapRight = (id?: string) => {
  if (!id || !armedLeft.value) return
  const m = { ...pairs.value }
  for (const l of Object.keys(m)) if (m[l] === id) delete m[l] // one R per L
  m[armedLeft.value] = id
  setPairs(m)
  armedLeft.value = null
}
const center = (o?: PageExerciseOption) => ({ x: (o?.x ?? 0) + (o?.w ?? 0) / 2, y: (o?.y ?? 0) + (o?.h ?? 0) / 2 })
const lines = computed(() => Object.entries(pairs.value).map(([l, r]) => {
  const a = center(lefts.value.find(o => o.id === l))
  const b = center(rights.value.find(o => o.id === r))
  return { a, b }
}))
const lineColor = computed(() => props.result?.isCorrect === true ? '#16a34a' : props.result?.isCorrect === false ? '#ef4444' : '#16a34a')

const feedbackPos = computed(() => ({ left: pct(ex.value.x), top: pct(Math.min(0.97, ex.value.y + ex.value.h)) }))
</script>

<template>
  <div class="pointer-events-none absolute inset-0 z-10">
    <!-- BLANK / SHORT_TEXT / ORAL -->
    <div
      v-if="isBlank"
      class="pointer-events-auto absolute flex items-stretch"
      :style="boxStyle"
    >
      <div
        class="relative flex w-full items-center rounded-md px-1 shadow-sm backdrop-blur-[1px] transition"
        :class="[ringClass, state === 'idle' ? 'ib-field-idle' : '', anim]"
      >
        <input
          v-model="text"
          type="text"
          :placeholder="kind === 'BLANK' ? '…' : 'ответ'"
          class="min-w-0 flex-1 bg-transparent px-1 text-center text-[clamp(10px,2.2cqw,16px)] font-semibold text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white"
          @keyup.enter="submitText"
          @blur="submitText"
        >
        <span
          v-if="state === 'correct'"
          class="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-green-500 text-white shadow"
        ><UIcon
          name="i-lucide-check"
          class="size-3"
        /></span>
        <span
          v-else-if="state === 'wrong'"
          class="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-red-500 text-white shadow"
        ><UIcon
          name="i-lucide-x"
          class="size-3"
        /></span>
      </div>
    </div>

    <!-- CHOICE (circle) / UNDERLINE -->
    <template v-else-if="isPick">
      <button
        v-for="o in options"
        :key="o.id"
        type="button"
        class="pointer-events-auto absolute cursor-pointer transition"
        :class="kind === 'CHOICE'
          ? {
            'sel-ok': 'rounded-full ring-2 ring-green-500 bg-green-400/15',
            'sel-bad': 'rounded-full ring-2 ring-red-500 bg-red-400/15',
            'answer': 'rounded-full ring-2 ring-green-500',
            'none': 'rounded-full ring-1 ring-primary/50 hover:ring-2 hover:ring-primary hover:bg-primary/10'
          }[optOutcome(o)]
          : {
            'sel-ok': 'border-b-[3px] border-green-500 bg-green-400/10',
            'sel-bad': 'border-b-[3px] border-red-500 bg-red-400/10',
            'answer': 'border-b-[3px] border-green-500',
            'none': 'border-b-2 border-primary/50 hover:border-b-[3px] hover:border-primary hover:bg-primary/5'
          }[optOutcome(o)]"
        :style="optStyle(o)"
        @click="pickOption(o.id)"
      />
    </template>

    <!-- TRUE / FALSE -->
    <div
      v-else-if="kind === 'TRUE_FALSE'"
      class="pointer-events-auto absolute flex items-center justify-center gap-1"
      :style="boxStyle"
    >
      <button
        type="button"
        class="rounded px-1.5 py-0.5 text-[clamp(9px,2cqw,14px)] font-bold shadow-sm"
        :class="selectedBool === true ? 'bg-green-500 text-white' : 'bg-white/80 text-neutral-700 hover:bg-green-500/20'"
        @click="pickBool(true)"
      >
        T
      </button>
      <button
        type="button"
        class="rounded px-1.5 py-0.5 text-[clamp(9px,2cqw,14px)] font-bold shadow-sm"
        :class="selectedBool === false ? 'bg-red-500 text-white' : 'bg-white/80 text-neutral-700 hover:bg-red-500/20'"
        @click="pickBool(false)"
      >
        F
      </button>
    </div>

    <!-- MATCH -->
    <template v-else-if="kind === 'MATCH'">
      <svg
        class="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        <line
          v-for="(ln, i) in lines"
          :key="i"
          :x1="pct(ln.a.x)"
          :y1="pct(ln.a.y)"
          :x2="pct(ln.b.x)"
          :y2="pct(ln.b.y)"
          :stroke="lineColor"
          stroke-width="2.5"
          stroke-linecap="round"
        />
      </svg>
      <button
        v-for="o in lefts"
        :key="o.id"
        type="button"
        class="pointer-events-auto absolute rounded-md ring-1 transition"
        :class="[state === 'idle' ? 'ib-field-idle' : '', armedLeft === o.id ? 'ring-2 ring-primary bg-primary/20' : pairs[o.id!] ? 'ring-2 ring-green-500 bg-green-400/10' : 'ring-primary/40 hover:ring-primary bg-primary/5']"
        :style="optStyle(o)"
        @click="tapLeft(o.id)"
      />
      <button
        v-for="o in rights"
        :key="o.id"
        type="button"
        class="pointer-events-auto absolute rounded-md ring-1 transition"
        :class="[Object.values(pairs).includes(o.id!) ? 'ring-2 ring-green-500 bg-green-400/10' : 'ring-primary/40 hover:ring-primary bg-primary/5']"
        :style="optStyle(o)"
        @click="tapRight(o.id)"
      />
    </template>

    <!-- feedback bubble -->
    <div
      v-if="result && (state === 'correct' || state === 'wrong')"
      class="pointer-events-none absolute z-20 max-w-55 rounded-md px-2 py-1 text-[11px] leading-tight text-white shadow-lg"
      :class="state === 'correct' ? 'bg-green-600' : 'bg-red-600'"
      :style="feedbackPos"
    >
      {{ result.feedback }}
      <span
        v-if="state === 'wrong' && result.correctAnswer && isBlank"
        class="font-bold"
      > → {{ result.correctAnswer }}</span>
    </div>
  </div>
</template>
