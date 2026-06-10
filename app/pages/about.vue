<script setup lang="ts">
const { t } = useI18n()
definePageMeta({ layout: 'landing' })
useHead({ title: t('pages.about') })
useSeoMeta({ description: t('legal.about.seoDesc') })
</script>

<template>
  <UContainer class="py-16">
    <div class="mx-auto max-w-3xl space-y-8">
      <h1 class="text-4xl font-bold">
        {{ $t('legal.about.title') }}
      </h1>

      <div class="space-y-6 text-muted">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p v-html="$t('legal.about.intro')" />

        <h2 class="text-2xl font-semibold text-default">
          {{ $t('legal.about.missionTitle') }}
        </h2>
        <p>
          {{ $t('legal.about.missionText') }}
        </p>

        <h2 class="text-2xl font-semibold text-default">
          {{ $t('legal.about.iaeTitle') }}
        </h2>
        <p>
          {{ $t('legal.about.iaeText') }}
        </p>

        <h2 class="text-2xl font-semibold text-default">
          {{ $t('legal.about.aiTitle') }}
        </h2>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p v-html="$t('legal.about.aiText')" />

        <h2 class="text-2xl font-semibold text-default">
          {{ $t('legal.about.kzTitle') }} 🇰🇿
        </h2>
        <p>
          {{ $t('legal.about.kzText') }}
        </p>
      </div>
    </div>
  </UContainer>
</template>
