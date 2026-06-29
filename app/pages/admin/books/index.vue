<script setup lang="ts">
import { useBooks, BOOK_LEVEL_META } from '~/entities/book'
import type { BookLevel } from '~/entities/book'

definePageMeta({ layout: 'dashboard' })

const toast = useToast()
const { fetchBooks } = useBooks()
const { data: books, pending, refresh } = await useAsyncData('admin-books', () => fetchBooks())

const LEVELS: BookLevel[] = ['A1', 'A2', 'B1', 'B2']

const open = ref(false)
const submitting = ref(false)
const form = reactive({
  title: '',
  level: 'A1' as BookLevel,
  description: '',
  isPublished: true,
  moduleTitle: '',
  pdfUrl: ''
})

const reset = () => {
  form.title = ''
  form.level = 'A1'
  form.description = ''
  form.isPublished = true
  form.moduleTitle = ''
  form.pdfUrl = ''
}

const submit = async () => {
  if (!form.title.trim()) {
    toast.add({ title: 'Укажите название книги', color: 'error' })
    return
  }
  submitting.value = true
  try {
    await $fetch('/api/admin/books', {
      method: 'POST',
      body: {
        title: form.title,
        level: form.level,
        description: form.description || undefined,
        isPublished: form.isPublished,
        modules: form.moduleTitle.trim()
          ? [{ title: form.moduleTitle, order: 1, pdfUrl: form.pdfUrl || undefined }]
          : []
      }
    })
    toast.add({ title: 'Книга создана', color: 'success' })
    open.value = false
    reset()
    await refresh()
  } catch (e) {
    toast.add({ title: 'Ошибка', description: (e as Error).message, color: 'error' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl p-4 pb-16 sm:p-6 lg:p-8">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black tracking-tight">
          Книги
        </h1>
        <p class="text-sm text-muted">
          Учебники и модули по уровням
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        label="Добавить книгу"
        @click="open = true"
      />
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
      v-else-if="!books?.length"
      class="py-20 text-center text-muted"
    >
      Книг ещё нет.
    </div>

    <div
      v-else
      class="overflow-hidden rounded-2xl border border-default"
    >
      <table class="w-full text-sm">
        <thead class="bg-elevated text-left text-xs uppercase text-muted">
          <tr>
            <th class="p-3">
              Название
            </th>
            <th class="p-3">
              Уровень
            </th>
            <th class="p-3">
              Статус
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="b in books"
            :key="b.id"
            class="border-t border-default"
          >
            <td class="p-3 font-medium">
              {{ b.title }}
            </td>
            <td class="p-3">
              <span
                class="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-black"
                :class="[BOOK_LEVEL_META[b.level].bg, BOOK_LEVEL_META[b.level].color]"
              >
                {{ b.level }}
              </span>
            </td>
            <td class="p-3">
              <UBadge
                :label="b.isPublished ? 'Опубликована' : 'Черновик'"
                :color="b.isPublished ? 'success' : 'neutral'"
                variant="subtle"
                size="xs"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal
      v-model:open="open"
      title="Новая книга"
    >
      <template #body>
        <div class="flex flex-col gap-4">
          <UFormField
            label="Название"
            required
          >
            <UInput
              v-model="form.title"
              placeholder="Access 1"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Уровень">
            <USelect
              v-model="form.level"
              :items="LEVELS"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Описание">
            <UTextarea
              v-model="form.description"
              :rows="2"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Модуль (название)"
            hint="опционально"
          >
            <UInput
              v-model="form.moduleTitle"
              placeholder="Module 1"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="PDF URL модуля"
            hint="/books/...pdf или ссылка из бакета"
          >
            <UInput
              v-model="form.pdfUrl"
              placeholder="/books/access-1-gb.pdf"
              class="w-full"
            />
          </UFormField>

          <UCheckbox
            v-model="form.isPublished"
            label="Опубликовать сразу"
          />
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            label="Отмена"
            color="neutral"
            variant="ghost"
            @click="open = false"
          />
          <UButton
            label="Создать"
            :loading="submitting"
            @click="submit"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
