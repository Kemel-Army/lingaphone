/**
 * Plugin: registers v-auto-animate directive globally on both client and server.
 * Client: applies real autoAnimate on mount.
 * Server: no-op (returns empty SSR props) — animation only matters in the browser
 *         but the directive must exist server-side so SSR rendering doesn't crash
 *         on `ssrGetDirectiveProps`.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('auto-animate', {
    async mounted(el, binding) {
      if (import.meta.client) {
        const { autoAnimate } = await import('@formkit/auto-animate')
        autoAnimate(el, binding.value ?? { duration: 250 })
      }
    },
    getSSRProps() {
      return {}
    }
  })
})
