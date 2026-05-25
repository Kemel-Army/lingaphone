<script setup lang="ts">
import { useTemplateRef } from 'vue'

const containerRef = useTemplateRef<HTMLElement>('containerRef')
useScrollReveal(containerRef, { stagger: 60 })

// Achievements row (8 badges to fill 4×2 grid)
const achievements = [
  { icon: 'i-lucide-flame', tier: 'gold' as const, label: 'Streak 30' },
  { icon: 'i-lucide-mic', tier: 'silver' as const, label: 'Speaking' },
  { icon: 'i-lucide-headphones', tier: 'bronze' as const, label: 'Произношение' },
  { icon: 'i-lucide-graduation-cap', tier: 'gold' as const, label: 'A2 уровень' },
  { icon: 'i-lucide-medal', tier: 'silver' as const, label: 'Маркет 🥇' },
  { icon: 'i-lucide-rocket', tier: 'gold' as const, label: 'Уровень 10' },
  { icon: 'i-lucide-book-open', tier: 'bronze' as const, label: '500 слов' },
  { icon: 'i-lucide-lock', tier: 'locked' as const, label: 'Заперт' }
]

const quests = [
  { label: 'Слушать аудио урок', xp: 20, done: true },
  { label: 'Диалог с учителем', xp: 40, done: true },
  { label: 'Написать 5 предложений', xp: 30, done: false }
]

const shopItems = [
  { icon: '🎩', cost: 120, owned: true },
  { icon: '👓', cost: 80, owned: true },
  { icon: '🎒', cost: 200, owned: false },
  { icon: '⚔️', cost: 350, owned: false }
]

// RPG path — 6 nodes
const pathNodes = [
  { state: 'done', icon: 'i-lucide-check' },
  { state: 'done', icon: 'i-lucide-check' },
  { state: 'done', icon: 'i-lucide-check' },
  { state: 'active', icon: 'i-lucide-star' },
  { state: 'locked', icon: 'i-lucide-lock' },
  { state: 'locked', icon: 'i-lucide-trophy' }
] as const

const mascotStates = ['celebrate', 'wink', 'proud', 'dance', 'think', 'trophy'] as const

// Live activity feed — animated marquee
const liveFeed = [
  { who: 'Айгерим', icon: 'i-lucide-book-open', text: 'выучила 50 слов', xp: '+200' },
  { who: 'Данияр', icon: 'i-lucide-flame', text: 'streak 21 день!', xp: '🔥' },
  { who: 'Амина', icon: 'i-lucide-trophy', text: 'получила 5 000₸ 🥇', xp: '+150' },
  { who: 'Темирлан', icon: 'i-lucide-mic', text: 'perfect pronunciation', xp: '+100' },
  { who: 'Жанна', icon: 'i-lucide-star', text: 'уровень S3 достигнут', xp: '+150' }
]
</script>

<template>
  <section
    id="gamification"
    class="femo-gam"
  >
    <FemoMeshBg
      variant="soft"
      class="femo-gam-bg"
    />
    <div class="femo-section-inner">
      <header class="femo-gam-head">
        <span class="femo-chip">Геймификация · XP, Streak, Маркет</span>
        <h2 class="femo-gam-title femo-display">
          Учиться — это <span class="femo-text-gradient">игра</span>, а не скучно
        </h2>
        <p class="femo-gam-sub">
          XP, streak, бейджи и Маркет достижений — дети занимаются каждый день не из-под палки.
        </p>
      </header>

      <div
        ref="containerRef"
        class="femo-gam-grid"
      >
        <!-- 1. MASCOT — wide hero card -->
        <article class="femo-gam-card femo-gam-card--mascot stagger-item">
          <div class="femo-gam-mas">
            <div class="femo-gam-mas-hero">
              <FemiMascot
                state="celebrate"
                size="md"
                silent
                ignore-reactions
              />
              <span class="femo-gam-mas-bubble">
                +50&nbsp;XP! 🎉
              </span>
            </div>
            <div class="femo-gam-mas-meta">
              <span class="femo-chip">Маскот · Lingo</span>
              <h3 class="femo-gam-card-title">
                Попугай <span class="femo-text-coral">Lingo</span> помогает
              </h3>
              <p class="femo-gam-card-text">
                Радуется правильному произношению, переживает за streak, празднует новый уровень и подбадривает после ошибок.
              </p>
              <div class="femo-gam-mas-row">
                <div
                  v-for="s in mascotStates"
                  :key="s"
                  class="femo-gam-mas-mini"
                  :title="s"
                >
                  <FemiMascot
                    :state="s"
                    size="xs"
                    silent
                    ignore-reactions
                  />
                </div>
              </div>
            </div>
          </div>
        </article>

        <!-- 2. XP & LEVELS — with floating XP -->
        <article class="femo-gam-card femo-gam-card--xp stagger-item">
          <div class="femo-gam-card-head">
            <span class="femo-chip femo-chip--amber">XP & 100 уровней</span>
            <span class="femo-gam-float-xp">+30 XP</span>
          </div>
          <h3 class="femo-gam-card-title">
            Прогресс <span class="femo-text-gradient">каждой минуты</span>
          </h3>
          <div class="femo-gam-xp">
            <div class="femo-gam-xp-row">
              <span class="femo-gam-xp-level">12</span>
              <div class="femo-gam-xp-bar">
                <span
                  class="femo-gam-xp-fill"
                  style="width: 84%"
                />
                <span class="femo-gam-xp-shine" />
              </div>
              <span class="femo-gam-xp-level femo-gam-xp-level--next">13</span>
            </div>
            <p class="femo-gam-meta">
              <UIcon
                name="i-lucide-zap"
                class="size-3 text-femo-amber-600"
              />
              <b>2 450 XP</b> · до 13: <b>120 XP</b>
            </p>
          </div>
        </article>

        <!-- 3. STREAK — dramatic fire + chain -->
        <article class="femo-gam-card femo-gam-card--streak stagger-item">
          <div class="femo-gam-card-head">
            <span class="femo-chip">Streak · цепочка дней</span>
            <span class="femo-gam-streak-mini">+10% к XP</span>
          </div>
          <h3 class="femo-gam-card-title">
            <span class="femo-text-coral">21 день</span> подряд — огонь!
          </h3>
          <div class="femo-gam-streak">
            <div class="femo-gam-streak-fire">
              <span class="femo-gam-streak-flame">🔥</span>
              <span class="femo-gam-streak-pulse" />
              <span class="femo-gam-streak-num">15</span>
            </div>
            <div class="femo-gam-streak-chain">
              <span
                v-for="d in 7"
                :key="d"
                class="femo-gam-streak-link"
                :class="{ 'is-on': d <= 6 }"
              >{{ d }}</span>
            </div>
          </div>
          <p class="femo-gam-streak-warn">
            <UIcon
              name="i-lucide-alert-triangle"
              class="size-3"
            />
            Пропустишь день — сгорит. До трофея «30 дней» осталось 9.
          </p>
        </article>

        <!-- 4. HEARTS — with floating −1 -->
        <article class="femo-gam-card femo-gam-card--hearts stagger-item">
          <div class="femo-gam-card-head">
            <span class="femo-chip">Жизни · 4 / 5 ❤️</span>
            <span class="femo-gam-heart-loss">−1 ❤️</span>
          </div>
          <h3 class="femo-gam-card-title">
            Кончились — <span class="femo-text-coral">пауза 30 мин</span>
          </h3>
          <div class="femo-gam-hearts">
            <UIcon
              v-for="i in 5"
              :key="i"
              name="i-lucide-heart"
              class="femo-gam-heart"
              :class="i <= 4 ? 'is-on' : 'is-off'"
            />
          </div>
          <p class="femo-gam-meta">
            Ребёнок учится <strong>обдумывать ответ</strong>, а не тыкать наугад
          </p>
        </article>

        <!-- 5. LEADERBOARD — podium -->
        <article class="femo-gam-card femo-gam-card--lead stagger-item">
          <div class="femo-gam-card-head">
            <span class="femo-chip femo-chip--amber">Лидерборд</span>
          </div>
          <h3 class="femo-gam-card-title">
            Соревнуйся <span class="femo-text-coral">с друзьями</span>
          </h3>
          <div class="femo-gam-podium">
            <div class="femo-gam-podium-step femo-gam-podium-step--2">
              <div class="femo-gam-podium-avatar">
                Т
              </div>
              <span class="femo-gam-podium-rank">2</span>
            </div>
            <div class="femo-gam-podium-step femo-gam-podium-step--1">
              <UIcon
                name="i-lucide-crown"
                class="femo-gam-podium-crown size-4 text-femo-amber-500"
              />
              <div class="femo-gam-podium-avatar femo-gam-podium-avatar--gold">
                А
              </div>
              <span class="femo-gam-podium-rank">1</span>
              <span class="femo-gam-podium-me">ты</span>
            </div>
            <div class="femo-gam-podium-step femo-gam-podium-step--3">
              <div class="femo-gam-podium-avatar">
                Л
              </div>
              <span class="femo-gam-podium-rank">3</span>
            </div>
          </div>
        </article>

        <!-- 6. QUESTS — daily quests with chest reward -->
        <article class="femo-gam-card femo-gam-card--quests stagger-item">
          <div class="femo-gam-card-head">
            <span class="femo-chip">Квесты дня</span>
            <span class="femo-gam-quest-prog">2 / 3 ✓</span>
          </div>
          <h3 class="femo-gam-card-title">
            3 задания → <span class="femo-text-coral">бонус XP</span>
          </h3>
          <ul class="femo-gam-quests">
            <li
              v-for="q in quests"
              :key="q.label"
              :class="{ 'is-done': q.done }"
            >
              <span class="femo-gam-quest-check">
                <UIcon
                  :name="q.done ? 'i-lucide-check' : 'i-lucide-circle'"
                  class="size-3"
                />
              </span>
              <span class="femo-gam-quest-label">{{ q.label }}</span>
              <span class="femo-gam-quest-xp">+{{ q.xp }}</span>
            </li>
          </ul>
          <div class="femo-gam-chest">
            <span class="femo-gam-chest-emoji">🎁</span>
            <span class="femo-gam-chest-text">Бонус-сундук <strong>+100 XP</strong> за все 3</span>
          </div>
        </article>

        <!-- 7. ACHIEVEMENTS — 4×2 grid -->
        <article class="femo-gam-card femo-gam-card--ach stagger-item">
          <div class="femo-gam-card-head">
            <span class="femo-chip">Коллекция ачивок</span>
            <span class="femo-gam-ach-count">7 / 50+</span>
          </div>
          <h3 class="femo-gam-card-title">
            Бейджи за <span class="femo-text-coral">каждую победу</span>
          </h3>
          <div class="femo-gam-ach">
            <div
              v-for="(a, i) in achievements"
              :key="i"
              class="femo-gam-ach-badge"
              :class="`femo-gam-ach-badge--${a.tier}`"
              :title="a.label"
            >
              <UIcon
                :name="a.icon"
                class="size-4"
              />
              <span
                v-if="i === 0"
                class="femo-gam-ach-new"
              >NEW</span>
            </div>
          </div>
          <p class="femo-gam-ach-hint">
            🥇 Streak 30 · � Speaking 100% · 🚀 Уровень F4 · и ещё 47…
          </p>
        </article>

        <!-- 8. SHOP — dress-up Femi -->
        <article class="femo-gam-card femo-gam-card--shop stagger-item">
          <div class="femo-gam-card-head">
            <span class="femo-chip femo-chip--amber">Магазин Феми</span>
            <span class="femo-gam-gems">
              <span class="femo-gam-gems-emoji">💎</span>
              <strong>280</strong>
            </span>
          </div>
          <h3 class="femo-gam-card-title">
            Одевай <span class="femo-text-coral">маскота</span> за алмазы
          </h3>
          <div class="femo-gam-shop-stage">
            <div class="femo-gam-shop-femi">
              <span class="femo-gam-shop-femi-hat">🎩</span>
              <FemiMascot
                state="proud"
                size="sm"
                silent
                ignore-reactions
              />
            </div>
            <div class="femo-gam-shop-grid">
              <div
                v-for="(it, i) in shopItems"
                :key="i"
                class="femo-gam-shop-item"
                :class="{ 'is-owned': it.owned }"
              >
                <span class="femo-gam-shop-emoji">{{ it.icon }}</span>
                <span class="femo-gam-shop-cost">
                  <span v-if="it.owned">надето</span>
                  <template v-else>💎 {{ it.cost }}</template>
                </span>
              </div>
            </div>
          </div>
        </article>

        <!-- 9. RPG-PATH -->
        <article class="femo-gam-card femo-gam-card--path stagger-item">
          <div class="femo-gam-card-head">
            <span class="femo-chip">Карта пути</span>
          </div>
          <h3 class="femo-gam-card-title">
            RPG-карта тем <span class="femo-text-gradient">как в Mario</span>
          </h3>
          <div class="femo-gam-path">
            <svg
              class="femo-gam-path-line"
              viewBox="0 0 100 30"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M 5 20 Q 25 5 45 20 T 95 18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-dasharray="3 4"
              />
            </svg>
            <div
              v-for="(n, i) in pathNodes"
              :key="i"
              class="femo-gam-path-node"
              :class="`is-${n.state}`"
              :style="{ left: `${i * 18 + 4}%`, top: i % 2 === 0 ? '50%' : '20%' }"
            >
              <UIcon
                :name="n.icon"
                class="size-3.5"
              />
            </div>
          </div>
        </article>
      </div>

      <!-- LIVE activity marquee — proves the platform is alive -->
      <div class="femo-gam-live stagger-item">
        <span class="femo-gam-live-label">
          <span class="femo-gam-live-dot" />
          LIVE · прямо сейчас
        </span>
        <div class="femo-gam-live-track">
          <div class="femo-gam-live-strip">
            <span
              v-for="(item, i) in [...liveFeed, ...liveFeed]"
              :key="`${i}-${item.who}`"
              class="femo-gam-live-item"
            >
              <UIcon
                :name="item.icon"
                class="size-3"
              />
              <strong>{{ item.who }}</strong>
              {{ item.text }}
              <span class="femo-gam-live-xp">{{ item.xp }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Bottom strip — emotional anchor + CTA -->
      <div class="femo-gam-strip stagger-item">
        <div class="femo-gam-strip-text">
          <p class="femo-gam-strip-title">
            <span class="femo-text-coral">«Мама, я сегодня ещё не позанимался!»</span>
          </p>
          <p class="femo-gam-strip-sub">
            То, что родители слышат от детей через 2 недели в Lingaphone.
          </p>
        </div>
        <NuxtLink
          to="/register"
          class="femo-btn-primary"
        >
          <span>Попробовать бесплатно</span>
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4"
          />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.femo-gam {
  position: relative;
  padding: clamp(2.5rem, 4vw, 3.5rem) 0;
  overflow: hidden;
  isolation: isolate;
}

.femo-gam-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.5;
}

/* ─── Compact stacked header ─── */
.femo-gam-head {
  text-align: center;
  max-width: 660px;
  margin: 0 auto 1.4rem;
  display: grid;
  justify-items: center;
  gap: 0.55rem;
}

.femo-gam-title {
  font-size: clamp(1.45rem, 2.6vw, 2.05rem);
  color: var(--color-femo-ink-900);
  line-height: 1.15;
  margin: 0;
  text-wrap: balance;
}

.femo-gam-sub {
  font-size: 0.88rem;
  color: var(--color-femo-ink-600);
  line-height: 1.45;
  max-width: 520px;
}

/* ─── Bento grid (12-col, dense) ─── */
.femo-gam-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.65rem;
}

@media (min-width: 768px) {
  .femo-gam-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 0.75rem;
  }

  .femo-gam-card--mascot { grid-column: span 3; }
  .femo-gam-card--xp     { grid-column: span 3; }
  .femo-gam-card--streak { grid-column: span 2; }
  .femo-gam-card--hearts { grid-column: span 2; }
  .femo-gam-card--lead   { grid-column: span 2; }
  .femo-gam-card--quests { grid-column: span 2; }
  .femo-gam-card--ach    { grid-column: span 2; }
  .femo-gam-card--shop   { grid-column: span 2; }
  .femo-gam-card--path   { grid-column: span 6; }
}

@media (min-width: 1024px) {
  .femo-gam-grid {
    grid-template-columns: repeat(12, 1fr);
  }

  .femo-gam-card--mascot { grid-column: span 5; }
  .femo-gam-card--xp     { grid-column: span 4; }
  .femo-gam-card--streak { grid-column: span 3; }
  .femo-gam-card--hearts { grid-column: span 3; }
  .femo-gam-card--lead   { grid-column: span 3; }
  .femo-gam-card--quests { grid-column: span 3; }
  .femo-gam-card--ach    { grid-column: span 3; }
  .femo-gam-card--shop   { grid-column: span 3; }
  .femo-gam-card--path   { grid-column: span 6; }
}

/* ─── Card base ─── */
.femo-gam-card {
  position: relative;
  border-radius: 1.05rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  padding: 0.8rem 0.95rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  overflow: hidden;
  box-shadow: 0 6px 14px -8px rgba(15, 23, 42, 0.12);
  transition:
    transform 0.4s var(--ease-out-expo),
    box-shadow 0.4s var(--ease-out-expo),
    border-color 0.4s var(--ease-out-expo);
  min-height: 156px;
}

.femo-gam-card:hover {
  transform: translateY(-3px);
  border-color: var(--color-femo-coral-200);
  box-shadow: 0 18px 36px -14px rgba(220, 38, 38, 0.22);
}

.femo-gam-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.45rem;
}

.femo-gam-mini {
  font-size: 0.6rem;
  font-weight: 700;
  padding: 0.12rem 0.4rem;
  border-radius: var(--radius-pill);
  background: var(--color-femo-ink-50);
  color: var(--color-femo-ink-600);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.femo-gam-card-title {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--color-femo-ink-900);
  line-height: 1.2;
  text-wrap: balance;
}

.femo-gam-card-text {
  color: var(--color-femo-ink-600);
  font-size: 0.78rem;
  line-height: 1.5;
}

.femo-gam-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  color: var(--color-femo-ink-700);
  margin-top: auto;
}

/* ─── 1. MASCOT ─── */
.femo-gam-card--mascot {
  background:
    radial-gradient(60% 80% at 0% 100%, rgba(250, 165, 26, 0.18), transparent 70%),
    linear-gradient(160deg, #FFFFFF 0%, #FFF1F0 70%, #FFE4D2 100%);
  min-height: 168px;
}

.femo-gam-mas {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.85rem;
  align-items: center;
  height: 100%;
}

.femo-gam-mas-hero {
  position: relative;
  display: grid;
  justify-items: center;
  align-items: end;
  flex: none;
}

.femo-gam-mas-bubble {
  position: absolute;
  top: -0.25rem;
  right: -0.4rem;
  background: var(--ui-bg-elevated);
  padding: 0.3rem 0.55rem;
  border-radius: 0.7rem;
  border: 1px solid var(--color-femo-red-100);
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--color-femo-red-700);
  box-shadow: 0 6px 14px -4px rgba(220, 38, 38, 0.25);
  white-space: nowrap;
  animation: femo-gam-bubble 2.4s ease-in-out infinite;
}

@keyframes femo-gam-bubble {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-3px); }
}

.femo-gam-mas-meta { display: grid; gap: 0.4rem; min-width: 0; }

.femo-gam-mas-row {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.3rem 0.45rem;
  background: rgba(255, 255, 255, 0.85);
  border-radius: var(--radius-pill);
  border: 1px solid rgba(255, 255, 255, 0.95);
  width: max-content;
  max-width: 100%;
  box-shadow: var(--shadow-soft);
  flex-wrap: wrap;
}

.femo-gam-mas-mini {
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 50%;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: transform 0.3s var(--ease-out-expo);
}

.femo-gam-mas-mini:hover { transform: scale(1.18) rotate(-6deg); border-color: var(--color-femo-red-300); }

/* ─── 2. XP ─── */
.femo-gam-card--xp {
  background:
    radial-gradient(60% 70% at 100% 0%, rgba(245, 158, 11, 0.14), transparent 70%),
    linear-gradient(160deg, #FFFFFF 0%, #FFFBEB 100%);
}

.femo-gam-float-xp {
  font-size: 0.62rem;
  font-weight: 800;
  padding: 0.18rem 0.45rem;
  background: var(--gradient-hero);
  color: white;
  border-radius: 999px;
  box-shadow: 0 6px 14px -4px rgba(220, 38, 38, 0.4);
  animation: femo-gam-xp-float 2s ease-in-out infinite;
}

@keyframes femo-gam-xp-float {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50%      { transform: translateY(-5px); opacity: 0.8; }
}

.femo-gam-xp { margin-top: auto; display: grid; gap: 0.55rem; }

.femo-gam-xp-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.55rem;
  align-items: center;
}

.femo-gam-xp-level {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.8rem;
  color: white;
  background: var(--gradient-hero);
  box-shadow: 0 6px 14px -4px rgba(220, 38, 38, 0.45);
}

.femo-gam-xp-level--next {
  background: var(--color-femo-ink-100);
  color: var(--color-femo-ink-500);
  box-shadow: none;
}

.femo-gam-xp-bar {
  position: relative;
  height: 0.55rem;
  border-radius: var(--radius-pill);
  background: var(--color-femo-ink-100);
  overflow: hidden;
}

.femo-gam-xp-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--gradient-hero);
  box-shadow: 0 0 12px rgba(239, 68, 56, 0.5);
}

.femo-gam-xp-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.55) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  animation: femo-gam-shine 3s linear infinite;
}

@keyframes femo-gam-shine {
  0%   { transform: translateX(-100%); }
  60%  { transform: translateX(180%); }
  100% { transform: translateX(180%); }
}

/* ─── 3. STREAK ─── */
.femo-gam-card--streak {
  background:
    radial-gradient(60% 70% at 0% 0%, rgba(220, 38, 38, 0.10), transparent 70%),
    linear-gradient(160deg, #FFFFFF 0%, #FFF1F0 100%);
}

.femo-gam-streak-mini {
  font-size: 0.6rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  background: linear-gradient(135deg, #FEF3C7, #FED7AA);
  border-radius: 999px;
  color: #B45309;
}

.femo-gam-streak {
  margin-top: auto;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.6rem;
  align-items: center;
}

.femo-gam-streak-fire {
  position: relative;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFC04D, #EF4438);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px -4px rgba(220, 38, 38, 0.45);
  flex: none;
}

.femo-gam-streak-flame { font-size: 1.3rem; }

.femo-gam-streak-pulse {
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 2px solid var(--color-femo-red-400);
  animation: femo-gam-pulse-ring 2s ease-out infinite;
}

@keyframes femo-gam-pulse-ring {
  0%   { transform: scale(0.9); opacity: 0.8; }
  100% { transform: scale(1.4); opacity: 0; }
}

/* Streak — fire with number badge */
.femo-gam-streak-fire {
  width: 3rem;
  height: 3rem;
}

.femo-gam-streak-flame { font-size: 1.5rem; }

.femo-gam-streak-num {
  position: absolute;
  bottom: -0.25rem;
  right: -0.3rem;
  background: var(--ui-bg-elevated);
  border: 2px solid var(--color-femo-red-500);
  color: var(--color-femo-red-700);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.62rem;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Streak — chain of 7 numbered links */
.femo-gam-streak-chain {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.2rem;
}

.femo-gam-streak-link {
  aspect-ratio: 1;
  border-radius: 0.4rem;
  background: var(--color-femo-ink-100);
  color: var(--color-femo-ink-400);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.65rem;
}

.femo-gam-streak-link.is-on {
  background: linear-gradient(135deg, #FFC04D, #EF4438);
  color: white;
  box-shadow: 0 3px 8px -2px rgba(220, 38, 38, 0.45);
}

.femo-gam-streak-warn {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.3rem;
  font-size: 0.65rem;
  font-weight: 600;
  color: #92400E;
  background: rgba(245, 158, 11, 0.10);
  padding: 0.35rem 0.5rem;
  border-radius: 0.5rem;
  line-height: 1.35;
  margin-top: 0.25rem;
}

/* Quests — chest reward */
.femo-gam-quest-prog {
  font-size: 0.6rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  background: linear-gradient(135deg, #ECFDF5, #BBF7D0);
  color: #047857;
  border-radius: 999px;
}

.femo-gam-chest {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.55rem;
  background: linear-gradient(135deg, #FFEDC9, #FFD98A);
  border: 1px solid rgba(250, 165, 26, 0.4);
  border-radius: 0.55rem;
  font-size: 0.65rem;
  font-weight: 600;
  color: #92400E;
  margin-top: 0.3rem;
}

.femo-gam-chest-emoji {
  font-size: 1rem;
  animation: femo-gam-chest-jiggle 2.5s ease-in-out infinite;
}

@keyframes femo-gam-chest-jiggle {
  0%, 100% { transform: rotate(0); }
  25%      { transform: rotate(-8deg); }
  75%      { transform: rotate(8deg); }
}

.femo-gam-chest-text strong { color: var(--color-femo-amber-700); font-weight: 800; }

/* Achievements — counter + new badge */
.femo-gam-ach-count {
  font-size: 0.6rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  background: linear-gradient(135deg, #FEF3C7, #FED7AA);
  color: #B45309;
  border-radius: 999px;
}

.femo-gam-ach-badge { position: relative; }

.femo-gam-ach-new {
  position: absolute;
  top: -0.35rem;
  right: -0.35rem;
  font-size: 0.5rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  background: var(--color-femo-red-500);
  color: white;
  padding: 0.08rem 0.3rem;
  border-radius: 999px;
  box-shadow: 0 4px 8px -2px rgba(239, 68, 56, 0.5);
  animation: femo-gam-bubble 2s ease-in-out infinite;
}

.femo-gam-ach-hint {
  font-size: 0.65rem;
  color: var(--color-femo-ink-600);
  font-weight: 500;
  line-height: 1.4;
  margin-top: 0.25rem;
}

/* Shop — dress-up Femi */
.femo-gam-gems {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.15rem 0.5rem;
  background: linear-gradient(135deg, #DBEAFE, #BFDBFE);
  color: #1E40AF;
  border-radius: 999px;
}

.femo-gam-gems-emoji { font-size: 0.7rem; }

.femo-gam-shop-stage {
  margin-top: auto;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.6rem;
  align-items: center;
}

.femo-gam-shop-femi {
  position: relative;
  width: 3rem;
  display: flex;
  justify-content: center;
  flex: none;
}

.femo-gam-shop-femi-hat {
  position: absolute;
  top: -0.4rem;
  left: 50%;
  transform: translateX(-50%) rotate(-12deg);
  font-size: 1.3rem;
  z-index: 2;
  animation: femo-gam-hat-bob 3s ease-in-out infinite;
}

@keyframes femo-gam-hat-bob {
  0%, 100% { transform: translateX(-50%) translateY(0) rotate(-12deg); }
  50%      { transform: translateX(-50%) translateY(-2px) rotate(-15deg); }
}

.femo-gam-shop-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.25rem;
}

/* ─── 4. HEARTS ─── */
.femo-gam-card--hearts {
  background:
    radial-gradient(60% 70% at 100% 100%, rgba(239, 68, 56, 0.10), transparent 70%),
    linear-gradient(160deg, #FFFFFF 0%, #FFF7F5 100%);
}

.femo-gam-heart-loss {
  font-size: 0.62rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  background: rgba(239, 68, 56, 0.12);
  color: var(--color-femo-red-700);
  border-radius: 999px;
  animation: femo-gam-loss 2.4s ease-in-out infinite;
}

@keyframes femo-gam-loss {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50%      { transform: translateY(-4px); opacity: 0.7; }
}

.femo-gam-hearts {
  margin-top: auto;
  display: inline-flex;
  gap: 0.3rem;
  padding: 0.55rem 0.7rem;
  border-radius: 0.85rem;
  background: linear-gradient(135deg, #FFF1F0, #FFE0DD);
  border: 1px solid var(--color-femo-red-100);
  width: max-content;
}

.femo-gam-heart { width: 1.2rem; height: 1.2rem; }
.femo-gam-heart.is-on  { color: var(--color-femo-red-500); filter: drop-shadow(0 2px 3px rgba(239, 68, 56, 0.35)); animation: femo-gam-heart-beat 1.6s ease-in-out infinite; }
.femo-gam-heart.is-off { color: var(--color-femo-ink-200); }

.femo-gam-heart.is-on:nth-child(1) { animation-delay: 0s; }
.femo-gam-heart.is-on:nth-child(2) { animation-delay: 0.15s; }
.femo-gam-heart.is-on:nth-child(3) { animation-delay: 0.3s; }
.femo-gam-heart.is-on:nth-child(4) { animation-delay: 0.45s; }

@keyframes femo-gam-heart-beat {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.15); }
}

/* ─── 5. LEADERBOARD ─── */
.femo-gam-card--lead {
  background:
    radial-gradient(60% 80% at 50% 0%, rgba(245, 158, 11, 0.12), transparent 70%),
    linear-gradient(160deg, #FFFFFF 0%, #FFFBEB 100%);
}

.femo-gam-podium {
  margin-top: auto;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.3rem;
  align-items: end;
}

.femo-gam-podium-step {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 0.25rem;
  padding: 0.55rem 0.3rem 0.35rem;
  border-radius: 0.6rem 0.6rem 0 0;
  background: var(--color-femo-ink-50);
}

.femo-gam-podium-step--1 { background: linear-gradient(180deg, #FFEDC9 0%, #FFD98A 100%); padding-top: 0.95rem; min-height: 4.2rem; }
.femo-gam-podium-step--2 { background: linear-gradient(180deg, #F8F5F4 0%, #DCD3CF 100%); min-height: 3rem; }
.femo-gam-podium-step--3 { background: linear-gradient(180deg, #FFE4D2 0%, #FFC8A6 100%); min-height: 2.5rem; }

.femo-gam-podium-crown { position: absolute; top: -0.4rem; left: 50%; transform: translateX(-50%); animation: femo-gam-crown 2.5s ease-in-out infinite; }
@keyframes femo-gam-crown {
  0%, 100% { transform: translateX(-50%) translateY(0) rotate(-3deg); }
  50%      { transform: translateX(-50%) translateY(-2px) rotate(3deg); }
}

.femo-gam-podium-avatar {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--ui-bg-elevated);
  color: var(--color-femo-ink-700);
  font-weight: 700;
  font-size: 0.65rem;
  border: 2px solid white;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.12);
}

.femo-gam-podium-avatar--gold {
  background: var(--gradient-hero);
  color: white;
}

.femo-gam-podium-rank { font-family: var(--font-display); font-weight: 800; font-size: 0.62rem; color: var(--color-femo-ink-700); }
.femo-gam-podium-me { font-size: 0.5rem; text-transform: uppercase; letter-spacing: 0.06em; background: var(--color-femo-red-700); color: white; padding: 0.05rem 0.3rem; border-radius: var(--radius-pill); }

/* ─── 6. QUESTS ─── */
.femo-gam-card--quests {
  background:
    radial-gradient(60% 70% at 0% 100%, rgba(22, 163, 74, 0.08), transparent 70%),
    linear-gradient(160deg, #FFFFFF 0%, #F0FDF4 100%);
}

.femo-gam-quests {
  margin-top: auto;
  display: grid;
  gap: 0.25rem;
}

.femo-gam-quests li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.4rem;
  align-items: center;
  padding: 0.4rem 0.5rem;
  border-radius: 0.5rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  font-size: 0.7rem;
  color: var(--color-femo-ink-800);
  font-weight: 600;
}

.femo-gam-quests li.is-done {
  background: linear-gradient(135deg, #ECFDF5, #FFFFFF);
  border-color: #BBF7D0;
  color: #15803D;
  text-decoration: line-through;
}

.femo-gam-quest-check {
  width: 0.95rem;
  height: 0.95rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--ui-bg-elevated);
  border: 1.2px solid var(--color-femo-ink-200);
  color: var(--color-femo-ink-400);
}

.femo-gam-quests li.is-done .femo-gam-quest-check { background: #16A34A; border-color: #16A34A; color: white; }

.femo-gam-quest-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.femo-gam-quest-xp {
  font-size: 0.58rem;
  font-weight: 800;
  color: var(--color-femo-amber-700);
  background: var(--color-femo-amber-50);
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-pill);
}

.femo-gam-quests li.is-done .femo-gam-quest-xp { background: rgba(22, 163, 74, 0.18); color: #15803D; }

/* ─── 7. ACHIEVEMENTS ─── */
.femo-gam-card--ach {
  background:
    radial-gradient(60% 70% at 100% 0%, rgba(245, 158, 11, 0.10), transparent 70%),
    linear-gradient(160deg, #FFFFFF 0%, #FFFBEB 100%);
}

.femo-gam-ach {
  margin-top: auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.3rem;
}

.femo-gam-ach-badge {
  aspect-ratio: 1;
  border-radius: 0.55rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  transition: transform 0.3s var(--ease-out-expo);
}

.femo-gam-ach-badge:hover { transform: translateY(-2px) scale(1.1); }

.femo-gam-ach-badge--gold   { background: linear-gradient(180deg, #FFEDC9 0%, #FFD98A 100%); color: var(--color-femo-amber-700); border-color: rgba(250, 165, 26, 0.3); }
.femo-gam-ach-badge--silver { background: linear-gradient(180deg, #F8F5F4 0%, #DCD3CF 100%); color: var(--color-femo-ink-700); border-color: var(--color-femo-ink-200); }
.femo-gam-ach-badge--bronze { background: linear-gradient(180deg, #FFE4D2 0%, #FFC8A6 100%); color: var(--color-femo-coral-700); border-color: rgba(252, 113, 76, 0.25); }
.femo-gam-ach-badge--locked { background: var(--color-femo-ink-50); color: var(--color-femo-ink-300); border-style: dashed; }

/* ─── 8. SHOP ─── */
.femo-gam-card--shop {
  background:
    radial-gradient(60% 70% at 100% 100%, rgba(168, 85, 247, 0.08), transparent 70%),
    linear-gradient(160deg, #FFFFFF 0%, #FAF5FF 100%);
}

.femo-gam-shop {
  margin-top: auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.3rem;
}

.femo-gam-shop-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.4rem;
  align-items: center;
  padding: 0.4rem 0.5rem;
  border-radius: 0.55rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--color-femo-ink-700);
  transition: transform 0.3s var(--ease-out-expo);
}

.femo-gam-shop-item:hover { transform: scale(1.05); }

.femo-gam-shop-item.is-owned {
  background: linear-gradient(135deg, #FFEDC9, #FFD98A);
  border-color: rgba(250, 165, 26, 0.3);
  color: var(--color-femo-amber-700);
}

.femo-gam-shop-emoji { font-size: 1rem; line-height: 1; }
.femo-gam-shop-cost { font-variant-numeric: tabular-nums; }

/* ─── 9. RPG-PATH ─── */
.femo-gam-card--path {
  background:
    radial-gradient(50% 70% at 50% 0%, rgba(250, 165, 26, 0.10), transparent 70%),
    linear-gradient(160deg, #FFFFFF 0%, #FFFBEB 100%);
  min-height: 156px;
}

.femo-gam-path {
  position: relative;
  margin-top: auto;
  width: 100%;
  height: 4.6rem;
  background: linear-gradient(180deg, #FFFAF6, #FFF1E8);
  border-radius: 0.7rem;
  border: 1px solid var(--color-femo-ink-100);
  overflow: hidden;
}

.femo-gam-path-line {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  color: var(--color-femo-coral-300);
}

.femo-gam-path-node {
  position: absolute;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  transform: translate(-50%, -50%);
  font-size: 0.65rem;
}

.femo-gam-path-node.is-done   { background: #10B981; color: white; box-shadow: 0 4px 8px rgba(22, 163, 74, 0.3); }
.femo-gam-path-node.is-active { background: var(--gradient-hero); color: white; box-shadow: 0 6px 14px -2px rgba(220, 38, 38, 0.45); animation: femo-gam-pulse 2s ease-in-out infinite; }
.femo-gam-path-node.is-locked { background: white; color: var(--color-femo-ink-300); border-style: dashed; border-color: var(--color-femo-ink-200); }

@keyframes femo-gam-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50%      { transform: translate(-50%, -50%) scale(1.18); }
}

/* ─── LIVE marquee — slim ─── */
.femo-gam-live {
  margin-top: 0.7rem;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.7rem;
  align-items: center;
  padding: 0.45rem 0.8rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}

@media (max-width: 640px) {
  .femo-gam-live { grid-template-columns: 1fr; gap: 0.4rem; border-radius: 1rem; padding: 0.55rem; }
}

.femo-gam-live-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.62rem;
  font-weight: 800;
  color: var(--color-femo-red-700);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.55rem;
  background: linear-gradient(135deg, #FFF1F0, #FFE4D2);
  border-radius: 999px;
  white-space: nowrap;
}

.femo-gam-live-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: var(--color-femo-red-500);
  box-shadow: 0 0 0 3px rgba(239, 68, 56, 0.25);
  animation: femo-gam-live-dot 1.6s ease-in-out infinite;
}

@keyframes femo-gam-live-dot {
  0%, 100% { box-shadow: 0 0 0 3px rgba(239, 68, 56, 0.25); }
  50%      { box-shadow: 0 0 0 6px rgba(239, 68, 56, 0.10); }
}

.femo-gam-live-track { overflow: hidden; mask-image: linear-gradient(90deg, transparent 0, black 5%, black 95%, transparent 100%); }

.femo-gam-live-strip {
  display: inline-flex;
  gap: 1.5rem;
  white-space: nowrap;
  animation: femo-gam-marquee 22s linear infinite;
  padding-right: 1.5rem;
}

@keyframes femo-gam-marquee {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.femo-gam-live-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  color: var(--color-femo-ink-700);
}

.femo-gam-live-item strong { color: var(--color-femo-ink-900); font-weight: 700; }

.femo-gam-live-xp {
  margin-left: 0.2rem;
  padding: 0.1rem 0.4rem;
  background: var(--gradient-hero);
  color: white;
  border-radius: 999px;
  font-size: 0.6rem;
  font-weight: 800;
}

/* ─── Bottom strip — compact ─── */
.femo-gam-strip {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1.1rem;
  align-items: center;
  padding: 0.95rem 1.35rem;
  border-radius: 1.4rem;
  background:
    radial-gradient(50% 80% at 100% 0%, rgba(250, 165, 26, 0.18), transparent 70%),
    linear-gradient(135deg, #FFFFFF 0%, #FFF1F0 60%, #FFE4D2 100%);
  border: 1px solid var(--color-femo-red-100);
  box-shadow: var(--shadow-soft);
}

@media (max-width: 720px) {
  .femo-gam-strip { grid-template-columns: 1fr; text-align: center; gap: 0.6rem; border-radius: 1rem; }
}

.femo-gam-strip-title {
  font-family: var(--font-display);
  font-size: clamp(1rem, 1.8vw, 1.2rem);
  font-weight: 800;
  color: var(--color-femo-ink-900);
  letter-spacing: -0.01em;
  text-wrap: balance;
}

.femo-gam-strip-sub {
  margin-top: 0.2rem;
  font-size: 0.8rem;
  color: var(--color-femo-ink-600);
}

@media (prefers-reduced-motion: reduce) {
  .femo-gam-mas-bubble,
  .femo-gam-float-xp,
  .femo-gam-xp-shine,
  .femo-gam-streak-pulse,
  .femo-gam-heart-loss,
  .femo-gam-heart.is-on,
  .femo-gam-podium-crown,
  .femo-gam-path-node.is-active,
  .femo-gam-live-dot,
  .femo-gam-live-strip { animation: none; }
}
</style>
