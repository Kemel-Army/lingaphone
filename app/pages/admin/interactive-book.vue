<script setup lang="ts">
import { LessonEditor } from '~/widgets/lesson-authoring'
import { useLessonAuthoring } from '~/features/lesson-authoring'

definePageMeta({ layout: 'dashboard' })

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
        Редактор уроков
      </h1>
      <p class="text-sm text-muted">
        Создавай юниты, пиши правила, добавляй задания и свои картинки, задавай ответы. Ученик видит это как книжную страницу.
      </p>
    </header>

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
  </div>
</template>
