<script setup lang="ts">
/**
 * Гостевой вход на онлайн-урок по ссылке — БЕЗ регистрации.
 *
 * Для пробных уроков и клиентов, которым аккаунт на платформе не нужен.
 * Страница публичная (исключена из supabase redirect в nuxt.config), поэтому
 * всё, что она умеет, ограничено тем, что отдаёт `/api/guest/lesson/:token`.
 */
import { JitsiRoom } from '~/widgets/online-lesson'

definePageMeta({ layout: false })

const route = useRoute()
const token = computed(() => route.params.token as string)

interface Preview {
  topic: string
  startsAt: string
  durationMin: number
  guestName: string | null
  canJoin: boolean
  isPast: boolean
}
interface GuestJoin {
  domain: string
  room: string
  jwt: string | null
  limited: boolean
  displayName: string
  topic: string
}

const { data: preview, error: previewError, pending } = await useAsyncData<Preview>(
  () => `guest-lesson-${token.value}`,
  () => $fetch<Preview>(`/api/guest/lesson/${token.value}`)
)

const name = ref('')
watchEffect(() => {
  if (preview.value?.guestName && !name.value) name.value = preview.value.guestName
})

const join = ref<GuestJoin | null>(null)
const joining = ref(false)
const joinError = ref('')

const startsAtLabel = computed(() => {
  if (!preview.value) return ''
  return new Date(preview.value.startsAt).toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
  })
})

const previewMessage = computed(() => {
  const e = previewError.value as { data?: { message?: string }, statusCode?: number } | null
  return e?.data?.message ?? 'Ссылка недействительна'
})

const enter = async () => {
  if (name.value.trim().length < 2) {
    joinError.value = 'Введите имя (минимум 2 символа)'
    return
  }
  joining.value = true
  joinError.value = ''
  try {
    join.value = await $fetch<GuestJoin>(`/api/guest/lesson/${token.value}`, {
      method: 'POST',
      body: { name: name.value.trim() }
    })
  } catch (e: unknown) {
    joinError.value = (e as { data?: { message?: string } })?.data?.message ?? 'Не удалось подключиться'
  } finally {
    joining.value = false
  }
}
</script>

<template>
  <div class="h-dvh flex flex-col bg-slate-950 text-white">
    <!-- В комнате -->
    <template v-if="join">
      <div class="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 shrink-0">
        <UIcon
          name="i-lucide-graduation-cap"
          class="size-5 text-primary"
        />
        <div class="min-w-0">
          <p class="font-semibold text-sm truncate">
            {{ join.topic }}
          </p>
          <p class="text-xs text-white/60">
            Lingaphone · гостевой вход
          </p>
        </div>
      </div>
      <div class="flex-1 min-h-0">
        <JitsiRoom
          :room="join.room"
          :domain="join.domain"
          :jwt="join.jwt"
          :limited="join.limited"
          :display-name="join.displayName"
          :subject="join.topic"
          @left="join = null"
        />
      </div>
    </template>

    <!-- Экран входа -->
    <div
      v-else
      class="flex-1 grid place-items-center p-4"
    >
      <div
        v-if="pending"
        class="text-center"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="size-8 animate-spin text-white/60"
        />
      </div>

      <UCard
        v-else-if="previewError || !preview"
        class="max-w-sm w-full"
      >
        <div class="text-center py-4">
          <UIcon
            name="i-lucide-link-2-off"
            class="size-10 text-error mx-auto mb-3"
          />
          <p class="font-semibold">
            Ссылка недоступна
          </p>
          <p class="text-sm text-muted mt-1">
            {{ previewMessage }}
          </p>
          <p class="text-xs text-muted mt-3">
            Попросите преподавателя прислать новую ссылку.
          </p>
        </div>
      </UCard>

      <UCard
        v-else
        class="max-w-sm w-full"
      >
        <div class="space-y-4">
          <div class="text-center">
            <UIcon
              name="i-lucide-video"
              class="size-10 text-primary mx-auto mb-2"
            />
            <p class="font-bold text-lg">
              {{ preview.topic }}
            </p>
            <p class="text-sm text-muted mt-0.5">
              {{ startsAtLabel }} · {{ preview.durationMin }} мин
            </p>
          </div>

          <UAlert
            v-if="!preview.canJoin"
            color="warning"
            variant="subtle"
            icon="i-lucide-clock"
            :title="preview.isPast ? 'Урок завершён' : 'Урок ещё не начался'"
            :description="preview.isPast
              ? 'Подключение к этому уроку закрыто.'
              : 'Подключиться можно за 15 минут до начала. Обновите страницу ближе к времени урока.'"
          />

          <template v-else>
            <UFormField label="Как вас зовут?">
              <UInput
                v-model="name"
                placeholder="Имя и фамилия"
                size="lg"
                autofocus
                @keyup.enter="enter"
              />
            </UFormField>

            <UButton
              block
              size="lg"
              :loading="joining"
              icon="i-lucide-log-in"
              @click="enter"
            >
              Войти в урок
            </UButton>

            <p
              v-if="joinError"
              class="text-sm text-error text-center"
            >
              {{ joinError }}
            </p>

            <p class="text-xs text-muted text-center">
              Регистрация не нужна. Разрешите доступ к камере и микрофону,
              когда браузер спросит.
            </p>
          </template>
        </div>
      </UCard>
    </div>
  </div>
</template>
