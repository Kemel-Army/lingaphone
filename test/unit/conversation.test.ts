import { describe, expect, it } from 'vitest'
import {
  buildUserMap,
  buildGroupNameMap,
  otherParticipants,
  conversationTitle,
  conversationSubtitle,
  conversationInitials
} from '../../app/entities/conversation/composables/useMessenger'
import type { ConversationRow, ConversationParticipant } from '../../app/entities/conversation/model/types'

const ME = 'u-me'
const TEACHER = 'u-teacher'
const S1 = 'u-s1'
const S2 = 'u-s2'

const users: ConversationParticipant[] = [
  { id: ME, name: 'Рахмат', surname: 'Кенжебаев', role: 'STUDENT', avatarUrl: null },
  { id: TEACHER, name: 'Teacher', surname: 'Lingafon', role: 'TEACHER', avatarUrl: null },
  { id: S1, name: 'Iskander', surname: 'Sugurbekov', role: 'STUDENT', avatarUrl: null },
  { id: S2, name: 'Student', surname: 'Lingafon', role: 'STUDENT', avatarUrl: null }
]
const userById = buildUserMap(users)
const groupNameById = buildGroupNameMap([{ id: 'g1', name: 'тестовая группа 123' }])

const conv = (over: Partial<ConversationRow>): ConversationRow => ({
  id: 'c1',
  kind: 'DIRECT',
  groupId: null,
  participantIds: [ME, TEACHER],
  createdAt: '2026-08-09T00:00:00Z',
  updatedAt: '2026-08-09T00:00:00Z',
  ...over
} as ConversationRow)

describe('buildUserMap / buildGroupNameMap', () => {
  it('индексирует пользователей по id', () => {
    expect(userById.get(TEACHER)?.surname).toBe('Lingafon')
    expect(userById.size).toBe(4)
  })

  it('индексирует названия групп по id', () => {
    expect(groupNameById.get('g1')).toBe('тестовая группа 123')
  })

  it('переваривает пустые массивы', () => {
    expect(buildUserMap([]).size).toBe(0)
    expect(buildGroupNameMap([]).size).toBe(0)
  })
})

describe('otherParticipants', () => {
  it('исключает текущего пользователя', () => {
    const out = otherParticipants(conv({}), userById, ME)
    expect(out.map(u => u.id)).toEqual([TEACHER])
  })

  it('для группы возвращает всех, кроме себя', () => {
    const c = conv({ kind: 'GROUP', groupId: 'g1', participantIds: [TEACHER, ME, S1, S2] })
    expect(otherParticipants(c, userById, ME).map(u => u.id)).toEqual([TEACHER, S1, S2])
  })

  it('пропускает id, которых нет в userById (скрыты RLS)', () => {
    const c = conv({ participantIds: [ME, 'u-hidden'] })
    expect(otherParticipants(c, userById, ME)).toEqual([])
  })
})

describe('conversationTitle', () => {
  it('GROUP → название группы', () => {
    const c = conv({ kind: 'GROUP', groupId: 'g1', participantIds: [TEACHER, ME] })
    expect(conversationTitle(c, userById, groupNameById, ME)).toBe('тестовая группа 123')
  })

  it('GROUP без резолва имени → «Групповой чат»', () => {
    const c = conv({ kind: 'GROUP', groupId: 'g-unknown', participantIds: [TEACHER, ME] })
    expect(conversationTitle(c, userById, groupNameById, ME)).toBe('Групповой чат')
  })

  it('DIRECT → имя собеседника', () => {
    expect(conversationTitle(conv({}), userById, groupNameById, ME)).toBe('Teacher Lingafon')
  })

  it('DIRECT со скрытым RLS собеседником → «Собеседник недоступен», а не пустота', () => {
    const c = conv({ participantIds: [ME, 'u-hidden'] })
    expect(conversationTitle(c, userById, groupNameById, ME)).toBe('Собеседник недоступен')
  })

  it('DIRECT сам с собой (вырожденный случай) → «Чат»', () => {
    const c = conv({ participantIds: [ME] })
    expect(conversationTitle(c, userById, groupNameById, ME)).toBe('Чат')
  })
})

describe('conversationSubtitle', () => {
  it('GROUP → педагог + число учеников', () => {
    const c = conv({ kind: 'GROUP', groupId: 'g1', participantIds: [TEACHER, ME, S1, S2] })
    expect(conversationSubtitle(c, userById, ME)).toBe('Teacher Lingafon + 2 уч.')
  })

  it('GROUP без педагога → просто число участников', () => {
    const c = conv({ kind: 'GROUP', groupId: 'g1', participantIds: [ME, S1, S2] })
    expect(conversationSubtitle(c, userById, ME)).toBe('2 участников')
  })

  it('DIRECT → русская подпись роли', () => {
    expect(conversationSubtitle(conv({}), userById, ME)).toBe('Педагог')
  })

  it('роль TUTOR (легаси) не имеет подписи и отдаётся как есть', () => {
    const map = buildUserMap([{ id: 'u-x', name: 'A', surname: 'B', role: 'TUTOR', avatarUrl: null }])
    const c = conv({ participantIds: [ME, 'u-x'] })
    expect(conversationSubtitle(c, map, ME)).toBe('TUTOR')
  })

  it('DIRECT со скрытым собеседником → «Профиль недоступен»', () => {
    const c = conv({ participantIds: [ME, 'u-hidden'] })
    expect(conversationSubtitle(c, userById, ME)).toBe('Профиль недоступен')
  })
})

describe('conversationInitials', () => {
  it('GROUP → две первые буквы названия группы', () => {
    const c = conv({ kind: 'GROUP', groupId: 'g1', participantIds: [TEACHER, ME] })
    expect(conversationInitials(c, userById, groupNameById, ME)).toBe('ТЕ')
  })

  it('GROUP без названия → «ГЧ»', () => {
    const c = conv({ kind: 'GROUP', groupId: 'g-unknown', participantIds: [TEACHER, ME] })
    expect(conversationInitials(c, userById, groupNameById, ME)).toBe('ГЧ')
  })

  it('DIRECT → инициалы собеседника', () => {
    expect(conversationInitials(conv({}), userById, groupNameById, ME)).toBe('TL')
  })

  it('нерезолвнутый собеседник → «?»', () => {
    const c = conv({ participantIds: [ME, 'u-hidden'] })
    expect(conversationInitials(c, userById, groupNameById, ME)).toBe('?')
  })
})
