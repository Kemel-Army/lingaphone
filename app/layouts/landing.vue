<script setup lang="ts">
const { scrolled } = useStickyHeader(12)

// Mobile menu
const mobileMenuOpen = ref(false)
const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}
// Close on route change
const route = useRoute()
watch(() => route.fullPath, closeMobileMenu)

// Scroll progress (0–100) for top indicator + sticky-CTA visibility threshold
const scrollProgress = ref(0)
const ctaVisible = ref(false)

const onScroll = () => {
  if (typeof window === 'undefined') return
  const doc = document.documentElement
  const max = doc.scrollHeight - window.innerHeight
  const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
  scrollProgress.value = ratio * 100
  // Show sticky CTA after first viewport (past Hero), hide near footer (last 8%)
  ctaVisible.value = window.scrollY > window.innerHeight * 0.8 && ratio < 0.92
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('scroll', onScroll)
})

const links = [
  { label: 'О школе', to: '#results' },
  { label: 'Методика', to: '#method' },
  { label: 'Маркет', to: '#market' },
  { label: 'Уровни', to: '#levels' },
  { label: 'Цены', to: '#pricing' },
  { label: 'FAQ', to: '#faq' }
]

const footerColumns = [
  {
    title: 'Школа',
    links: [
      { label: 'О школе', to: '#results' },
      { label: 'Методика', to: '#method' },
      { label: 'Маркет достижений', to: '#market' },
      { label: 'Уровни', to: '#levels' },
      { label: 'Цены', to: '#pricing' }
    ]
  },
  {
    title: 'Обучение',
    links: [
      { label: 'Офлайн (Алматы)', to: '#pricing' },
      { label: 'Онлайн', to: '#pricing' },
      { label: 'Пробный урок', to: '#cta' },
      { label: 'AI-помощник', to: '#ai-tutor' },
      { label: 'FAQ', to: '#faq' }
    ]
  },
  {
    title: 'Компания',
    links: [
      { label: 'О нас', to: '/about' },
      { label: 'Контакты', to: '/contact' },
      { label: 'Политика конфиденциальности', to: '/privacy' },
      { label: 'Условия использования', to: '/terms' }
    ]
  }
]

const socialLinks = [
  { icon: 'i-lucide-message-circle', label: 'WhatsApp', href: 'https://wa.me/77761235703' },
  { icon: 'i-lucide-instagram', label: 'Instagram', href: 'https://instagram.com/lingaphone.kz' }
]
</script>

<template>
  <UApp class="femo-landing-shell">
    <!-- Scroll progress bar (top of viewport) -->
    <div
      class="femo-landing-progress"
      aria-hidden="true"
    >
      <span
        class="femo-landing-progress-fill"
        :style="{ width: `${scrollProgress}%` }"
      />
    </div>

    <!-- Sticky glass header -->
    <header
      class="femo-landing-header"
      :class="scrolled ? 'femo-glass-strong' : 'femo-landing-header--top'"
    >
      <div class="femo-landing-header-inner">
        <NuxtLink
          to="/"
          class="femo-landing-brand"
        >
          <FemoBrandMark size="md" />
        </NuxtLink>

        <nav class="femo-landing-nav">
          <NuxtLink
            v-for="link in links"
            :key="link.label"
            :to="link.to"
            class="femo-landing-nav-link femo-underline-glow"
            :class="{ 'femo-landing-nav-link--highlight': link.highlight }"
          >
            <UIcon
              v-if="link.icon"
              :name="link.icon"
              class="femo-landing-nav-link-icon"
            />
            <span class="femo-landing-nav-link-label">{{ link.label }}</span>
            <span
              v-if="link.highlight"
              class="femo-landing-nav-link-tag"
            >NEW</span>
          </NuxtLink>
        </nav>

        <div class="femo-landing-header-cta">
          <NuxtLink
            to="/login"
            class="femo-landing-link-ghost"
          >
            Войти
          </NuxtLink>
          <NuxtLink
            to="https://wa.me/77761235703"
            external
            target="_blank"
            class="femo-btn-primary femo-landing-cta"
          >
            <span>Записаться на пробный урок</span>
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4"
            />
          </NuxtLink>
        </div>

        <!-- Burger button — mobile only -->
        <button
          type="button"
          class="femo-landing-burger"
          :aria-expanded="mobileMenuOpen"
          aria-label="Открыть меню"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <span
            class="femo-landing-burger-line"
            :class="{ open: mobileMenuOpen }"
          />
          <span
            class="femo-landing-burger-line"
            :class="{ open: mobileMenuOpen }"
          />
          <span
            class="femo-landing-burger-line"
            :class="{ open: mobileMenuOpen }"
          />
        </button>
      </div>
    </header>

    <!-- Mobile menu drawer -->
    <Transition name="femo-mobile-menu">
      <div
        v-if="mobileMenuOpen"
        class="femo-mobile-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Навигация"
      >
        <div class="femo-mobile-drawer">
          <nav class="femo-mobile-nav">
            <NuxtLink
              v-for="link in links"
              :key="link.label"
              :to="link.to"
              class="femo-mobile-nav-link"
              @click="closeMobileMenu"
            >
              {{ link.label }}
            </NuxtLink>
          </nav>
          <div class="femo-mobile-ctas">
            <NuxtLink
              to="/login"
              class="femo-mobile-cta-ghost"
              @click="closeMobileMenu"
            >
              Войти
            </NuxtLink>
            <NuxtLink
              to="https://wa.me/77761235703"
              external
              target="_blank"
              class="femo-btn-primary femo-mobile-cta-primary"
              @click="closeMobileMenu"
            >
              <UIcon
                name="i-lucide-message-circle"
                class="size-4"
              />
              <span>Записаться на пробный урок</span>
            </NuxtLink>
          </div>
        </div>
        <!-- Backdrop -->
        <div
          class="femo-mobile-backdrop"
          aria-hidden="true"
          @click="closeMobileMenu"
        />
      </div>
    </Transition>

    <UMain class="femo-landing-main">
      <slot />
    </UMain>

    <!-- Floating Lingo (мини-маскот, реагирует на скролл) -->
    <LandingFloatingFemi />

    <!-- Exit-intent — модалка с PDF lead magnet (один раз за сессию, только desktop) -->
    <LandingExitIntent />

    <!-- Sticky bottom CTA (appears after scrolling past hero, hides near footer) -->
    <Transition name="femo-cta-bar">
      <div
        v-show="ctaVisible"
        class="femo-landing-cta-bar"
      >
        <div class="femo-landing-cta-bar-inner">
          <div class="femo-landing-cta-bar-text">
            <span class="femo-landing-cta-bar-emoji">🎓</span>
            <span><strong>Пробный урок</strong> · тест уровня · Алматы + онлайн</span>
          </div>
          <NuxtLink
            to="https://wa.me/77761235703"
            external
            target="_blank"
            class="femo-btn-primary femo-landing-cta-bar-btn"
          >
            <span>Записаться</span>
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4"
            />
          </NuxtLink>
        </div>
      </div>
    </Transition>

    <footer class="femo-landing-footer">
      <div class="femo-landing-footer-inner">
        <div class="femo-landing-footer-grid">
          <!-- Brand column -->
          <div class="femo-landing-footer-brand">
            <FemoBrandMark size="lg" />
            <p class="femo-landing-footer-pitch">
              Школа английского языка для детей с 2013 года. Британская методика, мини-группы, Маркет достижений. Алматы + Онлайн по всему миру.
            </p>
            <NuxtLink
              to="https://wa.me/77761235703"
              external
              target="_blank"
              class="femo-landing-footer-tg"
            >
              <span class="femo-landing-footer-tg-icon">
                <UIcon
                  name="i-lucide-message-circle"
                  class="size-4"
                />
              </span>
              <span class="femo-landing-footer-tg-meta">
                <strong>WhatsApp для родителей</strong>
                <small>Записаться на пробный урок · быстрый ответ</small>
              </span>
              <UIcon
                name="i-lucide-arrow-up-right"
                class="size-4 femo-landing-footer-tg-arrow"
              />
            </NuxtLink>
            <div class="femo-landing-footer-socials">
              <NuxtLink
                v-for="social in socialLinks"
                :key="social.label"
                :to="social.href"
                :aria-label="social.label"
                external
                class="femo-landing-footer-social"
              >
                <UIcon
                  :name="social.icon"
                  class="size-4.5"
                />
              </NuxtLink>
            </div>
          </div>

          <!-- Link columns -->
          <div
            v-for="col in footerColumns"
            :key="col.title"
            class="femo-landing-footer-col"
          >
            <p class="femo-landing-footer-title">
              {{ col.title }}
            </p>
            <ul>
              <li
                v-for="link in col.links"
                :key="link.label"
              >
                <NuxtLink
                  :to="link.to"
                  class="femo-landing-footer-link femo-underline-glow"
                >
                  {{ link.label }}
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>

        <!-- Wordmark stripe -->
        <div
          class="femo-landing-footer-wordmark"
          aria-hidden="true"
        >
          Lingaphone
        </div>

        <!-- Bottom bar -->
        <div class="femo-landing-footer-bottom">
          <p>© {{ new Date().getFullYear() }} Lingaphone. Все права защищены.</p>
          <p>Алматы, Казахстан · @lingaphone.kz · wa.me/77761235703</p>
        </div>
      </div>
    </footer>
  </UApp>
</template>

<style scoped>
.femo-landing-shell {
  background: linear-gradient(180deg, #FFFFFF 0%, #FFF7F4 60%, #FFF0EA 100%);
  color: var(--color-femo-ink-900);
  min-height: 100vh;
}

/* ---------------- Scroll progress ---------------- */
.femo-landing-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.4);
  z-index: 70;
  pointer-events: none;
}

.femo-landing-progress-fill {
  display: block;
  height: 100%;
  background: var(--gradient-hero);
  transition: width 0.1s linear;
  box-shadow: 0 0 12px rgba(220, 38, 38, 0.5);
}

/* ---------------- Sticky bottom CTA bar ---------------- */
.femo-landing-cta-bar {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 55;
  width: min(720px, calc(100vw - 1.5rem));
  padding: 0 0.75rem;
  pointer-events: none;
}

.femo-landing-cta-bar-inner {
  pointer-events: auto;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.85rem;
  align-items: center;
  padding: 0.75rem 1rem 0.75rem 1.25rem;
  background:
    radial-gradient(60% 80% at 100% 0%, rgba(250, 165, 26, 0.18), transparent 70%),
    linear-gradient(135deg, #FFFFFF 0%, #FFF1F0 60%, #FFE4D2 100%);
  border: 1px solid var(--color-femo-red-200);
  border-radius: var(--radius-pill);
  box-shadow:
    0 18px 40px -16px rgba(220, 38, 38, 0.4),
    0 6px 14px -6px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(14px) saturate(180%);
  -webkit-backdrop-filter: blur(14px) saturate(180%);
}

.femo-landing-cta-bar-text {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--color-femo-ink-800);
  line-height: 1.3;
}

.femo-landing-cta-bar-text strong {
  color: var(--color-femo-red-700);
  font-weight: 800;
}

.femo-landing-cta-bar-emoji {
  font-size: 1.1rem;
  animation: cta-bar-zap 1.8s ease-in-out infinite;
}

@keyframes cta-bar-zap {
  0%, 100% { transform: scale(1) rotate(0); }
  50%      { transform: scale(1.15) rotate(-8deg); }
}

.femo-landing-cta-bar-btn {
  white-space: nowrap;
  padding: 0.55rem 1rem;
  font-size: 0.85rem;
}

@media (max-width: 640px) {
  .femo-landing-cta-bar { bottom: 0.75rem; padding: 0 0.5rem; }
  .femo-landing-cta-bar-inner {
    grid-template-columns: 1fr auto;
    padding: 0.65rem 0.7rem 0.65rem 0.95rem;
    gap: 0.6rem;
    border-radius: 1.2rem;
  }
  .femo-landing-cta-bar-text {
    font-size: 0.78rem;
    /* Truncate long copy on small screens */
  }
  .femo-landing-cta-bar-text > span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
  .femo-landing-cta-bar-btn { padding: 0.5rem 0.75rem; font-size: 0.78rem; }
}

/* CTA bar enter/leave */
.femo-cta-bar-enter-active,
.femo-cta-bar-leave-active {
  transition: transform 0.45s var(--ease-out-expo), opacity 0.45s var(--ease-out-expo);
}

.femo-cta-bar-enter-from,
.femo-cta-bar-leave-to {
  transform: translateX(-50%) translateY(120%);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .femo-landing-cta-bar-emoji,
  .femo-landing-progress-fill { animation: none; transition: none; }
}

/* ---------------- Header ---------------- */
.femo-landing-header {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 60;
  transition: background 0.4s var(--ease-out-expo),
              backdrop-filter 0.4s var(--ease-out-expo),
              border-color 0.4s var(--ease-out-expo),
              box-shadow 0.4s var(--ease-out-expo),
              padding 0.4s var(--ease-out-expo);
}

.femo-landing-header--top {
  background: transparent;
  border-bottom: 1px solid transparent;
}

.femo-landing-header-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1rem 1.25rem;
}

.femo-landing-brand { display: inline-flex; }

.femo-landing-nav {
  display: none;
  align-items: center;
  gap: 1.25rem;
}

@media (min-width: 992px) {
  .femo-landing-nav { display: inline-flex; }
}

@media (min-width: 1140px) {
  .femo-landing-nav { gap: 1.5rem; }
}

.femo-landing-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-femo-ink-700);
  white-space: nowrap;
  transition: color 0.3s ease;
}

.femo-landing-nav-link:hover { color: var(--color-femo-red-700); }

.femo-landing-nav-link-icon { width: 0.95rem; height: 0.95rem; flex-shrink: 0; }

.femo-landing-nav-link--highlight {
  padding: 0.32rem 0.7rem 0.32rem 0.6rem;
  background: linear-gradient(135deg, #FFE4D2, #FFD98A);
  border: 1px solid var(--color-femo-red-200);
  border-radius: 999px;
  font-weight: 700;
  color: var(--color-femo-red-700) !important;
  box-shadow: 0 4px 10px -2px rgba(220, 38, 38, 0.18);
  transition: transform 0.25s var(--ease-out-expo), box-shadow 0.25s var(--ease-out-expo);
}

.femo-landing-nav-link--highlight:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px -4px rgba(220, 38, 38, 0.28);
}

.femo-landing-nav-link-label { line-height: 1; }

.femo-landing-nav-link-tag {
  font-family: var(--font-display);
  font-size: 0.58rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: #fff;
  background: linear-gradient(135deg, #B41B1B, #631010);
  padding: 1px 5px;
  border-radius: 4px;
  line-height: 1.3;
  margin-left: 0.1rem;
}

.femo-landing-header-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.femo-landing-link-ghost {
  font-size: 0.93rem;
  font-weight: 600;
  color: var(--color-femo-ink-700);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-pill);
  transition: color 0.25s ease, background 0.25s ease;
}

.femo-landing-link-ghost:hover {
  color: var(--color-femo-red-700);
  background: var(--color-femo-red-50);
}

.femo-landing-cta { padding: 0.65rem 1.15rem; font-size: 0.88rem; }

@media (max-width: 640px) {
  .femo-landing-cta { display: none; }
}

/* Burger button — visible on mobile only */
.femo-landing-burger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 2.4rem;
  height: 2.4rem;
  border: none;
  background: transparent;
  padding: 0.3rem;
  border-radius: 0.5rem;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s ease;
}
.femo-landing-burger:hover { background: var(--color-femo-red-50); }

@media (max-width: 991px) {
  .femo-landing-burger { display: flex; }
}

.femo-landing-burger-line {
  display: block;
  width: 100%;
  height: 2px;
  border-radius: 2px;
  background: var(--color-femo-ink-800);
  transform-origin: center;
  transition: transform 0.3s var(--ease-out-expo), opacity 0.3s ease, width 0.3s ease;
}
.femo-landing-burger-line:nth-child(2).open { opacity: 0; transform: scaleX(0); }
.femo-landing-burger-line:nth-child(1).open { transform: rotate(45deg) translate(5px, 5px); }
.femo-landing-burger-line:nth-child(3).open { transform: rotate(-45deg) translate(5px, -5px); }

/* Mobile overlay */
.femo-mobile-overlay {
  position: fixed;
  inset: 0;
  z-index: 59;
  display: flex;
  flex-direction: column;
  pointer-events: none;
}

.femo-mobile-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  pointer-events: auto;
}

.femo-mobile-drawer {
  position: relative;
  z-index: 1;
  margin-top: var(--ui-header-height, 4rem);
  background: #FFFFFF;
  border-bottom: 1px solid var(--color-femo-ink-100);
  border-radius: 0 0 1.5rem 1.5rem;
  padding: 1.25rem 1.5rem 1.75rem;
  box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.18);
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.femo-mobile-nav {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.femo-mobile-nav-link {
  display: block;
  padding: 0.75rem 1rem;
  border-radius: 0.85rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-femo-ink-800);
  transition: background 0.2s ease, color 0.2s ease;
  text-decoration: none;
}
.femo-mobile-nav-link:hover,
.femo-mobile-nav-link:active {
  background: var(--color-femo-red-50);
  color: var(--color-femo-red-700);
}

.femo-mobile-ctas {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-femo-ink-100);
}

.femo-mobile-cta-ghost {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border-radius: 0.85rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-femo-ink-700);
  border: 1.5px solid var(--color-femo-ink-200);
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease;
}
.femo-mobile-cta-ghost:hover { background: var(--color-femo-ink-50); }

.femo-mobile-cta-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  font-size: 0.97rem;
  border-radius: 0.85rem;
}

/* Mobile menu transition */
.femo-mobile-menu-enter-active { transition: opacity 0.25s ease; }
.femo-mobile-menu-leave-active { transition: opacity 0.2s ease; }
.femo-mobile-menu-enter-from,
.femo-mobile-menu-leave-to { opacity: 0; }
.femo-mobile-menu-enter-active .femo-mobile-drawer { transition: transform 0.3s var(--ease-out-expo); }
.femo-mobile-menu-leave-active .femo-mobile-drawer { transition: transform 0.2s ease-in; }
.femo-mobile-menu-enter-from .femo-mobile-drawer,
.femo-mobile-menu-leave-to   .femo-mobile-drawer { transform: translateY(-1rem); }

/* ---------------- Main ---------------- */
.femo-landing-main { padding-top: var(--ui-header-height, 4.5rem); }

/* ---------------- Footer ---------------- */
.femo-landing-footer {
  position: relative;
  margin-top: 6rem;
  padding-top: 4rem;
  background: linear-gradient(180deg, #FFF7F4 0%, #FFE4D2 60%, #FFC8A6 100%);
  overflow: hidden;
}

.femo-landing-footer::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(60% 50% at 10% 0%, rgba(220, 38, 38, 0.08), transparent 70%),
    radial-gradient(40% 50% at 90% 10%, rgba(250, 165, 26, 0.10), transparent 70%);
}

.femo-landing-footer-inner {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.25rem;
}

.femo-landing-footer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
}

@media (min-width: 768px) {
  .femo-landing-footer-grid {
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 3rem;
  }
}

.femo-landing-footer-brand { max-width: 360px; }
.femo-landing-footer-pitch {
  margin-top: 1.25rem;
  font-size: 0.95rem;
  color: var(--color-femo-ink-700);
  line-height: 1.6;
}

/* Telegram channel chip */
.femo-landing-footer-tg {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.65rem;
  align-items: center;
  margin-top: 1.25rem;
  padding: 0.7rem 0.85rem;
  background: linear-gradient(135deg, #E0F2FE, #FFFFFF);
  border: 1px solid rgba(14, 165, 233, 0.3);
  border-radius: 0.95rem;
  text-decoration: none;
  transition: all 0.3s var(--ease-out-expo);
}

.femo-landing-footer-tg:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #BAE6FD, #FFFFFF);
  box-shadow: 0 12px 24px -10px rgba(14, 165, 233, 0.4);
}

.femo-landing-footer-tg-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.55rem;
  background: linear-gradient(135deg, #38BDF8, #0EA5E9);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 14px -4px rgba(14, 165, 233, 0.5);
}

.femo-landing-footer-tg-meta { display: grid; min-width: 0; }
.femo-landing-footer-tg-meta strong {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.82rem;
  color: var(--color-femo-ink-900);
  line-height: 1.15;
}
.femo-landing-footer-tg-meta small {
  font-size: 0.68rem;
  color: var(--color-femo-ink-600);
  margin-top: 0.15rem;
  font-weight: 500;
}

.femo-landing-footer-tg-arrow { color: #0284C7; }

.femo-landing-footer-socials {
  display: inline-flex;
  gap: 0.6rem;
  margin-top: 1rem;
}

.femo-landing-footer-social {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: var(--radius-pill);
  color: var(--color-femo-ink-800);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-soft);
  transition: all 0.3s var(--ease-out-expo);
}

.femo-landing-footer-social:hover {
  color: white;
  background: var(--gradient-coral);
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(220, 38, 38, 0.25);
}

.femo-landing-footer-title {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-femo-ink-900);
  margin-bottom: 1rem;
}

.femo-landing-footer-col ul { display: flex; flex-direction: column; gap: 0.65rem; }

.femo-landing-footer-link {
  font-size: 0.93rem;
  color: var(--color-femo-ink-700);
  transition: color 0.25s ease;
}

.femo-landing-footer-link:hover { color: var(--color-femo-red-700); }

.femo-landing-footer-wordmark {
  margin-top: 4rem;
  font-family: var(--font-display);
  font-weight: 800;
  text-align: center;
  font-size: clamp(5rem, 18vw, 14rem);
  line-height: 0.9;
  letter-spacing: -0.04em;
  background: linear-gradient(180deg, rgba(220, 38, 38, 0.18) 0%, rgba(250, 165, 26, 0.05) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  user-select: none;
  pointer-events: none;
}

.femo-landing-footer-bottom {
  margin-top: -1rem;
  padding: 1.5rem 0 2rem;
  border-top: 1px solid rgba(220, 38, 38, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  color: var(--color-femo-ink-600);
  font-size: 0.85rem;
}

@media (min-width: 640px) {
  .femo-landing-footer-bottom { flex-direction: row; }
}
</style>
