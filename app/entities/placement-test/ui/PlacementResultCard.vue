<script setup lang="ts">
/**
 * Результат входного тестирования в карточке лида.
 *
 * Автоматический балл показываем как есть; письменные ответы — под спойлером,
 * потому что их проверяет преподаватель и в свёрнутом виде они не мешают
 * менеджеру работать с воронкой.
 */
import { PLACEMENT_AGE_BAND_MAP } from '~/shared/lib/placementTest'
import type { PlacementTestRecord } from '../model/types'

const props = defineProps<{ test: PlacementTestRecord }>()

const band = computed(() => PLACEMENT_AGE_BAND_MAP[props.test.ageBand])
const percent = computed(() =>
  props.test.autoMax === 0 ? 0 : Math.round((props.test.autoScore / props.test.autoMax) * 100)
)
const scoreColor = computed(() =>
  percent.value >= 70 ? 'success' : percent.value >= 40 ? 'warning' : 'error'
)
const filledOpen = computed(() => props.test.openAnswers.filter(a => a.text.trim().length > 0))
const showOpen = ref(false)

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU')
</script>

<template>
  <div class="rounded-xl border border-default p-3">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="flex items-center gap-1.5 text-sm font-semibold">
          <UIcon
            :name="band.icon"
            class="size-4 shrink-0 text-primary"
          />
          Входное тестирование · {{ band.label }}
        </p>
        <p class="mt-0.5 text-xs text-muted">
          {{ formatDate(test.createdAt) }}
        </p>
      </div>
      <UBadge
        v-if="test.recommendedLevel"
        color="primary"
        variant="subtle"
        size="lg"
        class="shrink-0"
      >
        {{ test.recommendedLevel }}
      </UBadge>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-2">
      <UBadge
        :color="scoreColor"
        variant="subtle"
        size="sm"
      >
        {{ test.autoScore }} / {{ test.autoMax }} · {{ percent }}%
      </UBadge>
      <UBadge
        v-if="test.skippedCount"
        color="neutral"
        variant="subtle"
        size="sm"
        icon="i-lucide-circle-help"
      >
        затруднился: {{ test.skippedCount }}
      </UBadge>
      <UBadge
        v-if="filledOpen.length"
        color="info"
        variant="subtle"
        size="sm"
        icon="i-lucide-pen-line"
      >
        письменных ответов: {{ filledOpen.length }}
      </UBadge>
    </div>

    <template v-if="test.openAnswers.length">
      <UButton
        variant="link"
        color="neutral"
        size="xs"
        class="mt-2 px-0"
        :icon="showOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        @click="showOpen = !showOpen"
      >
        {{ showOpen ? 'Скрыть' : 'Письменная часть — на проверку преподавателя' }}
      </UButton>

      <div
        v-if="showOpen"
        class="mt-2 space-y-3"
      >
        <div
          v-for="a in test.openAnswers"
          :key="a.questionId"
          class="rounded-lg bg-elevated p-2.5"
        >
          <p class="text-xs font-semibold text-muted">
            {{ a.prompt }}
          </p>
          <p
            v-if="a.text.trim()"
            class="mt-1 whitespace-pre-wrap text-sm"
          >
            {{ a.text }}
          </p>
          <p
            v-else
            class="mt-1 text-sm italic text-muted"
          >
            затруднился ответить
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
