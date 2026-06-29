<script setup lang="ts">
import type { Database } from '~/shared/types/database.types'

definePageMeta({ layout: 'dashboard' })

type ConversationRow = Database['public']['Tables']['Conversation']['Row']
type MessageRow = Database['public']['Tables']['Message']['Row']
type UserRow = Database['public']['Tables']['User']['Row']

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const currentUserId = computed(() => (user.value as unknown as { user_id?: string } | null)?.user_id ?? '')

// ── Load conversations + participants ────────────────────────────────────
const { data, refresh: _refresh, pending } = useAsyncData(
  'lingafon-messenger',
  async () => {
    if (!user.value) return null

    const { data: convs } = await supabase
      .from('Conversation')
      .select('*')
      .order('updatedAt', { ascending: false })

    const allParticipantIds = Array.from(new Set(
      (convs ?? []).flatMap(c => c.participantIds)
    )).filter(id => id !== currentUserId.value)

    const { data: users } = allParticipantIds.length > 0
      ? await supabase
          .from('User')
          .select('id, name, surname, role, avatarUrl')
          .in('id', allParticipantIds)
      : { data: [] }

    const userById = new Map((users ?? []).map(u => [u.id, u]))

    return {
      conversations: (convs ?? []) as ConversationRow[],
      userById
    }
  },
  { server: false, default: () => null, watch: [user] }
)

const conversations = computed(() => data.value?.conversations ?? [])

const otherParticipant = (conv: ConversationRow) => {
  const otherId = conv.participantIds.find(id => id !== currentUserId.value)
  return otherId ? data.value?.userById.get(otherId) : null
}

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

const messages = ref<MessageRow[]>([])
const messagesLoading = ref(false)
const draft = ref('')

const activeConversation = computed(() =>
  conversations.value.find(c => c.id === activeId.value) ?? null
)

const loadMessages = async (convId: string) => {
  messagesLoading.value = true
  const { data: msgs } = await supabase
    .from('Message')
    .select('*')
    .eq('conversationId', convId)
    .order('createdAt', { ascending: true })
  messages.value = (msgs ?? []) as MessageRow[]
  messagesLoading.value = false
}

// Realtime subscription — re-subscribe on conversation change
let channel: ReturnType<typeof supabase.channel> | null = null
const unsubscribe = () => {
  if (channel) {
    supabase.removeChannel(channel)
    channel = null
  }
}

watch(activeId, async (convId) => {
  unsubscribe()
  if (!convId) {
    messages.value = []
    return
  }
  await loadMessages(convId)
  channel = supabase
    .channel(`messages:${convId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'Message', filter: `conversationId=eq.${convId}` },
      (payload: { new: MessageRow }) => {
        const list = messages.value as any[]
        if (!list.some(m => m.id === payload.new.id)) {
          list.push(payload.new)
        }
      }
    )
    .subscribe()
}, { immediate: true })

onUnmounted(unsubscribe)

// ── Send ─────────────────────────────────────────────────────────────────
const send = async () => {
  if (!draft.value.trim() || !activeId.value || !currentUserId.value) return
  const body = draft.value.trim()
  draft.value = ''
  const { error } = await supabase.from('Message').insert({
    conversationId: activeId.value,
    senderId: currentUserId.value,
    body
  })
  if (error) {
    console.error('Send failed:', error)
    draft.value = body // restore on error
  }
}

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', {
  hour: '2-digit', minute: '2-digit'
})

const formatPreview = (_convId: string) => {
  // Last message preview — we don't have it pre-loaded; show '...' for now
  return ''
}

const ROLE_BADGE: Record<string, { label: string, color: string }> = {
  TUTOR: { label: 'Педагог', color: 'primary' },
  ADMIN: { label: 'Школа', color: 'neutral' },
  STUDENT: { label: 'Ученик', color: 'info' },
  PARENT: { label: 'Родитель', color: 'success' }
}

const initialsOf = (u: Pick<UserRow, 'name' | 'surname'> | null | undefined) => {
  if (!u) return '?'
  return `${(u.name?.[0] ?? '')}${(u.surname?.[0] ?? '')}`.toUpperCase() || '?'
}
</script>

<template>
  <div class="relative">
    <div class="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <header
        class="space-y-1 sm:space-y-2 mb-4 sm:mb-6"
        :class="showChatOnMobile && 'hidden md:block'"
      >
        <p class="text-xs sm:text-sm font-bold text-primary uppercase tracking-wider">
          💬 Мессенджер
        </p>
        <h1 class="text-2xl sm:text-4xl font-black tracking-tight">
          Чат с педагогом
        </h1>
      </header>

      <div
        v-if="pending && !conversations.length"
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
          Здесь появится переписка с педагогом группы
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
                <div class="size-11 shrink-0 rounded-2xl bg-linear-to-br from-primary-400 to-sky-700 text-white font-black flex items-center justify-center">
                  {{ initialsOf(otherParticipant(c)) }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="font-bold truncate">
                    {{ otherParticipant(c)?.name }} {{ otherParticipant(c)?.surname }}
                  </p>
                  <p class="text-xs text-muted line-clamp-1 mt-0.5">
                    {{ formatPreview(c.id) }}
                  </p>
                  <UBadge
                    v-if="otherParticipant(c) && ROLE_BADGE[otherParticipant(c)!.role]"
                    :label="ROLE_BADGE[otherParticipant(c)!.role]!.label"
                    :color="ROLE_BADGE[otherParticipant(c)!.role]!.color as any"
                    variant="subtle"
                    size="xs"
                    class="mt-1.5"
                  />
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
            <div class="size-10 rounded-2xl bg-linear-to-br from-primary-400 to-sky-700 text-white font-black flex items-center justify-center shrink-0">
              {{ initialsOf(otherParticipant(activeConversation)) }}
            </div>
            <div class="min-w-0">
              <p class="font-bold truncate">
                {{ otherParticipant(activeConversation)?.name }} {{ otherParticipant(activeConversation)?.surname }}
              </p>
              <p
                v-if="otherParticipant(activeConversation)"
                class="text-xs text-muted"
              >
                {{ ROLE_BADGE[otherParticipant(activeConversation)!.role]?.label ?? otherParticipant(activeConversation)!.role }}
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
              class="flex"
              :class="msg.senderId === currentUserId ? 'justify-end' : 'justify-start'"
            >
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
  </div>
</template>
