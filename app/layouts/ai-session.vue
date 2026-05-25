<script setup lang="ts">
/**
 * AI Session layout — full-height chat experience.
 * Minimal chrome: back button + slot fills entire viewport.
 */
</script>

<template>
  <UApp>
    <div class="flex h-screen flex-col">
      <slot />
    </div>
  </UApp>
</template>
