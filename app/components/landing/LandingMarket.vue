<script setup lang="ts">
// Маркет достижений — уникальная фишка Lingaphone
// Ежемесячный рейтинг по средней оценке → реальные деньги

const medals = [
  {
    rank: 1,
    emoji: '🥇',
    label: 'Золото',
    avg: 'avg ≥ 4.6',
    amount: '5 000₸',
    color: '#D97706',
    bg: 'linear-gradient(135deg, #FFEDC9, #FFD98A)',
    border: 'rgba(217, 119, 6, 0.3)'
  },
  {
    rank: 2,
    emoji: '🥈',
    label: 'Серебро',
    avg: 'avg ≥ 4.0',
    amount: '3 000₸',
    color: '#64748B',
    bg: 'linear-gradient(135deg, #F8FAFC, #E2E8F0)',
    border: 'rgba(100, 116, 139, 0.3)'
  },
  {
    rank: 3,
    emoji: '🥉',
    label: 'Бронза',
    avg: 'avg ≥ 3.6',
    amount: '1 000₸',
    color: '#C2410C',
    bg: 'linear-gradient(135deg, #FFF7ED, #FED7AA)',
    border: 'rgba(194, 65, 12, 0.25)'
  }
]

const bonuses = [
  { months: 3, extra: '+ 5 000₸', label: '3 золота подряд', icon: '🔥' },
  { months: 6, extra: '+ 10 000₸', label: '6 золот подряд', icon: '⚡' },
  { months: 9, extra: '+ 15 000₸', label: '9 золот подряд', icon: '💎' }
]

// Animated total counter
const { displayValue, counterRef } = useAnimatedCounter(5000000, 1800)

const sectionRef = useTemplateRef<HTMLElement>('sectionRef')
useScrollReveal(sectionRef, { stagger: 70 })

// Live feed of recent Market wins
const feed = [
  { name: 'Айгерим А.', medal: '🥇', amount: '5 000₸', month: 'май' },
  { name: 'Данияр М.', medal: '🥈', amount: '3 000₸', month: 'май' },
  { name: 'Амина Б.', medal: '🥇', amount: '5 000₸', month: 'апрель' },
  { name: 'Жанна К.', medal: '🥉', amount: '1 000₸', month: 'апрель' },
  { name: 'Темирлан С.', medal: '🥇', amount: '5 000₸ + бонус', month: 'март' }
]
</script>

<template>
  <section
    id="market"
    ref="sectionRef"
    class="femo-section lm-section"
  >
    <div class="femo-section-inner">
      <!-- Header -->
      <header class="femo-section-head stagger-item">
        <span class="femo-chip">Маркет достижений · только у нас</span>
        <h2 class="femo-section-title femo-display">
          Дети зарабатывают<br>
          <span class="femo-text-gradient">настоящие деньги</span>
        </h2>
        <p class="femo-section-sub">
          Каждый месяц ученики Lingaphone получают выплаты за высокие оценки на уроках.
          Ваша гордость — их первая зарплата.
        </p>
      </header>

      <div class="lm-layout stagger-item">
        <!-- Left: Medal table -->
        <div class="lm-medals">
          <h3 class="lm-medals-title">
            Ежемесячный рейтинг
          </h3>
          <div class="lm-medals-grid">
            <div
              v-for="m in medals"
              :key="m.rank"
              class="lm-medal-card"
              :style="{ background: m.bg, borderColor: m.border }"
            >
              <span class="lm-medal-emoji">{{ m.emoji }}</span>
              <div class="lm-medal-info">
                <p
                  class="lm-medal-label"
                  :style="{ color: m.color }"
                >
                  {{ m.label }}
                </p>
                <p class="lm-medal-avg">
                  {{ m.avg }}
                </p>
              </div>
              <p
                class="lm-medal-amount"
                :style="{ color: m.color }"
              >
                {{ m.amount }}
              </p>
            </div>
          </div>

          <!-- Cumulative bonuses -->
          <div class="lm-bonuses">
            <p class="lm-bonuses-title">
              Накопительные бонусы за подряд 🥇
            </p>
            <div class="lm-bonuses-row">
              <div
                v-for="b in bonuses"
                :key="b.months"
                class="lm-bonus-chip"
              >
                <span class="lm-bonus-icon">{{ b.icon }}</span>
                <div>
                  <p class="lm-bonus-extra">
                    {{ b.extra }}
                  </p>
                  <p class="lm-bonus-label">
                    {{ b.label }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Big counter + live feed -->
        <div class="lm-right">
          <!-- Total paid counter -->
          <div
            ref="counterRef"
            class="lm-counter-block"
          >
            <p class="lm-counter-label">
              Всего выплачено ученикам
            </p>
            <p class="lm-counter-value femo-display femo-text-gradient">
              {{ displayValue }}₸
            </p>
            <p class="lm-counter-sub">
              с момента запуска Маркета
            </p>
          </div>

          <!-- Live feed -->
          <div class="lm-feed">
            <p class="lm-feed-title">
              Последние выплаты
            </p>
            <ul class="lm-feed-list">
              <li
                v-for="f in feed"
                :key="f.name"
                class="lm-feed-item"
              >
                <span class="lm-feed-medal">{{ f.medal }}</span>
                <div class="lm-feed-info">
                  <p class="lm-feed-name">
                    {{ f.name }}
                  </p>
                  <p class="lm-feed-month">
                    {{ f.month }}
                  </p>
                </div>
                <span class="lm-feed-amount">{{ f.amount }}</span>
              </li>
            </ul>
          </div>

          <!-- Slogan -->
          <p class="lm-slogan">
            "Ваша гордость — их первая зарплата"
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lm-section {
  padding-block: clamp(4rem, 8vw, 7rem);
  background: linear-gradient(180deg, transparent, rgba(14, 165, 233, 0.04) 50%, transparent);
}

/* ── Layout ── */
.lm-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
  margin-top: 3rem;
}

@media (min-width: 900px) {
  .lm-layout { grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start; }
}

/* ── Medals ── */
.lm-medals-title {
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-femo-ink-800);
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.8rem;
}

.lm-medals-grid {
  display: grid;
  gap: 0.85rem;
}

.lm-medal-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  border-radius: var(--radius-card-lg);
  border: 1.5px solid transparent;
  box-shadow: var(--shadow-soft);
}

.lm-medal-emoji { font-size: 2rem; line-height: 1; }

.lm-medal-label {
  font-weight: 800;
  font-size: 1rem;
  line-height: 1.2;
}

.lm-medal-avg {
  font-size: 0.8rem;
  color: var(--color-femo-ink-500);
  margin-top: 0.1rem;
}

.lm-medal-amount {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.25rem;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

/* ── Bonuses ── */
.lm-bonuses {
  margin-top: 1.5rem;
  padding: 1.25rem;
  border-radius: var(--radius-card-lg);
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
}

.lm-bonuses-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-femo-ink-700);
  margin-bottom: 0.85rem;
}

.lm-bonuses-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.65rem;
}

.lm-bonus-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.85rem 0.5rem;
  border-radius: 0.85rem;
  background: linear-gradient(135deg, #FFEDC9, #FFF7E6);
  border: 1px solid rgba(217, 119, 6, 0.2);
  text-align: center;
}

.lm-bonus-icon { font-size: 1.4rem; }
.lm-bonus-extra { font-weight: 800; font-size: 0.8rem; color: #92400E; }
.lm-bonus-label { font-size: 0.65rem; color: var(--color-femo-ink-600); margin-top: 0.1rem; }

/* ── Right column ── */
.lm-right { display: grid; gap: 1.5rem; }

/* Counter block */
.lm-counter-block {
  text-align: center;
  padding: 2.5rem 2rem;
  border-radius: var(--radius-card-lg);
  background: linear-gradient(135deg, #E0F2FE, #BAE6FD 50%, #E0F2FE);
  border: 1px solid rgba(14, 165, 233, 0.25);
  box-shadow: 0 20px 40px -12px rgba(14, 165, 233, 0.2);
}

.lm-counter-label {
  font-size: 0.84rem;
  font-weight: 600;
  color: #0369A1;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
}

.lm-counter-value {
  font-size: clamp(2rem, 5vw, 3.25rem);
  line-height: 1;
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.lm-counter-sub {
  font-size: 0.8rem;
  color: #0369A1;
  margin-top: 0.5rem;
}

/* Feed */
.lm-feed {
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: var(--radius-card-lg);
  padding: 1.25rem;
}

.lm-feed-title {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-femo-ink-500);
  margin-bottom: 0.85rem;
}

.lm-feed-list { display: grid; gap: 0.5rem; }

.lm-feed-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  border-radius: 0.75rem;
  background: var(--color-femo-ink-50);
}

.lm-feed-medal { font-size: 1.3rem; }

.lm-feed-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--color-femo-ink-900);
}

.lm-feed-month {
  font-size: 0.72rem;
  color: var(--color-femo-ink-500);
}

.lm-feed-amount {
  font-weight: 800;
  font-size: 0.85rem;
  color: #0369A1;
  white-space: nowrap;
}

/* Slogan */
.lm-slogan {
  text-align: center;
  font-style: italic;
  font-size: 1rem;
  color: var(--color-femo-ink-600);
  padding: 1rem;
  border-top: 1px solid var(--color-femo-ink-100);
}
</style>
