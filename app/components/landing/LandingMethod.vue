<script setup lang="ts">
const principles = [
  {
    index: 1,
    emoji: '🎤',
    label: 'Британский акцент',
    tagline: 'Правильное произношение с первого урока',
    desc: 'Мы учим британский акцент — стандарт мировых экзаменов. Постановка звуков, интонации и ритма речи с самого начала.',
    accent: '#0EA5E9'
  },
  {
    index: 2,
    emoji: '🎧',
    label: 'Метод наушников',
    tagline: 'Инновационная технология постановки произношения',
    desc: 'Уникальная разработка Lingaphone — ребёнок слышит свой голос и нативный акцент одновременно. Мозг быстро перестраивается.',
    accent: '#06B6D4'
  },
  {
    index: 3,
    emoji: '👥',
    label: 'Мини-группы',
    tagline: '3–6 детей в группе — максимум практики',
    desc: 'В больших группах дети молчат. В мини-группах каждый говорит на каждом уроке. Сверстники мотивируют друг друга.',
    accent: '#10B981'
  },
  {
    index: 4,
    emoji: '🚫',
    label: 'Без зазубривания',
    tagline: 'Язык — через контекст, а не наизусть',
    desc: 'Мы не заставляем учить слова списком. Дети усваивают лексику в живых ситуациях: диалоги, сторителлинг, ролевые игры.',
    accent: '#8B5CF6'
  },
  {
    index: 5,
    emoji: '💬',
    label: 'Speaking от урока 1',
    tagline: 'Первые слова — уже на первом уроке',
    desc: 'Уже на первом занятии ребёнок произносит реальные фразы. Мы строим уверенность в речи с первых минут, а не «сначала грамматика».',
    accent: '#F59E0B'
  },
  {
    index: 6,
    emoji: '🏆',
    label: 'Маркет достижений',
    tagline: 'Дети зарабатывают реальные деньги',
    desc: 'Ежемесячно лучшие ученики получают 🥇 5 000₸, 🥈 3 000₸ или 🥉 1 000₸. Мотивация через вознаграждение — без родительских угроз.',
    accent: '#D97706'
  }
]

const sectionRef = useTemplateRef<HTMLElement>('sectionRef')
useScrollReveal(sectionRef, { stagger: 80 })

const activeIndex = ref(0)
</script>

<template>
  <section
    id="method"
    ref="sectionRef"
    class="femo-section femo-method"
  >
    <div class="femo-section-inner">
      <header class="femo-section-head stagger-item">
        <span class="femo-chip">Британская методика</span>
        <h2 class="femo-section-title femo-display">
          Почему дети говорят<br>
          <span class="femo-text-gradient">по-британски?</span>
        </h2>
        <p class="femo-section-sub">
          6 принципов, которые отличают Lingaphone от всех других школ английского в Алматы.
          Наша методика работает с 2013 года.
        </p>
      </header>

      <!-- Principles grid -->
      <div class="lm-grid stagger-item">
        <article
          v-for="p in principles"
          :key="p.index"
          class="lm-card"
          :class="{ 'is-active': p.index - 1 === activeIndex }"
          :style="{ '--accent': p.accent }"
          @click="activeIndex = p.index - 1"
        >
          <header class="lm-card-head">
            <div
              class="lm-card-icon"
              :style="{ background: p.accent + '22', color: p.accent }"
            >
              <span
                class="lm-card-emoji"
                aria-hidden="true"
              >{{ p.emoji }}</span>
            </div>
            <span class="lm-card-num">{{ String(p.index).padStart(2, '0') }}</span>
          </header>

          <h3 class="lm-card-title">
            {{ p.label }}
          </h3>
          <p class="lm-card-tagline">
            {{ p.tagline }}
          </p>

          <Transition name="lm-expand">
            <p
              v-show="p.index - 1 === activeIndex"
              class="lm-card-desc"
            >
              {{ p.desc }}
            </p>
          </Transition>

          <div
            class="lm-card-glow"
            aria-hidden="true"
          />
        </article>
      </div>

      <!-- Bottom CTA strip -->
      <div class="lm-bottom stagger-item">
        <div class="lm-bottom-text">
          <span class="lm-bottom-logo">🦜</span>
          <span>Запишитесь на <strong>бесплатный пробный урок</strong> — и сами убедитесь в методике</span>
        </div>
        <NuxtLink
          to="https://wa.me/77761235703"
          external
          target="_blank"
          class="femo-btn-primary"
        >
          <UIcon
            name="i-lucide-message-circle"
            class="size-4"
          />
          <span>Записаться в WhatsApp</span>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.femo-method {
  padding-block: clamp(4rem, 8vw, 7rem);
}

.lm-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.85rem;
  margin-top: 3rem;
}

@media (min-width: 480px) {
  .lm-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
}

@media (min-width: 768px) {
  .lm-grid { grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
}

.lm-card {
  position: relative;
  border-radius: var(--radius-card-lg);
  background: var(--ui-bg-elevated);
  border: 1.5px solid var(--color-femo-ink-100);
  padding: 1.5rem 1.25rem;
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.35s var(--ease-out-expo),
    box-shadow 0.35s var(--ease-out-expo),
    border-color 0.35s var(--ease-out-expo);
  box-shadow: var(--shadow-soft);
}

.lm-card:hover,
.lm-card.is-active {
  transform: translateY(-4px);
  border-color: var(--accent);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--accent) 10%, transparent),
    0 20px 40px -12px color-mix(in srgb, var(--accent) 30%, transparent);
}

.lm-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.lm-card-icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.lm-card-num {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.4rem;
  letter-spacing: -0.04em;
  color: var(--color-femo-ink-100);
}

.lm-card.is-active .lm-card-num {
  color: color-mix(in srgb, var(--accent) 30%, transparent);
}

.lm-card-title {
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-femo-ink-900);
  margin: 0 0 0.35rem;
  line-height: 1.25;
}

.lm-card-tagline {
  font-size: 0.84rem;
  color: var(--color-femo-ink-600);
  line-height: 1.45;
  margin: 0;
}

.lm-card-desc {
  margin-top: 0.85rem;
  font-size: 0.82rem;
  color: var(--color-femo-ink-700);
  line-height: 1.55;
}

.lm-expand-enter-active,
.lm-expand-leave-active { transition: opacity 0.3s, transform 0.3s; }
.lm-expand-enter-from,
.lm-expand-leave-to    { opacity: 0; transform: translateY(-6px); }

.lm-card-glow {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(50% 60% at 50% 100%, color-mix(in srgb, var(--accent) 15%, transparent), transparent 80%);
  transition: opacity 0.4s;
}

.lm-card.is-active .lm-card-glow { opacity: 1; }

.lm-bottom {
  margin-top: 3rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1.5rem 2rem;
  border-radius: var(--radius-card-lg);
  background: linear-gradient(135deg, #E0F2FE, #F0F9FF);
  border: 1px solid rgba(14, 165, 233, 0.2);
}

@media (max-width: 640px) {
  .lm-bottom {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    padding: 1.25rem 1.25rem;
  }
  .lm-bottom-text { justify-content: center; }
  .lm-bottom :deep(.femo-btn-primary) { justify-content: center; width: 100%; }
}

.lm-bottom-text {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
  color: var(--color-femo-ink-700);
  line-height: 1.5;
}

.lm-bottom-logo { font-size: 1.4rem; flex: none; }

@media (prefers-reduced-motion: reduce) {
  .lm-card,
  .lm-expand-enter-active,
  .lm-expand-leave-active { transition: none; }
}
</style>
