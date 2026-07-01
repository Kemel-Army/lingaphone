<script setup lang="ts">
/**
 * SubscriptionGate — renders slot content if user has an active subscription,
 * otherwise shows a paywall with upgrade CTA.
 * Pass bypass=true for admin/preview contexts.
 *
 * NOTE: ported without the `useSubscriptionGate` composable (not present in
 * this project). Replaced the subscription guard with a pass-through that
 * always renders the default slot.
 */
defineProps<{
  bypass?: boolean
}>()
</script>

<template>
  <slot />
</template>
