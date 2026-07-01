<script setup lang="ts">
/**
 * ShareCard — генерирует PNG-карточку прохождения капсулы для шеринга
 * (родителю в Telegram/WhatsApp).
 *
 * Рисуем на canvas без зависимостей: цветной градиент, эмодзи-трофей,
 * процент, имя капсулы, лого FEMO. Кнопка «Скачать» / «Поделиться»
 * (Web Share API если доступен) на готовом dataURL.
 *
 * Размер карточки 1200×630 (OG-friendly), но рисуем компактнее
 * для отображения в UI (canvas масштабируется CSS-ом).
 */
import type { TrophyTier } from '~/entities/learning-path'

const props = defineProps<{
  capsuleName: string
  scorePct: number
  tier: TrophyTier
  studentName?: string
}>()

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const dataUrl = ref<string | null>(null)
const generating = ref(false)

const tierMeta = computed(() => ({
  gold: { color1: '#FBBF24', color2: '#F59E0B', emoji: '🏆', label: 'Золотой трофей' },
  silver: { color1: '#CBD5E1', color2: '#94A3B8', emoji: '🥈', label: 'Серебряный трофей' },
  bronze: { color1: '#FB923C', color2: '#F97316', emoji: '🥉', label: 'Бронзовый трофей' },
  none: { color1: '#7DD3FC', color2: '#0EA5E9', emoji: '💪', label: 'Хорошая попытка' }
}[props.tier]))

const W = 1200
const H = 630

const draw = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Фон-градиент в стиле тира
  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, tierMeta.value.color1)
  grad.addColorStop(1, tierMeta.value.color2)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Декоративные звёзды
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
  for (let i = 0; i < 30; i++) {
    const x = (i * 137) % W
    const y = (i * 73) % H
    const r = 4 + (i % 5) * 2
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Большой эмодзи-трофей по центру слева
  ctx.font = '240px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(tierMeta.value.emoji, 280, H / 2)

  // Текст справа
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'

  // Заголовок
  ctx.font = 'bold 36px system-ui, sans-serif'
  ctx.fillText('Я прошёл капсулу!', 540, 130)

  // Имя капсулы (с переносом для длинных)
  ctx.font = 'bold 56px system-ui, sans-serif'
  const lines = wrapText(ctx, props.capsuleName, W - 580 - 60)
  let y = 220
  for (const line of lines.slice(0, 2)) {
    ctx.fillText(line, 540, y)
    y += 70
  }

  // Score
  ctx.font = 'bold 120px system-ui, sans-serif'
  ctx.fillText(`${props.scorePct}%`, 540, 420)

  // Tier label
  ctx.font = '36px system-ui, sans-serif'
  ctx.fillText(tierMeta.value.label, 540, 500)

  // FEMO логотип (внизу справа)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.font = 'bold 32px system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('FEMO · math', W - 50, H - 40)

  // Имя ученика — внизу слева
  if (props.studentName) {
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.font = '28px system-ui, sans-serif'
    ctx.fillText(props.studentName, 50, H - 40)
  }

  dataUrl.value = canvas.toDataURL('image/png')
}

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    const m = ctx.measureText(test)
    if (m.width > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

onMounted(async () => {
  generating.value = true
  await nextTick()
  draw()
  generating.value = false
})

const handleDownload = () => {
  if (!dataUrl.value) return
  const a = document.createElement('a')
  a.href = dataUrl.value
  a.download = `femo-${props.capsuleName.replace(/\s+/g, '-')}-${props.scorePct}.png`
  a.click()
}

const canShare = computed(() => typeof navigator !== 'undefined' && !!navigator.share)
const handleShare = async () => {
  if (!dataUrl.value || !canShare.value) return
  try {
    const blob = await (await fetch(dataUrl.value)).blob()
    const file = new File([blob], 'femo-result.png', { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: 'FEMO',
        text: `Я прошёл капсулу «${props.capsuleName}» с результатом ${props.scorePct}%!`,
        files: [file]
      })
    } else {
      handleDownload()
    }
  } catch {
    handleDownload()
  }
}
</script>

<template>
  <div class="space-y-3">
    <canvas
      ref="canvas"
      :width="W"
      :height="H"
      class="w-full h-auto rounded-2xl border border-default shadow-md"
    />
    <div class="flex flex-wrap gap-2 justify-end">
      <UButton
        variant="ghost"
        size="sm"
        :disabled="!dataUrl"
        @click="handleDownload"
      >
        <UIcon
          name="i-lucide-download"
          class="size-4"
        />
        Скачать
      </UButton>
      <UButton
        v-if="canShare"
        color="primary"
        size="sm"
        :disabled="!dataUrl"
        @click="handleShare"
      >
        <UIcon
          name="i-lucide-share-2"
          class="size-4"
        />
        Поделиться
      </UButton>
    </div>
  </div>
</template>
