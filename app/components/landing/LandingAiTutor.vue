<script setup lang="ts">
import { ref, computed } from 'vue'

const modes = [
  {
    title: 'Объясни правило',
    icon: 'i-lucide-lightbulb',
    badge: 'Грамматика',
    description: 'Пошаговое объяснение грамматики с примерами. AI подстраивает глубину под уровень ребёнка.',
    student: 'Explain me Present Perfect симплыми словами.',
    coach: 'Present Perfect мы используем, когда действие уже закончилось, но результат виден сейчас. Например: "I have eaten" — я уже поел (и не голоден сейчас). Схема: have/has + глагол в 3-й форме. Хочешь попробуем составить сам?'
  },
  {
    title: 'Давай поговорим',
    icon: 'i-lucide-mic',
    badge: 'Speaking практика',
    description: 'AI ведёт диалог на английском, исправляет ошибки и подсказывает более натуральные фразы.',
    student: 'I go to school yesterday.',
    coach: 'Almost! But "yesterday" is past, so we need Past Simple: "I went to school yesterday." Let me ask you: what did you do there? Tell me in English 😊'
  },
  {
    title: 'Произношение',
    icon: 'i-lucide-headphones',
    badge: 'Британский акцент',
    description: 'Повторяй за AI. Анализ произношения, подсказки по фонетике британского акцента.',
    student: 'Как правильно произнести "th"?',
    coach: 'Th бывает двух видов: звонкое [ð] как в "this" и глухое [θ] как в "think". Язык между зубами, выдох через нижние зубы. Повтори: "the", "this", "that", "three", "think"!'
  },
  {
    title: 'Пробный тест',
    icon: 'i-lucide-timer',
    badge: 'Проверка уровня',
    description: 'Мини-тест для определения уровня. AI подбирает задания под ребёнка.',
    student: 'Хочу узнать свой уровень.',
    coach: 'Let\u2019s start! Complete the sentence: "She ___ to school every day." (go / goes / went). Answer in English, no rush 😊'
  },
  {
    title: 'Любой вопрос',
    icon: 'i-lucide-message-circle',
    badge: 'Без ограничений',
    description: 'Любой вопрос по английскому — AI ответит понятно для ребёнка, с примерами.',
    student: 'Почему говорят "I am" а не "I is"?',
    coach: 'Потому что в английском глагол "to be" меняется для каждого местоимения: I am, You are, He/She is. Это иррегулярный глагол — его надо запомнить. Попробуем составить таблицу вместе?'
  }
]

const activeIdx = ref(0)
const currentMode = computed(() => modes[activeIdx.value]!)
const currentText = computed(() => currentMode.value.coach)
const { output: typed, isTyping } = useTypewriter(currentText, { speed: 14, startDelay: 250 })
</script>

<template>
  <section
    id="ai-tutor"
    class="femo-section"
  >
    <div class="femo-section-inner">
      <header class="femo-section-head">
        <span class="femo-chip">AI-тренер</span>
        <h2 class="femo-section-title femo-display">
          Персональный <span class="femo-text-gradient">AI-тренер</span><br>
          по английскому 24/7
        </h2>
        <p class="femo-section-sub">
          Пять режимов работы. Адаптируется под уровень ребёнка. Доступен всегда — даже в 11 вечера перед уроком.
        </p>
      </header>

      <div class="femo-ai-grid">
        <!-- Mode tabs -->
        <div class="femo-ai-tabs">
          <button
            v-for="(mode, i) in modes"
            :key="mode.title"
            class="femo-ai-tab"
            :class="{ 'is-active': i === activeIdx }"
            @click="activeIdx = i"
          >
            <span class="femo-ai-tab-icon">
              <UIcon
                :name="mode.icon"
                class="size-5"
              />
            </span>
            <span class="femo-ai-tab-body">
              <span class="femo-ai-tab-title">{{ mode.title }}</span>
              <span class="femo-ai-tab-badge">{{ mode.badge }}</span>
            </span>
            <UIcon
              v-if="i === activeIdx"
              name="i-lucide-arrow-right"
              class="size-4 femo-ai-tab-arrow"
            />
          </button>
        </div>

        <!-- Chat demo -->
        <div class="femo-ai-chat">
          <div class="femo-ai-chat-header">
            <div class="femo-ai-chat-avatar">
              <UIcon
                name="i-lucide-bot"
                class="size-5"
              />
            </div>
            <div class="femo-ai-chat-meta">
              <p class="femo-ai-chat-name">
                Lingaphone AI-тренер
              </p>
              <p class="femo-ai-chat-mode">
                {{ currentMode.title }} · {{ currentMode.badge }}
              </p>
            </div>
            <span class="femo-ai-chat-status">
              <span class="femo-ai-chat-status-dot" />
              онлайн
            </span>
          </div>

          <div class="femo-ai-chat-body">
            <p class="femo-ai-chat-context">
              {{ currentMode.description }}
            </p>

            <div class="femo-ai-msg femo-ai-msg--user">
              <div class="femo-ai-msg-avatar femo-ai-msg-avatar--user">
                А
              </div>
              <div class="femo-ai-msg-bubble">
                {{ currentMode.student }}
              </div>
            </div>

            <div class="femo-ai-msg femo-ai-msg--ai">
              <div class="femo-ai-msg-avatar femo-ai-msg-avatar--ai">
                <UIcon
                  name="i-lucide-bot"
                  class="size-4"
                />
              </div>
              <div class="femo-ai-msg-bubble femo-ai-msg-bubble--ai">
                <span>{{ typed }}</span>
                <span
                  v-if="isTyping"
                  class="femo-ai-cursor"
                >▍</span>
              </div>
            </div>
          </div>

          <div class="femo-ai-chat-footer">
            <div class="femo-ai-chat-input">
              <UIcon
                name="i-lucide-paperclip"
                class="size-4 text-femo-ink-400"
              />
              <span>Спросите AI-тренера…</span>
              <button
                class="femo-ai-chat-send"
                type="button"
              >
                <UIcon
                  name="i-lucide-send"
                  class="size-4"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.femo-ai-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

@media (min-width: 1024px) {
  .femo-ai-grid { grid-template-columns: 0.85fr 1.15fr; gap: 1.75rem; }
}

/* Tabs */
.femo-ai-tabs { display: grid; gap: 0.6rem; align-content: start; }

.femo-ai-tab {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
  border-radius: 1.1rem;
  border: 1px solid var(--color-femo-ink-100);
  background: var(--ui-bg-elevated);
  text-align: left;
  cursor: pointer;
  transition: all 0.35s var(--ease-out-expo);
}

.femo-ai-tab:hover { border-color: var(--color-femo-red-200); transform: translateX(2px); }

.femo-ai-tab.is-active {
  border-color: transparent;
  background: linear-gradient(135deg, #FFF1F0, #FFE4D2);
  box-shadow: 0 12px 32px -10px rgba(220, 38, 38, 0.25);
}

.femo-ai-tab-icon {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-femo-ink-50);
  color: var(--color-femo-ink-700);
  transition: all 0.35s var(--ease-out-expo);
}

.femo-ai-tab.is-active .femo-ai-tab-icon { background: var(--gradient-hero); color: white; box-shadow: 0 8px 18px -4px rgba(220, 38, 38, 0.45); }

.femo-ai-tab-body { display: grid; }
.femo-ai-tab-title { font-weight: 700; font-size: 0.95rem; color: var(--color-femo-ink-900); }
.femo-ai-tab-badge { font-size: 0.78rem; color: var(--color-femo-ink-500); }

.femo-ai-tab-arrow { color: var(--color-femo-red-600); }

/* Chat */
.femo-ai-chat {
  position: relative;
  border-radius: var(--radius-hero);
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  box-shadow: var(--shadow-pop);
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.femo-ai-chat-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-femo-ink-100);
  background: linear-gradient(180deg, #FFF7F4, white);
}

.femo-ai-chat-avatar {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: var(--radius-pill);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: var(--gradient-hero);
  box-shadow: 0 6px 14px -4px rgba(220, 38, 38, 0.45);
}

.femo-ai-chat-meta { flex: 1; min-width: 0; }
.femo-ai-chat-name { font-weight: 700; color: var(--color-femo-ink-900); }
.femo-ai-chat-mode { font-size: 0.8rem; color: var(--color-femo-ink-500); }

.femo-ai-chat-status {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.7rem;
  border-radius: var(--radius-pill);
  background: rgba(22, 163, 74, 0.10);
  color: #15803D;
  font-size: 0.78rem;
  font-weight: 600;
}

.femo-ai-chat-status-dot {
  width: 0.5rem; height: 0.5rem;
  border-radius: 50%;
  background: #16A34A;
  box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.25);
  animation: femo-pulse 1.6s ease-in-out infinite;
}

@keyframes femo-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.25); }
  50%      { box-shadow: 0 0 0 8px rgba(22, 163, 74, 0.10); }
}

.femo-ai-chat-body {
  padding: 1.25rem;
  display: grid;
  gap: 0.85rem;
  background: linear-gradient(180deg, white, #FFFAF8);
}

.femo-ai-chat-context {
  font-size: 0.85rem;
  color: var(--color-femo-ink-500);
  background: var(--color-femo-ink-50);
  border: 1px dashed var(--color-femo-ink-200);
  border-radius: 1rem;
  padding: 0.7rem 0.85rem;
}

.femo-ai-msg {
  display: grid;
  grid-template-columns: 2.2rem 1fr;
  gap: 0.65rem;
  align-items: flex-end;
}

.femo-ai-msg--user { grid-template-columns: 1fr 2.2rem; }
.femo-ai-msg--user .femo-ai-msg-avatar { order: 2; }
.femo-ai-msg--user .femo-ai-msg-bubble { order: 1; justify-self: end; }

.femo-ai-msg-avatar {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: var(--radius-pill);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
}

.femo-ai-msg-avatar--user { background: linear-gradient(135deg, #FFB199, #EF4438); }
.femo-ai-msg-avatar--ai   { background: var(--gradient-hero); }

.femo-ai-msg-bubble {
  max-width: 80%;
  padding: 0.7rem 0.95rem;
  border-radius: 1.1rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  font-size: 0.92rem;
  color: var(--color-femo-ink-800);
  line-height: 1.55;
}

.femo-ai-msg-bubble--ai {
  background: linear-gradient(180deg, #FFF1F0, white);
  border-color: var(--color-femo-red-100);
  border-bottom-left-radius: 0.4rem;
}

.femo-ai-msg--user .femo-ai-msg-bubble {
  background: linear-gradient(135deg, #FFE4D2, #FFD2BD);
  border-color: rgba(220, 38, 38, 0.12);
  border-bottom-right-radius: 0.4rem;
}

.femo-ai-cursor {
  display: inline-block;
  margin-left: 2px;
  color: var(--color-femo-red-600);
  animation: femo-cursor-blink 1s steps(2) infinite;
}

@keyframes femo-cursor-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0; }
}

.femo-ai-chat-footer {
  padding: 0.85rem 1.25rem 1.1rem;
  border-top: 1px solid var(--color-femo-ink-100);
  background: var(--ui-bg-elevated);
}

.femo-ai-chat-input {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.6rem 0.6rem 0.95rem;
  border-radius: var(--radius-pill);
  background: var(--color-femo-ink-50);
  border: 1px solid var(--color-femo-ink-100);
  color: var(--color-femo-ink-500);
  font-size: 0.9rem;
}

.femo-ai-chat-input > span:nth-child(2) { flex: 1; }

.femo-ai-chat-send {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: var(--radius-pill);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: var(--gradient-hero);
  box-shadow: 0 8px 18px -4px rgba(220, 38, 38, 0.45);
}
</style>
