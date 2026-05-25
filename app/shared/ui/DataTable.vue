<script setup lang="ts">
/**
 * DataTable — generic table with sorting, pagination, and empty state.
 * Uses Nuxt UI v4 UTable under the hood.
 */

interface Column {
  key: string
  label: string
  sortable?: boolean
  class?: string
}

interface Props {
  columns: Column[]
  rows: Record<string, any>[]
  loading?: boolean
  emptyText?: string
  emptyIcon?: string
  pageSize?: number
  sortable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyText: 'Нет данных',
  emptyIcon: 'i-lucide-inbox',
  pageSize: 10,
  sortable: true
})

const emit = defineEmits<{
  'row-click': [row: Record<string, any>]
}>()

// Pagination
const page = ref(1)
const totalPages = computed(() => Math.ceil(props.rows.length / props.pageSize))
const paginatedRows = computed(() => {
  const start = (page.value - 1) * props.pageSize
  return props.rows.slice(start, start + props.pageSize)
})

// Sort
const sortColumn = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

function toggleSort(column: Column) {
  if (!column.sortable && props.sortable) return
  if (sortColumn.value === column.key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column.key
    sortDirection.value = 'asc'
  }
}

const sortedRows = computed(() => {
  if (!sortColumn.value) return paginatedRows.value
  return [...paginatedRows.value].sort((a, b) => {
    const aVal = a[sortColumn.value!]
    const bVal = b[sortColumn.value!]
    if (aVal == null) return 1
    if (bVal == null) return -1
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
    return sortDirection.value === 'asc' ? cmp : -cmp
  })
})

function onRowClick(row: Record<string, any>) {
  emit('row-click', row)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Loading state -->
    <div
      v-if="loading"
      class="flex items-center justify-center py-12"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-6 animate-spin text-primary"
      />
      <span class="ml-2 text-sm text-muted">Загрузка...</span>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!rows.length"
      class="flex flex-col items-center justify-center py-12 text-center"
    >
      <UIcon
        :name="emptyIcon"
        class="size-12 text-dimmed mb-3"
      />
      <p class="text-sm text-muted">
        {{ emptyText }}
      </p>
      <slot name="empty-action" />
    </div>

    <!-- Table -->
    <div
      v-else
      class="overflow-x-auto"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-default">
            <th
              v-for="col in columns"
              :key="col.key"
              :class="[
                'px-3 py-2 text-left font-medium text-muted',
                col.sortable !== false && sortable ? 'cursor-pointer select-none hover:text-highlighted' : '',
                col.class
              ]"
              @click="col.sortable !== false && sortable ? toggleSort(col) : undefined"
            >
              <div class="flex items-center gap-1">
                {{ col.label }}
                <UIcon
                  v-if="sortColumn === col.key"
                  :name="sortDirection === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
                  class="size-3.5"
                />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in sortedRows"
            :key="idx"
            class="border-b border-default last:border-0 hover:bg-elevated cursor-pointer transition-colors"
            @click="onRowClick(row)"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :class="['px-3 py-2.5', col.class]"
            >
              <slot
                :name="`cell-${col.key}`"
                :row="row"
                :value="row[col.key]"
              >
                {{ row[col.key] ?? '—' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="flex items-center justify-between pt-2"
    >
      <span class="text-xs text-muted">
        {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, rows.length) }} из {{ rows.length }}
      </span>
      <div class="flex gap-1">
        <UButton
          icon="i-lucide-chevron-left"
          size="xs"
          color="neutral"
          variant="ghost"
          :disabled="page <= 1"
          @click="page--"
        />
        <UButton
          icon="i-lucide-chevron-right"
          size="xs"
          color="neutral"
          variant="ghost"
          :disabled="page >= totalPages"
          @click="page++"
        />
      </div>
    </div>
  </div>
</template>
