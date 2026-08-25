<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { t } = useI18n()

if (!user.value) {
  await navigateTo('/login')
}

const status = computed(() => (user.value as unknown as { user_status?: string })?.user_status)
const isRejected = computed(() => status.value === 'REJECTED')
const isBanned = computed(() => status.value === 'BANNED' || status.value === 'INACTIVE')

const checking = ref(false)
async function refreshStatus() {
  checking.value = true
  try {
    await supabase.auth.refreshSession()
    await reloadNuxtApp({ path: '/pending-approval' })
  } finally {
    checking.value = false
  }
}

async function logout() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}

useHead({ title: t('auth.pendingApproval.title') })
</script>

<template>
  <div class="flex flex-col items-center text-center gap-2 py-2">
    <LandingMascot
      v-if="!isRejected && !isBanned"
      state="faq-curious"
      size="lg"
    />
    <div
      v-else
      class="flex size-16 items-center justify-center rounded-full bg-error/10 mb-4"
    >
      <UIcon
        name="i-lucide-circle-x"
        class="size-8 text-error"
      />
    </div>

    <div class="space-y-2 mt-1">
      <h1 class="text-xl font-bold text-default">
        {{ isRejected ? $t('auth.pendingApproval.rejectedTitle')
          : isBanned ? $t('auth.pendingApproval.bannedTitle')
            : $t('auth.pendingApproval.title') }}
      </h1>
      <p class="text-sm text-muted max-w-sm">
        {{ isRejected ? $t('auth.pendingApproval.rejectedDesc')
          : isBanned ? $t('auth.pendingApproval.bannedDesc')
            : $t('auth.pendingApproval.desc') }}
      </p>
    </div>

    <div class="flex gap-3 mt-4">
      <UButton
        v-if="!isRejected && !isBanned"
        :label="$t('auth.pendingApproval.refresh')"
        icon="i-lucide-refresh-cw"
        color="primary"
        variant="subtle"
        :loading="checking"
        @click="refreshStatus"
      />
      <UButton
        :label="$t('auth.logout')"
        color="neutral"
        variant="ghost"
        @click="logout"
      />
    </div>
  </div>
</template>
