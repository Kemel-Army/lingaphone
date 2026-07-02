/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LessonExerciseType } from '~/entities/book'

export interface EditableExercise {
  id?: string
  type: LessonExerciseType
  instruction?: string
  content: Record<string, any>
  xp?: number
  answerKey: Record<string, any>
  explanation?: string
}
export interface EditableUnit {
  id?: string
  title: string
  subtitle?: string
  orderIndex?: number
  intro: any[]
  exercises: EditableExercise[]
}

/** Admin authoring for the native lesson content (units + exercises + images). */
export const useLessonAuthoring = () => {
  const fetchAuthoringModules = () =>
    $fetch<{ modules: Array<{ moduleId: string, moduleTitle: string, bookTitle: string, level: string, isPublished: boolean, pageCount: number }> }>(
      '/api/admin/books/modules'
    )

  const fetchUnits = (moduleId: string) =>
    $fetch<{ units: EditableUnit[] }>('/api/admin/lessons', { query: { moduleId } })

  const saveUnit = (moduleId: string, unit: Omit<EditableUnit, 'exercises'>, exercises: EditableExercise[]) =>
    $fetch<{ unitId: string, exercises: { id: string }[] }>('/api/admin/lessons/save-unit', {
      method: 'POST',
      body: { moduleId, unit, exercises }
    })

  const deleteUnit = (id: string) =>
    $fetch<{ ok: boolean }>(`/api/admin/lessons/${id}`, { method: 'DELETE' })

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append('file', file)
    const { url } = await $fetch<{ url: string }>('/api/admin/lessons/upload-image', { method: 'POST', body: fd })
    return url
  }

  return { fetchAuthoringModules, fetchUnits, saveUnit, deleteUnit, uploadImage }
}
