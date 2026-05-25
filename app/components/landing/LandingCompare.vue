<script setup lang="ts">
import { useTemplateRef } from 'vue'

const containerRef = useTemplateRef<HTMLElement>('containerRef')
useScrollReveal(containerRef, { stagger: 70 })

// Сравнение FEMO с обычным репетитором — это с кем родители
// КЗ нас реально сопоставляют, не со школой.

const rows = [
  {
    aspect: 'Доступность',
    classic: 'Только в назначенный час, 1–2 раза в неделю',
    femo: 'AI-тренер 24/7 — отвечает за 2 секунды',
    femoIcon: 'i-lucide-bot'
  },
  {
    aspect: 'Адаптация под уровень',
    classic: 'Один план на всех учеников',
    femo: '11 слоёв методики подстраиваются под ребёнка',
    femoIcon: 'i-lucide-layers'
  },
  {
    aspect: 'Проверка работ',
    classic: 'Ждать следующего урока, чтобы получить разбор',
    femo: 'AI разбирает текст / фото / голос мгновенно',
    femoIcon: 'i-lucide-scan-text'
  },
  {
    aspect: 'Мотивация ребёнка',
    classic: 'Из-под палки или за оценку',
    femo: 'Сам просит «ещё одну задачу» — XP, streak, маскот',
    femoIcon: 'i-lucide-gamepad-2'
  },
  {
    aspect: 'Прогресс родителю',
    classic: 'Со слов репетитора, раз в месяц',
    femo: 'Карта знаний + AI-отчёт каждую неделю',
    femoIcon: 'i-lucide-bar-chart-3'
  },
  {
    aspect: 'Стабильность качества',
    classic: 'Зависит от настроения и опыта',
    femo: 'Одинаковое качество всегда — это AI',
    femoIcon: 'i-lucide-shield-check'
  }
]

// Animated price counter for tutor side
const tutorPrice = ref(0)
const femoPrice = ref(0)
const counterStarted = ref(false)

const animateCounter = (target: Ref<number>, end: number, duration = 1100) => {
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - t, 3)
    target.value = Math.round(end * eased)
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

const sectionRef = useTemplateRef<HTMLElement>('sectionRef')

onMounted(() => {
  if (!sectionRef.value) return
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !counterStarted.value) {
        counterStarted.value = true
        animateCounter(tutorPrice, 80000)
        animateCounter(femoPrice, 9900)
        io.disconnect()
      }
    })
  }, { threshold: 0.3 })
  io.observe(sectionRef.value)
})

const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/,/g, ' ')
</script>

<template>
  <section
    id="compare"
    ref="sectionRef"
    class="femo-section femo-cmp"
  >
    <div class="femo-section-inner">
      <header class="femo-section-head">
        <span class="femo-chip femo-chip--ink">Lingaphone vs репетитор</span>
        <h2 class="femo-section-title">
          В <span class="femo-text-gradient">8 раз дешевле</span> репетитора.<br>
          И не привязан к расписанию.
        </h2>
        <p class="femo-section-sub">
          Родители КЗ платят 60–100 тыс. ₸ в месяц за частного репетитора по английскому. Мы делаем то же — лучше — за тариф мобильного интернета.
        </p>
      </header>

      <!-- ───── Price hero — animated counters ───── -->
      <div class="femo-cmp-hero stagger-item">
        <!-- Tutor side (muted) -->
        <div class="femo-cmp-side femo-cmp-side--tutor">
          <div class="femo-cmp-side-head">
            <span class="femo-cmp-emoji">👤</span>
            <div>
              <p class="femo-cmp-side-name">
                Частный репетитор
              </p>
              <p class="femo-cmp-side-sub">
                как делает большинство
              </p>
            </div>
          </div>
          <div class="femo-cmp-price">
            <span class="femo-cmp-price-num">{{ fmt(tutorPrice) }}</span>
            <span class="femo-cmp-price-cur">₸/мес</span>
          </div>
          <div class="femo-cmp-perks femo-cmp-perks--tutor">
            <span>📅 1–2 раза в неделю</span>
            <span>⏰ Только в час «икс»</span>
            <span>🎲 Качество как повезёт</span>
          </div>
        </div>

        <!-- VS divider -->
        <div class="femo-cmp-vs">
          <div class="femo-cmp-vs-circle">
            VS
          </div>
          <div class="femo-cmp-saving">
            <UIcon
              name="i-lucide-trending-down"
              class="size-3.5"
            />
            <span><strong>−87%</strong> в месяц</span>
          </div>
        </div>

        <!-- FEMO side (vibrant) -->
        <div class="femo-cmp-side femo-cmp-side--femo">
          <div class="femo-cmp-glow" />
          <div class="femo-cmp-side-head">
            <FemoBrandMark
              size="sm"
              :show-wordmark="false"
            />
            <div>
              <p class="femo-cmp-side-name">
                Lingaphone AI Pro
              </p>
              <p class="femo-cmp-side-sub">
                AI-тренер 24/7 + 9 механик
              </p>
            </div>
            <span class="femo-cmp-pick">выгоднее</span>
          </div>
          <div class="femo-cmp-price femo-cmp-price--femo">
            <span class="femo-cmp-price-num">{{ fmt(femoPrice) }}</span>
            <span class="femo-cmp-price-cur">₸/мес</span>
          </div>
          <div class="femo-cmp-perks femo-cmp-perks--femo">
            <span>♾ Безлимит сессий</span>
            <span>⚡ Ответ за 2 секунды</span>
            <span>🎯 Адаптация под уровень</span>
          </div>
        </div>
      </div>

      <!-- ───── Comparison rows ───── -->
      <div
        ref="containerRef"
        class="femo-cmp-grid"
      >
        <article
          v-for="row in rows"
          :key="row.aspect"
          class="femo-cmp-row stagger-item"
        >
          <span class="femo-cmp-aspect">
            {{ row.aspect }}
          </span>
          <div class="femo-cmp-row-bad">
            <span class="femo-cmp-row-mark femo-cmp-row-mark--bad">
              <UIcon
                name="i-lucide-x"
                class="size-3"
              />
            </span>
            <span>{{ row.classic }}</span>
          </div>
          <div class="femo-cmp-row-good">
            <span class="femo-cmp-row-mark femo-cmp-row-mark--good">
              <UIcon
                :name="row.femoIcon"
                class="size-3"
              />
            </span>
            <span>{{ row.femo }}</span>
          </div>
        </article>
      </div>

      <!-- ───── Bottom payoff ───── -->
      <div class="femo-cmp-foot">
        <p class="femo-cmp-foot-text">
          <span class="femo-cmp-foot-emoji">💡</span>
          За цену <strong>1 урока с репетитором</strong> ребёнок получает <strong>месяц безлимитного AI-тренера</strong>, маскота, карту знаний и геймификацию.
        </p>
        <NuxtLink
          to="/register"
          class="femo-btn-primary femo-cmp-foot-btn"
        >
          <span>Попробовать Lingaphone</span>
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
.femo-cmp {
  background:
    radial-gradient(50% 40% at 80% 20%, rgba(220, 38, 38, 0.06), transparent 70%),
    radial-gradient(40% 50% at 20% 80%, rgba(250, 165, 26, 0.05), transparent 70%);
  padding: clamp(1.75rem, 3.5vw, 3rem) 0;
}

/* Tighter header for this section — title is short, no need for big breathing room */
.femo-cmp :deep(.femo-section-head) {
  margin-bottom: 1.1rem;
  max-width: 720px;
  gap: 0.55rem;
}

.femo-cmp :deep(.femo-section-title) {
  font-size: clamp(1.55rem, 3vw, 2.2rem);
}

.femo-cmp :deep(.femo-section-sub) {
  font-size: 0.92rem;
}

/* ───── Price hero diptych ───── */
.femo-cmp-hero {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0.7rem;
  align-items: stretch;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .femo-cmp-hero {
    grid-template-columns: 1fr;
    gap: 0.65rem;
  }
}

.femo-cmp-side {
  position: relative;
  padding: 1.1rem 1.15rem;
  border-radius: 1.4rem;
  display: grid;
  gap: 0.7rem;
  align-content: start;
  overflow: hidden;
}

.femo-cmp-side--tutor {
  background: linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%);
  border: 1px solid var(--color-femo-ink-200);
  color: var(--color-femo-ink-700);
}

.femo-cmp-side--femo {
  background:
    radial-gradient(60% 80% at 100% 0%, rgba(250, 165, 26, 0.18), transparent 70%),
    linear-gradient(135deg, #FFFFFF 0%, #FFF1F0 60%, #FFE4D2 100%);
  border: 1px solid var(--color-femo-red-200);
  box-shadow: 0 14px 32px -14px rgba(220, 38, 38, 0.3);
}

.femo-cmp-glow {
  position: absolute;
  top: -3rem;
  right: -3rem;
  width: 8rem;
  height: 8rem;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.35), transparent 65%);
  pointer-events: none;
  animation: femo-cmp-glow 3s ease-in-out infinite;
}

@keyframes femo-cmp-glow {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50%      { transform: scale(1.15); opacity: 1; }
}

.femo-cmp-side-head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.65rem;
  align-items: center;
}

.femo-cmp-emoji {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.75rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-200);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}

.femo-cmp-side-name {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1rem;
  color: var(--color-femo-ink-900);
  line-height: 1.1;
}

.femo-cmp-side-sub {
  font-size: 0.72rem;
  color: var(--color-femo-ink-500);
  margin-top: 0.15rem;
  font-weight: 500;
}

.femo-cmp-side--femo .femo-cmp-side-sub { color: var(--color-femo-red-700); font-weight: 600; }

.femo-cmp-pick {
  align-self: start;
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.18rem 0.45rem;
  background: var(--gradient-hero);
  color: white;
  border-radius: 999px;
  box-shadow: 0 4px 10px -2px rgba(220, 38, 38, 0.5);
  animation: femo-cmp-pick 2.4s ease-in-out infinite;
}

@keyframes femo-cmp-pick {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-2px); }
}

/* Price */
.femo-cmp-price {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  padding: 0.85rem 1rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 0.95rem;
  font-variant-numeric: tabular-nums;
}

.femo-cmp-price-num {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(1.7rem, 3.5vw, 2.4rem);
  color: var(--color-femo-ink-900);
  line-height: 1;
  letter-spacing: -0.02em;
}

.femo-cmp-price-cur {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-femo-ink-500);
}

.femo-cmp-side--tutor .femo-cmp-price-num {
  color: var(--color-femo-ink-500);
  text-decoration: line-through;
  text-decoration-color: rgba(239, 68, 56, 0.5);
  text-decoration-thickness: 3px;
}

.femo-cmp-price--femo {
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF7F4 100%);
  border-color: var(--color-femo-red-200);
}

.femo-cmp-price--femo .femo-cmp-price-num {
  background: var(--gradient-hero);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Perks chips */
.femo-cmp-perks {
  display: grid;
  gap: 0.3rem;
}

.femo-cmp-perks span {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.55rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 0.55rem;
  font-size: 0.78rem;
  font-weight: 600;
}

.femo-cmp-perks--tutor span { color: var(--color-femo-ink-600); border: 1px dashed var(--color-femo-ink-200); }
.femo-cmp-perks--femo span  { color: var(--color-femo-ink-800); border: 1px solid var(--color-femo-red-100); background: rgba(255, 255, 255, 0.85); }

/* VS */
.femo-cmp-vs {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 0.55rem;
  padding: 0 0.4rem;
}

@media (max-width: 768px) {
  .femo-cmp-vs { grid-auto-flow: column; padding: 0.4rem 0; gap: 0.7rem; }
}

.femo-cmp-vs-circle {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-200);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.85rem;
  color: var(--color-femo-ink-700);
  letter-spacing: 0.04em;
  box-shadow: var(--shadow-soft);
}

.femo-cmp-saving {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  background: linear-gradient(135deg, #ECFDF5, #BBF7D0);
  border-radius: 999px;
  font-size: 0.7rem;
  color: #047857;
  font-weight: 600;
  white-space: nowrap;
}

.femo-cmp-saving strong { font-weight: 800; font-size: 0.78rem; }

/* ───── Comparison grid ───── */
.femo-cmp-grid {
  display: grid;
  gap: 0.55rem;
}

.femo-cmp-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1.5fr;
  gap: 0.6rem;
  align-items: center;
  padding: 0.7rem 0.85rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 0.95rem;
  transition:
    transform 0.4s var(--ease-out-expo),
    box-shadow 0.4s var(--ease-out-expo),
    border-color 0.4s var(--ease-out-expo);
}

.femo-cmp-row:hover {
  transform: translateY(-2px);
  border-color: var(--color-femo-red-200);
  box-shadow: 0 14px 28px -14px rgba(220, 38, 38, 0.2);
}

@media (max-width: 768px) {
  .femo-cmp-row {
    grid-template-columns: 1fr;
    gap: 0.4rem;
  }
}

.femo-cmp-aspect {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--color-femo-ink-900);
}

.femo-cmp-row-bad,
.femo-cmp-row-good {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.55rem;
  align-items: center;
  font-size: 0.8rem;
  line-height: 1.45;
  padding: 0.5rem 0.7rem;
  border-radius: 0.7rem;
}

.femo-cmp-row-bad {
  background: #F8FAFC;
  border: 1px dashed var(--color-femo-ink-200);
  color: var(--color-femo-ink-600);
}

.femo-cmp-row-good {
  background: linear-gradient(135deg, #FFF1F0, #FFE4D2);
  border: 1px solid var(--color-femo-red-200);
  color: var(--color-femo-ink-900);
  font-weight: 600;
}

.femo-cmp-row-mark {
  width: 1.3rem;
  height: 1.3rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.femo-cmp-row-mark--bad { background: var(--color-femo-ink-200); color: var(--color-femo-ink-500); }
.femo-cmp-row-mark--good { background: var(--gradient-hero); color: white; box-shadow: 0 4px 8px -2px rgba(220, 38, 38, 0.45); }

.femo-cmp-row:hover .femo-cmp-row-good { transform: translateX(2px); }

/* ───── Foot ───── */
.femo-cmp-foot {
  margin-top: 1.1rem;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 0.85rem 1.15rem;
  background:
    radial-gradient(50% 80% at 100% 0%, rgba(250, 165, 26, 0.18), transparent 70%),
    linear-gradient(135deg, #FFFFFF 0%, #FFF1F0 60%, #FFE4D2 100%);
  border: 1px solid var(--color-femo-red-100);
  border-radius: 1.2rem;
  box-shadow: var(--shadow-soft);
}

@media (max-width: 768px) {
  .femo-cmp-foot { grid-template-columns: 1fr; text-align: center; gap: 0.65rem; }
}

.femo-cmp-foot-text {
  font-size: 0.92rem;
  color: var(--color-femo-ink-800);
  line-height: 1.5;
  display: inline-flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.femo-cmp-foot-emoji { font-size: 1.2rem; flex: none; }
.femo-cmp-foot-text strong { color: var(--color-femo-red-700); font-weight: 800; }
.femo-cmp-foot-btn { white-space: nowrap; }

@media (prefers-reduced-motion: reduce) {
  .femo-cmp-glow,
  .femo-cmp-pick { animation: none; }
}
</style>
