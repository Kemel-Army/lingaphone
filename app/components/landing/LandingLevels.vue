<script setup lang="ts">
// Уровни Lingaphone: A1→F4 (собственная система школы)

const levelGroups = [
  {
    code: 'A1 – S1',
    label: 'Starter',
    emoji: '🌱',
    color: '#10B981',
    bg: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
    border: 'rgba(16, 185, 129, 0.3)',
    age: '5–7 лет',
    desc: 'Полный ноль. Первые слова, буквы, звуки. Игровой формат, много TPR-активностей.',
    skills: ['Алфавит', 'Цвета, числа', 'Базовые фразы', 'Песенки']
  },
  {
    code: 'A2 – S2',
    label: 'Elementary',
    emoji: '📖',
    color: '#0EA5E9',
    bg: 'linear-gradient(135deg, #E0F2FE, #BAE6FD)',
    border: 'rgba(14, 165, 233, 0.3)',
    age: '7–10 лет',
    desc: 'Базовый уровень. Дети говорят простыми предложениями, читают короткие тексты.',
    skills: ['Present Simple/Continuous', 'Описание картинок', 'Чтение A2', 'Диалоги']
  },
  {
    code: 'S3 – B2',
    label: 'Pre-Int / Intermediate',
    emoji: '🚀',
    color: '#8B5CF6',
    bg: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
    border: 'rgba(139, 92, 246, 0.3)',
    age: '10–14 лет',
    desc: 'Средний уровень. Свободно общаются на бытовые темы, пишут сочинения.',
    skills: ['Past/Future tenses', 'Conditional sentences', 'Эссе B1', 'Аудирование B2']
  },
  {
    code: 'F1 – F2',
    label: 'Upper-Intermediate',
    emoji: '⚡',
    color: '#F59E0B',
    bg: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
    border: 'rgba(245, 158, 11, 0.3)',
    age: '13–16 лет',
    desc: 'Продвинутый уровень. Смотрят фильмы на английском, общаются с носителями.',
    skills: ['Advanced Grammar', 'Academic Writing', 'IELTS preparation', 'Дискуссии']
  },
  {
    code: 'F3 – F4',
    label: 'Advanced',
    emoji: '🏆',
    color: '#D97706',
    bg: 'linear-gradient(135deg, #FFEDC9, #FFD98A)',
    border: 'rgba(217, 119, 6, 0.3)',
    age: '15+ лет',
    desc: 'Свободное владение. Готовность к IELTS, зарубежным университетам и работе.',
    skills: ['IELTS 7.0+', 'C1/C2 Grammar', 'Публичные выступления', 'Научные тексты']
  }
]

const activeGroup = ref(1)

const sectionRef = useTemplateRef<HTMLElement>('sectionRef')
useScrollReveal(sectionRef, { stagger: 80 })
</script>

<template>
  <section
    id="levels"
    ref="sectionRef"
    class="femo-section ll-section"
  >
    <div class="femo-section-inner">
      <!-- Header -->
      <header class="femo-section-head stagger-item">
        <span class="femo-chip">Уровни · A1 до F4</span>
        <h2 class="femo-section-title femo-display">
          Найдём ваш уровень и<br>
          <span class="femo-text-gradient">доведём до результата</span>
        </h2>
        <p class="femo-section-sub">
          Lingaphone использует собственную систему уровней от A1 до F4.
          Каждый ученик начинает с бесплатного теста.
        </p>
      </header>

      <!-- Level selector tabs -->
      <div class="ll-tabs stagger-item">
        <button
          v-for="(g, i) in levelGroups"
          :key="g.code"
          class="ll-tab"
          :class="{ 'is-active': activeGroup === i }"
          :style="activeGroup === i ? { background: g.bg, borderColor: g.border, color: g.color } : {}"
          @click="activeGroup = i"
        >
          <span class="ll-tab-emoji">{{ g.emoji }}</span>
          <span class="ll-tab-code">{{ g.code }}</span>
          <span class="ll-tab-label">{{ g.label }}</span>
        </button>
      </div>

      <!-- Active level detail -->
      <div
        class="ll-detail stagger-item"
        :style="{ background: levelGroups[activeGroup].bg, borderColor: levelGroups[activeGroup].border }"
      >
        <div class="ll-detail-left">
          <div class="ll-detail-emoji">
            {{ levelGroups[activeGroup].emoji }}
          </div>
          <div>
            <p
              class="ll-detail-code"
              :style="{ color: levelGroups[activeGroup].color }"
            >
              {{ levelGroups[activeGroup].code }}
            </p>
            <p class="ll-detail-label">
              {{ levelGroups[activeGroup].label }}
            </p>
            <p class="ll-detail-age">
              <UIcon
                name="i-lucide-users"
                class="size-3.5"
              />
              {{ levelGroups[activeGroup].age }}
            </p>
          </div>
        </div>
        <div class="ll-detail-right">
          <p class="ll-detail-desc">
            {{ levelGroups[activeGroup].desc }}
          </p>
          <ul class="ll-skills">
            <li
              v-for="s in levelGroups[activeGroup].skills"
              :key="s"
              class="ll-skill"
              :style="{ borderColor: levelGroups[activeGroup].border, color: levelGroups[activeGroup].color }"
            >
              <UIcon
                name="i-lucide-check"
                class="size-3 shrink-0"
              />
              {{ s }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom CTA -->
      <div class="ll-cta stagger-item">
        <p class="ll-cta-text">
          Не знаете свой уровень? Мы определим за 10 минут бесплатно.
        </p>
        <a
          href="https://wa.me/77761235703"
          target="_blank"
          rel="noopener noreferrer"
          class="femo-btn femo-btn--primary"
        >
          <UIcon
            name="i-lucide-message-circle"
            class="size-4"
          />
          Записаться на тест
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ll-section {
  padding-block: clamp(4rem, 8vw, 7rem);
}

/* Tabs */
.ll-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 2.5rem;
  justify-content: center;
}

.ll-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.85rem 1.25rem;
  border-radius: 1rem;
  border: 1.5px solid var(--color-femo-ink-100);
  background: var(--ui-bg-elevated);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 9rem;
}

.ll-tab:hover:not(.is-active) {
  border-color: var(--linga-primary);
  background: rgba(14, 165, 233, 0.05);
}

.ll-tab.is-active {
  box-shadow: 0 8px 24px -4px rgba(14, 165, 233, 0.25);
  transform: translateY(-2px);
}

.ll-tab-emoji { font-size: 1.5rem; line-height: 1; }
.ll-tab-code { font-weight: 800; font-size: 0.9rem; line-height: 1.2; }
.ll-tab-label { font-size: 0.72rem; color: var(--color-femo-ink-500); }

/* Detail card */
.ll-detail {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.75rem;
  margin-top: 1.5rem;
  padding: 2rem;
  border-radius: var(--radius-card-lg);
  border: 1.5px solid transparent;
  transition: all 0.3s ease;
}

@media (min-width: 640px) {
  .ll-detail { grid-template-columns: auto 1fr; }
}

.ll-detail-left {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
}

.ll-detail-emoji { font-size: 3rem; line-height: 1; }

.ll-detail-code {
  font-weight: 900;
  font-size: 1.25rem;
  font-family: var(--font-display);
}

.ll-detail-label {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-femo-ink-700);
  margin-top: 0.15rem;
}

.ll-detail-age {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--color-femo-ink-500);
  margin-top: 0.4rem;
}

.ll-detail-desc {
  font-size: 0.95rem;
  color: var(--color-femo-ink-700);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.ll-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.ll-skill {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.75rem;
  border-radius: 0.6rem;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.6);
  font-size: 0.82rem;
  font-weight: 600;
}

/* CTA */
.ll-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: 2.5rem;
  text-align: center;
}

@media (min-width: 640px) {
  .ll-cta { flex-direction: row; justify-content: center; }
}

.ll-cta-text {
  font-size: 0.95rem;
  color: var(--color-femo-ink-600);
}
</style>
