<script setup lang="ts">
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'

const props = withDefaults(defineProps<{
  data: ChartData<'line'>
  options?: ChartOptions<'line'>
  height?: number
}>(), {
  height: 300
})

const defaultOptions: ChartOptions<'line'> = {
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
    <Line
      :data="data"
      :options="mergedOptions"
    />
  </div>
</template>
