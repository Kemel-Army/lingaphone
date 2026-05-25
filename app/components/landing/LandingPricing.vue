<script setup lang="ts">
// Lingaphone pricing — offline Almaty, online, trial

const plans = [
  {
    id: 'trial',
    icon: '🎁',
    badge: 'С чего начать',
    title: 'Пробный урок',
    price: 'Бесплатно',
    period: '',
    highlight: false,
    color: '#10B981',
    bg: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
    border: 'rgba(16, 185, 129, 0.3)',
    features: [
      '45-минутный урок с учителем',
      'Тест уровня английского',
      'Знакомство с методикой',
      'Рекомендации по группе',
      'Без обязательств'
    ],
    cta: 'Записаться на пробный урок',
    ctaHref: 'https://wa.me/77761235703',
    note: ''
  },
  {
    id: 'offline',
    icon: '🏫',
    badge: 'Самый популярный',
    title: 'Офлайн · Алматы',
    price: '35 000₸',
    period: '/ месяц',
    highlight: true,
    color: '#0EA5E9',
    bg: 'linear-gradient(135deg, #E0F2FE, #BAE6FD)',
    border: 'rgba(14, 165, 233, 0.35)',
    features: [
      '2 урока в неделю по 60 мин',
      'Мини-группы 3–6 детей',
      'Британская методика',
      'Метод наушников',
      'Маркет достижений (XP + деньги)',
      '3 филиала в Алматы'
    ],
    cta: 'Записаться офлайн',
    ctaHref: 'https://wa.me/77761235703',
    note: 'Пробный урок — бесплатно'
  },
  {
    id: 'online',
    icon: '💻',
    badge: 'Для всего Казахстана',
    title: 'Онлайн',
    price: '25 000₸',
    period: '/ месяц',
    highlight: false,
    color: '#8B5CF6',
    bg: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
    border: 'rgba(139, 92, 246, 0.3)',
    features: [
      '2 урока в неделю по 60 мин',
      'Те же мини-группы онлайн',
      'Британская методика',
      'Маркет достижений',
      'Личный кабинет с прогрессом',
      'Подходит из любого города'
    ],
    cta: 'Записаться онлайн',
    ctaHref: 'https://wa.me/77761235703',
    note: 'Пробный урок — бесплатно'
  }
]

const sectionRef = useTemplateRef<HTMLElement>('sectionRef')
useScrollReveal(sectionRef, { stagger: 80 })
</script>

<template>
  <section
    id="pricing"
    ref="sectionRef"
    class="femo-section lp-section"
  >
    <div class="femo-section-inner">
      <!-- Header -->
      <header class="femo-section-head stagger-item">
        <span class="femo-chip">Форматы обучения</span>
        <h2 class="femo-section-title femo-display">
          Офлайн Алматы<br>
          <span class="femo-text-gradient">или онлайн — вся страна</span>
        </h2>
        <p class="femo-section-sub">
          Начните с бесплатного пробного урока. Без привязки карты. Без скрытых платежей.
        </p>
      </header>

      <!-- Plans grid -->
      <div class="lp-grid stagger-item">
        <article
          v-for="plan in plans"
          :key="plan.id"
          class="lp-card"
          :class="{ 'lp-card--highlight': plan.highlight }"
          :style="plan.highlight ? { background: plan.bg, borderColor: plan.border, boxShadow: '0 24px 48px -12px rgba(14,165,233,0.25)' } : {}"
        >
          <!-- Badge -->
          <div
            class="lp-badge"
            :style="{ color: plan.color }"
          >
            {{ plan.badge }}
          </div>

          <!-- Icon + Title -->
          <div class="lp-card-head">
            <span class="lp-icon">{{ plan.icon }}</span>
            <h3 class="lp-title">
              {{ plan.title }}
            </h3>
          </div>

          <!-- Price -->
          <div class="lp-price-row">
            <span
              class="lp-price"
              :style="{ color: plan.color }"
            >{{ plan.price }}</span>
            <span
              v-if="plan.period"
              class="lp-period"
            >{{ plan.period }}</span>
          </div>

          <!-- Features -->
          <ul class="lp-features">
            <li
              v-for="f in plan.features"
              :key="f"
              class="lp-feature"
            >
              <UIcon
                name="i-lucide-check"
                class="size-3.5 shrink-0"
                :style="{ color: plan.color }"
              />
              {{ f }}
            </li>
          </ul>

          <!-- CTA -->
          <a
            :href="plan.ctaHref"
            target="_blank"
            rel="noopener noreferrer"
            class="lp-cta-btn"
            :class="plan.highlight ? 'lp-cta-btn--primary' : 'lp-cta-btn--ghost'"
            :style="plan.highlight ? { background: plan.color } : { borderColor: plan.color, color: plan.color }"
          >
            <UIcon
              name="i-lucide-message-circle"
              class="size-4"
            />
            {{ plan.cta }}
          </a>

          <!-- Note -->
          <p
            v-if="plan.note"
            class="lp-note"
          >
            {{ plan.note }}
          </p>
        </article>
      </div>

      <!-- Market promo below -->
      <div class="lp-market-promo stagger-item">
        <span class="lp-market-emoji">🏆</span>
        <p class="lp-market-text">
          Во всех форматах действует <strong>Маркет достижений</strong> — дети получают реальные выплаты за высокие оценки
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lp-section {
  padding-block: clamp(4rem, 8vw, 7rem);
  background: linear-gradient(180deg, transparent, rgba(14, 165, 233, 0.03) 50%, transparent);
}

/* Grid */
.lp-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 3rem;
  align-items: stretch;
}

@media (min-width: 720px) {
  .lp-grid { grid-template-columns: repeat(3, 1fr); }
}

/* Card */
.lp-card {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 2rem 1.75rem;
  border-radius: var(--radius-card-lg);
  border: 1.5px solid var(--color-femo-ink-100);
  background: var(--ui-bg-elevated);
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.lp-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px -8px rgba(0, 0, 0, 0.08);
}

.lp-card--highlight {
  transform: translateY(-6px);
}

.lp-card--highlight:hover {
  transform: translateY(-10px);
}

/* Badge */
.lp-badge {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Head */
.lp-card-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.lp-icon { font-size: 2rem; line-height: 1; }
.lp-title { font-weight: 800; font-size: 1.1rem; color: var(--color-femo-ink-900); }

/* Price */
.lp-price-row { display: flex; align-items: baseline; gap: 0.35rem; }
.lp-price { font-family: var(--font-display); font-weight: 900; font-size: 1.75rem; }
.lp-period { font-size: 0.85rem; color: var(--color-femo-ink-500); }

/* Features */
.lp-features { display: grid; gap: 0.65rem; }
.lp-feature {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  color: var(--color-femo-ink-700);
}

/* CTA btn */
.lp-cta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1.25rem;
  border-radius: 0.85rem;
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
  margin-top: auto;
  width: 100%;
}

.lp-cta-btn:hover { opacity: 0.88; transform: scale(1.02); }

.lp-cta-btn--primary { color: #fff; }
.lp-cta-btn--ghost {
  background: transparent;
  border: 1.5px solid;
}

.lp-note {
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-femo-ink-500);
  margin-top: -0.5rem;
}

/* Market promo */
.lp-market-promo {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 2.5rem;
  padding: 1.25rem 1.75rem;
  border-radius: var(--radius-card-lg);
  background: linear-gradient(135deg, #FFEDC9, #FFF7E6);
  border: 1px solid rgba(217, 119, 6, 0.25);
}

@media (max-width: 480px) {
  .lp-market-promo { flex-direction: column; text-align: center; padding: 1.25rem; }
  .lp-card { padding: 1.5rem 1.25rem; }
}

.lp-market-emoji { font-size: 2rem; }
.lp-market-text { font-size: 0.9rem; color: #92400E; line-height: 1.5; }
</style>
