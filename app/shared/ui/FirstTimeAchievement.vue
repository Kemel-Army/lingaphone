<script setup lang="ts">
/**
 * FirstTimeAchievement — full-screen overlay-карточка при ПЕРВОМ прохождении
 * каждого типа слоя за всю историю ребёнка.
 *
 * Психология: «момент первого раза» — это анкер для долгосрочной памяти.
 * Если ребёнок впервые прошёл TRAINER, он должен запомнить именно это
 * как «вау-момент», а не как очередной слой. Это ровно то, что Duolingo
 * делает с первой Crown ребёнка, и Khan Academy с первой Mastery-medal.
 *
 * Хранение: одна запись в localStorage по ключу `femo:first-times` —
 * список layer-types, которые ребёнок уже видел. На клиенте, без сервера,
 * этого достаточно для МVP.
 *
 * Применение в [lessonId].vue:
 *   - после успешного onComplete(layer) проверяем: если layerType ещё нет
 *     в списке → показываем overlay.
 *
 * Reduced-motion: скрываем particle-decor, оставляем плашку статической.
 */
import { ref, computed, onBeforeUnmount } from 'vue'

type LayerType = 'HOOK' | 'DIAGNOSTIC' | 'INTUITION' | 'EXPLANATION' | 'FORMALIZATION'
  | 'WALKTHROUGH' | 'TRAINER' | 'SCENARIO' | 'TRAPS' | 'TEACH_BACK' | 'MASTERY_CHECK'

const LAYER_LABEL: Record<LayerType, { title: string, subtitle: string, emoji: string, accent: string }> = {
  HOOK: { title: 'Первое приключение!', subtitle: 'Ты впервые увидел Hook — мини-историю в начале урока.', emoji: '🎬', accent: 'amber' },
  DIAGNOSTIC: { title: 'Первый раунд диагностики!', subtitle: 'Ты ответил на первые контрольные вопросы.', emoji: '🩺', accent: 'sky' },
  INTUITION: { title: 'Первая интуиция!', subtitle: 'Ты подкрутил математический виджет и почувствовал смысл.', emoji: '✨', accent: 'cyan' },
  EXPLANATION: { title: 'Первое объяснение!', subtitle: 'Ты прочитал и нажал — карточки знаний открылись.', emoji: '📖', accent: 'green' },
  FORMALIZATION: { title: 'Первая формализация!', subtitle: 'Ты увидел структуру правила. Теперь оно в голове как картинка.', emoji: '🧩', accent: 'violet' },
  WALKTHROUGH: { title: 'Первый разбор!', subtitle: 'Ты прошёл шаг за шагом вместе с маскотом Феми.', emoji: '🧠', accent: 'yellow' },
  TRAINER: { title: 'Первая тренировка!', subtitle: 'Ты выполнил серию задач. Мышцы математики начали расти 💪', emoji: '🏋️', accent: 'emerald' },
  SCENARIO: { title: 'Первая роль!', subtitle: 'Ты вошёл в сцену и применил знание в реальной ситуации.', emoji: '🎭', accent: 'orange' },
  TRAPS: { title: 'Первый охотник за ошибками!', subtitle: 'Ты нашёл и обезвредил типичную ловушку.', emoji: '🪤', accent: 'rose' },
  TEACH_BACK: { title: 'Первый учитель!', subtitle: 'Ты объяснил тему другими словами. Это — высший уровень понимания.', emoji: '🎤', accent: 'pink' },
  MASTERY_CHECK: { title: 'Первая мастерия!', subtitle: 'Ты прошёл финальный тест. Тема покорена.', emoji: '🏆', accent: 'amber' }
}

const STORAGE_KEY = 'femo:first-times'

const visible = ref(false)
const currentLayerType = ref<LayerType | null>(null)
let hideTimer: ReturnType<typeof setTimeout> | null = null

const seenSet = (): Set<string> => {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(arr)
  } catch {
    return new Set()
  }
}

const persist = (set: Set<string>) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
  } catch {
    // ignore
  }
}

/** Проверить и показать overlay. Возвращает `true` если показано (т.е. был первый раз). */
const triggerIfFirst = (layerType: LayerType): boolean => {
  const set = seenSet()
  if (set.has(layerType)) return false
  set.add(layerType)
  persist(set)
  currentLayerType.value = layerType
  visible.value = true
  if (hideTimer) clearTimeout(hideTimer)
  // Авто-скрытие через 4.5s. Ребёнок успевает прочитать + насладиться.
  hideTimer = setTimeout(() => {
    visible.value = false
  }, 4500)
  return true
}

const close = () => {
  visible.value = false
  if (hideTimer) clearTimeout(hideTimer)
}

const meta = computed(() => currentLayerType.value ? LAYER_LABEL[currentLayerType.value] : null)

defineExpose({ triggerIfFirst, close })

onBeforeUnmount(() => {
  if (hideTimer) clearTimeout(hideTimer)
})
</script>

<template>
  <Transition name="first-overlay">
    <div
      v-if="visible && meta"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm"
      @click="close"
    >
      <div
        class="relative max-w-md w-full rounded-3xl p-7 text-center bg-linear-to-br shadow-2xl"
        :class="[
          meta.accent === 'amber' ? 'from-amber-50 to-orange-100 dark:from-amber-950/80 dark:to-orange-950/80'
          : meta.accent === 'sky' ? 'from-sky-50 to-cyan-100 dark:from-sky-950/80 dark:to-cyan-950/80'
            : meta.accent === 'cyan' ? 'from-cyan-50 to-blue-100 dark:from-cyan-950/80 dark:to-blue-950/80'
              : meta.accent === 'green' ? 'from-green-50 to-emerald-100 dark:from-green-950/80 dark:to-emerald-950/80'
                : meta.accent === 'violet' ? 'from-violet-50 to-purple-100 dark:from-violet-950/80 dark:to-purple-950/80'
                  : meta.accent === 'yellow' ? 'from-yellow-50 to-amber-100 dark:from-yellow-950/80 dark:to-amber-950/80'
                    : meta.accent === 'emerald' ? 'from-emerald-50 to-teal-100 dark:from-emerald-950/80 dark:to-teal-950/80'
                      : meta.accent === 'orange' ? 'from-orange-50 to-rose-100 dark:from-orange-950/80 dark:to-rose-950/80'
                        : meta.accent === 'rose' ? 'from-rose-50 to-pink-100 dark:from-rose-950/80 dark:to-pink-950/80'
                          : meta.accent === 'pink' ? 'from-pink-50 to-fuchsia-100 dark:from-pink-950/80 dark:to-fuchsia-950/80'
                            : 'from-amber-50 to-orange-100 dark:from-amber-950/80 dark:to-orange-950/80'
        ]"
        @click.stop
      >
        <!-- Sparks decor -->
        <div
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
        >
          <span
            v-for="n in 10"
            :key="n"
            class="first-spark absolute text-xl"
            :style="{
              left: `${(n * 13) % 95}%`,
              top: `${(n * 19) % 80}%`,
              animationDelay: `${n * 0.18}s`
            }"
          >
            ✨
          </span>
        </div>

        <div class="relative">
          <div class="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
            🎉 ВПЕРВЫЕ
          </div>
          <div class="text-7xl mb-3 first-emoji-pop">
            {{ meta.emoji }}
          </div>
          <h3 class="text-2xl font-black text-highlighted leading-tight">
            {{ meta.title }}
          </h3>
          <p class="mt-3 text-sm text-muted leading-relaxed">
            {{ meta.subtitle }}
          </p>
          <UButton
            class="mt-6"
            size="md"
            color="primary"
            block
            @click="close"
          >
            Дальше
          </UButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.first-overlay-enter-active {
  transition: opacity 0.3s ease, backdrop-filter 0.3s ease;
}
.first-overlay-leave-active {
  transition: opacity 0.25s ease, backdrop-filter 0.25s ease;
}
.first-overlay-enter-from,
.first-overlay-leave-to {
  opacity: 0;
}
.first-overlay-enter-active > div,
.first-overlay-leave-active > div {
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.4, 1.4);
}
.first-overlay-enter-from > div {
  transform: scale(0.85) translateY(20px);
}
.first-overlay-leave-to > div {
  transform: scale(0.95);
}

@keyframes first-emoji-pop {
  0%   { transform: scale(0) rotate(-30deg); }
  60%  { transform: scale(1.2) rotate(8deg); }
  100% { transform: scale(1) rotate(0deg); }
}
.first-emoji-pop {
  animation: first-emoji-pop 0.6s cubic-bezier(0.25, 0.8, 0.4, 1.6);
}

@keyframes first-spark {
  0%, 100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.3) rotate(180deg); }
}
.first-spark {
  animation: first-spark 2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .first-emoji-pop,
  .first-spark {
    animation: none !important;
  }
}
</style>
