/**
 * Backward-compat auto-import stub.
 * Business logic lives in:
 *   entities/student    → data loading, computed state
 *   features/submit-homework → homework submission + XP
 *   features/practice   → practice recording + vocabulary
 *
 * New pages should import directly from those layers instead.
 */
import { useStudent } from '~/entities/student'
import { useSubmitHomework } from '~/features/submit-homework'
import { usePractice } from '~/features/practice'

export const useLingafonStudent = () => {
  const student = useStudent()
  const { submitHomework } = useSubmitHomework()
  const { recordPracticeAttempt, recordDeckCompletion, addToVocabulary } = usePractice()

  return {
    ...student,
    submitHomework,
    recordPracticeAttempt,
    recordDeckCompletion,
    addToVocabulary
  }
}

export type { StudentGroup, FlatTeacher, Classmate } from '~/entities/student'
