<script setup lang="ts">
/**
 * Прохождение входного теста на сайте.
 *
 * Три шага: контактные данные → вопросы по одному → результат. Контакты
 * спрашиваем до вопросов, потому что заявка должна попасть в CRM даже если
 * ребёнок бросит тест на середине — отправляем то, что успел ответить.
 *
 * У каждого вопроса есть «Затрудняюсь ответить»: это осознанный пропуск,
 * который уходит в отчёт отдельным числом, а не молча засчитывается ошибкой.
 */
import {
  PLACEMENT_TESTS,
  PLACEMENT_AGE_BAND_MAP,
  type PlacementAgeBand,
  type PlacementAnswer,
  type PlacementAnswers,
  type PlacementQuestion
} from '~/shared/lib/placementTest'

const props = defineProps<{ ageBand: PlacementAgeBand }>()
const emit = defineEmits<{ (e: 'back'): void }>()

const def = computed(() => PLACEMENT_TESTS[props.ageBand])
const bandMeta = computed(() => PLACEMENT_AGE_BAND_MAP[props.ageBand])

type Stage = 'lead' | 'quiz' | 'result'
const stage = ref<Stage>('lead')

// ─── Шаг 1: контакты ─────────────────────────────────────────────────────────

const lead = reactive({ fullName: '', phone: '' })
const phoneDigits = computed(() => lead.phone.replace(/\D/g, ''))
const canStart = computed(() => lead.fullName.trim().length >= 2 && phoneDigits.value.length >= 10)

// ─── Шаг 2: вопросы ──────────────────────────────────────────────────────────

const index = ref(0)
const answers = ref<PlacementAnswers>({})
const current = computed<PlacementQuestion | undefined>(() => def.value.questions[index.value])
const total = computed(() => def.value.questions.length)
const progressPct = computed(() => Math.round((index.value / total.value) * 100))

// Черновики текущего вопроса — сбрасываются при переходе.
const choiceIdx = ref<number | null>(null)
const text = ref('')
const pairs = ref<Record<string, string>>({})
const armedLeft = ref<string | null>(null)
const builtOrder = ref<string[]>([])

const resetDraft = () => {
  choiceIdx.value = null
  text.value = ''
  pairs.value = {}
  armedLeft.value = null
  builtOrder.value = []
}

/** Готов ли текущий вопрос к отправке (иначе доступен только пропуск). */
const answered = computed(() => {
  const q = current.value
  if (!q) return false
  switch (q.kind) {
    case 'MATCH': return Object.keys(pairs.value).length === q.left.length
    case 'CHOICE': return choiceIdx.value !== null
    case 'ORDER': return builtOrder.value.length === q.tiles.length
    case 'SHORT':
    case 'OPEN': return text.value.trim().length > 0
    default: return false
  }
})

const draftAnswer = (): PlacementAnswer => {
  const q = current.value
  if (!q) return null
  switch (q.kind) {
    case 'MATCH': return { kind: 'MATCH', pairs: { ...pairs.value } }
    case 'CHOICE': return choiceIdx.value === null ? null : { kind: 'CHOICE', index: choiceIdx.value }
    case 'ORDER': return { kind: 'ORDER', order: [...builtOrder.value] }
    case 'SHORT': return { kind: 'SHORT', text: text.value.trim() }
    case 'OPEN': return { kind: 'OPEN', text: text.value.trim() }
  }
}

// ── MATCH: сначала слово слева, потом перевод справа ──
const rightToLeft = computed<Record<string, string>>(() => {
  const m: Record<string, string> = {}
  for (const [l, r] of Object.entries(pairs.value)) m[r] = l
  return m
})
const pairNumber = (leftId: string) => {
  const q = current.value
  return q?.kind === 'MATCH' ? q.left.findIndex(l => l.id === leftId) + 1 : 0
}
const omitKey = (o: Record<string, string>, k: string) => {
  const { [k]: _drop, ...rest } = o
  return rest
}
const tapLeft = (id: string) => {
  if (pairs.value[id]) {
    pairs.value = omitKey(pairs.value, id)
    armedLeft.value = null
    return
  }
  armedLeft.value = armedLeft.value === id ? null : id
}
const tapRight = (id: string) => {
  const l = rightToLeft.value[id]
  if (l) {
    pairs.value = omitKey(pairs.value, l)
    return
  }
  // Без выбранного слова слева правая колонка ничего не делает — подсказываем
  // это явно, иначе тап выглядит как «кнопка не работает».
  if (!armedLeft.value) {
    matchHint.value = true
    setTimeout(() => (matchHint.value = false), 1800)
    return
  }
  pairs.value = { ...pairs.value, [armedLeft.value]: id }
  armedLeft.value = null
}
const matchHint = ref(false)

// ── ORDER: собираем предложение из плиток ──
const orderBank = computed(() => {
  const q = current.value
  if (q?.kind !== 'ORDER') return []
  const used = [...builtOrder.value]
  return q.tiles.filter((t) => {
    const i = used.indexOf(t)
    if (i === -1) return true
    used.splice(i, 1)
    return false
  })
})
const addTile = (t: string) => builtOrder.value.push(t)
const removeTile = (i: number) => builtOrder.value.splice(i, 1)

// ─── Отправка ────────────────────────────────────────────────────────────────

const submitting = ref(false)
const submitError = ref('')
interface PlacementResponse {
  testId: string
  autoScore: number
  autoMax: number
  percent: number
  skippedCount: number
  recommendedLevel: string
}
const result = ref<PlacementResponse | null>(null)

/** Заведённая на сервере попытка — дописываем её, а не создаём вторую. */
const testId = ref<string | null>(null)

const post = (payload: Record<string, unknown>) =>
  $fetch<PlacementResponse>('/api/placement/submit', {
    method: 'POST',
    body: {
      ageBand: props.ageBand,
      fullName: lead.fullName.trim(),
      phone: lead.phone.trim(),
      ...(testId.value ? { testId: testId.value } : {}),
      ...payload
    }
  })

const send = async () => {
  submitting.value = true
  submitError.value = ''
  try {
    const res = await post({ answers: answers.value })
    testId.value = res.testId
    result.value = res
    stage.value = 'result'
  } catch (e: unknown) {
    submitError.value = (e as { data?: { message?: string } })?.data?.message ?? 'Не удалось отправить результат. Попробуй ещё раз.'
  } finally {
    submitting.value = false
  }
}

const commit = async (answer: PlacementAnswer) => {
  const q = current.value
  if (!q) return
  answers.value = { ...answers.value, [q.id]: answer }
  if (index.value < total.value - 1) {
    index.value++
    resetDraft()
  } else {
    await send()
  }
}

const next = () => commit(draftAnswer())
const skip = () => commit(null)

const starting = ref(false)

/**
 * Заявка уходит в CRM ДО первого вопроса.
 *
 * Иначе брошенный на середине тест не оставлял бы следа: контакты уже введены,
 * а лида нет — именно то, ради чего их и спрашивают заранее. Ошибку показываем,
 * но тест всё равно запускаем: не пускать ребёнка в задания из-за сети нельзя,
 * финальная отправка попробует создать заявку ещё раз.
 */
const start = async () => {
  index.value = 0
  answers.value = {}
  resetDraft()
  submitError.value = ''
  starting.value = true
  try {
    testId.value = (await post({ answers: {} })).testId
  } catch (e: unknown) {
    submitError.value = (e as { data?: { message?: string } })?.data?.message ?? ''
  } finally {
    starting.value = false
    stage.value = 'quiz'
  }
}
</script>

<template>
  <!-- ── Шаг 1: контактные данные ─────────────────────────────────────────── -->
  <div
    v-if="stage === 'lead'"
    class="mx-auto w-full max-w-lg"
  >
    <UButton
      icon="i-lucide-arrow-left"
      variant="ghost"
      color="neutral"
      size="sm"
      class="mb-4"
      @click="emit('back')"
    >
      Выбрать другой возраст
    </UButton>

    <div class="rounded-3xl border border-default bg-default p-6 sm:p-8">
      <div class="mb-5 flex items-center gap-3">
        <UIcon
          :name="bandMeta.icon"
          class="size-8 text-primary"
        />
        <div>
          <h2 class="text-xl font-bold">
            {{ def.title }}
          </h2>
          <p class="text-sm text-muted">
            {{ total }} заданий · примерно 15–20 минут
          </p>
        </div>
      </div>

      <p class="mb-5 text-sm text-muted">
        Оставь контакты — пришлём результат и подберём группу. Преподаватель проверит письменную часть
        и свяжется с тобой.
      </p>

      <div class="space-y-4">
        <UFormField
          label="Фамилия и имя ученика"
          required
        >
          <UInput
            v-model="lead.fullName"
            placeholder="Иванов Иван"
            size="lg"
            class="w-full"
            autocomplete="name"
          />
        </UFormField>
        <UFormField
          label="Телефон"
          required
          :help="phoneDigits.length > 0 && phoneDigits.length < 10 ? 'Похоже, номер неполный' : undefined"
        >
          <UInput
            v-model="lead.phone"
            placeholder="+7 700 000 00 00"
            size="lg"
            type="tel"
            class="w-full"
            autocomplete="tel"
          />
        </UFormField>
      </div>

      <UButton
        block
        size="lg"
        class="mt-6"
        :disabled="!canStart || starting"
        :loading="starting"
        @click="start"
      >
        Начать тест
      </UButton>
      <p class="mt-3 text-center text-xs text-muted">
        Нажимая «Начать тест», ты соглашаешься на обработку контактных данных.
      </p>
    </div>
  </div>

  <!-- ── Шаг 2: вопросы ───────────────────────────────────────────────────── -->
  <div
    v-else-if="stage === 'quiz' && current"
    class="mx-auto w-full max-w-2xl"
  >
    <div class="mb-4">
      <div class="mb-2 flex items-center justify-between text-xs font-semibold text-muted">
        <span>{{ current.title }}</span>
        <span>{{ index + 1 }} / {{ total }}</span>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-elevated">
        <div
          class="h-full rounded-full bg-primary transition-all duration-300"
          :style="{ width: `${progressPct}%` }"
        />
      </div>
    </div>

    <div class="rounded-3xl border border-default bg-default p-5 sm:p-7">
      <p class="mb-1 text-sm text-muted">
        {{ current.instruction }}
      </p>

      <pre
        v-if="'passage' in current && current.passage"
        class="mb-4 mt-3 whitespace-pre-wrap rounded-2xl bg-elevated p-4 font-sans text-sm leading-relaxed"
      >{{ current.passage }}</pre>

      <p
        v-if="'prompt' in current"
        class="mb-4 mt-2 text-lg font-semibold"
      >
        {{ current.prompt }}
      </p>

      <!-- MATCH -->
      <div
        v-if="current.kind === 'MATCH'"
        class="mt-4"
      >
        <p class="mb-3 text-xs font-semibold text-primary">
          Нажми слово слева, потом его перевод справа
        </p>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-2">
            <button
              v-for="l in current.left"
              :key="l.id"
              type="button"
              class="flex items-center justify-between gap-2 rounded-xl border-2 px-3 py-3 text-left font-semibold transition"
              :class="pairs[l.id]
                ? 'border-primary bg-primary/10'
                : armedLeft === l.id
                  ? 'border-primary ring-4 ring-primary/20'
                  : 'border-default hover:border-primary/60'"
              @click="tapLeft(l.id)"
            >
              <span>{{ l.label }}</span>
              <span
                v-if="pairs[l.id]"
                class="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-inverted"
              >{{ pairNumber(l.id) }}</span>
            </button>
          </div>
          <div class="flex flex-col gap-2">
            <button
              v-for="r in current.right"
              :key="r.id"
              type="button"
              class="flex items-center justify-between gap-2 rounded-xl border-2 px-3 py-3 text-left font-semibold transition"
              :class="rightToLeft[r.id]
                ? 'border-primary bg-primary/10'
                : armedLeft
                  ? 'border-primary/40 hover:border-primary'
                  : 'border-default opacity-70'"
              @click="tapRight(r.id)"
            >
              <span>{{ r.label }}</span>
              <span
                v-if="rightToLeft[r.id]"
                class="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-inverted"
              >{{ pairNumber(rightToLeft[r.id]!) }}</span>
            </button>
          </div>
        </div>
        <p
          v-if="matchHint"
          class="mt-3 text-center text-sm font-semibold text-amber-600"
        >
          Сначала выбери слово слева
        </p>
      </div>

      <!-- CHOICE -->
      <div
        v-else-if="current.kind === 'CHOICE'"
        class="flex flex-col gap-2"
      >
        <button
          v-for="(o, i) in current.options"
          :key="i"
          type="button"
          class="rounded-xl border-2 px-4 py-3 text-left font-semibold transition"
          :class="choiceIdx === i ? 'border-primary bg-primary/10' : 'border-default hover:border-primary/60'"
          @click="choiceIdx = i"
        >
          {{ o }}
        </button>
      </div>

      <!-- ORDER -->
      <div v-else-if="current.kind === 'ORDER'">
        <div class="mb-3 flex min-h-14 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-default p-3">
          <button
            v-for="(t, i) in builtOrder"
            :key="`${t}-${i}`"
            type="button"
            class="rounded-lg bg-primary px-3 py-1.5 font-semibold text-inverted"
            @click="removeTile(i)"
          >
            {{ t }}
          </button>
          <span
            v-if="!builtOrder.length"
            class="text-sm text-muted"
          >Нажимай слова по порядку</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(t, i) in orderBank"
            :key="`bank-${t}-${i}`"
            type="button"
            class="rounded-lg border-2 border-default px-3 py-1.5 font-semibold transition hover:border-primary"
            @click="addTile(t)"
          >
            {{ t }}
          </button>
        </div>
      </div>

      <!-- SHORT -->
      <UInput
        v-else-if="current.kind === 'SHORT'"
        v-model="text"
        size="lg"
        class="w-full"
        placeholder="Ответ на английском"
        autocomplete="off"
      />

      <!-- OPEN -->
      <UTextarea
        v-else
        v-model="text"
        :rows="6"
        class="w-full"
        placeholder="Пиши на английском"
      />

      <p
        v-if="current.kind === 'OPEN'"
        class="mt-2 text-xs text-muted"
      >
        Эту часть проверит преподаватель — она не влияет на автоматический балл.
      </p>

      <p
        v-if="submitError"
        class="mt-4 text-sm font-semibold text-red-600"
      >
        {{ submitError }}
      </p>

      <div class="mt-6 flex flex-wrap items-center gap-3">
        <UButton
          size="lg"
          :disabled="!answered || submitting"
          :loading="submitting"
          @click="next"
        >
          {{ index === total - 1 ? 'Завершить тест' : 'Дальше' }}
        </UButton>
        <UButton
          size="lg"
          variant="ghost"
          color="neutral"
          :disabled="submitting"
          @click="skip"
        >
          Затрудняюсь ответить
        </UButton>
      </div>
    </div>
  </div>

  <!-- ── Шаг 3: результат ─────────────────────────────────────────────────── -->
  <div
    v-else-if="stage === 'result' && result"
    class="mx-auto w-full max-w-lg text-center"
  >
    <div class="rounded-3xl border border-default bg-default p-7 sm:p-9">
      <UIcon
        name="i-lucide-party-popper"
        class="mx-auto mb-3 size-12 text-primary"
      />
      <p class="text-sm font-semibold uppercase tracking-wide text-muted">
        Предварительный уровень
      </p>
      <p class="my-2 text-5xl font-black text-primary">
        {{ result.recommendedLevel }}
      </p>
      <p class="text-sm text-muted">
        Правильных ответов: <b>{{ result.autoScore }}</b> из {{ result.autoMax }} ({{ result.percent }}%)
        <template v-if="result.skippedCount">
          <br>Пропущено вопросов: {{ result.skippedCount }}
        </template>
      </p>

      <div class="mt-5 rounded-2xl bg-elevated p-4 text-left text-sm">
        <p class="mb-2 font-semibold">
          Что дальше
        </p>
        <p class="text-muted">
          Мы получили твою заявку. Преподаватель проверит письменную часть, проведёт устную часть
          на пробном уроке и подтвердит финальный уровень.
        </p>
      </div>

      <div
        v-if="def.speakingQuestions.length"
        class="mt-4 rounded-2xl border border-default p-4 text-left text-sm"
      >
        <p class="mb-2 font-semibold">
          Устная часть на пробном уроке
        </p>
        <ul class="list-inside list-disc space-y-1 text-muted">
          <li
            v-for="(q, i) in def.speakingQuestions"
            :key="i"
          >
            {{ q }}
          </li>
        </ul>
      </div>

      <UButton
        to="/"
        block
        size="lg"
        class="mt-6"
      >
        На главную
      </UButton>
    </div>
  </div>
</template>
