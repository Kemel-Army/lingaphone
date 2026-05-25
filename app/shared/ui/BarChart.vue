<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'

const props = withDefaults(defineProps<{
  data: ChartData<'bar'>
  options?: ChartOptions<'bar'>
  height?: number
}>(), {
  height: 300
})

const defaultOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'bottom' }
  },
  scales: {
    y: { beginAtZero: true }
  }
}

const mergedOptions = computed(() => ({
  ...defaultOptions,
  ...props.options
}))
</script>

<template>
  <div :style="{ height: `${height}px` }">
    <Bar
      :data="data"
      :options="mergedOptions"
    />
  </div>
</template>
