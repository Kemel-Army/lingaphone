<script setup lang="ts">
import { WazzupPanel } from '~/widgets/wazzup'

definePageMeta({ layout: 'dashboard' })
</script>

<template>
  <!-- Переписке нужна вся доступная высота и ширина: в узкой колонке с крупной
       шапкой на чат оставалось несколько строк. Поэтому ограничение по ширине
       снято, а заголовок ужат в одну строку. -->
  <div class="p-3 sm:p-4 h-[calc(100vh-7rem)] flex flex-col">
    <div class="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 shrink-0">
      <h1 class="text-xl font-bold flex items-center gap-2">
        <UIcon
          name="i-simple-icons-whatsapp"
          class="size-5 text-green-500"
        />
        Мессенджер
      </h1>
      <p class="text-xs text-muted">
        WhatsApp, Telegram и др. — переписка с клиентами прямо в системе (Wazzup24)
      </p>
    </div>
    <UCard
      class="flex-1 min-h-0"
      :ui="{ body: 'h-full p-2' }"
    >
      <WazzupPanel scope="global" />
    </UCard>
  </div>
</template>
