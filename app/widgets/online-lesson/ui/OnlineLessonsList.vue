<script setup lang="ts">
import type { OnlineLesson } from '~/features/online-lesson'

defineProps<{
  lessons: OnlineLesson[]
}>()

const fmt = (d: string) => new Date(d).toLocaleString('ru-RU', {
  weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
})
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="l in lessons"
      :key="l.id"
      class="flex items-center gap-4 rounded-xl border border-subtle p-4"
      :class="l.isLive ? 'border-primary/50 bg-primary/5' : l.isPast ? 'opacity-60' : ''"
    >
      <div
        class="rounded-xl p-3 shrink-0"
        :class="l.isLive ? 'bg-primary/15' : 'bg-muted/40'"
      >
        <UIcon
          name="i-lucide-video"
          class="size-5"
          :class="l.isLive ? 'text-primary' : 'text-muted'"
        />
      </div>
      <div class="min-w-0 flex-1">
        <p class="font-semibold truncate">
          {{ l.topic || 'Урок' }}
        </p>
        <p class="text-xs text-muted">
          {{ l.groupName }} · {{ fmt(l.startsAt) }}
        </p>
      </div>
      <UBadge
        v-if="l.isLive"
        color="success"
        variant="subtle"
      >
        <span class="size-1.5 rounded-full bg-green-500 animate-pulse mr-1" />
        Идёт
      </UBadge>
      <UBadge
        v-else-if="l.isPast"
        color="neutral"
        variant="subtle"
      >
        Завершён
      </UBadge>
      <UBadge
        v-else
        color="info"
        variant="subtle"
      >
        Скоро
      </UBadge>
      <UButton
        :to="`/lesson/${l.id}`"
        icon="i-lucide-video"
        size="sm"
        :disabled="!l.isLive"
        :variant="l.isLive ? 'solid' : 'soft'"
        :color="l.isLive ? 'primary' : 'neutral'"
      >
        Войти
      </UButton>
    </div>

    <p
      v-if="!lessons.length"
      class="text-center text-muted py-12"
    >
      Нет запланированных онлайн-уроков
    </p>
  </div>
</template>
