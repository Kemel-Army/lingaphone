/**
 * Подключение к видеокомнате урока.
 *
 * Почему это вообще нужно: публичный `meet.jit.si` разрешает встраивание
 * только «для демо» и рвёт звонок через 5 минут («Embedding meet.jit.si is
 * only meant for demo purposes»). Чтобы урок не обрывался, нужен либо JaaS
 * (8x8.vc), либо свой сервер Jitsi — оба требуют JWT.
 *
 * Поддерживаем три конфигурации, выбор автоматический по .env:
 *
 *   1. JaaS (8x8) — JITSI_APP_ID + JITSI_KEY_ID + JITSI_PRIVATE_KEY
 *      domain = 8x8.vc, комната = `<appId>/<room>`, JWT RS256.
 *   2. Свой Jitsi с включённым token-auth — JITSI_DOMAIN + JITSI_APP_ID +
 *      JITSI_APP_SECRET, JWT HS256.
 *   3. Ничего не задано — meet.jit.si без JWT (демо, 5 минут). Отдаём
 *      `limited: true`, чтобы UI честно предупредил.
 */
import { createSign, createHmac } from 'node:crypto'

export interface JitsiIdentity {
  id: string
  name: string
  email?: string | null
  avatar?: string | null
  moderator: boolean
}

export interface JitsiJoinInfo {
  domain: string
  /** Имя комнаты в том виде, в каком его ждёт JitsiMeetExternalAPI. */
  room: string
  jwt: string | null
  /** true = публичный demo-инстанс, звонок оборвётся через 5 минут. */
  limited: boolean
}

const b64url = (input: Buffer | string): string =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const encodeSegment = (obj: Record<string, unknown>) => b64url(JSON.stringify(obj))

const signJwt = (
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  key: string,
  alg: 'RS256' | 'HS256'
): string => {
  const body = `${encodeSegment({ ...header, alg, typ: 'JWT' })}.${encodeSegment(payload)}`
  if (alg === 'RS256') {
    const signer = createSign('RSA-SHA256')
    signer.update(body)
    signer.end()
    return `${body}.${b64url(signer.sign(key))}`
  }
  return `${body}.${b64url(createHmac('sha256', key).update(body).digest())}`
}

/** `\n` внутри .env приезжает экранированным — приводим PEM к рабочему виду. */
const normalizePem = (raw: string) => raw.replace(/\\n/g, '\n').trim()

/** Детерминированное имя комнаты урока — совпадает на всех клиентах. */
export const lessonRoomName = (lessonId: string) => `lingaphone-${lessonId}`

/**
 * Собирает параметры входа в комнату. `ttlMinutes` ограничивает срок жизни
 * токена: гостевые ссылки живут ровно столько, сколько идёт урок.
 */
export const buildJitsiJoin = (
  room: string,
  identity: JitsiIdentity,
  ttlMinutes = 180
): JitsiJoinInfo => {
  const config = useRuntimeConfig()
  const appId = (config.jitsiAppId as string) || ''
  const keyId = (config.jitsiKeyId as string) || ''
  const privateKey = (config.jitsiPrivateKey as string) || ''
  const appSecret = (config.jitsiAppSecret as string) || ''
  const configuredDomain = (config.public.jitsiDomain as string) || 'meet.jit.si'

  const now = Math.floor(Date.now() / 1000)
  const exp = now + ttlMinutes * 60

  const context = {
    user: {
      id: identity.id,
      name: identity.name,
      email: identity.email ?? undefined,
      avatar: identity.avatar ?? undefined,
      moderator: identity.moderator ? 'true' : 'false'
    },
    features: {
      'livestreaming': 'false',
      'recording': identity.moderator ? 'true' : 'false',
      'transcription': 'false',
      'outbound-call': 'false'
    }
  }

  // ── 1. JaaS ───────────────────────────────────────────────────────────────
  if (appId && keyId && privateKey) {
    const jwt = signJwt(
      { kid: keyId },
      {
        aud: 'jitsi',
        iss: 'chat',
        sub: appId,
        room,
        exp,
        nbf: now - 10,
        context
      },
      normalizePem(privateKey),
      'RS256'
    )
    return { domain: '8x8.vc', room: `${appId}/${room}`, jwt, limited: false }
  }

  // ── 2. Свой Jitsi с token-auth ────────────────────────────────────────────
  if (appId && appSecret && configuredDomain !== 'meet.jit.si') {
    const jwt = signJwt(
      {},
      {
        aud: 'jitsi',
        iss: appId,
        sub: configuredDomain,
        room,
        exp,
        nbf: now - 10,
        context
      },
      appSecret,
      'HS256'
    )
    return { domain: configuredDomain, room, jwt, limited: false }
  }

  // ── 3. Публичный инстанс ──────────────────────────────────────────────────
  return {
    domain: configuredDomain,
    room,
    jwt: null,
    limited: configuredDomain === 'meet.jit.si'
  }
}
