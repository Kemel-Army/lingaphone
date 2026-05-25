<script setup lang="ts">
/**
 * FloatingXp — всплывающие числа `+N XP`, которые появляются по событию
 * и улетают вверх. Это базовый дофаминовый паттерн: верный ответ →
 * мгновенная награда, видимая глазом.
 *
 * Использование:
 *   <FloatingXp ref="xpFloater" />
 *   const xpFloater = useTemplateRef('xpFloater')
 *   xpFloater.value?.spawn(20)            // +20 XP в случайной точке
 *   xpFloater.value?.spawn(20, { x, y })  // в конкретной точке (px от viewport)
 *
 * Контейнер позиционирован `fixed inset-0 pointer-events-none` — никогда
 * не перехватывает клики, размещается поверх всего слоя.
 */

interface Burst {
  id: number
  amount: number
  x: number
  y: number
  hue: 'amber' | 'emerald' | 'sky' | 'rose'
}

const bursts = ref<Burst[]>([])
let nextId = 1

const spawn = (amount: number, position?: { x: number, y: number }, hue: Burst['hue'] = 'amber') => {
  const id = nextId++
  // Если точка не задана — рассыпаем чуть-чуть в верхней трети окна
  const x = position?.x ?? (window.innerWidth * 0.5 + (Math.random() - 0.5) * 80)
  const y = position?.y ?? (window.innerHeight * 0.4)
  bursts.value.push({ id, amount, x, y, hue })
  setTimeout(() => {
    bursts.value = bursts.value.filter(b => b.id !== id)
  }, 1600)
}

defineExpose({ spawn })

const colorClass = (hue: Burst['hue']) => ({
  amber: 'text-amber-500',
  emerald: 'text-emerald-500',
  sky: 'text-sky-500',
  rose: 'text-rose-500'
}[hue])
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed inset-0 z-[80]">
      <div
        v-for="b in bursts"
        :key="b.id"
        class="floating-xp absolute select-none font-black tabular-nums drop-shadow-md text-2xl sm:text-3xl"
        :class="colorClass(b.hue)"
        :style="{ left: `${b.x}px`, top: `${b.y}px` }"
      >
        +{{ b.amount }}
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes floating-xp-anim {
  0% {
    opacity: 0;
    transform: translate(-50%, 0) scale(0.6);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -8px) scale(1.15);
  }
  70% {
    opacity: 1;
    transform: translate(-50%, -56px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -88px) scale(0.85);
  }
}

.floating-xp {
  animation: floating-xp-anim 1.6s cubic-bezier(0.25, 0.8, 0.4, 1) forwards;
  will-change: transform, opacity;
}
</style>
