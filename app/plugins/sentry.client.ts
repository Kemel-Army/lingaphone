import * as Sentry from '@sentry/vue'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  if (!config.public.sentryDsn) return

  Sentry.init({
    app: nuxtApp.vueApp,
    dsn: config.public.sentryDsn as string,
    environment: import.meta.dev ? 'development' : 'production',
    integrations: [
      Sentry.browserTracingIntegration({
        router: useRouter()
      }),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false })
    ],
    tracesSampleRate: import.meta.dev ? 1.0 : 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0
  })

  // Attach user context when available
  const user = useSupabaseUser()
  if (user.value) {
    Sentry.setUser({
      id: user.value.sub,
      email: user.value.email ?? undefined
    })
  }

  watch(() => user.value?.sub, (sub) => {
    if (sub) {
      Sentry.setUser({ id: sub, email: user.value?.email ?? undefined })
    } else {
      Sentry.setUser(null)
    }
  })
})
