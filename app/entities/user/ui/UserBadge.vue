<script setup lang="ts">
import { UserRole, ROLE_LABELS } from '~/shared/types/common'

/**
 * Badge displaying user role with appropriate color.
 */
interface Props {
  role: UserRole
}

const props = defineProps<Props>()

const colorMap: Record<UserRole, string> = {
  [UserRole.STUDENT]: 'primary',
  [UserRole.PARENT]: 'info',
  [UserRole.TEACHER]: 'success',
  [UserRole.ADMIN]: 'error'
}
</script>

<template>
  <UBadge
    :color="(colorMap[props.role] as any)"
    variant="subtle"
    size="sm"
  >
    {{ ROLE_LABELS[props.role] }}
  </UBadge>
</template>
