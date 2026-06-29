<script setup lang="ts">
// Client-only PDF reader. Loads the document ONCE (usePdfDocument) and renders
// pages lazily — only pages near the viewport are decoded. Critical for this
// book: pages are JPEG2000 scans, slow to decode via the OpenJPEG wasm, so
// rendering all 78 at once would freeze the tab. Placeholders keep scroll
// geometry stable before a page paints.
import VuePdfEmbed, { usePdfDocument } from 'vue-pdf-embed'
import { useElementSize } from '@vueuse/core'

const props = defineProps<{
  src: string
  title?: string
  id?: string
}>()

const rootId = computed(() => props.id ?? 'book-pdf')

// getDocument options — wasmUrl points to OpenJPEG/JBIG2 wasm in /public so
// JPEG2000 scanned pages decode (else pages paint blank).
const source = computed(() => ({ url: props.src, wasmUrl: '/pdfjs-wasm/' }))

const loading = ref(true)
const failed = ref(false)
const progress = ref(0)

const { doc } = usePdfDocument({
  source,
  onProgress: (p: { loaded: number, total: number }) => {
    progress.value = p.total ? Math.round((p.loaded / p.total) * 100) : 0
  },
  onError: () => {
    failed.value = true
    loading.value = false
  }
})

// ── Page geometry (aspect ratios, no decode) ──────────────────
const totalPages = ref(0)
const aspects = ref<number[]>([]) // index 1..N → height/width
const currentPage = ref(1)

watch(doc, async (d) => {
  if (!d) return
  totalPages.value = d.numPages
  const a: number[] = []
  for (let i = 1; i <= d.numPages; i++) {
    const pg = await d.getPage(i)
    const vp = pg.getViewport({ scale: 1 })
    a[i] = vp.height / vp.width
  }
  aspects.value = a
  loading.value = false
  nextTick(setupObserver)
}, { immediate: true })

// ── Layout / zoom ─────────────────────────────────────────────
const scroller = ref<HTMLElement | null>(null)
const { width: containerW } = useElementSize(scroller)
const zoom = ref(1)
const ZOOM_MIN = 0.5
const ZOOM_MAX = 3

const pageWidth = computed(() => {
  const base = Math.min(Math.max((containerW.value || 800) - 32, 280), 1000)
  return Math.round(base * zoom.value)
})
const placeholderHeight = (n: number) => Math.round(pageWidth.value * (aspects.value[n] ?? 1.414))

const zoomIn = () => {
  zoom.value = Math.min(ZOOM_MAX, +(zoom.value + 0.2).toFixed(2))
}
const zoomOut = () => {
  zoom.value = Math.max(ZOOM_MIN, +(zoom.value - 0.2).toFixed(2))
}
const zoomReset = () => {
  zoom.value = 1
}

// ── Lazy render window ────────────────────────────────────────
const rendered = reactive(new Set<number>())
let observer: IntersectionObserver | null = null

const setupObserver = () => {
  observer?.disconnect()
  const root = scroller.value
  if (!root) return
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const n = Number((e.target as HTMLElement).dataset.page)
      if (!n) continue
      if (e.isIntersecting) {
        rendered.add(n)
        // Prefetch neighbours for smoother scroll.
        if (n > 1) rendered.add(n - 1)
        if (n < totalPages.value) rendered.add(n + 1)
        if (e.intersectionRatio > 0.3) currentPage.value = n
      }
    }
  }, { root, rootMargin: '400px 0px 400px 0px', threshold: [0, 0.3, 0.6] })
  nextTick(() => {
    root.querySelectorAll('[data-page]').forEach(el => observer!.observe(el))
  })
}

const scrollToPage = (n: number) => {
  document.getElementById(`${rootId.value}-ph-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
const prevPage = () => scrollToPage(Math.max(1, currentPage.value - 1))
const nextPage = () => scrollToPage(Math.min(totalPages.value, currentPage.value + 1))

// ── Fullscreen ────────────────────────────────────────────────
const wrapper = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)
const toggleFullscreen = async () => {
  if (!wrapper.value) return
  if (document.fullscreenElement) await document.exitFullscreen()
  else await wrapper.value.requestFullscreen()
}
const onFsChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}
onMounted(() => document.addEventListener('fullscreenchange', onFsChange))
onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFsChange)
  observer?.disconnect()
})
</script>

<template>
  <div
    ref="wrapper"
    class="flex flex-col overflow-hidden rounded-2xl border border-default bg-default"
    :class="isFullscreen ? 'h-screen' : ''"
  >
    <!-- Toolbar -->
    <div class="flex items-center gap-2 border-b border-default bg-elevated/60 px-3 py-2 backdrop-blur">
      <UIcon
        name="i-lucide-book-open"
        class="size-4 shrink-0 text-primary"
      />
      <span class="min-w-0 flex-1 truncate text-sm font-bold">{{ title ?? 'Книга' }}</span>

      <div class="flex items-center gap-1">
        <UButton
          icon="i-lucide-chevron-up"
          color="neutral"
          variant="ghost"
          size="xs"
          :disabled="currentPage <= 1"
          @click="prevPage"
        />
        <span class="min-w-14 text-center text-xs tabular-nums text-muted">
          {{ currentPage }} / {{ totalPages || '…' }}
        </span>
        <UButton
          icon="i-lucide-chevron-down"
          color="neutral"
          variant="ghost"
          size="xs"
          :disabled="currentPage >= totalPages"
          @click="nextPage"
        />
      </div>

      <div class="mx-1 h-5 w-px bg-default" />

      <div class="flex items-center gap-1">
        <UButton
          icon="i-lucide-minus"
          color="neutral"
          variant="ghost"
          size="xs"
          :disabled="zoom <= ZOOM_MIN"
          @click="zoomOut"
        />
        <button
          class="min-w-12 text-center text-xs tabular-nums text-muted hover:text-default"
          @click="zoomReset"
        >
          {{ Math.round(zoom * 100) }}%
        </button>
        <UButton
          icon="i-lucide-plus"
          color="neutral"
          variant="ghost"
          size="xs"
          :disabled="zoom >= ZOOM_MAX"
          @click="zoomIn"
        />
      </div>

      <div class="mx-1 h-5 w-px bg-default" />

      <UButton
        :icon="isFullscreen ? 'i-lucide-minimize' : 'i-lucide-maximize'"
        color="neutral"
        variant="ghost"
        size="xs"
        @click="toggleFullscreen"
      />
      <UButton
        icon="i-lucide-external-link"
        color="neutral"
        variant="ghost"
        size="xs"
        :to="src"
        target="_blank"
        external
      />
    </div>

    <!-- Scroll area -->
    <div
      ref="scroller"
      class="relative min-h-0 overflow-auto bg-neutral-100 px-2 py-4 dark:bg-neutral-900"
      :class="isFullscreen ? 'flex-1' : 'h-[78vh]'"
    >
      <!-- Initial load -->
      <div
        v-if="loading && !failed"
        class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-neutral-100/80 dark:bg-neutral-900/80"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-primary"
        />
        <p class="text-xs text-muted">
          Загрузка книги… {{ progress }}%
        </p>
      </div>

      <div
        v-if="failed"
        class="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted"
      >
        <UIcon
          name="i-lucide-file-x"
          class="size-8"
        />
        Не удалось загрузить PDF.
        <UButton
          :to="src"
          target="_blank"
          external
          variant="soft"
          size="sm"
          label="Открыть в новой вкладке"
        />
      </div>

      <!-- Lazy pages -->
      <div
        v-if="doc && totalPages"
        class="mx-auto flex flex-col items-center gap-4 pdf-pages"
        :style="{ width: pageWidth + 'px' }"
      >
        <div
          v-for="n in totalPages"
          :id="`${rootId}-ph-${n}`"
          :key="n"
          :data-page="n"
          class="relative w-full overflow-hidden rounded-md bg-white shadow-lg"
          :style="{ minHeight: placeholderHeight(n) + 'px' }"
        >
          <VuePdfEmbed
            v-if="rendered.has(n)"
            :source="doc"
            :page="n"
            :width="pageWidth"
            :scale="1.4"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center"
            :style="{ minHeight: placeholderHeight(n) + 'px' }"
          >
            <span class="text-xs text-muted">{{ n }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pdf-pages :deep(canvas) {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 6px;
}
</style>
