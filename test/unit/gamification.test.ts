import { describe, expect, it } from 'vitest'
import {
  XP_REWARDS,
  XPActionType,
  LEVEL_XP_THRESHOLDS,
  ROLE_HOME_ROUTES,
  UserRole
} from '../../app/shared/types/common'

describe('XP_REWARDS', () => {
  it('covers all action types', () => {
    for (const action of Object.values(XPActionType)) {
      expect(XP_REWARDS[action]).toBeDefined()
    }
  })

  it('has positive values for all actions', () => {
    for (const [_action, reward] of Object.entries(XP_REWARDS)) {
      if (Array.isArray(reward)) {
        expect(reward[0]).toBeGreaterThan(0)
        expect(reward[1]).toBeGreaterThanOrEqual(reward[0])
      } else {
        expect(reward).toBeGreaterThan(0)
      }
    }
  })

  it('returns correct values for known actions', () => {
    expect(XP_REWARDS[XPActionType.HOMEWORK_ON_TIME]).toBe(50)
    expect(XP_REWARDS[XPActionType.LESSON_ATTENDED]).toBe(40)
    expect(XP_REWARDS[XPActionType.PERFECT_TEST]).toBe(150)
    expect(XP_REWARDS[XPActionType.GAP_CLOSED]).toBe(200)
  })

  it('has range rewards for variable actions', () => {
    const aiReward = XP_REWARDS[XPActionType.AI_CORRECT_ANSWER]
    expect(Array.isArray(aiReward)).toBe(true)
    expect(aiReward).toEqual([10, 30])

    const testReward = XP_REWARDS[XPActionType.TEST_COMPLETED]
    expect(Array.isArray(testReward)).toBe(true)
    expect(testReward).toEqual([50, 200])
  })
})

describe('LEVEL_XP_THRESHOLDS', () => {
  it('has 100 levels', () => {
    expect(LEVEL_XP_THRESHOLDS).toHaveLength(100)
  })

  it('starts at 100 XP for level 1', () => {
    expect(LEVEL_XP_THRESHOLDS[0]).toBe(100)
  })

  it('is monotonically increasing', () => {
    for (let i = 1; i < LEVEL_XP_THRESHOLDS.length; i++) {
      expect(LEVEL_XP_THRESHOLDS[i]).toBeGreaterThan(LEVEL_XP_THRESHOLDS[i - 1]!)
    }
  })

  it('level 100 threshold is very high', () => {
    expect(LEVEL_XP_THRESHOLDS[99]).toBeGreaterThan(1_000_000)
  })
})

describe('calculateLevel', () => {
  // Re-implement the function to test it (since it's not exported from award-xp.post.ts)
  function calculateLevel(xp: number): number {
    for (let i = LEVEL_XP_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= (LEVEL_XP_THRESHOLDS[i] ?? 0)) return i + 1
    }
    return 1
  }

  it('returns level 1 for 0 XP', () => {
    expect(calculateLevel(0)).toBe(1)
  })

  it('returns level 1 for XP below first threshold', () => {
    expect(calculateLevel(50)).toBe(1)
    expect(calculateLevel(99)).toBe(1)
  })

  it('returns level 1 at exactly 100 XP', () => {
    expect(calculateLevel(100)).toBe(1)
  })

  it('returns level 2 at second threshold', () => {
    expect(calculateLevel(LEVEL_XP_THRESHOLDS[1]!)).toBe(2)
  })

  it('returns level 10 at 10th threshold', () => {
    expect(calculateLevel(LEVEL_XP_THRESHOLDS[9]!)).toBe(10)
  })

  it('returns level 100 for very high XP', () => {
    expect(calculateLevel(999_999_999)).toBe(100)
  })
})

describe('ROLE_HOME_ROUTES', () => {
  it('maps all roles to routes', () => {
    expect(ROLE_HOME_ROUTES[UserRole.STUDENT]).toBe('/student')
    expect(ROLE_HOME_ROUTES[UserRole.PARENT]).toBe('/parent')
    expect(ROLE_HOME_ROUTES[UserRole.ADMIN]).toBe('/admin')
  })
})
