<script setup lang="ts">
import type { AIMode } from '~/shared/types/common'
import { useAiSession, AiInputBar } from '~/features/ai-session'

import AiMessageBubble from './AiMessageBubble.vue'
import AiModeSelector from './AiModeSelector.vue'

const props = defineProps<{
  studentId: string
  subjectId?: string
  topicId?: string
  conversationId?: string
}>()

const {
  conversation, messages, isStreaming, streamingContent,
  startSession, loadSession, sendMessage
} = useAiSession()

const selectedMode = ref<AIMode | null>(null)
const messagesContainer = ref<HTMLElement>()
const isLoadingSession = ref(false)

onMounted(async () => {
  if (props.conversationId) {
    isLoadingSession.value = true
    try {
      await loadSession(props.conversationId)
    } finally {
      isLoadingSession.value = false
    }
  }
})

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

watch(messages, scrollToBottom, { deep: true })
watch(streamingContent, scrollToBottom)

const handleModeSelect = async (mode: AIMode) => {
  selectedMode.value = mode
  await startSession({
    studentId: props.studentId,
    subjectId: props.subjectId,
    topicId: props.topicId,
    mode
  })
}

const handleInput = async (text: string) => {
  await sendMessage(text)
}
</script>

<template>
  <div class="femo-chat">
    <!-- Loading existing session -->
    <div
      v-if="isLoadingSession"
      class="femo-chat-loading"
    >
      <FemiMascot
        state="think"
        size="lg"
        :line="$t('student.aiTutor.loadingSession')"
        silent
        ignore-reactions
      />
    </div>

    <!-- Mode selection (no conversation yet) -->
    <div
      v-else-if="!conversation && !conversationId"
      class="femo-chat-onboard"
    >
      <div
        class="femo-chat-onboard-bg"
        aria-hidden="true"
      >
        <FemoMeshBg variant="soft" />
      </div>

      <div class="femo-chat-onboard-inner">
        <div class="femo-chat-onboard-mascot">
          <FemiMascot
            state="greet"
            size="lg"
            silent
            ignore-reactions
          />
          <div class="femo-chat-onboard-bubble">
            Привет! Чем сегодня хочешь&nbsp;заняться?
          </div>
        </div>

        <header class="femo-chat-onboard-head">
          <span class="femo-chip">AI-тренер · 5 режимов</span>
          <h2 class="femo-chat-onboard-title femo-display">
            Выбери, чем сегодня <span class="femo-text-gradient">займёмся</span>
          </h2>
          <p class="femo-chat-onboard-sub">
            {{ $t('student.aiTutor.selectMode') }}
          </p>
        </header>

        <AiModeSelector
          :selected-mode="selectedMode ?? undefined"
          @select="handleModeSelect"
        />
      </div>
    </div>

    <!-- Chat -->
    <template v-else>
      <div
        ref="messagesContainer"
        class="femo-chat-messages"
      >
        <div
          v-if="!messages.length"
          class="femo-chat-empty"
        >
          <FemiMascot
            state="think"
            size="md"
            silent
            ignore-reactions
          />
          <p class="femo-chat-empty-text">
            {{ $t('student.aiTutor.startDialog') }}
          </p>
        </div>

        <AiMessageBubble
          v-for="msg in messages"
          :key="msg.id"
          :role="msg.role"
          :content="msg.content"
          :created-at="msg.createdAt"
          :is-streaming="isStreaming && msg === messages[messages.length - 1] && msg.role === 'assistant'"
        />

        <!-- Typing indicator -->
        <div
          v-if="isStreaming && (!messages.length || messages[messages.length - 1]?.role !== 'assistant')"
          class="femo-chat-typing"
        >
          <span class="femo-chat-typing-avatar">
            <FemiMascot
              state="think"
              size="xs"
              silent
              ignore-reactions
            />
          </span>
          <span class="femo-chat-typing-bubble">
            <span class="femo-chat-typing-dot" />
            <span class="femo-chat-typing-dot" />
            <span class="femo-chat-typing-dot" />
            <span class="femo-chat-typing-text">
              {{ $t('student.aiTutor.thinking') }}
            </span>
          </span>
        </div>
      </div>

      <div class="femo-chat-input">
        <AiInputBar
          :disabled="isStreaming"
          @input="handleInput"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.femo-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background:
    radial-gradient(60% 50% at 0% 0%, rgba(250, 165, 26, 0.06), transparent 70%),
    radial-gradient(50% 40% at 100% 0%, rgba(220, 38, 38, 0.06), transparent 70%),
    linear-gradient(180deg, #FFFFFF 0%, #FFF7F4 100%);
  overflow: hidden;
}

.femo-chat-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Onboarding (mode selector) */
.femo-chat-onboard {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1.5rem, 4vw, 3rem);
  overflow-y: auto;
  isolation: isolate;
}

.femo-chat-onboard-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.femo-chat-onboard-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 880px;
  display: grid;
  gap: 2rem;
}

.femo-chat-onboard-mascot {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: end;
  justify-self: center;
}

.femo-chat-onboard-bubble {
  position: relative;
  background: var(--ui-bg-elevated);
  padding: 0.85rem 1.1rem;
  border-radius: 1.1rem;
  border: 1px solid var(--color-femo-red-100);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-femo-ink-800);
  box-shadow: 0 8px 18px -4px rgba(220, 38, 38, 0.18);
  margin-bottom: 0.5rem;
  max-width: 320px;
}

.femo-chat-onboard-bubble::before {
  content: '';
  position: absolute;
  left: -8px;
  bottom: 1.1rem;
  border: 8px solid transparent;
  border-right-color: white;
}

.femo-chat-onboard-head {
  display: grid;
  justify-items: center;
  gap: 0.85rem;
  text-align: center;
}

.femo-chat-onboard-title {
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  color: var(--color-femo-ink-900);
  margin: 0;
  text-wrap: balance;
}

.femo-chat-onboard-sub {
  color: var(--color-femo-ink-600);
  font-size: 0.95rem;
  max-width: 480px;
  line-height: 1.55;
}

/* Messages list */
.femo-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 880px;
  width: 100%;
  margin: 0 auto;
}

.femo-chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  padding: 2rem;
  color: var(--color-femo-ink-500);
}

.femo-chat-empty-text {
  font-size: 0.95rem;
  max-width: 320px;
  text-align: center;
  line-height: 1.5;
}

/* Typing indicator */
.femo-chat-typing {
  display: grid;
  grid-template-columns: auto auto;
  gap: 0.65rem;
  align-items: center;
  align-self: flex-start;
}

.femo-chat-typing-avatar {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  overflow: hidden;
  box-shadow: var(--shadow-soft);
}

.femo-chat-typing-bubble {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.7rem 1rem;
  border-radius: 1.1rem;
  border-bottom-left-radius: 0.4rem;
  background: linear-gradient(180deg, #FFF7F4 0%, #FFFFFF 100%);
  border: 1px solid var(--color-femo-red-100);
  color: var(--color-femo-ink-700);
  font-size: 0.85rem;
  box-shadow: 0 4px 12px -6px rgba(220, 38, 38, 0.18);
}

.femo-chat-typing-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--color-femo-red-500);
  animation: femo-typing 1.4s ease-in-out infinite;
}

.femo-chat-typing-dot:nth-child(2) { animation-delay: 0.18s; }
.femo-chat-typing-dot:nth-child(3) { animation-delay: 0.36s; margin-right: 0.35rem; }

@keyframes femo-typing {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30%           { opacity: 1; transform: translateY(-4px); }
}

@media (prefers-reduced-motion: reduce) {
  .femo-chat-typing-dot { animation: none; opacity: 0.7; }
}

.femo-chat-typing-text { color: var(--color-femo-ink-600); font-weight: 500; }

/* Input bar wrapper */
.femo-chat-input {
  border-top: 1px solid var(--color-femo-ink-100);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: saturate(180%) blur(16px);
  -webkit-backdrop-filter: saturate(180%) blur(16px);
  padding: 0.85rem 1rem calc(0.85rem + env(safe-area-inset-bottom, 0));
}
</style>
