<script setup lang="ts">
/**
 * KidSafeBox — универсальная безопасная обёртка для контента в капсулах
 * 2-го класса. Гарантирует, что любой текст / число / KaTeX-формула не
 * вылезет за границы родителя.
 *
 * Применять во всех 11 слоях вокруг блоков с пользовательским контентом
 * (заголовки, плитки с цифрами, формулы, чанки prose, опции выбора).
 *
 * Variants:
 *   `prose`  — текстовый контент: безопасный wrap слов и переноса.
 *   `tile`   — фиксированный квадрат: цифра в плитке, авто-fit шрифта через
 *              container queries (см. main.css `[data-tile]`).
 *   `formula` — KaTeX блок: горизонтальный скролл при переполнении.
 *   `option` — пилюля выбора: ограничивает строки, не вылазит.
 *
 * Использование:
 *   <KidSafeBox variant="tile">{{ rows * cols }}</KidSafeBox>
 *   <KidSafeBox variant="prose"><p v-html="text" /></KidSafeBox>
 *   <KidSafeBox variant="formula"><div v-html="renderMath(latex)" /></KidSafeBox>
 */

const props = withDefaults(defineProps<{
  variant?: 'prose' | 'tile' | 'formula' | 'option' | 'plain'
  /** Максимум строк (для `option` и `prose`) */
  lines?: number
  /** Тег корневого элемента */
  as?: string
}>(), {
  variant: 'plain',
  lines: 0,
  as: 'div'
})

const dataAttrs = computed(() => {
  const out: Record<string, string> = {}
  if (props.variant === 'tile') out['data-tile'] = ''
  if (props.variant === 'formula') out['data-formula'] = ''
  if (props.variant === 'option') out['data-option'] = ''
  if (props.variant === 'prose') out['data-prose'] = ''
  return out
})

const lineClampStyle = computed(() => {
  if (!props.lines) return null
  return {
    display: '-webkit-box',
    WebkitLineClamp: String(props.lines),
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  } as Record<string, string>
})
</script>

<template>
  <component
    :is="as"
    class="kid-safe"
    :class="[`kid-safe--${variant}`]"
    :style="lineClampStyle"
    v-bind="dataAttrs"
  >
    <slot />
  </component>
</template>

<style scoped>
.kid-safe {
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.kid-safe--prose {
  hyphens: auto;
}

.kid-safe--tile {
  /* Контейнер-шрифт автоматически масштабируется через container queries */
  container-type: inline-size;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  text-align: center;
  line-height: 1;
}

.kid-safe--tile :deep(*) {
  font-size: clamp(0.875rem, 18cqi, 2.75rem);
  line-height: 1;
}

.kid-safe--formula {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.kid-safe--formula :deep(.katex-display) {
  margin: 0;
  max-width: 100%;
  overflow-x: auto;
}

.kid-safe--option {
  display: inline-flex;
  align-items: center;
  flex: 1 1 auto;
}
</style>
