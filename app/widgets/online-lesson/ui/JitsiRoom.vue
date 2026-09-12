<script setup lang="ts">
/**
 * Видеокомната урока.
 *
 * Две вещи, которые тут не очевидны:
 *
 * 1. Разрешения на камеру/микрофон. Jitsi живёт в iframe, а браузер не отдаёт
 *    туда устройства, пока (а) страница не запросила их сама и (б) у iframe
 *    нет атрибута `allow`. external_api.js создаёт iframe сам, поэтому мы
 *    сначала спрашиваем доступ на родительской странице, а атрибут проставляем
 *    на найденном iframe до того, как Jitsi успеет дойти до getUserMedia.
 *
 * 2. JWT. Без него на meet.jit.si встроенный звонок обрывается через 5 минут.
 *    Токен приходит с сервера (`/api/lessons/:id/join` или гостевой маршрут).
 */
const props = withDefaults(defineProps<{
  room: string
  displayName: string
  subject?: string
  domain?: string
  jwt?: string | null
  /** true = публичный demo-инстанс: предупреждаем про обрыв через 5 минут. */
  limited?: boolean
  moderator?: boolean
}>(), {
  subject: undefined,
  domain: undefined,
  jwt: null,
  limited: false,
  moderator: false
})

const emit = defineEmits<{ (e: 'left'): void }>()

interface JitsiApi {
  dispose: () => void
  addListener: (ev: string, cb: (...args: unknown[]) => void) => void
  getIFrame?: () => HTMLIFrameElement | null
}
type JitsiCtor = new (domain: string, options: Record<string, unknown>) => JitsiApi

const container = ref<HTMLElement | null>(null)
const loading = ref(true)
const error = ref('')
const permissionWarning = ref('')
const showLimitedNotice = ref(true)
let api: JitsiApi | null = null

const config = useRuntimeConfig()
const domain = computed(() => props.domain || (config.public.jitsiDomain as string) || 'meet.jit.si')

const MEDIA_ALLOW = 'camera; microphone; display-capture; autoplay; clipboard-write; fullscreen; speaker-selection'

/**
 * Спрашиваем камеру и микрофон на самой странице. Это даёт понятную ошибку
 * вместо немого «нет доступа» внутри Jitsi и заодно закрепляет разрешение за
 * нашим origin, чтобы iframe его унаследовал.
 */
const primeDevices = async () => {
  if (!import.meta.client) return
  if (!window.isSecureContext) {
    permissionWarning.value = 'Камера и микрофон работают только по HTTPS. Откройте урок по https-адресу или на localhost.'
    return
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    permissionWarning.value = 'Браузер не поддерживает доступ к камере. Обновите браузер или используйте Chrome.'
    return
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    // Освобождаем устройства — дальше их займёт сам Jitsi.
    stream.getTracks().forEach(t => t.stop())
  } catch (e: unknown) {
    const name = (e as { name?: string })?.name
    if (name === 'NotAllowedError') {
      permissionWarning.value = 'Доступ к камере и микрофону заблокирован. Нажмите на значок замка в адресной строке → «Камера»/«Микрофон» → «Разрешить», затем обновите страницу.'
    } else if (name === 'NotFoundError') {
      permissionWarning.value = 'Камера или микрофон не найдены. Подключите устройство и обновите страницу.'
    } else if (name === 'NotReadableError') {
      permissionWarning.value = 'Камера занята другой программой (Zoom, Skype, другая вкладка). Закройте её и обновите страницу.'
    } else {
      permissionWarning.value = 'Не удалось получить доступ к камере и микрофону.'
    }
  }
}

const loadScript = (host: string): Promise<JitsiCtor> => new Promise((resolve, reject) => {
  const w = window as unknown as { JitsiMeetExternalAPI?: JitsiCtor }
  if (w.JitsiMeetExternalAPI) return resolve(w.JitsiMeetExternalAPI)

  const onload = () => w.JitsiMeetExternalAPI ? resolve(w.JitsiMeetExternalAPI) : reject(new Error('Jitsi API недоступен'))
  const existing = document.getElementById('jitsi-external-api')
  if (existing) {
    existing.addEventListener('load', onload)
    existing.addEventListener('error', () => reject(new Error('Не удалось загрузить Jitsi')))
    return
  }

  const s = document.createElement('script')
  s.id = 'jitsi-external-api'
  s.src = `https://${host}/external_api.js`
  s.async = true
  s.onload = onload
  s.onerror = () => reject(new Error('Не удалось загрузить Jitsi'))
  document.head.appendChild(s)
})

/**
 * Досыпаем `allow` на iframe, который создал external_api.
 *
 * Свежие версии external_api.js ставят нужный `allow` сами, поэтому сверяем не
 * строку целиком, а наличие камеры и микрофона: иначе любое расхождение в
 * порядке директив заставляло бы перезагружать iframe на каждом монтировании
 * и рвало бы уже установленный postMessage-канал с Jitsi.
 */
const grantIframePermissions = () => {
  const frame = api?.getIFrame?.() ?? container.value?.querySelector('iframe')
  if (!frame) return

  const current = frame.getAttribute('allow') ?? ''
  const hasMedia = current.includes('camera') && current.includes('microphone')
  if (hasMedia) return

  frame.setAttribute('allow', MEDIA_ALLOW)
  frame.setAttribute('allowfullscreen', 'true')

  // Атрибут читается только при загрузке документа, поэтому без перезапуска
  // прав уже не добавить. Делаем это ровно один раз.
  const src = frame.getAttribute('src')
  if (src && !frame.dataset.permissionsApplied) {
    frame.dataset.permissionsApplied = '1'
    frame.setAttribute('src', src)
  }
}

onMounted(async () => {
  await primeDevices()
  try {
    const host = domain.value
    const Ctor = await loadScript(host)
    if (!container.value) return

    api = new Ctor(host, {
      roomName: props.room,
      jwt: props.jwt ?? undefined,
      parentNode: container.value,
      width: '100%',
      height: '100%',
      userInfo: { displayName: props.displayName },
      configOverwrite: {
        prejoinPageEnabled: true,
        disableDeepLinking: true,
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        // Тема урока в шапке комнаты вместо технического имени вида
        // `lingaphone-<uuid>`, которое ученику ничего не говорит.
        subject: props.subject
      },
      interfaceConfigOverwrite: { MOBILE_APP_PROMO: false }
    })

    grantIframePermissions()
    api.addListener('videoConferenceJoined', grantIframePermissions)
    api.addListener('videoConferenceLeft', () => emit('left'))
    api.addListener('errorOccurred', (...args: unknown[]) => {
      const detail = args[0] as { error?: { name?: string, message?: string } } | undefined
      const name = detail?.error?.name ?? ''
      if (name.includes('permission') || name.includes('Permission')) {
        permissionWarning.value = 'Jitsi не получил доступ к камере/микрофону. Разрешите доступ в настройках сайта и обновите страницу.'
      }
    })

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
      class="absolute inset-0 grid place-items-center bg-muted/20 z-10"
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
      class="absolute inset-0 grid place-items-center z-10"
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

    <!-- Предупреждения поверх комнаты: закрываемые, урок не блокируют -->
    <div class="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl px-3 space-y-2">
      <UAlert
        v-if="permissionWarning"
        color="warning"
        variant="solid"
        icon="i-lucide-camera-off"
        title="Нет доступа к камере или микрофону"
        :description="permissionWarning"
        close
        @update:open="permissionWarning = ''"
      />
      <UAlert
        v-if="limited && showLimitedNotice"
        color="warning"
        variant="subtle"
        icon="i-lucide-timer"
        title="Демо-режим видеосвязи"
        description="Используется публичный meet.jit.si — встроенный звонок обрывается через 5 минут. Для полноценных уроков нужно подключить JaaS (8x8) или свой сервер Jitsi."
        close
        @update:open="showLimitedNotice = false"
      />
    </div>

    <div
      ref="container"
      class="w-full h-full"
    />
  </div>
</template>
