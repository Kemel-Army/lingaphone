import { describe, it, expect, beforeAll } from 'vitest'

/**
 * Маршруты «мотивашки» ходят в базу под service role, поэтому RLS их не
 * прикрывает. Эти тесты держат ручную проверку прав: без неё преподаватель
 * читал бы журнал и бонусы чужого класса, передав его `groupId`.
 */

// createError авто-импортируется Nitro; в юнит-тесте его надо подложить.
beforeAll(() => {
  ;(globalThis as Record<string, unknown>).createError = (opts: { statusCode: number, message: string }) => {
    const err = new Error(opts.message) as Error & { statusCode: number }
    err.statusCode = opts.statusCode
    return err
  }
})

const { resolveTeacherScope, assertGroupInScope } = await import('../../server/utils/teacherScope')

/** Минимальная заглушка supabase-клиента: `.from(t).select().eq().maybeSingle()`. */
const fakeSupabase = (tables: Record<string, unknown>) => ({
  from(table: string) {
    const chain = {
      select: () => chain,
      eq: () => chain,
      maybeSingle: async () => ({ data: tables[table] ?? null }),
      then: undefined as unknown
    }
    // Для `.from('Group').select().eq()` результат ждут без maybeSingle —
    // отдаём массив через await на самой цепочке.
    return {
      select: () => ({
        eq: (..._args: unknown[]) => {
          void _args
          const rows = tables[table]
          return Object.assign(Promise.resolve({ data: rows ?? null }), {
            maybeSingle: async () => ({ data: rows ?? null })
          })
        }
      })
    }
  }
})

describe('resolveTeacherScope', () => {
  it('админу не ставит ограничений', async () => {
    const supabase = fakeSupabase({ User: { id: 'u1', role: 'ADMIN' } })
    const scope = await resolveTeacherScope(supabase, 'auth-1')
    expect(scope.groupIds).toBeNull()
    expect(scope.teacherId).toBeNull()
    expect(scope.userId).toBe('u1')
  })

  it('директору не ставит ограничений', async () => {
    const supabase = fakeSupabase({ User: { id: 'u9', role: 'DIRECTOR' } })
    const scope = await resolveTeacherScope(supabase, 'auth-9')
    expect(scope.groupIds).toBeNull()
  })

  it('преподавателю отдаёт только его группы', async () => {
    const supabase = fakeSupabase({
      User: { id: 'u2', role: 'TEACHER' },
      Teacher: { id: 't1' },
      Group: [{ id: 'g1' }, { id: 'g2' }]
    })
    const scope = await resolveTeacherScope(supabase, 'auth-2')
    expect(scope.groupIds).toEqual(['g1', 'g2'])
    expect(scope.teacherId).toBe('t1')
  })

  it('преподавателю без групп отдаёт пустой список, а не «без ограничений»', async () => {
    const supabase = fakeSupabase({
      User: { id: 'u3', role: 'TEACHER' },
      Teacher: { id: 't2' },
      Group: []
    })
    const scope = await resolveTeacherScope(supabase, 'auth-3')
    expect(scope.groupIds).toEqual([])
    expect(scope.groupIds).not.toBeNull()
  })

  it('падает 403, если пользователя нет', async () => {
    const supabase = fakeSupabase({})
    await expect(resolveTeacherScope(supabase, 'auth-x'))
      .rejects.toMatchObject({ statusCode: 403 })
  })

  it('падает 403, если у TEACHER нет профиля преподавателя', async () => {
    const supabase = fakeSupabase({ User: { id: 'u4', role: 'TEACHER' } })
    await expect(resolveTeacherScope(supabase, 'auth-4'))
      .rejects.toMatchObject({ statusCode: 403 })
  })
})

describe('assertGroupInScope', () => {
  const teacher = { groupIds: ['g1', 'g2'], teacherId: 't1', userId: 'u1' }
  const admin = { groupIds: null, teacherId: null, userId: 'u0' }

  it('пропускает свою группу', () => {
    expect(() => assertGroupInScope(teacher, 'g2')).not.toThrow()
  })

  it('блокирует чужую группу', () => {
    expect(() => assertGroupInScope(teacher, 'g-foreign'))
      .toThrowError(/Нет доступа к этой группе/)
  })

  it('блокирует любую группу, если у преподавателя их нет', () => {
    expect(() => assertGroupInScope({ ...teacher, groupIds: [] }, 'g1')).toThrow()
  })

  it('админа пропускает всегда', () => {
    expect(() => assertGroupInScope(admin, 'любая-группа')).not.toThrow()
  })
})
