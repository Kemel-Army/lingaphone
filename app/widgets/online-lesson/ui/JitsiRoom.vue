<script setup lang="ts">
const props = defineProps<{
  room: string
  displayName: string
  subject?: string
}>()

const emit = defineEmits<{ (e: 'left'): void }>()

interface JitsiApi { dispose: () => void, addListener: (ev: string, cb: () => void) => void }
type JitsiCtor = new (domain: string, options: Record<string, unknown>) => JitsiApi

const container = ref<HTMLElement | null>(null)
const loading = ref(true)
const error = ref('')
let api: JitsiApi | null = null

const config = useRuntimeConfig()
const domain = (config.public.jitsiDomain as string) || 'meet.jit.si'

const loadScript = (): Promise<JitsiCtor> => new Promise((resolve, reject) => {
  const w = window as unknown as { JitsiMeetExternalAPI?: JitsiCtor }
  if (w.JitsiMeetExternalAPI) return resolve(w.JitsiMeetExternalAPI)
  const existing = document.getElementById('jitsi-external-api')
  const onload = () => w.JitsiMeetExternalAPI ? resolve(w.JitsiMeetExternalAPI) : reject(new Error('Jitsi API недоступен'))
  if (existing) {
    existing.addEventListener('load', onload)
    existing.addEventListener('error', () => reject(new Error('Не удалось загрузить Jitsi')))
    return
  }
  const s = document.createElement('script')
  s.id = 'jitsi-external-api'
  s.src = `https://${domain}/external_api.js`
  s.async = true
  s.onload = onload
  s.onerror = () => reject(new Error('Не удалось загрузить Jitsi'))
  document.head.appendChild(s)
})

onMounted(async () => {
  try {
    const Ctor = await loadScript()
    if (!container.value) return
    api = new Ctor(domain, {
      roomName: props.room,
      parentNode: container.value,
      width: '100%',
      height: '100%',
      userInfo: { displayName: props.displayName },
      configOverwrite: { prejoinPageEnabled: true, disableDeepLinking: true },
      interfaceConfigOverwrite: { MOBILE_APP_PROMO: false }
    })
    api.addListener('videoConferenceLeft', () => emit('left'))
    loading.value = false
  } catch (e: unknown) {
    error.value = (e as { message?: string })?.message ?? 'Ошибка подключения'
    loading.value = false
  }
})

onBeforeUnmount(() => {
  api?.dispose()
  api = null
})
</script>

<template>
  <div class="relative w-full h-full">
    <div
      v-if="loading"
      class="absolute inset-0 grid place-items-center bg-muted/20"
    >
      <div class="text-center">
        <UIcon
          name="i-lucide-loader-2"
          class="size-8 animate-spin text-muted mx-auto"
        />
        <p class="text-sm text-muted mt-2">
          Подключение к уроку…
        </p>
      </div>
    </div>
    <div
      v-if="error"
      class="absolute inset-0 grid place-items-center"
    >
      <div class="text-center">
        <UIcon
          name="i-lucide-video-off"
          class="size-8 text-error mx-auto"
        />
        <p class="text-sm text-error mt-2">
          {{ error }}
        </p>
      </div>
    </div>
    <div
      ref="container"
      class="w-full h-full"
    />
  </div>
</template>
