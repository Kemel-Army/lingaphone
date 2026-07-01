<script setup lang="ts">
/**
 * /student/my-path/[topicId]/[lessonId] — прохождение капсулы.
 * Слева степпер слоёв, справа активный слой со сменой сцен + анимациями.
 */
import { useCapsule } from '~/entities/learning-path'
import { CapsuleRunner } from '~/widgets/learning-path'
import { LAYER_COMPONENTS } from '~/widgets/learning-path/layers'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const toast = useToast()
const lessonId = computed(() => route.params.lessonId as string)
const topicId = computed(() => route.params.topicId as string)
const resettingCapsule = ref(true)

const {
  capsule,
  isLoading,
  layers,
  layerStatus,
  currentIndex,
  currentLayer,
  goToLayer,
  completeLayer,
  resetProgress
} = useCapsule(lessonId)

useHead({ title: computed(() => capsule.value?.title ?? 'Урок') })

const masteryPercent = computed(() => {
  const total = layers.value.length || 1
  const done = capsule.value?.progress?.layersCompleted ?? 0
  return Math.round((done / total) * 100)
})

const onSelectLayer = (idx: number) => goToLayer(idx)

interface LayerCompletePayload {
  interactionData?: Record<string, unknown>
  score?: number
  maxScore?: number
  timeSpentSeconds?: number
}

const { burst: confettiBurst, trophy: confettiTrophy } = useConfetti()
const { flash } = useMascotReactions()

const onComplete = async (payload: LayerCompletePayload) => {
  const layer = currentLayer.value
  if (!layer) return
  try {
    const res = await completeLayer({
      layerId: layer.id,
      interactionData: payload.interactionData,
      score: payload.score,
      maxScore: payload.maxScore,
      timeSpentSeconds: payload.timeSpentSeconds
    })
    if (res.passed) {
      const isMastery = layer.layerType === 'MASTERY_CHECK'
      const isGold = isMastery && (payload.score ?? 0) >= 100
      if (isGold) {
        confettiTrophy()
        flash('trophy', 1400)
      } else {
        confettiBurst()
        flash('celebrate', 900)
      }
      toast.add({
        title: 'Слой пройден!',
        description: res.xpAwarded > 0 ? `+${res.xpAwarded} XP` : undefined,
        color: 'success',
        icon: 'i-lucide-check-circle-2'
      })
    } else if (res.reason) {
      toast.add({ title: 'Почти', description: res.reason, color: 'warning' })
    }
  } catch (e) {
    const err = e as { data?: { message?: string, statusCode?: number }, statusCode?: number, message?: string }
    if (err.data?.statusCode === 401 || err.statusCode === 401) {
      toast.add({ title: 'Сессия истекла', description: 'Войди снова, чтобы продолжить', color: 'warning' })
      await navigateTo('/login')
      return
    }
    toast.add({
      title: 'Не получилось сохранить',
      description: err.data?.message ?? err.message ?? 'Попробуй ещё раз',
      color: 'error'
    })
  }
}

const activeComponent = computed(() => {
  if (!currentLayer.value) return null
  return LAYER_COMPONENTS[currentLayer.value.layerType] ?? null
})

const topicTheme = computed(() => {
  const scenario = layers.value.find(l => l.layerType === 'SCENARIO')
  if (!scenario) return null
  const content = scenario.content as { theme?: string } | null
  return (content?.theme ?? null) as
    | 'cafe' | 'space' | 'zoo' | 'construction' | 'artist' | 'railway' | null
})

watch(
  lessonId,
  async () => {
    resettingCapsule.value = true
    try {
      await resetProgress()
    } catch (e) {
      const err = e as { data?: { message?: string }, message?: string }
      toast.add({
        title: 'Не получилось перезапустить урок',
        description: err.data?.message ?? err.message ?? 'Попробуй ещё раз',
        color: 'error'
      })
    } finally {
      resettingCapsule.value = false
    }
  },
  { immediate: true }
)
</script>

<template>
  <div>
    <div
      v-if="isLoading || resettingCapsule"
      class="flex flex-col items-center justify-center gap-4 py-24"
    >
      <FemiMascot
        state="think"
        size="lg"
        line="Готовлю урок..."
      />
    </div>

    <div
      v-else-if="!capsule"
      class="py-20 text-center text-muted"
    >
      Урок не найден.
    </div>

    <CapsuleRunner
      v-else
      :capsule-name="capsule.title"
      :capsule-subtitle="capsule.subtitle"
      :difficulty="capsule.difficulty"
      :total-xp="capsule.xpReward"
      :duration-minutes="capsule.durationMinutes"
      :layers="layers"
      :layer-status="layerStatus"
      :current-index="currentIndex"
      :mastery-percent="masteryPercent"
      :topic-id="topicId"
      :topic-theme="topicTheme"
      :current-layer-type="currentLayer?.layerType ?? null"
      @select="onSelectLayer"
    >
      <template #default>
        <div
          v-if="!layers.length"
          class="flex h-full flex-col items-center justify-center gap-3 py-16 text-center"
        >
          <FemiMascot
            state="teach"
            size="lg"
          />
          <p class="text-sm font-semibold text-highlighted">
            Капсула ещё собирается
          </p>
          <p class="max-w-md text-xs text-muted">
            Контент этого урока скоро появится.
          </p>
        </div>

        <Transition
          v-else
          name="layer-swap"
          mode="out-in"
        >
          <component
            :is="activeComponent"
            v-if="currentLayer && activeComponent"
            :key="currentLayer.id"
            :layer="currentLayer"
            :progress="currentLayer.progress ?? null"
            @complete="onComplete"
          />

          <div
            v-else-if="currentLayer"
            :key="`placeholder-${currentLayer.id}`"
            class="flex h-full flex-col items-center justify-center gap-3 py-16 text-center"
          >
            <FemiMascot
              state="teach"
              size="lg"
            />
            <p class="text-sm font-semibold text-highlighted">
              Этот слой скоро появится
            </p>
            <p class="max-w-md text-xs text-muted">
              «{{ currentLayer.title }}» — часть полной капсулы. Проходи по порядку, слой откроется в следующем обновлении.
            </p>
          </div>
        </Transition>
      </template>
    </CapsuleRunner>
  </div>
</template>

<style scoped>
.layer-swap-enter-active,
.layer-swap-leave-active { transition: opacity 0.28s ease, transform 0.28s ease; }
.layer-swap-enter-from { opacity: 0; transform: translateY(12px) scale(0.99); }
.layer-swap-leave-to { opacity: 0; transform: translateY(-12px) scale(0.99); }
</style>
