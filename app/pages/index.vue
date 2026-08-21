<script setup lang="ts">
definePageMeta({
  layout: 'landing'
})

useSeoMeta({
  title: 'Lingaphone — Английский как второй родной язык для детей',
  description: 'Школа английского языка для детей в Алматы с 2013 года. Британская методика, мини-группы, Маркет достижений, онлайн по всему миру. 5 000+ выпускников.',
  ogTitle: 'Lingaphone — Английский как второй родной язык для детей',
  ogDescription: 'Школа английского для детей: британская методика, мини-группы, Маркет достижений — дети зарабатывают деньги за успехи. Алматы офлайн + онлайн.',
  ogType: 'website',
  ogImage: 'https://lingaphone.kz/og-cover.png',
  ogImageAlt: 'Lingaphone — школа английского языка для детей',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogUrl: 'https://lingaphone.kz',
  ogSiteName: 'Lingaphone',
  ogLocale: 'ru_KZ',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Lingaphone — Английский как второй родной язык для детей',
  twitterDescription: '13 лет опыта · 5 000+ учеников · Британская методика · Маркет достижений. Запишите ребёнка на пробный урок.',
  twitterImage: 'https://lingaphone.kz/og-cover.png'
})

useSchemaOrg([
  defineOrganization({
    name: 'Lingaphone',
    url: 'https://lingaphone.kz',
    logo: 'https://lingaphone.kz/logo.png'
  }),
  defineWebSite({
    name: 'Lingaphone'
  })
])
</script>

<template>
  <div class="femo-landing">
    <!-- Hero -->
    <LandingHero />

    <!-- О школе — 13 лет, 5000 учеников, 3 филиала -->
    <LandingResults />

    <!-- Британская методика -->
    <LandingMethod />

    <!-- Free level test — lead magnet -->
    <LandingLevelTestCta />

    <!-- Маркет достижений — уникальная фишка Lingaphone -->
    <LandingMarket />

    <!-- Геймификация — Lingo мскот, XP, streak -->
    <LandingGamification />

    <!-- Как это работает — 4 шага -->
    <LandingHowItWorks />

    <!-- Уровни A1→F4 -->
    <LandingLevels />

    <!-- AI-помощник для английского -->
    <LandingAiTutor />

    <!-- Mid-page CTA -->
    <LandingMidCta />

    <!-- Отзывы родителей -->
    <LandingTestimonials />

    <!-- Форматы и цены -->
    <LandingPricing />

    <!-- FAQ -->
    <LandingFaq />

    <!-- Финальный CTA — запись в WhatsApp -->
    <LandingCta />
  </div>
</template>
