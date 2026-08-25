<script setup lang="ts">
// Lingaphone pricing — 4 tariffs (approved price list, Aug 2026)

interface PriceRow {
  label?: string
  value: string
}

interface PlanFeature {
  text: string
  included: boolean
  badge?: string
}

interface Plan {
  id: string
  number: string
  name: string
  oldPrice?: string
  priceRows: PriceRow[]
  format: string
  stats: { value: string, label: string }[]
  features: PlanFeature[]
  warnings: string[]
  highlight: boolean
  color: string
}

const plans: Plan[] = [
  {
    id: 'lite',
    number: '1 Тариф',
    name: '«Лайт»',
    oldPrice: '75 000 тг/мес',
    priceRows: [{ value: '46 000 ₸' }],
    format: 'онлайн/офлайн',
    stats: [
      { value: '12', label: 'часов обучения в группе онлайн или офлайн' },
      { value: '3', label: 'занятия в неделю (по 60 минут)' }
    ],
    color: '#8B5CF6',
    highlight: false,
    features: [
      { text: 'Обратная связь от преподавателя', included: true },
      { text: 'Интерактивная онлайн-платформа с адаптивными заданиями', included: true },
      { text: 'Тех поддержка и помощь в работе с компьютером', included: true },
      { text: 'Обучение офлайн с использованием лингафонного оборудования', included: true },
      { text: '3D диктанты на английском в интерактивном подходе с проверкой орфографии, произношения и перевода', included: true },
      { text: 'Бесплатное участие в Speaking Club', included: false },
      { text: 'Возможность заморозки', included: false },
      { text: 'Возможность перерасчета', included: false },
      { text: 'Возможность отработки пропущенных занятий', included: false },
      { text: 'Персональная техподдержка и помощь в работе с компьютером', included: false },
      { text: 'Анимированные игры с геймофикацией, квизы, озвученный носителями словарный запас для вовлечения ребенка в процесс изучения языка', included: false },
      { text: 'Помощь в школьной программе', included: false },
      { text: 'Индивидуальные занятия для работы над слабыми сторонами', included: false },
      { text: 'Персональный куратор для ребенка', included: false }
    ],
    warnings: [
      'Пропуски сгорают. При наличии справки максимальное количество отработок — 3 отработки (без переноса) по 30 минут.',
      'Возврата нет'
    ]
  },
  {
    id: 'lite-plus',
    number: '2 Тариф',
    name: '«Лайт Плюс»',
    oldPrice: '85 000 тг/мес',
    priceRows: [{ value: '51 750 ₸' }],
    format: 'онлайн/офлайн',
    stats: [
      { value: '12', label: 'часов обучения в группе онлайн или офлайн' },
      { value: '3', label: 'занятия в неделю (по 60 минут)' },
      { value: '8', label: 'группы до 8 человек' }
    ],
    color: '#0EA5E9',
    highlight: false,
    features: [
      { text: 'Обратная связь от преподавателя', included: true },
      { text: 'Скидка на учебные материалы', included: true, badge: '30%' },
      { text: 'Интерактивная онлайн-платформа с адаптивными заданиями', included: true },
      { text: 'Тех поддержка и помощь в работе с компьютером', included: true },
      { text: 'Ежемесячное тестирование прогресса', included: true },
      { text: 'Работа над ошибками в группе', included: true },
      { text: '3D диктанты на английском в интерактивном подходе с проверкой орфографии, произношения и перевода', included: true },
      { text: 'Обучение офлайн с использованием лингафонного оборудования', included: true },
      { text: 'Бесплатное участие в Speaking Club', included: true },
      { text: 'Участие в праздничных мероприятиях школы не только ребенка, но и родителей', included: true },
      { text: 'Ежемесячная высылка видео о прогрессе (так же тест)', included: true },
      { text: 'Возможность заморозки', included: true },
      { text: 'Возможность отработки 2 раза в год (без переноса)', included: true },
      { text: 'Помощь в школьной программе', included: false },
      { text: 'Анимированные игры с геймофикацией, квизы, озвученный носителями словарный запас для вовлечения ребенка в процесс изучения языка', included: false },
      { text: 'Индивидуальные занятия для работы над слабыми сторонами', included: false },
      { text: 'Персональный куратор для ребенка', included: false }
    ],
    warnings: [
      'Пропуски сгорают. При наличии справки максимальное количество отработок — 3 отработки по 30 минут.',
      'Возврата нет'
    ]
  },
  {
    id: 'comfort',
    number: '3 Тариф',
    name: '«Комфорт»',
    oldPrice: '97 000 тг/мес',
    priceRows: [
      { label: 'оффлайн', value: '78 200 ₸' },
      { label: 'онлайн', value: '72 850 ₸' }
    ],
    format: '',
    stats: [
      { value: '12+1', label: 'часов обучения в группе онлайн или офлайн' },
      { value: '3', label: 'занятия в неделю (по 60 минут)' },
      { value: '8', label: 'группы до 8 человек' }
    ],
    color: '#10B981',
    highlight: true,
    features: [
      { text: 'Анимированные игры с геймофикацией, квизы, озвученный носителями словарный запас для вовлечения ребенка в процесс изучения языка, игровой подход в произношении английских слов и усиление восприятия на слух', included: true },
      { text: 'Расширенный доступ к онлайн-платформе с интерактивными заданиями, озвученными носителями для детей', included: true },
      { text: '3D диктанты на английском в интерактивном подходе с проверкой орфографии, произношения и перевода', included: true },
      { text: 'Ежемесячное тестирование прогресса', included: true },
      { text: 'Обратная связь от преподавателя', included: true },
      { text: 'Скидка на учебные материалы', included: true, badge: '40%' },
      { text: 'Обучение офлайн с использованием лингафонного оборудования', included: true },
      { text: 'Персональная техподдержка и помощь в работе с компьютером', included: true },
      { text: 'Возможность получать вашему ребенку денежное вознаграждение за успехи', included: true },
      { text: 'Еженедельные бесплатные разговорные клубы Speaking Club', included: true },
      { text: 'Ежемесячные отчеты о прогрессе для родителей с подробным анализом успеваемости', included: true },
      { text: 'Возможность заморозки', included: true },
      { text: 'Возможность отработки пропущенных занятий', included: true },
      { text: 'Возможность перерасчета', included: true },
      { text: 'Праздничные уроки с угощениями и подарками (Хэлоуин, Новый год и другие)', included: true },
      { text: 'Помощь в школьной программе', included: false },
      { text: 'Индивидуальные занятия для работы над слабыми сторонами', included: false },
      { text: 'Персональный куратор для ребенка', included: false }
    ],
    warnings: []
  },
  {
    id: 'vip',
    number: '4 Тариф',
    name: '«VIP»',
    priceRows: [{ value: '180 000 тг/мес' }],
    format: 'онлайн/офлайн',
    stats: [
      { value: '12+1', label: 'часов обучения в группе онлайн или офлайн' },
      { value: '3', label: 'занятия в неделю (по 60 минут)' }
    ],
    color: '#F59E0B',
    highlight: false,
    features: [
      { text: 'Анимированные игры с геймофикацией, квизы, озвученный носителями словарный запас для вовлечения ребенка в процесс изучения языка, игровой подход в произношении английских слов и усиление восприятия на слух', included: true },
      { text: 'Расширенный доступ к онлайн-платформе с интерактивными заданиями, озвученными носителями для детей', included: true },
      { text: 'Помощь в школьной программе', included: true },
      { text: 'Индивидуальные занятия для работы над слабыми сторонами', included: true },
      { text: 'Персональный куратор для ребенка', included: true },
      { text: 'Бесплатные учебные материалы', included: true },
      { text: '3D диктанты на английском в интерактивном подходе с проверкой орфографии, произношения и перевода', included: true },
      { text: 'Ежемесячное тестирование прогресса', included: true },
      { text: 'Обратная связь от преподавателя', included: true },
      { text: 'Обучение офлайн с использованием лингафонного оборудования', included: true },
      { text: 'Персональная техподдержка и помощь в работе с компьютером', included: true },
      { text: 'Возможность получать вашему ребенку денежное вознаграждение за успехи', included: true },
      { text: 'Еженедельные бесплатные разговорные клубы Speaking Club', included: true },
      { text: 'Ежемесячные отчеты о прогрессе для родителей с подробным анализом успеваемости', included: true },
      { text: 'Возможность заморозки', included: true },
      { text: 'Возможность отработки пропущенных занятий', included: true },
      { text: 'Возможность перерасчета', included: true },
      { text: 'Праздничные уроки с угощениями и подарками (Хэлоуин, Новый год и другие)', included: true },
      { text: 'Брендированная продукция школы Lingaphone', included: true }
    ],
    warnings: []
  }
]

const ctaHref = 'https://wa.me/77761235703'

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
        <span class="femo-chip">Тарифы</span>
        <h2 class="femo-section-title femo-display">
          Выберите тариф,<br>
          <span class="femo-text-gradient">который подходит вашему ребёнку</span>
        </h2>
        <p class="femo-section-sub">
          От «Лайт» до «VIP» — офлайн в Алматы или онлайн из любого города.
        </p>
      </header>

      <!-- Plans grid -->
      <div class="lp-grid stagger-item">
        <article
          v-for="plan in plans"
          :key="plan.id"
          class="lp-card"
          :class="{ 'lp-card--highlight': plan.highlight }"
          :style="{ '--plan-color': plan.color }"
        >
          <!-- Head -->
          <div class="lp-card-head">
            <span
              class="lp-number"
              :style="{ color: plan.color }"
            >{{ plan.number }}</span>
            <h3 class="lp-title">
              {{ plan.name }}
            </h3>
          </div>

          <!-- Price -->
          <div class="lp-price-block">
            <span
              v-if="plan.oldPrice"
              class="lp-old-price"
            >{{ plan.oldPrice }}</span>
            <div
              v-for="row in plan.priceRows"
              :key="row.value"
              class="lp-price-row"
            >
              <span
                class="lp-price"
                :style="{ color: plan.color }"
              >{{ row.value }}</span>
              <span
                v-if="row.label"
                class="lp-price-label"
              >/{{ row.label }}</span>
            </div>
            <span
              v-if="plan.format"
              class="lp-format"
            >{{ plan.format }}</span>
          </div>

          <!-- Stats -->
          <div class="lp-stats">
            <div
              v-for="stat in plan.stats"
              :key="stat.label"
              class="lp-stat"
            >
              <span
                class="lp-stat-value"
                :style="{ color: plan.color }"
              >{{ stat.value }}</span>
              <span class="lp-stat-label">{{ stat.label }}</span>
            </div>
          </div>

          <!-- Features -->
          <ul class="lp-features">
            <li
              v-for="f in plan.features"
              :key="f.text"
              class="lp-feature"
              :class="{ 'lp-feature--excluded': !f.included }"
            >
              <UIcon
                :name="f.included ? 'i-lucide-check' : 'i-lucide-x'"
                class="size-3.5 shrink-0"
                :style="f.included ? { color: plan.color } : {}"
              />
              <span>{{ f.text }}</span>
              <span
                v-if="f.badge"
                class="lp-feature-badge"
                :style="{ background: plan.color }"
              >{{ f.badge }}</span>
            </li>
          </ul>

          <!-- Warnings -->
          <ul
            v-if="plan.warnings.length"
            class="lp-warnings"
          >
            <li
              v-for="w in plan.warnings"
              :key="w"
              class="lp-warning"
            >
              <UIcon
                name="i-lucide-triangle-alert"
                class="size-3.5 shrink-0"
              />
              <span>{{ w }}</span>
            </li>
          </ul>

          <!-- CTA -->
          <a
            :href="ctaHref"
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
            Записаться на {{ plan.name }}
          </a>
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
  .lp-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1200px) {
  .lp-grid { grid-template-columns: repeat(4, 1fr); }
}

/* Card */
.lp-card {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.75rem 1.5rem;
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
  border-color: var(--plan-color);
  box-shadow: 0 24px 48px -12px color-mix(in srgb, var(--plan-color) 25%, transparent);
  transform: translateY(-6px);
}

.lp-card--highlight:hover {
  transform: translateY(-10px);
}

/* Head */
.lp-card-head { display: flex; flex-direction: column; gap: 0.15rem; }
.lp-number {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.lp-title { font-weight: 800; font-size: 1.15rem; color: var(--color-femo-ink-900); }

/* Price */
.lp-price-block { display: flex; flex-direction: column; gap: 0.15rem; }
.lp-old-price {
  font-size: 0.85rem;
  color: var(--color-femo-ink-400);
  text-decoration: line-through;
}
.lp-price-row { display: flex; align-items: baseline; gap: 0.3rem; }
.lp-price { font-family: var(--font-display); font-weight: 900; font-size: 1.6rem; }
.lp-price-label { font-size: 0.8rem; color: var(--color-femo-ink-500); }
.lp-format { font-size: 0.78rem; color: var(--color-femo-ink-500); }

/* Stats */
.lp-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 0.5rem;
  padding: 0.85rem 0;
  border-top: 1px solid var(--color-femo-ink-100);
  border-bottom: 1px solid var(--color-femo-ink-100);
}
.lp-stat { display: flex; flex-direction: column; gap: 0.15rem; }
.lp-stat-value { font-family: var(--font-display); font-weight: 900; font-size: 1.25rem; }
.lp-stat-label { font-size: 0.68rem; line-height: 1.25; color: var(--color-femo-ink-500); }

/* Features */
.lp-features { display: grid; gap: 0.55rem; }
.lp-feature {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.82rem;
  line-height: 1.35;
  color: var(--color-femo-ink-700);
}
.lp-feature svg { margin-top: 0.15rem; }
.lp-feature--excluded {
  color: var(--color-femo-ink-400);
  text-decoration: line-through;
}
.lp-feature-badge {
  flex-shrink: 0;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
}

/* Warnings */
.lp-warnings { display: grid; gap: 0.4rem; }
.lp-warning {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  font-size: 0.75rem;
  line-height: 1.35;
  color: #B45309;
}
.lp-warning svg { margin-top: 0.15rem; }

/* CTA btn */
.lp-cta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1.25rem;
  border-radius: 0.85rem;
  font-weight: 700;
  font-size: 0.85rem;
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
