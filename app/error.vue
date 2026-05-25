<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{
  error: NuxtError
}>()

const handleError = () => clearError({ redirect: '/' })

useHead({ title: 'Ошибка — FEMO Platform' })
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-default px-4">
    <div class="text-center">
      <p class="text-6xl font-bold text-primary">
        {{ error.statusCode ?? 500 }}
      </p>
      <h1 class="mt-4 text-2xl font-semibold">
        {{ error.statusCode === 404 ? 'Страница не найдена'
          : error.statusCode === 403 ? 'Доступ запрещён'
            : 'Произошла ошибка' }}
      </h1>
      <p class="mt-2 text-muted">
        {{ error.statusCode === 404
          ? 'Страница, которую вы ищете, не существует или была перемещена.'
          : error.statusCode === 403
            ? 'У вас нет прав для доступа к этой странице.'
            : error.message || 'Что-то пошло не так. Попробуйте обновить страницу.'
        }}
      </p>
      <div class="mt-6 flex items-center justify-center gap-3">
        <UButton
          label="На главную"
          icon="i-lucide-home"
          size="lg"
          @click="handleError"
        />
        <UButton
          label="Назад"
          icon="i-lucide-arrow-left"
          variant="outline"
          size="lg"
          @click="$router.back()"
        />
      </div>
    </div>
  </div>
</template>
