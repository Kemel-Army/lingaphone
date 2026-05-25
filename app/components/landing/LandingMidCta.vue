<script setup lang="ts">
// Compact mid-page CTA — used between heavy showcase sections to capture
// visitors who already understood the value and don't want to scroll further.

const sectionRef = useTemplateRef<HTMLElement>('sectionRef')
useScrollReveal(sectionRef, { stagger: 60 })
</script>

<template>
  <section
    ref="sectionRef"
    class="femo-midcta"
  >
    <div class="femo-section-inner">
      <div class="femo-midcta-card stagger-item">
        <div class="femo-midcta-meta">
          <span class="femo-midcta-emoji">⚡</span>
          <div>
            <p class="femo-midcta-title">
              Уже хочишь попробовать?
            </p>
            <p class="femo-midcta-sub">
              <strong>Пробный урок</strong> — бесплатно. Узнаем уровень, покажем методику. Без обязательств.
            </p>
          </div>
        </div>
        <a
          href="https://wa.me/77761235703"
          target="_blank"
          rel="noopener noreferrer"
          class="femo-btn-primary femo-midcta-btn"
        >
          <span>Записаться</span>
          <UIcon
            name="i-lucide-message-circle"
            class="size-4"
          />
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.femo-midcta {
  position: relative;
  padding: 1.5rem 0 0.5rem;
}

.femo-midcta-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem 1.4rem;
  border-radius: 1.4rem;
  background:
    radial-gradient(60% 80% at 0% 0%, rgba(250, 165, 26, 0.18), transparent 70%),
    linear-gradient(135deg, #FFFFFF 0%, #FFF1F0 60%, #FFE4D2 100%);
  border: 1px solid var(--color-femo-red-200);
  box-shadow: 0 14px 32px -14px rgba(220, 38, 38, 0.25);
}

@media (max-width: 720px) {
  .femo-midcta-card {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 0.7rem;
    padding: 0.95rem 1.1rem;
  }
}

.femo-midcta-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
}

@media (max-width: 720px) {
  .femo-midcta-meta { justify-content: center; }
}

.femo-midcta-emoji {
  font-size: 1.6rem;
  animation: midcta-zap 1.8s ease-in-out infinite;
}

@keyframes midcta-zap {
  0%, 100% { transform: scale(1) rotate(0); }
  50%      { transform: scale(1.15) rotate(-8deg); }
}

.femo-midcta-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.05rem;
  color: var(--color-femo-ink-900);
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.femo-midcta-sub {
  font-size: 0.82rem;
  color: var(--color-femo-ink-700);
  margin-top: 0.15rem;
  line-height: 1.4;
}

.femo-midcta-sub strong { color: var(--color-femo-red-700); font-weight: 800; }

.femo-midcta-btn {
  white-space: nowrap;
  padding: 0.65rem 1.1rem;
  font-size: 0.88rem;
}

@media (prefers-reduced-motion: reduce) {
  .femo-midcta-emoji { animation: none; }
}
</style>
