import { describe, expect, it } from 'vitest'
import {
  DEFAULT_WEEKS_AHEAD,
  parseScheduleSlots,
  buildLessonRows
} from '../../server/utils/lessonGeneration'
import { normalizeSchedule } from '../../app/shared/lib/schedule'

// Production shape, as actually stored in Group.schedule today
// (verified against the live DB: {"slots":[{"time","weekday","durationMin"}]}).
const PROD_SCHEDULE = {
  slots: [
    { time: '09:00', weekday: 1, durationMin: 90 },
    { time: '16:00', weekday: 4, durationMin: 90 }
  ]
}

const LEGACY_SCHEDULE = { days: ['Пн', 'Ср'], time: '18:00', durationMin: 45 }

describe('parseScheduleSlots (server/utils/lessonGeneration)', () => {
  it('парсит текущую форму {slots:[{weekday,time,durationMin}]}', () => {
    expect(parseScheduleSlots(PROD_SCHEDULE)).toEqual([
      { weekday: 1, time: '09:00', durationMin: 90 },
      { weekday: 4, time: '16:00', durationMin: 90 }
    ])
  })

  it('парсит legacy-форму {days:[RU],time} с общим временем', () => {
    expect(parseScheduleSlots(LEGACY_SCHEDULE)).toEqual([
      { weekday: 1, time: '18:00', durationMin: 45 },
      { weekday: 3, time: '18:00', durationMin: 45 }
    ])
  })

  it('принимает legacy-дни как объекты {value}/{label}', () => {
    const slots = parseScheduleSlots({ days: [{ value: 'Сб' }, { label: 'Вс' }], time: '10:00' })
    expect(slots.map(s => s.weekday)).toEqual([6, 0])
  })

  it('подставляет durationMin=60, когда он не задан', () => {
    const slots = parseScheduleSlots({ slots: [{ weekday: 2, time: '11:00' }] })
    expect(slots[0]?.durationMin).toBe(60)
  })

  it('наследует schedule.durationMin как fallback для слотов без своего', () => {
    const slots = parseScheduleSlots({ durationMin: 120, slots: [{ weekday: 2, time: '11:00' }] })
    expect(slots[0]?.durationMin).toBe(120)
  })

  it('отбрасывает слоты без weekday или time', () => {
    const slots = parseScheduleSlots({
      slots: [{ weekday: 1 }, { time: '09:00' }, { weekday: 5, time: '09:00' }]
    })
    expect(slots).toHaveLength(1)
    expect(slots[0]?.weekday).toBe(5)
  })

  it('возвращает [] на пустой/битый вход', () => {
    expect(parseScheduleSlots(null)).toEqual([])
    expect(parseScheduleSlots(undefined)).toEqual([])
    expect(parseScheduleSlots({})).toEqual([])
    expect(parseScheduleSlots({ days: [], time: '09:00' })).toEqual([])
    expect(parseScheduleSlots({ days: ['Пн'], time: '' })).toEqual([])
  })

  it('понимает голый массив слотов — как и normalizeSchedule на фронте', () => {
    // Раньше сервер эту форму игнорировал и группа молча оставалась без уроков.
    const bareArray = [{ weekday: 1, startTime: '09:00', durationMin: 60 }]
    expect(normalizeSchedule(bareArray)).toHaveLength(1)
    expect(parseScheduleSlots(bareArray)).toEqual([
      { weekday: 1, time: '09:00', durationMin: 60 }
    ])
  })

  it('читает slots[].startTime наравне со slots[].time', () => {
    const startTimeShape = { slots: [{ weekday: 1, startTime: '09:00', durationMin: 60 }] }
    expect(normalizeSchedule(startTimeShape)[0]?.startTime).toBe('09:00')
    expect(parseScheduleSlots(startTimeShape)).toEqual([
      { weekday: 1, time: '09:00', durationMin: 60 }
    ])
  })

  it('time имеет приоритет над startTime, если заданы оба', () => {
    const both = { slots: [{ weekday: 1, time: '08:00', startTime: '09:00' }] }
    expect(parseScheduleSlots(both)[0]?.time).toBe('08:00')
  })

  it('оба парсера согласны по числу слотов на всех поддерживаемых формах', () => {
    const shapes: unknown[] = [
      PROD_SCHEDULE,
      LEGACY_SCHEDULE,
      [{ weekday: 1, startTime: '09:00' }, { weekday: 3, startTime: '10:00' }],
      { slots: [{ weekday: 2, startTime: '11:00' }] },
      {},
      null
    ]
    for (const shape of shapes) {
      expect(parseScheduleSlots(shape).length, `форма: ${JSON.stringify(shape)}`)
        .toBe(normalizeSchedule(shape).length)
    }
  })
})

describe('buildLessonRows (server/utils/lessonGeneration)', () => {
  // Monday 2026-08-10, fixed so the test is deterministic.
  const MONDAY = new Date(2026, 7, 10)

  it('создаёт по одному уроку на слот в неделю за weeksAhead недель', () => {
    const rows = buildLessonRows('g1', PROD_SCHEDULE, 4, MONDAY)
    expect(rows).toHaveLength(4 * 2) // 4 недели × 2 слота
  })

  it('по умолчанию горизонт = DEFAULT_WEEKS_AHEAD (12 недель)', () => {
    expect(DEFAULT_WEEKS_AHEAD).toBe(12)
    const rows = buildLessonRows('g1', { slots: [{ weekday: 1, time: '09:00' }] }, undefined, MONDAY)
    expect(rows).toHaveLength(12)
  })

  it('прибивает время к казахстанскому смещению +05:00', () => {
    const rows = buildLessonRows('g1', PROD_SCHEDULE, 1, MONDAY)
    expect(rows[0]?.startsAt).toBe('2026-08-10T09:00:00+05:00')
    expect(rows[1]?.startsAt).toBe('2026-08-13T16:00:00+05:00')
  })

  it('проставляет groupId, durationMin и status=SCHEDULED', () => {
    const rows = buildLessonRows('group-abc', PROD_SCHEDULE, 1, MONDAY)
    expect(rows[0]).toEqual({
      groupId: 'group-abc',
      startsAt: '2026-08-10T09:00:00+05:00',
      durationMin: 90,
      status: 'SCHEDULED'
    })
  })

  it('НЕ выставляет type — Lesson.type падает на DEFAULT GROUP в БД', () => {
    const rows = buildLessonRows('g1', PROD_SCHEDULE, 1, MONDAY)
    expect(rows[0]).not.toHaveProperty('type')
  })

  it('возвращает [] когда расписание пустое (группа без слотов)', () => {
    expect(buildLessonRows('g1', {}, 4, MONDAY)).toEqual([])
    expect(buildLessonRows('g1', null, 4, MONDAY)).toEqual([])
  })

  it('два занятия в один день недели создаются оба, по возрастанию времени', () => {
    // Регрессия: byWeekday был Map<weekday, Slot>, поэтому пара Пн 09:00 +
    // Пн 18:00 схлопывалась в один урок.
    const rows = buildLessonRows('g1', {
      slots: [
        { weekday: 1, time: '18:00', durationMin: 60 },
        { weekday: 1, time: '09:00', durationMin: 60 }
      ]
    }, 1, MONDAY)
    expect(rows).toHaveLength(2)
    expect(rows.map(r => r.startsAt)).toEqual([
      '2026-08-10T09:00:00+05:00',
      '2026-08-10T18:00:00+05:00'
    ])
  })

  it('три занятия в один день недели за 2 недели дают 6 уроков', () => {
    const rows = buildLessonRows('g1', {
      slots: [
        { weekday: 1, time: '09:00' },
        { weekday: 1, time: '13:00' },
        { weekday: 1, time: '18:00' }
      ]
    }, 2, MONDAY)
    expect(rows).toHaveLength(6)
  })

  it('включает сегодняшний слот, даже если время уже прошло', () => {
    // cursor стартует с сегодняшней полуночи, время суток не сравнивается.
    const rows = buildLessonRows('g1', { slots: [{ weekday: 1, time: '00:01' }] }, 1, MONDAY)
    expect(rows[0]?.startsAt).toBe('2026-08-10T00:01:00+05:00')
  })

  it('не мутирует переданный fromDate', () => {
    const from = new Date(2026, 7, 10, 13, 45)
    const snapshot = from.getTime()
    buildLessonRows('g1', PROD_SCHEDULE, 2, from)
    expect(from.getTime()).toBe(snapshot)
  })
})
