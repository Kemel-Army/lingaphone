<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Native lesson content editor (admin). Create units, write rule/intro blocks,
 * add exercises of any type, upload your own images, set answers. Saves to the
 * service-role tables. This is where YOUR licensed / own content is entered.
 */
import { useLessonAuthoring } from '~/features/lesson-authoring'
import type { EditableUnit, EditableExercise } from '~/features/lesson-authoring'
import ExerciseForm from './ExerciseForm.vue'
import ImageField from './ImageField.vue'

const props = defineProps<{ moduleId: string }>()
const { fetchUnits, saveUnit, deleteUnit } = useLessonAuthoring()
const toast = useToast()

type UiExercise = EditableExercise & { _uid: string }
type UiUnit = Omit<EditableUnit, 'exercises'> & { _uid: string, exercises: UiExercise[] }

const uid = () => (import.meta.client && 'randomUUID' in crypto ? crypto.randomUUID() : `u${Date.now()}${Math.round(Math.random() * 1e5)}`)
const units = ref<UiUnit[]>([])
const loading = ref(true)
const saving = ref(false)
const selectedUid = ref<string | null>(null)
const selected = computed(() => units.value.find(u => u._uid === selectedUid.value))

const load = async () => {
  loading.value = true
  try {
    const { units: rows } = await fetchUnits(props.moduleId)
    units.value = rows.map(u => ({
      ...u, _uid: uid(),
      exercises: (u.exercises ?? []).map(e => ({ ...e, _uid: uid() }))
    }))
    selectedUid.value = units.value[0]?._uid ?? null
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(() => props.moduleId, load)

// ── units ──
const newUnit = () => {
  const u: UiUnit = { _uid: uid(), title: 'Новый юнит', subtitle: '', orderIndex: units.value.length, intro: [], exercises: [] }
  units.value.push(u)
  selectedUid.value = u._uid
}
const removeUnit = async () => {
  const u = selected.value
  if (!u) return
  if (u.id) await deleteUnit(u.id).catch(() => {})
  units.value = units.value.filter(x => x._uid !== u._uid)
  selectedUid.value = units.value[0]?._uid ?? null
}

// ── intro blocks ──
const addIntro = (type: string) => {
  if (!selected.value) return
  const block: any = type === 'examples' ? { type, items: [] } : type === 'image' ? { type, url: '' } : { type, text: '' }
  selected.value.intro.push(block)
}
const rmIntro = (i: number) => selected.value?.intro.splice(i, 1)

// ── exercises ──
const addExercise = () => {
  selected.value?.exercises.push({ _uid: uid(), type: 'FILL_BLANK', instruction: '', content: {}, answerKey: {}, xp: 10 })
}
const rmExercise = (i: number) => selected.value?.exercises.splice(i, 1)
const move = (i: number, d: number) => {
  const arr = selected.value?.exercises
  if (!arr) return
  const j = i + d
  if (j < 0 || j >= arr.length) return
  const [it] = arr.splice(i, 1)
  if (it) arr.splice(j, 0, it)
}

// ── save ──
const save = async () => {
  const u = selected.value
  if (!u) return
  saving.value = true
  try {
    const unitPayload = { id: u.id, title: u.title, subtitle: u.subtitle, orderIndex: u.orderIndex ?? 0, intro: u.intro }
    const exPayload = u.exercises.map(({ _uid, ...e }) => e)
    const res = await saveUnit(props.moduleId, unitPayload, exPayload)
    u.id = res.unitId
    u.exercises.forEach((e, i) => {
      e.id = res.exercises[i]?.id ?? e.id
    })
    toast.add({ title: 'Юнит сохранён', description: `${res.exercises.length} заданий`, color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'Не удалось сохранить', description: String(e?.message ?? e), color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div
    v-if="loading"
    class="flex h-40 items-center justify-center"
  >
    <UIcon
      name="i-lucide-loader-circle"
      class="size-8 animate-spin text-primary"
    />
  </div>

  <div
    v-else
    class="flex flex-col gap-4 lg:flex-row"
  >
    <!-- units list -->
    <div class="lg:w-56 lg:shrink-0">
      <UButton
        block
        size="sm"
        icon="i-lucide-plus"
        label="Новый юнит"
        color="primary"
        variant="soft"
        class="mb-2"
        @click="newUnit"
      />
      <div class="flex flex-col gap-1">
        <button
          v-for="u in units"
          :key="u._uid"
          class="rounded-lg border px-3 py-2 text-left text-sm transition"
          :class="u._uid === selectedUid ? 'border-primary bg-primary/10 font-semibold' : 'border-default hover:border-primary/40'"
          @click="selectedUid = u._uid"
        >
          {{ u.title || 'Без названия' }}
          <span class="block text-[10px] text-muted">{{ u.exercises.length }} заданий{{ u.id ? '' : ' · не сохранён' }}</span>
        </button>
      </div>
    </div>

    <!-- unit editor -->
    <div
      v-if="selected"
      class="min-w-0 flex-1 space-y-4"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="text-sm font-bold">Юнит</span>
        <div class="flex gap-2">
          <UButton
            size="xs"
            color="error"
            variant="ghost"
            icon="i-lucide-trash-2"
            label="Удалить"
            @click="removeUnit"
          />
          <UButton
            size="sm"
            color="primary"
            icon="i-lucide-save"
            :loading="saving"
            label="Сохранить"
            @click="save"
          />
        </div>
      </div>

      <div class="grid gap-2 sm:grid-cols-2">
        <UInput
          v-model="selected.title"
          placeholder="Название юнита"
        />
        <UInput
          v-model="selected.subtitle"
          placeholder="Подзаголовок"
        />
      </div>

      <!-- intro blocks -->
      <div class="rounded-xl border border-default p-3">
        <div class="mb-2 flex flex-wrap items-center gap-1">
          <span class="mr-1 text-xs font-semibold text-muted">Правило / интро:</span>
          <UButton
            size="xs"
            variant="soft"
            label="Правило"
            @click="addIntro('rule')"
          />
          <UButton
            size="xs"
            variant="soft"
            label="Текст"
            @click="addIntro('text')"
          />
          <UButton
            size="xs"
            variant="soft"
            label="Примеры"
            @click="addIntro('examples')"
          />
          <UButton
            size="xs"
            variant="soft"
            label="Картинка"
            @click="addIntro('image')"
          />
        </div>
        <div class="flex flex-col gap-2">
          <div
            v-for="(b, i) in selected.intro"
            :key="i"
            class="flex items-start gap-2"
          >
            <span class="mt-2 w-16 shrink-0 text-[10px] font-bold uppercase text-muted">{{ b.type }}</span>
            <UInput
              v-if="b.type === 'rule' || b.type === 'text'"
              v-model="(b as any).text"
              size="sm"
              class="flex-1"
              placeholder="текст"
            />
            <UTextarea
              v-else-if="b.type === 'examples'"
              :model-value="(b as any).items.join('\n')"
              :rows="2"
              size="sm"
              class="flex-1"
              placeholder="по примеру на строку"
              @update:model-value="(v: string) => (b as any).items = v.split('\n').map((s: string) => s.trim()).filter(Boolean)"
            />
            <ImageField
              v-else-if="b.type === 'image'"
              v-model="(b as any).url"
              class="flex-1"
            />
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              icon="i-lucide-x"
              @click="rmIntro(i)"
            />
          </div>
          <p
            v-if="!selected.intro.length"
            class="text-xs text-muted"
          >
            Добавь блоки правила/объяснения как в книге.
          </p>
        </div>
      </div>

      <!-- exercises -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold">Задания ({{ selected.exercises.length }})</span>
          <UButton
            size="xs"
            icon="i-lucide-plus"
            label="Задание"
            color="primary"
            variant="soft"
            @click="addExercise"
          />
        </div>
        <div
          v-for="(ex, i) in selected.exercises"
          :key="ex._uid"
          class="rounded-xl border border-default p-3"
        >
          <div class="mb-2 flex items-center justify-between">
            <span class="text-xs font-bold text-muted">#{{ i + 1 }}</span>
            <div class="flex gap-1">
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-arrow-up"
                @click="move(i, -1)"
              />
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-arrow-down"
                @click="move(i, 1)"
              />
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                @click="rmExercise(i)"
              />
            </div>
          </div>
          <ExerciseForm :exercise="ex" />
        </div>
      </div>
    </div>
  </div>
</template>
