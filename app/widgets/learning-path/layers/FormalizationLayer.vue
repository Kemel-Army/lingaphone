<script setup lang="ts">
import type { CapsuleLayer, FormalizationContent, LayerProgress } from '~/entities/learning-path'

const props = defineProps<{
  layer: CapsuleLayer
  progress: LayerProgress | null
}>()

const emit = defineEmits<{
  complete: [payload: { interactionData: Record<string, unknown>, score?: number, maxScore?: number, timeSpentSeconds: number }]
}>()

const content = computed(() => props.layer.content as FormalizationContent)
const anatomy = computed(() => content.value.anatomy ?? [])
const terms = computed(() => content.value.terms ?? [])
const buildTask = computed(() => content.value.buildTask)
const startedAt = Date.now()

const isCompleted = computed(() => props.progress?.status === 'COMPLETED')

// S14 — Феми приветствует ребёнка голосом при входе в слой.
const { greetLayer } = useFemiDialogue()
onMounted(() => greetLayer('FORMALIZATION'))

// Build-task state: the student fills tokens (drag-and-drop simplified as buttons).
const filled = ref<string[]>([])
const revealed = ref(false)
const submitting = ref(false)

const expected = computed(() => buildTask.value?.expected ?? [])
const allFilled = computed(() => expected.value.length > 0 && filled.value.length === expected.value.length)
const isCorrect = computed(() =>
  allFilled.value && expected.value.every((tok, i) => filled.value[i] === tok)
)

const tokenBank = computed(() => {
  if (!buildTask.value) return []
  const base = [...buildTask.value.expected]
  // Если контент-автор задал distractors в buildTask — используем их;
  // иначе fallback на статичный набор (kid-friendly).
  const distractors = buildTask.value.distractors ?? ['целое', 'сумма', '+']
  return [...new Set([...base, ...distractors])]
})

// Voice глобально включаем по флагу content.voiceTerms (default true для 2 класса).

const pickToken = (tok: string) => {
  if (revealed.value || isCompleted.value) return
  if (filled.value.length < expected.value.length) filled.value.push(tok)
}
const removeAt = (idx: number) => {
  if (revealed.value || isCompleted.value) return
  filled.value.splice(idx, 1)
}
const check = () => {
  revealed.value = true
}
const reset = () => {
  filled.value = []
  revealed.value = false
}

const finish = async () => {
  if (submitting.value || isCompleted.value) return
  submitting.value = true
  try {
    emit('complete', {
      interactionData: {
        interactions: [{ filled: filled.value, correct: isCorrect.value }],
        buildCorrect: isCorrect.value
      },
      score: buildTask.value ? (isCorrect.value ? 1 : 0) : 1,
      maxScore: 1,
      timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000)
    })
  } finally {
    submitting.value = false
  }
}

// Colour mapping for anatomy blocks.
const anatomyColor = (accent?: string) => {
  switch (accent) {
    case 'emerald': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
    case 'sky': return 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30'
    case 'violet': return 'bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30'
    case 'amber': return 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
    case 'rose': return 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30'
    default: return 'bg-primary/10 text-primary border-primary/30'
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 border border-violet-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
      <UIcon
        name="i-lucide-book-open"
        class="size-3.5"
      />
      Теперь — строгий язык
    </div>

    <div class="flex items-start gap-4">
      <FemiMascot
        state="teach"
        size="md"
      />
      <div class="flex-1">
        <h2 class="text-xl sm:text-2xl font-black text-highlighted">
          {{ layer.title }}
        </h2>
        <p
          v-if="layer.subtitle"
          class="mt-1 text-sm text-muted"
        >
          {{ layer.subtitle }}
        </p>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════
         ANATOMY DIAGRAM
         ═══════════════════════════════════════════════════════════════ -->
    <div class="rounded-2xl border border-default bg-linear-to-br from-violet-500/5 to-purple-500/5 p-6">
      <h3 class="mb-4 text-center text-sm font-bold uppercase tracking-wider text-muted">
        {{ content.diagramTitle ?? 'Анатомия' }}
      </h3>
      <div class="flex flex-wrap items-center justify-center gap-3 sm:gap-5 stagger-fade">
        <template
          v-for="(part, i) in anatomy"
          :key="part.id"
        >
          <div class="flex min-w-0 flex-col items-center gap-1.5">
            <div
              data-tile
              class="relative size-20 sm:size-24 rounded-2xl border-2 font-black shadow-sm overflow-hidden p-2"
              :class="anatomyColor(part.accent)"
            >
              <span
                data-tile-num
                class="block w-full"
              >
                {{ part.value ?? part.label }}
              </span>
            </div>
            <div
              class="max-w-24 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-center wrap-break-word"
              :class="anatomyColor(part.accent)"
            >
              {{ part.label }}
            </div>
            <div class="max-w-24 text-[10px] text-muted text-center wrap-break-word">
              {{ part.role }}
            </div>
          </div>
          <div
            v-if="i < anatomy.length - 1"
            class="text-3xl sm:text-4xl text-muted font-black shrink-0"
            aria-hidden="true"
          >
            →
          </div>
        </template>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════
         TERMS
         ═══════════════════════════════════════════════════════════════ -->
    <div
      v-if="terms.length"
      class="space-y-2"
    >
      <h3 class="text-xs font-bold uppercase tracking-wider text-muted">
        Ключевые термины
      </h3>
      <div class="grid gap-3 sm:grid-cols-2 stagger-fade">
        <div
          v-for="(t, i) in terms"
          :key="i"
          class="rounded-xl border border-default bg-elevated p-4"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-300 text-xs font-bold tabular-nums">
              {{ i + 1 }}
            </span>
            <span class="min-w-0 flex-1 text-sm font-bold text-highlighted wrap-break-word">
              {{ t.term }}
            </span>
          </div>
          <p class="mt-2 text-sm text-muted leading-snug">
            {{ t.definition }}
          </p>
          <p
            v-if="t.example"
            class="mt-1 text-xs italic text-muted"
          >
            {{ t.example }}
          </p>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════
         BUILD TASK
         ═══════════════════════════════════════════════════════════════ -->
    <div
      v-if="buildTask"
      class="rounded-2xl border border-default bg-(--ui-bg) p-5"
    >
      <p class="text-sm font-semibold text-highlighted">
        {{ buildTask.prompt }}
      </p>

      <!-- Slots the student fills -->
      <div class="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-elevated border border-default px-4 py-3 text-lg sm:text-xl md:text-2xl">
        <template
          v-for="(tok, i) in expected"
          :key="`slot-${i}`"
        >
          <button
            v-if="filled[i]"
            type="button"
            :disabled="revealed || isCompleted"
            class="max-w-full rounded-lg border-2 px-3 py-1 font-bold transition wrap-break-word"
            :class="revealed
              ? (filled[i] === tok ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' : 'border-rose-500 bg-rose-500/10 text-rose-600')
              : 'border-primary/40 bg-primary/10 text-primary hover:border-primary'"
            @click="removeAt(i)"
          >
            {{ filled[i] }}
          </button>
          <span
            v-else
            class="rounded-lg border-2 border-dashed border-default px-3 py-1 text-muted"
          >
            ?
          </span>
        </template>
      </div>

      <!-- Token bank -->
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="tok in tokenBank"
          :key="tok"
          type="button"
          :disabled="revealed || filled.length >= expected.length || isCompleted"
          class="rounded-full border border-default bg-elevated px-3 py-1 text-sm font-semibold text-highlighted transition hover:border-primary/40 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          @click="pickToken(tok)"
        >
          {{ tok }}
        </button>
      </div>

      <div class="mt-4 flex items-center justify-between gap-2">
        <UButton
          v-if="!revealed"
          variant="ghost"
          size="sm"
          :disabled="filled.length === 0"
          @click="reset"
        >
          Сбросить
        </UButton>
        <div class="flex gap-2 ml-auto">
          <UButton
            v-if="!revealed"
            :disabled="!allFilled"
            color="primary"
            size="sm"
            @click="check"
          >
            Проверить
          </UButton>
          <UButton
            v-else-if="!isCorrect"
            variant="outline"
            size="sm"
            @click="reset"
          >
            Попробовать снова
          </UButton>
        </div>
      </div>
    </div>

    <!-- Finish card -->
    <div
      v-if="(!buildTask || revealed) && !isCompleted"
      class="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
    >
      <div class="flex items-start gap-4">
        <FemiMascot
          state="celebrate"
          size="md"
        />
        <div class="flex-1">
          <p class="text-sm font-bold text-highlighted">
            Теперь у тебя есть имя для каждой части.
          </p>
          <p class="mt-1 text-xs text-muted">
            Идём к пошаговому разбору эталонной задачи.
          </p>
          <UButton
            class="mt-3"
            :loading="submitting"
            color="primary"
            size="lg"
            @click="finish"
          >
            К разбору
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
