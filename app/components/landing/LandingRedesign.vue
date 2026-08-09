<script setup lang="ts">
const menuOpen = ref(false)
const openFaq = ref<number | null>(0)
const wa = 'https://wa.me/77761235703?text=' + encodeURIComponent('Здравствуйте! Хочу подобрать бесплатный пробный урок для ребёнка.')
const facts = [['13 лет', 'учим детей английскому'], ['5 000+', 'учеников прошли обучение'], ['3–6', 'детей в мини-группе'], ['3 филиала', 'в Алматы + онлайн']]
const steps = [
  ['i-lucide-headphones', 'Услышал', 'Ребёнок слышит чистую английскую речь и правильную интонацию.'],
  ['i-lucide-lightbulb', 'Понял', 'Преподаватель объясняет смысл через ситуацию, игру и живой пример.'],
  ['i-lucide-message-circle', 'Сказал', 'Каждый ученик говорит — спрятаться за большой группой не получится.'],
  ['i-lucide-refresh-cw', 'Закрепил', 'Платформа помогает повторить материал и показывает результат.']
]
const faq = [
  ['Для какого возраста подходят занятия?', 'Программы рассчитаны на детей и подростков 6–16 лет. На пробном уроке определим уровень и предложим подходящую группу.'],
  ['Сколько детей занимается в группе?', 'В мини-группе от 3 до 6 учеников близкого возраста и уровня. Каждый ребёнок получает внимание преподавателя и регулярно говорит.'],
  ['Как проходит бесплатный пробный урок?', 'Ребёнок знакомится с преподавателем, выполняет задания на определение уровня и пробует формат занятия. Родитель получает рекомендации.'],
  ['Как родитель увидит прогресс?', 'В личном кабинете доступны задания, оценки, пройденные темы и динамика навыков. Преподаватель даёт понятную обратную связь.'],
  ['Что такое Маркет достижений?', 'Прозрачная система мотивации: регулярная работа и высокий средний балл превращаются в медали и награды.'],
  ['Можно учиться онлайн?', 'Да. Онлайн-группы работают по той же программе с живым преподавателем, заданиями и отслеживанием прогресса.']
]
</script>

<template>
  <div class="lr">
    <header class="nav">
      <div class="wrap navin">
        <a
          href="/"
          class="logo"
        ><b>L</b>Lingaphone</a><nav><a href="#method">Методика</a><a href="#results">Результаты</a><a href="#prices">Форматы и цены</a><a href="#branches">Филиалы</a></nav><div class="actions">
          <NuxtLink to="/login">Войти</NuxtLink><a
            :href="wa"
            class="btn small"
          >Пробный урок</a>
        </div><button
          type="button"
          class="burger"
          aria-label="Меню"
          @click="menuOpen=!menuOpen"
        >
          <UIcon :name="menuOpen?'i-lucide-x':'i-lucide-menu'" />
        </button>
      </div><div
        v-if="menuOpen"
        class="mobile"
      >
        <a href="#method">Методика</a><a href="#results">Результаты</a><a href="#prices">Цены</a><a
          :href="wa"
          class="btn"
        >Пробный урок</a>
      </div>
    </header>
    <main>
      <section class="hero">
        <div class="wrap hero-grid">
          <div class="hero-copy">
            <span class="eyebrow"><i />Образовательная платформа · Живые преподаватели</span><h1>Английский, на котором ребёнок <em>не боится говорить</em></h1><p>Живой преподаватель ведёт к результату, платформа помогает практиковаться каждый день, а родитель видит весь прогресс.</p><div class="hero-formula">
              <span><UIcon name="i-lucide-user-round-check" /> Преподаватель ведёт</span><span><UIcon name="i-lucide-sparkles" /> Платформа помогает</span><span><UIcon name="i-lucide-chart-no-axes-combined" /> Родитель видит</span>
            </div><div class="hero-actions">
              <a
                :href="wa"
                class="btn"
              >Записаться бесплатно <UIcon name="i-lucide-arrow-up-right" /></a><a
                href="#method"
                class="btn ghost"
              ><UIcon name="i-lucide-play" /> Как проходит урок</a>
            </div><small><UIcon name="i-lucide-circle-check" /> 45 минут · определим уровень · без обязательств</small>
          </div><div class="visual platform-hero">
            <img
              :src="'/images/brand/platform-hero-transparent-v2.png'"
              alt="Платформа Lingaphone на компьютере, планшете и телефоне: персональный путь, живой урок и прогресс"
            >
            <LandingMascot
              class="mascot-hero"
              state="welcome"
              size="sm"
              label="Привет! Я Линг — помогу не сбиться с пути"
              alt="Маскот Линг приветствует родителей"
              loading="eager"
            />
          </div>
        </div>
      </section>
      <section class="facts">
        <div class="wrap facts-grid">
          <article
            v-for="f in facts"
            :key="f[0]"
          >
            <strong>{{ f[0] }}</strong><span>{{ f[1] }}</span>
          </article>
        </div>
      </section>

      <section class="section ecosystem">
        <div class="wrap">
          <header class="head ecosystem-head">
            <span class="kicker">Вся система работает вместе</span><h2>Урок не заканчивается<br><em>после звонка</em></h2><p>Lingaphone объединяет живые занятия, самостоятельную практику, интерактивные материалы, мотивацию и контроль прогресса в одной платформе.</p>
          </header>
          <LandingMascot
            class="mascot-ecosystem"
            state="platform-guide"
            size="sm"
            label="Покажу, как всё связано"
          />
          <div class="ecosystem-stage">
            <div class="eco-orbit eco-orbit-one" />
            <div class="eco-orbit eco-orbit-two" />
            <div class="eco-core">
              <span><UIcon name="i-lucide-languages" /></span><b>Lingaphone</b><small>единая экосистема</small>
            </div>
            <article class="eco-card eco-card--path">
              <UIcon name="i-lucide-route" /><div><b>Мой путь</b><small>Персональная карта от текущего уровня до цели</small></div>
            </article>
            <article class="eco-card eco-card--books">
              <UIcon name="i-lucide-book-open-check" /><div><b>Интерактивные книги</b><small>Аудио, задания и тесты внутри урока</small></div>
            </article>
            <article class="eco-card eco-card--ai">
              <UIcon name="i-lucide-sparkles" /><div><b>AI-тренер 24/7</b><small>Объясняет, тренирует речь и помогает повторять</small></div>
            </article>
            <article class="eco-card eco-card--parent">
              <UIcon name="i-lucide-chart-no-axes-combined" /><div><b>Кабинет родителя</b><small>Навыки, оценки и рекомендации без догадок</small></div>
            </article>
            <article class="eco-card eco-card--teacher">
              <UIcon name="i-lucide-presentation" /><div><b>Кабинет преподавателя</b><small>Задания, группы и результаты каждого ученика</small></div>
            </article>
            <article class="eco-card eco-card--reward">
              <UIcon name="i-lucide-trophy" /><div><b>XP и достижения</b><small>Streak, медали и Маркет поддерживают регулярность</small></div>
            </article>
          </div>
          <div class="eco-flow">
            <article><span>01</span><b>На живом уроке</b><p>Преподаватель объясняет и вовлекает в разговор.</p></article><UIcon name="i-lucide-arrow-right" /><article><span>02</span><b>Между занятиями</b><p>Ребёнок практикуется в платформе и продолжает путь.</p></article><UIcon name="i-lucide-arrow-right" /><article><span>03</span><b>Результат прозрачен</b><p>Педагог корректирует обучение, родитель видит динамику.</p></article>
          </div>
        </div>
      </section>

      <section
        id="method"
        class="section"
      >
        <div class="wrap">
          <header class="head">
            <span class="kicker">Методика</span><h2>Знать правила недостаточно.<br><em>Важно начать говорить.</em></h2><p>Урок построен так, чтобы ребёнок слышал, понимал и сразу использовал английский в речи.</p>
          </header><div class="steps">
            <article
              v-for="(s, i) in steps"
              :key="s[1]"
            >
              <span>0{{ i+1 }}</span><UIcon :name="s[0]" /><h3>{{ s[1] }}</h3><p>{{ s[2] }}</p>
            </article>
          </div><div class="note">
            <LandingMascot
              class="mascot-method"
              state="method-teacher"
              size="xs"
            /><UIcon name="i-lucide-users" /><div><b>Почему мини-группа работает</b><p>В группе до шести учеников преподаватель успевает услышать каждого, исправить произношение и вовлечь в диалог.</p></div><a :href="wa">Попробовать формат <UIcon name="i-lucide-arrow-right" /></a>
          </div>
        </div>
      </section>

      <section
        id="results"
        class="section blue"
      >
        <div class="wrap proof">
          <div class="proof-copy">
            <span class="kicker light">Результат виден</span><h2>Каждый шаг ребёнка — под контролем системы</h2><p>Родитель видит не абстрактный балл, а полную картину: что уже усвоено, где нужна помощь и над чем работает преподаватель.</p><ul><li><UIcon name="i-lucide-check" /> тепловая карта знаний по каждой теме</li><li><UIcon name="i-lucide-check" /> контрольные точки после каждого блока</li><li><UIcon name="i-lucide-check" /> рекомендации и обратная связь преподавателя</li></ul><LandingMascot
              class="mascot-progress"
              state="progress-analyst"
              size="sm"
              label="Здесь нужна небольшая тренировка"
            />
          </div><div class="parent-console">
            <div class="pc-toolbar">
              <div class="pc-dots">
                <i /><i /><i />
              </div><b>Кабинет родителя</b><span><i /> Обновлено сегодня, 18:40</span>
            </div>
            <div class="pc-profile">
              <span class="pc-avatar">А</span><div><b>Айгерим · 11 лет</b><small>Персональная программа · группа Junior A2</small></div><span class="pc-level">A2</span>
            </div>
            <div class="pc-metrics">
              <article><small>Прогресс за месяц</small><strong class="positive">+18%</strong><span><UIcon name="i-lucide-trending-up" /> выше прошлого месяца</span></article>
              <article><small>Живые уроки</small><strong>8 <em>/ 8</em></strong><span>100% посещаемость</span></article>
              <article><small>Практика</small><strong>12 <em>/ 13</em></strong><span>1 задание до цели</span></article>
            </div>
            <div class="pc-insights">
              <section class="pc-heatmap">
                <header><div><b>Тепловая карта знаний</b><small>Динамика за последние 6 недель</small></div><span>Сейчас</span></header>
                <div
                  class="heat-grid"
                  aria-label="Тепловая карта навыков Айгерим"
                >
                  <span class="heat-label muted">Навык</span><small>1</small><small>2</small><small>3</small><small>4</small><small>5</small><small>6</small><span />
                  <b class="heat-label">Speaking</b><i
                    class="heat-2"
                    title="Начальный уровень"
                  /><i
                    class="heat-2"
                    title="Начальный уровень"
                  /><i
                    class="heat-3"
                    title="Средний уровень"
                  /><i
                    class="heat-3"
                    title="Средний уровень"
                  /><i
                    class="heat-4"
                    title="Хороший уровень"
                  /><i
                    class="heat-5"
                    title="Уверенный навык"
                  /><strong>82%</strong>
                  <b class="heat-label">Listening</b><i
                    class="heat-2"
                    title="Начальный уровень"
                  /><i
                    class="heat-3"
                    title="Средний уровень"
                  /><i
                    class="heat-3"
                    title="Средний уровень"
                  /><i
                    class="heat-4"
                    title="Хороший уровень"
                  /><i
                    class="heat-5"
                    title="Уверенный навык"
                  /><i
                    class="heat-5"
                    title="Уверенный навык"
                  /><strong>88%</strong>
                  <b class="heat-label">Reading</b><i
                    class="heat-3"
                    title="Средний уровень"
                  /><i
                    class="heat-3"
                    title="Средний уровень"
                  /><i
                    class="heat-4"
                    title="Хороший уровень"
                  /><i
                    class="heat-4"
                    title="Хороший уровень"
                  /><i
                    class="heat-4"
                    title="Хороший уровень"
                  /><i
                    class="heat-5"
                    title="Уверенный навык"
                  /><strong>84%</strong>
                  <b class="heat-label">Grammar</b><i
                    class="heat-3"
                    title="Средний уровень"
                  /><i
                    class="heat-3"
                    title="Средний уровень"
                  /><i
                    class="heat-4"
                    title="Хороший уровень"
                  /><i
                    class="heat-3"
                    title="Средний уровень"
                  /><i
                    class="heat-warn"
                    title="Требует внимания"
                  /><i
                    class="heat-3"
                    title="Средний уровень"
                  /><strong class="attention">68%</strong>
                </div>
                <div class="heat-legend">
                  <span><i class="heat-1" /> нужно внимание</span><span><i class="heat-5" /> навык закреплён</span>
                </div>
              </section>
              <aside class="pc-checkpoints">
                <header><b>Контрольные точки</b><small>Unit 3 · My Day</small></header>
                <div><span class="done"><UIcon name="i-lucide-check" /></span><p><b>Словарный запас</b><small>24 из 24 слов</small></p><strong>100%</strong></div>
                <div><span class="done"><UIcon name="i-lucide-check" /></span><p><b>Speaking check</b><small>Диалог с педагогом</small></p><strong>85%</strong></div>
                <div><span class="focus"><UIcon name="i-lucide-target" /></span><p><b>Present Simple</b><small>Нужно закрепить</small></p><strong>68%</strong></div>
              </aside>
            </div>
            <div class="pc-feedback">
              <span class="teacher-avatar">AK</span><div><b>Рекомендация преподавателя</b><p>Айгерим уже уверенно говорит о распорядке дня. На этой неделе закрепляем вопросы в Present Simple.</p></div><span class="feedback-status"><i /> План обновлён</span>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="wrap market">
          <div class="market-copy">
            <span class="kicker">Маркет достижений</span><h2>Усилия превращаются в <em>видимый результат</em></h2><p>Ребёнок учится ставить цель, регулярно работать и отвечать за результат.</p><div class="paid">
              <strong>5 000 000+ ₸</strong><span>выплачено ученикам за достижения*</span>
            </div><small>* Показатель требует подтверждения перед публикацией.</small><LandingMascot
              class="mascot-market"
              state="celebrate"
              size="sm"
              label="Усилия замечены!"
            />
          </div><div class="medals">
            <article><span>🥇</span><b>Золото</b><strong>5 000 ₸</strong><small>балл от 4,6</small></article><article><span>🥈</span><b>Серебро</b><strong>3 000 ₸</strong><small>балл от 4,0</small></article><article><span>🥉</span><b>Бронза</b><strong>1 000 ₸</strong><small>балл от 3,6</small></article>
          </div>
        </div>
      </section>

      <section class="section soft">
        <div class="wrap">
          <header class="head support-head">
            <span class="kicker">Педагоги</span><h2>Рядом — живой преподаватель.<br><em>Технологии помогают ему.</em></h2><p>Педагог ведёт урок и знает ребёнка. Платформа помогает закреплять материал.</p>
            <LandingMascot
              class="mascot-support"
              state="encourage"
              size="sm"
              label="Ошибаться — нормально"
            />
          </header><div class="teachers">
            <article><UIcon name="i-lucide-graduation-cap" /><h3>Единая методика</h3><p>Понятный путь обучения и стандарт проведения уроков.</p></article><article><UIcon name="i-lucide-heart-handshake" /><h3>Поддержка без страха</h3><p>Можно подумать, попробовать и спокойно исправить ошибку.</p></article><article><UIcon name="i-lucide-chart-no-axes-combined" /><h3>Обратная связь</h3><p>Родитель понимает, что получается и над чем работает группа.</p></article>
          </div><p class="placeholder">
            Здесь будут настоящие фотографии, квалификация и видео-знакомства преподавателей Lingaphone.
          </p>
        </div>
      </section>

      <section
        id="prices"
        class="section"
      >
        <div class="wrap">
          <header class="head">
            <span class="kicker">Форматы и цены</span><h2>Выберите удобный формат.<br><em>Методика остаётся той же.</em></h2>
          </header><div class="prices">
            <article class="featured">
              <span class="tag">Популярный</span><UIcon name="i-lucide-building-2" /><h3>Офлайн · Алматы</h3><div class="price">
                <b>35 000 ₸</b><span>/ месяц</span>
              </div><ul><li>2 урока в неделю по 60 минут</li><li>мини-группа 3–6 детей</li><li>3 филиала в Алматы</li><li>платформа и Маркет достижений</li></ul><a
                :href="wa"
                class="btn"
              >Подобрать филиал</a>
            </article><article>
              <span class="tag neutral">По всему миру</span><UIcon name="i-lucide-laptop" /><h3>Онлайн</h3><div class="price">
                <b>25 000 ₸</b><span>/ месяц</span>
              </div><ul><li>2 живых урока в неделю</li><li>мини-группа близкого уровня</li><li>занятия из любого города</li><li>платформа и обратная связь</li></ul><a
                :href="wa"
                class="btn outline"
              >Подобрать онлайн-группу</a>
            </article>
          </div><div class="trial">
            <LandingMascot
              class="mascot-plan"
              state="plan-helper"
              size="xs"
            /><div><span>Бесплатный пробный урок</span><b>Поможем сравнить онлайн и офлайн — без давления</b></div><a
              :href="wa"
              class="btn"
            >Записаться бесплатно</a>
          </div>
        </div>
      </section>

      <section
        id="branches"
        class="section soft"
      >
        <div class="wrap process-grid">
          <div>
            <span class="kicker">Начать легко</span><h2>От заявки до урока — <em>три шага</em></h2><div class="process">
              <article><b>1</b><div><h3>Оставьте заявку</h3><p>Выберите онлайн или удобный район Алматы.</p></div></article><article><b>2</b><div><h3>Пройдите пробный урок</h3><p>Познакомимся и определим уровень ребёнка.</p></div></article><article><b>3</b><div><h3>Получите рекомендацию</h3><p>Предложим программу, преподавателя и группу.</p></div></article>
            </div>
          </div><aside class="process-card">
            <LandingMascot
              class="mascot-onboarding"
              state="onboarding-guide"
              size="sm"
              label="Всего три понятных шага"
            /><div>
              <UIcon name="i-lucide-map-pinned" /><h3>3 филиала в Алматы</h3><p>Точные адреса, фотографии и доступные группы добавим после подтверждения данных.</p><NuxtLink
                to="/contact"
                class="btn outline"
              >Посмотреть контакты</NuxtLink>
            </div>
          </aside>
        </div>
      </section>

      <section class="section">
        <div class="wrap faq">
          <div>
            <span class="kicker">Вопросы</span><h2>Всё важное<br><em>до первого урока</em></h2><p>Не нашли ответ? Напишите нам — спокойно подберём формат.</p><a
              :href="wa"
              class="textlink"
            >Задать вопрос в WhatsApp</a><LandingMascot
              class="mascot-faq"
              state="faq-curious"
              size="md"
              label="Давайте разберёмся"
            />
          </div><div class="faqlist">
            <article
              v-for="(f, i) in faq"
              :key="f[0]"
              :class="{ open: openFaq===i }"
            >
              <button
                type="button"
                @click="openFaq=openFaq===i?null:i"
              >
                <span>{{ f[0] }}</span><UIcon :name="openFaq===i?'i-lucide-minus':'i-lucide-plus'" />
              </button><p v-if="openFaq===i">
                {{ f[1] }}
              </p>
            </article>
          </div>
        </div>
      </section>

      <section class="final">
        <div class="wrap final-card">
          <div>
            <span>Первый шаг — бесплатно</span><h2>Узнайте уровень ребёнка и познакомьтесь с методикой</h2><p>Менеджер уточнит возраст, формат и удобное время.</p><a
              :href="wa"
              class="btn white"
            >Подобрать пробный урок</a><small>Без оплаты · без привязки карты · без обязательств</small>
          </div><LandingMascot
            class="mascot-final"
            state="trial-invite"
            size="lg"
            alt="Линг приглашает на бесплатный пробный урок"
          />
        </div>
      </section>
    </main>
    <footer class="footer">
      <div class="wrap footer-grid">
        <div>
          <a
            href="/"
            class="logo"
          ><b>L</b>Lingaphone</a><p>Английский, на котором ребёнок не боится говорить.</p>
        </div><div><b>Школа</b><a href="#method">Методика</a><a href="#prices">Форматы и цены</a><a href="#branches">Филиалы</a></div><div><b>Информация</b><NuxtLink to="/contact">Контакты</NuxtLink><NuxtLink to="/privacy">Конфиденциальность</NuxtLink><NuxtLink to="/terms">Условия</NuxtLink></div><div><b>Связаться</b><a :href="wa">WhatsApp</a><a href="https://instagram.com/lingaphone.kz">Instagram</a></div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.lr{--n:#123b63;--b:#1677c8;--s:#23a8e0;--t:#102a43;--m:#526d82;--bd:#d8eaf5;color:var(--t);background:#fff;font-family:Inter,sans-serif;line-height:1.55}.lr *{box-sizing:border-box}.wrap{width:min(1200px,calc(100% - 40px));margin:auto}.nav{height:76px;display:flex;align-items:center;position:sticky;top:0;z-index:20;background:#fffffff0;backdrop-filter:blur(18px);border-bottom:1px solid var(--bd)}.navin{display:flex;align-items:center;justify-content:space-between;gap:25px}.logo{display:flex;align-items:center;gap:10px;color:var(--n);font-weight:850;font-size:18px;text-decoration:none}.logo>b{display:grid;place-items:center;width:35px;height:35px;border-radius:11px;background:linear-gradient(145deg,var(--b),var(--s));color:#fff;box-shadow:0 8px 20px #1677c833}.nav nav,.actions{display:flex;align-items:center;gap:25px}.nav nav a,.actions>a:first-child{font-size:14px;font-weight:650;color:#35536a;text-decoration:none}.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 23px;border-radius:14px;background:linear-gradient(135deg,var(--b),var(--s));color:#fff!important;text-decoration:none;font-weight:750;box-shadow:0 12px 28px #1677c833;transition:.2s}.btn:hover{transform:translateY(-2px)}.btn.small{min-height:43px;padding-inline:18px;font-size:14px}.btn.ghost,.btn.outline{background:#fff;color:var(--n)!important;border:1px solid var(--bd);box-shadow:none}.btn.white{background:#fff;color:var(--n)!important}.burger,.mobile{display:none}.hero{position:relative;padding:84px 0 70px;overflow:hidden}.hero:before{content:'';position:absolute;width:700px;height:700px;left:-300px;top:-300px;border-radius:50%;background:radial-gradient(circle,#23a8e026,transparent 68%)}.hero-grid{position:relative;display:grid;grid-template-columns:.9fr 1.1fr;align-items:center;gap:60px}.eyebrow,.kicker{display:inline-flex;align-items:center;gap:9px;text-transform:uppercase;letter-spacing:.11em;font-size:12px;font-weight:850;color:var(--b)}.eyebrow i{width:8px;height:8px;border-radius:50%;background:#28b879;box-shadow:0 0 0 5px #28b8791f}.hero h1,.section h2,.final h2{font-family:Manrope,Inter,sans-serif;font-weight:850;letter-spacing:-.045em;line-height:1.04;margin:18px 0 24px}.hero h1{font-size:clamp(43px,5vw,68px)}em{font-style:normal;color:var(--b)}.hero-copy>p{font-size:19px;color:var(--m);max-width:570px}.hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:30px}.hero-copy>small{display:flex;align-items:center;gap:7px;margin-top:15px;color:#668095}.visual{position:relative}.visual>img{display:block;width:100%;aspect-ratio:1.18;object-fit:cover;object-position:63% center;border-radius:32px;box-shadow:0 32px 80px #123b632e}.bubble{position:absolute;display:flex;align-items:center;gap:10px;background:#fffffff2;border-radius:16px;padding:12px 14px;box-shadow:0 18px 45px #123b6329}.bubble.top{right:-18px;top:28px}.bubble.bottom{left:-28px;bottom:25px}.bubble>svg{width:35px;height:35px;padding:8px;border-radius:10px;background:#e5f6ff;color:var(--b)}.bubble img{width:48px;height:48px;object-fit:cover;object-position:50% 15%;border-radius:12px}.bubble b,.bubble small{display:block}.bubble b{font-size:13px}.bubble small{font-size:11px;color:var(--m)}.facts{background:#f8fcff;border-block:1px solid var(--bd)}.facts-grid{display:grid;grid-template-columns:repeat(4,1fr)}.facts article{padding:30px 24px;border-right:1px solid var(--bd)}.facts article:last-child{border:0}.facts strong,.facts span{display:block}.facts strong{font:850 27px Manrope;color:var(--n)}.facts span{font-size:13px;color:var(--m)}.section{padding:clamp(75px,9vw,120px) 0}.section.soft{background:#f7fbfe}.head{text-align:center;max-width:750px;margin:0 auto 48px}.section h2{font-size:clamp(34px,4vw,52px)}.head>p{max-width:650px;margin:auto;color:var(--m);font-size:17px}.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.steps article,.teachers article{position:relative;padding:28px 24px;border:1px solid var(--bd);border-radius:22px;background:#fff}.steps article>span{position:absolute;right:22px;color:#abc4d5;font-weight:800;font-size:12px}.steps svg,.teachers svg{width:30px;height:30px;color:var(--b);margin:34px 0 18px}.steps h3,.teachers h3{font:800 20px Manrope;margin-bottom:8px}.steps p,.teachers p{font-size:14px;color:var(--m)}.note{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:18px;margin-top:24px;padding:24px 28px;background:#edf8fe;border-radius:20px}.note>svg{width:34px;height:34px;color:var(--b)}.note p{font-size:13px;color:var(--m)}.note a,.textlink{display:flex;align-items:center;gap:7px;color:var(--b);font-weight:750;text-decoration:none}.blue{background:linear-gradient(135deg,#092d4e,#124c79);color:#fff}.proof{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}.kicker.light{color:#78d2f5}.proof>div:first-child>p{color:#c3d8e7;font-size:17px}.proof ul{display:grid;gap:12px;margin-top:25px}.proof li{display:flex;gap:9px;align-items:center}.proof li svg{color:#65d4a5}.dashboard{background:#fff;color:var(--t);padding:28px;border-radius:25px;box-shadow:0 30px 70px #0003}.dashboard header{display:flex;justify-content:space-between}.dashboard header small,.dashboard header strong{display:block}.dashboard header strong{font:850 34px Manrope;color:#1da66f}.dashboard header>span{height:max-content;background:#e6f6ff;color:var(--b);padding:7px 11px;border-radius:99px;font-weight:800}.chart{height:160px;display:flex;align-items:end;gap:12px;padding-top:25px;border-bottom:1px solid var(--bd)}.chart i{flex:1;border-radius:8px 8px 0 0;background:linear-gradient(var(--s),var(--b))}.dashboard footer{display:grid;grid-template-columns:repeat(3,1fr);margin-top:18px}.dashboard footer span{font-size:11px;color:var(--m)}.dashboard footer b{display:block;font-size:15px;color:var(--n)}.market{display:grid;grid-template-columns:.9fr 1.1fr;gap:70px;align-items:center}.market>div:first-child>p{color:var(--m);font-size:17px}.paid{margin-top:28px;padding-top:24px;border-top:1px solid var(--bd)}.paid strong,.paid span{display:block}.paid strong{font:850 35px Manrope;color:var(--b)}.market>div:first-child>small{font-size:10px;color:#8ca2b2}.medals{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.medals article{text-align:center;padding:28px 10px;border:1px solid var(--bd);border-radius:22px;box-shadow:0 14px 35px #123b6312}.medals span,.medals b,.medals strong,.medals small{display:block}.medals span{font-size:40px}.medals b{margin-top:10px}.medals strong{font:850 20px Manrope;color:var(--n)}.medals small{color:var(--m)}.teachers{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.teachers svg{margin-top:0}.placeholder{text-align:center;color:var(--m);font-size:13px;margin-top:22px}.prices{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;max-width:900px;margin:auto}.prices>article{position:relative;padding:35px;border:1px solid var(--bd);border-radius:26px}.prices>article.featured{border:2px solid #54bce5;box-shadow:0 25px 60px #1277b921}.prices article>svg{width:34px;height:34px;color:var(--b);margin-top:22px}.prices h3{font:800 23px Manrope;margin:15px 0}.tag{position:absolute;right:18px;top:18px;background:#e6f7ff;color:var(--b);padding:6px 10px;border-radius:99px;font-size:10px;font-weight:800;text-transform:uppercase}.tag.neutral{background:#f2f6f8;color:var(--m)}.price{display:flex;align-items:baseline;gap:6px}.price b{font:850 32px Manrope;color:var(--n)}.price span{color:var(--m)}.prices ul{display:grid;gap:10px;margin:23px 0}.prices li{padding-left:23px;position:relative;color:#3d5a70;font-size:14px}.prices li:before{content:'✓';position:absolute;left:0;color:#19a66e;font-weight:900}.prices .btn{width:100%}.trial{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:24px;padding:24px 30px;border-radius:22px;background:#edf8fe}.trial span,.trial b{display:block}.trial span{color:var(--b);font-size:11px;font-weight:850;text-transform:uppercase}.trial b{font:800 18px Manrope}.process-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:80px;align-items:center}.process{display:grid;gap:18px;margin-top:34px}.process article{display:grid;grid-template-columns:44px 1fr;gap:15px}.process article>b{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:#e4f5fd;color:var(--b)}.process h3{font:800 17px Manrope}.process p{font-size:14px;color:var(--m)}.process-grid aside{padding:44px;border:1px solid var(--bd);border-radius:28px;background:#fff;box-shadow:0 20px 50px #123b6314}.process-grid aside>svg{width:65px;height:65px;padding:17px;border-radius:18px;background:#e5f6ff;color:var(--b)}.process-grid aside h3{font:800 25px Manrope;margin:22px 0 8px}.process-grid aside p{color:var(--m);margin-bottom:24px}.faq{display:grid;grid-template-columns:.7fr 1.3fr;gap:80px}.faq>div:first-child>p{color:var(--m);margin-bottom:20px}.faqlist{display:grid;gap:10px}.faqlist article{border:1px solid var(--bd);border-radius:17px;overflow:hidden}.faqlist article.open{border-color:#8dd3ef;box-shadow:0 10px 30px #123b630f}.faqlist button{display:flex;justify-content:space-between;gap:20px;width:100%;padding:20px 22px;border:0;background:#fff;text-align:left;font-weight:750;color:var(--t)}.faqlist p{padding:0 22px 20px;color:var(--m);font-size:14px}.final{padding:35px 0 90px}.final-card{display:grid;grid-template-columns:1.15fr .85fr;align-items:center;min-height:430px;overflow:hidden;border-radius:34px;background:linear-gradient(135deg,#0b3458,var(--b));color:#fff}.final-card>div{padding:58px}.final-card>div>span{color:#93ddf7;font-size:12px;font-weight:850;text-transform:uppercase}.final h2{font-size:clamp(34px,4vw,50px)}.final p{color:#d5e7f2}.final .btn{margin-top:25px}.final small{display:block;margin-top:12px;color:#b9d4e4}.final img{width:100%;height:450px;object-fit:cover;object-position:50% 8%;mix-blend-mode:screen}.footer{padding:65px 0;background:#071d33;color:#fff}.footer-grid{display:grid;grid-template-columns:2fr repeat(3,1fr);gap:55px}.footer p{color:#98b4c7;max-width:310px;margin-top:15px}.footer-grid>div:not(:first-child){display:grid;align-content:start;gap:9px}.footer-grid a{color:#a9c1d1;text-decoration:none;font-size:14px}
@media(max-width:960px){.nav nav,.actions{display:none}.burger{display:grid;place-items:center;width:42px;height:42px;border:1px solid var(--bd);border-radius:12px;background:#fff}.mobile{display:grid;position:absolute;top:76px;left:0;right:0;padding:18px 20px;background:#fff;border-bottom:1px solid var(--bd);box-shadow:0 20px 40px #123b631a}.mobile>a:not(.btn){padding:9px;color:var(--t);text-decoration:none}.hero-grid,.proof,.market,.process-grid{grid-template-columns:1fr;gap:45px}.hero-copy{text-align:center}.hero-copy>p{margin:auto}.hero-actions{justify-content:center}.hero-copy>small{justify-content:center}.visual{max-width:700px;margin:auto}.steps{grid-template-columns:repeat(2,1fr)}.faq{grid-template-columns:1fr;gap:40px}.footer-grid{grid-template-columns:2fr 1fr 1fr}.footer-grid>div:last-child{display:none}}
@media(max-width:680px){.wrap{width:min(100% - 28px,1200px)}.nav{height:66px}.mobile{top:66px}.hero{padding:45px 0 52px}.hero h1{font-size:39px}.hero-copy>p{font-size:16px}.hero-actions{display:grid}.btn{width:100%}.visual>img{aspect-ratio:.92;border-radius:22px}.bubble.top{right:8px;top:12px}.bubble.bottom{left:8px;bottom:12px}.facts-grid{grid-template-columns:repeat(2,1fr)}.facts article:nth-child(2){border-right:0}.facts article:nth-child(-n+2){border-bottom:1px solid var(--bd)}.section h2{font-size:34px}.steps,.teachers,.prices{grid-template-columns:1fr}.note{grid-template-columns:auto 1fr}.note>a{grid-column:1/-1}.medals{gap:6px}.medals article{padding:20px 5px}.medals span{font-size:30px}.medals strong{font-size:15px}.trial{display:grid;padding:22px}.process-grid aside{padding:30px}.final-card{grid-template-columns:1fr}.final-card>div{padding:38px 25px}.final img{height:300px}.footer-grid{grid-template-columns:1fr 1fr}.footer-grid>div:first-child{grid-column:1/-1}.footer-grid>div:nth-child(3){display:none}}
@media(prefers-reduced-motion:reduce){.btn{transition:none}.btn:hover{transform:none}}
.final img {
  object-fit: contain;
  object-position: 50% 100%;
  mix-blend-mode: normal;
  filter: drop-shadow(0 24px 32px rgb(4 29 51 / 22%));
}
.hero-formula {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 24px;
}
.hero-formula span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid var(--bd);
  border-radius: 999px;
  background: rgb(255 255 255 / 82%);
  color: #35536a;
  font-size: 11px;
  font-weight: 750;
}
.hero-formula svg { color: var(--b); }
.platform-hero > img {
  position: relative;
  z-index: 2;
  width: 120%;
  max-width: none;
  aspect-ratio: auto;
  margin-left: -10%;
  object-fit: contain;
  object-position: center;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  filter: drop-shadow(0 34px 35px rgb(18 59 99 / 23%));
}
.platform-hero::before {
  position: absolute;
  inset: 5% 1% 4%;
  content: '';
  border: 1px solid rgb(255 255 255 / 82%);
  border-radius: 42% 58% 52% 48% / 46% 42% 58% 54%;
  background:
    radial-gradient(circle at 78% 18%, rgb(255 255 255 / 90%), transparent 22%),
    linear-gradient(145deg, #eaf8ff, #d6effc 55%, #eff9ff);
  box-shadow: inset 0 0 80px rgb(255 255 255 / 70%), 0 36px 90px rgb(18 59 99 / 10%);
  transform: rotate(-2deg);
}
.platform-hero::after {
  position: absolute;
  z-index: 1;
  right: 1%;
  bottom: 6%;
  width: 38%;
  height: 30%;
  content: '';
  border-radius: 50%;
  background: rgb(35 168 224 / 28%);
  filter: blur(55px);
}
.ecosystem {
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 46%, rgb(35 168 224 / 13%), transparent 34%),
    linear-gradient(180deg, #fff, #f4faff 56%, #fff);
}
.ecosystem-head { margin-bottom: 28px; }
.ecosystem-stage {
  position: relative;
  height: 620px;
  max-width: 1080px;
  margin: 0 auto;
}
.eco-orbit {
  position: absolute;
  inset: 50%;
  border: 1px dashed rgb(22 119 200 / 24%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}
.eco-orbit-one { width: 490px; height: 490px; }
.eco-orbit-two { width: 760px; height: 560px; }
.eco-core {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  display: grid;
  width: 190px;
  height: 190px;
  place-items: center;
  align-content: center;
  border: 10px solid rgb(255 255 255 / 80%);
  border-radius: 50%;
  background: linear-gradient(145deg, #0b3458, var(--b));
  color: #fff;
  box-shadow: 0 28px 70px rgb(18 59 99 / 24%);
  transform: translate(-50%, -50%);
}
.eco-core span {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  margin-bottom: 8px;
  border-radius: 14px;
  background: rgb(255 255 255 / 14%);
}
.eco-core span svg { width: 25px; height: 25px; }
.eco-core b { font: 850 22px Manrope; }
.eco-core small { color: #bfe7f8; }
.eco-card {
  position: absolute;
  z-index: 3;
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 13px;
  width: 270px;
  align-items: center;
  padding: 18px;
  border: 1px solid rgb(216 234 245 / 90%);
  border-radius: 19px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 18px 45px rgb(18 59 99 / 10%);
  backdrop-filter: blur(14px);
}
.eco-card > svg {
  width: 44px;
  height: 44px;
  padding: 11px;
  border-radius: 13px;
  background: #e7f6fd;
  color: var(--b);
}
.eco-card b, .eco-card small { display: block; }
.eco-card b { font: 800 14px Manrope; }
.eco-card small { margin-top: 3px; color: var(--m); font-size: 11px; }
.eco-card--path { top: 48px; left: 80px; }
.eco-card--books { top: 48px; right: 80px; }
.eco-card--ai { top: 252px; left: 0; }
.eco-card--parent { top: 252px; right: 0; }
.eco-card--teacher { bottom: 36px; left: 120px; }
.eco-card--reward { right: 120px; bottom: 36px; }
.eco-flow {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  gap: 20px;
  max-width: 1030px;
  align-items: center;
  margin: 8px auto 0;
  padding: 24px 28px;
  border: 1px solid var(--bd);
  border-radius: 22px;
  background: #fff;
}
.eco-flow > svg { color: #94b6cb; }
.eco-flow article span { color: var(--s); font: 850 11px Manrope; }
.eco-flow article b { display: block; margin: 4px 0; font: 800 15px Manrope; }
.eco-flow article p { color: var(--m); font-size: 12px; }
@media (max-width: 960px) {
  .ecosystem-stage {
    display: grid;
    height: auto;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-top: 34px;
  }
  .eco-orbit { display: none; }
  .eco-core {
    position: static;
    width: auto;
    height: auto;
    min-height: 150px;
    grid-column: 1 / -1;
    border-radius: 24px;
    transform: none;
  }
  .eco-card {
    position: static;
    width: auto;
    min-height: 96px;
  }
  .eco-flow { grid-template-columns: 1fr; }
  .eco-flow > svg { display: none; }
}
@media (max-width: 680px) {
  .hero-formula { justify-content: center; }
  .platform-hero > img {
    width: 112%;
    margin-left: -6%;
    aspect-ratio: auto;
  }
  .platform-hero::before { inset: 2%; border-radius: 28px; }
  .ecosystem-stage { grid-template-columns: 1fr; }
  .eco-core { grid-column: auto; }
  .eco-flow { padding: 20px; }
  .eco-flow article + article { padding-top: 16px; border-top: 1px solid var(--bd); }
}

/* Parent progress cockpit */
.proof { grid-template-columns: .82fr 1.18fr; gap: 58px; }
.parent-console {
  overflow: hidden;
  color: var(--t);
  border: 1px solid rgb(255 255 255 / 68%);
  border-radius: 25px;
  background: #f6fbfe;
  box-shadow: 0 34px 80px rgb(0 14 31 / 32%);
}
.pc-toolbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  min-height: 42px;
  padding: 0 18px;
  color: #617c90;
  border-bottom: 1px solid #dcecf5;
  background: #fff;
  font-size: 10px;
}
.pc-toolbar > b { color: var(--n); font-size: 11px; }
.pc-toolbar > span { display: flex; align-items: center; gap: 6px; }
.pc-toolbar > span > i { width: 6px; height: 6px; border-radius: 50%; background: #25b77c; box-shadow: 0 0 0 3px #25b77c1f; }
.pc-dots { display: flex; gap: 4px; }
.pc-dots i { width: 6px; height: 6px; border-radius: 50%; background: #c5d8e5; }
.pc-dots i:first-child { background: #80cdec; }
.pc-profile {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 11px;
  padding: 15px 18px 10px;
}
.pc-profile b,.pc-profile small { display: block; }
.pc-profile b { font: 800 13px Manrope; }
.pc-profile small { margin-top: 2px; color: #6c8496; font-size: 9px; }
.pc-avatar,.teacher-avatar { display: grid; place-items: center; color: #fff; background: linear-gradient(145deg,var(--b),var(--s)); font-weight: 850; }
.pc-avatar { width: 34px; height: 34px; border-radius: 11px; }
.pc-level { padding: 5px 9px; color: var(--b); border-radius: 99px; background: #e1f3fc; font: 850 11px Manrope; }
.pc-metrics { display: grid; grid-template-columns: 1.18fr 1fr 1fr; gap: 8px; padding: 0 18px 10px; }
.pc-metrics article { min-width: 0; padding: 11px 12px; border: 1px solid #deebf2; border-radius: 13px; background: #fff; }
.pc-metrics small,.pc-metrics strong,.pc-metrics span { display: block; }
.pc-metrics small { overflow: hidden; color: #647c8e; font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
.pc-metrics strong { margin: 2px 0; color: var(--n); font: 850 20px Manrope; }
.pc-metrics strong.positive { color: #1ba36f; }
.pc-metrics strong em { color: #8ea5b5; font-size: 11px; }
.pc-metrics span { display: flex; align-items: center; gap: 3px; color: #7890a1; font-size: 7px; white-space: nowrap; }
.pc-metrics svg { width: 9px; height: 9px; color: #1ba36f; }
.pc-insights { display: grid; grid-template-columns: 1.58fr 1fr; gap: 8px; padding: 0 18px 10px; }
.pc-heatmap,.pc-checkpoints { padding: 13px; border: 1px solid #deebf2; border-radius: 14px; background: #fff; }
.pc-heatmap > header,.pc-checkpoints > header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
.pc-heatmap header b,.pc-heatmap header small,.pc-checkpoints header b,.pc-checkpoints header small { display: block; }
.pc-heatmap header b,.pc-checkpoints header b { font: 800 11px Manrope; }
.pc-heatmap header small,.pc-checkpoints header small { margin-top: 2px; color: #7990a1; font-size: 7px; }
.pc-heatmap > header > span { padding: 3px 6px; color: #1680bf; border-radius: 99px; background: #e6f6fd; font-size: 7px; font-weight: 750; }
.heat-grid { display: grid; grid-template-columns: 52px repeat(6,1fr) 28px; align-items: center; gap: 5px 4px; }
.heat-grid > small { color: #9aafbd; font-size: 6px; text-align: center; }
.heat-grid > i { display: block; min-width: 10px; height: 15px; border-radius: 4px; }
.heat-grid > strong { color: var(--n); font: 800 9px Manrope; text-align: right; }
.heat-grid > strong.attention { color: #e18b28; }
.heat-label { overflow: hidden; color: #49667a; font-size: 7px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.heat-label.muted { color: #9aafbd; font-size: 6px; }
.heat-1 { background: #e8f1f6; }
.heat-2 { background: #bfe5f5; }
.heat-3 { background: #70c6e8; }
.heat-4 { background: #27a5dc; }
.heat-5 { background: #1677c8; }
.heat-warn { background: #f4b64e; }
.heat-legend { display: flex; justify-content: space-between; gap: 8px; margin-top: 8px; color: #8095a4; font-size: 6px; }
.heat-legend span { display: flex; align-items: center; gap: 4px; }
.heat-legend i { width: 7px; height: 7px; border-radius: 2px; }
.pc-checkpoints { display: grid; align-content: start; }
.pc-checkpoints > div { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 7px; padding: 7px 0; border-top: 1px solid #ecf3f7; }
.pc-checkpoints > div > span { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 7px; }
.pc-checkpoints > div > span.done { color: #159866; background: #e4f8ef; }
.pc-checkpoints > div > span.focus { color: #d98322; background: #fff0d9; }
.pc-checkpoints svg { width: 11px; height: 11px; }
.pc-checkpoints p b,.pc-checkpoints p small { display: block; }
.pc-checkpoints p b { font-size: 7px; }
.pc-checkpoints p small { color: #8398a7; font-size: 6px; }
.pc-checkpoints > div > strong { color: var(--n); font: 800 8px Manrope; }
.pc-feedback { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 9px; margin: 0 18px 17px; padding: 10px 12px; border: 1px solid #bce4f5; border-radius: 13px; background: linear-gradient(100deg,#eaf8ff,#fff); }
.teacher-avatar { width: 28px; height: 28px; border-radius: 9px; font-size: 8px; }
.pc-feedback b { font-size: 8px; }
.pc-feedback p { max-width: 320px; margin-top: 2px; color: #637c8f; font-size: 7px; line-height: 1.4; }
.feedback-status { display: flex; align-items: center; gap: 4px; color: #168b60; font-size: 6px; font-weight: 750; white-space: nowrap; }
.feedback-status i { width: 6px; height: 6px; border-radius: 50%; background: #22b878; }
@media (max-width: 960px) {
  .proof { grid-template-columns: 1fr; }
  .parent-console { width: min(680px,100%); margin: auto; }
}
@media (max-width: 520px) {
  .parent-console { border-radius: 19px; }
  .pc-toolbar { grid-template-columns: auto 1fr; }
  .pc-toolbar > span { display: none; }
  .pc-metrics { grid-template-columns: repeat(3,1fr); gap: 5px; padding-inline: 10px; }
  .pc-metrics article { padding: 9px 7px; }
  .pc-metrics span { display: none; }
  .pc-insights { grid-template-columns: 1fr; padding-inline: 10px; }
  .pc-profile { padding-inline: 10px; }
  .pc-checkpoints { grid-template-columns: 1fr; }
  .pc-feedback { grid-template-columns: auto 1fr; margin-inline: 10px; }
  .feedback-status { grid-column: 2; }
}

/* Mascot system: one role per decision point */
.mascot-hero {
  position: absolute;
  z-index: 4;
  right: -8px;
  bottom: -36px;
  --mascot-size: 138px;
}
.mascot-hero :deep(figcaption) {
  right: 72%;
  left: auto;
  border-radius: 12px 12px 3px;
}
.ecosystem > .wrap { position: relative; }
.mascot-ecosystem {
  position: absolute;
  z-index: 5;
  top: 72px;
  right: 0;
  --mascot-size: 128px;
}
.mascot-ecosystem :deep(figcaption),
.mascot-support :deep(figcaption) {
  right: 72%;
  left: auto;
  border-radius: 12px 12px 3px;
}
.note {
  grid-template-columns: auto auto 1fr auto;
  padding-block: 13px;
  overflow: visible;
}
.mascot-method {
  align-self: end;
  margin-top: -48px;
  margin-bottom: -13px;
}
.proof-copy { position: relative; padding-bottom: 82px; }
.mascot-progress {
  position: absolute;
  right: 6px;
  bottom: -88px;
  --mascot-size: 148px;
}
.mascot-progress :deep(figcaption) {
  top: 28%;
  right: 72%;
  left: auto;
  max-width: 155px;
  border-radius: 12px 12px 3px;
}
.market-copy { position: relative; padding-right: 62px; }
.mascot-market {
  position: absolute;
  right: -112px;
  bottom: -42px;
  --mascot-size: 150px;
}
.mascot-market :deep(figcaption) { top: 4%; left: 55%; }
.support-head { position: relative; }
.mascot-support {
  position: absolute;
  top: -28px;
  right: -170px;
  --mascot-size: 140px;
}
.trial {
  display: grid;
  grid-template-columns: auto 1fr auto;
  padding-block: 12px;
  overflow: visible;
}
.mascot-plan { margin-block: -46px -12px; }
.process-card {
  display: grid;
  grid-template-columns: .72fr 1fr;
  align-items: end;
  gap: 4px;
  overflow: hidden;
  padding: 24px 28px 0 !important;
}
.process-card > div { align-self: center; padding-bottom: 28px; }
.process-card > div > svg {
  width: 55px;
  height: 55px;
  padding: 15px;
  border-radius: 17px;
  background: #e5f6ff;
  color: var(--b);
}
.mascot-onboarding {
  align-self: end;
  margin-left: -42px;
  --mascot-size: 180px;
}
.mascot-onboarding :deep(figcaption) { top: 5%; left: 58%; }
.faq > div:first-child { position: relative; }
.mascot-faq {
  margin: 12px 0 -76px 42px;
  --mascot-size: 184px;
}
.mascot-final {
  align-self: end;
  justify-self: center;
  width: min(330px, 92%);
  --mascot-size: 100%;
  margin-bottom: -6px;
}
@media (max-width: 1180px) {
  .mascot-ecosystem { right: 20px; --mascot-size: 105px; }
  .mascot-support { right: -110px; --mascot-size: 110px; }
}
@media (max-width: 960px) {
  .mascot-hero { right: 0; }
  .mascot-ecosystem {
    position: relative;
    top: auto;
    right: auto;
    width: 120px;
    margin: -18px auto 6px;
  }
  .mascot-support {
    position: relative;
    top: auto;
    right: auto;
    margin: 20px auto -34px;
  }
  .mascot-support :deep(figcaption) { right: auto; left: 72%; }
  .market-copy { padding-right: 0; }
  .mascot-market { right: 0; }
  .process-card { grid-template-columns: auto 1fr; }
}
@media (max-width: 680px) {
  .mascot-hero { right: -6px; bottom: -18px; --mascot-size: 94px; }
  .mascot-hero :deep(figcaption) { display: none; }
  .note { grid-template-columns: auto 1fr; }
  .note > svg { display: none; }
  .mascot-method { grid-row: 1 / 3; margin-top: -30px; }
  .proof-copy { padding-bottom: 155px; }
  .mascot-progress { right: 18px; bottom: -28px; --mascot-size: 132px; }
  .mascot-progress :deep(figcaption) { right: 62%; }
  .mascot-market {
    position: relative;
    right: auto;
    bottom: auto;
    margin: 20px auto -54px;
  }
  .trial { grid-template-columns: auto 1fr; }
  .trial .btn { grid-column: 1 / -1; }
  .mascot-plan { margin: -30px 0 -8px -12px; }
  .process-card { grid-template-columns: 1fr; padding-inline: 24px !important; }
  .process-card > div { order: -1; padding-bottom: 0; }
  .mascot-onboarding { margin: -30px auto 0; }
  .mascot-faq { margin: 18px auto -55px; }
  .mascot-final { width: 270px; }
}
</style>
