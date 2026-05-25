<script setup lang="ts">
import { useCurrentUser } from '~/entities/user'

definePageMeta({ layout: 'dashboard' })

const { fullName } = useCurrentUser()
</script>

<template>
  <div class="p-6 space-y-4">
    <div>
      <h1 class="text-2xl font-bold">
        Админ-панель Lingaphone
      </h1>
      <p class="text-muted mt-1">
        Привет, {{ fullName }}!
      </p>
    </div>

    <UAlert
      icon="i-lucide-construction"
      color="warning"
      variant="subtle"
      title="В разработке"
      description="Здесь будут KPI школы: активные ученики, заявки на пробный, выручка месяца, выплаты медалей, конверсия воронки, лиды теста уровня."
    />
  </div>
</template>
