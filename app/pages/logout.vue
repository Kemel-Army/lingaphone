<script setup lang="ts">
import { useAuthActions } from '~/features/auth'

const { t } = useI18n()

definePageMeta({ layout: 'auth' })
useHead({ title: t('pages.logout') })

const { logout } = useAuthActions()

onMounted(async () => {
  await logout()
})
</script>

<template>
  <div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
    <UIcon
      name="i-lucide-log-out"
      class="mb-4 size-12 text-primary"
    />
    <h1 class="mb-2 text-2xl font-bold">
      {{ $t('logoutPage.title') }}
    </h1>
    <p class="mb-6 text-muted">
      {{ $t('logoutPage.description') }}
    </p>
    <LoadingSpinner />
  </div>
</template>
