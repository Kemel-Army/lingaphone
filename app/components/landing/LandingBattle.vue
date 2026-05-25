<script setup lang="ts">
const features = [
  { icon: '📺', title: 'На доске', text: 'Учитель открывает игру на проекторе с QR-кодом' },
  { icon: '📱', title: 'У детей', text: 'Сканируют QR — играют на телефоне без регистрации' },
  { icon: '⚡', title: 'Реалтайм', text: 'Ответы и лидерборд обновляются мгновенно' },
  { icon: '🏆', title: 'Азарт', text: 'Очки за скорость, медали, корона чемпиона' }
]

const grades = [
  { num: 1, label: '1 класс', emoji: '🌱', soon: true },
  { num: 2, label: '2 класс', emoji: '🌿', soon: true },
  { num: 3, label: '3 класс', emoji: '🌳', soon: false },
  { num: 4, label: '4 класс', emoji: '⛰️', soon: false },
  { num: 5, label: '5 класс', emoji: '🌋', soon: false },
  { num: 6, label: '6 класс', emoji: '🚀', soon: true }
]
</script>

<template>
  <section
    id="battle"
    class="lb"
  >
    <!-- Animated background blobs -->
    <div
      class="lb-bg"
      aria-hidden="true"
    >
      <div class="lb-bg-blob lb-bg-blob--a" />
      <div class="lb-bg-blob lb-bg-blob--b" />
      <div class="lb-bg-blob lb-bg-blob--c" />
    </div>

    <div class="lb-inner">
      <header class="lb-head">
        <span class="lb-badge">
          <span class="lb-badge-dot" />
          NEW · Lingaphone Battle
        </span>
        <h2 class="lb-title">
          Превратите урок в&nbsp;<span class="lb-title-accent">языковой шоу-баттл</span>
        </h2>
        <p class="lb-subtitle">
          Kahoot-like игра прямо в&nbsp;классе. Учитель ведёт с&nbsp;проектора —
          дети играют со&nbsp;смартфонов. Без регистрации, по&nbsp;PIN-коду.
        </p>
      </header>

      <!-- Hero mockup: laptop + phone side by side -->
      <div class="lb-mockup">
        <!-- Big-screen mockup -->
        <div class="lb-screen">
          <div class="lb-screen-bezel">
            <div class="lb-screen-content">
              <div class="lb-screen-fox">
                🦊
              </div>
              <div class="lb-screen-pin">
                <span class="lb-screen-pin-label">PIN</span>
                <span class="lb-screen-pin-num">428 193</span>
              </div>
              <div class="lb-screen-qr">
                <div class="lb-screen-qr-grid">
                  <span
                    v-for="i in 64"
                    :key="i"
                    :class="['lb-qr-px', i % 3 === 0 ? 'lb-qr-px--on' : '']"
                  />
                </div>
                <div class="lb-screen-qr-fox">
                  🦊
                </div>
              </div>
              <div class="lb-screen-players">
                <span class="lb-player-chip lb-player-chip--orange">🦊 Аяна</span>
                <span class="lb-player-chip lb-player-chip--purple">🐱 Алихан</span>
                <span class="lb-player-chip lb-player-chip--blue">🚀 Дамир</span>
                <span class="lb-player-chip lb-player-chip--pink">🐰 Жадыра</span>
                <span class="lb-player-chip lb-player-chip--green">🐲 Нурсултан</span>
                <span class="lb-player-chip lb-player-chip--yellow">⭐ Камила</span>
              </div>
            </div>
          </div>
          <div class="lb-screen-stand" />
        </div>

        <!-- Phone mockup -->
        <div class="lb-phone">
          <div class="lb-phone-bezel">
            <div class="lb-phone-content">
              <div class="lb-phone-header">
                <span>Аяна</span>
                <span>↑ доска</span>
              </div>
              <div class="lb-phone-tiles">
                <div class="lb-phone-tile lb-phone-tile--red">
                  🔺
                </div>
                <div class="lb-phone-tile lb-phone-tile--blue">
                  🔷
                </div>
                <div class="lb-phone-tile lb-phone-tile--orange">
                  ⭐
                </div>
                <div class="lb-phone-tile lb-phone-tile--green">
                  🟢
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature grid -->
      <div class="lb-features">
        <div
          v-for="(f, i) in features"
          :key="i"
          class="lb-feature"
        >
          <span class="lb-feature-emoji">{{ f.icon }}</span>
          <strong>{{ f.title }}</strong>
          <p>{{ f.text }}</p>
        </div>
      </div>

      <!-- Grade strip -->
      <div class="lb-grades">
        <span class="lb-grades-label">Классы 1–6, под каждый — свои вопросы:</span>
        <div class="lb-grades-list">
          <span
            v-for="g in grades"
            :key="g.num"
            class="lb-grade-pill"
            :class="{ 'lb-grade-pill--soon': g.soon }"
          >
            <span class="lb-grade-pill-emoji">{{ g.emoji }}</span>
            <span>{{ g.label }}</span>
            <span
              v-if="g.soon"
              class="lb-grade-pill-tag"
            >скоро</span>
          </span>
        </div>
      </div>

      <!-- CTAs -->
      <div class="lb-cta">
        <NuxtLink
          to="/battle/host/new"
          class="lb-cta-primary"
        >
          🎮 Запустить игру в&nbsp;классе
          <span class="lb-cta-arrow">→</span>
        </NuxtLink>
        <NuxtLink
          to="/play"
          class="lb-cta-ghost"
        >
          📱 Я ученик — у&nbsp;меня PIN
        </NuxtLink>
      </div>

      <p class="lb-note">
        💡 Бесплатно. Без регистрации. Учителю достаточно проектора и&nbsp;Wi-Fi.
      </p>
    </div>
  </section>
</template>

<style scoped>
.lb {
  position: relative;
  margin-top: 6rem;
  padding: 5rem 1.25rem 6rem;
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(70% 50% at 50% 0%, rgba(255, 217, 138, 0.45), transparent 60%),
    linear-gradient(180deg, #FFF4ED 0%, #FFE4D2 50%, #FFC8A6 100%);
  border-radius: 3rem 3rem 0 0;
}

.lb-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.lb-bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.55;
  animation: lb-blob 14s ease-in-out infinite;
}
.lb-bg-blob--a {
  width: 380px;
  height: 380px;
  top: 5%;
  left: -8%;
  background: radial-gradient(circle, #EF4438, transparent 70%);
}
.lb-bg-blob--b {
  width: 460px;
  height: 460px;
  top: 20%;
  right: -10%;
  background: radial-gradient(circle, #FAA51A, transparent 70%);
  animation-delay: -5s;
}
.lb-bg-blob--c {
  width: 320px;
  height: 320px;
  bottom: 5%;
  left: 30%;
  background: radial-gradient(circle, #FB6F63, transparent 70%);
  animation-delay: -8s;
}

@keyframes lb-blob {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(20px, -30px) scale(1.05); }
}

.lb-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  gap: 3rem;
}

/* ───────────────── Header ───────────────── */
.lb-head {
  text-align: center;
  display: grid;
  gap: 1rem;
  justify-items: center;
}

.lb-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem;
  background: linear-gradient(135deg, #B41B1B, #631010);
  color: #fff;
  border-radius: 999px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: 0 8px 22px rgba(180, 27, 27, 0.45);
}
.lb-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #FAA51A;
  box-shadow: 0 0 12px #FAA51A;
  animation: lb-blink 1.5s ease-in-out infinite;
}
@keyframes lb-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
}

.lb-title {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(2rem, 5vw, 3.6rem);
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--color-femo-ink-900);
  max-width: 900px;
}
.lb-title-accent {
  background: linear-gradient(135deg, #EF4438, #FAA51A);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}

.lb-subtitle {
  font-size: clamp(1.05rem, 2vw, 1.25rem);
  color: var(--color-femo-ink-700);
  font-weight: 500;
  line-height: 1.5;
  max-width: 720px;
}

/* ───────────────── Mockup ───────────────── */
.lb-mockup {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  align-items: center;
  justify-items: center;
}
@media (min-width: 768px) {
  .lb-mockup {
    grid-template-columns: 2fr 1fr;
    gap: 0;
  }
}

.lb-screen {
  width: 100%;
  max-width: 720px;
  display: grid;
  justify-items: center;
}

.lb-screen-bezel {
  width: 100%;
  background: #1a0606;
  padding: 14px;
  border-radius: 1.4rem;
  box-shadow:
    0 30px 80px rgba(180, 27, 27, 0.35),
    0 12px 30px rgba(0, 0, 0, 0.18);
  position: relative;
}
.lb-screen-bezel::before {
  content: '';
  position: absolute;
  top: 5px; left: 50%;
  transform: translateX(-50%);
  width: 50px; height: 4px;
  background: #2D0F0F;
  border-radius: 0 0 6px 6px;
}

.lb-screen-content {
  background:
    radial-gradient(50% 30% at 50% 0%, #FFD98A 0%, transparent 60%),
    linear-gradient(180deg, #FFE4D2 0%, #FB6F63 65%, #B41B1B 100%);
  border-radius: 0.85rem;
  padding: 1.5rem 1.5rem 1.25rem;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    "fox  qr"
    "pin  qr"
    "players players";
  gap: 0.85rem;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.lb-screen-fox { grid-area: fox; font-size: 2.4rem; line-height: 1; }

.lb-screen-pin {
  grid-area: pin;
  display: grid;
  gap: 0.2rem;
  padding: 0.7rem 1rem;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 0.7rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  width: fit-content;
}
.lb-screen-pin-label {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  opacity: 0.85;
}
.lb-screen-pin-num {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.6rem;
  color: #FFD98A;
  letter-spacing: 0.1em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.lb-screen-qr {
  grid-area: qr;
  position: relative;
  width: 110px;
  height: 110px;
  background: #fff;
  border-radius: 0.6rem;
  padding: 8px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3);
  align-self: start;
}
.lb-screen-qr-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 1px;
  width: 100%;
  height: 100%;
}
.lb-qr-px {
  background: #FFE4D2;
  border-radius: 1px;
}
.lb-qr-px--on {
  background: #2D0F0F;
}
.lb-screen-qr-fox {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.3rem;
  background: #fff;
  border-radius: 50%;
  width: 1.8rem;
  height: 1.8rem;
  display: grid;
  place-items: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.lb-screen-players {
  grid-area: players;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.lb-player-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.6rem;
  background: rgba(255, 255, 255, 0.95);
  color: #2D0F0F;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  border-left: 3px solid;
}
.lb-player-chip--orange { border-color: #F97316; }
.lb-player-chip--purple { border-color: #A855F7; }
.lb-player-chip--blue { border-color: #0EA5E9; }
.lb-player-chip--pink { border-color: #EC4899; }
.lb-player-chip--green { border-color: #10B981; }
.lb-player-chip--yellow { border-color: #FACC15; }

.lb-screen-stand {
  width: 70px;
  height: 8px;
  background: #1a0606;
  border-radius: 0 0 4px 4px;
  margin-top: -1px;
}

/* Phone mockup */
.lb-phone {
  position: relative;
  z-index: 2;
  width: 200px;
}
@media (min-width: 768px) {
  .lb-phone {
    margin-left: -2rem;
    transform: rotate(-5deg);
  }
}

.lb-phone-bezel {
  background: #1a0606;
  padding: 12px 8px;
  border-radius: 2rem;
  box-shadow:
    0 30px 60px rgba(180, 27, 27, 0.4),
    0 0 0 3px #631010;
  position: relative;
}
.lb-phone-bezel::before {
  content: '';
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 5px;
  background: #2D0F0F;
  border-radius: 6px;
}

.lb-phone-content {
  background:
    radial-gradient(50% 30% at 50% 0%, #FFD98A 0%, transparent 60%),
    linear-gradient(180deg, #FB6F63, #B41B1B, #631010);
  border-radius: 1.1rem;
  padding: 1.5rem 0.7rem 0.85rem;
  height: 320px;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 0.5rem;
}

.lb-phone-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
  padding: 0 0.3rem;
}

.lb-phone-tiles {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 0.4rem;
}
.lb-phone-tile {
  display: grid;
  place-items: center;
  font-size: 1.6rem;
  border-radius: 0.7rem;
  border: 3px solid;
  box-shadow: inset 0 4px 0 rgba(255, 255, 255, 0.2);
}
.lb-phone-tile--red    { background: #EF4438; border-color: #B41B1B; }
.lb-phone-tile--blue   { background: #0EA5E9; border-color: #0369A1; }
.lb-phone-tile--orange { background: #FAA51A; border-color: #B45309; }
.lb-phone-tile--green  { background: #10B981; border-color: #047857; }

/* ───────────────── Features ───────────────── */
.lb-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.lb-feature {
  padding: 1.5rem 1.4rem;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 1.4rem;
  display: grid;
  gap: 0.4rem;
  text-align: left;
  box-shadow: 0 8px 22px rgba(220, 38, 38, 0.08);
  transition: transform 0.3s var(--ease-out-expo);
}
.lb-feature:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 36px rgba(220, 38, 38, 0.16);
}

.lb-feature-emoji {
  font-size: 2rem;
  line-height: 1;
}

.lb-feature strong {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.1rem;
  color: var(--color-femo-ink-900);
  letter-spacing: -0.01em;
}

.lb-feature p {
  font-size: 0.92rem;
  color: var(--color-femo-ink-700);
  line-height: 1.45;
}

/* ───────────────── Grades ───────────────── */
.lb-grades {
  display: grid;
  gap: 0.9rem;
  text-align: center;
}

.lb-grades-label {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-femo-ink-700);
}

.lb-grades-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.lb-grade-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1rem;
  background: #fff;
  border: 2px solid var(--color-femo-red-200);
  border-radius: 999px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-femo-ink-900);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);
}
.lb-grade-pill-emoji { font-size: 1.2rem; }

.lb-grade-pill--soon {
  opacity: 0.55;
  filter: grayscale(0.4);
}

.lb-grade-pill-tag {
  margin-left: 0.3rem;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--color-femo-ink-300);
  color: #fff;
  padding: 1px 6px;
  border-radius: 999px;
}

/* ───────────────── CTAs ───────────────── */
.lb-cta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}

.lb-cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1.05rem 2rem;
  background: linear-gradient(135deg, #EF4438, #FAA51A);
  color: #fff;
  text-decoration: none;
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 900;
  border-radius: 999px;
  box-shadow:
    0 16px 36px rgba(239, 68, 56, 0.45),
    inset 0 2px 0 rgba(255, 255, 255, 0.3);
  transition: transform 0.25s var(--ease-out-back);
  border: 2px solid rgba(255, 255, 255, 0.5);
}
.lb-cta-primary:hover {
  transform: translateY(-3px) scale(1.03);
}
.lb-cta-arrow {
  font-size: 1.3rem;
  transition: transform 0.3s var(--ease-out-back);
}
.lb-cta-primary:hover .lb-cta-arrow {
  transform: translateX(4px);
}

.lb-cta-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.6rem;
  background: rgba(255, 255, 255, 0.85);
  color: var(--color-femo-red-700);
  text-decoration: none;
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 800;
  border-radius: 999px;
  border: 2px solid var(--color-femo-red-200);
  transition: all 0.25s var(--ease-out-expo);
}
.lb-cta-ghost:hover {
  background: #fff;
  border-color: var(--color-femo-red-400);
}

.lb-note {
  text-align: center;
  font-size: 0.95rem;
  color: var(--color-femo-ink-600);
  font-weight: 500;
}

@media (prefers-reduced-motion: reduce) {
  .lb-bg-blob,
  .lb-badge-dot { animation: none; }
}
</style>
