<script setup lang="ts">
import { useTemplateRef } from 'vue'

interface DemoMessage {
  role: 'user' | 'assistant'
  text: string
  // Optional rich content rendered after the text
  formula?: string
  hint?: string
}

interface DemoScript {
  id: string
  question: string
  shortLabel: string
  icon: string
  answer: string
  formula?: string
  hint?: string
}

// Pre-recorded scripts — no real API calls.
// Visitor picks a question, Femi "types" the answer with realistic delay.
const scripts: DemoScript[] = [
  {
    id: 'grammar',
    question: 'Объясни Present Simple',
    shortLabel: 'Объясни правило',
    icon: 'i-lucide-graduation-cap',
    answer: 'Present Simple — это время для регулярных действий! Например: «She goes to school every day». Глагол в 3-м лице единственного числа получает -s или -es.',
    hint: 'Запомни: I/you/we/they GO, но he/she/it GOES.'
  },
  {
    id: 'practice',
    question: 'Потренируемся на задаче',
    shortLabel: 'Помоги с заданием',
    icon: 'i-lucide-dumbbell',
    answer: 'Давай! Вставь правильную форму: «My brother ___ (play) football every weekend.» Подумай — это 3-е лицо единственного числа, значит...',
    hint: 'Правильно: PLAYS. Не забываем добавить -s для he/she/it!'
  },
  {
    id: 'check',
    question: 'Проверь моё предложение',
    shortLabel: 'Проверь решение',
    icon: 'i-lucide-scan-text',
    answer: 'Отличная попытка! Но есть маленькая ошибка: «She don\'t like coffee» → нужно «She doesn\'t like coffee». В отрицании с he/she/it используем DOESN\'T.',
    hint: 'Don\'t → для I/you/we/they. Doesn\'t → для he/she/it.'
  },
  {
    id: 'pronunciation',
    question: 'Как произнести "th"?',
    shortLabel: 'Произношение',
    icon: 'i-lucide-mic',
    answer: 'Th бывает двух видов: звонкое [ð] как в "this" и глухое [θ] как в "think". Язык между зубами, выдох через нижние зубы. Повтори: "the", "this", "that", "three", "think"!',
    hint: 'Это один из самых сложных звуков — практикуй каждый день!'
  }
]

// Conversation state
const messages = ref<DemoMessage[]>([
  {
    role: 'assistant',
    text: 'Привет! Я Lingaphone AI-тренер по английскому. Кликни на любой вопрос ниже — я отвечу прямо сейчас, без регистрации 👇'
  }
])

const isTyping = ref(false)
const typingText = ref('')
const currentScript = ref<DemoScript | null>(null)
const usedScripts = ref<Set<string>>(new Set())

const messagesContainer = ref<HTMLElement>()

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const askQuestion = async (script: DemoScript) => {
  if (isTyping.value) return
  usedScripts.value.add(script.id)

  // Push user message
  messages.value.push({ role: 'user', text: script.question })
  scrollToBottom()

  // Wait a beat — feels natural
  await new Promise(r => setTimeout(r, 400))

  // Start typing
  isTyping.value = true
  currentScript.value = script
  typingText.value = ''
  scrollToBottom()

  // Wait for "thinking" indicator
  await new Promise(r => setTimeout(r, 700))

  // Typewriter effect — char by char
  const chars = [...script.answer]
  for (const ch of chars) {
    typingText.value += ch
    // Variable speed: faster for spaces, slower for periods
    const delay = ch === ' ' ? 12 : ch === '.' || ch === '!' ? 80 : 18
    await new Promise(r => setTimeout(r, delay))
    scrollToBottom()
  }

  // Commit final message
  messages.value.push({
    role: 'assistant',
    text: script.answer,
    formula: script.formula,
    hint: script.hint
  })
  typingText.value = ''
  isTyping.value = false
  currentScript.value = null
  scrollToBottom()
}

const reset = () => {
  if (isTyping.value) return
  messages.value = [{
    role: 'assistant',
    text: 'Привет! Я Lingaphone AI-тренер по английскому. Кликни на любой вопрос ниже — я отвечу прямо сейчас, без регистрации 👇'
  }]
  usedScripts.value.clear()
}

// Render a tiny KaTeX-like formula visually (we don't load KaTeX here for landing perf)
const renderFormula = (formula: string) => {
  return formula
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="ad-frac"><span>$1</span><i></i><span>$2</span></span>')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
}

const sectionRef = useTemplateRef<HTMLElement>('sectionRef')
useScrollReveal(sectionRef, { stagger: 70 })
</script>

<template>
  <section
    id="ai-demo"
    ref="sectionRef"
    class="femo-aid"
  >
    <FemoMeshBg
      variant="soft"
      class="femo-aid-bg"
    />
    <div class="femo-section-inner">
      <header class="femo-section-head stagger-item">
        <span class="femo-chip">Попробуй прямо сейчас · без регистрации</span>
        <h2 class="femo-section-title femo-display">
          Поговори с <span class="femo-text-gradient">Феми</span> — твоим AI-тренером
        </h2>
        <p class="femo-section-sub">
          Кликни на вопрос — Феми ответит за секунды, как в реальном продукте. Это не видео, это живой интерфейс.
        </p>
      </header>

      <div class="femo-aid-stage stagger-item">
        <!-- Chat panel -->
        <div class="femo-aid-chat">
          <div class="femo-aid-chat-head">
            <span class="femo-aid-chat-mascot">
              <FemiMascot
                state="teach"
                size="xs"
                silent
                ignore-reactions
              />
            </span>
            <div class="femo-aid-chat-meta">
              <p class="femo-aid-chat-name">
                Lingaphone AI-тренер
              </p>
              <p class="femo-aid-chat-status">
                <span class="femo-aid-chat-dot" />
                онлайн · отвечает мгновенно
              </p>
            </div>
            <button
              type="button"
              class="femo-aid-chat-reset"
              :disabled="isTyping"
              aria-label="Начать заново"
              @click="reset"
            >
              <UIcon
                name="i-lucide-refresh-cw"
                class="size-3.5"
              />
            </button>
          </div>

          <div
            ref="messagesContainer"
            class="femo-aid-chat-msgs"
          >
            <div
              v-for="(msg, i) in messages"
              :key="i"
              class="femo-aid-msg"
              :class="`is-${msg.role}`"
            >
              <span
                v-if="msg.role === 'assistant'"
                class="femo-aid-msg-avatar"
              >
                <FemiMascot
                  state="teach"
                  size="xs"
                  silent
                  ignore-reactions
                />
              </span>
              <span
                v-else
                class="femo-aid-msg-avatar"
              >
                <UIcon
                  name="i-lucide-user"
                  class="size-3.5"
                />
              </span>
              <div class="femo-aid-msg-bubble">
                <p class="femo-aid-msg-text">
                  {{ msg.text }}
                </p>
                <!-- eslint-disable vue/no-v-html -->
                <div
                  v-if="msg.formula"
                  class="femo-aid-formula"
                  v-html="renderFormula(msg.formula)"
                />
                <!-- eslint-enable vue/no-v-html -->
                <div
                  v-if="msg.hint"
                  class="femo-aid-hint"
                >
                  <UIcon
                    name="i-lucide-lightbulb"
                    class="size-3"
                  />
                  <span>{{ msg.hint }}</span>
                </div>
              </div>
            </div>

            <!-- Typing message -->
            <div
              v-if="isTyping"
              class="femo-aid-msg is-assistant"
            >
              <span class="femo-aid-msg-avatar">
                <FemiMascot
                  state="think"
                  size="xs"
                  silent
                  ignore-reactions
                />
              </span>
              <div class="femo-aid-msg-bubble">
                <p
                  v-if="typingText"
                  class="femo-aid-msg-text"
                >
                  {{ typingText }}<span class="femo-aid-cursor">▍</span>
                </p>
                <div
                  v-else
                  class="femo-aid-typing"
                >
                  <span class="femo-aid-typing-dot" />
                  <span class="femo-aid-typing-dot" />
                  <span class="femo-aid-typing-dot" />
                </div>
              </div>
            </div>
          </div>

          <!-- Scripted question chips -->
          <div class="femo-aid-chat-actions">
            <p class="femo-aid-chat-actions-label">
              <UIcon
                name="i-lucide-message-circle-question"
                class="size-3"
              />
              Спроси Феми:
            </p>
            <div class="femo-aid-chips">
              <button
                v-for="s in scripts"
                :key="s.id"
                type="button"
                class="femo-aid-chip"
                :class="{ 'is-used': usedScripts.has(s.id) }"
                :disabled="isTyping"
                @click="askQuestion(s)"
              >
                <UIcon
                  :name="s.icon"
                  class="size-3.5"
                />
                {{ s.shortLabel }}
              </button>
            </div>
          </div>
        </div>

        <!-- Side info / payoff -->
        <aside class="femo-aid-side">
          <div class="femo-aid-side-card">
            <div class="femo-aid-side-icon">
              <UIcon
                name="i-lucide-zap"
                class="size-5"
              />
            </div>
            <p class="femo-aid-side-title">
              Это сокращённый Феми
            </p>
            <p class="femo-aid-side-text">
              В продукте Феми объясняет любую тему, разбирает фото, понимает голос и адаптирует сложность под ребёнка.
            </p>
          </div>

          <div class="femo-aid-side-card femo-aid-side-card--accent">
            <div class="femo-aid-side-icon femo-aid-side-icon--accent">
              <UIcon
                name="i-lucide-sparkles"
                class="size-5"
              />
            </div>
            <p class="femo-aid-side-title">
              Хочешь увидеть всё?
            </p>
            <p class="femo-aid-side-text">
              Бесплатная диагностика за 5 минут — и Феми построит карту знаний под твоего ребёнка.
            </p>
            <NuxtLink
              to="/register"
              class="femo-aid-side-cta"
            >
              <span>Начать диагностику</span>
              <UIcon
                name="i-lucide-arrow-right"
                class="size-3.5"
              />
            </NuxtLink>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>

<style scoped>
.femo-aid {
  position: relative;
  padding: clamp(2.5rem, 5vw, 4.5rem) 0;
  overflow: hidden;
  isolation: isolate;
}

.femo-aid-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.5;
}

.femo-aid-stage {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

@media (min-width: 1024px) {
  .femo-aid-stage {
    grid-template-columns: 1.5fr 1fr;
    gap: 1.5rem;
    align-items: stretch;
  }
}

/* ─── Chat panel ─── */
.femo-aid-chat {
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 1.4rem;
  box-shadow: 0 18px 40px -16px rgba(220, 38, 38, 0.18);
  overflow: hidden;
  min-height: 28rem;
  max-height: 32rem;
}

.femo-aid-chat-head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.65rem;
  align-items: center;
  padding: 0.65rem 0.85rem;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid var(--color-femo-red-100);
}

.femo-aid-chat-mascot {
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 0.55rem;
  background: var(--gradient-hero);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: white;
  box-shadow: 0 6px 14px -4px rgba(220, 38, 38, 0.45);
}

.femo-aid-chat-name {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.85rem;
  color: var(--color-femo-ink-900);
  line-height: 1.1;
}

.femo-aid-chat-status {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.65rem;
  color: var(--color-femo-ink-500);
  margin-top: 0.1rem;
}

.femo-aid-chat-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: #16A34A;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2);
  animation: aid-dot 1.6s ease-in-out infinite;
}

@keyframes aid-dot {
  0%, 100% { box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2); }
  50%      { box-shadow: 0 0 0 5px rgba(22, 163, 74, 0.1); }
}

.femo-aid-chat-reset {
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 50%;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  color: var(--color-femo-ink-600);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s var(--ease-out-expo);
}

.femo-aid-chat-reset:hover:not(:disabled) {
  background: var(--gradient-hero);
  color: white;
  border-color: transparent;
}

.femo-aid-chat-reset:disabled { opacity: 0.4; cursor: not-allowed; }

/* Messages */
.femo-aid-chat-msgs {
  overflow-y: auto;
  padding: 1rem 1rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: linear-gradient(180deg, #FFFFFF 0%, #FFF7F4 100%);
}

.femo-aid-msg {
  display: grid;
  gap: 0.5rem;
  align-items: flex-end;
  max-width: 100%;
}

.femo-aid-msg.is-user      { grid-template-columns: 1fr auto; justify-items: end; }
.femo-aid-msg.is-assistant { grid-template-columns: auto 1fr; justify-items: start; }
.femo-aid-msg.is-user .femo-aid-msg-avatar { order: 2; }

.femo-aid-msg-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex: none;
  box-shadow: var(--shadow-soft);
}

.femo-aid-msg.is-user .femo-aid-msg-avatar {
  background: var(--gradient-hero);
  color: white;
  border-color: transparent;
}

.femo-aid-msg-bubble {
  max-width: min(80%, 30rem);
  padding: 0.7rem 0.95rem;
  border-radius: 1rem;
  font-size: 0.88rem;
  line-height: 1.5;
}

.femo-aid-msg.is-user .femo-aid-msg-bubble {
  background: var(--gradient-hero);
  color: white;
  border-bottom-right-radius: 0.3rem;
  font-weight: 600;
  box-shadow: 0 8px 18px -6px rgba(220, 38, 38, 0.45);
}

.femo-aid-msg.is-assistant .femo-aid-msg-bubble {
  background: linear-gradient(180deg, #FFF7F4 0%, #FFFFFF 100%);
  color: var(--color-femo-ink-900);
  border: 1px solid var(--color-femo-red-100);
  border-bottom-left-radius: 0.3rem;
  box-shadow: 0 6px 14px -8px rgba(220, 38, 38, 0.18);
}

.femo-aid-msg-text { margin: 0; }

.femo-aid-cursor {
  display: inline-block;
  margin-left: 2px;
  color: var(--color-femo-red-500);
  animation: aid-cursor 1s steps(2) infinite;
}

@keyframes aid-cursor {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0; }
}

/* Inline formula (mini-KaTeX-like) */
.femo-aid-formula {
  margin-top: 0.55rem;
  padding: 0.55rem 0.85rem;
  background: var(--ui-bg-elevated);
  border-radius: 0.55rem;
  border: 1px dashed var(--color-femo-red-200);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--color-femo-red-700);
  text-align: center;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

:deep(.ad-frac) {
  display: inline-grid;
  grid-template-rows: auto auto auto;
  align-items: center;
  gap: 0.05rem;
  font-size: 0.95em;
  text-align: center;
}

:deep(.ad-frac i) {
  display: block;
  height: 2px;
  background: currentColor;
  border-radius: 1px;
  width: 100%;
  margin: 0.1rem auto;
}

.femo-aid-hint {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.35rem;
  margin-top: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: rgba(245, 158, 11, 0.12);
  border-radius: 0.5rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #92400E;
  line-height: 1.4;
}

.femo-aid-hint :first-child { margin-top: 0.1rem; flex: none; }

/* Typing dots */
.femo-aid-typing {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.2rem 0.3rem;
}

.femo-aid-typing-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--color-femo-red-500);
  animation: aid-typing 1.3s ease-in-out infinite;
}

.femo-aid-typing-dot:nth-child(2) { animation-delay: 0.15s; }
.femo-aid-typing-dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes aid-typing {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30%           { opacity: 1; transform: translateY(-3px); }
}

/* Action chips */
.femo-aid-chat-actions {
  padding: 0.75rem 0.85rem;
  background: var(--ui-bg-elevated);
  border-top: 1px solid var(--color-femo-ink-100);
  display: grid;
  gap: 0.5rem;
}

.femo-aid-chat-actions-label {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-femo-ink-600);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.femo-aid-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.femo-aid-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.75rem;
  border-radius: var(--radius-pill);
  background: linear-gradient(135deg, #FFF1F0, #FFE4D2);
  border: 1px solid var(--color-femo-red-200);
  color: var(--color-femo-red-700);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s var(--ease-out-expo);
}

.femo-aid-chip:hover:not(:disabled) {
  background: var(--gradient-hero);
  color: white;
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 8px 18px -6px rgba(220, 38, 38, 0.45);
}

.femo-aid-chip.is-used {
  opacity: 0.6;
  background: var(--ui-bg-elevated);
  color: var(--color-femo-ink-500);
  border-color: var(--color-femo-ink-200);
}

.femo-aid-chip:disabled { cursor: not-allowed; opacity: 0.5; }

/* ─── Side cards ─── */
.femo-aid-side {
  display: grid;
  gap: 0.85rem;
  align-content: start;
}

.femo-aid-side-card {
  padding: 1.1rem 1.2rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: 1.2rem;
  box-shadow: var(--shadow-soft);
  display: grid;
  gap: 0.45rem;
}

.femo-aid-side-card--accent {
  background:
    radial-gradient(60% 80% at 100% 0%, rgba(250, 165, 26, 0.18), transparent 70%),
    linear-gradient(135deg, #FFFFFF 0%, #FFF1F0 60%, #FFE4D2 100%);
  border-color: var(--color-femo-red-200);
  box-shadow: 0 14px 32px -14px rgba(220, 38, 38, 0.25);
}

.femo-aid-side-icon {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.75rem;
  background: var(--color-femo-ink-50);
  color: var(--color-femo-ink-700);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.femo-aid-side-icon--accent {
  background: var(--gradient-hero);
  color: white;
  box-shadow: 0 8px 18px -6px rgba(220, 38, 38, 0.45);
}

.femo-aid-side-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1rem;
  color: var(--color-femo-ink-900);
  letter-spacing: -0.01em;
  margin-top: 0.1rem;
}

.femo-aid-side-text {
  font-size: 0.85rem;
  color: var(--color-femo-ink-600);
  line-height: 1.5;
}

.femo-aid-side-cta {
  margin-top: 0.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem 0.95rem;
  background: var(--gradient-hero);
  color: white;
  border-radius: var(--radius-pill);
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 10px 22px -6px rgba(220, 38, 38, 0.5);
  transition: transform 0.3s var(--ease-out-expo);
}

.femo-aid-side-cta:hover { transform: translateY(-2px); }

@media (prefers-reduced-motion: reduce) {
  .femo-aid-chat-dot,
  .femo-aid-cursor,
  .femo-aid-typing-dot { animation: none; }
}
</style>
