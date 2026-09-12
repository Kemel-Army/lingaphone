<script setup lang="ts">
/**
 * Выставление оценок ученика за урок по 5 критериям «мотивашки».
 *
 * Пустое значение = «не выставлено» и в месячный средний не попадает — это
 * не то же самое, что двойка, поэтому кнопка «—» физически стирает оценку.
 */
import { CRITERIA, useMotivation, type GradeCriterion } from '~/entities/motivation'

const props = defineProps<{
  lessonId: string
  studentId: string
  studentName: string
  lessonLabel: string
  initial: Partial<Record<GradeCriterion, number>>
}>()

const emit = defineEmits<{ (e: 'saved' | 'close'): void }>()

const open = defineModel<boolean>('open', { default: false })

const { saveCriteriaGrades } = useMotivation()
const toast = useToast()

const values = reactive<Record<GradeCriterion, number | null>>({
  ATTENDANCE: null, BEHAVIOR: null, HOMEWORK: null, DIARY: null, EBOOK: null
})

const reset = () => {
  for (const c of CRITERIA) values[c.value] = props.initial[c.value] ?? null
}
watch(() => [props.lessonId, props.studentId, props.initial], reset, { immediate: true, deep: true })

const saving = ref(false)

const filled = computed(() => CRITERIA.filter(c => values[c.value] !== null).length)
const average = computed(() => {
  const nums = CRITERIA.map(c => values[c.value]).filter((v): v is number => v !== null)
  if (!nums.length) return null
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1)
})

/** Быстрый ввод: «всё на 5» закрывает типовой урок одним кликом. */
const setAll = (v: number | null) => {
  for (const c of CRITERIA) values[c.value] = v
}

const submit = async () => {
  saving.value = true
  try {
    await saveCriteriaGrades(props.lessonId, props.studentId, { ...values })
    toast.add({ title: 'Оценки сохранены', color: 'success', icon: 'i-lucide-check' })
    emit('saved')
    open.value = false
  } catch (e: unknown) {
    toast.add({
      title: 'Не удалось сохранить',
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
    :title="studentName"
    :description="lessonLabel"
    @close="emit('close')"
  >
    <template #body>
      <div class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm text-muted">
            Заполнено {{ filled }} / {{ CRITERIA.length }}
            <span
              v-if="average"
              class="ml-2 font-semibold text-default"
            >средний {{ average }}</span>
          </p>
          <div class="flex gap-1.5">
            <UButton
              size="xs"
              variant="soft"
              color="success"
              @click="setAll(5)"
            >
              Все 5
            </UButton>
            <UButton
              size="xs"
              variant="soft"
              color="neutral"
              @click="setAll(null)"
            >
              Очистить
            </UButton>
          </div>
        </div>

        <div
          v-for="c in CRITERIA"
          :key="c.value"
          class="flex items-center justify-between gap-3 rounded-lg border border-default px-3 py-2"
        >
          <div class="flex items-center gap-2 min-w-0">
            <UIcon
              :name="c.icon"
              class="size-4 text-muted shrink-0"
            />
            <span class="text-sm font-medium truncate">{{ c.label }}</span>
          </div>

          <div class="flex gap-1 shrink-0">
            <UButton
              v-for="n in [1, 2, 3, 4, 5]"
              :key="n"
              size="xs"
              :variant="values[c.value] === n ? 'solid' : 'outline'"
              :color="values[c.value] === n ? (n >= 4 ? 'success' : n === 3 ? 'warning' : 'error') : 'neutral'"
              class="w-8 justify-center"
              @click="values[c.value] = n"
            >
              {{ n }}
            </UButton>
            <UButton
              size="xs"
              variant="ghost"
              color="neutral"
              class="w-8 justify-center"
              :disabled="values[c.value] === null"
              @click="values[c.value] = null"
            >
              —
            </UButton>
          </div>
        </div>
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
          icon="i-lucide-check"
          @click="submit"
        >
          Сохранить
        </UButton>
      </div>
    </template>
  </UModal>
</template>
