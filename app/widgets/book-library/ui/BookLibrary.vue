<script setup lang="ts">
import {
  useBooks, useLessons, BOOK_LEVEL_META,
  type LibraryBook, type LibraryModule, type BookLevel, type LessonUnitSummary
} from '~/entities/book'

// Библиотека всех книг (админ/учитель): книга → модули → (сканы | юниты).
// Открытие в просмотрщике — через событие (ридер рендерит страница):
//   scan  → InteractiveBookReader (страницы-сканы, read-only)
//   unit  → LessonPage (нативный юнит, read-only)
export type OpenPayload
  = | { kind: 'scan', moduleId: string, title: string }
    | { kind: 'unit', unitId: string, title: string }
const props = withDefaults(defineProps<{ adminMode?: boolean }>(), { adminMode: false })
const emit = defineEmits<{
  (e: 'open', payload: OpenPayload): void
}>()

const toast = useAppToast()
const { fetchAllBooksWithModules, setBookPublished, hideAllBooks } = useBooks()
const { fetchModuleUnits } = useLessons()
const { data, pending, refresh } = await useAsyncData('book-library', fetchAllBooksWithModules)
const books = computed<LibraryBook[]>(() => data.value ?? [])

const togglingId = ref<string | null>(null)
const togglePublished = async (book: LibraryBook) => {
  togglingId.value = book.id
  try {
    await setBookPublished(book.id, !book.isPublished)
    await refresh()
  } catch {
    toast.error('Не удалось изменить видимость книги')
  } finally {
    togglingId.value = null
  }
}

const hidingAll = ref(false)
const hideAllConfirmOpen = ref(false)
const confirmHideAll = async () => {
  hidingAll.value = true
  try {
    const { hidden } = await hideAllBooks()
    toast.success(`Скрыто книг: ${hidden}`)
    await refresh()
  } catch {
    toast.error('Не удалось скрыть книги')
  } finally {
    hidingAll.value = false
    hideAllConfirmOpen.value = false
  }
}

const LEVEL_ORDER: BookLevel[] = ['A1', 'A2', 'B1', 'B2']
const byLevel = computed(() => LEVEL_ORDER
  .map(level => ({ level, books: books.value.filter(b => b.level === level) }))
  .filter(g => g.books.length))

const expanded = reactive<Record<string, boolean>>({})
const unitsByModule = reactive<Record<string, LessonUnitSummary[]>>({})
const loadingUnits = reactive<Record<string, boolean>>({})

const toggle = async (moduleId: string) => {
  expanded[moduleId] = !expanded[moduleId]
  if (expanded[moduleId] && !unitsByModule[moduleId]) {
    loadingUnits[moduleId] = true
    try {
      unitsByModule[moduleId] = await fetchModuleUnits(moduleId)
    } catch {
      unitsByModule[moduleId] = []
    } finally {
      loadingUnits[moduleId] = false
    }
  }
}

const openUnit = (book: LibraryBook, m: LibraryModule, u: LessonUnitSummary) =>
  emit('open', { kind: 'unit', unitId: u.id, title: `${book.title} · ${m.title} · ${u.title}` })

const openScan = (book: LibraryBook, m: LibraryModule) =>
  emit('open', { kind: 'scan', moduleId: m.id, title: `${book.title} · ${m.title}` })
</script>

<template>
  <div>
    <div
      v-if="props.adminMode && !pending && books.length"
      class="flex justify-end mb-3"
    >
      <UButton
        icon="i-lucide-eye-off"
        color="neutral"
        variant="soft"
        size="sm"
        @click="hideAllConfirmOpen = true"
      >
        Скрыть все книги от учеников
      </UButton>
      <UModal v-model:open="hideAllConfirmOpen">
        <template #content>
          <div class="p-5 space-y-4">
            <p class="font-semibold">
              Скрыть все опубликованные книги?
            </p>
            <p class="text-sm text-muted">
              Книги останутся в базе (не удаляются), но ученики перестанут их видеть. Каждую можно будет включить обратно по отдельности.
            </p>
            <div class="flex justify-end gap-2">
              <UButton
                variant="ghost"
                color="neutral"
                :disabled="hidingAll"
                @click="hideAllConfirmOpen = false"
              >
                Отмена
              </UButton>
              <UButton
                color="error"
                :loading="hidingAll"
                @click="confirmHideAll"
              >
                Скрыть все
              </UButton>
            </div>
          </div>
        </template>
      </UModal>
    </div>

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
      v-else-if="!books.length"
      class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-default py-16 text-center text-muted"
    >
      <UIcon
        name="i-lucide-book-x"
        class="size-10"
      />
      <p class="text-sm">
        Книги ещё не загружены.
      </p>
    </div>

    <div
      v-else
      class="space-y-6"
    >
      <section
        v-for="grp in byLevel"
        :key="grp.level"
      >
        <div class="flex items-center gap-2 mb-3">
          <UBadge
            color="primary"
            variant="subtle"
          >
            {{ grp.level }}
          </UBadge>
          <span class="text-sm text-muted">{{ BOOK_LEVEL_META[grp.level]?.label ?? grp.level }}</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <UCard
            v-for="book in grp.books"
            :key="book.id"
          >
            <template #header>
              <div class="flex items-center justify-between gap-2">
                <p class="font-bold truncate">
                  {{ book.title }}
                </p>
                <div class="flex items-center gap-2 shrink-0">
                  <UBadge
                    :color="book.isPublished ? 'success' : 'neutral'"
                    variant="subtle"
                    size="sm"
                  >
                    {{ book.isPublished ? 'Видна ученикам' : 'Скрыта' }}
                  </UBadge>
                  <UButton
                    v-if="props.adminMode"
                    :icon="book.isPublished ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    :color="book.isPublished ? 'neutral' : 'primary'"
                    variant="soft"
                    size="xs"
                    :loading="togglingId === book.id"
                    @click="togglePublished(book)"
                  >
                    {{ book.isPublished ? 'Скрыть' : 'Показать' }}
                  </UButton>
                </div>
              </div>
            </template>

            <div
              v-if="book.modules.length"
              class="space-y-1.5"
            >
              <div
                v-for="m in book.modules"
                :key="m.id"
                class="rounded-lg border border-subtle overflow-hidden"
              >
                <!-- Сканы: pageCount>0 → прямое чтение -->
                <div
                  v-if="m.pageCount > 0"
                  class="flex items-center justify-between gap-2 px-3 py-2"
                >
                  <div class="min-w-0 flex items-center gap-2">
                    <UIcon
                      name="i-lucide-book-image"
                      class="size-4 shrink-0 text-primary"
                    />
                    <span class="text-sm font-medium truncate">{{ m.title }}</span>
                    <span class="text-xs text-muted shrink-0">{{ m.pageCount }} стр.</span>
                  </div>
                  <UButton
                    data-testid="open-scan"
                    icon="i-lucide-book-open"
                    size="xs"
                    variant="soft"
                    @click="openScan(book, m)"
                  >
                    Читать
                  </UButton>
                </div>

                <!-- Нативные модули: раскрыть → юниты -->
                <button
                  v-else
                  type="button"
                  data-testid="mod-toggle"
                  class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/30 transition-colors"
                  @click="toggle(m.id)"
                >
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="size-4 shrink-0 text-muted transition-transform"
                    :class="expanded[m.id] ? 'rotate-90' : ''"
                  />
                  <span class="text-sm font-medium truncate flex-1">{{ m.title }}</span>
                </button>

                <div
                  v-if="expanded[m.id]"
                  class="border-t border-subtle bg-muted/10 px-3 py-2 space-y-1"
                >
                  <div
                    v-if="loadingUnits[m.id]"
                    class="flex justify-center py-3"
                  >
                    <UIcon
                      name="i-lucide-loader-circle"
                      class="size-4 animate-spin text-muted"
                    />
                  </div>
                  <template v-else>
                    <div
                      v-for="u in (unitsByModule[m.id] ?? [])"
                      :key="u.id"
                      class="flex items-center justify-between gap-2 py-1"
                    >
                      <div class="min-w-0 flex items-center gap-2">
                        <UBadge
                          :color="u.kind === 'TEST' ? 'warning' : 'neutral'"
                          variant="subtle"
                          size="sm"
                        >
                          {{ u.kind === 'TEST' ? 'Тест' : 'Урок' }}
                        </UBadge>
                        <span class="text-sm truncate">{{ u.title }}</span>
                        <span class="text-xs text-muted shrink-0">{{ u.exerciseCount }} зад.</span>
                      </div>
                      <UButton
                        data-testid="open-unit"
                        icon="i-lucide-book-open"
                        size="xs"
                        variant="soft"
                        @click="openUnit(book, m, u)"
                      >
                        Открыть
                      </UButton>
                    </div>
                    <p
                      v-if="!(unitsByModule[m.id] ?? []).length"
                      class="text-xs text-muted py-1"
                    >
                      В модуле пока нет юнитов
                    </p>
                  </template>
                </div>
              </div>
            </div>
            <p
              v-else
              class="text-sm text-muted"
            >
              Нет модулей
            </p>
          </UCard>
        </div>
      </section>
    </div>
  </div>
</template>
