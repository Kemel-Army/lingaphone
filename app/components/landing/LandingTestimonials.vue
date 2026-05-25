<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'

// DiceBear `notionists` style — generative avatars, no API key, free.
// Seed by name → stable avatar per testimonial.
const avatarUrl = (seed: string) =>
  `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=ffe4d2,fff1f0,ffedc9,ecfdf5&scale=110`

const testimonials = [
  {
    name: 'Гүлмира А.',
    initials: 'ГА',
    role: 'Мама ученицы 4 класса · Алматы',
    text: 'Дочь ходит на офлайн занятия уже год. Акцент стал очень чистым, говорит уверенно. Учитель Дана — настоящий профессионал, дети её обожают.',
    result: 'Чистый британский акцент за год',
    accent: 'red',
    avatar: avatarUrl('gulmira-a-lingaphone-mom')
  },
  {
    name: 'Сергей П.',
    initials: 'СП',
    role: 'Папа ученика · Нур-Султан (онлайн)',
    text: 'Мы из другого города, нашли онлайн формат. Сын занимается 6 месяцев — уже прошёл с A1 до A2 и получил первые выплаты из Маркета. Мотивация на высоте!',
    result: 'A1 → A2 + выплаты из Маркета',
    accent: 'amber',
    avatar: avatarUrl('sergey-p-lingaphone-dad')
  },
  {
    name: 'Айым К.',
    initials: 'АК',
    role: 'Мама ученицы 3 класса · Алматы',
    text: 'Маркет достижений — гениальная идея. Сначала не верила, что будут платить. Но Амина уже получила 8 000₸ за последние два месяца. Она реально старается ради этого!',
    result: '8 000₸ за 2 месяца',
    accent: 'coral',
    avatar: avatarUrl('aiym-k-lingaphone-mom')
  },
  {
    name: 'Дамир И.',
    initials: 'ДИ',
    role: 'Папа ученика 6 класса · Алматы',
    text: 'Сын начинал с нуля, сейчас F2. За 3 года Lingaphone полностью поменяло его отношение к языку. Сдал IELTS 6.5 без репетиторов — спасибо методике!',
    result: 'Ноль → F2 → IELTS 6.5',
    accent: 'red',
    avatar: avatarUrl('damir-i-lingaphone-dad')
  }
]

const railRef = useTemplateRef<HTMLElement>('railRef')
const tilt = useTemplateRef<HTMLElement>('tilt')

useTilt(tilt, { max: 5 })

const idx = ref(0)
const move = (dir: -1 | 1) => {
  idx.value = (idx.value + dir + testimonials.length) % testimonials.length
}

const current = computed(() => testimonials[idx.value]!)
const next = computed(() => testimonials[(idx.value + 1) % testimonials.length]!)

useScrollReveal(railRef, { stagger: 90 })
</script>

<template>
  <section class="femo-section femo-test">
    <div class="femo-section-inner">
      <header class="femo-section-head">
        <span class="femo-chip femo-chip--ink">Отзывы родителей</span>
        <h2 class="femo-section-title femo-display">
          Что говорят родители<br>
          наших <span class="femo-text-coral">учеников</span>
        </h2>
      </header>

      <div class="femo-test-stage">
        <button
          class="femo-test-nav femo-test-nav--prev"
          aria-label="Предыдущий отзыв"
          @click="move(-1)"
        >
          <UIcon
            name="i-lucide-chevron-left"
            class="size-5"
          />
        </button>

        <div
          ref="tilt"
          class="femo-test-card"
          :class="`femo-test-card--${current.accent}`"
        >
          <div class="femo-test-card-stars">
            <UIcon
              v-for="i in 5"
              :key="i"
              name="i-lucide-star"
              class="size-4"
            />
          </div>

          <p class="femo-test-card-text">
            «{{ current.text }}»
          </p>

          <div class="femo-test-card-foot">
            <div class="femo-test-card-avatar">
              <img
                :src="current.avatar"
                :alt="current.name"
                loading="lazy"
              >
            </div>
            <div class="femo-test-card-meta">
              <p class="femo-test-card-name">
                {{ current.name }}
              </p>
              <p class="femo-test-card-role">
                {{ current.role }}
              </p>
            </div>
            <span class="femo-chip femo-chip--amber femo-test-card-result">
              {{ current.result }}
            </span>
          </div>
        </div>

        <div
          class="femo-test-card femo-test-card--ghost"
          :class="`femo-test-card--${next.accent}`"
          aria-hidden="true"
        >
          <div class="femo-test-card-stars">
            <UIcon
              v-for="i in 5"
              :key="i"
              name="i-lucide-star"
              class="size-4"
            />
          </div>
          <p class="femo-test-card-text">
            «{{ next.text }}»
          </p>
          <div class="femo-test-card-foot">
            <div class="femo-test-card-avatar">
              <img
                :src="next.avatar"
                :alt="next.name"
                loading="lazy"
              >
            </div>
            <div class="femo-test-card-meta">
              <p class="femo-test-card-name">
                {{ next.name }}
              </p>
              <p class="femo-test-card-role">
                {{ next.role }}
              </p>
            </div>
          </div>
        </div>

        <button
          class="femo-test-nav femo-test-nav--next"
          aria-label="Следующий отзыв"
          @click="move(1)"
        >
          <UIcon
            name="i-lucide-chevron-right"
            class="size-5"
          />
        </button>
      </div>

      <!-- Video testimonial placeholder — to be wired with real recording -->
      <div class="femo-test-video">
        <div class="femo-test-video-poster">
          <div class="femo-test-video-mascot">
            <FemiMascot
              state="celebrate"
              size="sm"
              silent
              ignore-reactions
            />
          </div>
          <button
            type="button"
            class="femo-test-video-play"
            aria-label="Смотреть видео-отзыв (скоро)"
          >
            <UIcon
              name="i-lucide-play"
              class="size-6"
            />
          </button>
        </div>
        <div class="femo-test-video-meta">
          <span class="femo-chip femo-chip--amber">Видео-отзыв</span>
          <p class="femo-test-video-title">
            «Сын сам напоминает мне про&nbsp;занятия»
          </p>
          <p class="femo-test-video-sub">
            Гульнара, мама ученика 3 класса, Алматы — 2 месяца на FEMO
          </p>
          <span class="femo-test-video-coming">скоро · в записи</span>
        </div>
      </div>

      <div
        ref="railRef"
        class="femo-test-rail"
      >
        <button
          v-for="(t, i) in testimonials"
          :key="t.name"
          class="femo-test-thumb stagger-item"
          :class="{ 'is-active': i === idx }"
          @click="idx = i"
        >
          <span class="femo-test-thumb-avatar">
            <img
              :src="t.avatar"
              :alt="t.name"
              loading="lazy"
            >
          </span>
          <span class="femo-test-thumb-name">{{ t.name }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.femo-test-stage {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  align-items: stretch;
}

@media (min-width: 1024px) {
  .femo-test-stage {
    grid-template-columns: auto 1.4fr 1fr auto;
    align-items: center;
  }
}

.femo-test-nav {
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-pill);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-femo-ink-700);
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  box-shadow: var(--shadow-soft);
  transition: all 0.3s var(--ease-out-expo);
  justify-self: start;
}

.femo-test-nav:hover {
  color: white;
  background: var(--gradient-hero);
  border-color: transparent;
  transform: translateY(-2px);
}

.femo-test-nav--prev { justify-self: start; }
.femo-test-nav--next { justify-self: end; }

@media (max-width: 1023px) {
  .femo-test-nav { display: none; }
}

.femo-test-card {
  position: relative;
  border-radius: var(--radius-hero);
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  box-shadow: var(--shadow-pop);
  padding: 2rem;
  display: grid;
  gap: 1.5rem;
  isolation: isolate;
  overflow: hidden;
}

.femo-test-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.06), transparent 60%);
  pointer-events: none;
  z-index: -1;
}

.femo-test-card--ghost {
  background: rgba(255, 255, 255, 0.55);
  box-shadow: var(--shadow-soft);
  transform: scale(0.94);
  opacity: 0.7;
  transition: all 0.5s var(--ease-out-expo);
}

@media (max-width: 1023px) {
  .femo-test-card--ghost { display: none; }
}

.femo-test-card-stars {
  display: inline-flex;
  gap: 0.2rem;
  color: var(--color-femo-amber-500);
}

.femo-test-card-text {
  font-family: var(--font-display);
  font-size: clamp(1.1rem, 1.5vw, 1.4rem);
  line-height: 1.45;
  color: var(--color-femo-ink-900);
  font-weight: 600;
  text-wrap: balance;
}

.femo-test-card-foot {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.85rem;
  align-items: center;
}

.femo-test-card-avatar {
  width: 2.8rem;
  height: 2.8rem;
  border-radius: var(--radius-pill);
  overflow: hidden;
  background: var(--gradient-hero);
  box-shadow: 0 6px 14px -4px rgba(220, 38, 38, 0.45);
  flex: none;
}

.femo-test-card-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.femo-test-card--coral .femo-test-card-avatar { background: var(--gradient-coral); }
.femo-test-card--amber .femo-test-card-avatar { background: linear-gradient(135deg, #FFC04D, #E58A06); }

.femo-test-card-name { font-weight: 700; color: var(--color-femo-ink-900); }
.femo-test-card-role { font-size: 0.82rem; color: var(--color-femo-ink-500); }
.femo-test-card-result { white-space: nowrap; }

@media (max-width: 540px) {
  .femo-test-card-result { display: none; }
}

/* Video testimonial placeholder */
.femo-test-video {
  margin-top: 1.5rem;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: center;
  padding: 0.85rem 1rem 0.85rem 0.85rem;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF7F4 100%);
  border: 1px solid var(--color-femo-red-100);
  border-radius: 1.2rem;
  box-shadow: var(--shadow-soft);
}

@media (max-width: 640px) {
  .femo-test-video { grid-template-columns: 1fr; text-align: center; gap: 0.7rem; }
}

.femo-test-video-poster {
  position: relative;
  width: 8rem;
  height: 5rem;
  border-radius: 0.85rem;
  background:
    radial-gradient(70% 100% at 50% 100%, rgba(250, 165, 26, 0.35), transparent 70%),
    linear-gradient(135deg, #FFE4D2 0%, #FFC8A6 100%);
  border: 1px solid var(--color-femo-red-200);
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

@media (max-width: 640px) {
  .femo-test-video-poster { width: 100%; height: 8rem; justify-self: center; }
}

.femo-test-video-mascot {
  position: absolute;
  bottom: -0.4rem;
  right: -0.4rem;
  opacity: 0.85;
}

.femo-test-video-play {
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  background: var(--gradient-hero);
  color: white;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 12px 24px -8px rgba(220, 38, 38, 0.5);
  position: relative;
  z-index: 1;
  transition: transform 0.3s var(--ease-out-expo);
  animation: test-video-pulse 2s ease-out infinite;
}

.femo-test-video-play:hover { transform: scale(1.1); }

@keyframes test-video-pulse {
  0%   { box-shadow: 0 12px 24px -8px rgba(220, 38, 38, 0.5), 0 0 0 0 rgba(220, 38, 38, 0.4); }
  100% { box-shadow: 0 12px 24px -8px rgba(220, 38, 38, 0.5), 0 0 0 16px rgba(220, 38, 38, 0); }
}

.femo-test-video-meta { display: grid; gap: 0.3rem; justify-items: start; }

@media (max-width: 640px) {
  .femo-test-video-meta { justify-items: center; }
}

.femo-test-video-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--color-femo-ink-900);
  letter-spacing: -0.01em;
  text-wrap: balance;
}

.femo-test-video-sub {
  font-size: 0.78rem;
  color: var(--color-femo-ink-600);
}

.femo-test-video-coming {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.15rem 0.5rem;
  background: var(--color-femo-ink-50);
  color: var(--color-femo-ink-500);
  border-radius: var(--radius-pill);
}

@media (prefers-reduced-motion: reduce) {
  .femo-test-video-play { animation: none; }
}

/* Thumbs rail */
.femo-test-rail {
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.femo-test-thumb {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.45rem 0.75rem 0.45rem 0.45rem;
  border-radius: var(--radius-pill);
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  cursor: pointer;
  transition: all 0.3s var(--ease-out-expo);
  font-size: 0.85rem;
  color: var(--color-femo-ink-700);
}

.femo-test-thumb-avatar {
  width: 1.8rem;
  height: 1.8rem;
  border-radius: var(--radius-pill);
  overflow: hidden;
  background: var(--color-femo-ink-50);
  flex: none;
}

.femo-test-thumb-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.femo-test-thumb.is-active {
  border-color: var(--color-femo-red-200);
  background: var(--color-femo-red-50);
  color: var(--color-femo-red-700);
}

.femo-test-thumb.is-active .femo-test-thumb-avatar {
  background: var(--gradient-hero);
  color: white;
}
</style>
