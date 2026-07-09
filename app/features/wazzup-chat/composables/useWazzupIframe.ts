export interface WazzupIframeOptions {
  scope: 'global' | 'card'
  chatType?: string
  chatId?: string
}

/** ТЗ разд. 2.1/6 — получить URL встраиваемого чата Wazzup24 (path A). */
export const useWazzupIframe = () => {
  const getUrl = (opts: WazzupIframeOptions) =>
    $fetch<{ url: string }>('/api/wazzup/iframe', { method: 'POST', body: opts })

  return { getUrl }
}
