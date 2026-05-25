<script setup lang="ts">
import { useTemplateRef } from 'vue'

const containerRef = useTemplateRef<HTMLElement>('containerRef')
useScrollReveal(containerRef, { stagger: 110 })

const tilt1 = useTemplateRef<HTMLElement>('tilt1')
const tilt2 = useTemplateRef<HTMLElement>('tilt2')
const tilt3 = useTemplateRef<HTMLElement>('tilt3')
const tilt4 = useTemplateRef<HTMLElement>('tilt4')
const tilt5 = useTemplateRef<HTMLElement>('tilt5')

useTilt(tilt1, { max: 4 })
useTilt(tilt2, { max: 4 })
useTilt(tilt3, { max: 4 })
useTilt(tilt4, { max: 4 })
useTilt(tilt5, { max: 4 })

const topics = [
  { name: 'Speaking', level: 82 },
  { name: 'Grammar', level: 45 },
  { name: 'Vocabulary', level: 68 },
  { name: 'Listening', level: 91 }
]
</script>

<template>
  <section
    id="features"
    class="femo-section"
  >
    <div class="femo-section-inner">
      <header class="femo-section-head">
        <span class="femo-chip femo-chip--ink">Возможности</span>
        <h2 class="femo-section-title femo-display">
          Всё, что нужно для<br>
          <span class="femo-text-gradient">свободного владения языком</span>
        </h2>
        <p class="femo-section-sub">
          Вместо одного учебника для всех — персональный подход, где AI и живой тренер работают в связке.
        </p>
      </header>

      <div
        ref="containerRef"
        class="femo-bento-grid"
      >
        <!-- 1. AI tutor — large -->
        <div
          ref="tilt1"
          class="femo-bento femo-bento--lg stagger-item"
        >
          <div class="femo-bento-head">
            <div class="femo-bento-icon femo-bento-icon--gradient">
              <UIcon
                name="i-lucide-bot"
                class="size-5"
              />
            </div>
            <span class="femo-chip">Доступен 24/7</span>
          </div>
          <h3 class="femo-bento-title">
            AI-тренер, который не устаёт
          </h3>
          <p class="femo-bento-text">
            Персональный помощник объясняет темы, тренирует на задачах и проверяет домашку — в любое время дня.
          </p>
          <div class="femo-bento-modes">
            <span
              v-for="m in ['Объясни тему', 'Потренируемся', 'Проверь ДЗ', 'Speaking тест', 'Любой вопрос']"
              :key="m"
            >{{ m }}</span>
          </div>
        </div>

        <!-- 2. Knowledge map -->
        <div
          ref="tilt2"
          class="femo-bento stagger-item"
        >
          <div class="femo-bento-head">
            <div class="femo-bento-icon femo-bento-icon--coral">
              <UIcon
                name="i-lucide-brain"
                class="size-5"
              />
            </div>
            <span class="femo-chip femo-chip--amber">За 20 минут</span>
          </div>
          <h3 class="femo-bento-title">
            Точная карта знаний ребёнка
          </h3>
          <p class="femo-bento-text">
            Адаптивная диагностика определяет сильные и слабые темы. Вы точно видите, где пробелы.
          </p>
          <div class="femo-bento-bars">
            <div
              v-for="t in topics"
              :key="t.name"
              class="femo-bento-bar"
            >
              <span class="femo-bento-bar-name">{{ t.name }}</span>
              <div class="femo-bento-bar-track">
                <span
                  :style="{
                    width: t.level + '%',
                    background: t.level >= 80 ? 'var(--color-success)' : t.level >= 60 ? 'var(--color-femo-amber-500)' : 'var(--color-femo-red-500)'
                  }"
                />
              </div>
              <span class="femo-bento-bar-pct">{{ t.level }}%</span>
            </div>
          </div>
        </div>

        <!-- 3. AI разбор любого формата -->
        <div
          ref="tilt3"
          class="femo-bento stagger-item"
        >
          <div class="femo-bento-head">
            <div class="femo-bento-icon femo-bento-icon--ink">
              <UIcon
                name="i-lucide-scan-text"
                class="size-5"
              />
            </div>
            <span class="femo-chip">Текст · Фото · Голос</span>
          </div>
          <h3 class="femo-bento-title">
            AI разбирает работу любого формата
          </h3>
          <p class="femo-bento-text">
            Ребёнок отправляет решение текстом, фото или голосом — AI мгновенно проверяет, находит ошибку и объясняет, как исправить.
          </p>
          <div class="femo-bento-lesson">
            <div class="femo-bento-lesson-tile" />
            <div class="femo-bento-lesson-tile femo-bento-lesson-tile--coral" />
            <div class="femo-bento-lesson-tile femo-bento-lesson-tile--ink">
              <UIcon
                name="i-lucide-pen-tool"
                class="size-4"
              />
            </div>
            <div class="femo-bento-lesson-bar">
              <UIcon
                name="i-lucide-mic"
                class="size-3.5"
              />
              <UIcon
                name="i-lucide-monitor"
                class="size-3.5"
              />
              <UIcon
                name="i-lucide-pen-tool"
                class="size-3.5"
              />
              <UIcon
                name="i-lucide-circle-dot"
                class="size-3.5 text-femo-red-500"
              />
            </div>
          </div>
        </div>

        <!-- 4. Parent control — large -->
        <div
          ref="tilt4"
          class="femo-bento femo-bento--lg stagger-item"
        >
          <div class="femo-bento-head">
            <div class="femo-bento-icon femo-bento-icon--amber">
              <UIcon
                name="i-lucide-bar-chart-3"
                class="size-5"
              />
            </div>
            <span class="femo-chip">Еженедельно</span>
          </div>
          <h3 class="femo-bento-title">
            Вы видите прогресс каждую неделю
          </h3>
          <p class="femo-bento-text">
            Автоматические отчёты, карта знаний и уведомления о снижении активности. Без расспросов — всё в личном кабинете.
          </p>
          <div class="femo-bento-alerts">
            <div class="femo-bento-alert femo-bento-alert--success">
              <UIcon
                name="i-lucide-trending-up"
                class="size-4"
              />
              <span>Grammar: <b>+15%</b> за неделю</span>
            </div>
            <div class="femo-bento-alert femo-bento-alert--warn">
              <UIcon
                name="i-lucide-bell"
                class="size-4"
              />
              <span>Следующий урок: <b>завтра, 16:00</b></span>
            </div>
            <div class="femo-bento-alert femo-bento-alert--brand">
              <UIcon
                name="i-lucide-flame"
                class="size-4"
              />
              <span>Streak: <b>14 дней</b> подряд</span>
            </div>
          </div>
        </div>

        <!-- 5. Gamification — wide -->
        <div
          ref="tilt5"
          class="femo-bento femo-bento--wide stagger-item"
        >
          <div class="femo-bento-game">
            <div>
              <div class="femo-bento-head">
                <div class="femo-bento-icon femo-bento-icon--gradient">
                  <UIcon
                    name="i-lucide-trophy"
                    class="size-5"
                  />
                </div>
                <span class="femo-chip femo-chip--amber">Геймификация</span>
              </div>
              <h3 class="femo-bento-title">
                Учиться — как играть
              </h3>
              <p class="femo-bento-text">
                XP, уровни, streak, бейджи и квесты. Ребёнок возвращается каждый день не из-под палки, а потому что интересно.
              </p>
            </div>
            <div class="femo-bento-game-tiles">
              <div class="femo-bento-game-tile">
                <UIcon
                  name="i-lucide-zap"
                  class="size-5 text-femo-amber-600"
                />
                <p>2 450 XP</p>
                <span>за неделю</span>
              </div>
              <div class="femo-bento-game-tile">
                <UIcon
                  name="i-lucide-flame"
                  class="size-5 text-femo-coral-600"
                />
                <p>15 дней</p>
                <span>streak</span>
              </div>
              <div class="femo-bento-game-tile">
                <UIcon
                  name="i-lucide-medal"
                  class="size-5 text-femo-red-600"
                />
                <p>12 бейджей</p>
                <span>получено</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ---------- Bento grid ---------- */
.femo-bento-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1.25rem;
}

.femo-bento { grid-column: span 6; min-height: 280px; }
.femo-bento--lg   { grid-column: span 6; }
.femo-bento--wide { grid-column: span 6; }

@media (min-width: 768px) {
  .femo-bento { grid-column: span 3; }
  .femo-bento--lg { grid-column: span 4; min-height: 340px; }
  .femo-bento--wide { grid-column: span 6; }
  /* Pattern: 4-2 / 2-4 / 6 */
  .femo-bento-grid > .femo-bento:nth-child(2) { grid-column: span 2; }
  .femo-bento-grid > .femo-bento:nth-child(3) { grid-column: span 2; }
  .femo-bento-grid > .femo-bento:nth-child(4) { grid-column: span 4; }
  .femo-bento-grid > .femo-bento:nth-child(5) { grid-column: span 6; }
}

@media (min-width: 1024px) {
  .femo-bento-grid > .femo-bento:nth-child(2) { grid-column: span 2; }
  .femo-bento-grid > .femo-bento:nth-child(3) { grid-column: span 2; }
}

/* ---------- Bento card internals ---------- */
.femo-bento-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.femo-bento-icon {
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 0.85rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-femo-red-700);
  background: var(--color-femo-red-50);
  transition: transform 0.4s var(--ease-out-expo);
}

.femo-bento:hover .femo-bento-icon { transform: scale(1.08) rotate(-4deg); }

.femo-bento-icon--gradient { color: white; background: var(--gradient-hero); box-shadow: 0 8px 18px -6px rgba(220, 38, 38, 0.45); }
.femo-bento-icon--coral    { color: var(--color-femo-coral-700); background: var(--color-femo-coral-50); }
.femo-bento-icon--amber    { color: var(--color-femo-amber-700); background: var(--color-femo-amber-50); }
.femo-bento-icon--ink      { color: var(--color-femo-ink-800);   background: var(--color-femo-ink-50); }

.femo-bento-title {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-femo-ink-900);
  margin-bottom: 0.55rem;
}

.femo-bento-text {
  color: var(--color-femo-ink-600);
  font-size: 0.95rem;
  line-height: 1.55;
  margin-bottom: 1.25rem;
}

.femo-bento-modes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.femo-bento-modes span {
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-pill);
  background: var(--color-femo-ink-50);
  border: 1px solid var(--color-femo-ink-100);
  color: var(--color-femo-ink-800);
  font-size: 0.78rem;
  font-weight: 600;
  transition: all 0.3s var(--ease-out-expo);
}

.femo-bento:hover .femo-bento-modes span:nth-child(odd) {
  background: var(--color-femo-red-50);
  color: var(--color-femo-red-700);
  border-color: var(--color-femo-red-100);
}

/* Knowledge bars */
.femo-bento-bars { display: grid; gap: 0.55rem; }
.femo-bento-bar { display: grid; grid-template-columns: minmax(90px, 1fr) 1fr 36px; align-items: center; gap: 0.65rem; }
.femo-bento-bar-name { font-size: 0.78rem; color: var(--color-femo-ink-600); }
.femo-bento-bar-track { height: 6px; border-radius: var(--radius-pill); background: var(--color-femo-ink-100); overflow: hidden; }
.femo-bento-bar-track > span { display: block; height: 100%; border-radius: inherit; transition: width 0.8s var(--ease-out-expo); }
.femo-bento-bar-pct { text-align: right; font-size: 0.78rem; font-weight: 600; color: var(--color-femo-ink-800); }

/* Lesson tiles */
.femo-bento-lesson {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  background: var(--color-femo-ink-50);
  border-radius: 1rem;
  padding: 0.5rem 0.5rem 1.6rem;
  overflow: hidden;
}

.femo-bento-lesson-tile {
  height: 70px;
  border-radius: 0.7rem;
  background: linear-gradient(135deg, #FFE0DD, #FFC2BC);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-femo-ink-700);
}

.femo-bento-lesson-tile--coral { background: linear-gradient(135deg, #FFE4D2, #FFC8A6); }
.femo-bento-lesson-tile--ink   { background: linear-gradient(135deg, #FFFFFF, #EFEAE8); border: 1px dashed var(--color-femo-ink-200); }

.femo-bento-lesson-bar {
  position: absolute;
  inset: auto 0.5rem 0.5rem;
  height: 1.6rem;
  border-radius: var(--radius-pill);
  background: var(--ui-bg-elevated);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  color: var(--color-femo-ink-600);
  border: 1px solid var(--color-femo-ink-100);
}

/* Alert rows */
.femo-bento-alerts { display: grid; gap: 0.55rem; }
.femo-bento-alert {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.85rem;
  border-radius: 0.85rem;
  font-size: 0.85rem;
  border: 1px solid transparent;
}

.femo-bento-alert--success { background: rgba(22, 163, 74, 0.08); border-color: rgba(22, 163, 74, 0.18); color: #15803D; }
.femo-bento-alert--warn    { background: rgba(250, 165, 26, 0.08); border-color: rgba(250, 165, 26, 0.18); color: #B45309; }
.femo-bento-alert--brand   { background: var(--color-femo-red-50); border-color: var(--color-femo-red-100); color: var(--color-femo-red-700); }

/* Game wide */
.femo-bento-game { display: grid; grid-template-columns: 1fr; gap: 1.25rem; align-items: center; }
@media (min-width: 768px) { .femo-bento-game { grid-template-columns: 1fr 1.25fr; gap: 2rem; } }

.femo-bento-game-tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; }
.femo-bento-game-tile {
  background: linear-gradient(180deg, #FFFAF6, #FFF1E8);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 1rem;
  padding: 1rem;
  text-align: left;
  transition: transform 0.4s var(--ease-out-expo);
}
.femo-bento-game-tile:hover { transform: translateY(-3px); }
.femo-bento-game-tile p { font-family: var(--font-display); font-weight: 800; font-size: 1.15rem; color: var(--color-femo-ink-900); margin-top: 0.5rem; }
.femo-bento-game-tile span { font-size: 0.75rem; color: var(--color-femo-ink-500); }
</style>
