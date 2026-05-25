<script setup lang="ts">
import type { ChatMessage } from '../model/types'
import { UserAvatar } from '~/entities/user'

const props = defineProps<{
  message: ChatMessage
  isOwn: boolean
}>()

const formattedTime = computed(() => {
  const d = new Date(props.message.createdAt)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
})

const _formattedDate = computed(() => {
  const d = new Date(props.message.createdAt)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Сегодня'
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
})
</script>

<template>
  <div
    class="flex gap-2.5"
    :class="isOwn ? 'flex-row-reverse' : 'flex-row'"
  >
    <!-- Avatar -->
    <UserAvatar
      v-if="!isOwn && message.sender"
      :name="message.sender.name"
      :surname="message.sender.surname"
      :src="message.sender.avatarUrl"
      size="xs"
      class="mt-1 shrink-0"
    />
    <div
      v-else-if="!isOwn"
      class="size-8 shrink-0"
    />

    <!-- Bubble -->
    <div
      class="max-w-[75%] space-y-1"
      :class="isOwn ? 'items-end' : 'items-start'"
    >
      <!-- Sender name for non-own messages -->
      <p
        v-if="!isOwn && message.sender"
        class="text-xs font-medium text-muted px-1"
      >
        {{ message.sender.name }} {{ message.sender.surname }}
      </p>

      <div
        class="rounded-2xl px-4 py-2.5 text-sm leading-relaxed wrap-break-word"
        :class="isOwn
          ? 'bg-primary text-white rounded-br-md'
          : 'bg-elevated border border-default rounded-bl-md'"
      >
        {{ message.content }}

        <!-- File attachments -->
        <div
          v-if="message.fileUrls && message.fileUrls.length > 0"
          class="mt-2 space-y-1"
        >
          <div
            v-for="(url, i) in message.fileUrls"
            :key="i"
            class="flex items-center gap-2 rounded-lg p-2"
            :class="isOwn ? 'bg-white/10' : 'bg-default'"
          >
            <UIcon
              name="i-lucide-paperclip"
              class="size-4 shrink-0"
            />
            <a
              :href="url"
              target="_blank"
              rel="noopener"
              class="text-xs underline truncate"
            >
              Прикреплённый файл
            </a>
          </div>
        </div>
      </div>

      <!-- Time + read status -->
      <div
        class="flex items-center gap-1 px-1"
        :class="isOwn ? 'justify-end' : 'justify-start'"
      >
        <span class="text-[10px] text-muted">
          {{ formattedTime }}
        </span>
        <UIcon
          v-if="isOwn"
          :name="message.isRead ? 'i-lucide-check-check' : 'i-lucide-check'"
          class="size-3"
          :class="message.isRead ? 'text-primary' : 'text-muted'"
        />
      </div>
    </div>
  </div>
</template>
