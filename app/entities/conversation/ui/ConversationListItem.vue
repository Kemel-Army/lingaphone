<script setup lang="ts">
import type { Conversation } from '../model/types'
import { UserAvatar } from '~/entities/user'

const props = defineProps<{
  conversation: Conversation
  currentUserId: string
  active?: boolean
}>()

const emit = defineEmits<{
  select: [conversationId: string]
}>()

/** Get the other participant (for 1:1 conversations). */
const otherParticipant = computed(() => {
  const participants = props.conversation.participants ?? []
  return participants.find(p => p.userId !== props.currentUserId) ?? participants[0]
})

const displayName = computed(() => {
  const p = otherParticipant.value
  if (!p?.user) return 'Чат'
  return `${p.user.name} ${p.user.surname}`.trim()
})

const lastMessagePreview = computed(() => {
  const msg = props.conversation.lastMessage
  if (!msg) return 'Нет сообщений'
  const text = msg.content ?? ''
  return text.length > 60 ? `${text.slice(0, 60)}…` : text
})

const lastMessageTime = computed(() => {
  const msg = props.conversation.lastMessage
  if (!msg) return ''
  const d = new Date(msg.createdAt)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const DAY = 86_400_000

  if (diff < DAY && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }
  if (diff < 2 * DAY) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
})

const isLastMessageOwn = computed(() =>
  props.conversation.lastMessage?.senderId === props.currentUserId
)

const unreadCount = computed(() => {
  // Count unread messages not sent by current user
  // For now, check if last message is unread and not own
  const msg = props.conversation.lastMessage
  if (!msg || isLastMessageOwn.value || msg.isRead) return 0
  return 1 // Simplified — in production, track actual unread count
})
</script>

<template>
  <button
    class="w-full flex items-center gap-3 rounded-xl p-3 text-left transition-colors"
    :class="active
      ? 'bg-primary/10 border border-primary/20'
      : 'hover:bg-elevated border border-transparent'"
    @click="emit('select', conversation.id)"
  >
    <!-- Avatar -->
    <div class="relative shrink-0">
      <UserAvatar
        v-if="otherParticipant?.user"
        :name="otherParticipant.user.name"
        :surname="otherParticipant.user.surname"
        :src="otherParticipant.user.avatarUrl"
        size="md"
      />
      <div
        v-else
        class="flex size-10 items-center justify-center rounded-full bg-elevated"
      >
        <UIcon
          name="i-lucide-message-circle"
          class="size-5 text-muted"
        />
      </div>
    </div>

    <!-- Content -->
    <div class="min-w-0 flex-1">
      <div class="flex items-center justify-between gap-2">
        <p
          class="truncate text-sm font-semibold"
          :class="unreadCount > 0 ? 'text-default' : ''"
        >
          {{ displayName }}
        </p>
        <span class="shrink-0 text-[11px] text-muted">
          {{ lastMessageTime }}
        </span>
      </div>
      <div class="mt-0.5 flex items-center justify-between gap-2">
        <p
          class="truncate text-xs"
          :class="unreadCount > 0 ? 'text-default font-medium' : 'text-muted'"
        >
          <span
            v-if="isLastMessageOwn"
            class="text-muted"
          >Вы: </span>
          {{ lastMessagePreview }}
        </p>
        <span
          v-if="unreadCount > 0"
          class="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white"
        >
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </span>
      </div>
    </div>
  </button>
</template>
