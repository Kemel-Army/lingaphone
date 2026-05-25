<script setup lang="ts">
/**
 * StudentXpGain — Floating "+N XP" animation that fades up.
 */
defineProps<{
  amount: number
}>()

const show = ref(true)

onMounted(() => {
  setTimeout(() => {
    show.value = false
  }, 1500)
})
</script>

<template>
  <span
    v-if="show"
    class="xp-gain inline-flex items-center gap-1 rounded-full bg-[var(--color-xp-soft)] px-2.5 py-1 text-sm font-bold text-[var(--color-xp)]"
  >
    <UIcon
      name="i-lucide-zap"
      class="size-3.5"
    />
    +{{ amount }} XP
  </span>
</template>
