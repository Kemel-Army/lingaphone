<script setup lang="ts">
import { DirectorDashboard } from '~/widgets/director-dashboard'
import { useDirector, useDirectorBranch, branchToId, ALL_BRANCHES } from '~/features/director-stats'

definePageMeta({ layout: 'dashboard' })

const branch = useDirectorBranch()
const { fetchStats } = useDirector()
const { data: stats, pending } = await useAsyncData(
  () => `director-stats-${branch.value}`,
  () => fetchStats(branchToId(branch.value)),
  { watch: [branch] }
)
const isFiltered = computed(() => branch.value !== ALL_BRANCHES)
</script>

<template>
  <div class="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
    <div>
      <p class="text-sm font-bold text-primary uppercase tracking-wider">
        Директор
      </p>
      <h1 class="text-2xl font-black tracking-tight mt-0.5">
        Обзор школы
      </h1>
      <p class="text-sm text-muted mt-0.5">
        {{ isFiltered ? 'По выбранному филиалу' : 'По всей сети' }} · переключить филиал — в шапке
      </p>
    </div>

    <div
      v-if="pending || !stats"
      class="flex justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-muted"
      />
    </div>
    <DirectorDashboard
      v-else
      :stats="stats"
    />
  </div>
</template>
