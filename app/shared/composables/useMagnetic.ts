import type { Ref } from 'vue'

/**
 * Magnetic-hover effect — element subtly follows the cursor.
 * Disabled on touch devices and when prefers-reduced-motion.
 *
 * Usage:
 *   const btn = ref<HTMLElement | null>(null)
 *   useMagnetic(btn, { strength: 0.35 })
 *
 * Accepts either an HTMLElement ref OR a Vue component ref (e.g. <NuxtLink>);
 * for components we resolve `.$el` to the underlying DOM root.
 */
type MagneticTarget = HTMLElement | { $el?: HTMLElement } | null

const resolveEl = (val: MagneticTarget): HTMLElement | null => {
  if (!val) return null
  if (val instanceof HTMLElement) return val
  const root = (val as { $el?: unknown }).$el
  return root instanceof HTMLElement ? root : null
}

export function useMagnetic(
  target: Ref<MagneticTarget>,
  options: { strength?: number, radius?: number } = {}
) {
  const { strength = 0.3, radius = 120 } = options

  if (import.meta.server) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isTouch = window.matchMedia('(hover: none)').matches
  if (reduced || isTouch) return

  let frame = 0
  let tx = 0
  let ty = 0

  const onMove = (e: MouseEvent) => {
    const el = resolveEl(target.value)
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const dist = Math.hypot(dx, dy)
    if (dist > radius) {
      tx = 0
      ty = 0
    } else {
      const ratio = (1 - dist / radius) * strength
      tx = dx * ratio
      ty = dy * ratio
    }
    if (!frame) {
      frame = requestAnimationFrame(() => {
        const node = resolveEl(target.value)
        if (node) node.style.transform = `translate3d(${tx}px, ${ty}px, 0)`
        frame = 0
      })
    }
  }

  const reset = () => {
    const el = resolveEl(target.value)
    if (el) el.style.transform = ''
  }

  onMounted(() => {
    window.addEventListener('mousemove', onMove)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('mousemove', onMove)
    if (frame) cancelAnimationFrame(frame)
    reset()
  })
}
