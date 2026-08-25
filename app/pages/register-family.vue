<script setup lang="ts">
import { FamilyRegistrationForm } from '~/features/family-registration'

const { t } = useI18n()

definePageMeta({ layout: 'auth' })

useHead({ title: t('auth.familyRegister.title') })
</script>

<template>
  <FamilyRegistrationForm />
</template>
