<script setup lang="ts">
/** Brand guide: the same Ling mascot follows visitors across public pages. */
type LingState = 'welcome' | 'method-teacher' | 'celebrate' | 'faq-curious'

const visible = ref(false)
const state = ref<LingState>('welcome')
const bubbleVisible = ref(false)
const bubbleText = ref('Привет! Я Линг')

let bubbleTimer: ReturnType<typeof setTimeout> | null = null

const onScroll = () => {
  if (typeof window === 'undefined') return
  const y = window.scrollY
  const vh = window.innerHeight
  const docH = document.documentElement.scrollHeight - vh

  // Show after first viewport, hide near footer
  visible.value = y > vh * 0.7 && (y / docH) < 0.95

  // Choose state by scroll progress
  const ratio = docH > 0 ? y / docH : 0
  if (ratio < 0.3) state.value = 'welcome'
  else if (ratio < 0.55) state.value = 'method-teacher'
  else if (ratio < 0.78) state.value = 'celebrate'
  else state.value = 'faq-curious'
}

const showBubble = (text: string, ms = 3500) => {
  bubbleText.value = text
  bubbleVisible.value = true
  if (bubbleTimer) clearTimeout(bubbleTimer)
  bubbleTimer = setTimeout(() => {
    bubbleVisible.value = false
  }, ms)
}

const onClick = () => {
  if (typeof document === 'undefined') return
  const target = document.getElementById('method')
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  showBubble(target ? 'Покажу, как работает методика' : 'Я рядом, если появится вопрос', 2500)
}

const onHover = () => {
  const lines = [
    'Подскажу следующий шаг',
    'Практика продолжается между уроками',
    'Родитель видит весь прогресс',
    'Можно начать с бесплатного урока'
  ]
  showBubble(lines[Math.floor(Math.random() * lines.length)] ?? lines[0]!)
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
  // Greet after a moment
  setTimeout(() => {
    if (visible.value) showBubble('Привет! Я Линг', 4000)
  }, 1800)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('scroll', onScroll)
  if (bubbleTimer) clearTimeout(bubbleTimer)
})
</script>

<template>
  <Transition name="float-femi">
    <div
      v-show="visible"
      class="float-femi"
    >
      <Transition name="float-femi-bubble">
        <div
          v-show="bubbleVisible"
          class="float-femi-bubble"
        >
          {{ bubbleText }}
        </div>
      </Transition>

      <button
        type="button"
        class="float-femi-btn"
        aria-label="Получить подсказку от Линга"
        @click="onClick"
        @mouseenter="onHover"
      >
        <LandingMascot
          :state="state"
          size="xs"
        />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.float-femi {
  position: fixed;
  bottom: 5.5rem;
  right: 1.25rem;
  z-index: 50;
  display: grid;
  justify-items: end;
  gap: 0.4rem;
  pointer-events: none;
}

@media (max-width: 640px) {
  .float-femi { bottom: 5rem; right: 0.75rem; }
}

.float-femi-btn {
  pointer-events: auto;
  width: 6rem;
  height: 7.8rem;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  transition: transform 0.3s var(--ease-out-expo);
  animation: float-femi-bob 3s ease-in-out infinite;
}

.float-femi-btn:hover {
  transform: scale(1.1) rotate(-5deg);
}

@keyframes float-femi-bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}

.float-femi-bubble {
  pointer-events: none;
  max-width: 14rem;
  padding: 0.55rem 0.85rem;
  background: var(--ui-bg-elevated);
  border: 1px solid rgb(188 228 245 / 90%);
  border-radius: 1rem;
  border-bottom-right-radius: 0.3rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #123b63;
  box-shadow: 0 12px 28px -12px rgb(18 59 99 / 28%);
  text-align: right;
  line-height: 1.35;
}

/* Mascot enter/leave */
.float-femi-enter-active,
.float-femi-leave-active {
  transition: transform 0.5s var(--ease-out-expo), opacity 0.5s var(--ease-out-expo);
}
.float-femi-enter-from,
.float-femi-leave-to {
  transform: translateY(120%) scale(0.6);
  opacity: 0;
}

/* Bubble enter/leave */
.float-femi-bubble-enter-active,
.float-femi-bubble-leave-active {
  transition: transform 0.35s var(--ease-out-expo), opacity 0.35s var(--ease-out-expo);
}
.float-femi-bubble-enter-from,
.float-femi-bubble-leave-to {
  transform: translateY(8px);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .float-femi-btn { animation: none; }
}
</style>
