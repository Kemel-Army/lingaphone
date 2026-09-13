import { describe, it, expect } from 'vitest'
import { collapseCriterionGrades } from '../../app/shared/lib/criterionGrades'

/**
 * Оценки хранятся по пять строк на урок. Прогресс, аналитика и карточки
 * учеников ждут один балл за занятие — если схлопывание ошибётся, средний балл
 * разъедется с тем, что видит менеджер в «Мотивации».
 */
describe('collapseCriterionGrades', () => {
  const row = (lessonId: string, studentId: string, value: number, gradedAt = '2026-09-01T10:00:00Z') =>
    ({ lessonId, studentId, value, gradedAt })

  it('усредняет пять критериев одного урока в одну оценку', () => {
    const out = collapseCriterionGrades([
      row('l1', 's1', 5), row('l1', 's1', 4), row('l1', 's1', 5), row('l1', 's1', 3), row('l1', 's1', 5)
    ])
    expect(out).toHaveLength(1)
    expect(out[0]!.value).toBe(4.4)
    expect(out[0]!.filled).toBe(5)
  })

  it('разделяет учеников и уроки', () => {
    const out = collapseCriterionGrades([
      row('l1', 's1', 5), row('l1', 's2', 3),
      row('l2', 's1', 4), row('l2', 's2', 2)
    ])
    expect(out).toHaveLength(4)
    const find = (l: string, s: string) => out.find(o => o.lessonId === l && o.studentId === s)!
    expect(find('l1', 's1').value).toBe(5)
    expect(find('l1', 's2').value).toBe(3)
    expect(find('l2', 's1').value).toBe(4)
    expect(find('l2', 's2').value).toBe(2)
  })

  it('не считает невыставленные критерии нулями', () => {
    // Заполнено только два критерия из пяти: среднее по ним, а не /5.
    const out = collapseCriterionGrades([row('l1', 's1', 5), row('l1', 's1', 4)])
    expect(out[0]!.value).toBe(4.5)
    expect(out[0]!.filled).toBe(2)
  })

  it('берёт самую позднюю отметку времени урока', () => {
    const out = collapseCriterionGrades([
      row('l1', 's1', 5, '2026-09-01T10:00:00Z'),
      row('l1', 's1', 4, '2026-09-03T18:30:00Z'),
      row('l1', 's1', 5, '2026-09-02T09:00:00Z')
    ])
    expect(out[0]!.gradedAt).toBe('2026-09-03T18:30:00Z')
  })

  it('округляет до сотых', () => {
    // 5+4+4 = 13 / 3 = 4.333…
    const out = collapseCriterionGrades([row('l1', 's1', 5), row('l1', 's1', 4), row('l1', 's1', 4)])
    expect(out[0]!.value).toBe(4.33)
  })

  it('на пустом входе возвращает пустой список', () => {
    expect(collapseCriterionGrades([])).toEqual([])
  })

  it('переживает отсутствие gradedAt', () => {
    const out = collapseCriterionGrades([{ lessonId: 'l1', studentId: 's1', value: 5 }])
    expect(out[0]!.value).toBe(5)
    expect(out[0]!.gradedAt).toBe('')
  })

  it('comment всегда null — в новой модели его нет', () => {
    const out = collapseCriterionGrades([row('l1', 's1', 5)])
    expect(out[0]!.comment).toBeNull()
  })
})
