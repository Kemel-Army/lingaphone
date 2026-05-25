<script setup lang="ts">
import { useTemplateRef } from 'vue'

const containerRef = useTemplateRef<HTMLElement>('containerRef')
useScrollReveal(containerRef, { stagger: 60 })

// 4 ключевых принципа в виде компактных pill-карточек.
// Полный список (6 пунктов) отжали до 4 самых важных для родителя-покупателя.
const pillars = [
  { icon: 'i-lucide-shield-check', title: 'Без рекламы', accent: 'green' as const },
  { icon: 'i-lucide-message-circle-off', title: 'Без чужих чатов', accent: 'red' as const },
  { icon: 'i-lucide-graduation-cap', title: 'Только английский', accent: 'amber' as const },
  { icon: 'i-lucide-users', title: 'Полный родительский доступ', accent: 'blue' as const }
]

const accentClass = (a: string) => `is-${a}`
</script>

<template>
  <section
    id="safety"
    class="femo-section femo-safe"
  >
    <div class="femo-section-inner">
      <div
        ref="containerRef"
        class="femo-safe-card"
      >
        <!-- Left: header + pills -->
        <div class="femo-safe-meta">
          <span class="femo-chip femo-chip--ink">Безопасность</span>
          <h2 class="femo-safe-title femo-display">
            <span class="femo-text-gradient">Безопасно</span> для детей.<br>
            Прозрачно для родителей.
          </h2>
          <ul class="femo-safe-pills">
            <li
              v-for="p in pillars"
              :key="p.title"
              class="femo-safe-pill stagger-item"
              :class="accentClass(p.accent)"
            >
              <span class="femo-safe-pill-icon">
                <UIcon
                  :name="p.icon"
                  class="size-3.5"
                />
              </span>
              <span>{{ p.title }}</span>
            </li>
          </ul>
        </div>

        <!-- Right: trust badge -->
        <div class="femo-safe-trust">
          <div class="femo-safe-trust-icon">
            <UIcon
              name="i-lucide-shield-check"
              class="size-6"
            />
          </div>
          <div>
            <p class="femo-safe-trust-title">
              KOPPA · GDPR-K · Закон РК «О персональных данных»
            </p>
            <p class="femo-safe-trust-sub">
              Хостинг в Алматы (DC1) · шифрование на лету и в покое
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.femo-safe {
  background: linear-gradient(180deg, transparent 0%, #FFF7F4 100%);
}

.femo-safe-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1.25rem;
  align-items: center;
  padding: 1.4rem 1.65rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: var(--radius-card-lg);
  box-shadow: var(--shadow-soft);
}

@media (max-width: 768px) {
  .femo-safe-card {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1.2rem;
  }
}

.femo-safe-meta {
  display: grid;
  gap: 0.7rem;
  justify-items: start;
}

.femo-safe-title {
  font-size: clamp(1.4rem, 2.4vw, 1.85rem);
  color: var(--color-femo-ink-900);
  margin: 0;
  line-height: 1.15;
  text-wrap: balance;
}

.femo-safe-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.femo-safe-pill {
  --accent: var(--color-femo-red-600);
  --accent-soft: var(--color-femo-red-50);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.7rem;
  background: var(--accent-soft);
  border: 1px solid color-mix(in oklab, var(--accent) 25%, transparent);
  border-radius: var(--radius-pill);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--accent);
  white-space: nowrap;
  transition: transform 0.3s var(--ease-out-expo);
}

.femo-safe-pill:hover { transform: translateY(-2px); }

.femo-safe-pill.is-green { --accent: #047857; --accent-soft: #ECFDF5; }
.femo-safe-pill.is-blue  { --accent: #1E40AF; --accent-soft: #EFF6FF; }
.femo-safe-pill.is-amber { --accent: #B45309; --accent-soft: #FFFBEB; }
.femo-safe-pill.is-red   { --accent: var(--color-femo-red-700); --accent-soft: var(--color-femo-red-50); }

.femo-safe-pill-icon {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Trust badge — right side */
.femo-safe-trust {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.85rem;
  align-items: center;
  padding: 0.95rem 1.15rem;
  background: linear-gradient(135deg, #ECFDF5, #FFFFFF);
  border: 1px solid rgba(22, 163, 74, 0.18);
  border-radius: 1rem;
  max-width: 360px;
}

.femo-safe-trust-icon {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.7rem;
  background: linear-gradient(135deg, #34D399, #16A34A);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px -6px rgba(22, 163, 74, 0.45);
  flex: none;
}

.femo-safe-trust-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.78rem;
  color: var(--color-femo-ink-900);
  line-height: 1.25;
}

.femo-safe-trust-sub {
  font-size: 0.7rem;
  color: var(--color-femo-ink-600);
  margin-top: 0.2rem;
  line-height: 1.4;
}
</style>
