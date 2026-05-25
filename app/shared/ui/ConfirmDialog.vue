<script setup lang="ts">
/**
 * Shared ConfirmDialog — confirm/cancel modal.
 */
interface Props {
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'destructive'
  loading?: boolean
}

const _props = withDefaults(defineProps<Props>(), {
  title: 'Подтверждение',
  description: 'Вы уверены?',
  confirmLabel: 'Подтвердить',
  cancelLabel: 'Отмена',
  variant: 'primary',
  loading: false
})

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function onConfirm() {
  emit('confirm')
}
function onCancel() {
  open.value = false
  emit('cancel')
}
</script>

<template>
  <UModal v-model:open="open">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">
            {{ title }}
          </h3>
        </template>
        <p class="text-sm text-muted">
          {{ description }}
        </p>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              :label="cancelLabel"
              variant="outline"
              @click="onCancel"
            />
            <UButton
              :label="confirmLabel"
              :color="variant === 'destructive' ? 'error' : 'primary'"
              :loading="loading"
              @click="onConfirm"
            />
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
