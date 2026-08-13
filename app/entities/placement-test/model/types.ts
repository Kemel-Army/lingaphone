import type { PlacementAgeBand } from '~/shared/lib/placementTest'

/** Одна попытка входного тестирования, привязанная к лиду. */
export interface PlacementTestRecord {
  id: string
  leadId: string
  ageBand: PlacementAgeBand
  fullName: string
  phone: string
  autoScore: number
  autoMax: number
  skippedCount: number
  recommendedLevel: string | null
  openAnswers: { questionId: string, prompt: string, text: string }[]
  createdAt: string
}
