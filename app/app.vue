<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'ru'
  }
})

const title = 'Lingaphone — Школа английского языка'
const description = 'Lingaphone — школа английского языка для детей. Британская методика, AI-тренажёр, адаптивное обучение. Алматы + онлайн по всему миру.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage :transition="{ name: 'page-fade', mode: 'out-in' }" />
  </NuxtLayout>
</template>
