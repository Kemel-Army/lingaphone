<script setup lang="ts">
import { useCurrentUser } from '~/entities/user'

definePageMeta({ layout: 'dashboard' })

const { fullName } = useCurrentUser()
</script>

<template>
  <div class="p-6 space-y-4">
    <div>
      <h1 class="text-2xl font-bold">
        Кабинет педагога
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
      description="Здесь будут мои группы, ближайший урок, неоценённые уроки, журнал группы с посещаемостью и оценками, закрытие месяца с выдачей медалей."
    />
  </div>
</template>
