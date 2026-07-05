<script setup lang="ts">
import { useMyPath } from '~/entities/book'
import { MyPathMap } from '~/widgets/my-path'

definePageMeta({ layout: 'dashboard' })

const { fetchMyPath } = useMyPath()
const { data: path, pending } = await useAsyncData('my-path', fetchMyPath)
</script>

<template>
  <div class="p-3 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
    <!-- loading -->
    <div
      v-if="pending"
      class="space-y-4"
    >
      <div class="book-skeleton h-32 rounded-3xl" />
      <div
        v-for="n in 3"
        :key="n"
        class="flex items-start gap-4 rounded-3xl border border-default bg-default p-5"
      >
        <div class="book-skeleton size-12 shrink-0 rounded-2xl" />
        <div class="flex-1 space-y-2.5 pt-1">
          <div class="book-skeleton h-3.5 w-24 rounded-full" />
          <div class="book-skeleton h-4 w-3/4 rounded-full" />
          <div class="book-skeleton h-3 w-1/2 rounded-full" />
        </div>
      </div>
    </div>

    <MyPathMap
      v-else-if="path"
      :path="path"
    />
  </div>
</template>
