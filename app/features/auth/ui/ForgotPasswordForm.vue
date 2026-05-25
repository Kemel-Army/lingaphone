<script setup lang="ts">
import { useAuthActions } from '../composables/useAuthActions'

const { t } = useI18n()

/**
 * Forgot password form with email input.
 * Sends password reset email via Supabase Auth.
 */
const { resetPassword, loading, error } = useAuthActions()

const email = ref('')
const submitted = ref(false)
const validationError = ref('')

async function onSubmit() {
  validationError.value = ''
  if (!email.value || !email.value.includes('@')) {
    validationError.value = t('auth.invalidEmail')
    return
  }
  await resetPassword(email.value)
  submitted.value = true
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold tracking-tight text-default">
        {{ $t('auth.passwordReset') }}
      </h2>
      <p class="mt-2 text-sm text-muted">
        {{ $t('auth.resetSubtitle') }}
      </p>
    </div>

    <!-- Success message -->
    <UAlert
      v-if="submitted && !error"
      color="success"
      icon="i-lucide-check-circle"
      :title="$t('auth.emailSentTitle')"
      :description="$t('auth.emailSentDesc')"
      variant="subtle"
      class="mb-6"
    />

    <!-- Error message -->
    <UAlert
      v-else-if="error"
      color="error"
      icon="i-lucide-alert-circle"
      :title="error"
      variant="subtle"
      class="mb-6"
    />

    <form
      v-if="!submitted || error"
      class="flex flex-col gap-5"
      @submit.prevent="onSubmit"
    >
      <UFormField
        label="Email"
        :error="validationError"
      >
        <UInput
          v-model="email"
          type="email"
          placeholder="name@example.com"
          icon="i-lucide-mail"
          size="xl"
          class="w-full"
          :disabled="loading"
        />
      </UFormField>

      <UButton
        type="submit"
        size="xl"
        class="w-full"
        :loading="loading"
      >
        {{ $t('auth.sendEmail') }}
      </UButton>
    </form>

    <!-- Back to login -->
    <p class="mt-6 text-center text-sm text-muted">
      <NuxtLink
        to="/login"
        class="font-semibold text-primary hover:underline"
      >
        {{ $t('auth.backToLogin') }}
      </NuxtLink>
    </p>
  </div>
</template>
