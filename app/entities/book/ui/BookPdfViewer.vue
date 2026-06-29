<script setup lang="ts">
// SSR-safe wrapper. The real viewer (BookPdfViewerInner) uses pdfjs which
// touches the DOM/worker, so it is loaded only on the client via <ClientOnly>
// + async import. A skeleton is shown during SSR / initial chunk load.
import { defineAsyncComponent } from 'vue'

defineProps<{
  src: string
  title?: string
  id?: string
}>()

const Inner = defineAsyncComponent(() => import('./BookPdfViewerInner.vue'))
</script>

<template>
  <ClientOnly>
    <Inner
      :id="id"
      :src="src"
      :title="title"
    />
    <template #fallback>
      <div class="flex h-[78vh] flex-col items-center justify-center gap-3 rounded-2xl border border-default bg-default">
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-primary"
        />
        <p class="text-xs text-muted">
          Загрузка читалки…
        </p>
      </div>
    </template>
  </ClientOnly>
</template>
