<script setup lang="ts">
import { useCurrentUser } from '~/entities/user'

const { t } = useI18n()

/**
 * Supabase auth confirmation callback page.
 * Handles email confirmation, password reset, magic link, etc.
 */
definePageMeta({ layout: 'auth' })

useHead({ title: t('pages.confirm') })

const { currentUser, homeRoute } = useCurrentUser()

const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref('')

// Check for error in URL hash (Supabase puts errors there)
onMounted(() => {
  const hash = window.location.hash
  if (hash.includes('error')) {
    status.value = 'error'
    const params = new URLSearchParams(hash.replace('#', ''))
    errorMessage.value = params.get('error_description') || t('confirmPage.error')
  }
})

// Once confirmed and user is loaded, redirect to dashboard
watch(
  () => currentUser.value,
  (user) => {
    if (user) {
      status.value = 'success'
      setTimeout(() => {
        navigateTo(homeRoute.value)
      }, 1500)
    }
  },
  { immediate: true }
)

// Timeout fallback — if stuck loading for 15s, show error
const loadingTimeout = ref<ReturnType<typeof setTimeout>>()
onMounted(() => {
  loadingTimeout.value = setTimeout(() => {
    if (status.value === 'loading') {
      status.value = 'error'
      errorMessage.value = t('confirmPage.timeout')
    }
  }, 15000)
})
onUnmounted(() => {
  if (loadingTimeout.value) clearTimeout(loadingTimeout.value)
})
</script>

<template>
  <UCard class="text-center">
    <!-- Loading state -->
    <div
      v-if="status === 'loading'"
      class="flex flex-col items-center gap-4 py-8"
    >
      <div class="relative">
        <UIcon
          name="i-lucide-loader-2"
          class="size-10 animate-spin text-primary"
        />
      </div>
      <div>
        <p class="text-lg font-medium">
          {{ $t('confirmPage.loading') }}
        </p>
        <p class="mt-1 text-sm text-muted">
          {{ $t('confirmPage.loadingDesc') }}
        </p>
      </div>
    </div>

    <!-- Success state -->
    <div
      v-else-if="status === 'success'"
      class="flex flex-col items-center gap-4 py-8"
    >
      <div class="flex size-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <UIcon
          name="i-lucide-check-circle"
          class="size-8 text-green-600 dark:text-green-400"
        />
      </div>
      <div>
        <p class="text-lg font-medium text-green-700 dark:text-green-400">
          {{ $t('confirmPage.success') }}
        </p>
        <p class="mt-1 text-sm text-muted">
          {{ $t('confirmPage.successDesc') }}
        </p>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-else
      class="flex flex-col items-center gap-4 py-8"
    >
      <div class="flex size-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <UIcon
          name="i-lucide-x-circle"
          class="size-8 text-red-600 dark:text-red-400"
        />
      </div>
      <div>
        <p class="text-lg font-medium text-red-700 dark:text-red-400">
          {{ $t('confirmPage.error') }}
        </p>
        <p class="mt-1 text-sm text-muted">
          {{ errorMessage }}
        </p>
      </div>
      <div class="mt-2 flex gap-3">
        <UButton
          to="/login"
          variant="outline"
          icon="i-lucide-log-in"
        >
          {{ $t('auth.login') }}
        </UButton>
        <UButton
          to="/register"
          variant="soft"
          icon="i-lucide-user-plus"
        >
          {{ $t('auth.register') }}
        </UButton>
      </div>
    </div>
  </UCard>
</template>
