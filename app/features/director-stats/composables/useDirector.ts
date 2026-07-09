import type { Database } from '~/shared/types/database.types'
import type { LeadSource } from '~/entities/lead'
import type { DirectorStats } from './useDirectorStats'

export interface BranchWithCounts {
  id: string
  name: string
  kind: Database['public']['Enums']['BranchKind']
  address: string | null
  city: string | null
  groupsCount: number
  studentsCount: number
  leadsCount: number
  revenue: number
}

export interface DirectorReportLead {
  id: string
  fullName: string
  source: LeadSource
  stage: string
  trialSuccess: boolean | null
  trialTeacher: string
  tariff: string | null
  firstContactAt: string
  paidAt: string | null
  amount: number | null
  notes: string | null
  createdAt: string
}

export interface BranchInput {
  name: string
  kind: 'OFFLINE' | 'ONLINE'
  address?: string | null
  city?: string | null
}

/** Директорский кабинет (ТЗ разд. 7/8) — через серверные роуты (service role). */
export const useDirector = () => {
  const q = (branchId?: string | null) => (branchId ? { branchId } : {})

  const fetchStats = (branchId?: string | null) =>
    $fetch<DirectorStats>('/api/director/stats', { query: q(branchId) })

  const fetchBranches = () => $fetch<BranchWithCounts[]>('/api/director/branches')

  const createBranch = (body: BranchInput) =>
    $fetch<{ id: string }>('/api/director/branches', { method: 'POST', body })

  const updateBranch = (id: string, body: Partial<BranchInput>) =>
    $fetch(`/api/director/branches/${id}`, { method: 'PATCH', body })

  const fetchReports = (branchId?: string | null) =>
    $fetch<{ leads: DirectorReportLead[], history: { leadId: string, changedAt: string }[] }>(
      '/api/director/reports', { query: q(branchId) }
    )

  return { fetchStats, fetchBranches, createBranch, updateBranch, fetchReports }
}

/** Сентинел «все филиалы» (Reka UI Select запрещает пустую строку как value). */
export const ALL_BRANCHES = '__all__'

/** Общий стейт выбранного филиала — свитчер в навбаре + страницы директора. */
export const useDirectorBranch = () => useState<string>('director-branch', () => ALL_BRANCHES)

/** id филиала для запроса: сентинел «все» → null. */
export const branchToId = (v: string | null | undefined): string | null =>
  v && v !== ALL_BRANCHES ? v : null
