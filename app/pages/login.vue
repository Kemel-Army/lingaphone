<script setup lang="ts">
import { LoginForm } from '~/features/auth'

const { t } = useI18n()

definePageMeta({ layout: 'auth' })

useHead({ title: t('pages.login') })
</script>

<template>
  <LoginForm />
</template>
