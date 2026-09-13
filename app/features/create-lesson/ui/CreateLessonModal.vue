<script setup lang="ts">
/**
 * Создание онлайн-урока преподавателем.
 *
 * Раньше уроки заводил только администратор, и учителю приходилось просить
 * поставить занятие. Эндпоинт `/api/teacher/lessons` проверяет, что группа
 * принадлежит этому учителю, поэтому чужие уроки так не создать.
 */
import { useTeacher, type TeacherGroup } from '~/entities/teacher'

const props = defineProps<{ groups: TeacherGroup[] }>()
const emit = defineEmits<{ (e: 'created'): void }>()

const open = defineModel<boolean>('open', { default: false })

const { createLesson } = useTeacher()
const toast = useToast()

const LESSON_TYPES = [
  { value: 'GROUP', label: 'Групповой' },
  { value: 'INDIVIDUAL', label: 'Индивидуальный' },
  { value: 'TRIAL', label: 'Пробный' },
  { value: 'MAKEUP', label: 'Отработка' },
  { value: 'SPEAKING_CLUB', label: 'Speaking club' }
] as const

/** Ближайшие полчаса — самый частый сценарий «начать урок сейчас». */
const defaultStart = () => {
  const d = new Date(Date.now() + 30 * 60000)
  d.setMinutes(d.getMinutes() < 30 ? 30 : 0, 0, 0)
  if (d.getMinutes() === 0) d.setHours(d.getHours() + 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const form = reactive({
  groupId: props.groups[0]?.id ?? '',
  topic: '',
  startsAt: defaultStart(),
  durationMin: 60,
  type: 'GROUP' as typeof LESSON_TYPES[number]['value']
})

// Группу выбираем только для GROUP — остальным типам (пробный/индивидуальный/
// отработка/speaking club) сервер сам подставит служебную группу учителя.
const isGroupType = computed(() => form.type === 'GROUP')

watch(open, (v) => {
  if (!v) return
  form.groupId = props.groups[0]?.id ?? ''
  form.topic = ''
  form.startsAt = defaultStart()
  form.durationMin = 60
  form.type = 'GROUP'
})

const groupOptions = computed(() => props.groups.map(g => ({ value: g.id, label: g.name })))

const saving = ref(false)
const canSubmit = computed(() =>
  (isGroupType.value ? !!form.groupId : true) && form.topic.trim().length >= 2 && !!form.startsAt
)

const submit = async () => {
  if (!canSubmit.value) return
  saving.value = true
  try {
    await createLesson({
      groupId: isGroupType.value ? form.groupId : undefined,
      topic: form.topic.trim(),
      // datetime-local отдаёт локальное время без зоны — переводим в ISO,
      // иначе урок уедет на несколько часов.
      startsAt: new Date(form.startsAt).toISOString(),
      durationMin: form.durationMin,
      type: form.type
    })
    toast.add({ title: 'Урок создан', color: 'success', icon: 'i-lucide-check' })
    open.value = false
    emit('created')
  } catch (e: unknown) {
    toast.add({
      title: 'Не удалось создать урок',
      description: (e as { data?: { message?: string } })?.data?.message ?? String(e),
      color: 'error',
      icon: 'i-lucide-x'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Новый онлайн-урок"
    description="Ученики группы увидят его у себя и смогут подключиться"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField
          v-if="isGroupType"
          label="Группа"
          required
        >
          <USelect
            v-model="form.groupId"
            :items="groupOptions"
            placeholder="Выберите группу"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Тема"
          required
        >
          <UInput
            v-model="form.topic"
            placeholder="Например: Present Simple"
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-3">
          <UFormField
            label="Начало"
            required
          >
            <UInput
              v-model="form.startsAt"
              type="datetime-local"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Длительность, мин">
            <UInput
              v-model.number="form.durationMin"
              type="number"
              :min="15"
              :max="240"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="Тип">
          <USelect
            v-model="form.type"
            :items="[...LESSON_TYPES]"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          variant="ghost"
          color="neutral"
          @click="open = false"
        >
          Отмена
        </UButton>
        <UButton
          :loading="saving"
          :disabled="!canSubmit"
          icon="i-lucide-plus"
          @click="submit"
        >
          Создать
        </UButton>
      </div>
    </template>
  </UModal>
</template>
