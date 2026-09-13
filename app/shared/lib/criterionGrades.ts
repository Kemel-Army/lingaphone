/**
 * Схлопывание оценок по критериям в «одну оценку за урок».
 *
 * С переходом на «мотивашку» оценки живут в `LessonCriterionGrade` — по пять
 * строк на урок (посещаемость, поведение, дом.зад, дневник, e-book). Прогресс,
 * аналитика и карточки учеников по-прежнему оперируют одним баллом за занятие,
 * поэтому приводим новые данные к прежней форме, а не переписываем половину
 * приложения.
 *
 * Старая таблица `Grade` в проекте больше не заполняется: читать её — значит
 * показывать нули.
 */

/** Строка `LessonCriterionGrade` в объёме, нужном для схлопывания. */
export interface CriterionGradeRow {
  lessonId: string
  studentId: string
  value: number
  gradedAt?: string
}

/** Та же форма, в которой раньше приходили строки `Grade`. */
export interface LessonAverageGrade {
  lessonId: string
  studentId: string
  /** Среднее по выставленным критериям, округлённое до сотых. */
  value: number
  /** В новой модели комментария нет — оставляем для совместимости. */
  comment: string | null
  /** Самая поздняя отметка времени среди критериев урока. */
  gradedAt: string
  /** Сколько критериев заполнено (из пяти) — для подсказок «заполнено не всё». */
  filled: number
}

/**
 * Группирует по паре (ученик, урок) и усредняет. Невыставленные критерии
 * просто отсутствуют в данных и в среднее не попадают — это не нули.
 */
export const collapseCriterionGrades = (rows: CriterionGradeRow[]): LessonAverageGrade[] => {
  const buckets = new Map<string, { sum: number, n: number, at: string, lessonId: string, studentId: string }>()

  for (const r of rows) {
    const key = `${r.studentId}|${r.lessonId}`
    const b = buckets.get(key)
    const at = r.gradedAt ?? ''
    if (b) {
      b.sum += r.value
      b.n++
      if (at > b.at) b.at = at
    } else {
      buckets.set(key, { sum: r.value, n: 1, at, lessonId: r.lessonId, studentId: r.studentId })
    }
  }

  return [...buckets.values()].map(b => ({
    lessonId: b.lessonId,
    studentId: b.studentId,
    value: Math.round((b.sum / b.n) * 100) / 100,
    comment: null,
    gradedAt: b.at,
    filled: b.n
  }))
}
