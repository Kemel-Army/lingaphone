<script setup lang="ts">
import { JitsiRoom } from '~/widgets/online-lesson'
import { useCurrentUser } from '~/entities/user'

definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const lessonId = computed(() => route.params.id as string)

const { homeRoute } = useCurrentUser()

/**
 * Право на вход и JWT выдаёт сервер: клиент не может сам решить, что ему
 * можно в комнату, а без токена meet.jit.si обрывает звонок через 5 минут.
 */
interface JoinInfo {
  domain: string
  room: string
  jwt: string | null
  limited: boolean
  displayName: string
  moderator: boolean
  lesson: { id: string, topic: string, groupName: string }
}

// useRequestFetch, а не $fetch: во время SSR куки входящего запроса иначе не
// уедут на server route, и вход в собственный урок вернёт 401.
const request = useRequestFetch()

const { data: join, pending, error } = await useAsyncData<JoinInfo>(
  () => `lesson-join-${lessonId.value}`,
  () => request<JoinInfo>(`/api/lessons/${lessonId.value}/join`)
)

const leave = () => {
  router.push(homeRoute.value)
}

// Ссылка для гостя без регистрации — доступна только преподавателю/админу.
const inviteUrl = ref('')
const inviteLoading = ref(false)
const inviteError = ref('')
const copied = ref(false)

const createInvite = async () => {
  inviteLoading.value = true
  inviteError.value = ''
  try {
    const res = await $fetch<{ url: string }>('/api/teacher/lesson-invite', {
      method: 'POST',
      body: { lessonId: lessonId.value }
    })
    inviteUrl.value = res.url
  } catch (e: unknown) {
    inviteError.value = (e as { data?: { message?: string } })?.data?.message ?? 'Не удалось создать ссылку'
  } finally {
    inviteLoading.value = false
  }
}

const copyInvite = async () => {
  await navigator.clipboard.writeText(inviteUrl.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <div class="h-dvh flex flex-col bg-slate-950 text-white">
    <div class="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 shrink-0">
      <UButton
        icon="i-lucide-arrow-left"
        variant="ghost"
        color="neutral"
        size="sm"
        @click="leave"
      />
      <div class="min-w-0 flex-1">
        <p class="font-semibold text-sm truncate">
          {{ join?.lesson.topic || 'Онлайн-урок' }}
        </p>
        <p
          v-if="join?.lesson.groupName"
          class="text-xs text-white/60"
        >
          {{ join.lesson.groupName }}
        </p>
      </div>

      <UPopover v-if="join?.moderator">
        <UButton
          icon="i-lucide-link"
          variant="ghost"
          color="neutral"
          size="sm"
          label="Ссылка для гостя"
        />
        <template #content>
          <div class="p-4 w-80 space-y-3">
            <div>
              <p class="font-semibold text-sm">
                Гостевая ссылка
              </p>
              <p class="text-xs text-muted mt-1">
                Вход без регистрации — для пробных уроков. Действует до конца
                урока, максимум 5 подключений.
              </p>
            </div>

            <UButton
              v-if="!inviteUrl"
              block
              :loading="inviteLoading"
              icon="i-lucide-plus"
              @click="createInvite"
            >
              Создать ссылку
            </UButton>

            <template v-else>
              <UInput
                :model-value="inviteUrl"
                readonly
                size="sm"
              />
              <UButton
                block
                size="sm"
                :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
                :color="copied ? 'success' : 'primary'"
                @click="copyInvite"
              >
                {{ copied ? 'Скопировано' : 'Скопировать' }}
              </UButton>
            </template>

            <p
              v-if="inviteError"
              class="text-xs text-error"
            >
              {{ inviteError }}
            </p>
          </div>
        </template>
      </UPopover>
    </div>

    <div class="flex-1 min-h-0">
      <div
        v-if="pending"
        class="h-full grid place-items-center"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="size-8 animate-spin text-white/60"
        />
      </div>
      <div
        v-else-if="error || !join"
        class="h-full grid place-items-center"
      >
        <div class="text-center">
          <UIcon
            name="i-lucide-lock"
            class="size-10 text-white/40 mx-auto mb-2"
          />
          <p class="text-white/70">
            Нет доступа к этому уроку
          </p>
          <UButton
            class="mt-4"
            color="neutral"
            @click="leave"
          >
            На главную
          </UButton>
        </div>
      </div>
      <JitsiRoom
        v-else
        :room="join.room"
        :domain="join.domain"
        :jwt="join.jwt"
        :limited="join.limited"
        :moderator="join.moderator"
        :display-name="join.displayName"
        :subject="join.lesson.topic"
        @left="leave"
      />
    </div>
  </div>
</template>
