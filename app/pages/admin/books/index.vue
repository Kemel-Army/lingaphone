<script setup lang="ts">
import { useBooks, BookPdfViewer, BOOK_LEVEL_META } from '~/entities/book'
import type { Book, BookLevel } from '~/entities/book'

definePageMeta({ layout: 'dashboard' })

type AdminBook = Book & { pdfUrl: string | null }

const toast = useToast()
const { fetchAllBooks, uploadBook, deleteBook } = useBooks()
const { data: books, pending, refresh } = await useAsyncData('admin-books', () => fetchAllBooks())

const LEVELS: BookLevel[] = ['A1', 'A2', 'B1', 'B2']

// ─── Upload state ───────────────────────────────────────────────────────────

const file = ref<File | null>(null)
const level = ref<BookLevel>('A1')
const title = ref('')
const isPublished = ref(true)
const uploading = ref(false)
const dragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const pickFile = (f: File | null | undefined) => {
  if (!f) return
  if (f.type !== 'application/pdf') {
    toast.add({ title: 'Только PDF', description: 'Перетащите PDF-файл учебника', color: 'error', icon: 'i-lucide-x' })
    return
  }
  file.value = f
  if (!title.value) title.value = f.name.replace(/\.pdf$/i, '')
}

const onDrop = (e: DragEvent) => {
  dragging.value = false
  pickFile(e.dataTransfer?.files?.[0])
}

const onInputChange = (e: Event) => {
  pickFile((e.target as HTMLInputElement).files?.[0])
}

const clearFile = () => {
  file.value = null
  title.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

const prettySize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

const submitUpload = async () => {
  if (!file.value) return
  uploading.value = true
  try {
    await uploadBook({
      file: file.value,
      level: level.value,
      title: title.value.trim() || undefined,
      isPublished: isPublished.value
    })
    toast.add({ title: 'Книга загружена', color: 'success', icon: 'i-lucide-check' })
    clearFile()
    await refresh()
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message ?? (e as Error).message
    toast.add({ title: 'Ошибка загрузки', description: msg, color: 'error', icon: 'i-lucide-x' })
  } finally {
    uploading.value = false
  }
}

// ─── View ───────────────────────────────────────────────────────────────────

const showViewer = ref(false)
const viewerBook = ref<AdminBook | null>(null)

const openBook = (b: AdminBook) => {
  if (!b.pdfUrl) {
    toast.add({ title: 'Файл не прикреплён', description: 'К этой книге не загружен PDF', color: 'warning', icon: 'i-lucide-file-x' })
    return
  }
  viewerBook.value = b
  showViewer.value = true
}

// ─── Delete ─────────────────────────────────────────────────────────────────

const deletingId = ref<string | null>(null)
const removeBook = async (b: AdminBook) => {
  if (!confirm(`Удалить книгу «${b.title}»? Файл и модули будут удалены.`)) return
  deletingId.value = b.id
  try {
    await deleteBook(b.id)
    toast.add({ title: 'Книга удалена', color: 'success', icon: 'i-lucide-trash-2' })
    await refresh()
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message ?? (e as Error).message
    toast.add({ title: 'Ошибка', description: msg, color: 'error', icon: 'i-lucide-x' })
  } finally {
    deletingId.value = null
  }
}

// ─── Grouping ───────────────────────────────────────────────────────────────

const booksByLevel = computed(() => {
  const map: Record<BookLevel, AdminBook[]> = { A1: [], A2: [], B1: [], B2: [] }
  for (const b of books.value ?? []) {
    if (map[b.level]) map[b.level].push(b)
  }
  return map
})

const totalBooks = computed(() => books.value?.length ?? 0)
</script>

<template>
  <div class="mx-auto max-w-6xl p-4 pb-16 sm:p-6 lg:p-8 space-y-8">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-black tracking-tight">
          Книги
        </h1>
        <p class="text-sm text-muted">
          {{ totalBooks }} учебников · перетащите PDF и выберите уровень
        </p>
      </div>
    </div>

    <!-- ─── Drag & drop uploader ────────────────────────────────────────────── -->
    <div class="rounded-3xl border border-default bg-default p-5 sm:p-6 space-y-5">
      <!-- Drop zone -->
      <div
        class="relative rounded-2xl border-2 border-dashed transition-colors cursor-pointer"
        :class="dragging
          ? 'border-primary bg-primary/5'
          : file
            ? 'border-primary/40 bg-primary/5'
            : 'border-default hover:border-primary/50 hover:bg-elevated/50'"
        @click="fileInput?.click()"
        @dragover.prevent="dragging = true"
        @dragenter.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <input
          ref="fileInput"
          type="file"
          accept="application/pdf"
          class="hidden"
          @change="onInputChange"
        >

        <!-- Empty state -->
        <div
          v-if="!file"
          class="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center"
        >
          <div class="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <UIcon
              name="i-lucide-upload-cloud"
              class="size-7 text-primary"
            />
          </div>
          <p class="font-semibold">
            Перетащите PDF сюда
          </p>
          <p class="text-sm text-muted">
            или нажмите, чтобы выбрать файл · до 50 МБ
          </p>
        </div>

        <!-- Selected file -->
        <div
          v-else
          class="flex items-center gap-4 py-5 px-5"
        >
          <div class="size-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <UIcon
              name="i-lucide-file-text"
              class="size-6 text-red-500"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold truncate">
              {{ file.name }}
            </p>
            <p class="text-xs text-muted">
              {{ prettySize(file.size) }}
            </p>
          </div>
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            color="neutral"
            size="sm"
            @click.stop="clearFile"
          />
        </div>
      </div>

      <!-- Level selector -->
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-muted mb-2">
          Уровень
        </p>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="lv in LEVELS"
            :key="lv"
            type="button"
            class="rounded-xl border-2 py-2.5 text-center transition-all"
            :class="level === lv
              ? `${BOOK_LEVEL_META[lv].bg} ${BOOK_LEVEL_META[lv].color} border-current font-black`
              : 'border-default text-muted hover:border-primary/40'"
            @click="level = lv"
          >
            <span class="block text-base font-black">{{ lv }}</span>
            <span class="block text-[10px] font-medium opacity-80">{{ BOOK_LEVEL_META[lv].label }}</span>
          </button>
        </div>
      </div>

      <!-- Title + publish + submit -->
      <div class="flex flex-col sm:flex-row sm:items-end gap-3">
        <UFormField
          label="Название"
          class="flex-1"
        >
          <UInput
            v-model="title"
            placeholder="Авто из имени файла"
            class="w-full"
          />
        </UFormField>
        <UCheckbox
          v-model="isPublished"
          label="Опубликовать"
          class="sm:mb-2.5"
        />
        <UButton
          icon="i-lucide-upload"
          :loading="uploading"
          :disabled="!file"
          size="lg"
          @click="submitUpload"
        >
          Загрузить
        </UButton>
      </div>
    </div>

    <!-- ─── Library ─────────────────────────────────────────────────────────── -->
    <div
      v-if="pending"
      class="py-16 text-center text-muted"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 animate-spin"
      />
    </div>

    <div
      v-else-if="!totalBooks"
      class="rounded-3xl border-2 border-dashed border-default py-16 text-center text-muted"
    >
      <UIcon
        name="i-lucide-book-marked"
        class="size-10 mx-auto opacity-30 mb-2"
      />
      <p>Книг ещё нет — загрузите первую выше.</p>
    </div>

    <div
      v-else
      class="space-y-8"
    >
      <section
        v-for="lv in LEVELS"
        v-show="booksByLevel[lv].length"
        :key="lv"
      >
        <div class="flex items-center gap-2 mb-3">
          <span
            class="inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-black"
            :class="[BOOK_LEVEL_META[lv].bg, BOOK_LEVEL_META[lv].color]"
          >
            {{ lv }}
          </span>
          <h2 class="font-bold">
            {{ BOOK_LEVEL_META[lv].label }}
          </h2>
          <span class="text-sm text-muted">· {{ booksByLevel[lv].length }}</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="b in booksByLevel[lv]"
            :key="b.id"
            class="group relative rounded-2xl border border-default bg-default overflow-hidden hover:shadow-lg transition-all cursor-pointer"
            @click="openBook(b)"
          >
            <!-- Cover -->
            <div
              class="aspect-3/4 flex items-center justify-center bg-linear-to-br relative"
              :class="BOOK_LEVEL_META[b.level].gradient"
            >
              <UIcon
                name="i-lucide-book-open-text"
                class="size-12 text-white/90"
              />
              <!-- Open overlay -->
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-neutral-900">
                  <UIcon
                    name="i-lucide-eye"
                    class="size-3.5"
                  />
                  Открыть
                </span>
              </div>
              <UIcon
                v-if="!b.pdfUrl"
                name="i-lucide-file-x"
                class="absolute top-2 left-2 size-4 text-white/80"
                title="PDF не прикреплён"
              />
            </div>
            <!-- Info -->
            <div class="p-3">
              <p class="font-semibold text-sm leading-tight line-clamp-2">
                {{ b.title }}
              </p>
              <div class="mt-2">
                <UBadge
                  :label="b.isPublished ? 'Опубликована' : 'Черновик'"
                  :color="b.isPublished ? 'success' : 'neutral'"
                  variant="subtle"
                  size="xs"
                />
              </div>
            </div>
            <!-- Delete -->
            <UButton
              icon="i-lucide-trash-2"
              variant="solid"
              color="error"
              size="xs"
              :loading="deletingId === b.id"
              class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              @click.stop="removeBook(b)"
            />
          </div>
        </div>
      </section>
    </div>

    <!-- ─── PDF Viewer Modal ────────────────────────────────────────────────── -->
    <UModal
      v-model:open="showViewer"
      fullscreen
    >
      <template #content>
        <div class="flex flex-col h-full">
          <div class="flex items-center justify-between gap-3 p-4 border-b border-default">
            <div class="min-w-0">
              <p class="font-bold truncate">
                {{ viewerBook?.title }}
              </p>
              <p class="text-xs text-muted">
                {{ viewerBook?.level }} · {{ BOOK_LEVEL_META[viewerBook?.level ?? 'A1'].label }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <UButton
                v-if="viewerBook?.pdfUrl"
                :to="viewerBook.pdfUrl"
                target="_blank"
                icon="i-lucide-external-link"
                variant="ghost"
                color="neutral"
                size="sm"
              >
                В новой вкладке
              </UButton>
              <UButton
                icon="i-lucide-x"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="showViewer = false"
              />
            </div>
          </div>
          <div class="flex-1 overflow-auto p-4 bg-elevated/30">
            <BookPdfViewer
              v-if="viewerBook?.pdfUrl"
              :id="viewerBook.id"
              :src="viewerBook.pdfUrl"
              :title="viewerBook.title"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
