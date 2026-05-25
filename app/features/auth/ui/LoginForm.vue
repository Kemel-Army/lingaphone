<script setup lang="ts">
import { loginFormSchema, type LoginFormData } from '~/shared/lib/validators'
import { useAuthActions } from '../composables/useAuthActions'

const { login, loading, error } = useAuthActions()

const form = reactive<LoginFormData>({
  email: '',
  password: ''
})

const showPassword = ref(false)
const validationErrors = ref<Record<string, string>>({})

async function onSubmit() {
  validationErrors.value = {}
  const result = loginFormSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0] as string
      validationErrors.value[key] = issue.message
    }
    return
  }
  await login(result.data)
}
</script>

<template>
  <div class="lf-root">
    <!-- Brand icon -->
    <div class="lf-icon-wrap">
      <div class="lf-icon">
        <UIcon
          name="i-lucide-headphones"
          class="size-6"
        />
      </div>
    </div>

    <!-- Header -->
    <div class="lf-header">
      <h2 class="lf-title">
        С возвращением
      </h2>
      <p class="lf-subtitle">
        Войдите, чтобы продолжить обучение
      </p>
    </div>

    <!-- Error alert -->
    <UAlert
      v-if="error"
      color="error"
      icon="i-lucide-alert-circle"
      :title="error"
      variant="subtle"
      class="lf-alert"
    />

    <form
      class="lf-form"
      @submit.prevent="onSubmit"
    >
      <!-- Email -->
      <div class="lf-field">
        <label class="lf-label">Электронная почта</label>
        <div
          class="lf-input-wrap"
          :class="{ 'lf-input-wrap--error': validationErrors.email }"
        >
          <UIcon
            name="i-lucide-mail"
            class="lf-input-icon"
          />
          <input
            v-model="form.email"
            type="email"
            placeholder="name@example.com"
            autocomplete="email"
            class="lf-input"
          >
        </div>
        <p
          v-if="validationErrors.email"
          class="lf-error"
        >
          {{ validationErrors.email }}
        </p>
      </div>

      <!-- Password -->
      <div class="lf-field">
        <div class="lf-label-row">
          <label class="lf-label">Пароль</label>
          <NuxtLink
            to="/forgot-password"
            class="lf-forgot"
          >
            Забыли пароль?
          </NuxtLink>
        </div>
        <div
          class="lf-input-wrap"
          :class="{ 'lf-input-wrap--error': validationErrors.password }"
        >
          <UIcon
            name="i-lucide-lock"
            class="lf-input-icon"
          />
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            autocomplete="current-password"
            class="lf-input"
          >
          <button
            type="button"
            class="lf-toggle-pw"
            @click="showPassword = !showPassword"
          >
            <UIcon
              :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              class="size-4"
            />
          </button>
        </div>
        <p
          v-if="validationErrors.password"
          class="lf-error"
        >
          {{ validationErrors.password }}
        </p>
      </div>

      <!-- Submit -->
      <button
        type="submit"
        class="lf-submit"
        :disabled="loading"
      >
        <span
          v-if="loading"
          class="lf-spinner"
        />
        <span>{{ loading ? 'Входим…' : 'Войти' }}</span>
        <UIcon
          v-if="!loading"
          name="i-lucide-arrow-right"
          class="size-4"
        />
      </button>
    </form>

    <!-- Divider -->
    <div class="lf-divider">
      <span class="lf-divider-text">или войти через</span>
    </div>

    <!-- Social -->
    <div class="lf-social">
      <button
        type="button"
        class="lf-social-btn"
        disabled
      >
        <UIcon
          name="i-lucide-chrome"
          class="size-4"
        />
        Google
      </button>
      <button
        type="button"
        class="lf-social-btn"
        disabled
      >
        <UIcon
          name="i-lucide-smartphone"
          class="size-4"
        />
        Apple
      </button>
    </div>

    <!-- Footer -->
    <p class="lf-footer">
      Нет аккаунта?
      <NuxtLink
        to="/register"
        class="lf-footer-link"
      >
        Зарегистрироваться бесплатно
      </NuxtLink>
    </p>
  </div>
</template>

<style scoped>
/* ─── Root ─── */
.lf-root {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
}

/* ─── Brand icon ─── */
.lf-icon-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}
.lf-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  background: var(--gradient-hero, linear-gradient(120deg, #0284C7, #0EA5E9 50%, #38BDF8));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 8px 24px -4px rgba(2, 132, 199, 0.45);
}

/* ─── Header ─── */
.lf-header {
  text-align: center;
  margin-bottom: 2rem;
}
.lf-title {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--color-femo-ink-900, #0f172a);
  line-height: 1.2;
}
.lf-subtitle {
  margin-top: 0.4rem;
  font-size: 0.875rem;
  color: var(--color-femo-ink-500, #64748b);
}

/* ─── Alert ─── */
.lf-alert { margin-bottom: 1rem; }

/* ─── Form ─── */
.lf-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

/* ─── Field ─── */
.lf-field { display: flex; flex-direction: column; gap: 0.375rem; }

.lf-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.lf-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-femo-ink-700, #334155);
}
.lf-forgot {
  font-size: 0.75rem;
  color: var(--linga-primary, #0EA5E9);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.15s;
}
.lf-forgot:hover { opacity: 0.75; }

/* ─── Input wrapper ─── */
.lf-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 0.75rem;
  border: 1.5px solid var(--ui-border, #e2e8f0);
  background: var(--ui-bg, #fff);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.lf-input-wrap:focus-within {
  border-color: var(--linga-primary, #0EA5E9);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
}
.lf-input-wrap--error {
  border-color: #ef4444;
}
.lf-input-icon {
  position: absolute;
  left: 0.875rem;
  color: var(--color-femo-ink-400, #94a3b8);
  width: 1rem;
  height: 1rem;
  pointer-events: none;
  flex-shrink: 0;
}
.lf-input {
  width: 100%;
  padding: 0.75rem 0.875rem 0.75rem 2.5rem;
  font-size: 0.9375rem;
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-femo-ink-900, #0f172a);
}
.lf-input::placeholder { color: var(--color-femo-ink-400, #94a3b8); }
.lf-toggle-pw {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-femo-ink-400, #94a3b8);
  display: flex;
  align-items: center;
  padding: 0.25rem;
  transition: color 0.15s;
}
.lf-toggle-pw:hover { color: var(--color-femo-ink-700, #334155); }

.lf-error {
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 0.1rem;
}

/* ─── Submit button ─── */
.lf-submit {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.825rem 1.5rem;
  border-radius: 0.75rem;
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #fff;
  background: var(--gradient-hero, linear-gradient(120deg, #0284C7 0%, #0EA5E9 50%, #38BDF8 100%));
  border: none;
  cursor: pointer;
  box-shadow: 0 6px 20px -4px rgba(2, 132, 199, 0.5);
  transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
}
.lf-submit:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
  box-shadow: 0 10px 28px -4px rgba(2, 132, 199, 0.5);
}
.lf-submit:active:not(:disabled) { transform: translateY(0); }
.lf-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.lf-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Divider ─── */
.lf-divider {
  position: relative;
  display: flex;
  align-items: center;
  margin: 1.5rem 0 1.25rem;
}
.lf-divider::before,
.lf-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--ui-border, #e2e8f0);
}
.lf-divider-text {
  padding: 0 0.75rem;
  font-size: 0.75rem;
  color: var(--color-femo-ink-400, #94a3b8);
  font-weight: 500;
  white-space: nowrap;
}

/* ─── Social ─── */
.lf-social {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.lf-social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  border-radius: 0.75rem;
  border: 1.5px solid var(--ui-border, #e2e8f0);
  background: var(--ui-bg, #fff);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-femo-ink-700, #334155);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.lf-social-btn:hover:not(:disabled) { background: var(--ui-bg-elevated, #f8fafc); }
.lf-social-btn:disabled { opacity: 0.55; cursor: not-allowed; }

/* ─── Footer ─── */
.lf-footer {
  margin-top: 1.75rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-femo-ink-500, #64748b);
}
.lf-footer-link {
  font-weight: 700;
  color: var(--linga-primary, #0EA5E9);
  text-decoration: none;
  transition: opacity 0.15s;
}
.lf-footer-link:hover { opacity: 0.75; }
</style>
