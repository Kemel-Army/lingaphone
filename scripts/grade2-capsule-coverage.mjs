#!/usr/bin/env node
/**
 * grade2-capsule-coverage.mjs
 *
 * Структурный smoke-тест: для каждого PathLesson внутри 2-го класса
 * проверяет, что в CapsuleLayer ровно 11 слоёв с уникальными layerType
 * и orderIndex 1..11 без пропусков.
 *
 * Запуск:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/grade2-capsule-coverage.mjs
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_KEY
if (!url || !key) {
  console.error('Need SUPABASE_URL and SUPABASE_SERVICE_KEY env vars')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const EXPECTED_TYPES = new Set([
  'HOOK', 'DIAGNOSTIC', 'INTUITION', 'EXPLANATION', 'FORMALIZATION', 'WALKTHROUGH',
  'TRAINER', 'SCENARIO', 'TRAPS', 'TEACH_BACK', 'MASTERY_CHECK'
])

async function main() {
  // 1. Subject for grade 2
  const { data: subj } = await supabase.from('Subject').select('id').eq('grade', 2).single()
  if (!subj) {
    console.error('Grade 2 subject not found')
    process.exit(2)
  }

  // 2. All topics + lessons
  const { data: topics } = await supabase
    .from('PathTopic')
    .select('id, name, orderIndex, PathLesson(id, title, orderIndex)')
    .eq('subjectId', subj.id)
    .order('orderIndex')

  if (!topics?.length) {
    console.error('No topics')
    process.exit(3)
  }

  const report = []
  let totalLessons = 0
  let fullyCovered = 0
  let partial = 0
  let empty = 0

  for (const t of topics) {
    const lessons = t.PathLesson ?? []
    for (const l of lessons.sort((a, b) => a.orderIndex - b.orderIndex)) {
      totalLessons++
      const { data: layers } = await supabase
        .from('CapsuleLayer')
        .select('layerType, orderIndex')
        .eq('lessonId', l.id)
        .order('orderIndex')

      const cnt = layers?.length ?? 0
      const types = new Set((layers ?? []).map(x => x.layerType))
      const orderOk = (layers ?? []).every((x, i) => x.orderIndex === i + 1)
      const allTypes = EXPECTED_TYPES.size === types.size && [...EXPECTED_TYPES].every(t => types.has(t))

      const status = cnt === 0 ? 'EMPTY' : (cnt === 11 && orderOk && allTypes ? 'OK' : 'PARTIAL')
      if (status === 'OK') fullyCovered++
      else if (status === 'EMPTY') empty++
      else partial++

      report.push({
        topic: t.name,
        lesson: l.title,
        layers: cnt,
        status,
        missing: cnt < 11 ? [...EXPECTED_TYPES].filter(x => !types.has(x)) : []
      })
    }
  }

  const summary = {
    totalLessons,
    fullyCovered,
    partial,
    empty,
    coveragePercent: totalLessons === 0 ? 0 : Math.round((fullyCovered / totalLessons) * 100)
  }

  console.log(JSON.stringify({ summary, report }, null, 2))
  process.exit(empty > 0 || partial > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(99)
})
