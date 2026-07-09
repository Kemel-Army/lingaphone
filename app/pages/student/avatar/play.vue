<script setup lang="ts">
import { AvatarCharacter, useAvatar, type AvatarEmotion } from '~/entities/avatar'

definePageMeta({ layout: 'dashboard' })

const { fetchState } = useAvatar()
const { data: state } = await useAsyncData('avatar-play', fetchState)
const config = computed(() => state.value?.config ?? undefined)

const stage = ref<HTMLElement | null>(null)
const pos = reactive({ x: 120, y: 40 })
const vel = reactive({ vx: 0, vy: 0 })
const dragging = ref(false)
const emotion = ref<AvatarEmotion>('neutral')

const W = 130
const H = 170
const GRAV = 1800
const REST = 0.68
const AIR = 0.999

let raf = 0
let last = 0
let reactTimer: ReturnType<typeof setTimeout> | undefined
let dragPrev = { x: 0, y: 0, t: 0 }
const dragOff = { x: 0, y: 0 }

const clearEmotion = () => {
  emotion.value = 'neutral'
}
const setEmotion = (e: AvatarEmotion, hold = 700) => {
  emotion.value = e
  clearTimeout(reactTimer)
  reactTimer = setTimeout(clearEmotion, hold)
}

const react = (speed: number) => {
  if (speed > 900) setEmotion('fear')
  else if (speed > 500) setEmotion(['surprise', 'annoyance', 'laughter'][Math.floor(speed) % 3] as AvatarEmotion)
  else setEmotion('laughter')
}

const loop = (t: number) => {
  const dt = last ? Math.min(0.032, (t - last) / 1000) : 0
  last = t
  const el = stage.value
  if (el && !dragging.value) {
    const maxX = el.clientWidth - W
    const maxY = el.clientHeight - H
    vel.vy += GRAV * dt
    pos.x += vel.vx * dt
    pos.y += vel.vy * dt
    let hit = false
    if (pos.x < 0) {
      pos.x = 0
      vel.vx = -vel.vx * REST
      hit = true
    }
    if (pos.x > maxX) {
      pos.x = maxX
      vel.vx = -vel.vx * REST
      hit = true
    }
    if (pos.y < 0) {
      pos.y = 0
      vel.vy = -vel.vy * REST
      hit = true
    }
    if (pos.y > maxY) {
      pos.y = maxY
      vel.vy = -vel.vy * REST
      vel.vx *= 0.9
      hit = true
    }
    vel.vx *= AIR
    vel.vy *= AIR
    const speed = Math.hypot(vel.vx, vel.vy)
    if (hit && speed > 260) react(speed)
    else if (speed < 15 && emotion.value !== 'neutral' && !reactTimer) emotion.value = 'neutral'
  }
  raf = requestAnimationFrame(loop)
}

const onMove = (e: PointerEvent) => {
  if (!dragging.value || !stage.value) return
  const rect = stage.value.getBoundingClientRect()
  const maxX = stage.value.clientWidth - W
  const maxY = stage.value.clientHeight - H
  pos.x = Math.max(0, Math.min(maxX, e.clientX - rect.left - dragOff.x))
  pos.y = Math.max(0, Math.min(maxY, e.clientY - rect.top - dragOff.y))
  const now = performance.now()
  const dt = (now - dragPrev.t) / 1000
  if (dt > 0) {
    vel.vx = (e.clientX - dragPrev.x) / dt
    vel.vy = (e.clientY - dragPrev.y) / dt
  }
  dragPrev = { x: e.clientX, y: e.clientY, t: now }
}

const onUp = () => {
  if (!dragging.value) return
  dragging.value = false
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  const speed = Math.hypot(vel.vx, vel.vy)
  if (speed > 700) setEmotion('fear')
  else if (speed > 250) setEmotion('surprise')
  else setEmotion('joy')
}

const onDown = (e: PointerEvent) => {
  if (!stage.value) return
  dragging.value = true
  emotion.value = 'surprise'
  clearTimeout(reactTimer)
  reactTimer = undefined
  dragOff.x = e.clientX - (stage.value.getBoundingClientRect().left + pos.x)
  dragOff.y = e.clientY - (stage.value.getBoundingClientRect().top + pos.y)
  dragPrev = { x: e.clientX, y: e.clientY, t: performance.now() }
  vel.vx = 0
  vel.vy = 0
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

const reset = () => {
  pos.x = 120
  pos.y = 40
  vel.vx = 0
  vel.vy = 0
  setEmotion('joy', 500)
}

onMounted(() => {
  raf = requestAnimationFrame(loop)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  clearTimeout(reactTimer)
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
})
</script>

<template>
  <div class="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <UButton
          to="/student/avatar"
          icon="i-lucide-arrow-left"
          variant="ghost"
          color="neutral"
          size="sm"
        />
        <h1 class="text-xl font-bold">
          Площадка
        </h1>
      </div>
      <UButton
        icon="i-lucide-rotate-ccw"
        size="sm"
        variant="soft"
        color="neutral"
        @click="reset"
      >
        Сбросить
      </UButton>
    </div>

    <p class="text-sm text-muted">
      Хватай персонажа, кидай и подбрасывай — он реагирует на удары!
    </p>

    <div
      ref="stage"
      class="relative h-[60vh] min-h-96 rounded-3xl bg-linear-to-b from-sky-100 to-emerald-100 dark:from-slate-800 dark:to-slate-900 overflow-hidden touch-none"
    >
      <div
        v-if="config"
        class="absolute cursor-grab active:cursor-grabbing"
        :style="{ left: `${pos.x}px`, top: `${pos.y}px`, width: `${W}px`, height: `${H}px` }"
        @pointerdown.prevent="onDown"
      >
        <AvatarCharacter
          :config="config"
          :emotion="emotion"
        />
      </div>
    </div>
  </div>
</template>
