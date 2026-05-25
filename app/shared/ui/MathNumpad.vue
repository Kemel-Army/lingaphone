<script setup lang="ts">
/**
 * MathNumpad — Красивый калькулятор для математического ввода.
 * Используется для вопросов типа "ввод ответа" (умножение, сложение и т.д.)
 * Идеально подходит для детей — большие кнопки, анимации, зелёная тема FEMO.
 */

const props = withDefaults(defineProps<{
  modelValue: string
  expression?: string // Например: "7 × 8 ="
  maxLength?: number
  disabled?: boolean
  showExpression?: boolean
  allowFraction?: boolean
  allowDecimal?: boolean
  allowNegative?: boolean
}>(), {
  maxLength: 12,
  disabled: false,
  showExpression: true,
  allowFraction: true,
  allowDecimal: true,
  allowNegative: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'submit': []
}>()

const currentValue = computed(() => typeof props.modelValue === 'string' ? props.modelValue : '')

const mathKeys = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['0', '/', '.'],
  ['-', '⌫', '✓']
]

const numericKeys = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['0', '⌫', '✓']
]

const keys = computed(() => {
  if (props.allowFraction || props.allowDecimal || props.allowNegative) return mathKeys
  return numericKeys
})

const canSubmit = computed(() => {
  const v = currentValue.value.trim()
  if (!v.length) return false
  if (v === '-' || v === '/' || v === '.' || v === '-.' || v === '-/' || v.endsWith('/') || v.endsWith('.')) return false
  return true
})
const normalizedExpression = computed(() => {
  if (!props.expression) return ''

  return props.expression
    .replace(/\$/g, '')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\div/g, '÷')
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2')
    .replace(/\\left|\\right/g, '')
    .replace(/\\/g, '')
    .replace(/\s+/g, ' ')
    .trim()
})

const sanitizeValue = (raw: string) => {
  let value = raw.replace(/\s+/g, '').replace(/,/g, '.').replace(/[^\d./-]/g, '')

  if (!props.allowNegative) {
    value = value.replace(/-/g, '')
  } else {
    const negative = value.startsWith('-')
    value = `${negative ? '-' : ''}${value.slice(negative ? 1 : 0).replace(/-/g, '')}`
  }

  if (!props.allowFraction) {
    value = value.replace(/\//g, '')
  } else {
    const [firstPart = '', ...restParts] = value.split('/')
    value = firstPart + (restParts.length ? `/${restParts.join('').replace(/\//g, '')}` : '')
  }

  if (!props.allowDecimal) {
    value = value.replace(/\./g, '')
  } else {
    value = value
      .split('/')
      .map((part) => {
        const negative = part.startsWith('-')
        const body = negative ? part.slice(1) : part
        const [whole = '', ...decimals] = body.split('.')
        return `${negative ? '-' : ''}${whole}${decimals.length ? `.${decimals.join('')}` : ''}`
      })
      .join('/')
  }

  return value.slice(0, props.maxLength)
}

const handleManualInput = (event: Event) => {
  const nextValue = sanitizeValue((event.target as HTMLInputElement).value)
  emit('update:modelValue', nextValue)
}

const submitFromInput = () => {
  if (canSubmit.value) emit('submit')
}

const canAppend = (next: string) => (currentValue.value + next).length <= props.maxLength

const appendDecimal = () => {
  if (!props.allowDecimal) return
  const activePart = currentValue.value.split('/').at(-1) ?? ''
  if (activePart.includes('.')) return
  const needsLeadingZero = activePart === '' || activePart === '-'
  const token = needsLeadingZero ? '0.' : '.'
  if (!canAppend(token)) return
  emit('update:modelValue', currentValue.value + token)
}

const appendFraction = () => {
  if (!props.allowFraction) return
  const v = currentValue.value
  if (!v || v.includes('/') || v.endsWith('/') || v.endsWith('.') || v === '-') return
  if (!canAppend('/')) return
  emit('update:modelValue', `${v}/`)
}

const toggleNegative = () => {
  if (!props.allowNegative) return
  const v = currentValue.value
  if (v.startsWith('-')) emit('update:modelValue', v.slice(1))
  else if (canAppend('-')) emit('update:modelValue', `-${v}`)
}

// Нажатие кнопки
const pressKey = (key: string) => {
  if (props.disabled) return

  if (key === '⌫') {
    emit('update:modelValue', currentValue.value.slice(0, -1))
  } else if (key === '✓') {
    if (canSubmit.value) emit('submit')
  } else if (key === '.') {
    appendDecimal()
  } else if (key === '/') {
    appendFraction()
  } else if (key === '-') {
    toggleNegative()
  } else {
    if (currentValue.value.length < props.maxLength && key >= '0' && key <= '9') {
      emit('update:modelValue', currentValue.value + key)
    }
  }
}

// Клавиатура с клавиатуры (keyboard)
const isTextEntryTarget = (target: EventTarget | null) => target instanceof HTMLElement
  && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

const handleKeydown = (e: KeyboardEvent) => {
  if (props.disabled) return
  if (isTextEntryTarget(e.target)) return
  if (e.key >= '0' && e.key <= '9') pressKey(e.key)
  else if (e.key === 'Backspace') pressKey('⌫')
  else if (e.key === '.' || e.key === ',') pressKey('.')
  else if (e.key === '/') pressKey('/')
  else if (e.key === '-') pressKey('-')
  else if (e.key === 'Enter') pressKey('✓')
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))

// Анимация кнопки при нажатии
const pressedKey = ref<string | null>(null)
const animateKey = (key: string) => {
  pressedKey.value = key
  setTimeout(() => {
    pressedKey.value = null
  }, 150)
  pressKey(key)
}
</script>

<template>
  <div class="math-numpad select-none">
    <!-- Дисплей -->
    <div class="math-display mb-4 rounded-2xl border-2 border-primary/30 bg-linear-to-b from-primary/5 to-primary/10 p-4">
      <!-- Выражение (например: 7 × 8 =) -->
      <div
        v-if="showExpression && normalizedExpression"
        class="mb-3 text-center text-base font-semibold text-muted"
      >
        {{ normalizedExpression }}
      </div>

      <!-- Поле ответа -->
      <div class="flex items-center justify-center gap-2">
        <div class="w-full max-w-56">
          <input
            :value="currentValue"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            spellcheck="false"
            :disabled="disabled"
            placeholder="Введи ответ"
            class="w-full rounded-xl border-2 px-5 py-3 text-center text-3xl font-black tabular-nums transition-all duration-200 outline-none sm:text-4xl placeholder:text-base placeholder:font-medium"
            :class="[
              currentValue
                ? 'border-primary bg-white text-primary shadow-lg shadow-primary/20 dark:bg-gray-900'
                : 'border-dashed border-primary/40 bg-transparent text-primary/70 placeholder:text-primary/30'
            ]"
            @input="handleManualInput"
            @keydown.enter.prevent="submitFromInput"
          >
        </div>
      </div>

      <!-- Подсказка -->
      <p class="mt-2 text-center text-xs text-muted">
        {{ currentValue ? 'Нажми ✓ или Enter' : 'Введи ответ или используй кнопки ниже' }}
      </p>
    </div>

    <!-- Клавиши -->
    <div class="grid gap-3">
      <div
        v-for="(row, ri) in keys"
        :key="ri"
        class="grid grid-cols-3 gap-3"
      >
        <button
          v-for="key in row"
          :key="key"
          class="numpad-key rounded-2xl border-2 py-4 text-2xl font-bold transition-all duration-150 active:scale-95"
          :class="[
            key === '✓'
              ? 'border-primary bg-primary text-white shadow-md shadow-primary/30 hover:bg-primary/90 disabled:opacity-50'
              : key === '⌫'
                ? 'border-red-400/40 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50'
                : key === '/' || key === '.' || key === '-'
                  ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 dark:border-primary/40'
                  : 'border-gray-200 bg-white text-gray-800 hover:border-primary/50 hover:bg-primary/5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-primary/10',
            pressedKey === key ? 'scale-90 opacity-80' : '',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          ]"
          :disabled="disabled || (key === '✓' && !canSubmit)"
          @click="animateKey(key)"
        >
          <span v-if="key === '⌫'">
            <UIcon
              name="i-lucide-delete"
              class="size-6 mx-auto"
            />
          </span>
          <span v-else-if="key === '✓'">
            <UIcon
              name="i-lucide-check"
              class="size-6 mx-auto"
            />
          </span>
          <span v-else>{{ key }}</span>
        </button>
      </div>
    </div>

    <!-- Подсказка про клавиатуру -->
    <p class="mt-3 text-center text-xs text-dimmed">
      Можно набирать с клавиатуры: цифры, -, /, .
    </p>
  </div>
</template>

<style scoped>
.numpad-key {
  box-shadow: 0 4px 0 rgb(0 0 0 / 0.08);
}
.numpad-key:active {
  box-shadow: 0 1px 0 rgb(0 0 0 / 0.08);
  transform: translateY(3px);
}
.math-display {
  box-shadow: inset 0 2px 8px rgb(0 0 0 / 0.06);
}
</style>
