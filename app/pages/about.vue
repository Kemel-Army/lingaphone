<script setup lang="ts">
const { t } = useI18n()
definePageMeta({ layout: 'landing' })
useHead({ title: t('pages.about') })
useSeoMeta({ description: t('legal.about.seoDesc') })
</script>

<template>
  <UContainer class="py-16">
    <div class="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div class="space-y-8">
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
      <aside class="mx-auto self-start lg:sticky lg:top-24">
        <LandingMascot
          state="method-teacher"
          size="md"
          label="Помогаю превращать знания в речь"
          alt="Линг рассказывает о методике Lingaphone"
        />
      </aside>
    </div>
  </UContainer>
</template>
