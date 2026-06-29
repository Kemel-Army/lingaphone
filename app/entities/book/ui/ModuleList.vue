<script setup lang="ts">
import type { BookModule } from '../model/types'

defineProps<{
  modules: BookModule[]
  activeId?: string | null
}>()

const emit = defineEmits<{ select: [module: BookModule] }>()
</script>

<template>
  <ul class="flex flex-col gap-1">
    <li
      v-for="m in modules"
      :key="m.id"
    >
      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors"
        :class="activeId === m.id
          ? 'border-primary/50 bg-primary/5'
          : 'border-default bg-default hover:bg-elevated'"
        @click="emit('select', m)"
      >
        <span class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-elevated text-xs font-black">
          {{ m.order }}
        </span>
        <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ m.title }}</span>
        <UIcon
          :name="m.pdfUrl ? 'i-lucide-file-text' : 'i-lucide-lock'"
          class="size-4 shrink-0 text-muted"
        />
      </button>
    </li>
  </ul>
</template>
