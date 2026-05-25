import type { Ref } from 'vue'

/**
 * 3D-tilt effect on hover.
 * Disabled on touch / reduced-motion.
 */
export function useTilt(
  target: Ref<HTMLElement | null>,
  options: { max?: number, perspective?: number, scale?: number, glare?: boolean } = {}
) {
  const { max = 8, perspective = 1000, scale = 1.02, glare = false } = options

  if (import.meta.server) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isTouch = window.matchMedia('(hover: none)').matches
  if (reduced || isTouch) return

  let frame = 0
  let glareEl: HTMLElement | null = null

  const onMove = (e: MouseEvent) => {
    const el = target.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    const rx = (py - 0.5) * -2 * max
    const ry = (px - 0.5) * 2 * max

    if (frame) return
    frame = requestAnimationFrame(() => {
      if (el) {
        el.style.transform = `perspective(${perspective}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`
      }
      if (glareEl) {
        glareEl.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.55), transparent 60%)`
      }
      frame = 0
    })
  }

  const onLeave = () => {
    const el = target.value
    if (el) el.style.transform = ''
    if (glareEl) glareEl.style.background = 'transparent'
  }

  onMounted(() => {
    const el = target.value
    if (!el) return
    el.style.transformStyle = 'preserve-3d'
    el.style.willChange = 'transform'
    if (glare) {
      glareEl = document.createElement('span')
      Object.assign(glareEl.style, {
        position: 'absolute',
        inset: '0',
        borderRadius: 'inherit',
        pointerEvents: 'none',
        transition: 'background 0.2s ease'
      })
      el.appendChild(glareEl)
    }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
  })

  onBeforeUnmount(() => {
    const el = target.value
    if (el) {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
    if (glareEl?.parentNode) glareEl.parentNode.removeChild(glareEl)
    if (frame) cancelAnimationFrame(frame)
  })
}
