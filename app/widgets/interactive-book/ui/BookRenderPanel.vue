<script setup lang="ts">
// SSR-safe wrapper. The real panel (BookRenderPanelInner) imports vue-pdf-embed
// / pdfjs, which touch document/window at import time and crash on the server.
// So it is loaded only on the client via <ClientOnly> + async import — same
// pattern as BookPdfViewer. Importing this wrapper through the widget barrel is
// therefore safe for SSR pages (e.g. the student reader) too.
import { defineAsyncComponent } from 'vue'

const props = defineProps<{ moduleId: string, pdfUrl: string }>()
const emit = defineEmits<{ (e: 'rendered', count: number): void }>()

const Inner = defineAsyncComponent(() => import('./BookRenderPanelInner.vue'))
</script>

<template>
  <ClientOnly>
    <Inner
      :module-id="props.moduleId"
      :pdf-url="props.pdfUrl"
      @rendered="(n: number) => emit('rendered', n)"
    />
    <template #fallback>
      <div class="flex items-center gap-2 rounded-xl border border-default bg-elevated/40 p-3 text-xs text-muted">
        <UIcon
          name="i-lucide-loader-circle"
          class="size-4 animate-spin text-primary"
        />
        Загрузка рендера…
      </div>
    </template>
  </ClientOnly>
</template>
