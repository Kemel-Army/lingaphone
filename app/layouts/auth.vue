<script setup lang="ts">
/**
 * Auth layout — split-screen: left brand panel + right form.
 * Used for /login, /register, /confirm, /forgot-password.
 */
const features = [
  { icon: 'i-lucide-headphones', text: 'AI-разговорная практика 24/7 — реальные диалоги, мгновенная обратная связь' },
  { icon: 'i-lucide-brain', text: 'Адаптивный словарный запас — интервальные повторения, которые работают' },
  { icon: 'i-lucide-trophy', text: 'XP и достижения — ребёнок мотивирован каждую неделю' },
  { icon: 'i-lucide-bar-chart-3', text: 'Еженедельные отчёты о прогрессе для родителей' }
]
</script>

<template>
  <UApp>
    <div class="femo-auth">
      <!-- ─────────── Left brand panel ─────────── -->
      <aside class="femo-auth-brand">
        <FemoMeshBg />

        <div class="femo-auth-brand-inner">
          <NuxtLink
            to="/"
            class="femo-auth-brand-mark"
          >
            <FemoBrandMark size="lg" />
          </NuxtLink>

          <div class="femo-auth-brand-hero">
            <span class="femo-chip femo-auth-chip">
              <UIcon
                name="i-lucide-sparkles"
                class="size-3.5"
              />
              Английский как второй родной язык
            </span>

            <h1 class="femo-auth-brand-title femo-display">
              Английский,<br>
              который <span class="femo-text-coral">дети</span><br>
              <span class="femo-text-gradient">любят</span> говорить
            </h1>

            <p class="femo-auth-brand-sub">
              AI-платформа с живыми учителями, адаптивными уроками и игровой механикой — ребёнок говорит уверенно с первого дня.
            </p>

            <div class="femo-auth-features">
              <div
                v-for="f in features"
                :key="f.text"
                class="femo-auth-feature"
              >
                <div class="femo-auth-feature-icon">
                  <UIcon
                    :name="f.icon"
                    class="size-4"
                  />
                </div>
                <span>{{ f.text }}</span>
              </div>
            </div>
          </div>

          <!-- Trial promo -->
          <div class="femo-auth-promo">
            <div class="femo-auth-promo-icon">
              <UIcon
                name="i-lucide-play-circle"
                class="size-5"
              />
            </div>
            <div>
              <p class="femo-auth-promo-title">
                Бесплатный первый урок
              </p>
              <p class="femo-auth-promo-sub">
                Занятие с живым учителем · 25 мин · без карты
              </p>
            </div>
          </div>
        </div>
      </aside>

      <!-- ─────────── Right form panel ─────────── -->
      <main class="femo-auth-form">
        <FemoMeshBg variant="soft" />

        <div class="femo-auth-form-inner">
          <!-- Mobile logo -->
          <NuxtLink
            to="/"
            class="femo-auth-mobile-logo"
          >
            <FemoBrandMark size="md" />
          </NuxtLink>

          <!-- Form slot -->
          <div class="femo-auth-form-card">
            <slot />
          </div>

          <!-- Back link -->
          <p class="femo-auth-back">
            <NuxtLink
              to="/"
              class="femo-auth-back-link"
            >
              <UIcon
                name="i-lucide-arrow-left"
                class="size-3.5"
              />
              На главную
            </NuxtLink>
          </p>
        </div>
      </main>
    </div>
  </UApp>
</template>

<style scoped>
.femo-auth {
  min-height: 100svh;
  display: grid;
  grid-template-columns: 1fr;
  background: linear-gradient(180deg, #F8FCFF 0%, #EFF8FF 100%);
  color: var(--color-femo-ink-900);
}

@media (min-width: 1024px) {
  .femo-auth { grid-template-columns: 1fr 1fr; }
}

/* ───────── Left brand panel ───────── */
.femo-auth-brand {
  position: relative;
  display: none;
  overflow: hidden;
  background: linear-gradient(160deg, #F8FCFF 0%, #E0F2FE 55%, #BAE6FD 100%);
  isolation: isolate;
}

@media (min-width: 1024px) {
  .femo-auth-brand { display: flex; }
}

.femo-auth-brand-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 3rem;
  width: 100%;
  gap: 2rem;
}

.femo-auth-brand-mark {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  width: max-content;
}

.femo-auth-chip {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(14, 165, 233, 0.25);
  margin-bottom: 1.25rem;
  width: max-content;
}

.femo-auth-brand-hero { max-width: 480px; }

.femo-auth-brand-title {
  font-size: clamp(2.2rem, 3.6vw, 3.4rem);
  color: var(--color-femo-ink-900);
  line-height: 1.05;
  text-wrap: balance;
}

.femo-auth-brand-sub {
  margin-top: 1.5rem;
  font-size: 1.05rem;
  color: var(--color-femo-ink-700);
  line-height: 1.55;
  max-width: 420px;
}

.femo-auth-features {
  margin-top: 2rem;
  display: grid;
  gap: 0.75rem;
}

.femo-auth-feature {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.75rem;
  align-items: center;
  font-size: 0.92rem;
  color: var(--color-femo-ink-800);
}

.femo-auth-feature-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--linga-primary-dark, #0284C7);
  background: var(--color-femo-red-50, #F0F9FF);
  border: 1px solid var(--color-femo-red-100, #E0F2FE);
}

/* Trial promo */
.femo-auth-promo {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-radius: var(--radius-card);
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-red-100, #E0F2FE);
  box-shadow: var(--shadow-pop);
}

.femo-auth-promo-icon {
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 0.85rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: var(--gradient-hero);
  box-shadow: 0 8px 18px -4px rgba(2, 132, 199, 0.45);
}

.femo-auth-promo-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1rem;
  color: var(--color-femo-ink-900);
}

.femo-auth-promo-sub {
  font-size: 0.82rem;
  color: var(--color-femo-ink-600);
  margin-top: 0.15rem;
}

/* ───────── Right form panel ───────── */
.femo-auth-form {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  background: var(--ui-bg-elevated);
  isolation: isolate;
}

.femo-auth-form-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1.5rem;
}

.femo-auth-mobile-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  margin: 0 auto;
}

@media (min-width: 1024px) {
  .femo-auth-mobile-logo { display: none; }
}

.femo-auth-form-card {
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: var(--radius-card-lg);
  padding: 2rem 1.75rem;
  box-shadow: var(--shadow-soft);
}

@media (min-width: 1024px) {
  .femo-auth-form-card {
    padding: 2.5rem 2.25rem;
    box-shadow: var(--shadow-pop);
  }
}

.femo-auth-back {
  text-align: center;
}

.femo-auth-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--color-femo-ink-600);
  text-decoration: none;
  padding: 0.4rem 0.85rem;
  border-radius: var(--radius-pill);
  transition: all 0.3s var(--ease-out-expo);
}

.femo-auth-back-link:hover {
  color: var(--color-femo-red-700);
  background: var(--color-femo-red-50);
}
</style>
