<script setup lang="ts">
import { RegisterForm } from '~/features/auth'

const { t } = useI18n()

definePageMeta({ layout: 'auth' })

useHead({ title: t('pages.register') })
</script>

<template>
  <RegisterForm />
</template>
