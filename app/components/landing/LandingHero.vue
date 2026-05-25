<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'

const ctaRef = useTemplateRef<HTMLAnchorElement>('ctaRef')
useMagnetic(ctaRef, { strength: 0.25, radius: 140 })

const browserRef = useTemplateRef<HTMLElement>('browserRef')
useTilt(browserRef, { max: 4, perspective: 1600, scale: 1.005 })

// Mouse parallax for the hero blobs
const blobs = ref({ x: 0, y: 0 })
const onMouseMove = (e: MouseEvent) => {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  blobs.value.x = ((e.clientX - cx) / cx) * 14
  blobs.value.y = ((e.clientY - cy) / cy) * 10
}

// English skills shown in mockup
const skills = [
  { name: 'Speaking', level: 72 },
  { name: 'Listening', level: 85 },
  { name: 'Reading', level: 68 },
  { name: 'Writing', level: 55 },
  { name: 'Grammar', level: 78 }
]

// Today's tasks in mockup
const tasks = [
  { label: 'Слушать аудио урок', xp: 20, done: true },
  { label: 'Диалог с учителем', xp: 40, done: true },
  { label: 'Написать 5 предложений', xp: 30, done: false }
]

const colorFor = (lvl: number) => {
  if (lvl >= 80) return 'var(--color-success)'
  if (lvl >= 60) return 'var(--linga-primary, #0EA5E9)'
  return 'var(--color-warning)'
}

// Typewriter on the third title line — cycles through phrases
const phrases = [
  '— за 90 дней',
  '— с британским произношением',
  '— с AI-тренером Феми',
  '— без слёз и принуждения',
  '— уже с первого урока'
]
const phraseIdx = ref(0)
const typedSource = ref<string>(phrases[0] ?? '')
const { output: typedLine, isTyping } = useTypewriter(typedSource, {
  speed: 80,
  startDelay: 600
})

let phraseTimer: ReturnType<typeof setTimeout> | null = null
watch(isTyping, (typing) => {
  if (!typing && typeof window !== 'undefined') {
    phraseTimer = setTimeout(() => {
      phraseIdx.value = (phraseIdx.value + 1) % phrases.length
      typedSource.value = phrases[phraseIdx.value]
    }, 2200)
  }
})

// Live feed of student achievements — rotates every 3.5 s
interface FeedItem { name: string, action: string, emoji: string }
const feed: FeedItem[] = [
  { name: 'Айгерим', action: 'выучила 50 новых слов', emoji: '📚' },
  { name: 'Данияр', action: 'streak 21 день 🔥', emoji: '⚡' },
  { name: 'Амина', action: 'получила 5 000₸ в Маркете', emoji: '🥇' }
]
const currentFeed = ref(0)
const currentFeedItem = computed<FeedItem>(() => feed[currentFeed.value] ?? feed[0]!)
let feedTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  feedTimer = setInterval(() => {
    currentFeed.value = (currentFeed.value + 1) % feed.length
  }, 3500)
})

onBeforeUnmount(() => {
  if (feedTimer) clearInterval(feedTimer)
  if (phraseTimer) clearTimeout(phraseTimer)
})
</script>

<template>
  <section
    class="femo-hero"
    @mousemove="onMouseMove"
  >
    <!-- Animated mesh background with mouse parallax -->
    <div
      class="femo-hero-bg"
      :style="{ transform: `translate3d(${blobs.x}px, ${blobs.y}px, 0)` }"
      aria-hidden="true"
    >
      <FemoMeshBg />
      <div class="femo-hero-grid" />
    </div>

    <div class="femo-hero-inner">
      <!-- ─────────── Left: copy ─────────── -->
      <div class="femo-hero-content">
        <div class="femo-hero-badges">
          <div class="femo-hero-badge">
            <span class="femo-hero-badge-dot" />
            <span>Школа английского · Алматы + Онлайн с 2013</span>
          </div>
          <div class="femo-hero-live">
            <span class="femo-hero-live-dot" />
            <Transition
              name="feed"
              mode="out-in"
            >
              <span :key="currentFeed">
                <strong>{{ currentFeedItem.name }}</strong> {{ currentFeedItem.action }}
              </span>
            </Transition>
          </div>
        </div>

        <h1 class="femo-hero-title femo-display">
          Ваш ребёнок заговорит<br>
          <span class="femo-text-coral">по-английски</span><br>
          <span class="femo-text-gradient">{{ typedLine }}</span><span
            v-if="isTyping"
            class="femo-hero-cursor"
            aria-hidden="true"
          >▍</span>
        </h1>

        <p class="femo-hero-sub">
          Британская методика, мини-группы и уникальный Маркет достижений — дети зарабатывают реальные деньги за успехи в учёбе.
        </p>

        <div class="femo-hero-cta">
          <NuxtLink
            ref="ctaRef"
            to="https://wa.me/77761235703"
            external
            target="_blank"
            class="femo-btn-primary femo-hero-cta-primary"
          >
            <span>Записаться на пробный урок</span>
            <UIcon
              name="i-lucide-arrow-right"
              class="size-5"
            />
          </NuxtLink>
          <NuxtLink
            to="#method"
            class="femo-btn-ghost femo-hero-cta-ghost"
          >
            <UIcon
              name="i-lucide-book-open"
              class="size-5 text-sky-600"
            />
            <span>О методике</span>
          </NuxtLink>
        </div>

        <div class="femo-hero-trust">
          <div class="femo-hero-trust-lingo">
            <span
              class="femo-hero-trust-lingo-avatar"
              aria-hidden="true"
            >🦜</span>
            <span>👋 Привет! Я <strong>Lingo</strong>, твой&nbsp;гид</span>
          </div>
          <div class="femo-hero-trust-item">
            <UIcon
              name="i-lucide-shield-check"
              class="size-4 text-emerald-600"
            />
            <span>Безопасно для детей 5+</span>
          </div>
          <div class="femo-hero-trust-item">
            <UIcon
              name="i-lucide-users"
              class="size-4 text-emerald-600"
            />
            <span>Мини-группы</span>
          </div>
          <div class="femo-hero-trust-item">
            <UIcon
              name="i-lucide-award"
              class="size-4 text-emerald-600"
            />
            <span>13 лет опыта</span>
          </div>
        </div>
      </div>

      <!-- ─────────── Right: browser mockup ─────────── -->
      <div class="femo-hero-mockup-wrap">
        <!-- Floating chips around the browser -->
        <div class="femo-hero-chip femo-hero-chip--xp femo-float">
          <div class="femo-hero-chip-icon">
            <UIcon
              name="i-lucide-trophy"
              class="size-4"
            />
          </div>
          <div>
            <p class="femo-hero-chip-title">
              🥇 5 000₸
            </p>
            <p class="femo-hero-chip-sub">
              Маркет достижений
            </p>
          </div>
        </div>

        <div class="femo-hero-chip femo-hero-chip--badge femo-float--delay">
          <div class="femo-hero-chip-icon femo-hero-chip-icon--amber">
            <UIcon
              name="i-lucide-flame"
              class="size-4"
            />
          </div>
          <div>
            <p class="femo-hero-chip-title">
              Streak 21 день
            </p>
            <p class="femo-hero-chip-sub">
              Данияр не пропускает!
            </p>
          </div>
        </div>

        <!-- Browser window -->
        <div
          ref="browserRef"
          class="femo-hero-browser"
        >
          <!-- Browser chrome -->
          <div class="femo-hero-browser-chrome">
            <div class="femo-hero-browser-dots">
              <span />
              <span />
              <span />
            </div>
            <div class="femo-hero-browser-url">
              <UIcon
                name="i-lucide-lock"
                class="size-3 text-emerald-600"
              />
              <span>lingaphone.kz/student</span>
            </div>
            <div class="femo-hero-browser-actions">
              <span class="femo-hero-browser-action" />
              <span class="femo-hero-browser-action" />
            </div>
          </div>

          <!-- Browser content -->
          <div class="femo-hero-browser-screen">
            <!-- Greeting strip -->
            <div class="femo-hero-greet">
              <span
                class="femo-hero-greet-mascot"
                aria-hidden="true"
              >🦜</span>
              <div class="femo-hero-greet-text">
                <p class="femo-hero-greet-title">
                  Привет, Айгерим! 👋
                </p>
                <p class="femo-hero-greet-sub">
                  Уровень <b>S2 Elementary</b> · streak горит 🔥
                </p>
              </div>
              <div class="femo-hero-greet-stats">
                <div class="femo-hero-greet-stat">
                  <UIcon
                    name="i-lucide-zap"
                    class="size-3.5 text-amber-600"
                  />
                  <div>
                    <span class="femo-hero-greet-stat-value">1 840</span>
                    <span class="femo-hero-greet-stat-label">XP</span>
                  </div>
                </div>
                <div class="femo-hero-greet-stat">
                  <span class="femo-hero-greet-stat-emoji">🔥</span>
                  <div>
                    <span class="femo-hero-greet-stat-value">14</span>
                    <span class="femo-hero-greet-stat-label">streak</span>
                  </div>
                </div>
                <div class="femo-hero-greet-stat femo-hero-greet-stat--lvl">
                  <span class="femo-hero-greet-stat-lvl">S2</span>
                  <span class="femo-hero-greet-stat-label">уровень</span>
                </div>
              </div>
            </div>

            <!-- Two-column body -->
            <div class="femo-hero-body">
              <!-- Skills map -->
              <div class="femo-hero-card">
                <div class="femo-hero-card-head">
                  <span class="femo-hero-card-label">
                    <UIcon
                      name="i-lucide-bar-chart-2"
                      class="size-3.5"
                    />
                    Навыки English
                  </span>
                  <span class="femo-hero-card-value femo-text-gradient">
                    72%
                  </span>
                </div>
                <div class="femo-hero-card-progress">
                  <div
                    class="femo-hero-card-progress-bar"
                    style="width: 72%"
                  />
                </div>
                <ul class="femo-hero-topics">
                  <li
                    v-for="s in skills"
                    :key="s.name"
                  >
                    <span class="femo-hero-topic-name">{{ s.name }}</span>
                    <div class="femo-hero-topic-bar">
                      <span
                        :style="{ width: `${s.level}%`, background: colorFor(s.level) }"
                      />
                    </div>
                    <span class="femo-hero-topic-pct">{{ s.level }}%</span>
                  </li>
                </ul>
              </div>

              <!-- Right column: tasks + market -->
              <div class="femo-hero-side">
                <div class="femo-hero-card">
                  <div class="femo-hero-card-head">
                    <span class="femo-hero-card-label">
                      <UIcon
                        name="i-lucide-list-checks"
                        class="size-3.5"
                      />
                      Задания дня
                    </span>
                    <span class="femo-hero-card-mini">
                      2 / 3
                    </span>
                  </div>
                  <ul class="femo-hero-quests">
                    <li
                      v-for="t in tasks"
                      :key="t.label"
                      :class="{ 'is-done': t.done }"
                    >
                      <span class="femo-hero-quest-check">
                        <UIcon
                          :name="t.done ? 'i-lucide-check' : 'i-lucide-circle'"
                          class="size-3"
                        />
                      </span>
                      <span class="femo-hero-quest-label">{{ t.label }}</span>
                      <span class="femo-hero-quest-xp">+{{ t.xp }}</span>
                    </li>
                  </ul>
                </div>

                <div class="femo-hero-card femo-hero-card--market">
                  <div class="femo-hero-card-head">
                    <span class="femo-hero-card-label">
                      <UIcon
                        name="i-lucide-trophy"
                        class="size-3.5"
                      />
                      Маркет
                    </span>
                    <span class="femo-hero-card-mini femo-hero-card-mini--amber">
                      🥇 Золото
                    </span>
                  </div>
                  <div class="femo-hero-market-row">
                    <div class="femo-hero-market-medal femo-hero-market-medal--gold">
                      <span>🥇</span>
                      <div>
                        <b>5 000₸</b>
                        <small>avg 4.6+</small>
                      </div>
                    </div>
                    <div class="femo-hero-market-medal femo-hero-market-medal--silver">
                      <span>🥈</span>
                      <div>
                        <b>3 000₸</b>
                        <small>avg 4.0+</small>
                      </div>
                    </div>
                    <div class="femo-hero-market-medal femo-hero-market-medal--bronze">
                      <span>🥉</span>
                      <div>
                        <b>1 000₸</b>
                        <small>avg 3.6+</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.femo-hero {
  position: relative;
  overflow: hidden;
  padding-top: clamp(5rem, 12vw, 5.5rem);
  padding-bottom: clamp(2.5rem, 6vw, 6rem);
}

.femo-hero-bg {
  position: absolute;
  inset: -10vmax;
  z-index: 0;
  pointer-events: none;
  transition: transform 0.6s var(--ease-out-expo);
}

.femo-hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(14, 165, 233, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14, 165, 233, 0.05) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 60% 60% at 50% 30%, black, transparent 80%);
}

.femo-hero-inner {
  position: relative;
  z-index: 1;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 1.25rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 3.5rem;
  align-items: center;
}

@media (min-width: 1024px) {
  .femo-hero-inner {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
    gap: 3rem;
  }
}

/* ---------- Left content ---------- */
.femo-hero-content {
  min-width: 0;
  max-width: 600px;
}

.femo-hero-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.femo-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.45rem 0.95rem;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(14, 165, 233, 0.2);
  color: #0369A1;
  font-size: 0.82rem;
  font-weight: 600;
  box-shadow: var(--shadow-soft);
}

.femo-hero-badge-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--gradient-hero);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
}

.femo-hero-live {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.85rem;
  border-radius: var(--radius-pill);
  background: linear-gradient(135deg, #ECFDF5, #FFFFFF);
  border: 1px solid rgba(22, 163, 74, 0.25);
  color: #047857;
  font-size: 0.78rem;
  font-weight: 600;
}

.femo-hero-live strong {
  color: #047857;
  font-weight: 800;
}

.femo-hero-live-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: #16A34A;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.25);
  animation: hero-live-pulse 1.6s ease-in-out infinite;
  flex: none;
}

@keyframes hero-live-pulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.25); }
  50%      { box-shadow: 0 0 0 6px rgba(22, 163, 74, 0.10); }
}

/* Feed transition */
.feed-enter-active,
.feed-leave-active { transition: opacity 0.4s, transform 0.4s; }
.feed-enter-from   { opacity: 0; transform: translateY(6px); }
.feed-leave-to     { opacity: 0; transform: translateY(-6px); }

@media (prefers-reduced-motion: reduce) {
  .femo-hero-live-dot { animation: none; }
  .feed-enter-active,
  .feed-leave-active  { transition: none; }
}

.femo-hero-title {
  font-size: clamp(2rem, 4.2vw, 3.5rem);
  color: var(--color-femo-ink-900);
  margin: 0 0 1.5rem;
  line-height: 1.05;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.femo-hero-sub {
  font-size: clamp(0.98rem, 1.3vw, 1.1rem);
  color: var(--color-femo-ink-700);
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 520px;
}

.femo-hero-cta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.75rem;
}

@media (max-width: 480px) {
  .femo-hero-cta {
    flex-direction: column;
  }
  .femo-hero-cta-primary,
  .femo-hero-cta-ghost {
    width: 100%;
    justify-content: center;
  }
}

.femo-hero-cta-primary { padding: 1rem 1.5rem; font-size: 1rem; }
.femo-hero-cta-ghost   { padding: 1rem 1.4rem; font-size: 1rem; }

/* Bouncing arrow inside primary CTA */
.femo-hero-cta-primary :deep(svg),
.femo-hero-cta-primary :deep(.iconify) {
  animation: hero-arrow-bounce 1.6s ease-in-out infinite;
}

@keyframes hero-arrow-bounce {
  0%, 100% { transform: translateX(0); }
  50%      { transform: translateX(4px); }
}

/* Typewriter cursor on title */
.femo-hero-cursor {
  display: inline-block;
  margin-left: 2px;
  color: #0EA5E9;
  animation: hero-cursor-blink 1s steps(2) infinite;
  font-weight: 800;
  vertical-align: -0.02em;
}

@keyframes hero-cursor-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0; }
}

.femo-hero-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem 1.2rem;
  align-items: center;
}

@media (max-width: 480px) {
  .femo-hero-trust { gap: 0.5rem 0.8rem; }
  .femo-hero-trust-item { font-size: 0.8rem; }
  .femo-hero-trust-lingo { font-size: 0.78rem; }
}

.femo-hero-trust-item {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.86rem;
  color: var(--color-femo-ink-700);
}

/* Lingo peek chip */
.femo-hero-trust-lingo {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem 0.35rem 0.4rem;
  background: linear-gradient(135deg, #E0F2FE, #BAE6FD);
  border: 1px solid rgba(14, 165, 233, 0.25);
  border-radius: var(--radius-pill);
  font-size: 0.82rem;
  color: var(--color-femo-ink-800);
  box-shadow: 0 6px 14px -6px rgba(14, 165, 233, 0.25);
  animation: hero-lingo-bob 3s ease-in-out infinite;
}

.femo-hero-trust-lingo strong { color: #0369A1; font-weight: 800; }

.femo-hero-trust-lingo-avatar {
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 50%;
  background: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  box-shadow: 0 4px 8px -2px rgba(14, 165, 233, 0.3);
  flex: none;
}

@keyframes hero-lingo-bob {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50%      { transform: translateY(-3px) rotate(1deg); }
}

@media (prefers-reduced-motion: reduce) {
  .femo-hero-cta-primary :deep(svg),
  .femo-hero-cta-primary :deep(.iconify),
  .femo-hero-cursor,
  .femo-hero-trust-lingo { animation: none; }
}

/* ---------- Browser mockup ---------- */
.femo-hero-mockup-wrap {
  position: relative;
  perspective: 1600px;
  margin: 0 auto;
  width: 100%;
  max-width: 580px;
}

.femo-hero-browser {
  position: relative;
  z-index: 1;
  border-radius: 1.4rem;
  background: var(--ui-bg-elevated);
  border: 1px solid rgba(14, 165, 233, 0.15);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.8) inset,
    0 30px 60px -20px rgba(14, 165, 233, 0.30),
    0 60px 120px -40px rgba(2, 132, 199, 0.20);
  overflow: hidden;
  transform-style: preserve-3d;
}

/* chrome */
.femo-hero-browser-chrome {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.9rem;
  padding: 0.7rem 0.9rem;
  background: linear-gradient(180deg, #F0F9FF, #FFFFFF);
  border-bottom: 1px solid rgba(14, 165, 233, 0.12);
}

.femo-hero-browser-dots {
  display: inline-flex;
  gap: 0.4rem;
}

.femo-hero-browser-dots span {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: rgba(14, 165, 233, 0.15);
}

.femo-hero-browser-dots span:nth-child(1) { background: #FF5F57; }
.femo-hero-browser-dots span:nth-child(2) { background: #FFBD2E; }
.femo-hero-browser-dots span:nth-child(3) { background: #28C840; }

.femo-hero-browser-url {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.85rem;
  border-radius: var(--radius-pill);
  background: #F0F9FF;
  border: 1px solid rgba(14, 165, 233, 0.15);
  font-size: 0.78rem;
  color: var(--color-femo-ink-700);
  max-width: 22rem;
  margin: 0 auto;
}

.femo-hero-browser-actions {
  display: inline-flex;
  gap: 0.3rem;
}

.femo-hero-browser-action {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: rgba(14, 165, 233, 0.12);
}

/* screen */
.femo-hero-browser-screen {
  background: linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%);
  padding: 1rem;
  display: grid;
  gap: 0.85rem;
}

/* Greeting strip */
.femo-hero-greet {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.85rem;
  align-items: center;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, #BAE6FD, #7DD3FC);
  border: 1px solid rgba(14, 165, 233, 0.2);
}

.femo-hero-greet-mascot {
  font-size: 2rem;
  line-height: 1;
}

.femo-hero-greet-text { min-width: 0; }
.femo-hero-greet-title {
  font-weight: 700;
  font-size: 0.88rem;
  color: #0C4A6E;
  line-height: 1.2;
}
.femo-hero-greet-sub {
  font-size: 0.72rem;
  color: #0369A1;
  line-height: 1.3;
  margin-top: 0.15rem;
}

.femo-hero-greet-stats {
  display: inline-flex;
  gap: 0.4rem;
}

.femo-hero-greet-stat {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.55rem;
  border-radius: 0.6rem;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.9);
  font-size: 0.7rem;
}

.femo-hero-greet-stat-emoji { font-size: 0.95rem; }

.femo-hero-greet-stat-value {
  display: block;
  font-weight: 800;
  font-size: 0.82rem;
  color: var(--color-femo-ink-900);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.femo-hero-greet-stat-label {
  display: block;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-femo-ink-500);
}

.femo-hero-greet-stat-lvl {
  width: 1.6rem;
  height: 1.4rem;
  border-radius: 0.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: var(--gradient-hero);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.65rem;
}

@media (max-width: 540px) {
  .femo-hero-greet { grid-template-columns: auto 1fr; }
  .femo-hero-greet-stats { grid-column: 1 / -1; }
}

/* Body two-column */
.femo-hero-body {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 0.75rem;
}

@media (max-width: 480px) {
  .femo-hero-body { grid-template-columns: 1fr; }
}

.femo-hero-side {
  display: grid;
  gap: 0.75rem;
  align-content: start;
}

.femo-hero-card {
  background: var(--ui-bg-elevated);
  border: 1px solid rgba(14, 165, 233, 0.12);
  border-radius: 1rem;
  padding: 0.85rem;
  box-shadow: var(--shadow-soft);
  display: grid;
  gap: 0.6rem;
}

.femo-hero-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.femo-hero-card-label {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #0369A1;
}

.femo-hero-card-value {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.1rem;
  letter-spacing: -0.01em;
}

.femo-hero-card-mini {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  border-radius: var(--radius-pill);
  background: #F0F9FF;
  color: #0369A1;
}

.femo-hero-card-mini--amber {
  background: #FFFBEB;
  color: #B45309;
}

.femo-hero-card-progress {
  height: 0.5rem;
  border-radius: var(--radius-pill);
  background: rgba(14, 165, 233, 0.12);
  overflow: hidden;
}

.femo-hero-card-progress-bar {
  height: 100%;
  background: var(--gradient-hero);
  border-radius: inherit;
  box-shadow: 0 0 12px rgba(14, 165, 233, 0.45);
}

/* Skills */
.femo-hero-topics { display: grid; gap: 0.4rem; }

.femo-hero-topics li {
  display: grid;
  grid-template-columns: minmax(72px, auto) 1fr 32px;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.7rem;
}

.femo-hero-topic-name { color: var(--color-femo-ink-700); font-weight: 600; }
.femo-hero-topic-bar  { height: 0.4rem; border-radius: var(--radius-pill); background: rgba(14, 165, 233, 0.1); overflow: hidden; }
.femo-hero-topic-bar > span { display: block; height: 100%; border-radius: inherit; }
.femo-hero-topic-pct  { text-align: right; font-weight: 700; color: var(--color-femo-ink-800); font-variant-numeric: tabular-nums; }

/* Tasks */
.femo-hero-quests { display: grid; gap: 0.3rem; }

.femo-hero-quests li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.4rem;
  align-items: center;
  padding: 0.4rem 0.5rem;
  border-radius: 0.6rem;
  background: #F0F9FF;
  font-size: 0.7rem;
  color: var(--color-femo-ink-700);
  font-weight: 600;
}

.femo-hero-quests li.is-done {
  background: rgba(22, 163, 74, 0.10);
  color: #15803D;
  text-decoration: line-through;
}

.femo-hero-quest-check {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--ui-bg-elevated);
  border: 1px solid rgba(14, 165, 233, 0.2);
  color: var(--color-femo-ink-400);
}

.femo-hero-quests li.is-done .femo-hero-quest-check {
  background: #16A34A;
  color: white;
  border-color: #16A34A;
}

.femo-hero-quest-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.femo-hero-quest-xp {
  font-size: 0.62rem;
  font-weight: 700;
  color: #B45309;
  background: #FFFBEB;
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-pill);
}

.femo-hero-quests li.is-done .femo-hero-quest-xp {
  background: rgba(22, 163, 74, 0.18);
  color: #15803D;
}

/* Market card */
.femo-hero-card--market { background: linear-gradient(180deg, #FFFBEB, white); }

.femo-hero-market-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.35rem;
}

.femo-hero-market-medal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.4rem 0.2rem;
  border-radius: 0.6rem;
  font-size: 0.6rem;
  text-align: center;
}

.femo-hero-market-medal span { font-size: 1.1rem; }
.femo-hero-market-medal b  { display: block; font-weight: 800; font-size: 0.65rem; }
.femo-hero-market-medal small { display: block; color: var(--color-femo-ink-500); font-size: 0.55rem; }

.femo-hero-market-medal--gold   { background: linear-gradient(180deg, #FFEDC9, #FFD98A); }
.femo-hero-market-medal--silver { background: linear-gradient(180deg, #F1F5F9, #E2E8F0); }
.femo-hero-market-medal--bronze { background: linear-gradient(180deg, #FFF7ED, #FED7AA); }

/* ---------- Floating chips ---------- */
.femo-hero-chip {
  position: absolute;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.85rem;
  border-radius: 1rem;
  background: var(--ui-bg-elevated);
  border: 1px solid rgba(14, 165, 233, 0.15);
  box-shadow: 0 14px 32px -10px rgba(14, 165, 233, 0.25);
}

.femo-hero-chip-icon {
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 0.65rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: var(--gradient-hero);
}

.femo-hero-chip-icon--amber { background: linear-gradient(135deg, #FFC04D, #E58A06); }

.femo-hero-chip-title { font-weight: 700; font-size: 0.82rem; color: var(--color-femo-ink-900); }
.femo-hero-chip-sub   { font-size: 0.68rem; color: var(--color-femo-ink-500); }

.femo-hero-chip--xp     { left: -2rem;  top: -1rem;  }
.femo-hero-chip--badge  { right: -2rem; bottom: -1rem; }

@media (max-width: 1024px) {
  .femo-hero-chip--xp     { left: 0.5rem;  top: -0.5rem; }
  .femo-hero-chip--badge  { right: 0.5rem; bottom: -0.5rem; }
}

@media (max-width: 540px) {
  .femo-hero-chip { display: none; }
}
</style>
