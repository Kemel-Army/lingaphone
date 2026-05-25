<script setup lang="ts">
/**
 * Exit-intent modal — triggered when the cursor leaves through the top of the
 * viewport (intent to close the tab). Shows a PDF lead magnet capture form.
 *
 * Triggers ONLY:
 *   - on desktop (no hover on touch)
 *   - once per session (sessionStorage flag)
 *   - after the user has scrolled at least 25% of the page
 *
 * Form is decoupled from any backend — currently logs to console + shows toast.
 * Wire to `/api/leads` later when the endpoint exists.
 */

const SESSION_KEY = 'lingaphone_exit_intent_shown'

const visible = ref(false)
const submitted = ref(false)
const email = ref('')
const errorMsg = ref('')
const loading = ref(false)

const close = () => {
  visible.value = false
}

const submit = async () => {
  errorMsg.value = ''
  if (!email.value) {
    errorMsg.value = 'Введите email'
    return
  }
  // Minimal email validation
  if (!/^\S+@\S+\.\S+$/.test(email.value)) {
    errorMsg.value = 'Похоже, в email опечатка'
    return
  }
  loading.value = true
  // TODO: replace with `await $fetch('/api/leads', { method: 'POST', body: { email: email.value, source: 'exit-intent' } })`
  await new Promise(r => setTimeout(r, 600))
  loading.value = false
  submitted.value = true
}

const onMouseLeave = (e: MouseEvent) => {
  // Trigger only when cursor exits through the top edge
  if (e.clientY > 0) return
  if (visible.value) return
  if (typeof sessionStorage === 'undefined') return
  if (sessionStorage.getItem(SESSION_KEY)) return

  // Require at least 25% scroll progress
  const docH = document.documentElement.scrollHeight - window.innerHeight
  const ratio = docH > 0 ? window.scrollY / docH : 0
  if (ratio < 0.25) return

  visible.value = true
  sessionStorage.setItem(SESSION_KEY, '1')
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && visible.value) close()
}

onMounted(() => {
  // Skip on touch devices — they don't have a real top-edge exit gesture
  if (window.matchMedia('(hover: none)').matches) return
  document.addEventListener('mouseleave', onMouseLeave)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('mouseleave', onMouseLeave)
    document.removeEventListener('keydown', onKeydown)
  }
})
</script>

<template>
  <Transition name="exit-intent">
    <div
      v-if="visible"
      class="femo-exit-intent"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-intent-title"
    >
      <div
        class="femo-exit-intent-backdrop"
        @click="close"
      />
      <div class="femo-exit-intent-card">
        <button
          type="button"
          class="femo-exit-intent-close"
          aria-label="Закрыть"
          @click="close"
        >
          <UIcon
            name="i-lucide-x"
            class="size-4"
          />
        </button>

        <!-- Mascot + headline -->
        <div class="femo-exit-intent-head">
          <div class="femo-exit-intent-mascot">
            <FemiMascot
              :state="submitted ? 'celebrate' : 'warn'"
              size="md"
              silent
              ignore-reactions
            />
          </div>
          <span class="femo-exit-intent-chip">Подождите!</span>
          <h2
            id="exit-intent-title"
            class="femo-exit-intent-title"
          >
            <template v-if="!submitted">
              Заберите бесплатный <span class="femo-text-coral">PDF-гид</span>
            </template>
            <template v-else>
              Готово! <span class="femo-text-gradient">Проверь почту</span> 🎉
            </template>
          </h2>
          <p
            v-if="!submitted"
            class="femo-exit-intent-sub"
          >
            «Как научить ребёнка английскому дома: британский метод, игры и действия» — 24 страницы с практическими советами от методистов Lingaphone.
          </p>
          <p
            v-else
            class="femo-exit-intent-sub"
          >
            Я прислал PDF на <strong>{{ email }}</strong>. Если письма нет — проверь папку «Спам».
          </p>
        </div>

        <!-- Form / success -->
        <form
          v-if="!submitted"
          class="femo-exit-intent-form"
          @submit.prevent="submit"
        >
          <div class="femo-exit-intent-field">
            <UIcon
              name="i-lucide-mail"
              class="size-4 text-femo-ink-400"
            />
            <input
              v-model="email"
              type="email"
              placeholder="ваш email для PDF"
              autocomplete="email"
              :disabled="loading"
              class="femo-exit-intent-input"
            >
          </div>
          <button
            type="submit"
            class="femo-btn-primary femo-exit-intent-cta"
            :disabled="loading"
          >
            <UIcon
              v-if="loading"
              name="i-lucide-loader-2"
              class="size-4 animate-spin"
            />
            <span v-if="!loading">Получить PDF бесплатно</span>
            <span v-else>Отправляем…</span>
          </button>
          <p
            v-if="errorMsg"
            class="femo-exit-intent-err"
          >
            {{ errorMsg }}
          </p>
          <p class="femo-exit-intent-fineprint">
            Один email — без спама. Отписаться в 1 клик.
          </p>
        </form>

        <div
          v-else
          class="femo-exit-intent-success"
        >
          <NuxtLink
            to="/register"
            class="femo-btn-primary"
            @click="close"
          >
            <span>Заодно начать диагностику</span>
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4"
            />
          </NuxtLink>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.femo-exit-intent {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.femo-exit-intent-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.femo-exit-intent-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 28rem;
  padding: 2rem 1.6rem 1.5rem;
  background:
    radial-gradient(60% 50% at 100% 0%, rgba(250, 165, 26, 0.18), transparent 70%),
    linear-gradient(135deg, #FFFFFF 0%, #FFF1F0 60%, #FFE4D2 100%);
  border: 1px solid var(--color-femo-red-200);
  border-radius: 1.5rem;
  box-shadow: 0 30px 70px -16px rgba(220, 38, 38, 0.4);
  display: grid;
  gap: 1rem;
  text-align: center;
}

.femo-exit-intent-close {
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  color: var(--color-femo-ink-600);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s var(--ease-out-expo);
}

.femo-exit-intent-close:hover {
  background: var(--gradient-hero);
  color: white;
  border-color: transparent;
}

.femo-exit-intent-head { display: grid; gap: 0.6rem; justify-items: center; }

.femo-exit-intent-mascot {
  margin-top: -0.5rem;
  filter: drop-shadow(0 8px 16px rgba(220, 38, 38, 0.25));
}

.femo-exit-intent-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  background: var(--gradient-hero);
  color: white;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-radius: var(--radius-pill);
  box-shadow: 0 6px 14px -4px rgba(220, 38, 38, 0.5);
}

.femo-exit-intent-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(1.25rem, 2.5vw, 1.5rem);
  color: var(--color-femo-ink-900);
  letter-spacing: -0.01em;
  line-height: 1.2;
  text-wrap: balance;
}

.femo-exit-intent-sub {
  font-size: 0.88rem;
  color: var(--color-femo-ink-700);
  line-height: 1.5;
  text-wrap: balance;
}

.femo-exit-intent-sub strong { color: var(--color-femo-red-700); font-weight: 700; }

.femo-exit-intent-form { display: grid; gap: 0.65rem; }

.femo-exit-intent-field {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.55rem;
  align-items: center;
  padding: 0.7rem 0.95rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 0.85rem;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.femo-exit-intent-field:focus-within {
  border-color: var(--color-femo-red-300);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
}

.femo-exit-intent-input {
  width: 100%;
  background: transparent;
  outline: none;
  border: none;
  font-size: 0.9rem;
  color: var(--color-femo-ink-900);
  font-family: inherit;
}

.femo-exit-intent-input::placeholder { color: var(--color-femo-ink-400); }

.femo-exit-intent-cta {
  width: 100%;
  justify-content: center;
  padding: 0.85rem;
}

.femo-exit-intent-cta:disabled { opacity: 0.7; cursor: wait; }

.femo-exit-intent-err {
  font-size: 0.78rem;
  color: var(--color-femo-red-700);
  font-weight: 600;
}

.femo-exit-intent-fineprint {
  font-size: 0.7rem;
  color: var(--color-femo-ink-500);
  margin-top: 0.2rem;
}

.femo-exit-intent-success {
  display: flex;
  justify-content: center;
}

/* Transitions */
.exit-intent-enter-active,
.exit-intent-leave-active {
  transition: opacity 0.3s ease;
}

.exit-intent-enter-active .femo-exit-intent-card,
.exit-intent-leave-active .femo-exit-intent-card {
  transition: transform 0.4s var(--ease-out-back), opacity 0.3s ease;
}

.exit-intent-enter-from,
.exit-intent-leave-to { opacity: 0; }

.exit-intent-enter-from .femo-exit-intent-card,
.exit-intent-leave-to   .femo-exit-intent-card {
  transform: scale(0.85) translateY(20px);
  opacity: 0;
}
</style>
