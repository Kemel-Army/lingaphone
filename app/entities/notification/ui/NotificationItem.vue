<script setup lang="ts">
import type { AppNotification } from '../model/types'
import { NotificationType } from '~/shared/types/common'

defineProps<{
  notification: AppNotification
}>()

defineEmits<{
  (e: 'click', id: string): void
}>()

const iconMap: Record<NotificationType, string> = {
  [NotificationType.MEDAL_AWARDED]: 'i-lucide-medal',
  [NotificationType.PAYOUT_RECEIVED]: 'i-lucide-wallet',
  [NotificationType.HOMEWORK_CHECKED]: 'i-lucide-book-open',
  [NotificationType.LESSON_REMINDER]: 'i-lucide-calendar-clock',
  [NotificationType.NEW_MESSAGE]: 'i-lucide-message-circle',
  [NotificationType.SYSTEM]: 'i-lucide-bell'
}

const colorMap: Record<NotificationType, string> = {
  [NotificationType.MEDAL_AWARDED]: 'text-yellow-500 bg-yellow-500/10',
  [NotificationType.PAYOUT_RECEIVED]: 'text-emerald-500 bg-emerald-500/10',
  [NotificationType.HOMEWORK_CHECKED]: 'text-purple-500 bg-purple-500/10',
  [NotificationType.LESSON_REMINDER]: 'text-blue-500 bg-blue-500/10',
  [NotificationType.NEW_MESSAGE]: 'text-primary bg-primary/10',
  [NotificationType.SYSTEM]: 'text-gray-500 bg-gray-500/10'
}
</script>

<template>
  <button
    class="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-elevated/50"
    :class="{ 'bg-elevated/30': !notification.isRead }"
    @click="$emit('click', notification.id)"
  >
    <div
      class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full"
      :class="colorMap[notification.type] ?? 'text-gray-500 bg-gray-500/10'"
    >
      <UIcon
        :name="iconMap[notification.type] ?? 'i-lucide-bell'"
        class="size-4"
      />
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <p
          class="truncate text-sm"
          :class="notification.isRead ? 'text-muted' : 'font-medium text-default'"
        >
          {{ notification.title }}
        </p>
        <span
          v-if="!notification.isRead"
          class="size-2 shrink-0 rounded-full bg-primary"
        />
      </div>
      <p class="mt-0.5 line-clamp-2 text-xs text-dimmed">
        {{ notification.body }}
      </p>
      <p class="mt-1 text-xs text-dimmed">
        {{ formatRelativeTime(notification.createdAt) }}
      </p>
    </div>
  </button>
</template>
