<script setup lang="ts">
import { WazzupPanel } from '~/widgets/wazzup'

definePageMeta({ layout: 'dashboard' })
</script>

<template>
  <div class="p-4 sm:p-6 max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
    <div class="mb-4">
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <UIcon
          name="i-simple-icons-whatsapp"
          class="size-6 text-green-500"
        />
        Мессенджер
      </h1>
      <p class="text-sm text-muted mt-0.5">
        WhatsApp, Telegram и др. — переписка с клиентами прямо в системе (Wazzup24)
      </p>
    </div>
    <UCard
      class="flex-1"
      :ui="{ body: 'h-full p-2' }"
    >
      <WazzupPanel scope="global" />
    </UCard>
  </div>
</template>
