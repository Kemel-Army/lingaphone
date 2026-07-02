<script setup lang="ts">
/**
 * Admin overlay editor. Place every interaction type on the page by dragging:
 *   BLANK / SHORT_TEXT / ORAL / TRUE_FALSE → one draggable box
 *   CHOICE / UNDERLINE                     → draggable hotspot per printed option, mark the correct one
 *   MATCH                                  → draggable left + right endpoints, then set the pairs
 * Everything (positions + answer key) saves via /api/admin/books/save-overlay.
 */
import { useBookAuthoring } from '~/features/book-authoring'
import type { EditableExercise, EditablePage } from '~/features/book-authoring'
import { PAGE_EXERCISE_KIND_META } from '~/entities/book'
import type { PageExerciseKind, PageExerciseOption } from '~/entities/book'

const props = defineProps<{ moduleId: string }>()
const { loadOverlay, saveOverlay } = useBookAuthoring()
const toast = useToast()

type UiExercise = EditableExercise & { _uid: string }
type UiPage = Omit<EditablePage, 'exercises'> & { exercises: UiExercise[] }

const pages = ref<UiPage[]>([])
const loading = ref(true)
const saving = ref(false)
const selectedPageIdx = ref(0)
const selectedUid = ref<string | null>(null)

const uid = () => (import.meta.client && 'randomUUID' in crypto ? crypto.randomUUID() : `u${Date.now()}${Math.round(Math.random() * 1e6)}`)
const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n))

const load = async () => {
  loading.value = true
  try {
    const { pages: p } = await loadOverlay(props.moduleId)
    pages.value = p.map(pg => ({ ...pg, exercises: pg.exercises.map(ex => ({ ...ex, _uid: uid() })) }))
    selectedPageIdx.value = 0
    selectedUid.value = null
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(() => props.moduleId, load)

const page = computed<UiPage | undefined>(() => pages.value[selectedPageIdx.value])
const selectedEx = computed<UiExercise | undefined>(() => page.value?.exercises.find(e => e._uid === selectedUid.value))
const KIND_LIST = Object.keys(PAGE_EXERCISE_KIND_META) as PageExerciseKind[]
const kindMeta = (k: PageExerciseKind) => PAGE_EXERCISE_KIND_META[k]

const isPick = (k?: string) => k === 'CHOICE' || k === 'UNDERLINE'
const isMatch = (k?: string) => k === 'MATCH'
const opts = computed<PageExerciseOption[]>(() => selectedEx.value?.options ?? [])
const lefts = computed(() => opts.value.filter(o => o.side === 'L'))
const rights = computed(() => opts.value.filter(o => o.side === 'R'))

// ── Add / remove exercises ────────────────────────────────────
const defaultKey = (kind: PageExerciseKind): Record<string, unknown> =>
  kind === 'TRUE_FALSE' ? { value: true } : isPick(kind) ? { correctId: '' } : isMatch(kind) ? { pairs: [] } : { accept: [] }

const seedOptions = (kind: PageExerciseKind): PageExerciseOption[] => {
  if (isPick(kind)) return [{ id: uid(), x: 0.35, y: 0.5, w: 0.05, h: 0.022 }, { id: uid(), x: 0.42, y: 0.5, w: 0.05, h: 0.022 }]
  if (isMatch(kind)) return [{ id: uid(), side: 'L', x: 0.08, y: 0.45, w: 0.04, h: 0.02 }, { id: uid(), side: 'R', x: 0.3, y: 0.45, w: 0.05, h: 0.02 }]
  return []
}

const addField = (kind: PageExerciseKind) => {
  if (!page.value) return
  const ex: UiExercise = {
    _uid: uid(), kind, x: 0.4, y: 0.45, w: kind === 'BLANK' ? 0.14 : 0.03, h: kind === 'BLANK' ? 0.03 : 0.025,
    prompt: '', options: seedOptions(kind), orderIndex: page.value.exercises.length,
    answerKey: defaultKey(kind), explanation: ''
  }
  page.value.exercises.push(ex)
  selectedUid.value = ex._uid
}
const removeSelected = () => {
  if (!page.value) return
  page.value.exercises = page.value.exercises.filter(e => e._uid !== selectedUid.value)
  selectedUid.value = null
}
const onKindChange = (k: PageExerciseKind) => {
  if (!selectedEx.value) return
  selectedEx.value.kind = k
  selectedEx.value.answerKey = defaultKey(k)
  if ((isPick(k) || isMatch(k)) && !selectedEx.value.options?.length) selectedEx.value.options = seedOptions(k)
}

// ── Options (positioned) ──────────────────────────────────────
const addOption = () => { if (selectedEx.value) selectedEx.value.options = [...opts.value, { id: uid(), x: 0.4, y: 0.55, w: 0.05, h: 0.022 }] }
const addEndpoint = (side: 'L' | 'R') => { if (selectedEx.value) selectedEx.value.options = [...opts.value, { id: uid(), side, x: side === 'L' ? 0.08 : 0.3, y: 0.55, w: side === 'L' ? 0.04 : 0.05, h: 0.02 }] }
const removeOption = (id?: string) => { if (selectedEx.value) selectedEx.value.options = opts.value.filter(o => o.id !== id) }

const correctId = computed<string>({
  get: () => (selectedEx.value?.answerKey?.correctId as string) ?? '',
  set: (v: string) => { if (selectedEx.value) selectedEx.value.answerKey = { correctId: v } }
})
const rightForLeft = (lId?: string) => ((selectedEx.value?.answerKey?.pairs as { l: string, r: string }[]) ?? []).find(p => p.l === lId)?.r ?? ''
const setRightForLeft = (lId?: string, rId?: string) => {
  if (!selectedEx.value || !lId) return
  const pairs = ((selectedEx.value.answerKey?.pairs as { l: string, r: string }[]) ?? []).filter(p => p.l !== lId)
  if (rId) pairs.push({ l: lId, r: rId })
  selectedEx.value.answerKey = { pairs }
}
const matchLines = computed(() => {
  const pairs = (selectedEx.value?.answerKey?.pairs as { l: string, r: string }[]) ?? []
  return pairs.map((p) => {
    const l = lefts.value.find(o => o.id === p.l); const r = rights.value.find(o => o.id === p.r)
    if (!l || !r) return null
    return { x1: (l.x ?? 0) + (l.w ?? 0) / 2, y1: (l.y ?? 0) + (l.h ?? 0) / 2, x2: (r.x ?? 0) + (r.w ?? 0) / 2, y2: (r.y ?? 0) + (r.h ?? 0) / 2 }
  }).filter(Boolean) as { x1: number, y1: number, x2: number, y2: number }[]
})

const acceptText = computed<string>({
  get: () => { const a = selectedEx.value?.answerKey?.accept; return Array.isArray(a) ? a.join('\n') : '' },
  set: (v: string) => { if (selectedEx.value) selectedEx.value.answerKey = { accept: v.split('\n').map(s => s.trim()).filter(Boolean) } }
})
const tfValue = computed<boolean>({
  get: () => Boolean(selectedEx.value?.answerKey?.value),
  set: (v: boolean) => { if (selectedEx.value) selectedEx.value.answerKey = { value: v } }
})
const promptModel = computed<string>({ get: () => selectedEx.value?.prompt ?? '', set: (v) => { if (selectedEx.value) selectedEx.value.prompt = v } })
const explanationModel = computed<string>({ get: () => selectedEx.value?.explanation ?? '', set: (v) => { if (selectedEx.value) selectedEx.value.explanation = v } })

// ── Generalised drag (works on an exercise box OR an option box) ──
type Box = { x?: number, y?: number, w?: number, h?: number }
const canvasRef = ref<HTMLElement | null>(null)
let drag: { box: Box, mode: 'move' | 'resize', sx: number, sy: number, ox: number, oy: number, ow: number, oh: number, rw: number, rh: number } | null = null
const startDrag = (box: Box, mode: 'move' | 'resize', e: PointerEvent, exUid?: string) => {
  e.stopPropagation(); e.preventDefault()
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  if (exUid) selectedUid.value = exUid
  drag = { box, mode, sx: e.clientX, sy: e.clientY, ox: box.x ?? 0, oy: box.y ?? 0, ow: box.w ?? 0.05, oh: box.h ?? 0.02, rw: rect.width, rh: rect.height }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', endDrag)
}
const onMove = (e: PointerEvent) => {
  if (!drag) return
  const dx = (e.clientX - drag.sx) / drag.rw
  const dy = (e.clientY - drag.sy) / drag.rh
  if (drag.mode === 'move') { drag.box.x = clamp(drag.ox + dx, 0, 1 - (drag.box.w ?? 0)); drag.box.y = clamp(drag.oy + dy, 0, 1 - (drag.box.h ?? 0)) } else { drag.box.w = clamp(drag.ow + dx, 0.015, 1 - (drag.box.x ?? 0)); drag.box.h = clamp(drag.oh + dy, 0.012, 1 - (drag.box.y ?? 0)) }
}
const endDrag = () => { drag = null; window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', endDrag) }

// ── Save ──────────────────────────────────────────────────────
const savePage = async () => {
  if (!page.value) return
  saving.value = true
  try {
    const payload: EditableExercise[] = page.value.exercises.map(({ _uid, ...ex }, i) => ({ ...ex, orderIndex: i }))
    const { saved } = await saveOverlay(page.value.id, payload)
    page.value.exercises.forEach((ex, i) => { ex.id = saved[i]?.id ?? ex.id })
    toast.add({ title: 'Страница сохранена', description: `${saved.length} заданий`, color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: 'Не удалось сохранить', description: String((e as Error)?.message ?? e), color: 'error' })
  } finally { saving.value = false }
}

const style = (b: Box) => ({ left: `${(b.x ?? 0) * 100}%`, top: `${(b.y ?? 0) * 100}%`, width: `${(b.w ?? 0.03) * 100}%`, height: `${(b.h ?? 0.02) * 100}%` })
const optLabel = (o: PageExerciseOption, i: number) => o.side ? `${o.side}${i + 1}` : String.fromCharCode(65 + i)
const rightOptions = computed(() => rights.value.map((o, i) => ({ label: `R${i + 1}`, value: o.id })))
</script>

<template>
  <div
    v-if="loading"
    class="flex h-64 items-center justify-center"
  >
    <UIcon
      name="i-lucide-loader-circle"
      class="size-8 animate-spin text-primary"
    />
  </div>
  <div
    v-else-if="!pages.length"
    class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-default py-16 text-center text-muted"
  >
    <UIcon
      name="i-lucide-image-off"
      class="size-10"
    />
    <p class="text-sm">
      Нет отрендеренных страниц. Сначала отрендери страницы модуля.
    </p>
  </div>

  <div
    v-else
    class="flex flex-col gap-3 lg:flex-row"
  >
    <!-- Page thumbnails -->
    <div class="flex gap-2 overflow-x-auto lg:w-24 lg:flex-col lg:overflow-visible">
      <button
        v-for="(pg, idx) in pages"
        :key="pg.id"
        class="relative shrink-0 overflow-hidden rounded-lg border-2 transition"
        :class="idx === selectedPageIdx ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'"
        @click="selectedPageIdx = idx; selectedUid = null"
      >
        <img
          :src="pg.imageUrl"
          :alt="`p${pg.pageNumber}`"
          class="h-20 w-16 object-cover lg:h-24 lg:w-20"
        >
        <span class="absolute bottom-0 right-0 bg-black/60 px-1 text-[10px] text-white">{{ pg.pageNumber }}</span>
        <span
          v-if="pg.exercises.length"
          class="absolute left-0 top-0 bg-primary px-1 text-[10px] font-bold text-inverted"
        >{{ pg.exercises.length }}</span>
      </button>
    </div>

    <!-- Canvas -->
    <div class="min-w-0 flex-1">
      <div class="mb-2 flex flex-wrap items-center gap-1.5">
        <UButton
          size="xs"
          icon="i-lucide-plus"
          label="Пропуск"
          color="primary"
          variant="soft"
          @click="addField('BLANK')"
        />
        <UButton
          size="xs"
          icon="i-lucide-circle-dot"
          label="Обвести"
          color="primary"
          variant="soft"
          @click="addField('CHOICE')"
        />
        <UButton
          size="xs"
          icon="i-lucide-underline"
          label="Подчеркнуть"
          color="primary"
          variant="soft"
          @click="addField('UNDERLINE')"
        />
        <UButton
          size="xs"
          icon="i-lucide-spline"
          label="Соединить"
          color="primary"
          variant="soft"
          @click="addField('MATCH')"
        />
        <UButton
          size="xs"
          icon="i-lucide-save"
          :loading="saving"
          label="Сохранить"
          color="primary"
          @click="savePage"
        />
      </div>

      <div
        ref="canvasRef"
        class="relative select-none overflow-hidden rounded-xl bg-white shadow ring-1 ring-black/10"
        @pointerdown="selectedUid = null"
      >
        <img
          v-if="page"
          :src="page.imageUrl"
          :alt="`Страница ${page.pageNumber}`"
          class="block w-full"
          draggable="false"
        >

        <!-- exercise anchor boxes -->
        <div
          v-for="ex in page?.exercises ?? []"
          :key="ex._uid"
          class="absolute cursor-move rounded border-2"
          :class="ex._uid === selectedUid ? 'border-primary bg-primary/10 ring-2 ring-primary/40' : 'border-primary/50 bg-primary/5'"
          :style="style(ex)"
          @pointerdown="startDrag(ex, 'move', $event, ex._uid)"
        >
          <span class="absolute -top-4 left-0 whitespace-nowrap rounded bg-primary px-1 text-[10px] font-bold text-inverted">{{ kindMeta(ex.kind).label }}</span>
          <span
            class="absolute -bottom-1.5 -right-1.5 size-3 cursor-se-resize rounded-full border border-white bg-primary"
            @pointerdown="startDrag(ex, 'resize', $event, ex._uid)"
          />
        </div>

        <!-- selected exercise: option / endpoint boxes + match lines -->
        <template v-if="selectedEx && (isPick(selectedEx.kind) || isMatch(selectedEx.kind))">
          <svg
            v-if="isMatch(selectedEx.kind)"
            class="pointer-events-none absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
          >
            <line
              v-for="(l, i) in matchLines"
              :key="i"
              :x1="`${l.x1 * 100}%`"
              :y1="`${l.y1 * 100}%`"
              :x2="`${l.x2 * 100}%`"
              :y2="`${l.y2 * 100}%`"
              stroke="#16a34a"
              stroke-width="2"
              stroke-dasharray="4 3"
            />
          </svg>
          <div
            v-for="(o, i) in selectedEx.options ?? []"
            :key="o.id"
            class="absolute cursor-move rounded ring-2"
            :class="o.side === 'L' ? 'bg-blue-400/20 ring-blue-500' : o.side === 'R' ? 'bg-amber-400/20 ring-amber-500' : correctId === o.id ? 'bg-green-400/25 ring-green-500' : 'bg-fuchsia-400/15 ring-fuchsia-500'"
            :style="style(o)"
            @pointerdown="startDrag(o, 'move', $event, selectedEx._uid)"
          >
            <span class="absolute -top-3.5 left-0 rounded bg-neutral-800 px-1 text-[9px] font-bold text-white">{{ optLabel(o, i) }}</span>
            <span
              class="absolute -bottom-1 -right-1 size-2.5 cursor-se-resize rounded-full border border-white bg-neutral-700"
              @pointerdown="startDrag(o, 'resize', $event, selectedEx._uid)"
            />
          </div>
        </template>
      </div>
      <p class="mt-1 text-[11px] text-muted">
        Тяни блоки по странице, за уголок — размер. Для «обвести/подчеркнуть» ставь по одному блоку на каждый печатный вариант.
      </p>
    </div>

    <!-- Inspector -->
    <div class="lg:w-72">
      <div
        v-if="!selectedEx"
        class="rounded-xl border border-dashed border-default p-4 text-center text-xs text-muted"
      >
        Добавь задание кнопкой сверху, потом расставь блоки на странице и задай ответ.
      </div>

      <div
        v-else
        class="flex flex-col gap-3 rounded-xl border border-default bg-elevated/40 p-3"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold">Задание</span>
          <UButton
            size="xs"
            color="error"
            variant="ghost"
            icon="i-lucide-trash-2"
            @click="removeSelected"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-muted">Тип</label>
          <div class="grid grid-cols-3 gap-1">
            <button
              v-for="k in KIND_LIST"
              :key="k"
              class="rounded-md border px-1 py-1 text-[10px] font-semibold transition"
              :class="selectedEx.kind === k ? 'border-primary bg-primary/10 text-primary' : 'border-default text-muted hover:border-primary/40'"
              @click="onKindChange(k)"
            >
              {{ kindMeta(k).label }}
            </button>
          </div>
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-muted">Подсказка</label>
          <UInput
            v-model="promptModel"
            size="xs"
            placeholder="напр. a или an?"
          />
        </div>

        <!-- CHOICE / UNDERLINE: positioned options + correct radio -->
        <div v-if="isPick(selectedEx.kind)">
          <label class="mb-1 block text-xs font-medium text-muted">Варианты (отметь верный, блоки двигай на странице)</label>
          <div class="flex flex-col gap-1">
            <div
              v-for="(o, i) in selectedEx.options ?? []"
              :key="o.id"
              class="flex items-center gap-2"
            >
              <input
                type="radio"
                :checked="correctId === o.id"
                @change="correctId = o.id ?? ''"
              >
              <span class="w-5 rounded bg-neutral-800 text-center text-[10px] font-bold text-white">{{ optLabel(o, i) }}</span>
              <UInput
                v-model="o.label"
                size="xs"
                class="flex-1"
                placeholder="текст (опц.)"
              />
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-lucide-x"
                @click="removeOption(o.id)"
              />
            </div>
            <UButton
              size="xs"
              variant="soft"
              icon="i-lucide-plus"
              label="Вариант"
              @click="addOption"
            />
          </div>
        </div>

        <!-- MATCH: left + right endpoints + pairs -->
        <div
          v-else-if="isMatch(selectedEx.kind)"
          class="flex flex-col gap-2"
        >
          <div class="flex gap-2">
            <UButton
              size="xs"
              variant="soft"
              color="info"
              icon="i-lucide-plus"
              label="Левый"
              @click="addEndpoint('L')"
            />
            <UButton
              size="xs"
              variant="soft"
              color="warning"
              icon="i-lucide-plus"
              label="Правый"
              @click="addEndpoint('R')"
            />
          </div>
          <div
            v-for="(o, i) in lefts"
            :key="o.id"
            class="flex items-center gap-2"
          >
            <span class="w-6 rounded bg-blue-600 text-center text-[10px] font-bold text-white">L{{ i + 1 }}</span>
            <span class="text-xs text-muted">→</span>
            <USelect
              :model-value="rightForLeft(o.id)"
              :items="rightOptions"
              value-key="value"
              size="xs"
              placeholder="R…"
              class="flex-1"
              @update:model-value="(v: string | undefined) => setRightForLeft(o.id, v)"
            />
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              icon="i-lucide-x"
              @click="removeOption(o.id)"
            />
          </div>
          <div
            v-for="(o, i) in rights"
            :key="o.id"
            class="flex items-center gap-2"
          >
            <span class="w-6 rounded bg-amber-600 text-center text-[10px] font-bold text-white">R{{ i + 1 }}</span>
            <UInput
              v-model="o.label"
              size="xs"
              class="flex-1"
              placeholder="текст (опц.)"
            />
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              icon="i-lucide-x"
              @click="removeOption(o.id)"
            />
          </div>
        </div>

        <!-- TRUE / FALSE -->
        <div v-else-if="selectedEx.kind === 'TRUE_FALSE'">
          <label class="mb-1 block text-xs font-medium text-muted">Правильно</label>
          <div class="flex gap-2">
            <UButton
              size="xs"
              :variant="tfValue ? 'solid' : 'soft'"
              color="success"
              label="True"
              @click="tfValue = true"
            />
            <UButton
              size="xs"
              :variant="!tfValue ? 'solid' : 'soft'"
              color="error"
              label="False"
              @click="tfValue = false"
            />
          </div>
        </div>

        <!-- BLANK / SHORT_TEXT / ORAL -->
        <div v-else>
          <label class="mb-1 block text-xs font-medium text-muted">Правильные ответы (по одному в строке)</label>
          <UTextarea
            v-model="acceptText"
            :rows="3"
            size="xs"
            placeholder="a&#10;an"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-muted">Пояснение</label>
          <UInput
            v-model="explanationModel"
            size="xs"
            placeholder="почему так"
          />
        </div>
      </div>
    </div>
  </div>
</template>
