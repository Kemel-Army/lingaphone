<script setup lang="ts">
import { ForgotPasswordForm } from '~/features/auth'

const { t } = useI18n()

definePageMeta({ layout: 'auth' })

useHead({ title: t('pages.forgotPassword') })
</script>

<template>
  <ForgotPasswordForm />
</template>
