<script setup lang="ts">
/**
 * /admin/capsules — единый хаб «Мой путь»:
 *  1) загрузить книгу (PDF),
 *  2) собрать из неё путь (AI: модули + уроки),
 *  3) сгенерировать капсулы (11 слоёв) по каждому уроку.
 */
import { useLearningPath } from '~/entities/learning-path'
import { useBooks } from '~/entities/book'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Капсулы — генерация' })

const { fetchAllBooks, uploadBook, deleteBook } = useBooks()
const { fetchCapsuleOverview } = useLearningPath()
const toast = useToast()

const { data, pending, refresh } = useAsyncData('admin-capsules-hub', async () => {
  const [books, topics] = await Promise.all([fetchAllBooks(), fetchCapsuleOverview()])
  return { books, topics }
})

const books = computed(() => data.value?.books ?? [])
const topics = computed(() => data.value?.topics ?? [])
const topicsOfBook = (bookId: string) => topics.value.filter(t => t.bookId === bookId)
const orphanTopics = computed(() => topics.value.filter(t => !t.bookId))

// ── Upload ──
const uploadFile = ref<File | null>(null)
const uploadLevel = ref<'A1' | 'A2' | 'B1' | 'B2'>('A1')
const uploading = ref(false)
const onFile = (e: Event) => {
  uploadFile.value = (e.target as HTMLInputElement).files?.[0] ?? null
}
const doUpload = async () => {
  if (!uploadFile.value || uploading.value) return
  uploading.value = true
  try {
    await uploadBook({ file: uploadFile.value, level: uploadLevel.value })
    toast.add({ title: 'Книга загружена', color: 'success', icon: 'i-lucide-check' })
    uploadFile.value = null
    await refresh()
  } catch (e) {
    toast.add({ title: 'Ошибка загрузки', description: (e as Error).message, color: 'error' })
  } finally {
    uploading.value = false
  }
}

// ── Build path (AI structure) ──
const building = ref<Set<string>>(new Set())
const buildPath = async (bookId: string) => {
  if (building.value.has(bookId)) return
  building.value = new Set([...building.value, bookId])
  try {
    const res = await $fetch<{ topicsCreated: number, lessonsCreated: number }>('/api/ai/generate-book', {
      method: 'POST',
      body: { bookId }
    })
    toast.add({
      title: 'Путь собран',
      description: `Модулей: ${res.topicsCreated}, уроков: ${res.lessonsCreated}`,
      color: 'success',
      icon: 'i-lucide-check-circle-2'
    })
    await refresh()
  } catch (e) {
    const err = e as { data?: { message?: string }, message?: string }
    toast.add({ title: 'Не удалось собрать путь', description: err.data?.message ?? err.message, color: 'error' })
  } finally {
    const next = new Set(building.value)
    next.delete(bookId)
    building.value = next
  }
}

// ── Generate capsule (11 layers) ──
const generating = ref<Set<string>>(new Set())
const generate = async (lessonId: string, title: string) => {
  if (generating.value.has(lessonId)) return
  generating.value = new Set([...generating.value, lessonId])
  try {
    const res = await $fetch<{ layersCreated: number }>('/api/ai/generate-capsule', {
      method: 'POST',
      body: { lessonId }
    })
    toast.add({ title: `«${title}» — готово`, description: `Слоёв: ${res.layersCreated}`, color: 'success', icon: 'i-lucide-check-circle-2' })
    await refresh()
  } catch (e) {
    const err = e as { data?: { message?: string }, message?: string }
    toast.add({ title: `«${title}» — ошибка`, description: err.data?.message ?? err.message, color: 'error', icon: 'i-lucide-alert-triangle' })
  } finally {
    const next = new Set(generating.value)
    next.delete(lessonId)
    generating.value = next
  }
}

const onDeleteBook = async (id: string, title: string) => {
  if (!confirm(`Удалить книгу «${title}» и весь её путь?`)) return
  try {
    await deleteBook(id)
    toast.add({ title: 'Книга удалена', color: 'success', icon: 'i-lucide-check' })
    await refresh()
  } catch (e) {
    toast.add({ title: 'Ошибка удаления', description: (e as Error).message, color: 'error' })
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
    <header class="mb-6">
      <h1 class="text-2xl font-black tracking-tight">
        Капсулы «Мой путь»
      </h1>
      <p class="mt-1 text-sm text-muted">
        Загрузи книгу → собери путь (AI) → сгенерируй капсулы по урокам.
      </p>
    </header>

    <!-- Upload -->
    <div class="mb-8 rounded-2xl border border-dashed border-default bg-elevated/40 p-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          accept="application/pdf"
          class="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-white"
          @change="onFile"
        >
        <USelect
          v-model="uploadLevel"
          :items="['A1', 'A2', 'B1', 'B2']"
          class="w-24"
        />
        <UButton
          :loading="uploading"
          :disabled="!uploadFile"
          icon="i-lucide-upload"
          @click="doUpload"
        >
          Загрузить книгу
        </UButton>
      </div>
    </div>

    <div
      v-if="pending"
      class="py-20 text-center text-muted"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 animate-spin"
      />
    </div>

    <div
      v-else
      class="space-y-8"
    >
      <!-- Books -->
      <section
        v-for="book in books"
        :key="book.id"
        class="rounded-2xl border border-default p-4"
      >
        <div class="mb-3 flex items-center gap-2">
          <span class="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-black text-primary">{{ book.level }}</span>
          <h2 class="flex-1 truncate text-lg font-bold">
            {{ book.title }}
          </h2>
          <UButton
            v-if="!topicsOfBook(book.id).length"
            :loading="building.has(book.id)"
            size="sm"
            color="primary"
            icon="i-lucide-wand-sparkles"
            @click="buildPath(book.id)"
          >
            Собрать путь (AI)
          </UButton>
          <UButton
            size="xs"
            color="error"
            variant="ghost"
            icon="i-lucide-trash-2"
            @click="onDeleteBook(book.id, book.title)"
          />
        </div>

        <p
          v-if="!topicsOfBook(book.id).length"
          class="text-xs text-muted"
        >
          Путь ещё не собран. Нажми «Собрать путь (AI)» — Gemini прочитает PDF и создаст модули и уроки.
        </p>

        <div
          v-for="t in topicsOfBook(book.id)"
          :key="t.id"
          class="mt-3"
        >
          <h3 class="mb-1.5 text-xs font-bold uppercase tracking-widest text-muted">
            {{ t.orderIndex }}. {{ t.name }}
          </h3>
          <ul class="flex flex-col gap-1.5">
            <li
              v-for="l in t.lessons"
              :key="l.id"
              class="flex items-center gap-3 rounded-xl border border-default bg-default p-3"
            >
              <UIcon
                :name="l.layerCount >= 11 ? 'i-lucide-check-circle-2' : 'i-lucide-circle-dashed'"
                class="size-5 shrink-0"
                :class="l.layerCount >= 11 ? 'text-emerald-500' : 'text-muted'"
              />
              <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ l.title }}</span>
              <span
                class="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold"
                :class="l.layerCount >= 11 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'bg-elevated text-muted'"
              >{{ l.layerCount }}/11</span>
              <UButton
                size="xs"
                :color="l.layerCount >= 11 ? 'neutral' : 'primary'"
                :variant="l.layerCount >= 11 ? 'outline' : 'solid'"
                :loading="generating.has(l.id)"
                :icon="l.layerCount >= 11 ? 'i-lucide-refresh-cw' : 'i-lucide-sparkles'"
                @click="generate(l.id, l.title)"
              >
                {{ l.layerCount >= 11 ? 'Пересобрать' : 'Сгенерировать' }}
              </UButton>
            </li>
          </ul>
        </div>
      </section>

      <!-- Orphan topics (no book) -->
      <section
        v-if="orphanTopics.length"
        class="rounded-2xl border border-default p-4"
      >
        <h2 class="mb-3 text-lg font-bold">
          Без книги
        </h2>
        <div
          v-for="t in orphanTopics"
          :key="t.id"
          class="mt-3"
        >
          <h3 class="mb-1.5 text-xs font-bold uppercase tracking-widest text-muted">
            {{ t.orderIndex }}. {{ t.name }}
          </h3>
          <ul class="flex flex-col gap-1.5">
            <li
              v-for="l in t.lessons"
              :key="l.id"
              class="flex items-center gap-3 rounded-xl border border-default bg-default p-3"
            >
              <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ l.title }}</span>
              <span class="shrink-0 rounded-md bg-elevated px-2 py-0.5 text-xs font-bold text-muted">{{ l.layerCount }}/11</span>
              <UButton
                size="xs"
                :loading="generating.has(l.id)"
                icon="i-lucide-sparkles"
                @click="generate(l.id, l.title)"
              >
                Сгенерировать
              </UButton>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>
