import { ensureNotProduction } from './_capsule-helpers'

/**
 * POST /api/dev/seed-grade2-all
 *
 * Master orchestrator for the grade-2 capsule library. Runs every per-topic
 * seeder in order, collects per-topic counts, and returns a summary.
 *
 * Workflow on a fresh DB:
 *   1. POST /api/dev/seed-curriculum         (creates topics + lessons)
 *   2. POST /api/dev/seed-grade2-all         (fills 11 layers per lesson)
 *
 * Re-running is idempotent — each per-topic seed wipes its own layers
 * before re-inserting.
 */

interface TopicSeedSpec {
  endpoint: string
  topic: string
  lessons: number
  status: 'ready' | 'pending'
}

const SEEDS: TopicSeedSpec[] = [
  { endpoint: '/api/dev/seed-grade2-01-two-digit', topic: 'Двузначные числа', lessons: 3, status: 'ready' },
  { endpoint: '/api/dev/seed-grade2-02-add-sub', topic: 'Сложение и вычитание в пределах 100', lessons: 4, status: 'ready' },
  { endpoint: '/api/dev/seed-grade2-03-simple-problems', topic: 'Решение простых задач', lessons: 3, status: 'ready' },
  { endpoint: '/api/dev/seed-grade2-04-quantities', topic: 'Величины и их измерение', lessons: 3, status: 'ready' },
  { endpoint: '/api/dev/seed-grade2-05-written-add-sub', topic: 'Письменное сложение и вычитание', lessons: 3, status: 'ready' },
  { endpoint: '/api/dev/seed-grade2-06-hundreds', topic: 'Сотни. Числа до 1000', lessons: 2, status: 'ready' },
  { endpoint: '/api/dev/seed-grade2-07-compound-problems', topic: 'Составные задачи', lessons: 3, status: 'ready' },
  { endpoint: '/api/dev/seed-grade2-08-time', topic: 'Время и римская нумерация', lessons: 3, status: 'ready' },
  { endpoint: '/api/dev/seed-grade2-09-sets', topic: 'Множества и их элементы', lessons: 4, status: 'ready' },
  { endpoint: '/api/dev/seed-grade2-10-angles', topic: 'Углы и многоугольники', lessons: 3, status: 'ready' },
  // Topic «Смысл умножения» уже покрыт seed-multiplication-layers
  { endpoint: '/api/dev/seed-multiplication-layers', topic: 'Смысл умножения', lessons: 4, status: 'ready' },
  { endpoint: '/api/dev/seed-grade2-12-division', topic: 'Смысл деления', lessons: 4, status: 'ready' },
  { endpoint: '/api/dev/seed-grade2-13-mult-table', topic: 'Таблица умножения на 2, 3, 4, 5', lessons: 4, status: 'ready' },
  { endpoint: '/api/dev/seed-grade2-14-money', topic: 'Деньги. Монеты и купюры', lessons: 1, status: 'ready' },
  { endpoint: '/api/dev/seed-grade2-15-expressions', topic: 'Числовые и буквенные выражения', lessons: 3, status: 'ready' },
  { endpoint: '/api/dev/seed-grade2-16-equations', topic: 'Уравнения и неравенства', lessons: 3, status: 'ready' },
  { endpoint: '/api/dev/seed-grade2-17-mult-div-problems', topic: 'Задачи на умножение и деление', lessons: 5, status: 'ready' },
  { endpoint: '/api/dev/seed-grade2-18-rational', topic: 'Рациональные способы вычислений', lessons: 3, status: 'ready' },
  { endpoint: '/api/dev/seed-grade2-19-perimeter', topic: 'Периметр', lessons: 3, status: 'ready' },
  { endpoint: '/api/dev/seed-grade2-20-geometry-logic', topic: 'Геометрические построения и логика', lessons: 3, status: 'ready' }
]

export default defineEventHandler(async (event) => {
  ensureNotProduction()

  const baseUrl = getRequestURL(event).origin
  const ready = SEEDS.filter(s => s.status === 'ready')
  const pending = SEEDS.filter(s => s.status === 'pending')

  const results: Array<{ topic: string, ok: boolean, message?: string, counts?: Record<string, unknown> }> = []

  for (const seed of ready) {
    try {
      const r = await $fetch(seed.endpoint, {
        baseURL: baseUrl,
        method: 'POST',
        headers: { cookie: getRequestHeader(event, 'cookie') ?? '' }
      }) as { ok: boolean, layersInsertedByLesson?: Record<string, number> }
      results.push({ topic: seed.topic, ok: r.ok, counts: r.layersInsertedByLesson })
    } catch (err) {
      results.push({ topic: seed.topic, ok: false, message: (err as Error).message })
    }
  }

  return {
    ok: results.every(r => r.ok),
    summary: {
      ready: ready.length,
      pending: pending.length,
      totalCapsules: SEEDS.reduce((s, t) => s + t.lessons, 0),
      capsulesReady: ready.reduce((s, t) => s + t.lessons, 0)
    },
    results,
    pendingTopics: pending.map(p => ({ topic: p.topic, lessons: p.lessons }))
  }
})
