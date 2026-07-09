<script setup lang="ts">
import { BookLibrary, type OpenPayload } from '~/widgets/book-library'
import { LessonPage } from '~/widgets/lesson-player'
import { InteractiveBookReader } from '~/widgets/interactive-book'

definePageMeta({ layout: 'dashboard' })

const reader = ref<OpenPayload | null>(null)
const openReader = (p: OpenPayload) => {
  reader.value = p
}
const closeReader = () => {
  reader.value = null
}
</script>

<template>
  <div class="p-3 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
    <header class="space-y-1">
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <UIcon
          name="i-lucide-library"
          class="size-6 text-primary"
        />
        Учебники
      </h1>
      <p class="text-sm text-muted">
        Все загруженные книги — открывай и читай как ученик.
      </p>
    </header>

    <BookLibrary @open="openReader" />

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
