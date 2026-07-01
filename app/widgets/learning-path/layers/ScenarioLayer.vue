<script setup lang="ts">
import type { CapsuleLayer, LayerProgress, ScenarioContent, ScenarioOrder, ScenarioTheme } from '~/entities/learning-path'

const props = defineProps<{
  layer: CapsuleLayer
  progress: LayerProgress | null
}>()

const emit = defineEmits<{
  complete: [payload: { interactionData: Record<string, unknown>, score?: number, maxScore?: number, timeSpentSeconds: number }]
}>()

const content = computed(() => props.layer.content as ScenarioContent)
const setting = computed(() => content.value.setting)
const theme = computed<ScenarioTheme>(() => content.value.theme ?? 'cafe')
const boss = computed(() => content.value.boss)
/** Полный список заказов = обычные + boss-final (если задан) */
const orders = computed<ScenarioOrder[]>(() => {
  const base = content.value.orders ?? []
  return boss.value ? [...base, boss.value] : base
})
const startedAt = Date.now()
const isCompleted = computed(() => props.progress?.status === 'COMPLETED')

const { play } = useSound()
const { flash } = useMascotReactions()
const { bossWin, streakSparkle } = useConfetti()

// S14 — Феми приветствует голосом при входе в слой.
const { greetLayer } = useFemiDialogue()
onMounted(() => {
  greetLayer('SCENARIO')
})
const xpFloater = useTemplateRef<{ spawn: (n: number, pos?: { x: number, y: number }, hue?: 'amber' | 'emerald' | 'sky' | 'rose') => void }>('xpFloater')

// ── Theme-pack: иконка, цвет-акцент, эмодзи-customer-фолбэк ──────
const THEMES: Record<ScenarioTheme, {
  icon: string
  chip: string
  bgGradient: string
  accentText: string
  customerEmoji: string
  ctaWord: string
}> = {
  cafe: {
    icon: 'i-lucide-coffee',
    chip: 'bg-orange-500/15 border-orange-500/20 text-orange-600 dark:text-orange-300',
    bgGradient: 'from-orange-500/5 to-amber-500/5 border-orange-500/30',
    accentText: 'text-orange-600 dark:text-orange-300',
    customerEmoji: '🧑',
    ctaWord: 'Выполнить заказ'
  },
  space: {
    icon: 'i-lucide-rocket',
    chip: 'bg-violet-500/15 border-violet-500/20 text-violet-600 dark:text-violet-300',
    bgGradient: 'from-violet-500/5 to-indigo-500/5 border-violet-500/30',
    accentText: 'text-violet-600 dark:text-violet-300',
    customerEmoji: '👨‍🚀',
    ctaWord: 'Запустить'
  },
  zoo: {
    icon: 'i-lucide-paw-print',
    chip: 'bg-emerald-500/15 border-emerald-500/20 text-emerald-600 dark:text-emerald-300',
    bgGradient: 'from-emerald-500/5 to-lime-500/5 border-emerald-500/30',
    accentText: 'text-emerald-600 dark:text-emerald-300',
    customerEmoji: '🦁',
    ctaWord: 'Покормить'
  },
  construction: {
    icon: 'i-lucide-hard-hat',
    chip: 'bg-amber-500/15 border-amber-500/20 text-amber-600 dark:text-amber-300',
    bgGradient: 'from-amber-500/5 to-yellow-500/5 border-amber-500/30',
    accentText: 'text-amber-600 dark:text-amber-300',
    customerEmoji: '👷',
    ctaWord: 'Построить'
  },
  artist: {
    icon: 'i-lucide-palette',
    chip: 'bg-pink-500/15 border-pink-500/20 text-pink-600 dark:text-pink-300',
    bgGradient: 'from-pink-500/5 to-rose-500/5 border-pink-500/30',
    accentText: 'text-pink-600 dark:text-pink-300',
    customerEmoji: '🎨',
    ctaWord: 'Нарисовать'
  },
  railway: {
    icon: 'i-lucide-train-front',
    chip: 'bg-sky-500/15 border-sky-500/20 text-sky-600 dark:text-sky-300',
    bgGradient: 'from-sky-500/5 to-cyan-500/5 border-sky-500/30',
    accentText: 'text-sky-600 dark:text-sky-300',
    customerEmoji: '🧳',
    ctaWord: 'Отправить'
  }
}
const themeMeta = computed(() => THEMES[theme.value])

// ── Combo-bonus ──────────────────────────────────────────────────
const comboCfg = computed(() => content.value.comboBonus)
const streak = ref(0)
const lastComboBonus = ref<{ amount: number, multiplier: number } | null>(null)

const idx = ref(0)
const current = computed<ScenarioOrder | null>(() => orders.value[idx.value] ?? null)

const answers = ref<Record<string, string>>({})
const revealed = ref<Record<string, boolean>>({})
const correctMap = ref<Record<string, boolean>>({})

const stats = ref({
  revenue: content.value.initialStats.revenue,
  reputation: content.value.initialStats.reputation,
  customers: content.value.initialStats.customers
})
const statsAnim = ref<{ revenue: number, reputation: number, customers: number } | null>(null)

const submitting = ref(false)

const currentId = computed(() => current.value?.id ?? '')
const currentAnswer = computed({
  get: () => (currentId.value ? (answers.value[currentId.value] ?? '') : ''),
  set: (val: string) => setAnswer(val)
})
const currentRevealed = computed(() => !!(currentId.value && revealed.value[currentId.value]))

const mathLikePattern = /[\d]/
const operatorPattern = /[+\-*/×÷=/%]/
const isMathOrder = computed(() => {
  if (!current.value) return false
  if (typeof current.value.correct === 'number') return true
  const request = current.value.request ?? ''
  const expected = String(current.value.correct ?? '')
  return operatorPattern.test(request) || operatorPattern.test(expected) || (mathLikePattern.test(request) && mathLikePattern.test(expected))
})

const setAnswer = (val: string) => {
  if (!current.value || currentRevealed.value) return
  answers.value[current.value.id] = val
}

const correctCount = computed(() => Object.values(correctMap.value).filter(Boolean).length)
const answeredAll = computed(() => orders.value.length > 0 && orders.value.every(o => revealed.value[o.id]))
const passedThreshold = computed(() => correctCount.value >= Math.ceil(orders.value.length * 0.5))

const judge = (order: ScenarioOrder, value: string): boolean => {
  const expected = order.correct
  if (value == null || value === '') return false
  if (typeof expected === 'number') return Number(value) === expected
  return String(value).trim().toLowerCase() === String(expected).trim().toLowerCase()
}

const isBossOrder = (o: ScenarioOrder) => boss.value && o.id === boss.value.id

const check = (ev?: MouseEvent) => {
  if (!current.value || currentRevealed.value) return
  const ok = judge(current.value, String(currentAnswer.value ?? ''))
  revealed.value[current.value.id] = true
  correctMap.value[current.value.id] = ok

  // Boss = удвоенная награда + спец-SFX
  const baseRevenue = current.value.revenueReward ?? 10
  const bossMult = isBossOrder(current.value) ? 2 : 1

  // Combo-bonus: каждые N подряд → x multiplier
  if (ok) streak.value += 1
  else streak.value = 0

  let comboMult = 1
  if (ok && comboCfg.value && streak.value > 0 && streak.value % comboCfg.value.streak === 0) {
    comboMult = comboCfg.value.multiplier
    lastComboBonus.value = { amount: baseRevenue * (comboMult - 1) * bossMult, multiplier: comboMult }
    setTimeout(() => {
      lastComboBonus.value = null
    }, 1600)
  }

  const revenue = ok ? Math.round(baseRevenue * bossMult * comboMult) : 0
  const rep = ok ? (current.value.reputationReward ?? 1) : -1
  statsAnim.value = {
    revenue,
    reputation: rep,
    customers: ok ? 1 : 0
  }
  stats.value.revenue += revenue
  stats.value.reputation = Math.max(0, stats.value.reputation + rep)
  stats.value.customers += ok ? 1 : 0

  // SFX + XP + маскот
  if (ok) {
    const isBoss = isBossOrder(current.value)
    play(isBoss ? 'levelup' : (comboMult > 1 ? 'sparkle' : 'correct'))
    // Boss-победа = trophy state на 1.6s; combo = celebrate; обычный = celebrate короткий
    flash(
      isBoss ? 'trophy' : 'celebrate',
      isBoss ? 1600 : (comboMult > 1 ? 1100 : 700)
    )

    const pos = ev ? { x: ev.clientX, y: ev.clientY } : undefined
    if (isBoss) {
      // Boss → 3-слойный взрыв XP в разных цветах + золотой ливень конфетти.
      xpFloater.value?.spawn(Math.round(revenue / 3), pos, 'amber')
      setTimeout(() => xpFloater.value?.spawn(Math.round(revenue / 3), pos, 'rose'), 90)
      setTimeout(() => xpFloater.value?.spawn(Math.round(revenue / 3), pos, 'sky'), 180)
      bossWin()
    } else if (comboMult > 1) {
      // Combo → 2-слойный взрыв (amber + emerald) + sparkle конфетти.
      xpFloater.value?.spawn(Math.round(revenue / 2), pos, 'amber')
      setTimeout(() => xpFloater.value?.spawn(Math.round(revenue / 2), pos, 'emerald'), 100)
      streakSparkle()
    } else {
      xpFloater.value?.spawn(revenue, pos, 'emerald')
    }
  } else {
    play('wrong')
    flash('warn', 1100)
  }

  setTimeout(() => {
    statsAnim.value = null
  }, 1200)
}

const nextOrder = () => {
  if (idx.value < orders.value.length - 1) idx.value += 1
}

const finish = async () => {
  if (submitting.value || isCompleted.value || !answeredAll.value) return
  submitting.value = true
  play('cheer')
  // S9 — если ВСЕ заказы верные, Феми гордится (1800ms 'proud' + голосовая фраза).
  // Иначе обычный celebrate.
  const perfect = correctCount.value === orders.value.length
  flash(perfect ? 'proud' : 'celebrate', perfect ? 1800 : 1500)
  try {
    emit('complete', {
      interactionData: {
        interactions: orders.value.map(o => ({
          id: o.id,
          answer: answers.value[o.id] ?? null,
          correct: !!correctMap.value[o.id]
        })),
        finalStats: stats.value
      },
      score: correctCount.value,
      maxScore: orders.value.length,
      timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000)
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="relative space-y-6">
    <!-- Парящий тематический фон-паттерн (S8 Phase 3). -->
    <ThemeBackground
      :theme="theme"
      class="-z-10"
    />
    <FloatingXp ref="xpFloater" />

    <div
      class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
      :class="themeMeta.chip"
    >
      <UIcon
        :name="themeMeta.icon"
        class="size-3.5"
      />
      Сценарий · Роль и контекст
    </div>

    <!-- Setting header -->
    <div
      class="rounded-2xl border bg-linear-to-br p-5"
      :class="themeMeta.bgGradient"
    >
      <div class="flex items-start gap-4">
        <FemiMascot
          state="greet"
          size="md"
        />
        <div class="flex-1">
          <h2 class="text-xl sm:text-2xl font-black text-highlighted">
            {{ setting.title }}
          </h2>
          <p class="mt-2 text-sm text-highlighted leading-snug">
            {{ setting.roleplay }}
          </p>
          <p
            v-if="setting.mascotLine"
            class="mt-2 rounded-lg bg-white/40 dark:bg-white/5 px-3 py-2 text-xs italic text-muted"
          >
            «{{ setting.mascotLine }}»
          </p>
        </div>
      </div>
    </div>

    <!-- Stats strip -->
    <div class="grid grid-cols-3 gap-3">
      <div class="relative rounded-xl border border-default bg-elevated p-3 text-center">
        <div class="text-[10px] font-bold uppercase tracking-wider text-muted">
          Выручка
        </div>
        <div class="mt-1 text-xl font-black tabular-nums text-highlighted">
          <AnimatedCounter
            :value="stats.revenue"
            :duration="700"
          />
        </div>
        <div
          v-if="statsAnim && statsAnim.revenue"
          class="absolute top-1 right-2 text-xs font-bold"
          :class="statsAnim.revenue > 0 ? 'text-emerald-500' : 'text-rose-500'"
        >
          {{ statsAnim.revenue > 0 ? '+' : '' }}{{ statsAnim.revenue }}
        </div>
      </div>
      <div class="relative rounded-xl border border-default bg-elevated p-3 text-center">
        <div class="text-[10px] font-bold uppercase tracking-wider text-muted">
          Репутация
        </div>
        <div class="mt-1 text-xl font-black tabular-nums text-highlighted">
          <AnimatedCounter
            :value="stats.reputation"
            :duration="500"
          />
        </div>
        <div
          v-if="statsAnim && statsAnim.reputation"
          class="absolute top-1 right-2 text-xs font-bold"
          :class="statsAnim.reputation > 0 ? 'text-emerald-500' : 'text-rose-500'"
        >
          {{ statsAnim.reputation > 0 ? '+' : '' }}{{ statsAnim.reputation }}
        </div>
      </div>
      <div class="relative rounded-xl border border-default bg-elevated p-3 text-center">
        <div class="text-[10px] font-bold uppercase tracking-wider text-muted">
          Клиенты
        </div>
        <div class="mt-1 text-xl font-black tabular-nums text-highlighted">
          <AnimatedCounter
            :value="stats.customers"
            :duration="400"
          />
        </div>
        <div
          v-if="statsAnim && statsAnim.customers"
          class="absolute top-1 right-2 text-xs font-bold text-emerald-500"
        >
          +{{ statsAnim.customers }}
        </div>
      </div>
    </div>

    <!-- Order queue chips -->
    <div class="flex gap-1.5">
      <span
        v-for="(o, i) in orders"
        :key="o.id"
        class="size-2.5 rounded-full transition-colors"
        :class="revealed[o.id]
          ? (correctMap[o.id] ? 'bg-emerald-500' : 'bg-rose-500')
          : (i === idx ? 'bg-orange-500' : 'bg-muted')"
      />
    </div>

    <!-- Current order -->
    <div
      v-if="current"
      class="rounded-2xl border bg-default p-5 transition-shadow"
      :class="isBossOrder(current) ? 'border-amber-400/50 ring-2 ring-amber-400/30 shadow-amber-300/20' : 'border-default'"
    >
      <div class="flex items-start gap-3">
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-full font-black text-lg"
          :class="isBossOrder(current) ? 'bg-amber-500/20 text-amber-600' : themeMeta.chip"
        >
          <span aria-hidden="true">{{ isBossOrder(current) ? '👑' : themeMeta.customerEmoji }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div
            class="text-xs font-bold uppercase tracking-wider wrap-break-word"
            :class="isBossOrder(current) ? 'text-amber-600 dark:text-amber-300' : themeMeta.accentText"
          >
            <span v-if="isBossOrder(current)">⚡ Финал · </span>
            Заказ {{ idx + 1 }} из {{ orders.length }} · {{ current.customer }}
          </div>
          <p class="mt-1 text-base font-semibold text-highlighted sm:text-lg wrap-break-word">
            «{{ current.request }}»
          </p>
          <p
            v-if="isBossOrder(current)"
            class="mt-1 text-[11px] font-bold text-amber-600 dark:text-amber-300"
          >
            🎯 x2 награда за финальный заказ
          </p>
        </div>
      </div>

      <!-- Combo бонус-всплывашка (S8 Phase 2 — bounce + glow) -->
      <transition name="combo">
        <div
          v-if="lastComboBonus"
          class="animate-combo-bounce mt-3 flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-violet-500/15 via-fuchsia-500/15 to-amber-500/15 border-2 border-violet-500/40 px-4 py-2.5 text-base font-black text-violet-600 dark:text-violet-300 shadow-lg shadow-violet-500/20"
        >
          <span class="text-2xl animate-pulse">✨</span>
          КОМБО ×{{ lastComboBonus.multiplier }}!
          <span class="text-amber-600 dark:text-amber-300">+{{ lastComboBonus.amount }}</span>
          <span class="text-2xl animate-pulse">⚡</span>
        </div>
      </transition>

      <div
        v-if="isMathOrder"
        class="mt-4"
      >
        <div class="mx-auto w-full max-w-xs">
          <MathNumpad
            v-model="currentAnswer"
            :expression="current.request"
            :show-expression="false"
            :disabled="currentRevealed"
            @submit="check"
          />
        </div>
      </div>

      <div
        v-else
        class="mt-4 flex items-center gap-2"
      >
        <input
          :value="currentAnswer"
          type="text"
          :disabled="currentRevealed"
          placeholder="Твой ответ"
          class="w-40 rounded-lg border-2 border-default bg-elevated px-3 py-2 text-lg font-black tabular-nums text-highlighted outline-none focus:border-orange-500"
          @input="setAnswer(($event.target as HTMLInputElement).value)"
        >
        <SpeechInputButton
          v-model="currentAnswer"
          :disabled="currentRevealed"
        />
      </div>

      <p
        v-if="current.unit"
        class="mt-2 text-sm text-muted"
      >
        Единица: {{ current.unit }}
      </p>

      <!-- Feedback -->
      <div
        v-if="currentRevealed"
        class="mt-3 rounded-lg border px-3 py-2 text-xs"
        :class="correctMap[current.id]
          ? 'border-emerald-500/30 bg-emerald-500/5 text-highlighted'
          : 'border-rose-500/30 bg-rose-500/5 text-highlighted'"
      >
        <span
          class="font-semibold"
          :class="correctMap[current.id] ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'"
        >
          {{ correctMap[current.id] ? 'Клиент доволен!' : 'Не то, что нужно.' }}
        </span>
        {{ correctMap[current.id] ? `Правильно: ${current.correct}${current.unit ? ' ' + current.unit : ''}.` : current.wrongFeedback }}
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <UButton
          v-if="!currentRevealed"
          color="primary"
          size="sm"
          :disabled="!currentAnswer"
          @click="check($event)"
        >
          {{ themeMeta.ctaWord }}
        </UButton>
        <UButton
          v-else-if="idx < orders.length - 1"
          color="primary"
          size="sm"
          @click="nextOrder"
        >
          Следующий клиент
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4"
          />
        </UButton>
      </div>
    </div>

    <!-- Finish -->
    <div
      v-if="answeredAll && !isCompleted"
      class="rounded-2xl border p-5"
      :class="passedThreshold
        ? 'border-emerald-500/30 bg-emerald-500/5'
        : 'border-amber-500/30 bg-amber-500/5'"
    >
      <div class="flex items-start gap-4">
        <FemiMascot
          :state="passedThreshold ? 'celebrate' : 'think'"
          size="md"
        />
        <div class="flex-1">
          <p class="text-sm font-bold text-highlighted">
            {{ passedThreshold ? 'Ты справился!' : 'Смена закончилась.' }}
          </p>
          <p class="mt-1 text-xs text-muted">
            Верных заказов — {{ correctCount }} из {{ orders.length }}. Выручка {{ stats.revenue }}, репутация {{ stats.reputation }}.
          </p>
          <UButton
            class="mt-3"
            :loading="submitting"
            color="primary"
            size="lg"
            @click="finish"
          >
            Дальше — ловушки
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
.combo-enter-active,
.combo-leave-active {
  transition: opacity 0.4s cubic-bezier(0.25, 0.8, 0.4, 1.2),
              transform 0.4s cubic-bezier(0.25, 0.8, 0.4, 1.2);
}
.combo-enter-from {
  opacity: 0;
  transform: scale(0.6) translateY(8px);
}
.combo-enter-to {
  opacity: 1;
  transform: scale(1) translateY(0);
}
.combo-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
</style>
