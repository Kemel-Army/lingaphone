export interface WazzupIframeOptions {
  scope: 'global' | 'card'
  chatType?: string
  chatId?: string
}

export interface WazzupIframeResult {
  url: string
  /** false = вошли техническим пользователем без роли в Wazzup. */
  linkedToWazzupUser: boolean
  wazzupUserName: string
}

/** ТЗ разд. 2.1/6 — получить URL встраиваемого чата Wazzup24 (path A). */
export const useWazzupIframe = () => {
  const getUrl = (opts: WazzupIframeOptions) =>
    $fetch<WazzupIframeResult>('/api/wazzup/iframe', { method: 'POST', body: opts })

  return { getUrl }
}
