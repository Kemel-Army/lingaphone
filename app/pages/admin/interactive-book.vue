<script setup lang="ts">
import { LessonEditor } from '~/widgets/lesson-authoring'
import { useLessonAuthoring } from '~/features/lesson-authoring'
import { BookLibrary, type OpenPayload } from '~/widgets/book-library'
import { LessonPage } from '~/widgets/lesson-player'
import { InteractiveBookReader } from '~/widgets/interactive-book'

definePageMeta({ layout: 'dashboard' })

const tab = ref<'library' | 'editor'>('library')

// ─── Reader (просмотр как у детей: сканы или нативный юнит) ──────────
const reader = ref<OpenPayload | null>(null)
const openReader = (p: OpenPayload) => {
  reader.value = p
}
const closeReader = () => {
  reader.value = null
}

// ─── Редактор уроков (как было) ─────────────────────────────────────
const { fetchAuthoringModules } = useLessonAuthoring()
const { data, pending } = await useAsyncData('authoring-modules', fetchAuthoringModules, { server: false })
const modules = computed(() => data.value?.modules ?? [])
const selectedId = ref<string | undefined>()
const options = computed(() => modules.value.map(m => ({
  label: `${m.bookTitle} — ${m.moduleTitle}${m.isPublished ? '' : ' (черновик)'}`,
  value: m.moduleId
})))
watch(modules, (list) => {
  if (!selectedId.value && list.length) {
    const first = list.find(m => m.pageCount > 0) ?? list[0]
    if (first) selectedId.value = first.moduleId
  }
}, { immediate: true })
</script>

<template>
  <div class="p-3 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
    <header class="space-y-1">
      <p class="text-sm font-bold text-primary uppercase tracking-wider">
        📖 Учебник
      </p>
      <h1 class="text-2xl sm:text-3xl font-black tracking-tight">
        Интерактивная книга
      </h1>
      <p class="text-sm text-muted">
        Все загруженные книги — открывай и читай как ученик. Или создавай/редактируй уроки.
      </p>
    </header>

    <div class="flex items-center gap-1 flex-wrap">
      <UButton
        :variant="tab === 'library' ? 'solid' : 'ghost'"
        :color="tab === 'library' ? 'primary' : 'neutral'"
        size="sm"
        icon="i-lucide-library"
        @click="tab = 'library'"
      >
        Книги
      </UButton>
      <UButton
        :variant="tab === 'editor' ? 'solid' : 'ghost'"
        :color="tab === 'editor' ? 'primary' : 'neutral'"
        size="sm"
        icon="i-lucide-pencil-ruler"
        @click="tab = 'editor'"
      >
        Редактор уроков
      </UButton>
    </div>

    <!-- ─── Книги ─── -->
    <BookLibrary
      v-if="tab === 'library'"
      @open="openReader"
    />

    <!-- ─── Редактор ─── -->
    <template v-else>
      <div
        v-if="pending"
        class="flex h-40 items-center justify-center"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-primary"
        />
      </div>
      <div
        v-else-if="!modules.length"
        class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-default py-16 text-center text-muted"
      >
        <UIcon
          name="i-lucide-book-plus"
          class="size-10"
        />
        <p class="text-sm">
          Нет книг/модулей. Загрузи книгу, затем создавай уроки.
        </p>
      </div>
      <template v-else>
        <USelect
          v-model="selectedId"
          :items="options"
          value-key="value"
          placeholder="Выбери модуль"
          class="min-w-72"
        />
        <LessonEditor
          v-if="selectedId"
          :key="selectedId"
          :module-id="selectedId"
        />
      </template>
    </template>

    <!-- ─── Ридер книги (слайдовер) ─── -->
    <USlideover
      :open="!!reader"
      side="right"
      :ui="{ content: 'max-w-4xl w-full' }"
      @update:open="(v: boolean) => { if (!v) closeReader() }"
    >
      <template #content>
        <div class="flex flex-col h-full">
          <div class="flex items-center justify-between gap-3 border-b border-subtle px-4 py-3 shrink-0">
            <p class="font-semibold truncate">
              {{ reader?.title }}
            </p>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="closeReader"
            />
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <InteractiveBookReader
              v-if="reader?.kind === 'scan'"
              :key="reader.moduleId"
              :module-id="reader.moduleId"
              read-only
            />
            <LessonPage
              v-else-if="reader?.kind === 'unit'"
              :key="reader.unitId"
              :unit-id="reader.unitId"
              read-only
            />
          </div>
        </div>
      </template>
    </USlideover>
  </div>
</template>
