<script setup lang="ts">
import type { AIConversation } from '../model/types'

const props = defineProps<{
  conversation: AIConversation
}>()

const modeLabels: Record<string, { label: string, icon: string }> = {
  EXPLAIN: { label: 'Объяснение', icon: 'i-lucide-book-open' },
  PRACTICE: { label: 'Практика', icon: 'i-lucide-brain' },
  CHECK_HW: { label: 'Проверка ДЗ', icon: 'i-lucide-clipboard-check' },
  MOCK_TEST: { label: 'Пробный тест', icon: 'i-lucide-timer' },
  FREE: { label: 'Свободный вопрос', icon: 'i-lucide-message-circle' }
}

const modeInfo = computed(() => modeLabels[props.conversation.mode] ?? { label: props.conversation.mode, icon: 'i-lucide-bot' })
</script>

<template>
  <NuxtLink
    :to="`/student/ai-tutor/${conversation.id}`"
    class="flex items-center justify-between rounded-lg border border-default p-3 transition hover:bg-elevated"
  >
    <div class="flex items-center gap-3">
      <UIcon
        :name="modeInfo.icon"
        class="size-5 text-primary"
      />
      <div>
        <p class="text-sm font-medium">
          {{ conversation.title ?? modeInfo.label }}
        </p>
        <p class="text-xs text-muted">
          {{ formatRelativeTime(conversation.updatedAt) }}
        </p>
      </div>
    </div>
    <UIcon
      name="i-lucide-chevron-right"
      class="size-4 text-muted"
    />
  </NuxtLink>
</template>
