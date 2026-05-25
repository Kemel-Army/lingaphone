<script setup lang="ts">
/**
 * Animated mesh-gradient background.
 * Brand-colored radial blobs that drift slowly.
 *
 * Usage:
 *   <FemoMeshBg /> inside a `relative` container
 *   <FemoMeshBg variant="soft" /> for cheaper static version (dashboards)
 */
withDefaults(defineProps<{
  variant?: 'default' | 'soft'
}>(), {
  variant: 'default'
})
</script>

<template>
  <div
    class="femo-mesh"
    :class="variant === 'soft' && 'femo-mesh--soft'"
    aria-hidden="true"
  >
    <span class="femo-mesh-blob" />
  </div>
</template>
