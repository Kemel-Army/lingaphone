import { describe, expect, it } from 'vitest'
import {
  LESSON_TYPES,
  LESSON_TYPE_MAP,
  LESSON_TYPE_OPTIONS,
  type LessonKind
} from '../../app/shared/lib/lessonType'
import { Constants } from '../../app/shared/types/database.types'

describe('LESSON_TYPES (app/shared/lib/lessonType)', () => {
  it('покрывает ровно enum LessonType из БД — без дрейфа', () => {
    // Миграция 20260808200654_lesson_type.sql создаёт этот enum.
    // Если в БД добавят тип, а сюда нет — бейдж отрисуется как undefined.
    const dbValues = [...Constants.public.Enums.LessonType].sort()
    const uiValues = LESSON_TYPES.map(t => t.value).sort()
    expect(uiValues).toEqual(dbValues)
  })

  it('GROUP — это значение по умолчанию в БД и есть в списке', () => {
    expect(LESSON_TYPE_MAP.GROUP).toBeDefined()
    expect(LESSON_TYPE_MAP.GROUP.label).toBe('Групповой урок')
  })

  it('LESSON_TYPE_MAP резолвит каждый тип', () => {
    for (const t of LESSON_TYPES) {
      expect(LESSON_TYPE_MAP[t.value]).toBe(t)
    }
  })

  it('у каждого типа непустые label/shortLabel/icon', () => {
    for (const t of LESSON_TYPES) {
      expect(t.label.length).toBeGreaterThan(0)
      expect(t.shortLabel.length).toBeGreaterThan(0)
      expect(t.icon).toMatch(/^i-lucide-/)
    }
  })

  it('цвета — только из допустимого набора Nuxt UI', () => {
    const allowed = ['neutral', 'info', 'success', 'warning', 'primary']
    for (const t of LESSON_TYPES) {
      expect(allowed).toContain(t.color)
    }
  })

  it('значения и подписи уникальны', () => {
    expect(new Set(LESSON_TYPES.map(t => t.value)).size).toBe(LESSON_TYPES.length)
    expect(new Set(LESSON_TYPES.map(t => t.label)).size).toBe(LESSON_TYPES.length)
  })

  it('LESSON_TYPE_OPTIONS готов для USelect ({label,value})', () => {
    expect(LESSON_TYPE_OPTIONS).toHaveLength(LESSON_TYPES.length)
    for (const o of LESSON_TYPE_OPTIONS) {
      expect(Object.keys(o).sort()).toEqual(['label', 'value'])
      expect(LESSON_TYPE_MAP[o.value as LessonKind]).toBeDefined()
    }
  })
})
