<script setup lang="ts">
import { useTemplateRef } from 'vue'

const ctaRef = useTemplateRef<HTMLAnchorElement>('ctaRef')
useMagnetic(ctaRef, { strength: 0.3, radius: 160 })
</script>

<template>
  <section class="femo-cta-section">
    <div class="femo-cta">
      <div
        class="femo-cta-mesh"
        aria-hidden="true"
      >
        <FemoMeshBg />
      </div>

      <div class="femo-cta-inner">
        <span class="femo-chip femo-cta-chip">
          <UIcon
            name="i-lucide-sparkles"
            class="size-3.5"
          />
          Запись за 1 минуту
        </span>

        <h2 class="femo-cta-title femo-display">
          Запишите ребёнка<br>
          <span class="femo-text-gradient">на пробный урок</span><br>
          бесплатно
        </h2>

        <p class="femo-cta-sub">
          Определим уровень, познакомимся с учителем и методикой.
          Британский акцент с первого урока, без обязательств.
        </p>

        <div class="femo-cta-actions">
          <a
            ref="ctaRef"
            href="https://wa.me/77761235703"
            target="_blank"
            rel="noopener noreferrer"
            class="femo-btn-primary femo-cta-primary"
          >
            <span>Записаться в WhatsApp</span>
            <UIcon
              name="i-lucide-message-circle"
              class="size-5"
            />
          </a>

          <a
            href="https://www.instagram.com/lingaphone.kz"
            target="_blank"
            rel="noopener noreferrer"
            class="femo-btn-ghost"
          >
            <span>Наш Instagram</span>
            <UIcon
              name="i-lucide-instagram"
              class="size-4"
            />
          </a>
        </div>

        <div class="femo-cta-trust">
          <div class="femo-cta-trust-item">
            <UIcon
              name="i-lucide-shield-check"
              class="size-4 text-emerald-600"
            />
            Бесплатно
          </div>
          <div class="femo-cta-trust-item">
            <UIcon
              name="i-lucide-clock"
              class="size-4 text-emerald-600"
            />
            Без обязательств
          </div>
          <div class="femo-cta-trust-item">
            <UIcon
              name="i-lucide-credit-card"
              class="size-4 text-emerald-600"
            />
            Без привязки карты
          </div>
        </div>
      </div>

      <!-- Decorative confetti dots -->
      <div
        class="femo-cta-confetti femo-cta-confetti--1"
        aria-hidden="true"
      />
      <div
        class="femo-cta-confetti femo-cta-confetti--2"
        aria-hidden="true"
      />
      <div
        class="femo-cta-confetti femo-cta-confetti--3"
        aria-hidden="true"
      />
    </div>
  </section>
</template>

<style scoped>
.femo-cta-section {
  position: relative;
  padding: clamp(3rem, 6vw, 5rem) 1.25rem 0;
  max-width: 1200px;
  margin: 0 auto;
}

.femo-cta {
  position: relative;
  border-radius: var(--radius-hero);
  overflow: hidden;
  background: linear-gradient(135deg, #FFF7F4 0%, #FFE4D2 60%, #FFC8A6 100%);
  padding: clamp(3rem, 6vw, 5rem) clamp(1.5rem, 4vw, 4rem);
  box-shadow: var(--shadow-pop);
  isolation: isolate;
}

.femo-cta-mesh {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.femo-cta-inner {
  position: relative;
  z-index: 1;
  max-width: 680px;
  margin: 0 auto;
  text-align: center;
  display: grid;
  justify-items: center;
  gap: 1.25rem;
}

.femo-cta-chip {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(220, 38, 38, 0.18);
}

.femo-cta-title {
  font-size: clamp(2rem, 4.5vw, 3.5rem);
  color: var(--color-femo-ink-900);
  text-wrap: balance;
}

.femo-cta-sub {
  font-size: 1.05rem;
  color: var(--color-femo-ink-700);
  line-height: 1.6;
  max-width: 580px;
}

.femo-cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.femo-cta-primary { padding: 1.05rem 1.6rem; font-size: 1rem; }

.femo-cta-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  justify-content: center;
  margin-top: 0.5rem;
}

.femo-cta-trust-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.86rem;
  color: var(--color-femo-ink-700);
}

/* Decorative confetti */
.femo-cta-confetti {
  position: absolute;
  border-radius: 0.3rem;
  z-index: 0;
  pointer-events: none;
  opacity: 0.7;
}

.femo-cta-confetti--1 {
  width: 0.85rem;
  height: 0.85rem;
  background: var(--color-femo-red-500);
  top: 18%;
  left: 6%;
  transform: rotate(15deg);
  animation: femo-cta-spin 12s linear infinite;
}

.femo-cta-confetti--2 {
  width: 1.1rem;
  height: 1.1rem;
  background: var(--color-femo-amber-400);
  bottom: 18%;
  right: 8%;
  transform: rotate(-25deg);
  animation: femo-cta-spin 15s linear -3s infinite reverse;
  border-radius: 50%;
}

.femo-cta-confetti--3 {
  width: 0.7rem;
  height: 0.7rem;
  background: var(--color-femo-coral-500);
  top: 20%;
  right: 14%;
  transform: rotate(45deg);
  animation: femo-cta-spin 18s linear -8s infinite;
}

@keyframes femo-cta-spin {
  0% { transform: translateY(0) rotate(0); }
  50% { transform: translateY(-12px) rotate(180deg); }
  100% { transform: translateY(0) rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .femo-cta-confetti { animation: none; }
}
</style>
