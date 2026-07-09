<script setup lang="ts">
import { InteractiveBookReader } from '~/widgets/interactive-book'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const moduleId = computed(() => route.params.moduleId as string)
</script>

<template>
  <div class="p-3 sm:p-6 lg:p-8 w-full max-w-4xl mx-auto space-y-4">
    <UButton
      to="/student/book"
      icon="i-lucide-arrow-left"
      color="primary"
      variant="soft"
      size="sm"
      label="К «Мой путь»"
    />
    <InteractiveBookReader :module-id="moduleId" />
  </div>
</template>
