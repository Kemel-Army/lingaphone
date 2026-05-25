<script setup lang="ts">
import { ref } from 'vue'

const items = [
  {
    label: 'Для какого возраста подходит платформа?',
    content: 'Для учеников 1–6 классов. AI адаптируется под уровень каждого ребёнка — от первых знаний до подготовки к международным языковым экзаменам.'
  },
  {
    label: 'Как проходят занятия?',
    content: 'Полностью в личном кабинете с AI-тренером. Не привязано к расписанию: ребёнок занимается удобными короткими сессиями 15–60 минут в день. Каждое задание — адаптивное, мгновенный разбор и подсказки.'
  },
  {
    label: 'Что делает AI-тренер?',
    content: 'AI-тренер доступен 24/7 в 5 режимах: объясняет темы, тренирует на заданиях, проверяет работу (текстом, фото или голосом), проводит Speaking-тесты, отвечает на любые вопросы по английскому. Подстраивается под уровень и не даёт слишком лёгких или сложных заданий.'
  },
  {
    label: 'Чем Lingaphone отличается от других платформ и репетиторов?',
    content: 'Мы — 100% на ИИ. Никаких расписаний, никаких живых учителей, никакого ожидания следующего занятия. Каждая тема разбита на 11 слоёв нашей собственной методики — от первого «зацепить» до финальной проверки — и AI ведёт ребёнка по ним, подстраиваясь под уровень в реальном времени. По нашим данным, дети в среднем занимаются в 3 раза чаще, чем у частного репетитора, — и за тариф мобильного интернета.'
  },
  {
    label: 'Как я буду видеть прогресс ребёнка?',
    content: 'В личном кабинете родителя — карта знаний по темам, результаты пробных тестов, AI-отчёты каждую неделю с конкретными цифрами и рекомендациями. Вы всегда видите, что происходит.'
  },
  {
    label: 'Что входит в бесплатный доступ?',
    content: 'AI-диагностика из 20 вопросов (5 минут) + 7 дней полного доступа к платформе со всеми режимами AI-тренера. Без привязки карты, без обязательств.'
  },
  {
    label: 'Безопасно ли это для ребёнка?',
    content: 'Да. AI обучен отвечать только на вопросы по английскому языку. Никакой рекламы, никаких чатов с другими детьми, никакой передачи данных третьим лицам. Полный родительский контроль и лимит экранного времени.'
  }
]

const open = ref<number | null>(0)
const toggle = (i: number) => {
  open.value = open.value === i ? null : i
}
</script>

<template>
  <section
    id="faq"
    class="femo-section"
  >
    <div class="femo-section-inner femo-faq-inner">
      <header class="femo-section-head femo-faq-head">
        <span class="femo-chip femo-chip--ink">FAQ</span>
        <h2 class="femo-section-title femo-display">
          Частые<br>
          <span class="femo-text-gradient">вопросы</span>
        </h2>
        <p class="femo-section-sub">
          Не нашли ответа? Напишите нам в WhatsApp — отвечаем быстро.
        </p>
      </header>

      <ul class="femo-faq-list">
        <li
          v-for="(item, i) in items"
          :key="item.label"
          class="femo-faq-item"
          :class="{ 'is-open': open === i }"
        >
          <button
            class="femo-faq-trigger"
            type="button"
            :aria-expanded="open === i"
            @click="toggle(i)"
          >
            <span>{{ item.label }}</span>
            <span class="femo-faq-icon">
              <UIcon
                :name="open === i ? 'i-lucide-minus' : 'i-lucide-plus'"
                class="size-4"
              />
            </span>
          </button>
          <div
            v-show="open === i"
            class="femo-faq-content"
          >
            {{ item.content }}
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.femo-faq-inner {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
}

@media (min-width: 1024px) {
  .femo-faq-inner {
    grid-template-columns: 1fr 1.4fr;
    gap: 4rem;
    align-items: start;
  }
}

.femo-faq-head {
  text-align: left;
  justify-items: start;
}

@media (min-width: 1024px) {
  .femo-faq-head {
    position: sticky;
    top: 12vh;
  }
}

.femo-faq-list {
  display: grid;
  gap: 0.75rem;
}

.femo-faq-item {
  background: var(--ui-bg-elevated);
  border: 1px solid var(--color-femo-ink-100);
  border-radius: var(--radius-card);
  overflow: hidden;
  transition: border-color 0.3s var(--ease-out-expo),
              box-shadow 0.3s var(--ease-out-expo);
}

.femo-faq-item.is-open {
  border-color: var(--color-femo-red-200);
  box-shadow: var(--shadow-pop);
}

.femo-faq-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.15rem 1.4rem;
  text-align: left;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.02rem;
  color: var(--color-femo-ink-900);
  background: transparent;
  cursor: pointer;
  transition: color 0.3s ease;
}

.femo-faq-trigger:hover { color: var(--color-femo-red-700); }

.femo-faq-icon {
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-pill);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-femo-red-50);
  color: var(--color-femo-red-700);
  flex: none;
  transition: all 0.3s var(--ease-out-expo);
}

.femo-faq-item.is-open .femo-faq-icon {
  background: var(--gradient-hero);
  color: white;
  transform: rotate(180deg);
}

.femo-faq-content {
  padding: 0 1.4rem 1.25rem;
  color: var(--color-femo-ink-700);
  line-height: 1.65;
  font-size: 0.95rem;
}
</style>
