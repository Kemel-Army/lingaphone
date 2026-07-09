import { describe, expect, it } from 'vitest'
import { branchToId, ALL_BRANCHES } from '../../app/features/director-stats/composables/useDirector'

describe('branchToId (свитчер филиалов, ТЗ 8)', () => {
  it('сентинел «все» => null', () => {
    expect(branchToId(ALL_BRANCHES)).toBeNull()
  })
  it('пусто/undefined => null', () => {
    expect(branchToId('')).toBeNull()
    expect(branchToId(null)).toBeNull()
    expect(branchToId(undefined)).toBeNull()
  })
  it('реальный id проходит как есть', () => {
    expect(branchToId('10647122-5ae4-40c4-926b-825573c01a65')).toBe('10647122-5ae4-40c4-926b-825573c01a65')
  })
  it('сентинел непустой (Reka UI требование)', () => {
    expect(ALL_BRANCHES).not.toBe('')
    expect(ALL_BRANCHES.length).toBeGreaterThan(0)
  })
})
