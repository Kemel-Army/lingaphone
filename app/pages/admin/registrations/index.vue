<script setup lang="ts">
import { useRegistrationRequests } from '~/features/manage-registrations'

definePageMeta({ layout: 'dashboard' })

const { batches, loading, actingBatchId, fetchBatches, approve, reject } = useRegistrationRequests()

onMounted(fetchBatches)

const confirmTarget = ref<{ batchId: string, action: 'approve' | 'reject' } | null>(null)
const confirmOpen = ref(false)

function askApprove(batchId: string) {
  confirmTarget.value = { batchId, action: 'approve' }
  confirmOpen.value = true
}
function askReject(batchId: string) {
  confirmTarget.value = { batchId, action: 'reject' }
  confirmOpen.value = true
}

async function onConfirm() {
  if (!confirmTarget.value) return
  const { batchId, action } = confirmTarget.value
  if (action === 'approve') await approve(batchId)
  else await reject(batchId)
  confirmOpen.value = false
  confirmTarget.value = null
}

function fullName(p: { surname: string, name: string, patronymic: string | null }) {
  return [p.surname, p.name, p.patronymic].filter(Boolean).join(' ')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="space-y-6 p-4 sm:p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-default">
          Заявки на регистрацию
        </h1>
        <p class="text-sm text-muted mt-1">
          Семьи, зарегистрировавшиеся самостоятельно — одобрите или отклоните доступ
        </p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="subtle"
        :loading="loading"
        @click="fetchBatches"
      />
    </div>

    <div
      v-if="loading"
      class="flex items-center justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-6 animate-spin text-primary"
      />
    </div>

    <EmptyState
      v-else-if="!batches.length"
      icon="i-lucide-inbox"
      title="Нет новых заявок"
      description="Как только семья зарегистрируется, заявка появится здесь"
    />

    <div
      v-else
      class="space-y-4"
    >
      <div
        v-for="batch in batches"
        :key="batch.batchId"
        class="rounded-xl border border-default bg-elevated p-5"
      >
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div class="flex items-center gap-3">
            <UBadge
              :label="batch.status === 'REJECTED' ? 'Отклонено' : 'На рассмотрении'"
              :color="batch.status === 'REJECTED' ? 'error' : 'warning'"
              variant="subtle"
            />
            <span class="text-xs text-muted">{{ formatDate(batch.createdAt) }}</span>
          </div>
          <div class="flex gap-2">
            <UButton
              label="Отклонить"
              icon="i-lucide-x"
              color="error"
              variant="subtle"
              size="sm"
              :loading="actingBatchId === batch.batchId"
              @click="askReject(batch.batchId)"
            />
            <UButton
              label="Одобрить"
              icon="i-lucide-check"
              color="primary"
              size="sm"
              :loading="actingBatchId === batch.batchId"
              @click="askApprove(batch.batchId)"
            />
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
              Родители
            </h3>
            <div class="space-y-2">
              <div
                v-for="p in batch.parents"
                :key="p.userId"
                class="rounded-lg bg-default p-3 text-sm"
              >
                <div class="font-medium text-default">
                  {{ fullName(p) }}
                </div>
                <div class="text-muted mt-0.5">
                  {{ p.phone }} · {{ p.email }}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
              Дети
            </h3>
            <div class="space-y-2">
              <div
                v-for="c in batch.children"
                :key="c.userId"
                class="rounded-lg bg-default p-3 text-sm"
              >
                <div class="font-medium text-default">
                  {{ fullName(c) }}
                </div>
                <div class="text-muted mt-0.5">
                  <span v-if="c.age">{{ c.age }} лет</span>
                  <span v-if="c.schoolGrade"> · {{ c.schoolGrade }} класс</span>
                  <span v-if="c.schoolName"> · {{ c.schoolName }}</span>
                </div>
                <div class="text-dimmed mt-0.5 font-mono text-xs">
                  {{ c.email }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-model:open="confirmOpen"
      :title="confirmTarget?.action === 'approve' ? 'Одобрить заявку?' : 'Отклонить заявку?'"
      :description="confirmTarget?.action === 'approve'
        ? 'Все аккаунты семьи (родители + дети) получат доступ к платформе.'
        : 'Все аккаунты семьи останутся заблокированы.'"
      :variant="confirmTarget?.action === 'reject' ? 'destructive' : 'primary'"
      :confirm-label="confirmTarget?.action === 'approve' ? 'Одобрить' : 'Отклонить'"
      @confirm="onConfirm"
    />
  </div>
</template>
