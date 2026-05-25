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

const title = 'FEMO Platform — Олимпиадная математика нового поколения'
const description = 'Платформа FEMO на базе IAE (Intelligent Adaptive Education): AI-тренер, карта знаний, адаптивная диагностика и персональная траектория.'

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
