import { describe, expect, it } from 'vitest'
import { normalizeSchedule } from '../../app/shared/lib/schedule'

describe('normalizeSchedule (app/shared/lib/schedule)', () => {
  it('читает текущую форму {slots:[{weekday,time}]} (как в проде)', () => {
    expect(normalizeSchedule({
      slots: [
        { time: '09:00', weekday: 1, durationMin: 90 },
        { time: '16:00', weekday: 4, durationMin: 90 }
      ]
    })).toEqual([
      { weekday: 1, startTime: '09:00', durationMin: 90 },
      { weekday: 4, startTime: '16:00', durationMin: 90 }
    ])
  })

  it('slots[].startTime имеет приоритет над slots[].time', () => {
    const out = normalizeSchedule({ slots: [{ weekday: 2, startTime: '08:00', time: '09:00' }] })
    expect(out[0]?.startTime).toBe('08:00')
  })

  it('читает голый массив слотов', () => {
    expect(normalizeSchedule([{ weekday: 3, startTime: '12:00', durationMin: 45 }])).toEqual([
      { weekday: 3, startTime: '12:00', durationMin: 45 }
    ])
  })

  it('читает legacy {days:[RU],time} и мапит русские дни в номера', () => {
    expect(normalizeSchedule({ days: ['Пн', 'Сб', 'Вс'], time: '18:00' })).toEqual([
      { weekday: 1, startTime: '18:00', durationMin: 60 },
      { weekday: 6, startTime: '18:00', durationMin: 60 },
      { weekday: 0, startTime: '18:00', durationMin: 60 }
    ])
  })

  it('читает legacy-дни как объекты {value}/{label}', () => {
    const out = normalizeSchedule({ days: [{ value: 'Вт' }, { label: 'Чт' }], time: '10:00' })
    expect(out.map(s => s.weekday)).toEqual([2, 4])
  })

  it('неизвестный день недели схлопывается в 0 (воскресенье), а не отбрасывается', () => {
    // Осознанный компромисс ?? 0 — но означает, что опечатка в дне
    // молча становится воскресеньем вместо явной ошибки.
    const out = normalizeSchedule({ days: ['Понедельник'], time: '10:00' })
    expect(out).toHaveLength(1)
    expect(out[0]?.weekday).toBe(0)
  })

  it('durationMin по умолчанию = 60', () => {
    expect(normalizeSchedule({ slots: [{ weekday: 1, time: '09:00' }] })[0]?.durationMin).toBe(60)
    expect(normalizeSchedule([{ weekday: 1, startTime: '09:00' }])[0]?.durationMin).toBe(60)
  })

  it('отфильтровывает null/примитивы внутри массива слотов', () => {
    expect(normalizeSchedule([null, 'мусор', { weekday: 1, startTime: '09:00' }])).toHaveLength(1)
    expect(normalizeSchedule({ slots: [null, { weekday: 1, time: '09:00' }] })).toHaveLength(1)
  })

  it('возвращает [] на null/undefined/примитив', () => {
    expect(normalizeSchedule(null)).toEqual([])
    expect(normalizeSchedule(undefined)).toEqual([])
    expect(normalizeSchedule('строка')).toEqual([])
    expect(normalizeSchedule(42)).toEqual([])
  })

  it('возвращает [] на объект без slots/days', () => {
    expect(normalizeSchedule({})).toEqual([])
    expect(normalizeSchedule({ time: '09:00' })).toEqual([])
  })
})
