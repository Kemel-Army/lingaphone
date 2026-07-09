import { useCurrentUser } from '~/entities/user'
import type { Database } from '~/shared/types/database.types'
import {
  computeEffectiveStatus,
  type TaskRow,
  type TaskWithRelations,
  type TaskInsert,
  type TaskUpdate,
  type TaskStatus
} from '../model/types'

const TASK_SELECT = `
  *,
  creator:User!Task_creatorId_fkey(id, name, surname),
  assignee:User!Task_assigneeId_fkey(id, name, surname)
` as const

/**
 * CRM: задачи администраторов (ТЗ разд. 2.4).
 * RLS — только ADMIN. Просрочка вычисляется на чтении (всегда актуальна).
 */
export const useTasks = () => {
  const supabase = useSupabaseClient<Database>()
  const { internalId } = useCurrentUser()

  const decorate = (rows: unknown[]): TaskWithRelations[] =>
    (rows as (TaskRow & Pick<TaskWithRelations, 'creator' | 'assignee'>)[]).map(t => ({
      ...t,
      effectiveStatus: computeEffectiveStatus(t)
    }))

  const fetchTasks = async (): Promise<TaskWithRelations[]> => {
    const { data, error } = await supabase
      .from('Task')
      .select(TASK_SELECT)
      .order('createdAt', { ascending: false })
    if (error) throw error
    return decorate(data ?? [])
  }

  const createTask = async (payload: Omit<TaskInsert, 'creatorId'>): Promise<TaskWithRelations> => {
    const { data, error } = await supabase
      .from('Task')
      .insert({ ...payload, creatorId: internalId.value })
      .select(TASK_SELECT)
      .single()
    if (error) throw error
    return decorate([data])[0]!
  }

  const updateTask = async (id: string, patch: TaskUpdate): Promise<TaskWithRelations> => {
    const { data, error } = await supabase
      .from('Task')
      .update(patch)
      .eq('id', id)
      .select(TASK_SELECT)
      .single()
    if (error) throw error
    return decorate([data])[0]!
  }

  const setStatus = (id: string, status: TaskStatus): Promise<TaskWithRelations> =>
    updateTask(id, {
      status,
      completedAt: status === 'DONE' ? new Date().toISOString() : null
    })

  const deleteTask = async (id: string): Promise<void> => {
    const { error } = await supabase.from('Task').delete().eq('id', id)
    if (error) throw error
  }

  return { fetchTasks, createTask, updateTask, setStatus, deleteTask }
}
