import type { MyPath } from '../model/types'

/**
 * «Мой путь» reads for the student. The whole journey (bound book + gated
 * blocks with lock state) is computed server-side in /api/student/my-path,
 * where the answer keys and gating source (StudentBlockResult) live behind
 * the service role. This composable is a thin typed fetch wrapper.
 */
export const useMyPath = () => {
  // useRequestFetch forwards the incoming request cookies during SSR, so the
  // server route sees the student's auth session on a hard page load (plain
  // $fetch would send no cookies on the server → 401 → blank page).
  const request = useRequestFetch()

  /** The student's bound book as an ordered, gated block map. */
  const fetchMyPath = () => request<MyPath>('/api/student/my-path')

  return { fetchMyPath }
}
