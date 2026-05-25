<script setup lang="ts">
const { t } = useI18n()
definePageMeta({ layout: 'landing' })
useHead({ title: t('pages.terms') })
</script>

<template>
  <UContainer class="py-16">
    <div class="mx-auto max-w-3xl space-y-6">
      <h1 class="text-4xl font-bold">
        {{ $t('legal.terms.title') }}
      </h1>
      <p class="text-sm text-muted">
        {{ $t('legal.terms.lastUpdated') }} {{ new Date().toLocaleDateString('ru-RU') }}
      </p>

      <div class="space-y-4 text-sm text-muted leading-relaxed">
        <h2 class="text-xl font-semibold text-default">
          {{ $t('legal.terms.s1Title') }}
        </h2>
        <p>
          {{ $t('legal.terms.s1Text') }}
        </p>

        <h2 class="text-xl font-semibold text-default">
          {{ $t('legal.terms.s2Title') }}
        </h2>
        <p>
          {{ $t('legal.terms.s2Text') }}
        </p>

        <h2 class="text-xl font-semibold text-default">
          {{ $t('legal.terms.s3Title') }}
        </h2>
        <p>
          {{ $t('legal.terms.s3Text') }}
        </p>

        <h2 class="text-xl font-semibold text-default">
          {{ $t('legal.terms.s4Title') }}
        </h2>
        <p>
          {{ $t('legal.terms.s4Text') }}
        </p>

        <h2 class="text-xl font-semibold text-default">
          {{ $t('legal.terms.s5Title') }}
        </h2>
        <p>
          {{ $t('legal.terms.s5Text') }}
        </p>
      </div>
    </div>
  </UContainer>
</template>
