import type { Database } from '~/shared/types/database.types'
import type { UiColor } from '~/shared/types/common'

type Tables = Database['public']['Tables']
export type TaskRow = Tables['Task']['Row']
export type TaskInsert = Tables['Task']['Insert']
export type TaskUpdate = Tables['Task']['Update']

export type TaskStatus = Database['public']['Enums']['TaskStatus']
export type TaskRelatedType = Database['public']['Enums']['TaskRelatedType']

export interface TaskStatusMeta {
  value: TaskStatus
  label: string
  color: UiColor
  icon: string
}

/** Статусы задач (ТЗ разд. 2.4): Новая / В работе / Выполнена / Просрочена. */
export const TASK_STATUSES: readonly TaskStatusMeta[] = [
  { value: 'NEW', label: 'Новая', color: 'info', icon: 'i-lucide-circle-dashed' },
  { value: 'IN_PROGRESS', label: 'В работе', color: 'warning', icon: 'i-lucide-loader' },
  { value: 'DONE', label: 'Выполнена', color: 'success', icon: 'i-lucide-circle-check-big' },
  { value: 'OVERDUE', label: 'Просрочена', color: 'error', icon: 'i-lucide-alarm-clock' }
]

export const TASK_STATUS_MAP: Record<TaskStatus, TaskStatusMeta>
  = Object.fromEntries(TASK_STATUSES.map(s => [s.value, s])) as Record<TaskStatus, TaskStatusMeta>

export interface TaskRelatedTypeMeta {
  value: TaskRelatedType
  label: string
  icon: string
}

export const TASK_RELATED_TYPES: readonly TaskRelatedTypeMeta[] = [
  { value: 'INTERNAL', label: 'Внутренняя', icon: 'i-lucide-briefcase' },
  { value: 'LEAD', label: 'Лид', icon: 'i-lucide-user-plus' },
  { value: 'STUDENT', label: 'Ученик', icon: 'i-lucide-graduation-cap' }
]

export const TASK_RELATED_TYPE_MAP: Record<TaskRelatedType, TaskRelatedTypeMeta>
  = Object.fromEntries(TASK_RELATED_TYPES.map(t => [t.value, t])) as Record<TaskRelatedType, TaskRelatedTypeMeta>

/** Просрочена, если срок прошёл и задача не завершена. Чистая функция. */
export const computeEffectiveStatus = (task: Pick<TaskRow, 'status' | 'dueAt'>): TaskStatus => {
  if (task.status === 'DONE') return 'DONE'
  if (task.dueAt && new Date(task.dueAt).getTime() < Date.now()) return 'OVERDUE'
  return task.status
}

/** Task joined with creator/assignee for the list UI. */
export interface TaskWithRelations extends TaskRow {
  creator: { id: string, name: string, surname: string } | null
  assignee: { id: string, name: string, surname: string } | null
  /** Derived: DONE не считается; просрочка вычисляется из dueAt. */
  effectiveStatus: TaskStatus
}
