/**
 * Presets for v-motion entrance animations on landing page sections.
 * Usage: v-motion v-bind="motionPresets.fadeUp(delay)"
 */
export const useMotionPresets = () => {
  const fadeUp = (delay = 0, duration = 600) => ({
    initial: { opacity: 0, y: 30 },
    visibleOnce: { opacity: 1, y: 0, transition: { delay, duration, ease: 'easeOut' } }
  })

  const fadeDown = (delay = 0, duration = 600) => ({
    initial: { opacity: 0, y: -20 },
    visibleOnce: { opacity: 1, y: 0, transition: { delay, duration, ease: 'easeOut' } }
  })

  const fadeLeft = (delay = 0, duration = 700) => ({
    initial: { opacity: 0, x: -40 },
    visibleOnce: { opacity: 1, x: 0, transition: { delay, duration, ease: 'easeOut' } }
  })

  const fadeRight = (delay = 0, duration = 700) => ({
    initial: { opacity: 0, x: 40 },
    visibleOnce: { opacity: 1, x: 0, transition: { delay, duration, ease: 'easeOut' } }
  })

  const scaleIn = (delay = 0, duration = 700) => ({
    initial: { opacity: 0, scale: 0.92 },
    visibleOnce: { opacity: 1, scale: 1, transition: { delay, duration, type: 'spring', stiffness: 100, damping: 15 } }
  })

  const popIn = (delay = 0) => ({
    initial: { opacity: 0, scale: 0.8 },
    visibleOnce: { opacity: 1, scale: 1, transition: { delay, duration: 500, type: 'spring', stiffness: 200, damping: 12 } }
  })

  return { fadeUp, fadeDown, fadeLeft, fadeRight, scaleIn, popIn }
}
