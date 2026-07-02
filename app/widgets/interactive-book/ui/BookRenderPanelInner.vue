<script setup lang="ts">
/**
 * Admin render panel (client-only): loads the module's PDF and rasterises a
 * page range to PNG in the browser (the only place the JPEG2000 scans decode),
 * uploading each page. Emits `rendered` so the editor can reload.
 */
import { usePdfDocument } from 'vue-pdf-embed'
import { useBookAuthoring } from '~/features/book-authoring'

const props = defineProps<{ moduleId: string, pdfUrl: string }>()
const emit = defineEmits<{ (e: 'rendered', count: number): void }>()

const { renderModulePages } = useBookAuthoring()
const toast = useToast()

const source = computed(() => ({ url: props.pdfUrl, wasmUrl: '/pdfjs-wasm/' }))
const docFailed = ref(false)
const { doc } = usePdfDocument({
  source,
  onError: () => { docFailed.value = true }
})

const totalPages = computed(() => (doc.value as { numPages?: number } | null)?.numPages ?? 0)

const fromPage = ref(1)
const toPage = ref(1)
watch(totalPages, (n) => {
  if (n && toPage.value === 1) toPage.value = Math.min(n, 8) // sensible default: first module
})

const rendering = ref(false)
const progress = ref(0)
const progressText = ref('')

const render = async () => {
  if (!doc.value || rendering.value) return
  const from = Math.max(1, Math.min(fromPage.value, totalPages.value))
  const to = Math.max(from, Math.min(toPage.value, totalPages.value))
  rendering.value = true
  progress.value = 0
  try {
    await renderModulePages({
      doc: doc.value,
      moduleId: props.moduleId,
      fromPage: from,
      toPage: to,
      scale: 2,
      onProgress: (done, total, pageNumber) => {
        progress.value = Math.round((done / total) * 100)
        progressText.value = `Стр. ${pageNumber} (${done}/${total})`
      }
    })
    toast.add({ title: 'Страницы отрендерены', description: `${to - from + 1} стр.`, color: 'success' })
    emit('rendered', to - from + 1)
  } catch (e: unknown) {
    toast.add({ title: 'Ошибка рендера', description: String((e as Error)?.message ?? e), color: 'error' })
  } finally {
    rendering.value = false
    progressText.value = ''
  }
}
</script>

<template>
  <div class="rounded-xl border border-default bg-elevated/40 p-3">
    <div
      v-if="docFailed"
      class="text-sm text-error"
    >
      Не удалось открыть PDF модуля.
    </div>
    <template v-else>
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label class="mb-1 block text-xs font-medium text-muted">Страницы PDF</label>
          <div class="flex items-center gap-1">
            <UInput
              v-model.number="fromPage"
              type="number"
              size="xs"
              class="w-16"
              :min="1"
              :max="totalPages || 1"
            />
            <span class="text-muted">—</span>
            <UInput
              v-model.number="toPage"
              type="number"
              size="xs"
              class="w-16"
              :min="1"
              :max="totalPages || 1"
            />
            <span class="ml-1 text-xs text-muted">из {{ totalPages || '…' }}</span>
          </div>
        </div>
        <UButton
          size="sm"
          icon="i-lucide-image-down"
          :loading="rendering"
          :disabled="!totalPages"
          label="Отрендерить страницы"
          color="primary"
          @click="render"
        />
        <div
          v-if="rendering"
          class="flex min-w-40 flex-1 items-center gap-2"
        >
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-default">
            <div
              class="h-full rounded-full bg-primary transition-all"
              :style="{ width: progress + '%' }"
            />
          </div>
          <span class="text-xs tabular-nums text-muted">{{ progressText }}</span>
        </div>
      </div>
      <p class="mt-2 text-xs text-muted">
        Рендерит выбранный диапазон страниц книги в картинки. Для пилота — страницы одного модуля.
      </p>
    </template>
  </div>
</template>
