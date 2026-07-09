<script setup lang="ts">
import { useWazzupIframe } from '~/features/wazzup-chat'

const props = withDefaults(defineProps<{
  scope?: 'global' | 'card'
  chatType?: string
  chatId?: string
}>(), {
  scope: 'global',
  chatType: 'whatsapp',
  chatId: undefined
})

const { getUrl } = useWazzupIframe()

const url = ref('')
const loading = ref(true)
const notConfigured = ref(false)
const error = ref('')

const load = async () => {
  loading.value = true
  notConfigured.value = false
  error.value = ''
  try {
    const res = await getUrl({ scope: props.scope, chatType: props.chatType, chatId: props.chatId })
    url.value = res.url
  } catch (e: unknown) {
    const status = (e as { statusCode?: number, response?: { status?: number } })?.statusCode
      ?? (e as { response?: { status?: number } })?.response?.status
    const msg = (e as { data?: { message?: string } })?.data?.message ?? ''
    if (status === 503) notConfigured.value = true
    else error.value = msg || 'Не удалось открыть чат'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="w-full h-full min-h-96">
    <div
      v-if="loading"
      class="h-full grid place-items-center"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <div
      v-else-if="notConfigured"
      class="h-full grid place-items-center p-6"
    >
      <div class="text-center max-w-sm">
        <UIcon
          name="i-simple-icons-whatsapp"
          class="size-10 text-green-500 mx-auto mb-3"
        />
        <p class="font-semibold">
          Мессенджер не подключён
        </p>
        <p class="text-sm text-muted mt-1">
          Добавьте <code class="text-xs">WAZZUP_API_KEY</code> в <code class="text-xs">.env</code>
          (ЛК Wazzup24 → Каналы → Интеграция с CRM → API), затем перезапустите приложение.
          После этого здесь появится переписка WhatsApp / Telegram прямо в системе.
        </p>
      </div>
    </div>

    <div
      v-else-if="error"
      class="h-full grid place-items-center p-6"
    >
      <div class="text-center">
        <UIcon
          name="i-lucide-message-square-off"
          class="size-8 text-error mx-auto mb-2"
        />
        <p class="text-sm text-error">
          {{ error }}
        </p>
        <UButton
          class="mt-3"
          size="sm"
          variant="soft"
          @click="load"
        >
          Повторить
        </UButton>
      </div>
    </div>

    <iframe
      v-else
      :src="url"
      class="w-full h-full min-h-96 rounded-lg border border-subtle"
      allow="microphone *; clipboard-write *; autoplay *"
    />
  </div>
</template>
