<script setup lang="ts">
import { useTemplateRef } from 'vue'

const steps = [
  {
    number: '01',
    icon: 'i-lucide-clipboard-list',
    title: 'Тест уровня',
    description: 'Бесплатно определяем уровень английского ребёнка — от A1 до F4. Не нужно ничего готовить.',
    detail: 'Бесплатно',
    accent: '--color-femo-coral-500',
    mockup: 'register' as const
  },
  {
    number: '02',
    icon: 'i-lucide-user-check',
    title: 'Пробный урок',
    description: 'Знакомство с учителем и британской методикой. Ребёнок сразу говорит по-английски с первой минуты.',
    detail: 'Офлайн + онлайн',
    accent: '--color-femo-red-500',
    mockup: 'diagnostic' as const
  },
  {
    number: '03',
    icon: 'i-lucide-users',
    title: 'Мини-группа',
    description: '3–6 детей одного возраста и уровня. Британская методика, метод наушников, speaking с первого урока.',
    detail: '2 раза в неделю',
    accent: '--color-femo-amber-500',
    mockup: 'capsule' as const
  },
  {
    number: '04',
    icon: 'i-lucide-trending-up',
    title: 'Результат',
    description: 'Прогресс в личном кабинете каждый месяц. Родитель видит оценки, XP и выплаты Маркета.',
    detail: 'Готовность к международным экзаменам',
    accent: '--color-femo-coral-600',
    mockup: 'progress' as const
  }
]

const containerRef = useTemplateRef<HTMLElement>('containerRef')
useScrollReveal(containerRef, { stagger: 130 })
</script>

<template>
  <section
    id="how-it-works"
    class="femo-howit"
  >
    <div
      class="femo-howit-bg"
      aria-hidden="true"
    >
      <FemoMeshBg variant="soft" />
    </div>

    <div class="femo-howit-inner">
      <header class="femo-howit-head">
        <span class="femo-chip femo-chip--ink">Как начать</span>
        <h2 class="femo-howit-title femo-display">
          Четыре шага<br>
          от звонка до <span class="femo-text-coral">британского акцента</span>
        </h2>
        <p class="femo-howit-sub">
          Простой путь без бюрократии. Определяем уровень, проводим пробный урок, зачисляем в мини-группу.
        </p>
      </header>

      <div
        ref="containerRef"
        class="femo-howit-grid"
      >
        <!-- Animated SVG connector — draws left → right when section enters viewport -->
        <svg
          class="femo-howit-line"
          viewBox="0 0 1000 4"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="howit-line-grad"
              x1="0"
              x2="1"
              y1="0"
              y2="0"
            >
              <stop
                offset="0%"
                stop-color="#FB8676"
              />
              <stop
                offset="50%"
                stop-color="#EF4438"
              />
              <stop
                offset="100%"
                stop-color="#FAA51A"
              />
            </linearGradient>
          </defs>
          <line
            x1="0"
            y1="2"
            x2="1000"
            y2="2"
            stroke="url(#howit-line-grad)"
            stroke-width="3"
            stroke-linecap="round"
            class="femo-howit-line-path"
          />
        </svg>

        <article
          v-for="step in steps"
          :key="step.number"
          class="femo-howit-step stagger-item"
        >
          <div class="femo-howit-step-head">
            <div
              class="femo-howit-step-num"
              :style="{ background: `var(${step.accent})` }"
            >
              {{ step.number }}
            </div>
          </div>

          <!-- Mini product mockup per step -->
          <div
            class="howit-mockup"
            :style="{ '--accent': `var(${step.accent})` }"
          >
            <div class="howit-mockup-bar">
              <span class="howit-mockup-dot" />
              <span class="howit-mockup-dot" />
              <span class="howit-mockup-dot" />
              <span class="howit-mockup-url">Lingaphone.kz</span>
            </div>

            <div class="howit-mockup-screen">
              <!-- 01 REGISTER -->
              <template v-if="step.mockup === 'register'">
                <div class="hm-reg-brand">
                  <span class="hm-reg-logo">A</span>
                  <span class="hm-reg-name">Lingaphone</span>
                </div>
                <p class="hm-reg-h">
                  Создай аккаунт
                </p>
                <div class="hm-reg-field">
                  <UIcon
                    name="i-lucide-user"
                    class="size-3"
                  />
                  <span>Алишер</span>
                </div>
                <div class="hm-reg-field">
                  <UIcon
                    name="i-lucide-mail"
                    class="size-3"
                  />
                  <span>parent@mail.kz</span>
                </div>
                <p class="hm-reg-label">
                  Класс ребёнка
                </p>
                <div class="hm-reg-grades">
                  <span
                    v-for="g in [1, 2, 3, 4, 5, 6]"
                    :key="g"
                    class="hm-reg-grade"
                    :class="{ 'is-pick': g === 4 }"
                  >{{ g }}</span>
                </div>
                <button
                  type="button"
                  class="hm-cta"
                >
                  Начать бесплатно
                  <UIcon
                    name="i-lucide-arrow-right"
                    class="size-3"
                  />
                </button>
              </template>

              <!-- 02 DIAGNOSTIC -->
              <template v-else-if="step.mockup === 'diagnostic'">
                <div class="hm-diag-top">
                  <span class="hm-diag-step">7 / 20</span>
                  <div class="hm-diag-hearts">
                    <span>❤️</span>
                    <span>❤️</span>
                    <span>❤️</span>
                  </div>
                </div>
                <div class="hm-diag-bar">
                  <i style="width: 35%" />
                </div>
                <div class="hm-diag-q">
                  <FemiMascot
                    state="teach"
                    size="xs"
                    silent
                    ignore-reactions
                  />
                  <p>Choose the correct form</p>
                </div>
                <div class="hm-diag-tiles">
                  <span class="hm-diag-tile is-ok">goes</span>
                  <span class="hm-diag-tile">go</span>
                  <span class="hm-diag-tile">going</span>
                  <span class="hm-diag-tile">went</span>
                </div>
                <span class="hm-diag-hint">
                  <UIcon
                    name="i-lucide-sparkles"
                    class="size-3"
                  />
                  AI подскажет, если ошибёшься
                </span>
              </template>

              <!-- 03 CAPSULE -->
              <template v-else-if="step.mockup === 'capsule'">
                <p class="hm-cap-topic">
                  Present Simple · Speaking
                </p>
                <p class="hm-cap-sub">
                  Капсула · слой 7 / 11
                </p>
                <div class="hm-cap-stepper">
                  <span
                    v-for="i in 11"
                    :key="i"
                    class="hm-cap-step"
                    :class="i < 7 ? 'is-done' : i === 7 ? 'is-active' : 'is-locked'"
                  />
                </div>
                <div class="hm-cap-now">
                  <UIcon
                    name="i-lucide-dumbbell"
                    class="size-3.5"
                  />
                  <span>Тренажёр</span>
                  <span class="hm-cap-xp">+30 XP</span>
                </div>
                <div class="hm-cap-task">
                  <p class="hm-cap-q">
                    She ___ to school.
                  </p>
                  <div class="hm-cap-opts">
                    <span class="hm-cap-opt">go</span>
                    <span class="hm-cap-opt is-pick">goes</span>
                    <span class="hm-cap-opt">going</span>
                  </div>
                </div>
                <div class="hm-cap-mascot">
                  <FemiMascot
                    state="celebrate"
                    size="xs"
                    silent
                    ignore-reactions
                  />
                  <span>Верно! Идём дальше</span>
                </div>
              </template>

              <!-- 04 PROGRESS -->
              <template v-else-if="step.mockup === 'progress'">
                <p class="hm-pr-h">
                  Прогресс Алишера
                </p>
                <div class="hm-pr-stats">
                  <div>
                    <p class="hm-pr-num">
                      87<span>%</span>
                    </p>
                    <p class="hm-pr-lbl">
                      освоено
                    </p>
                  </div>
                  <div>
                    <p class="hm-pr-num hm-pr-num--up">
                      +34<span>%</span>
                    </p>
                    <p class="hm-pr-lbl">
                      за неделю
                    </p>
                  </div>
                </div>
                <div class="hm-pr-rows">
                  <div class="hm-pr-row">
                    <span>Speaking</span>
                    <span class="hm-pr-bar"><i style="width: 92%" /></span>
                  </div>
                  <div class="hm-pr-row">
                    <span>Grammar</span>
                    <span class="hm-pr-bar"><i style="width: 70%" /></span>
                  </div>
                  <div class="hm-pr-row">
                    <span>Vocabulary</span>
                    <span class="hm-pr-bar"><i style="width: 55%" /></span>
                  </div>
                </div>
                <div class="hm-pr-report">
                  <UIcon
                    name="i-lucide-file-text"
                    class="size-3"
                  />
                  <span>AI-отчёт за неделю</span>
                  <span class="hm-pr-new">NEW</span>
                </div>
              </template>
            </div>
          </div>

          <div class="femo-howit-step-card">
            <h3 class="femo-howit-step-title">
              <UIcon
                :name="step.icon"
                class="size-4"
              />
              {{ step.title }}
            </h3>
            <p class="femo-howit-step-desc">
              {{ step.description }}
            </p>
            <span
              class="femo-howit-step-pill"
              :style="{
                color: `var(${step.accent})`,
                background: `color-mix(in oklab, var(${step.accent}) 12%, white)`,
                borderColor: `color-mix(in oklab, var(${step.accent}) 25%, transparent)`
              }"
            >
              <UIcon
                name="i-lucide-sparkles"
                class="size-3.5"
              />
              {{ step.detail }}
            </span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.femo-howit {
  position: relative;
  padding: clamp(2.5rem, 5vw, 4.5rem) 0;
  overflow: hidden;
}

.femo-howit-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.femo-howit-inner {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.25rem;
}

.femo-howit-head {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 2rem;
  display: grid;
  justify-items: center;
  gap: 0.85rem;
}

.femo-howit-title {
  font-size: clamp(1.7rem, 3.6vw, 2.7rem);
  color: var(--color-femo-ink-900);
  margin: 0;
  text-wrap: balance;
  line-height: 1.1;
}

.femo-howit-sub {
  font-size: 0.98rem;
  color: var(--color-femo-ink-600);
  line-height: 1.55;
  max-width: 560px;
}

/* Grid */
.femo-howit-grid {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 1024px) {
  .femo-howit-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 1.25rem;
    padding-top: 2.25rem;
  }
}

/* Animated SVG connector — desktop only */
.femo-howit-line { display: none; }

@media (min-width: 1024px) {
  .femo-howit-line {
    display: block;
    position: absolute;
    top: 3.4rem;
    left: 12.5%;
    right: 12.5%;
    width: 75%;
    height: 4px;
    z-index: 0;
    overflow: visible;
  }
}

.femo-howit-line-path {
  /* Draw-on animation triggered when section becomes visible */
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  filter: drop-shadow(0 2px 8px rgba(220, 38, 38, 0.25));
}

/* When useScrollReveal flips .revealed onto stagger-items, the parent grid
   animation has already fired — we trigger the line via container's intersection. */
.femo-howit-grid:has(.stagger-item.revealed) .femo-howit-line-path {
  animation: howit-draw 1.6s var(--ease-out-expo) 0.2s forwards;
}

@keyframes howit-draw {
  to { stroke-dashoffset: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .femo-howit-line-path { stroke-dashoffset: 0; animation: none; }
}

/* Step */
.femo-howit-step {
  position: relative;
  display: grid;
  gap: 1rem;
  z-index: 1;
}

.femo-howit-step-head { display: flex; justify-content: center; }

.femo-howit-step-num {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: -0.02em;
  box-shadow:
    0 0 0 4px white,
    0 0 0 6px color-mix(in oklab, currentColor 18%, transparent),
    0 12px 24px -8px color-mix(in oklab, currentColor 40%, transparent);
}

/* Mockup card (browser-style frame) */
.howit-mockup {
  --accent: var(--color-femo-red-500);
  border-radius: 1.1rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  box-shadow: 0 14px 32px -14px rgba(15, 23, 42, 0.18);
  overflow: hidden;
  transition: transform 0.45s var(--ease-out-expo), box-shadow 0.45s var(--ease-out-expo);
}

.femo-howit-step:hover .howit-mockup {
  transform: translateY(-4px);
  box-shadow:
    0 22px 40px -12px color-mix(in oklab, var(--accent) 35%, transparent),
    0 8px 18px -8px rgba(15, 23, 42, 0.18);
}

.howit-mockup-bar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem 0.6rem;
  background: linear-gradient(180deg, #F8FAFC, #F1F5F9);
  border-bottom: 1px solid var(--color-femo-ink-100);
}
.howit-mockup-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: #CBD5E1;
}
.howit-mockup-dot:nth-child(1) { background: #F87171; }
.howit-mockup-dot:nth-child(2) { background: #FACC15; }
.howit-mockup-dot:nth-child(3) { background: #34D399; }
.howit-mockup-url {
  margin-left: auto;
  margin-right: auto;
  font-size: 0.55rem;
  color: var(--color-femo-ink-500);
  font-weight: 700;
  background: var(--ui-bg-elevated);
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--color-femo-ink-100);
}

.howit-mockup-screen {
  padding: 0.7rem;
  display: grid;
  gap: 0.45rem;
  background:
    radial-gradient(60% 50% at 0% 0%, color-mix(in oklab, var(--accent) 8%, transparent), transparent 70%),
    linear-gradient(180deg, #FFFFFF 0%, #FFF7F4 100%);
  min-height: 14rem;
}

/* ─── 01 REGISTER ────────────────────────────────────────────── */
.hm-reg-brand { display: inline-flex; align-items: center; gap: 0.35rem; }
.hm-reg-logo {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 0.45rem;
  background: var(--gradient-hero);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.7rem;
  box-shadow: 0 4px 8px -2px rgba(220, 38, 38, 0.4);
}
.hm-reg-name { font-family: var(--font-display); font-weight: 800; font-size: 0.78rem; color: var(--color-femo-ink-900); }
.hm-reg-h { font-family: var(--font-display); font-weight: 800; font-size: 0.95rem; color: var(--color-femo-ink-900); margin-top: 0.1rem; }
.hm-reg-field {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.55rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 0.55rem;
  font-size: 0.7rem;
  color: var(--color-femo-ink-700);
  font-weight: 600;
}
.hm-reg-field :nth-child(1) { color: var(--color-femo-ink-400); }
.hm-reg-label { font-size: 0.6rem; color: var(--color-femo-ink-600); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
.hm-reg-grades { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.2rem; }
.hm-reg-grade {
  aspect-ratio: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 0.45rem;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.72rem;
  color: var(--color-femo-ink-700);
}
.hm-reg-grade.is-pick {
  background: var(--gradient-hero);
  color: white;
  border-color: transparent;
  box-shadow: 0 6px 14px -4px rgba(220, 38, 38, 0.5);
  transform: scale(1.05);
}

.hm-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.5rem;
  border-radius: 999px;
  background: var(--gradient-hero);
  color: white;
  border: none;
  font-size: 0.72rem;
  font-weight: 700;
  box-shadow: 0 6px 14px -4px rgba(220, 38, 38, 0.45);
  margin-top: auto;
}

/* ─── 02 DIAGNOSTIC ──────────────────────────────────────────── */
.hm-diag-top { display: flex; align-items: center; justify-content: space-between; }
.hm-diag-step { font-size: 0.68rem; font-weight: 800; color: var(--color-femo-ink-900); }
.hm-diag-hearts { display: inline-flex; gap: 0.1rem; font-size: 0.65rem; }
.hm-diag-bar { height: 0.3rem; background: var(--color-femo-ink-100); border-radius: 999px; overflow: hidden; }
.hm-diag-bar i { display: block; height: 100%; background: var(--gradient-hero); border-radius: 999px; }
.hm-diag-q { display: grid; grid-template-columns: auto 1fr; gap: 0.45rem; align-items: center; padding: 0.55rem; background: white; border: 1px solid var(--color-femo-red-100); border-radius: 0.7rem; }
.hm-diag-q p { font-size: 0.78rem; font-weight: 700; color: var(--color-femo-ink-900); }
.hm-diag-tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.3rem; }
.hm-diag-tile {
  padding: 0.5rem 0;
  background: var(--ui-bg-elevated);
  border: 1.5px solid var(--color-femo-ink-100);
  border-radius: 0.55rem;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.85rem;
  color: var(--color-femo-ink-700);
  text-align: center;
}
.hm-diag-tile.is-ok {
  background: linear-gradient(135deg, #FFF1F0, #FFE4D2);
  border-color: var(--color-femo-red-300);
  color: var(--color-femo-red-700);
  box-shadow: 0 4px 10px -4px rgba(220, 38, 38, 0.3);
}
.hm-diag-hint {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.5rem;
  background: rgba(245, 158, 11, 0.12);
  border-radius: 999px;
  font-size: 0.58rem;
  font-weight: 600;
  color: #92400E;
  margin-top: auto;
  align-self: center;
}

/* ─── 03 CAPSULE ─────────────────────────────────────────────── */
.hm-cap-topic { font-size: 0.78rem; font-weight: 800; color: var(--color-femo-ink-900); }
.hm-cap-sub { font-size: 0.62rem; color: var(--color-femo-ink-500); margin-top: -0.25rem; }
.hm-cap-stepper { display: flex; gap: 0.18rem; }
.hm-cap-step {
  flex: 1;
  height: 0.45rem;
  border-radius: 999px;
  background: var(--color-femo-ink-100);
}
.hm-cap-step.is-done { background: #10B981; }
.hm-cap-step.is-active {
  background: var(--gradient-hero);
  box-shadow: 0 0 8px rgba(220, 38, 38, 0.5);
  transform: scaleY(1.4);
}
.hm-cap-now {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.55rem;
  background: linear-gradient(135deg, #FFF1F0, #FFE4D2);
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--color-femo-red-700);
}
.hm-cap-xp { margin-left: auto; padding: 0.1rem 0.4rem; background: var(--gradient-hero); color: white; border-radius: 999px; font-size: 0.55rem; font-weight: 800; }
.hm-cap-task {
  padding: 0.55rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 0.7rem;
  display: grid;
  gap: 0.35rem;
}
.hm-cap-q { font-family: var(--font-display); font-weight: 800; font-size: 0.95rem; color: var(--color-femo-ink-900); text-align: center; }
.hm-cap-opts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.25rem; }
.hm-cap-opt {
  padding: 0.35rem 0;
  background: var(--ui-bg-elevated);
  border: 1.5px solid var(--color-femo-ink-100);
  border-radius: 0.45rem;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.7rem;
  color: var(--color-femo-ink-700);
  text-align: center;
}
.hm-cap-opt.is-pick { background: linear-gradient(135deg, #ECFDF5, #FFFFFF); border-color: #10B981; color: #047857; }
.hm-cap-mascot {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.4rem;
  align-items: center;
  padding: 0.4rem 0.5rem;
  background: linear-gradient(135deg, #ECFDF5, #FFFFFF);
  border: 1px solid #BBF7D0;
  border-radius: 0.6rem;
  font-size: 0.65rem;
  font-weight: 700;
  color: #047857;
  margin-top: auto;
}

/* ─── 04 PROGRESS ────────────────────────────────────────────── */
.hm-pr-h { font-size: 0.78rem; font-weight: 800; color: var(--color-femo-ink-900); }
.hm-pr-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; }
.hm-pr-stats > div {
  padding: 0.45rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 0.6rem;
  text-align: center;
}
.hm-pr-num { font-family: var(--font-display); font-weight: 800; font-size: 1.1rem; color: var(--color-femo-ink-900); line-height: 1; }
.hm-pr-num span { font-size: 0.6rem; color: var(--color-femo-ink-500); }
.hm-pr-num--up { color: #047857; }
.hm-pr-lbl { font-size: 0.55rem; color: var(--color-femo-ink-500); margin-top: 0.15rem; font-weight: 600; }

.hm-pr-rows { display: grid; gap: 0.3rem; }
.hm-pr-row {
  display: grid;
  grid-template-columns: 4rem 1fr;
  gap: 0.4rem;
  align-items: center;
  font-size: 0.62rem;
  color: var(--color-femo-ink-700);
  font-weight: 600;
}
.hm-pr-bar { height: 0.35rem; background: var(--color-femo-ink-100); border-radius: 999px; overflow: hidden; }
.hm-pr-bar i { display: block; height: 100%; background: linear-gradient(90deg, var(--color-femo-coral-400), var(--color-femo-red-500)); border-radius: 999px; }

.hm-pr-report {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.55rem;
  background: linear-gradient(135deg, #FFF1F0, #FFFFFF);
  border: 1px solid var(--color-femo-red-100);
  border-radius: 0.55rem;
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--color-femo-red-700);
  margin-top: auto;
}
.hm-pr-new { margin-left: auto; padding: 0.1rem 0.35rem; background: var(--gradient-hero); color: white; border-radius: 999px; font-size: 0.5rem; letter-spacing: 0.05em; }

/* Card text */
.femo-howit-step-card {
  display: grid;
  gap: 0.55rem;
  text-align: center;
  padding: 0 0.25rem;
}

.femo-howit-step-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-femo-ink-900);
  letter-spacing: -0.01em;
  margin: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.femo-howit-step-desc {
  font-size: 0.85rem;
  color: var(--color-femo-ink-600);
  line-height: 1.55;
  margin: 0;
  text-wrap: balance;
}

.femo-howit-step-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.7rem;
  border-radius: var(--radius-pill);
  font-size: 0.72rem;
  font-weight: 700;
  border: 1px solid;
  margin: 0 auto;
}
</style>
