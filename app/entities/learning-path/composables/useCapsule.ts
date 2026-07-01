import { useStudent } from '~/entities/student'
import type {
  CapsuleLayer,
  LayerProgress,
  LayerStatus,
  PathProgress
} from '../model/types'
import { useLearningPath } from './useLearningPath'

interface CompleteLayerArgs {
  layerId: string
  interactionData?: Record<string, unknown>
  score?: number
  maxScore?: number
  timeSpentSeconds?: number
}

interface CompleteLayerResponse {
  passed: boolean
  reason: string | null
  xpAwarded: number
  layerProgress: LayerProgress
  pathProgress: PathProgress
}

interface ResetCapsuleResponse {
  success: boolean
  lessonId: string
}

/**
 * Capsule runtime — loads a PathLesson with all layers + per-layer progress
 * and exposes navigation/completion helpers. Backs the capsule page
 * (stepper on the left, active layer on the right).
 */
export const useCapsule = (lessonId: Ref<string> | string) => {
  const runtimeConfig = useRuntimeConfig()
  const isDemoFreeSwitch = computed(() => runtimeConfig.public.capsuleDemoFreeSwitch !== 'false')

  const lessonIdRef = isRef(lessonId) ? lessonId : ref(lessonId)
  const { fetchPathLesson } = useLearningPath()
  const { studentId } = useStudent()
  const supabase = useSupabaseClient()

  const { data: capsule, status, refresh } = useAsyncData(
    () => `capsule-${lessonIdRef.value}`,
    () => fetchPathLesson(lessonIdRef.value, studentId.value),
    { watch: [lessonIdRef, studentId] }
  )

  const layers = computed<CapsuleLayer[]>(() => capsule.value?.layers ?? [])

  /** Derived per-layer status with prerequisite awareness. */
  const layerStatus = computed<Record<string, LayerStatus>>(() => {
    const map: Record<string, LayerStatus> = {}
    const sorted = [...layers.value].sort((a, b) => a.orderIndex - b.orderIndex)
    let prevCompleted = true
    for (const l of sorted) {
      const raw = (l.progress?.status ?? (prevCompleted ? 'AVAILABLE' : 'LOCKED')) as LayerStatus
      map[l.id] = raw
      if (raw !== 'COMPLETED') prevCompleted = false
    }
    return map
  })

  const currentIndex = ref(0)
  const positionRestored = ref(false)

  watch(
    () => capsule.value?.progress?.currentLayerIndex,
    (order) => {
      if (positionRestored.value) return
      if (typeof order === 'number' && order > 0) {
        currentIndex.value = Math.min(Math.max(order - 1, 0), layers.value.length - 1)
        positionRestored.value = true
      }
    },
    { immediate: true }
  )

  watch(lessonIdRef, () => {
    positionRestored.value = false
    currentIndex.value = 0
  })

  const currentLayer = computed<CapsuleLayer | null>(
    () => layers.value[currentIndex.value] ?? null
  )

  const goToLayer = (idx: number) => {
    if (idx < 0 || idx >= layers.value.length) return
    const target = layers.value[idx]
    if (!target) return
    const st = layerStatus.value[target.id]
    if (st === 'LOCKED' && !isDemoFreeSwitch.value) return
    currentIndex.value = idx
  }

  const goNext = () => goToLayer(currentIndex.value + 1)
  const goPrev = () => goToLayer(currentIndex.value - 1)

  const completeLayer = async (args: CompleteLayerArgs): Promise<CompleteLayerResponse> => {
    const { data: { session } } = await supabase.auth.getSession()
    const nextIdx = currentIndex.value + 1

    const res = await $fetch<CompleteLayerResponse>('/api/capsule/complete-layer', {
      method: 'POST',
      body: args,
      credentials: 'include',
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined
    })
    await refresh()
    if (nextIdx < layers.value.length) currentIndex.value = nextIdx
    return res
  }

  const resetProgress = async (): Promise<ResetCapsuleResponse> => {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await $fetch<ResetCapsuleResponse>('/api/capsule/reset-progress', {
      method: 'POST',
      body: { lessonId: lessonIdRef.value },
      credentials: 'include',
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined
    })
    await refresh()
    positionRestored.value = false
    currentIndex.value = 0
    return res
  }

  return {
    capsule,
    isLoading: computed(() => status.value === 'pending'),
    layers,
    layerStatus,
    currentIndex,
    currentLayer,
    goToLayer,
    goNext,
    goPrev,
    completeLayer,
    resetProgress,
    refresh
  }
}
