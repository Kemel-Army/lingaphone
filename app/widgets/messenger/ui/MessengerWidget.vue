<script setup lang="ts">
import {
  useMessenger,
  buildUserMap,
  buildGroupNameMap,
  otherParticipants,
  conversationTitle,
  conversationSubtitle,
  conversationInitials,
  type ConversationRow
} from '~/entities/conversation'

/**
 * The four fields this widget actually renders.
 *
 * Deliberately NOT `MessageRow`: its `attachments` column is typed as the
 * recursive `Json` union, and any mutation of a `Ref<MessageRow[]>` makes TS
 * bail out with "type instantiation is excessively deep" (TS2589). Narrowing
 * to the rendered shape keeps the widget fully typed with no `any`.
 */
interface ChatMessage {
  id: string
  senderId: string
  body: string
  createdAt: string
}

const { fetchConversations, fetchMessages, sendMessage, subscribeToMessages } = useMessenger()

const user = useSupabaseUser()
const currentUserId = computed(() => (user.value as unknown as { user_id?: string } | null)?.user_id ?? '')

// ── Load conversations + participants ────────────────────────────────────
const { data, pending } = useAsyncData(
  'messenger-conversations',
  async () => {
    if (!user.value) return null
    return await fetchConversations()
  },
  { server: false, default: () => null, watch: [user] }
)

// The loading branch keys off `!data`, not `pending`. With `server: false` the
// fetch never runs during SSR, so the server rendered the "no chats yet" branch
// while the client's first tick had `pending: true` and rendered the spinner —
// Vue reported that as "Hydration completed but contains mismatches". `data` is
// null in both passes, so branching on it keeps the two renders identical.
const conversations = computed(() => data.value?.conversations ?? [])
const userById = computed(() => buildUserMap(data.value?.users ?? []))
const groupNameById = computed(() => buildGroupNameMap(data.value?.groups ?? []))

const titleOf = (c: ConversationRow) => conversationTitle(c, userById.value, groupNameById.value, currentUserId.value)
const subtitleOf = (c: ConversationRow) => conversationSubtitle(c, userById.value, currentUserId.value)
const initialsOf = (c: ConversationRow) => conversationInitials(c, userById.value, groupNameById.value, currentUserId.value)
const isGroup = (c: ConversationRow) => c.kind === 'GROUP' && otherParticipants(c, userById.value, currentUserId.value).length > 1

// ── Active chat + messages ───────────────────────────────────────────────
const activeId = ref<string | null>(null)
/** On phone we show either list OR chat; on md+ both side by side */
const showChatOnMobile = ref(false)

watch(conversations, (list) => {
  if (!activeId.value && list.length > 0) activeId.value = list[0]?.id ?? null
}, { immediate: true })

const openChat = (id: string) => {
  activeId.value = id
  showChatOnMobile.value = true
}
const backToList = () => {
  showChatOnMobile.value = false
}

const messages = ref<ChatMessage[]>([])
const messagesLoading = ref(false)
const draft = ref('')

const activeConversation = computed(() =>
  conversations.value.find(c => c.id === activeId.value) ?? null
)

const loadMessages = async (convId: string) => {
  messagesLoading.value = true
  const rows = await fetchMessages(convId)
  messages.value = rows.map(({ id, senderId, body, createdAt }) => ({ id, senderId, body, createdAt }))
  messagesLoading.value = false
}

// Realtime subscription — re-subscribe on conversation change
let unsubscribe: (() => void) | null = null

watch(activeId, async (convId) => {
  unsubscribe?.()
  unsubscribe = null
  if (!convId) {
    messages.value = []
    return
  }
  await loadMessages(convId)
  unsubscribe = subscribeToMessages(convId, (msg) => {
    if (messages.value.some(m => m.id === msg.id)) return
    messages.value.push({
      id: msg.id,
      senderId: msg.senderId,
      body: msg.body,
      createdAt: msg.createdAt
    })
  })
}, { immediate: true })

onUnmounted(() => unsubscribe?.())

// ── Send ─────────────────────────────────────────────────────────────────
const send = async () => {
  if (!draft.value.trim() || !activeId.value || !currentUserId.value) return
  const body = draft.value.trim()
  draft.value = ''
  try {
    await sendMessage(activeId.value, currentUserId.value, body)
  } catch (e) {
    console.error('Send failed:', e)
    draft.value = body // restore on error
  }
}

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', {
  hour: '2-digit', minute: '2-digit'
})

const senderNameOf = (senderId: string) => {
  const u = userById.value.get(senderId)
  return u ? `${u.name} ${u.surname}`.trim() : ''
}
</script>

<template>
  <div class="relative">
    <div
      v-if="!data || (pending && !conversations.length)"
      class="rounded-2xl border-2 border-dashed border-default p-12 text-center"
    >
      <UIcon
        name="i-lucide-loader"
        class="size-8 animate-spin text-muted mx-auto"
      />
    </div>

    <div
      v-else-if="conversations.length === 0"
      class="rounded-2xl border-2 border-dashed border-default p-12 text-center"
    >
      <UIcon
        name="i-lucide-message-circle"
        class="size-12 text-muted mx-auto"
      />
      <p class="mt-3 font-bold text-lg">
        Пока нет чатов
      </p>
      <p class="text-sm text-muted mt-1">
        Здесь появится переписка с группой
      </p>
    </div>

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-[calc(100dvh-180px)] sm:h-[calc(100vh-220px)] min-h-125"
    >
      <!-- Conversation list -->
      <aside
        class="rounded-2xl border border-default bg-default overflow-y-auto"
        :class="showChatOnMobile ? 'hidden md:block' : 'block'"
      >
        <ul>
          <li
            v-for="c in conversations"
            :key="c.id"
          >
            <button
              type="button"
              class="w-full text-left p-4 border-b border-default last:border-0 hover:bg-elevated transition flex items-start gap-3"
              :class="activeId === c.id && !showChatOnMobile && 'bg-primary-50 dark:bg-primary-900/30'"
              @click="openChat(c.id)"
            >
              <div
                class="size-11 shrink-0 rounded-2xl text-white font-black flex items-center justify-center"
                :class="isGroup(c) ? 'bg-linear-to-br from-emerald-400 to-teal-700' : 'bg-linear-to-br from-primary-400 to-sky-700'"
              >
                <UIcon
                  v-if="isGroup(c)"
                  name="i-lucide-users"
                  class="size-5"
                />
                <template v-else>
                  {{ initialsOf(c) }}
                </template>
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-bold truncate">
                  {{ titleOf(c) }}
                </p>
                <p class="text-xs text-muted line-clamp-1 mt-0.5">
                  {{ subtitleOf(c) }}
                </p>
              </div>
            </button>
          </li>
        </ul>
      </aside>

      <!-- Active chat -->
      <section
        v-if="activeConversation"
        class="rounded-2xl border border-default bg-default flex flex-col overflow-hidden"
        :class="showChatOnMobile ? 'flex' : 'hidden md:flex'"
      >
        <header class="px-3 sm:px-5 py-3 border-b border-default flex items-center gap-3">
          <button
            type="button"
            class="md:hidden -ml-1 p-1.5 rounded-lg hover:bg-elevated transition shrink-0"
            aria-label="Назад к списку чатов"
            @click="backToList"
          >
            <UIcon
              name="i-lucide-arrow-left"
              class="size-5"
            />
          </button>
          <div
            class="size-10 rounded-2xl text-white font-black flex items-center justify-center shrink-0"
            :class="isGroup(activeConversation) ? 'bg-linear-to-br from-emerald-400 to-teal-700' : 'bg-linear-to-br from-primary-400 to-sky-700'"
          >
            <UIcon
              v-if="isGroup(activeConversation)"
              name="i-lucide-users"
              class="size-5"
            />
            <template v-else>
              {{ initialsOf(activeConversation) }}
            </template>
          </div>
          <div class="min-w-0">
            <p class="font-bold truncate">
              {{ titleOf(activeConversation) }}
            </p>
            <p class="text-xs text-muted truncate">
              {{ subtitleOf(activeConversation) }}
            </p>
          </div>
        </header>

        <!-- Messages -->
        <div class="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 bg-elevated">
          <div
            v-if="messagesLoading && !messages.length"
            class="flex justify-center py-8"
          >
            <UIcon
              name="i-lucide-loader"
              class="size-6 animate-spin text-dimmed"
            />
          </div>
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="flex flex-col"
            :class="msg.senderId === currentUserId ? 'items-end' : 'items-start'"
          >
            <p
              v-if="isGroup(activeConversation) && msg.senderId !== currentUserId"
              class="text-[11px] font-semibold text-muted mb-0.5 ml-1"
            >
              {{ senderNameOf(msg.senderId) }}
            </p>
            <div
              class="max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm"
              :class="msg.senderId === currentUserId
                ? 'bg-linear-to-br from-primary-500 to-sky-700 text-white rounded-br-sm'
                : 'bg-default border border-default rounded-bl-sm'"
            >
              <p class="text-sm whitespace-pre-wrap wrap-break-word">
                {{ msg.body }}
              </p>
              <p
                class="text-[10px] mt-1 opacity-70"
                :class="msg.senderId === currentUserId ? 'text-white/80 text-right' : 'text-muted'"
              >
                {{ formatTime(msg.createdAt) }}
              </p>
            </div>
          </div>
        </div>

        <footer class="p-3 border-t border-default flex items-center gap-2">
          <UInput
            v-model="draft"
            placeholder="Напиши сообщение..."
            size="lg"
            class="flex-1"
            @keydown.enter.prevent="send"
          />
          <UButton
            icon="i-lucide-send"
            color="primary"
            size="lg"
            :disabled="!draft.trim()"
            @click="send"
          />
        </footer>
      </section>

      <section
        v-else
        class="hidden md:flex rounded-2xl border-2 border-dashed border-default p-12 text-center flex-col items-center justify-center"
      >
        <UIcon
          name="i-lucide-message-circle"
          class="size-12 text-muted mx-auto"
        />
        <p class="mt-3 font-bold text-lg">
          Выбери чат слева
        </p>
      </section>
    </div>
  </div>
</template>
