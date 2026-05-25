<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'

const props = withDefaults(defineProps<{
  data: ChartData<'doughnut'>
  options?: ChartOptions<'doughnut'>
  height?: number
}>(), {
  height: 250
})

const defaultOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'bottom' }
  }
}

const mergedOptions = computed(() => ({
  ...defaultOptions,
  ...props.options
}))
</script>

<template>
  <div :style="{ height: `${height}px` }">
    <Doughnut
      :data="data"
      :options="mergedOptions"
    />
  </div>
</template>
