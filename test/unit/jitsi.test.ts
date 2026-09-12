import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { generateKeyPairSync, createVerify, createHmac } from 'node:crypto'

/**
 * JWT для Jitsi — это пропуск в комнату урока: в нём лежит признак модератора
 * и срок жизни гостевой ссылки. Тесты держат форму токена и, главное, то, что
 * подпись действительно проверяется ключом, а не просто «какая-то строка».
 */

let runtimeConfig: Record<string, unknown> = {}

beforeAll(() => {
  ;(globalThis as Record<string, unknown>).useRuntimeConfig = () => runtimeConfig
})

afterEach(() => {
  runtimeConfig = {}
})

const { buildJitsiJoin, lessonRoomName } = await import('../../server/utils/jitsi')

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
})

const decode = (segment: string) =>
  JSON.parse(Buffer.from(segment.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString())

const teacher = { id: 'u1', name: 'Анель Киясбек', moderator: true }
const guest = { id: 'guest-1', name: 'Гость', moderator: false }

describe('lessonRoomName', () => {
  it('детерминирован — все участники попадают в одну комнату', () => {
    expect(lessonRoomName('abc')).toBe('lingaphone-abc')
    expect(lessonRoomName('abc')).toBe(lessonRoomName('abc'))
  })
})

describe('buildJitsiJoin — публичный meet.jit.si', () => {
  it('без ключей не выдаёт токен и честно помечает демо-режим', () => {
    runtimeConfig = { public: {} }
    const join = buildJitsiJoin('room-1', teacher)
    expect(join.domain).toBe('meet.jit.si')
    expect(join.jwt).toBeNull()
    expect(join.limited).toBe(true)
  })

  it('свой домен без ключей демо-режимом не считается', () => {
    runtimeConfig = { public: { jitsiDomain: 'meet.lingaphone.kz' } }
    const join = buildJitsiJoin('room-1', teacher)
    expect(join.domain).toBe('meet.lingaphone.kz')
    expect(join.limited).toBe(false)
  })
})

describe('buildJitsiJoin — JaaS (8x8)', () => {
  const jaasConfig = () => ({
    jitsiAppId: 'vpaas-magic-cookie-abc',
    jitsiKeyId: 'vpaas-magic-cookie-abc/kid1',
    jitsiPrivateKey: privateKey,
    public: {}
  })

  it('переключает домен и префиксует комнату appId', () => {
    runtimeConfig = jaasConfig()
    const join = buildJitsiJoin('room-1', teacher)
    expect(join.domain).toBe('8x8.vc')
    expect(join.room).toBe('vpaas-magic-cookie-abc/room-1')
    expect(join.limited).toBe(false)
  })

  it('подписывает RS256 подписью, которую проверяет публичный ключ', () => {
    runtimeConfig = jaasConfig()
    const { jwt } = buildJitsiJoin('room-1', teacher)
    expect(jwt).toBeTruthy()

    const [h, p, s] = jwt!.split('.')
    const verifier = createVerify('RSA-SHA256')
    verifier.update(`${h}.${p}`)
    verifier.end()
    const sig = Buffer.from(s!.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
    expect(verifier.verify(publicKey, sig)).toBe(true)
  })

  it('кладёт kid в заголовок и appId в sub', () => {
    runtimeConfig = jaasConfig()
    const { jwt } = buildJitsiJoin('room-1', teacher)
    const [h, p] = jwt!.split('.')
    expect(decode(h!)).toMatchObject({ alg: 'RS256', typ: 'JWT', kid: 'vpaas-magic-cookie-abc/kid1' })
    expect(decode(p!)).toMatchObject({ aud: 'jitsi', iss: 'chat', sub: 'vpaas-magic-cookie-abc', room: 'room-1' })
  })

  it('модератором делает только того, кому это положено', () => {
    runtimeConfig = jaasConfig()
    const asTeacher = decode(buildJitsiJoin('r', teacher).jwt!.split('.')[1]!)
    const asGuest = decode(buildJitsiJoin('r', guest).jwt!.split('.')[1]!)
    expect(asTeacher.context.user.moderator).toBe('true')
    expect(asGuest.context.user.moderator).toBe('false')
    // Гость не должен уметь запускать запись урока.
    expect(asGuest.context.features.recording).toBe('false')
  })

  it('ограничивает срок жизни токена переданным ttl', () => {
    runtimeConfig = jaasConfig()
    const now = Math.floor(Date.now() / 1000)
    const payload = decode(buildJitsiJoin('r', guest, 45).jwt!.split('.')[1]!)
    expect(payload.exp - now).toBeGreaterThan(45 * 60 - 5)
    expect(payload.exp - now).toBeLessThan(45 * 60 + 5)
    expect(payload.nbf).toBeLessThanOrEqual(now)
  })

  it('разбирает PEM с экранированными переводами строк из .env', () => {
    runtimeConfig = { ...jaasConfig(), jitsiPrivateKey: privateKey.replace(/\n/g, '\\n') }
    expect(() => buildJitsiJoin('r', teacher)).not.toThrow()
    expect(buildJitsiJoin('r', teacher).jwt).toBeTruthy()
  })
})

describe('buildJitsiJoin — свой сервер с token-auth', () => {
  const selfHosted = {
    jitsiAppId: 'lingaphone',
    jitsiAppSecret: 'super-secret',
    public: { jitsiDomain: 'meet.lingaphone.kz' }
  }

  it('подписывает HS256 общим секретом', () => {
    runtimeConfig = selfHosted
    const { jwt, domain, room } = buildJitsiJoin('room-9', teacher)
    expect(domain).toBe('meet.lingaphone.kz')
    expect(room).toBe('room-9')

    const [h, p, s] = jwt!.split('.')
    expect(decode(h!).alg).toBe('HS256')
    const expected = createHmac('sha256', 'super-secret')
      .update(`${h}.${p}`)
      .digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(s).toBe(expected)
  })

  it('на meet.jit.si секрет не применяет — там он всё равно не работает', () => {
    runtimeConfig = { ...selfHosted, public: { jitsiDomain: 'meet.jit.si' } }
    const join = buildJitsiJoin('room-9', teacher)
    expect(join.jwt).toBeNull()
    expect(join.limited).toBe(true)
  })
})
