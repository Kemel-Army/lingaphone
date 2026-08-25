<script setup lang="ts">
import type { FamilyRegistrationAccount } from '../model/types'

interface Props {
  open: boolean
  accounts: FamilyRegistrationAccount[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const toast = useAppToast()
const copiedKey = ref<string | null>(null)

function accountLabel(role: string) {
  return role === 'PARENT' ? 'Родитель' : 'Ребёнок'
}

async function copyOne(account: FamilyRegistrationAccount) {
  const text = `${account.label} (${accountLabel(account.role)})\n${account.email} / ${account.password}`
  await navigator.clipboard.writeText(text)
  copiedKey.value = account.email
  setTimeout(() => {
    if (copiedKey.value === account.email) copiedKey.value = null
  }, 1500)
}

async function copyAll() {
  const text = props.accounts
    .map(a => `${a.label} (${accountLabel(a.role)}): ${a.email} / ${a.password}`)
    .join('\n')
  await navigator.clipboard.writeText(text)
  toast.success('Скопировано', 'Все логины и пароли скопированы')
}

function goToLogin() {
  emit('update:open', false)
  navigateTo('/login')
}
</script>

<template>
  <UModal
    :open="open"
    :dismissible="false"
    :ui="{ content: 'max-w-xl' }"
    @update:open="v => emit('update:open', v)"
  >
    <template #content>
      <div class="p-6 space-y-5">
        <div class="flex flex-col items-center text-center gap-2">
          <div class="flex size-14 items-center justify-center rounded-full bg-primary/10">
            <UIcon
              name="i-lucide-party-popper"
              class="size-7 text-primary"
            />
          </div>
          <h2 class="text-xl font-bold text-default">
            {{ $t('auth.familyRegister.successTitle') }}
          </h2>
          <p class="text-sm text-muted max-w-sm">
            {{ $t('auth.familyRegister.successDesc') }}
          </p>
        </div>

        <div class="space-y-3 max-h-80 overflow-y-auto pr-1">
          <div
            v-for="account in accounts"
            :key="account.email"
            class="rounded-xl border border-default bg-elevated p-4"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <UIcon
                  :name="account.role === 'PARENT' ? 'i-lucide-heart' : 'i-lucide-book-open'"
                  class="size-4 text-primary"
                />
                <span class="text-sm font-semibold text-default">{{ account.label }}</span>
                <UBadge
                  :label="accountLabel(account.role)"
                  size="xs"
                  color="neutral"
                  variant="subtle"
                />
              </div>
              <UButton
                :icon="copiedKey === account.email ? 'i-lucide-check' : 'i-lucide-copy'"
                size="xs"
                color="neutral"
                variant="ghost"
                @click="copyOne(account)"
              />
            </div>
            <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt class="text-muted">
                {{ $t('auth.familyRegister.loginLabel') }}
              </dt>
              <dd class="font-mono text-default select-all">
                {{ account.email }}
              </dd>
              <dt class="text-muted">
                {{ $t('auth.familyRegister.passwordLabel') }}
              </dt>
              <dd class="font-mono text-default select-all">
                {{ account.password }}
              </dd>
            </dl>
          </div>
        </div>

        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-info"
          :title="$t('auth.familyRegister.reviewNote')"
        />

        <div class="flex gap-3">
          <UButton
            :label="$t('auth.familyRegister.copy')"
            icon="i-lucide-copy"
            color="neutral"
            variant="subtle"
            class="flex-1"
            @click="copyAll"
          />
          <UButton
            :label="$t('auth.familyRegister.goToLogin')"
            color="primary"
            class="flex-1"
            @click="goToLogin"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
