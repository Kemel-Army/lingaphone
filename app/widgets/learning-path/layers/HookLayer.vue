<script setup lang="ts">
/**
 * HookLayer · S2 v2 · Cinematic intro для второклассника
 *
 * Поведение:
 *   1. Если в content есть `frames` — показываем мини-комикс из StoryFrames.
 *      Прокликивая или дожидаясь автоплей, ребёнок доходит до hook-вопроса.
 *   2. Если есть `emojiChoices` — показываем эмодзи-плитки. Иначе — legacy
 *      текстовые кнопки (для обратной совместимости со старыми сидерами).
 *   3. На правильный (или единственный) выбор — SFX `successSfx`,
 *      всплывающие XP, мгновенное `complete`.
 *
 * Все новые поля опциональны: старый seed-контент работает без переделки.
 */
import type { CapsuleLayer, HookContent, LayerProgress, EmojiChoiceTile as EmojiChoiceTileType } from '~/entities/learning-path'

const props = defineProps<{
  layer: CapsuleLayer
  progress: LayerProgress | null
}>()

const emit = defineEmits<{
  complete: [payload: { interactionData: Record<string, unknown>, score?: number, maxScore?: number, timeSpentSeconds: number }]
}>()

const content = computed(() => props.layer.content as HookContent)
const startedAt = Date.now()

// S14 — Феми приветствует голосом + мимикой при входе.
const { flash: _flashMascot } = useMascotReactions()
const { greetLayer } = useFemiDialogue()
onMounted(() => {
  greetLayer('HOOK')
})

const isCompleted = computed(() => props.progress?.status === 'COMPLETED')

const { play } = useSound()

const xpFloater = useTemplateRef<{ spawn: (n: number, pos?: { x: number, y: number }, hue?: 'amber' | 'emerald' | 'sky' | 'rose') => void }>('xpFloater')

// ── Phase machine ──────────────────────────────────────────────────────
type Phase = 'story' | 'choice' | 'done'

const hasFrames = computed(() => (content.value.frames?.length ?? 0) > 0)
const hasEmojiChoices = computed(() => (content.value.emojiChoices?.length ?? 0) > 0)

const phase = ref<Phase>(hasFrames.value ? 'story' : 'choice')
const onStoryDone = () => {
  phase.value = 'choice'
}

const submitting = ref(false)
const selectedChoice = ref<string | null>(null)

const handleEmoji = async (tile: EmojiChoiceTileType, ev: MouseEvent) => {
  if (submitting.value || isCompleted.value || selectedChoice.value) return
  submitting.value = true
  selectedChoice.value = tile.id
  // Дофамин: SFX + XP-всплывашка
  play(content.value.successSfx ?? (tile.isPrimary ? 'sparkle' : 'pop'))
  if (tile.isPrimary) {
    xpFloater.value?.spawn(props.layer.xpReward || 10, { x: ev.clientX, y: ev.clientY }, 'amber')
  }
  // Лёгкая задержка чтобы успели сыграть звук и анимация выбора
  setTimeout(() => {
    emit('complete', {
      interactionData: { interactions: [{ tileId: tile.id, isPrimary: !!tile.isPrimary }], tileId: tile.id },
      score: 1,
      maxScore: 1,
      timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000)
    })
    submitting.value = false
  }, 400)
}

// Legacy text-choice handler
const handleLegacyChoice = (choiceId: string, isPrimary?: boolean) => {
  if (submitting.value || isCompleted.value) return
  submitting.value = true
  selectedChoice.value = choiceId
  play(isPrimary ? 'sparkle' : 'pop')
  setTimeout(() => {
    emit('complete', {
      interactionData: { interactions: [{ choiceId }], choiceId },
      score: 1,
      maxScore: 1,
      timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000)
    })
    submitting.value = false
  }, 200)
}

const handleAck = () => {
  if (submitting.value || isCompleted.value) return
  submitting.value = true
  play('whoosh')
  emit('complete', {
    interactionData: { interactions: [{ ack: true }], ack: true },
    score: 1,
    maxScore: 1,
    timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000)
  })
}
</script>

<template>
  <div class="space-y-6">
    <FloatingXp ref="xpFloater" />

    <!-- Header chip -->
    <div class="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">
      <UIcon
        name="i-lucide-sparkles"
        class="size-3.5"
      />
      {{ layer.title }}
    </div>

    <!-- ════════════════ PHASE: STORY (cinematic frames) ═════════════════ -->
    <div
      v-if="phase === 'story' && hasFrames && content.frames"
      v-motion
      :initial="{ opacity: 0, y: 20 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 400 } }"
      class="space-y-5"
    >
      <div class="flex items-start gap-4">
        <FemiMascot
          :state="content.mascotEntry ?? 'greet'"
          size="md"
        />
        <div class="flex-1">
          <h2 class="text-xl sm:text-2xl font-black text-highlighted">
            {{ content.headline }}
          </h2>
          <p
            v-if="content.body"
            class="mt-1 text-sm text-muted leading-relaxed"
          >
            {{ content.body }}
          </p>
        </div>
      </div>

      <StoryFrames
        :frames="content.frames"
        :bg-pattern="content.bgPattern ?? 'stars'"
        @done="onStoryDone"
      />

      <div class="flex justify-end">
        <UButton
          variant="ghost"
          size="sm"
          @click="onStoryDone"
        >
          Пропустить
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4"
          />
        </UButton>
      </div>
    </div>

    <!-- ════════════════ PHASE: CHOICE ═════════════════ -->
    <div
      v-else
      class="space-y-6"
    >
      <!-- Mascot + headline (legacy / fallback) -->
      <div
        v-if="!hasFrames"
        class="flex flex-col gap-6 sm:flex-row sm:items-start"
      >
        <FemiMascot
          :state="content.mascotEntry ?? 'greet'"
          size="lg"
        />
        <div class="flex-1 space-y-3">
          <h2 class="text-2xl sm:text-3xl font-black text-highlighted leading-tight">
            {{ content.headline }}
          </h2>
          <p
            v-if="content.body"
            class="text-base text-muted leading-relaxed"
          >
            {{ content.body }}
          </p>
        </div>
      </div>

      <!-- Prompt + emoji-choices (новый путь) -->
      <div
        v-if="hasEmojiChoices && content.emojiChoices"
        class="rounded-2xl border border-default bg-default p-5"
      >
        <p
          v-if="content.prompt"
          class="mb-4 text-base font-bold text-highlighted"
        >
          {{ content.prompt }}
        </p>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <EmojiChoiceTile
            v-for="tile in content.emojiChoices"
            :key="tile.id"
            :emoji="tile.emoji"
            :label="tile.label"
            :is-primary="tile.isPrimary"
            :selected="selectedChoice === tile.id"
            :revealed="!!selectedChoice"
            :disabled="submitting || isCompleted"
            @click="handleEmoji(tile, $event)"
          />
        </div>
      </div>

      <!-- Prompt + legacy text choices -->
      <div
        v-else-if="content.prompt"
        class="rounded-2xl border border-default bg-default p-5"
      >
        <p class="mb-4 text-sm font-semibold text-highlighted">
          {{ content.prompt }}
        </p>
        <div
          v-if="content.choices?.length"
          class="grid gap-2 sm:grid-cols-2"
        >
          <button
            v-for="c in content.choices"
            :key="c.id"
            type="button"
            :disabled="submitting || isCompleted"
            class="group relative flex min-w-0 items-center justify-between gap-3 rounded-xl border-2 border-default bg-elevated px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            :class="selectedChoice === c.id ? 'border-primary bg-primary/5' : ''"
            @click="handleLegacyChoice(c.id, c.isPrimary)"
          >
            <span class="min-w-0 flex-1 text-sm font-semibold text-highlighted wrap-break-word">{{ c.label }}</span>
            <UIcon
              :name="c.isPrimary ? 'i-lucide-sparkles' : 'i-lucide-chevron-right'"
              class="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-1"
            />
          </button>
        </div>
        <UButton
          v-else
          :loading="submitting"
          :disabled="isCompleted"
          size="lg"
          class="w-full sm:w-auto"
          @click="handleAck"
        >
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4"
          />
          Погнали
        </UButton>
      </div>

      <!-- Если нет ни prompt ни choices ни emojiChoices — простой ack -->
      <div
        v-else
        class="rounded-2xl border border-default bg-default p-5"
      >
        <UButton
          :loading="submitting"
          :disabled="isCompleted"
          size="lg"
          @click="handleAck"
        >
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4"
          />
          Погнали
        </UButton>
      </div>
    </div>

    <!-- Completed hint -->
    <div
      v-if="isCompleted"
      class="flex items-center gap-2 text-sm text-muted"
    >
      <UIcon
        name="i-lucide-check-circle-2"
        class="size-4 text-emerald-500"
      />
      Слой пройден — нажми «Далее» слева, чтобы продолжить.
    </div>
  </div>
</template>
