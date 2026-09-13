<script setup lang="ts">
/**
 * Мотивация одного ученика за месяц: итог, разбор баллов, уроки с пятью
 * оценками и история медалей.
 *
 * Общий блок для дневника ученика и карточки ребёнка у родителя — иначе два
 * экрана про одно и то же неминуемо разъедутся в цифрах и формулировках.
 * Компонент только показывает: данные грузит страница.
 */
import {
  CRITERIA,
  MEDAL_MAP,
  MEDALS,
  formatMonth,
  type GradeCriterion,
  type StudentMonth
} from '~/entities/motivation'

const props = withDefaults(defineProps<{
  /** Необязателен: useAsyncData отдаёт undefined, пока запрос не завершился. */
  data?: StudentMonth | null
  /** «ты» для ученика, «ребёнок» для родителя — меняет только формулировки. */
  voice?: 'self' | 'parent'
}>(), { data: null, voice: 'self' })

const summary = computed(() => props.data?.summary ?? null)
const lessons = computed(() => props.data?.lessons ?? [])
const history = computed(() => props.data?.history ?? [])
const month = computed(() => props.data?.month ?? '')

const gradedLessons = computed(() => lessons.value.filter(l => l.filled > 0))
const medal = computed(() => MEDAL_MAP[summary.value?.medal ?? 'NONE'])

/** Следующая ступень и сколько до неё не хватает — главный мотиватор. */
const nextTier = computed(() => {
  const avg = summary.value?.average ?? 0
  for (const tier of MEDALS.filter(m => m.value !== 'NONE')) {
    if (avg < tier.min) return { tier, gap: Math.round((tier.min - avg) * 100) / 100 }
  }
  return null
})

const NOT_PARTICIPATING
  = 'Медаль начисляется только при оплате вовремя. Как только менеджер отметит оплату, балл появится.'

const goldText = computed(() =>
  props.voice === 'parent'
    ? '🎉 Максимальная медаль этого месяца уже получена.'
    : '🎉 Максимальная медаль этого месяца уже твоя. Так держать!'
)

const money = (n: number) => `${n.toLocaleString('ru-RU')} ₸`

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })

const gradeColor = (v: number) => {
  if (v === 5) return 'bg-emerald-500 text-white'
  if (v === 4) return 'bg-sky-500 text-white'
  if (v === 3) return 'bg-amber-500 text-white'
  return 'bg-red-500 text-white'
}

const criterionValue = (
  grades: Partial<Record<GradeCriterion, number>>,
  c: GradeCriterion
) => grades[c] ?? null

const paramTiles = computed(() => {
  const s = summary.value
  if (!s) return []
  return [
    { label: 'Instagram', points: s.instagramPoints, on: s.instagram },
    { label: 'Оплата', points: s.paymentPoints, on: s.paidOnTime },
    { label: 'Книги', points: s.bookPoints, on: s.books }
  ]
})
</script>

<template>
  <div class="space-y-6">
    <!-- Итог месяца -->
    <section class="rounded-2xl ring-1 ring-default p-5 sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-wider text-muted font-bold">
            Средний балл за {{ formatMonth(month) }}
          </p>
          <!-- Прочерк рисуем отдельно: в 5xl font-black «—» превращается в
               жирную чёрную полосу и читается как артефакт вёрстки. -->
          <p
            v-if="summary?.participates"
            class="text-5xl font-black tabular-nums mt-1"
          >
            {{ summary.average.toFixed(2) }}
          </p>
          <p
            v-else
            class="text-3xl font-semibold text-muted mt-2"
          >
            нет данных
          </p>
        </div>
        <div class="text-right">
          <span
            class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold"
            :class="medal.classes"
          >
            {{ medal.emoji }} {{ medal.label }}
          </span>
          <p
            v-if="summary?.payout"
            class="text-2xl font-black text-primary mt-2 tabular-nums"
          >
            {{ money(summary.payout) }}
          </p>
        </div>
      </div>

      <UAlert
        v-if="summary && !summary.participates"
        class="mt-4"
        color="warning"
        variant="subtle"
        icon="i-lucide-info"
        title="Пока не участвует в мотивации"
        :description="NOT_PARTICIPATING"
      />
      <div
        v-else-if="nextTier"
        class="mt-4 rounded-xl bg-muted/40 p-3 text-sm"
      >
        До {{ nextTier.tier.emoji }} <b>{{ nextTier.tier.label }}</b> не хватает
        <b class="tabular-nums">{{ nextTier.gap.toFixed(2) }}</b> балла —
        это {{ money(nextTier.tier.payout) }}.
      </div>
      <div
        v-else-if="summary?.medal === 'GOLD'"
        class="mt-4 rounded-xl bg-muted/40 p-3 text-sm"
      >
        {{ goldText }}
      </div>

      <!-- Из чего сложился балл -->
      <div
        v-if="summary"
        class="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center"
      >
        <div class="rounded-xl border border-default p-3">
          <p class="text-[11px] uppercase tracking-wider text-muted font-bold">
            Оценки учителя
          </p>
          <p class="text-xl font-black tabular-nums mt-0.5">
            {{ summary.teacherAvg.toFixed(1) }}
          </p>
          <p class="text-[11px] text-muted">
            из 25
          </p>
        </div>
        <div
          v-for="p in paramTiles"
          :key="p.label"
          class="rounded-xl border p-3"
          :class="p.on ? 'border-primary/40 bg-primary/5' : 'border-default'"
        >
          <p class="text-[11px] uppercase tracking-wider text-muted font-bold">
            {{ p.label }}
          </p>
          <p class="text-xl font-black tabular-nums mt-0.5">
            {{ p.points }}
          </p>
          <p class="text-[11px] text-muted">
            из 5
          </p>
        </div>
      </div>

      <p
        v-if="summary"
        class="text-xs text-muted mt-3"
      >
        Посещено занятий: {{ summary.attendedLessons }} · учитывается
        {{ summary.lessonsCounted }} (по абонементу)
      </p>
    </section>

    <!-- Уроки месяца -->
    <section class="space-y-3">
      <h2 class="font-bold text-lg">
        Уроки
      </h2>

      <div
        v-if="!gradedLessons.length"
        class="rounded-2xl border-2 border-dashed border-default py-12 text-center"
      >
        <UIcon
          name="i-lucide-inbox"
          class="size-10 text-muted mx-auto"
        />
        <p class="mt-3 font-semibold">
          Оценок за {{ formatMonth(month) }} пока нет
        </p>
        <p class="text-sm text-muted mt-1">
          Они появятся, как только преподаватель заполнит дневник
        </p>
      </div>

      <article
        v-for="l in gradedLessons"
        :key="l.lessonId"
        class="rounded-xl border border-default bg-default p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-bold truncate">
              {{ l.topic || 'Урок' }}
            </p>
            <p class="text-xs text-muted mt-0.5">
              {{ formatDate(l.startsAt) }}<span v-if="l.groupName"> · {{ l.groupName }}</span>
            </p>
          </div>
          <div
            v-if="l.average !== null"
            class="shrink-0 text-right"
          >
            <p class="text-2xl font-black tabular-nums">
              {{ l.average.toFixed(1) }}
            </p>
            <p class="text-[11px] text-muted">
              {{ l.filled }}/{{ CRITERIA.length }}
            </p>
          </div>
        </div>

        <div class="mt-3 grid grid-cols-5 gap-1.5">
          <div
            v-for="c in CRITERIA"
            :key="c.value"
            class="text-center"
          >
            <div
              class="mx-auto grid size-9 place-items-center rounded-lg font-black text-sm"
              :class="criterionValue(l.grades, c.value)
                ? gradeColor(criterionValue(l.grades, c.value)!)
                : 'bg-muted/40 text-muted'"
            >
              {{ criterionValue(l.grades, c.value) ?? '—' }}
            </div>
            <p class="text-[10px] text-muted mt-1 leading-tight">
              {{ c.short }}
            </p>
          </div>
        </div>
      </article>
    </section>

    <!-- История медалей -->
    <section
      v-if="history.length"
      class="space-y-3"
    >
      <h2 class="font-bold text-lg">
        История медалей
      </h2>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="h in history"
          :key="h.month"
          class="rounded-xl border border-default px-3 py-2 text-center min-w-28"
        >
          <p class="text-xs text-muted capitalize">
            {{ formatMonth(h.month) }}
          </p>
          <p class="text-lg font-bold mt-0.5">
            {{ MEDAL_MAP[h.medal].emoji }} {{ MEDAL_MAP[h.medal].label }}
          </p>
          <p class="text-xs text-muted tabular-nums">
            {{ h.averageGrade.toFixed(2) }}<span v-if="h.payout"> · {{ money(h.payout) }}</span>
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
