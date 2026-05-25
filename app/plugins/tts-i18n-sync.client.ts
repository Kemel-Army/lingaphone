/**
 * Синхронизирует язык TTS-голоса с активной i18n-локалью.
 *
 * Когда родитель/ребёнок переключает язык интерфейса (ru ↔ kz),
 * автоматически меняем preferredLang в useTTS, чтобы prompt'ы
 * читались голосом на правильном языке.
 *
 * Plugin запускается только на клиенте — Web Speech API серверу не нужен.
 */
import { useTTS } from '~/shared/composables/useTTS'

export default defineNuxtPlugin(() => {
  const nuxtApp = useNuxtApp()
  // @nuxtjs/i18n инжектит $i18n в context приложения
  const i18n = nuxtApp.$i18n as { locale: { value: string } } | undefined
  if (!i18n) return

  const { setLang } = useTTS()

  // Стартовая локаль
  setLang(i18n.locale.value)

  // Реактивно следим за переключениями локали
  watch(() => i18n.locale.value, (next) => {
    setLang(next)
  })
})
