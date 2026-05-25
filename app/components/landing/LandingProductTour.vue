<script setup lang="ts">
import { useTemplateRef } from 'vue'

// 8 кадров продукта — реальные экраны, как они выглядят внутри.
// Заголовки и хайлайт — что именно показываем.

const screens = [
  { code: 'home', label: 'Главный экран', highlight: 'Карта знаний · квесты · streak · Феми' },
  { code: 'diagnostic', label: 'Диагностика', highlight: 'Tap-correct · сердечки · адаптация' },
  { code: 'aichat', label: 'AI-чат с Феми', highlight: 'Голос · фото · формулы · подсказки' },
  { code: 'capsule', label: 'Капсула знания', highlight: '11 слоёв · слой Тренажёр · +XP' },
  { code: 'mastery', label: 'Мастери-чек', highlight: 'Финал темы · трофей gold/silver' }
] as const

type ScreenCode = typeof screens[number]['code']

const railRef = useTemplateRef<HTMLElement>('railRef')
const activeIdx = ref(0)

const goTo = (i: number) => {
  if (!railRef.value) return
  const clamped = Math.max(0, Math.min(screens.length - 1, i))
  const card = railRef.value.querySelectorAll<HTMLElement>('.tour-phone-wrap')[clamped]
  if (!card) return
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  activeIdx.value = clamped
}

const next = () => goTo(activeIdx.value + 1)
const prev = () => goTo(activeIdx.value - 1)

const onScroll = () => {
  if (!railRef.value) return
  const rail = railRef.value
  const center = rail.scrollLeft + rail.clientWidth / 2
  const cards = Array.from(rail.querySelectorAll<HTMLElement>('.tour-phone-wrap'))
  let bestIdx = 0
  let bestDist = Number.POSITIVE_INFINITY
  cards.forEach((c, i) => {
    const cardCenter = c.offsetLeft + c.clientWidth / 2
    const d = Math.abs(cardCenter - center)
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  })
  activeIdx.value = bestIdx
}

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    next()
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    prev()
  }
}

const sectionRef = useTemplateRef<HTMLElement>('sectionRef')
useScrollReveal(sectionRef, { stagger: 70 })

// Sample data used inside screens (kept tiny + believable)
const knowledgeTiles = [
  { name: 'Сложение', mastery: 92, accent: '#10B981' },
  { name: 'Умножение', mastery: 64, accent: '#F59E0B' },
  { name: 'Дроби', mastery: 28, accent: '#EF4438' },
  { name: 'Углы', mastery: 51, accent: '#8B5CF6' }
]

const quests = [
  { label: '5 задач по дробям', xp: 30, done: true },
  { label: 'AI-сессия 10 минут', xp: 20, done: true },
  { label: 'Решить задачу дня', xp: 50, done: false }
]

const isActive = (code: ScreenCode) =>
  screens[activeIdx.value]?.code === code
</script>

<template>
  <section
    id="inside"
    ref="sectionRef"
    class="femo-tour"
  >
    <FemoMeshBg
      variant="soft"
      class="femo-tour-bg"
    />
    <div class="femo-section-inner">
      <header class="femo-section-head stagger-item">
        <span class="femo-chip">Загляни внутрь · 5 экранов</span>
        <h2 class="femo-section-title femo-display">
          Вот так это <span class="femo-text-gradient">выглядит изнутри</span>
        </h2>
        <p class="femo-section-sub">
          Не маркетинговые слайды — а реальные экраны продукта.
          Свайпай и смотри, что увидит твой ребёнок, когда зайдёт в Lingaphone впервые.
        </p>
      </header>

      <div class="femo-tour-stage stagger-item">
        <button
          type="button"
          class="femo-tour-arrow femo-tour-arrow--prev"
          :disabled="activeIdx === 0"
          aria-label="Предыдущий экран"
          @click="prev"
        >
          <UIcon
            name="i-lucide-chevron-left"
            class="size-5"
          />
        </button>

        <div
          ref="railRef"
          class="femo-tour-rail"
          tabindex="0"
          role="region"
          aria-label="Реальные экраны FEMO"
          @scroll.passive="onScroll"
          @keydown="onKey"
        >
          <!-- ───────── 1. HOME — Student dashboard ───────── -->
          <div
            v-for="screen in screens"
            :key="screen.code"
            class="tour-phone-wrap"
          >
            <div
              class="tour-phone"
              :class="{ 'is-active': isActive(screen.code) }"
            >
              <!-- Notch -->
              <div class="tour-phone-notch">
                <span class="tour-phone-time">9:41</span>
                <span class="tour-phone-island" />
                <span class="tour-phone-icons">
                  <UIcon
                    name="i-lucide-signal"
                    class="size-3"
                  />
                  <UIcon
                    name="i-lucide-wifi"
                    class="size-3"
                  />
                  <UIcon
                    name="i-lucide-battery-full"
                    class="size-3"
                  />
                </span>
              </div>

              <div class="tour-phone-screen">
                <!-- ───────── HOME ───────── -->
                <template v-if="screen.code === 'home'">
                  <header class="ts-home-head">
                    <div class="ts-home-greet">
                      <FemiMascot
                        state="greet"
                        size="xs"
                        silent
                        ignore-reactions
                      />
                      <div>
                        <p class="ts-home-hi">
                          Привет, Алишер!
                        </p>
                        <p class="ts-home-sub">
                          Готов к капсуле дня?
                        </p>
                      </div>
                    </div>
                    <span class="ts-home-streak">
                      <span class="ts-home-streak-flame">🔥</span>12
                    </span>
                  </header>

                  <div class="ts-home-xp">
                    <div class="ts-home-xp-meta">
                      <span class="ts-home-xp-lvl">Уровень 7</span>
                      <span class="ts-home-xp-num">470 / 600 XP</span>
                    </div>
                    <div class="ts-home-xp-track">
                      <div
                        class="ts-home-xp-fill"
                        style="width: 78%"
                      />
                    </div>
                  </div>

                  <p class="ts-home-section">
                    Карта знаний
                  </p>
                  <div class="ts-home-tiles">
                    <div
                      v-for="t in knowledgeTiles"
                      :key="t.name"
                      class="ts-home-tile"
                      :style="{ '--tile-accent': t.accent }"
                    >
                      <p class="ts-home-tile-name">
                        {{ t.name }}
                      </p>
                      <div class="ts-home-tile-bar">
                        <div
                          class="ts-home-tile-fill"
                          :style="{ width: `${t.mastery}%` }"
                        />
                      </div>
                      <p class="ts-home-tile-pct">
                        {{ t.mastery }}%
                      </p>
                    </div>
                  </div>

                  <p class="ts-home-section">
                    Квесты дня
                  </p>
                  <div class="ts-home-quests">
                    <div
                      v-for="q in quests"
                      :key="q.label"
                      class="ts-home-quest"
                      :class="{ 'is-done': q.done }"
                    >
                      <span class="ts-home-quest-check">
                        <UIcon
                          v-if="q.done"
                          name="i-lucide-check"
                          class="size-3"
                        />
                      </span>
                      <span class="ts-home-quest-label">{{ q.label }}</span>
                      <span class="ts-home-quest-xp">+{{ q.xp }}</span>
                    </div>
                  </div>

                  <nav class="ts-bottom-nav">
                    <span class="ts-bottom-item is-active">
                      <UIcon
                        name="i-lucide-home"
                        class="size-4"
                      />
                    </span>
                    <span class="ts-bottom-item">
                      <UIcon
                        name="i-lucide-map"
                        class="size-4"
                      />
                    </span>
                    <span class="ts-bottom-item">
                      <UIcon
                        name="i-lucide-bot"
                        class="size-4"
                      />
                    </span>
                    <span class="ts-bottom-item">
                      <UIcon
                        name="i-lucide-trophy"
                        class="size-4"
                      />
                    </span>
                  </nav>
                </template>

                <!-- ───────── DIAGNOSTIC ───────── -->
                <template v-else-if="screen.code === 'diagnostic'">
                  <header class="ts-diag-head">
                    <span class="ts-back">
                      <UIcon
                        name="i-lucide-arrow-left"
                        class="size-3.5"
                      />
                    </span>
                    <p class="ts-diag-title">
                      Диагностика · 12 / 20
                    </p>
                    <div class="ts-diag-hearts">
                      <span class="ts-heart">❤️</span>
                      <span class="ts-heart">❤️</span>
                      <span class="ts-heart">❤️</span>
                    </div>
                  </header>

                  <div class="ts-diag-prog">
                    <div
                      class="ts-diag-prog-fill"
                      style="width: 60%"
                    />
                  </div>

                  <div class="ts-diag-card">
                    <div class="ts-diag-mascot">
                      <FemiMascot
                        state="teach"
                        size="xs"
                        silent
                        ignore-reactions
                      />
                    </div>
                    <p class="ts-diag-q">
                      Найди все дроби больше <strong>1/2</strong>
                    </p>
                  </div>

                  <div class="ts-diag-grid">
                    <span class="ts-diag-tile">1/3</span>
                    <span class="ts-diag-tile is-pick">3/4</span>
                    <span class="ts-diag-tile">2/5</span>
                    <span class="ts-diag-tile is-pick">4/5</span>
                    <span class="ts-diag-tile">1/2</span>
                    <span class="ts-diag-tile is-pick">5/8</span>
                  </div>

                  <button
                    type="button"
                    class="ts-cta"
                  >
                    Проверить
                    <UIcon
                      name="i-lucide-arrow-right"
                      class="size-3.5"
                    />
                  </button>

                  <div class="ts-diag-hint">
                    <UIcon
                      name="i-lucide-sparkles"
                      class="size-3"
                    />
                    AI подскажет, если ошибёшься
                  </div>
                </template>

                <!-- ───────── AI CHAT ───────── -->
                <template v-else-if="screen.code === 'aichat'">
                  <header class="ts-chat-head">
                    <span class="ts-back">
                      <UIcon
                        name="i-lucide-arrow-left"
                        class="size-3.5"
                      />
                    </span>
                    <div class="ts-chat-meta">
                      <span class="ts-chat-icon">
                        <UIcon
                          name="i-lucide-bot"
                          class="size-3.5"
                        />
                      </span>
                      <div>
                        <p class="ts-chat-title">
                          Lingaphone AI-тренер
                        </p>
                        <p class="ts-chat-status">
                          <span class="ts-chat-dot" />
                          онлайн
                        </p>
                      </div>
                    </div>
                    <span class="ts-chat-mode">EXPLAIN</span>
                  </header>

                  <div class="ts-chat-msgs">
                    <div class="ts-msg ts-msg--user">
                      <span class="ts-msg-bubble">Объясни умножение в столбик</span>
                    </div>
                    <div class="ts-msg ts-msg--ai">
                      <span class="ts-msg-avatar">
                        <FemiMascot
                          state="teach"
                          size="xs"
                          silent
                          ignore-reactions
                        />
                      </span>
                      <span class="ts-msg-bubble">
                        Конечно, Алишер! Умножение в столбик — это <em>сокращённое</em> сложение.
                        <span class="ts-katex">
                          <span class="ts-katex-num">23</span>
                          <span class="ts-katex-op">×</span>
                          <span class="ts-katex-num">4</span>
                          <span class="ts-katex-eq">= 92</span>
                        </span>
                        <span class="ts-reveal">
                          <UIcon
                            name="i-lucide-eye"
                            class="size-3"
                          />
                          Узнай: почему так
                        </span>
                      </span>
                    </div>
                    <div class="ts-msg ts-msg--ai ts-typing">
                      <span class="ts-msg-avatar">
                        <FemiMascot
                          state="think"
                          size="xs"
                          silent
                          ignore-reactions
                        />
                      </span>
                      <span class="ts-typing-bubble">
                        <span class="ts-typing-dot" />
                        <span class="ts-typing-dot" />
                        <span class="ts-typing-dot" />
                      </span>
                    </div>
                  </div>

                  <div class="ts-chat-input">
                    <span class="ts-chat-mic">
                      <UIcon
                        name="i-lucide-mic"
                        class="size-3.5"
                      />
                    </span>
                    <span class="ts-chat-field">Спроси что-нибудь…</span>
                    <span class="ts-chat-cam">
                      <UIcon
                        name="i-lucide-camera"
                        class="size-3.5"
                      />
                    </span>
                  </div>
                </template>

                <!-- ───────── CAPSULE — Trainer layer ───────── -->
                <template v-else-if="screen.code === 'capsule'">
                  <header class="ts-cap-head">
                    <span class="ts-back">
                      <UIcon
                        name="i-lucide-arrow-left"
                        class="size-3.5"
                      />
                    </span>
                    <div>
                      <p class="ts-cap-topic">
                        Дроби · сложение
                      </p>
                      <p class="ts-cap-sub">
                        Капсула знания · слой 7 / 11
                      </p>
                    </div>
                    <span class="ts-cap-xp">+30</span>
                  </header>

                  <!-- 11-layer stepper -->
                  <div class="ts-cap-stepper">
                    <span
                      v-for="i in 11"
                      :key="i"
                      class="ts-cap-step"
                      :class="i < 7 ? 'is-done' : i === 7 ? 'is-active' : 'is-locked'"
                    >{{ i }}</span>
                  </div>
                  <p class="ts-cap-layer-name">
                    <UIcon
                      name="i-lucide-dumbbell"
                      class="size-3.5"
                    />
                    Тренажёр · адаптивная сложность
                  </p>

                  <div class="ts-cap-task">
                    <p class="ts-cap-q">
                      <span class="ts-cap-frac">
                        <span>5</span>
                        <i />
                        <span>8</span>
                      </span>
                      <span>+</span>
                      <span class="ts-cap-frac">
                        <span>1</span>
                        <i />
                        <span>8</span>
                      </span>
                      <span>= ?</span>
                    </p>
                    <div class="ts-cap-opts">
                      <span class="ts-cap-opt">6/16</span>
                      <span class="ts-cap-opt is-pick">6/8</span>
                      <span class="ts-cap-opt">5/16</span>
                      <span class="ts-cap-opt">1/16</span>
                    </div>
                    <span class="ts-cap-hint">
                      <UIcon
                        name="i-lucide-lightbulb"
                        class="size-3"
                      />
                      Знаменатели одинаковые → складывай только числители
                    </span>
                  </div>

                  <div class="ts-cap-foot">
                    <span class="ts-cap-attempts">Попытка 1 / 3</span>
                    <button
                      type="button"
                      class="ts-cta ts-cta--inline"
                    >
                      Ответить
                    </button>
                  </div>
                </template>

                <!-- ───────── MASTERY CHECK ───────── -->
                <template v-else-if="screen.code === 'mastery'">
                  <header class="ts-mast-head">
                    <span class="ts-back">
                      <UIcon
                        name="i-lucide-arrow-left"
                        class="size-3.5"
                      />
                    </span>
                    <p class="ts-mast-title">
                      Мастери-чек
                    </p>
                  </header>

                  <div class="ts-mast-trophy">
                    <div class="ts-mast-trophy-glow" />
                    <div class="ts-mast-trophy-ring">
                      <UIcon
                        name="i-lucide-trophy"
                        class="size-7"
                      />
                    </div>
                    <p class="ts-mast-pct">
                      92<span>%</span>
                    </p>
                    <p class="ts-mast-tag">
                      <span class="ts-mast-tier ts-mast-tier--gold">GOLD</span>
                      Тема освоена
                    </p>
                  </div>

                  <div class="ts-mast-mascot">
                    <FemiMascot
                      state="trophy"
                      size="sm"
                      silent
                      ignore-reactions
                    />
                    <span class="ts-mast-bubble">
                      Алишер, ты разнёс эту тему! +40 XP
                    </span>
                  </div>

                  <div class="ts-mast-rows">
                    <div class="ts-mast-row">
                      <span class="ts-mast-row-label">Сложение дробей</span>
                      <span class="ts-mast-row-bar"><i style="width:100%" /></span>
                      <span class="ts-mast-row-pct">100%</span>
                    </div>
                    <div class="ts-mast-row">
                      <span class="ts-mast-row-label">Сравнение дробей</span>
                      <span class="ts-mast-row-bar"><i style="width:90%" /></span>
                      <span class="ts-mast-row-pct">90%</span>
                    </div>
                    <div class="ts-mast-row">
                      <span class="ts-mast-row-label">Смешанные дроби</span>
                      <span class="ts-mast-row-bar"><i style="width:80%" /></span>
                      <span class="ts-mast-row-pct">80%</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="ts-cta ts-cta--share"
                  >
                    <UIcon
                      name="i-lucide-share-2"
                      class="size-3.5"
                    />
                    Поделиться достижением
                  </button>
                </template>
              </div>
            </div>

            <p class="tour-phone-cap">
              <span class="tour-phone-cap-num">{{ String(screens.findIndex(s => s.code === screen.code) + 1).padStart(2, '0') }}</span>
              <span class="tour-phone-cap-meta">
                <strong>{{ screen.label }}</strong>
                <span>{{ screen.highlight }}</span>
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          class="femo-tour-arrow femo-tour-arrow--next"
          :disabled="activeIdx === screens.length - 1"
          aria-label="Следующий экран"
          @click="next"
        >
          <UIcon
            name="i-lucide-chevron-right"
            class="size-5"
          />
        </button>
      </div>

      <!-- Pagination dots -->
      <div class="femo-tour-dots stagger-item">
        <button
          v-for="(s, i) in screens"
          :key="s.code"
          type="button"
          class="femo-tour-dot"
          :class="{ 'is-active': i === activeIdx }"
          :aria-label="`Экран ${i + 1}: ${s.label}`"
          @click="goTo(i)"
        >
          {{ i + 1 }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.femo-tour {
  position: relative;
  padding: clamp(2.5rem, 5vw, 4.5rem) 0;
  background: linear-gradient(180deg, #FFF7F4 0%, #FFFFFF 100%);
  overflow: hidden;
  isolation: isolate;
}

.femo-tour-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.55;
}

.femo-tour-stage {
  position: relative;
  margin-top: 2.5rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.5rem;
  align-items: center;
}

@media (max-width: 640px) {
  .femo-tour-stage { grid-template-columns: 1fr; }
}

/* Arrows */
.femo-tour-arrow {
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  color: var(--color-femo-ink-700);
  box-shadow: var(--shadow-soft);
  cursor: pointer;
  transition: all 0.25s var(--ease-out-expo);
  z-index: 2;
}

.femo-tour-arrow:hover:not(:disabled) {
  background: var(--gradient-hero);
  color: white;
  border-color: transparent;
  transform: scale(1.06);
  box-shadow: 0 10px 24px -8px rgba(220, 38, 38, 0.45);
}

.femo-tour-arrow:disabled { opacity: 0.35; cursor: not-allowed; }

@media (max-width: 640px) {
  .femo-tour-arrow { display: none; }
}

/* Rail */
.femo-tour-rail {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding: 0 calc(50% - 9rem);
  padding: 1rem calc(50% - 9rem) 1.5rem;
  scrollbar-width: none;
  outline: none;
}

.femo-tour-rail::-webkit-scrollbar { display: none; }

@media (max-width: 640px) {
  .femo-tour-rail {
    scroll-padding: 0 1.5rem;
    padding: 1rem 1.5rem 1.5rem;
  }
}

/* Phone wrap & frame */
.tour-phone-wrap {
  flex: 0 0 auto;
  scroll-snap-align: center;
  display: grid;
  gap: 0.85rem;
  justify-items: center;
}

.tour-phone {
  width: 17rem;
  height: 36rem;
  border-radius: 2.4rem;
  background: #0F172A;
  padding: 0.45rem;
  box-shadow:
    0 30px 70px -20px rgba(15, 23, 42, 0.4),
    0 6px 14px -4px rgba(15, 23, 42, 0.2),
    0 0 0 2px #1E293B;
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr;
  transform: scale(0.92);
  opacity: 0.55;
  transition:
    transform 0.45s var(--ease-out-expo),
    opacity 0.45s var(--ease-out-expo),
    box-shadow 0.45s var(--ease-out-expo);
}

/* Mirror reflection under each phone — fades out smoothly */
.tour-phone::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 5rem;
  background: inherit;
  border-radius: inherit;
  transform: scaleY(-1);
  transform-origin: top;
  -webkit-mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, transparent 80%);
          mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, transparent 80%);
  opacity: 0;
  transition: opacity 0.5s var(--ease-out-expo);
  pointer-events: none;
  z-index: -1;
}

.tour-phone.is-active::after { opacity: 0.55; }

.tour-phone.is-active {
  transform: scale(1);
  opacity: 1;
  box-shadow:
    0 36px 80px -22px rgba(220, 38, 38, 0.4),
    0 12px 28px -10px rgba(15, 23, 42, 0.3),
    0 0 0 2px #1E293B;
}

@media (max-width: 480px) {
  .tour-phone { width: 15.5rem; height: 32rem; }
}

/* Notch */
.tour-phone-notch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.2rem 0.85rem;
  font-size: 0.65rem;
  color: white;
  font-weight: 700;
  position: relative;
}

.tour-phone-island {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 4.5rem;
  height: 1rem;
  border-radius: 999px;
  background: #000;
}

.tour-phone-icons {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  color: white;
}

/* Screen */
.tour-phone-screen {
  background: linear-gradient(180deg, #FFFFFF 0%, #FFF7F4 100%);
  border-radius: 2rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.7rem 0.7rem 0.5rem;
  position: relative;
}

/* Caption under phone */
.tour-phone-cap {
  display: inline-grid;
  grid-template-columns: auto 1fr;
  gap: 0.55rem;
  align-items: center;
  padding: 0.45rem 0.85rem;
  background: var(--ui-bg-elevated);
  border-radius: 999px;
  border: 1px solid var(--color-femo-ink-100);
  box-shadow: var(--shadow-soft);
  max-width: 17rem;
}

.tour-phone-cap-num {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.85rem;
  color: var(--color-femo-red-600);
  background: linear-gradient(135deg, #FFF1F0, #FFE4D2);
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tour-phone-cap-meta { display: grid; min-width: 0; }
.tour-phone-cap-meta strong { font-size: 0.78rem; color: var(--color-femo-ink-900); font-weight: 700; }
.tour-phone-cap-meta span { font-size: 0.65rem; color: var(--color-femo-ink-500); margin-top: 0.05rem; }

/* ─────────────────────────────────────────────────────────────────────
   COMMON SCREEN PRIMITIVES
   ───────────────────────────────────────────────────────────────────── */
.ts-back {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-femo-ink-700);
  flex: none;
}

.ts-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  background: var(--gradient-hero);
  color: white;
  font-size: 0.78rem;
  font-weight: 700;
  border: none;
  box-shadow: 0 8px 18px -6px rgba(220, 38, 38, 0.45);
  align-self: stretch;
}

.ts-cta--inline { padding: 0.4rem 0.85rem; font-size: 0.72rem; align-self: end; }
.ts-cta--share { background: linear-gradient(135deg, #FACC15, #F59E0B); box-shadow: 0 8px 18px -6px rgba(245, 158, 11, 0.5); }

.ts-bottom-nav {
  margin-top: auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.3rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-femo-ink-100);
}
.ts-bottom-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 0;
  border-radius: 0.55rem;
  color: var(--color-femo-ink-400);
}
.ts-bottom-item.is-active {
  background: linear-gradient(135deg, #FFF1F0, #FFE4D2);
  color: var(--color-femo-red-600);
}

/* ─── HOME ─────────────────────────────────────────────────────────── */
.ts-home-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.ts-home-greet { display: inline-flex; align-items: center; gap: 0.45rem; }
.ts-home-hi { font-size: 0.82rem; font-weight: 800; color: var(--color-femo-ink-900); line-height: 1.1; }
.ts-home-sub { font-size: 0.65rem; color: var(--color-femo-ink-500); margin-top: 0.05rem; }
.ts-home-streak {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  background: linear-gradient(135deg, #FEF3C7, #FED7AA);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  color: #B45309;
}
.ts-home-streak-flame { font-size: 0.85rem; }

.ts-home-xp { display: grid; gap: 0.25rem; }
.ts-home-xp-meta { display: flex; justify-content: space-between; }
.ts-home-xp-lvl { font-size: 0.7rem; font-weight: 700; color: var(--color-femo-ink-800); }
.ts-home-xp-num { font-size: 0.65rem; color: var(--color-femo-ink-500); font-weight: 600; }
.ts-home-xp-track { height: 0.45rem; background: var(--color-femo-ink-100); border-radius: 999px; overflow: hidden; }
.ts-home-xp-fill {
  height: 100%;
  background: var(--gradient-hero);
  border-radius: 999px;
  box-shadow: 0 0 8px rgba(220, 38, 38, 0.45);
}

.ts-home-section { font-size: 0.68rem; font-weight: 800; color: var(--color-femo-ink-700); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 0.15rem; }

.ts-home-tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; }
.ts-home-tile {
  --tile-accent: #EF4438;
  padding: 0.5rem 0.55rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 0.7rem;
  display: grid;
  gap: 0.25rem;
}
.ts-home-tile-name { font-size: 0.68rem; font-weight: 700; color: var(--color-femo-ink-800); }
.ts-home-tile-bar { height: 0.3rem; background: var(--color-femo-ink-100); border-radius: 999px; overflow: hidden; }
.ts-home-tile-fill { height: 100%; background: var(--tile-accent); border-radius: 999px; }
.ts-home-tile-pct { font-size: 0.62rem; font-weight: 700; color: var(--tile-accent); justify-self: end; }

.ts-home-quests { display: grid; gap: 0.3rem; }
.ts-home-quest {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.45rem;
  align-items: center;
  padding: 0.4rem 0.55rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 0.7rem;
  font-size: 0.7rem;
  color: var(--color-femo-ink-700);
}
.ts-home-quest.is-done { background: linear-gradient(135deg, #ECFDF5, #FFFFFF); border-color: #BBF7D0; }
.ts-home-quest-check {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: 1.5px solid var(--color-femo-ink-300);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
}
.ts-home-quest.is-done .ts-home-quest-check { background: #10B981; border-color: #10B981; }
.ts-home-quest-label { font-weight: 600; }
.ts-home-quest.is-done .ts-home-quest-label { text-decoration: line-through; color: var(--color-femo-ink-500); }
.ts-home-quest-xp { font-size: 0.62rem; font-weight: 800; color: var(--color-femo-red-600); }

/* ─── DIAGNOSTIC ───────────────────────────────────────────────────── */
.ts-diag-head { display: flex; align-items: center; gap: 0.5rem; }
.ts-diag-title { flex: 1; font-size: 0.78rem; font-weight: 800; color: var(--color-femo-ink-900); text-align: center; }
.ts-diag-hearts { display: inline-flex; gap: 0.1rem; font-size: 0.7rem; }

.ts-diag-prog { height: 0.3rem; background: var(--color-femo-ink-100); border-radius: 999px; overflow: hidden; }
.ts-diag-prog-fill { height: 100%; background: var(--gradient-hero); border-radius: 999px; }

.ts-diag-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem;
  align-items: center;
  padding: 0.7rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-red-100);
  border-radius: 1rem;
  box-shadow: 0 4px 12px -6px rgba(220, 38, 38, 0.2);
}
.ts-diag-q { font-size: 0.85rem; font-weight: 700; color: var(--color-femo-ink-900); line-height: 1.35; }
.ts-diag-q strong { color: var(--color-femo-red-600); }

.ts-diag-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem; }
.ts-diag-tile {
  padding: 0.6rem 0;
  background: var(--ui-bg-elevated);
  border: 1.5px solid var(--color-femo-ink-100);
  border-radius: 0.7rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-femo-ink-700);
  text-align: center;
  font-family: var(--font-display);
}
.ts-diag-tile.is-pick {
  background: linear-gradient(135deg, #FFF1F0, #FFE4D2);
  border-color: var(--color-femo-red-300);
  color: var(--color-femo-red-700);
  box-shadow: 0 6px 14px -6px rgba(220, 38, 38, 0.3);
}

.ts-diag-hint {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.55rem;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 999px;
  font-size: 0.62rem;
  font-weight: 600;
  color: #B45309;
  align-self: center;
  margin-top: auto;
}

/* ─── AI CHAT ──────────────────────────────────────────────────────── */
.ts-chat-head { display: flex; align-items: center; gap: 0.45rem; padding-bottom: 0.4rem; border-bottom: 1px solid var(--color-femo-ink-100); }
.ts-chat-meta { flex: 1; display: inline-flex; align-items: center; gap: 0.4rem; min-width: 0; }
.ts-chat-icon {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 0.5rem;
  background: var(--gradient-hero);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.ts-chat-title { font-size: 0.72rem; font-weight: 800; color: var(--color-femo-ink-900); line-height: 1; }
.ts-chat-status { font-size: 0.6rem; color: var(--color-femo-ink-500); display: inline-flex; align-items: center; gap: 0.25rem; margin-top: 0.1rem; }
.ts-chat-dot { width: 0.35rem; height: 0.35rem; border-radius: 50%; background: #16A34A; box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2); }
.ts-chat-mode {
  font-size: 0.55rem;
  font-weight: 800;
  padding: 0.18rem 0.45rem;
  background: linear-gradient(135deg, #FFF1F0, #FFE4D2);
  border-radius: 999px;
  color: var(--color-femo-red-700);
  letter-spacing: 0.04em;
}

.ts-chat-msgs { display: flex; flex-direction: column; gap: 0.4rem; flex: 1; overflow: hidden; }
.ts-msg { display: grid; gap: 0.3rem; max-width: 100%; }
.ts-msg--user { justify-items: end; }
.ts-msg--ai   { grid-template-columns: auto 1fr; align-items: flex-end; }
.ts-msg-avatar {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: var(--shadow-soft);
}
.ts-msg-bubble {
  font-size: 0.7rem;
  padding: 0.5rem 0.65rem;
  border-radius: 0.85rem;
  line-height: 1.45;
  display: inline-block;
}
.ts-msg--user .ts-msg-bubble {
  background: var(--gradient-hero);
  color: white;
  border-bottom-right-radius: 0.3rem;
  font-weight: 600;
}
.ts-msg--ai .ts-msg-bubble {
  background: linear-gradient(180deg, #FFF7F4 0%, #FFFFFF 100%);
  color: var(--color-femo-ink-800);
  border: 1px solid var(--color-femo-red-100);
  border-bottom-left-radius: 0.3rem;
}
.ts-msg-bubble em { font-style: italic; color: var(--color-femo-red-600); font-weight: 700; }

.ts-katex {
  display: block;
  margin: 0.4rem 0 0.3rem;
  padding: 0.4rem 0.55rem;
  background: var(--ui-bg-elevated);
  border-radius: 0.45rem;
  border: 1px dashed var(--color-femo-red-200);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.85rem;
  color: var(--color-femo-ink-900);
  text-align: center;
}
.ts-katex-num { color: var(--color-femo-red-600); }
.ts-katex-op { margin: 0 0.35rem; color: var(--color-femo-ink-500); }
.ts-katex-eq { margin-left: 0.4rem; color: #16A34A; }

.ts-reveal {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(245, 158, 11, 0.12);
  color: #B45309;
  border-radius: 999px;
  font-size: 0.6rem;
  font-weight: 700;
  margin-top: 0.2rem;
}

.ts-typing .ts-typing-bubble {
  display: inline-flex;
  gap: 0.2rem;
  padding: 0.55rem 0.7rem;
  background: linear-gradient(180deg, #FFF7F4 0%, #FFFFFF 100%);
  border: 1px solid var(--color-femo-red-100);
  border-radius: 0.85rem;
  border-bottom-left-radius: 0.3rem;
}
.ts-typing-dot {
  width: 0.3rem;
  height: 0.3rem;
  border-radius: 50%;
  background: var(--color-femo-red-500);
  animation: ts-typing 1.3s ease-in-out infinite;
}
.ts-typing-dot:nth-child(2) { animation-delay: 0.15s; }
.ts-typing-dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes ts-typing {
  0%, 60%, 100% { opacity: 0.35; transform: translateY(0); }
  30%           { opacity: 1; transform: translateY(-2px); }
}

.ts-chat-input {
  margin-top: auto;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.35rem;
  align-items: center;
  padding: 0.4rem 0.5rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 999px;
}
.ts-chat-mic, .ts-chat-cam {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
}
.ts-chat-mic { background: var(--gradient-hero); }
.ts-chat-cam { background: var(--color-femo-ink-100); color: var(--color-femo-ink-600); }
.ts-chat-field { font-size: 0.65rem; color: var(--color-femo-ink-400); font-weight: 500; }

/* ─── CAPSULE ──────────────────────────────────────────────────────── */
.ts-cap-head { display: grid; grid-template-columns: auto 1fr auto; gap: 0.5rem; align-items: center; }
.ts-cap-topic { font-size: 0.7rem; font-weight: 800; color: var(--color-femo-ink-900); }
.ts-cap-sub { font-size: 0.6rem; color: var(--color-femo-ink-500); }
.ts-cap-xp {
  padding: 0.25rem 0.55rem;
  background: var(--gradient-hero);
  color: white;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.65rem;
  box-shadow: 0 6px 14px -6px rgba(220, 38, 38, 0.45);
}

.ts-cap-stepper { display: flex; gap: 0.18rem; justify-content: center; padding: 0.3rem 0; }
.ts-cap-step {
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 50%;
  font-size: 0.55rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-femo-ink-100);
  color: var(--color-femo-ink-400);
}
.ts-cap-step.is-done { background: #10B981; color: white; }
.ts-cap-step.is-active { background: var(--gradient-hero); color: white; box-shadow: 0 4px 10px -4px rgba(220, 38, 38, 0.5); transform: scale(1.15); }
.ts-cap-step.is-locked { background: white; border: 1px dashed var(--color-femo-ink-200); color: var(--color-femo-ink-300); }

.ts-cap-layer-name {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-femo-red-700);
  align-self: center;
}

.ts-cap-task {
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 1rem;
  padding: 0.7rem;
  display: grid;
  gap: 0.55rem;
}
.ts-cap-q {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--color-femo-ink-900);
  justify-content: center;
}
.ts-cap-frac {
  display: inline-grid;
  grid-template-rows: auto auto auto;
  align-items: center;
  text-align: center;
  font-size: 0.95rem;
}
.ts-cap-frac i { display: block; height: 1.5px; background: var(--color-femo-ink-700); width: 1rem; margin: 0.05rem auto; }
.ts-cap-opts { display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem; }
.ts-cap-opt {
  padding: 0.5rem 0;
  background: var(--ui-bg-elevated);
  border: 1.5px solid var(--color-femo-ink-100);
  border-radius: 0.6rem;
  text-align: center;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-femo-ink-700);
  font-family: var(--font-display);
}
.ts-cap-opt.is-pick {
  background: linear-gradient(135deg, #ECFDF5, #FFFFFF);
  border-color: #10B981;
  color: #047857;
}
.ts-cap-hint {
  display: inline-flex;
  gap: 0.3rem;
  padding: 0.3rem 0.5rem;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 0.5rem;
  font-size: 0.6rem;
  font-weight: 600;
  color: #92400E;
  line-height: 1.35;
  align-items: flex-start;
}

.ts-cap-foot { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }
.ts-cap-attempts { font-size: 0.6rem; color: var(--color-femo-ink-500); font-weight: 600; }

/* ─── RADAR ────────────────────────────────────────────────────────── */
.ts-rad-head { display: grid; grid-template-columns: auto 1fr auto; gap: 0.5rem; align-items: center; }
.ts-rad-title { font-size: 0.78rem; font-weight: 800; color: var(--color-femo-ink-900); text-align: center; }
.ts-rad-period {
  padding: 0.18rem 0.45rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 999px;
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--color-femo-ink-700);
}

.ts-rad-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.3rem; }
.ts-rad-stat {
  padding: 0.45rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 0.7rem;
  text-align: center;
}
.ts-rad-stat-num { font-family: var(--font-display); font-weight: 800; font-size: 1rem; color: var(--color-femo-ink-900); line-height: 1; }
.ts-rad-stat-label { font-size: 0.55rem; color: var(--color-femo-ink-500); margin-top: 0.15rem; font-weight: 600; }
.ts-rad-stat--warn .ts-rad-stat-num { color: var(--color-femo-red-600); }

.ts-rad-chart { position: relative; padding: 0.4rem; }
.ts-rad-svg { width: 100%; height: auto; max-width: 11rem; margin: 0 auto; display: block; }
.ts-rad-ring { fill: none; stroke: var(--color-femo-ink-200); stroke-width: 0.5; }
.ts-rad-axis { stroke: var(--color-femo-ink-200); stroke-width: 0.5; }
.ts-rad-poly {
  fill: rgba(220, 38, 38, 0.18);
  stroke: var(--color-femo-red-500);
  stroke-width: 1.2;
  stroke-linejoin: round;
}
.ts-rad-labels { position: absolute; inset: 0.4rem; pointer-events: none; }
.ts-rad-label {
  position: absolute;
  left: var(--lx);
  top: var(--ly);
  transform: translate(-50%, -50%);
  font-size: 0.55rem;
  font-weight: 700;
  color: var(--color-femo-ink-700);
  background: var(--ui-bg-elevated);
  padding: 0.1rem 0.3rem;
  border-radius: 999px;
  border: 1px solid var(--color-femo-ink-100);
  white-space: nowrap;
}

.ts-rad-feed { display: grid; gap: 0.3rem; margin-top: auto; }
.ts-rad-feed-h { font-size: 0.62rem; font-weight: 800; color: var(--color-femo-ink-700); text-transform: uppercase; letter-spacing: 0.04em; }
.ts-rad-feed-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.4rem;
  align-items: center;
  padding: 0.35rem 0.5rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 0.55rem;
  font-size: 0.65rem;
}
.ts-rad-feed-icon {
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #FEF3C7, #FED7AA);
  color: #B45309;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.ts-rad-feed-text { color: var(--color-femo-ink-800); font-weight: 600; }
.ts-rad-feed-xp { font-weight: 800; color: var(--color-femo-red-600); }

/* ─── SCENARIO ─────────────────────────────────────────────────────── */
.ts-scen-head { display: grid; grid-template-columns: auto 1fr auto; gap: 0.4rem; align-items: center; }
.ts-scen-title { font-size: 0.7rem; font-weight: 800; color: var(--color-femo-ink-900); text-align: center; }
.ts-scen-combo {
  padding: 0.18rem 0.45rem;
  background: linear-gradient(135deg, #FFF1F0, #FFE4D2);
  border-radius: 999px;
  font-size: 0.55rem;
  font-weight: 800;
  color: var(--color-femo-red-700);
}

.ts-scen-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.3rem; }
.ts-scen-stat {
  padding: 0.4rem 0.45rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 0.6rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  justify-content: center;
  font-size: 0.6rem;
  color: var(--color-femo-ink-700);
  font-weight: 600;
}
.ts-scen-stat strong { font-family: var(--font-display); font-size: 0.78rem; color: var(--color-femo-ink-900); }

.ts-scen-stage { display: grid; gap: 0.5rem; flex: 1; }
.ts-scen-customer { display: grid; grid-template-columns: auto 1fr; gap: 0.45rem; align-items: end; }
.ts-scen-emoji { font-size: 1.5rem; line-height: 1; }
.ts-scen-bubble {
  padding: 0.4rem 0.6rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 0.7rem;
  border-bottom-left-radius: 0.25rem;
  font-size: 0.7rem;
  line-height: 1.35;
  color: var(--color-femo-ink-800);
}

.ts-scen-cash {
  padding: 0.5rem;
  background: linear-gradient(135deg, #FFF1F0, #FFE4D2);
  border: 1px solid var(--color-femo-red-200);
  border-radius: 0.7rem;
  display: grid;
  gap: 0.25rem;
}
.ts-scen-cash-h { font-size: 0.6rem; font-weight: 700; color: var(--color-femo-red-700); text-align: center; }
.ts-scen-cash-input {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.4rem;
  background: var(--ui-bg-elevated);
  border-radius: 0.55rem;
}
.ts-scen-cash-num { font-family: var(--font-display); font-weight: 800; font-size: 1.4rem; color: var(--color-femo-ink-900); }
.ts-scen-cash-cur { font-size: 0.85rem; font-weight: 700; color: var(--color-femo-ink-500); }

.ts-scen-keypad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.25rem; }
.ts-scen-key {
  aspect-ratio: 1.6 / 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 0.5rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-femo-ink-800);
  font-family: var(--font-display);
}
.ts-scen-key.is-ok { background: var(--gradient-hero); color: white; border-color: transparent; box-shadow: 0 4px 10px -4px rgba(220, 38, 38, 0.5); }

/* ─── MASTERY ──────────────────────────────────────────────────────── */
.ts-mast-head { display: flex; align-items: center; gap: 0.5rem; }
.ts-mast-title { flex: 1; font-size: 0.78rem; font-weight: 800; color: var(--color-femo-ink-900); text-align: center; }

.ts-mast-trophy {
  position: relative;
  padding: 1rem 0.5rem 0.7rem;
  background: linear-gradient(180deg, #FFF7F4 0%, #FFFFFF 100%);
  border: 1px solid var(--color-femo-red-100);
  border-radius: 1rem;
  display: grid;
  justify-items: center;
  gap: 0.35rem;
  overflow: hidden;
}
.ts-mast-trophy-glow {
  position: absolute;
  inset: -2rem;
  background: radial-gradient(50% 50% at 50% 35%, rgba(245, 158, 11, 0.35), transparent 65%);
  pointer-events: none;
  animation: ts-mast-glow 2.5s ease-in-out infinite;
}
@keyframes ts-mast-glow {
  0%, 100% { opacity: 0.6; }
  50%      { opacity: 1; }
}
.ts-mast-trophy-ring {
  position: relative;
  z-index: 1;
  width: 3.4rem;
  height: 3.4rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #FCD34D, #F59E0B);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 24px -6px rgba(245, 158, 11, 0.6);
}
.ts-mast-pct {
  position: relative;
  z-index: 1;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 2.2rem;
  color: var(--color-femo-ink-900);
  line-height: 1;
}
.ts-mast-pct span { font-size: 1rem; color: var(--color-femo-ink-500); margin-left: 0.05rem; }
.ts-mast-tag { position: relative; z-index: 1; font-size: 0.7rem; color: var(--color-femo-ink-700); font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem; }
.ts-mast-tier { font-size: 0.55rem; padding: 0.18rem 0.45rem; border-radius: 999px; font-weight: 800; letter-spacing: 0.04em; }
.ts-mast-tier--gold { background: #FEF9C3; color: #A16207; border: 1px solid #FACC15; }

.ts-mast-mascot {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem;
  align-items: center;
  padding: 0.55rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 0.85rem;
}
.ts-mast-bubble { font-size: 0.7rem; font-weight: 600; color: var(--color-femo-ink-800); line-height: 1.35; }

.ts-mast-rows { display: grid; gap: 0.3rem; }
.ts-mast-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.3rem 0.5rem;
  align-items: center;
}
.ts-mast-row-label { grid-column: 1 / 2; font-size: 0.62rem; color: var(--color-femo-ink-700); font-weight: 600; }
.ts-mast-row-pct { grid-column: 2 / 3; grid-row: 1 / 2; font-size: 0.62rem; font-weight: 800; color: var(--color-femo-ink-800); }
.ts-mast-row-bar { grid-column: 1 / 3; height: 0.3rem; background: var(--color-femo-ink-100); border-radius: 999px; overflow: hidden; }
.ts-mast-row-bar i { display: block; height: 100%; background: linear-gradient(90deg, #FACC15, #F59E0B); border-radius: 999px; }

/* ─── PARENT ───────────────────────────────────────────────────────── */
.ts-par-head { display: flex; align-items: center; justify-content: space-between; }
.ts-par-hi { font-size: 0.85rem; font-weight: 800; color: var(--color-femo-ink-900); }
.ts-par-bell {
  position: relative;
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 50%;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-femo-ink-700);
}
.ts-par-bell-dot { position: absolute; top: 0.15rem; right: 0.2rem; width: 0.4rem; height: 0.4rem; border-radius: 50%; background: var(--color-femo-red-500); border: 1.5px solid white; }

.ts-par-section { font-size: 0.62rem; font-weight: 800; color: var(--color-femo-ink-700); text-transform: uppercase; letter-spacing: 0.04em; }

.ts-par-child {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.5rem;
  align-items: center;
  padding: 0.55rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 0.85rem;
}
.ts-par-child-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: white;
  font-size: 0.78rem;
}
.ts-par-child-avatar--a { background: linear-gradient(135deg, #EF4438, #FB6F63); }
.ts-par-child-avatar--b { background: linear-gradient(135deg, #FAA51A, #FB6F63); }
.ts-par-child-meta { display: grid; gap: 0.2rem; min-width: 0; }
.ts-par-child-name { font-size: 0.7rem; font-weight: 700; color: var(--color-femo-ink-900); }
.ts-par-child-bar { height: 0.3rem; background: var(--color-femo-ink-100); border-radius: 999px; overflow: hidden; }
.ts-par-child-fill { height: 100%; border-radius: 999px; }
.ts-par-child-fill--good { background: linear-gradient(90deg, #10B981, #34D399); }
.ts-par-child-fill--warn { background: linear-gradient(90deg, #F59E0B, #FB6F63); }
.ts-par-child-pct { font-size: 0.72rem; font-weight: 800; }
.ts-par-child-pct--good { color: #047857; }
.ts-par-child-pct--warn { color: #B45309; }

.ts-par-warn {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.4rem;
  align-items: center;
  padding: 0.45rem 0.6rem;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 0.65rem;
  font-size: 0.62rem;
  font-weight: 600;
  color: #92400E;
  line-height: 1.35;
}

.ts-par-report {
  margin-top: auto;
  padding: 0.55rem;
  background: linear-gradient(135deg, #FFF1F0, #FFFFFF);
  border: 1px solid var(--color-femo-red-100);
  border-radius: 0.85rem;
  display: grid;
  gap: 0.3rem;
}
.ts-par-report-h { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.65rem; font-weight: 800; color: var(--color-femo-red-700); }
.ts-par-new { margin-left: auto; padding: 0.1rem 0.35rem; background: var(--gradient-hero); color: white; border-radius: 999px; font-size: 0.5rem; letter-spacing: 0.05em; }
.ts-par-report-line { font-size: 0.62rem; line-height: 1.45; color: var(--color-femo-ink-800); }
.ts-par-report-line strong { color: #047857; font-weight: 800; }

/* ─── DOTS ─────────────────────────────────────────────────────────── */
.femo-tour-dots {
  display: flex;
  gap: 0.4rem;
  justify-content: center;
  margin-top: 1.6rem;
  flex-wrap: wrap;
}
.femo-tour-dot {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-200);
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--color-femo-ink-500);
  cursor: pointer;
  transition: all 0.25s var(--ease-out-expo);
}
.femo-tour-dot:hover { transform: translateY(-2px); border-color: var(--color-femo-red-400); color: var(--color-femo-red-600); }
.femo-tour-dot.is-active {
  background: var(--gradient-hero);
  color: white;
  border-color: transparent;
  transform: scale(1.1);
  box-shadow: 0 6px 14px -4px rgba(220, 38, 38, 0.45);
}

@media (prefers-reduced-motion: reduce) {
  .ts-typing-dot,
  .ts-mast-trophy-glow { animation: none; }
}
</style>
