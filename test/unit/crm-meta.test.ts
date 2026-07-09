import { describe, expect, it } from 'vitest'
import {
  LEAD_STAGES,
  LEAD_STAGE_MAP,
  LEAD_SOURCES,
  LEAD_SOURCE_MAP
} from '../../app/entities/lead/model/types'
import {
  computeEffectiveStatus,
  TASK_STATUS_MAP,
  TASK_STATUSES
} from '../../app/entities/task/model/types'
import {
  SUBSCRIPTION_STATUS_MAP,
  PAYMENT_STATUS_MAP,
  PAYMENT_METHOD_MAP,
  PAYMENT_METHODS
} from '../../app/entities/finance/model/types'

describe('воронка лидов (ТЗ 2.3)', () => {
  it('12 этапов, начинается NEW, заканчивается ACTIVE', () => {
    expect(LEAD_STAGES.length).toBe(12)
    expect(LEAD_STAGES[0]!.value).toBe('NEW')
    expect(LEAD_STAGES.at(-1)!.value).toBe('ACTIVE')
  })
  it('у каждого этапа/источника есть мета', () => {
    for (const s of LEAD_STAGES) expect(LEAD_STAGE_MAP[s.value]).toBe(s)
    for (const s of LEAD_SOURCES) expect(LEAD_SOURCE_MAP[s.value]).toBe(s)
  })
})

describe('computeEffectiveStatus (просрочка задач, ТЗ 2.4)', () => {
  const past = '2000-01-01T00:00:00.000Z'
  it('DONE остаётся DONE даже при истёкшем сроке', () => {
    expect(computeEffectiveStatus({ status: 'DONE', dueAt: past })).toBe('DONE')
  })
  it('истёкший срок + не завершена => OVERDUE', () => {
    expect(computeEffectiveStatus({ status: 'NEW', dueAt: past })).toBe('OVERDUE')
    expect(computeEffectiveStatus({ status: 'IN_PROGRESS', dueAt: past })).toBe('OVERDUE')
  })
  it('будущий срок сохраняет статус', () => {
    const future = new Date(Date.now() + 86400000).toISOString()
    expect(computeEffectiveStatus({ status: 'NEW', dueAt: future })).toBe('NEW')
  })
  it('без срока сохраняет статус', () => {
    expect(computeEffectiveStatus({ status: 'IN_PROGRESS', dueAt: null })).toBe('IN_PROGRESS')
  })
  it('4 статуса задач с метой', () => {
    expect(TASK_STATUSES.length).toBe(4)
    for (const s of TASK_STATUSES) expect(TASK_STATUS_MAP[s.value]).toBe(s)
  })
})

describe('финансовые меты (ТЗ 2.6)', () => {
  it('способы оплаты полны', () => {
    for (const m of PAYMENT_METHODS) expect(PAYMENT_METHOD_MAP[m.value]).toBe(m)
  })
  it('цвета статусов', () => {
    expect(SUBSCRIPTION_STATUS_MAP.ACTIVE.color).toBe('success')
    expect(SUBSCRIPTION_STATUS_MAP.CANCELLED.color).toBe('error')
    expect(PAYMENT_STATUS_MAP.COMPLETED.color).toBe('success')
    expect(PAYMENT_STATUS_MAP.FAILED.color).toBe('error')
  })
})
