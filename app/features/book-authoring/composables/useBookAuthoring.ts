/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PageExerciseKind, PageExerciseOption } from '~/entities/book'

/** One exercise as edited in the admin overlay (carries the answer key). */
export interface EditableExercise {
  id?: string
  kind: PageExerciseKind
  x: number
  y: number
  w: number
  h: number
  prompt?: string | null
  options?: PageExerciseOption[]
  orderIndex?: number
  answerKey?: Record<string, unknown>
  explanation?: string | null
}

export interface EditablePage {
  id: string
  pageNumber: number
  imageUrl: string
  imageWidth: number
  imageHeight: number
  exercises: EditableExercise[]
}

/**
 * Admin-side authoring for the interactive book: render PDF pages to images
 * (in the browser, where the JPEG2000 wasm lives), trigger AI detection, and
 * load/save the exercise overlay (answer keys included, admin-only routes).
 */
export const useBookAuthoring = () => {
  /**
   * Render a page range of an already-loaded pdfjs document to PNG and upload
   * each page. `doc` is the PDFDocumentProxy from `usePdfDocument`.
   */
  const renderModulePages = async (opts: {
    doc: any
    moduleId: string
    fromPage: number
    toPage: number
    scale?: number
    onProgress?: (done: number, total: number, pageNumber: number) => void
  }): Promise<{ rendered: number }> => {
    const { doc, moduleId, fromPage, toPage } = opts
    const scale = opts.scale ?? 2
    const total = Math.max(0, toPage - fromPage + 1)
    let done = 0

    for (let n = fromPage; n <= toPage; n++) {
      const page = await doc.getPage(n)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas 2d context unavailable')

      await page.render({ canvasContext: ctx, viewport }).promise

      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
      )

      const fd = new FormData()
      fd.append('file', new File([blob], `${n}.png`, { type: 'image/png' }))
      fd.append('moduleId', moduleId)
      fd.append('pageNumber', String(n))
      fd.append('width', String(canvas.width))
      fd.append('height', String(canvas.height))
      await $fetch('/api/admin/books/render-pages', { method: 'POST', body: fd })

      // Release the (large) canvas backing store before the next page.
      canvas.width = 0
      canvas.height = 0
      done++
      opts.onProgress?.(done, total, n)
    }

    return { rendered: done }
  }

  const fetchAuthoringModules = () =>
    $fetch<{ modules: Array<{
      moduleId: string
      moduleTitle: string
      pdfUrl: string | null
      pageCount: number
      bookId: string | null
      bookTitle: string
      level: string
      isPublished: boolean
    }> }>('/api/admin/books/modules')

  const detectExercises = (moduleId: string, replace = false) =>
    $fetch<{ moduleId: string, total: number, pages: { pageNumber: number, detected: number, error?: string }[] }>(
      '/api/ai/detect-exercises',
      { method: 'POST', body: { moduleId, replace } }
    )

  const loadOverlay = (moduleId: string) =>
    $fetch<{ pages: EditablePage[] }>('/api/admin/books/overlay', { query: { moduleId } })

  const saveOverlay = (pageId: string, exercises: EditableExercise[]) =>
    $fetch<{ pageId: string, saved: { id: string, kind: string }[] }>(
      '/api/admin/books/save-overlay',
      { method: 'POST', body: { pageId, exercises } }
    )

  return { renderModulePages, fetchAuthoringModules, detectExercises, loadOverlay, saveOverlay }
}
