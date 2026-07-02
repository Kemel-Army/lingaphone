<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any, @stylistic/max-statements-per-line, @typescript-eslint/no-dynamic-delete */
/** Per-type content + answer editor for one exercise. Mutates the reactive
 * exercise object in place (content + answerKey). Admin fills their own content. */
import { LESSON_TYPE_META } from '~/entities/book'
import type { LessonExerciseType } from '~/entities/book'
import type { EditableExercise } from '~/features/lesson-authoring'
import ImageField from './ImageField.vue'

const props = defineProps<{ exercise: EditableExercise }>()
const ex = computed(() => props.exercise)
const uid = () => (import.meta.client && 'randomUUID' in crypto ? crypto.randomUUID() : `o${Date.now()}${Math.round(Math.random() * 1e5)}`)
const TYPES = Object.keys(LESSON_TYPE_META) as LessonExerciseType[]

const defaultsFor = (t: LessonExerciseType): { content: any, answerKey: any } => ({
  FILL_BLANK: { content: { items: [{ before: '', after: '', image: '' }] }, answerKey: { items: [{ accept: [] }] } },
  CHOOSE: { content: { items: [{ before: '', after: '', options: [{ id: uid(), label: '' }, { id: uid(), label: '' }] }] }, answerKey: { items: [{ correctId: '' }] } },
  MCQ: { content: { question: '', image: '', options: [{ id: uid(), label: '', image: '' }, { id: uid(), label: '', image: '' }] }, answerKey: { correctId: '' } },
  TRUE_FALSE: { content: { statement: '' }, answerKey: { value: true } },
  SHORT_TEXT: { content: { question: '' }, answerKey: { accept: [] } },
  REORDER: { content: { tiles: [] }, answerKey: { order: [] } },
  MATCH_PAIRS: { content: { left: [], right: [] }, answerKey: { pairs: [] } },
  WORD_IMAGE_MATCH: { content: { pairs: [] }, answerKey: { placement: {} } },
  SORT_COLUMNS: { content: { columns: [{ id: uid(), label: '' }, { id: uid(), label: '' }], items: [] }, answerKey: { placement: {} } }
}[t])

const applyType = (t: LessonExerciseType) => {
  ex.value.type = t
  const d = defaultsFor(t)
  ex.value.content = d.content
  ex.value.answerKey = d.answerKey
}
onMounted(() => {
  // ensure a valid skeleton exists for the current type
  if (!ex.value.content || Object.keys(ex.value.content).length === 0) {
    const d = defaultsFor(ex.value.type)
    ex.value.content = d.content
    ex.value.answerKey = ex.value.answerKey && Object.keys(ex.value.answerKey).length ? ex.value.answerKey : d.answerKey
  }
})

// ── list-based helpers ─────────────────────────────────────────
const c = computed<any>(() => ex.value.content)
const k = computed<any>(() => ex.value.answerKey)
const instructionModel = computed<string>({ get: () => ex.value.instruction ?? '', set: (v) => { ex.value.instruction = v } })
const explanationModel = computed<string>({ get: () => ex.value.explanation ?? '', set: (v) => { ex.value.explanation = v } })

const addBlank = () => { c.value.items.push({ before: '', after: '', image: '' }); k.value.items.push({ accept: [] }) }
const rmBlank = (i: number) => { c.value.items.splice(i, 1); k.value.items.splice(i, 1) }
const acceptStr = (arr: any) => (Array.isArray(arr) ? arr.join(', ') : '')
const setAccept = (target: any, v: string) => { target.accept = v.split(/[,\n]/).map(s => s.trim()).filter(Boolean) }

const addChoose = () => { c.value.items.push({ before: '', after: '', options: [{ id: uid(), label: '' }, { id: uid(), label: '' }] }); k.value.items.push({ correctId: '' }) }
const rmChoose = (i: number) => { c.value.items.splice(i, 1); k.value.items.splice(i, 1) }
const addChooseOpt = (i: number) => c.value.items[i].options.push({ id: uid(), label: '' })

const addMcqOpt = () => c.value.options.push({ id: uid(), label: '', image: '' })
const rmMcqOpt = (id: string) => { c.value.options = c.value.options.filter((o: any) => o.id !== id) }

const reorderText = computed<string>({
  get: () => (k.value.order ?? []).join(' '),
  set: (v: string) => {
    const words = v.split(/\s+/).filter(Boolean)
    k.value.order = words
    c.value.tiles = [...words].sort((a, b) => (a + '1').localeCompare(b + '2')) // stable shuffle-ish
  }
})

const addPair = () => { const id = uid(); c.value.left.push({ id, label: '' }); c.value.right.push({ id, label: '' }); k.value.pairs.push({ l: id, r: id }) }
const rmPair = (i: number) => { const id = c.value.left[i]?.id; c.value.left.splice(i, 1); c.value.right = c.value.right.filter((r: any) => r.id !== id); k.value.pairs = k.value.pairs.filter((p: any) => p.l !== id) }

const addWim = () => { const id = uid(); c.value.pairs.push({ id, word: '', image: '' }); k.value.placement[id] = id }
const rmWim = (i: number) => { const id = c.value.pairs[i]?.id; c.value.pairs.splice(i, 1); if (id) delete k.value.placement[id] }

const addColumn = () => c.value.columns.push({ id: uid(), label: '' })
const rmColumn = (id: string) => { c.value.columns = c.value.columns.filter((col: any) => col.id !== id) }
const addSortItem = () => { const id = uid(); c.value.items.push({ id, label: '', image: '' }); k.value.placement[id] = c.value.columns[0]?.id ?? '' }
const rmSortItem = (i: number) => { const id = c.value.items[i]?.id; c.value.items.splice(i, 1); if (id) delete k.value.placement[id] }
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- type -->
    <div class="grid grid-cols-3 gap-1">
      <button
        v-for="t in TYPES"
        :key="t"
        class="rounded-md border px-1 py-1 text-[10px] font-semibold transition"
        :class="ex.type === t ? 'border-primary bg-primary/10 text-primary' : 'border-default text-muted hover:border-primary/40'"
        @click="applyType(t)"
      >
        {{ LESSON_TYPE_META[t].label }}
      </button>
    </div>

    <UInput
      v-model="instructionModel"
      size="sm"
      placeholder="Инструкция (напр. Впиши a или an)"
    />

    <!-- FILL_BLANK -->
    <div
      v-if="ex.type === 'FILL_BLANK'"
      class="flex flex-col gap-2"
    >
      <div
        v-for="(it, i) in (c.items as any[])"
        :key="i"
        class="rounded-lg border border-default p-2"
      >
        <div class="mb-1 flex items-center gap-1">
          <UInput
            v-model="it.before"
            size="xs"
            placeholder="до"
            class="flex-1"
          />
          <span class="text-xs text-muted">[__]</span>
          <UInput
            v-model="it.after"
            size="xs"
            placeholder="после"
            class="flex-1"
          />
          <UButton
            size="xs"
            color="error"
            variant="ghost"
            icon="i-lucide-x"
            @click="rmBlank(i)"
          />
        </div>
        <ImageField
          v-model="it.image"
          class="mb-1"
        />
        <UInput
          size="xs"
          :model-value="acceptStr(k.items[i].accept)"
          placeholder="верные ответы через запятую"
          @update:model-value="(v: string) => setAccept(k.items[i], v)"
        />
      </div>
      <UButton
        size="xs"
        variant="soft"
        icon="i-lucide-plus"
        label="Пункт"
        @click="addBlank"
      />
    </div>

    <!-- CHOOSE -->
    <div
      v-else-if="ex.type === 'CHOOSE'"
      class="flex flex-col gap-2"
    >
      <div
        v-for="(it, i) in (c.items as any[])"
        :key="i"
        class="rounded-lg border border-default p-2"
      >
        <div class="mb-1 flex items-center gap-1">
          <UInput
            v-model="it.before"
            size="xs"
            placeholder="до"
            class="flex-1"
          />
          <UInput
            v-model="it.after"
            size="xs"
            placeholder="после"
            class="flex-1"
          />
          <UButton
            size="xs"
            color="error"
            variant="ghost"
            icon="i-lucide-x"
            @click="rmChoose(i)"
          />
        </div>
        <div
          v-for="o in it.options"
          :key="o.id"
          class="flex items-center gap-1"
        >
          <input
            type="radio"
            :checked="k.items[i].correctId === o.id"
            @change="k.items[i].correctId = o.id"
          >
          <UInput
            v-model="o.label"
            size="xs"
            class="flex-1"
            placeholder="вариант"
          />
        </div>
        <UButton
          size="xs"
          variant="ghost"
          icon="i-lucide-plus"
          label="Вариант"
          @click="addChooseOpt(i)"
        />
      </div>
      <UButton
        size="xs"
        variant="soft"
        icon="i-lucide-plus"
        label="Предложение"
        @click="addChoose"
      />
    </div>

    <!-- MCQ -->
    <div
      v-else-if="ex.type === 'MCQ'"
      class="flex flex-col gap-2"
    >
      <UInput
        v-model="c.question"
        size="sm"
        placeholder="Вопрос"
      />
      <ImageField v-model="c.image" />
      <div
        v-for="o in c.options"
        :key="o.id"
        class="flex items-center gap-1 rounded-lg border border-default p-1"
      >
        <input
          type="radio"
          :checked="k.correctId === o.id"
          @change="k.correctId = o.id"
        >
        <UInput
          v-model="o.label"
          size="xs"
          class="flex-1"
          placeholder="текст"
        />
        <ImageField
          v-model="o.image"
          class="w-40"
        />
        <UButton
          size="xs"
          color="error"
          variant="ghost"
          icon="i-lucide-x"
          @click="rmMcqOpt(o.id)"
        />
      </div>
      <UButton
        size="xs"
        variant="soft"
        icon="i-lucide-plus"
        label="Вариант"
        @click="addMcqOpt"
      />
    </div>

    <!-- TRUE_FALSE -->
    <div
      v-else-if="ex.type === 'TRUE_FALSE'"
      class="flex flex-col gap-2"
    >
      <UInput
        v-model="c.statement"
        size="sm"
        placeholder="Утверждение"
      />
      <div class="flex gap-2">
        <UButton
          size="xs"
          :variant="k.value ? 'solid' : 'soft'"
          color="success"
          label="True"
          @click="k.value = true"
        />
        <UButton
          size="xs"
          :variant="!k.value ? 'solid' : 'soft'"
          color="error"
          label="False"
          @click="k.value = false"
        />
      </div>
    </div>

    <!-- SHORT_TEXT -->
    <div
      v-else-if="ex.type === 'SHORT_TEXT'"
      class="flex flex-col gap-2"
    >
      <UInput
        v-model="c.question"
        size="sm"
        placeholder="Вопрос"
      />
      <UInput
        size="xs"
        :model-value="acceptStr(k.accept)"
        placeholder="верные ответы через запятую"
        @update:model-value="(v: string) => setAccept(k, v)"
      />
    </div>

    <!-- REORDER -->
    <div
      v-else-if="ex.type === 'REORDER'"
      class="flex flex-col gap-1"
    >
      <label class="text-xs text-muted">Правильное предложение (слова через пробел):</label>
      <UInput
        v-model="reorderText"
        size="sm"
        placeholder="She is a teacher"
      />
    </div>

    <!-- MATCH_PAIRS -->
    <div
      v-else-if="ex.type === 'MATCH_PAIRS'"
      class="flex flex-col gap-2"
    >
      <div
        v-for="(l, i) in (c.left as any[])"
        :key="l.id"
        class="flex items-center gap-1"
      >
        <UInput
          v-model="l.label"
          size="xs"
          class="flex-1"
          placeholder="левое"
        />
        <span class="text-muted">↔</span>
        <UInput
          v-model="c.right[i].label"
          size="xs"
          class="flex-1"
          placeholder="правое"
        />
        <UButton
          size="xs"
          color="error"
          variant="ghost"
          icon="i-lucide-x"
          @click="rmPair(i)"
        />
      </div>
      <UButton
        size="xs"
        variant="soft"
        icon="i-lucide-plus"
        label="Пара"
        @click="addPair"
      />
    </div>

    <!-- WORD_IMAGE_MATCH -->
    <div
      v-else-if="ex.type === 'WORD_IMAGE_MATCH'"
      class="flex flex-col gap-2"
    >
      <div
        v-for="(p, i) in (c.pairs as any[])"
        :key="p.id"
        class="flex items-center gap-1"
      >
        <UInput
          v-model="p.word"
          size="xs"
          class="flex-1"
          placeholder="слово"
        />
        <ImageField
          v-model="p.image"
          class="flex-1"
        />
        <UButton
          size="xs"
          color="error"
          variant="ghost"
          icon="i-lucide-x"
          @click="rmWim(i)"
        />
      </div>
      <UButton
        size="xs"
        variant="soft"
        icon="i-lucide-plus"
        label="Слово+картинка"
        @click="addWim"
      />
    </div>

    <!-- SORT_COLUMNS -->
    <div
      v-else-if="ex.type === 'SORT_COLUMNS'"
      class="flex flex-col gap-2"
    >
      <div class="flex flex-wrap gap-1">
        <div
          v-for="col in c.columns"
          :key="col.id"
          class="flex items-center gap-1"
        >
          <UInput
            v-model="col.label"
            size="xs"
            class="w-24"
            placeholder="столбец"
          />
          <UButton
            size="xs"
            color="error"
            variant="ghost"
            icon="i-lucide-x"
            @click="rmColumn(col.id)"
          />
        </div>
        <UButton
          size="xs"
          variant="ghost"
          icon="i-lucide-plus"
          label="Столбец"
          @click="addColumn"
        />
      </div>
      <div
        v-for="(it, i) in (c.items as any[])"
        :key="it.id"
        class="flex items-center gap-1"
      >
        <UInput
          v-model="it.label"
          size="xs"
          class="flex-1"
          placeholder="слово"
        />
        <ImageField
          v-model="it.image"
          class="w-32"
        />
        <select
          v-model="k.placement[it.id]"
          class="rounded border border-default bg-default px-1 py-0.5 text-xs"
        >
          <option
            v-for="col in c.columns"
            :key="col.id"
            :value="col.id"
          >
            {{ col.label || '—' }}
          </option>
        </select>
        <UButton
          size="xs"
          color="error"
          variant="ghost"
          icon="i-lucide-x"
          @click="rmSortItem(i)"
        />
      </div>
      <UButton
        size="xs"
        variant="soft"
        icon="i-lucide-plus"
        label="Слово"
        @click="addSortItem"
      />
    </div>

    <UInput
      v-model="explanationModel"
      size="sm"
      placeholder="Пояснение (после проверки)"
    />
  </div>
</template>
