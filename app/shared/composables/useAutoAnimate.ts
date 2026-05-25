import { autoAnimate } from '@formkit/auto-animate'
import type { AutoAnimateOptions } from '@formkit/auto-animate'

/**
 * Shared composable: auto-animate directive for smooth list transitions.
 * Usage: <div v-auto-animate> or <div v-auto-animate="{ duration: 250 }">
 */
export const vAutoAnimate = {
  mounted(el: HTMLElement, binding: { value?: Partial<AutoAnimateOptions> }) {
    autoAnimate(el, binding.value ?? { duration: 250 })
  }
}
