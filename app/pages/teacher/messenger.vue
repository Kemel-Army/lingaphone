<script setup lang="ts">
import { MessengerWidget } from '~/widgets/messenger'

definePageMeta({ layout: 'dashboard' })
</script>

<template>
  <div class="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto">
    <header class="space-y-1 sm:space-y-2 mb-4 sm:mb-6">
      <p class="text-xs sm:text-sm font-bold text-primary uppercase tracking-wider">
        💬 Мессенджер
      </p>
      <h1 class="text-2xl sm:text-4xl font-black tracking-tight">
        Чаты групп
      </h1>
    </header>

    <MessengerWidget />
  </div>
</template>
