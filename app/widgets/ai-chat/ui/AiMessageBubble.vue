<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import katex from 'katex'

const props = defineProps<{
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt?: string
  isStreaming?: boolean
}>()

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
})

const renderContent = computed(() => {
  let text = props.content

  // Block math: $$...$$
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })
    } catch {
      return `<code>${math}</code>`
    }
  })

  // Inline math: $...$
  text = text.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })
    } catch {
      return `<code>${math}</code>`
    }
  })

  return md.render(text)
})

const isUser = computed(() => props.role === 'user')
</script>

<template>
  <div
    class="femo-msg"
    :class="isUser ? 'femo-msg--user' : 'femo-msg--ai'"
  >
    <!-- Avatar -->
    <div class="femo-msg-avatar">
      <FemiMascot
        v-if="!isUser"
        state="teach"
        size="xs"
        silent
        ignore-reactions
      />
      <UIcon
        v-else
        name="i-lucide-user"
        class="size-4"
      />
    </div>

    <!-- Bubble -->
    <div class="femo-msg-bubble">
      <div
        class="femo-msg-content"
        v-html="renderContent"
      />

      <span
        v-if="isStreaming"
        class="femo-msg-cursor"
        aria-hidden="true"
      >▍</span>

      <p
        v-if="createdAt"
        class="femo-msg-time"
      >
        {{ formatTime(createdAt) }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.femo-msg {
  display: grid;
  gap: 0.65rem;
  max-width: 100%;
  align-items: flex-end;
}

.femo-msg--ai   { grid-template-columns: auto minmax(0, 1fr); justify-items: start; }
.femo-msg--user { grid-template-columns: minmax(0, 1fr) auto; justify-items: end; }

.femo-msg--user .femo-msg-avatar { order: 2; }

/* Avatar */
.femo-msg-avatar {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  overflow: hidden;
  box-shadow: var(--shadow-soft);
}

.femo-msg--user .femo-msg-avatar {
  background: var(--gradient-hero);
  border-color: transparent;
  color: white;
  box-shadow: 0 6px 14px -4px rgba(220, 38, 38, 0.45);
}

/* Bubble */
.femo-msg-bubble {
  position: relative;
  max-width: min(80%, 720px);
  padding: 0.85rem 1.05rem;
  border-radius: 1.2rem;
  font-size: 0.95rem;
  line-height: 1.55;
}

.femo-msg--ai .femo-msg-bubble {
  background: linear-gradient(180deg, #FFF7F4 0%, #FFFFFF 100%);
  color: var(--color-femo-ink-900);
  border: 1px solid var(--color-femo-red-100);
  border-bottom-left-radius: 0.4rem;
  box-shadow: 0 8px 24px -12px rgba(220, 38, 38, 0.18);
}

.femo-msg--user .femo-msg-bubble {
  background: var(--gradient-hero);
  color: white;
  border-bottom-right-radius: 0.4rem;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.3) inset,
    0 12px 24px -8px rgba(220, 38, 38, 0.45);
}

/* Content (markdown + KaTeX) */
.femo-msg-content :deep(p) { margin: 0; }
.femo-msg-content :deep(p + p) { margin-top: 0.55rem; }

.femo-msg-content :deep(strong) { font-weight: 700; }
.femo-msg-content :deep(em) { font-style: italic; }

.femo-msg-content :deep(ul),
.femo-msg-content :deep(ol) {
  margin: 0.5rem 0 0.5rem 1.1rem;
  display: grid;
  gap: 0.25rem;
}

.femo-msg-content :deep(li) { line-height: 1.5; }

.femo-msg-content :deep(code) {
  font-family: var(--default-mono-font-family);
  font-size: 0.88em;
  padding: 0.12rem 0.4rem;
  border-radius: 0.4rem;
  background: rgba(0, 0, 0, 0.06);
}

.femo-msg--user .femo-msg-content :deep(code) {
  background: rgba(255, 255, 255, 0.18);
  color: white;
}

.femo-msg-content :deep(pre) {
  margin: 0.55rem 0;
  padding: 0.7rem 0.85rem;
  border-radius: 0.7rem;
  background: var(--color-femo-ink-50);
  overflow-x: auto;
  font-size: 0.85rem;
}

.femo-msg--user .femo-msg-content :deep(pre) {
  background: rgba(255, 255, 255, 0.12);
  color: white;
}

.femo-msg-content :deep(.katex) { font-size: 1.05em; }
.femo-msg-content :deep(.katex-display) {
  margin: 0.6rem 0;
  padding: 0.55rem;
  background: var(--ui-bg-elevated);
  border-radius: 0.55rem;
  border: 1px dashed var(--color-femo-red-100);
  overflow-x: auto;
}

.femo-msg--user .femo-msg-content :deep(.katex-display) {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.3);
}

.femo-msg-content :deep(a) {
  color: var(--color-femo-red-700);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.femo-msg--user .femo-msg-content :deep(a) { color: white; }

/* Streaming cursor */
.femo-msg-cursor {
  display: inline-block;
  margin-left: 2px;
  color: currentColor;
  animation: femo-msg-blink 1s steps(2) infinite;
}

@keyframes femo-msg-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0; }
}

/* Time */
.femo-msg-time {
  font-size: 0.65rem;
  margin-top: 0.4rem;
  opacity: 0.55;
  letter-spacing: 0.02em;
  text-align: right;
}

.femo-msg--user .femo-msg-time { color: rgba(255, 255, 255, 0.7); }
.femo-msg--ai   .femo-msg-time { color: var(--color-femo-ink-500); }
</style>
