/**
 * POST /api/book/check-exercise   (STUDENT)
 *
 * Deterministic checker for the native lesson player — one branch per type,
 * NO AI. The answer key lives in the service-role `LessonExerciseAnswer` table,
 * so this route is the only place a student answer meets the key. Writes a
 * LessonAttempt and returns `{ isCorrect, score, explanation, reveal }` where
 * `reveal` tells the widget the correct answer (safe — the student already
 * answered).
 *
 * Body: { exerciseId, response }
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

const norm = (s: any) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[.,!?;:'"`’]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const arrEq = (a: any[], b: any[]) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length
  && a.every((v, i) => norm(v) === norm(b[i]))

const mapEq = (a: Record<string, any>, b: Record<string, any>) => {
  const ka = Object.keys(a ?? {})
  const kb = Object.keys(b ?? {})
  return ka.length === kb.length && ka.every(k => a[k] === b[k])
}

const pairKey = (arr: any[]) =>
  (Array.isArray(arr) ? arr : []).map((p: any) => `${p.l}=${p.r}`).sort().join('|')

/** Returns { correct, reveal } for a given type. */
const check = (type: string, response: any, key: any): { correct: boolean, reveal: any } => {
  switch (type) {
    case 'FILL_BLANK': {
      const items = Array.isArray(key?.items) ? key.items : []
      const answers = Array.isArray(response?.answers) ? response.answers : []
      const correct = items.length > 0 && items.every((it: any, i: number) =>
        (it.accept ?? []).map(norm).includes(norm(answers[i])))
      return { correct, reveal: { answers: items.map((it: any) => it.accept?.[0] ?? '') } }
    }
    case 'CHOOSE': {
      const items = Array.isArray(key?.items) ? key.items : []
      const answers = Array.isArray(response?.answers) ? response.answers : []
      const correct = items.length > 0 && items.every((it: any, i: number) => it.correctId === answers[i])
      return { correct, reveal: { answers: items.map((it: any) => it.correctId) } }
    }
    case 'MCQ':
      return { correct: response?.optionId != null && response.optionId === key?.correctId, reveal: { optionId: key?.correctId } }
    case 'TRUE_FALSE':
      return { correct: Boolean(response?.value) === Boolean(key?.value), reveal: { value: Boolean(key?.value) } }
    case 'SHORT_TEXT': {
      const accepts = (key?.accept ?? []).map(norm)
      return { correct: accepts.includes(norm(response?.text)), reveal: { text: key?.accept?.[0] ?? '' } }
    }
    case 'REORDER':
      return { correct: arrEq(response?.order, key?.order ?? []), reveal: { order: key?.order ?? [] } }
    case 'MATCH_PAIRS': {
      const want = pairKey(key?.pairs)
      return { correct: want.length > 0 && pairKey(response?.pairs) === want, reveal: { pairs: key?.pairs ?? [] } }
    }
    case 'WORD_IMAGE_MATCH':
      return { correct: mapEq(response?.placement ?? {}, key?.placement ?? {}), reveal: { placement: key?.placement ?? {} } }
    case 'SORT_COLUMNS':
      return { correct: mapEq(response?.placement ?? {}, key?.placement ?? {}), reveal: { placement: key?.placement ?? {} } }
    default:
      return { correct: false, reveal: {} }
  }
}

export default defineEventHandler(async (event) => {
  const { studentId } = await getCurrentStudent(event)
  const body = await readBody(event) as { exerciseId?: string, response?: any }
  const exerciseId = body.exerciseId
  const response = body.response ?? {}
  if (!exerciseId) throw createError({ statusCode: 400, message: 'exerciseId обязателен' })

  const supabase = useServerSupabase(event)

  const { data: ex, error: exErr } = await supabase
    .from('LessonExercise')
    .select('id, type, LessonExerciseAnswer ( answerKey, explanation )')
    .eq('id', exerciseId)
    .maybeSingle() as unknown as { data: any | null, error: unknown }
  if (exErr) throw createError({ statusCode: 500, message: String(exErr) })
  if (!ex) throw createError({ statusCode: 404, message: 'Упражнение не найдено' })

  const ans = Array.isArray(ex.LessonExerciseAnswer) ? ex.LessonExerciseAnswer[0] : ex.LessonExerciseAnswer
  const key = ans?.answerKey ?? {}
  const explanation: string = ans?.explanation ?? ''

  const { correct, reveal } = check(ex.type, response, key)
  const score = correct ? 100 : 0

  const now = new Date().toISOString()
  const { error: upErr } = await supabase
    .from('LessonAttempt')
    .upsert({ studentId, exerciseId, response, isCorrect: correct, score, updatedAt: now }, { onConflict: 'studentId,exerciseId' })
  if (upErr) throw createError({ statusCode: 500, message: upErr.message })

  return { isCorrect: correct, score, explanation, reveal }
})
