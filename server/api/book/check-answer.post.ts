/**
 * POST /api/book/check-answer   (STUDENT)
 *
 * Checks one exercise answer and records a PageAttempt. Hybrid strategy:
 *   - closed kinds (BLANK/CHOICE/TRUE_FALSE/MATCH) → deterministic key compare
 *   - open kinds (SHORT_TEXT/ORAL) → try key accept-list, else Gemini judgement
 *
 * The answer key lives in the service-role PageExerciseAnswer table, so this
 * route (service role) is the only place a student answer meets the key.
 *
 * Body: { exerciseId, response, audioUrl? }
 *   response shape by kind:
 *     BLANK/SHORT_TEXT/ORAL → { text }
 *     CHOICE                → { optionId }
 *     TRUE_FALSE            → { value: boolean }
 *     MATCH                 → { pairs: [{ leftId, rightId }] }
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

const norm = (s: any) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[.,!?;:'"`’]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const acceptList = (key: any): string[] => {
  if (Array.isArray(key?.accept)) return key.accept.map(norm).filter(Boolean)
  if (typeof key?.value === 'string') return [norm(key.value)]
  return []
}

/** Deterministic check for closed kinds + accept-list open kinds. Returns null if AI is required. */
const checkDeterministic = (kind: string, response: any, key: any): { correct: boolean, correctAnswer?: string } | null => {
  switch (kind) {
    case 'CHOICE':
    case 'UNDERLINE': {
      const correctId = key?.correctId ?? key?.correct
      return { correct: response?.optionId != null && response.optionId === correctId, correctAnswer: correctId }
    }
    case 'TRUE_FALSE':
      return { correct: Boolean(response?.value) === Boolean(key?.value), correctAnswer: String(key?.value) }
    case 'MATCH': {
      // response.pairs and key.pairs are both [{ l, r }]; compare as sets.
      const keyOf = (arr: any[]) => (Array.isArray(arr) ? arr : []).map((p: any) => `${p.l}=${p.r}`).sort().join('|')
      const want = keyOf(key?.pairs)
      return { correct: want.length > 0 && keyOf(response?.pairs) === want }
    }
    case 'BLANK': {
      const accepts = acceptList(key)
      const ans = norm(response?.text)
      return { correct: accepts.length > 0 && accepts.includes(ans), correctAnswer: key?.accept?.[0] ?? key?.value }
    }
    case 'SHORT_TEXT':
    case 'ORAL': {
      const accepts = acceptList(key)
      const ans = norm(response?.text)
      if (accepts.length && accepts.includes(ans)) return { correct: true, correctAnswer: key?.accept?.[0] }
      return null // needs AI (or falls through when AI unavailable)
    }
    default:
      return { correct: false }
  }
}

export default defineEventHandler(async (event) => {
  const { studentId } = await getCurrentStudent(event)

  const body = await readBody(event) as { exerciseId?: string, response?: any, audioUrl?: string }
  const exerciseId = body.exerciseId
  const response = body.response ?? {}
  if (!exerciseId) throw createError({ statusCode: 400, message: 'exerciseId обязателен' })

  const supabase = useServerSupabase(event)

  const { data: ex, error: exErr } = await supabase
    .from('PageExercise')
    .select('id, kind, prompt, PageExerciseAnswer ( answerKey, explanation )')
    .eq('id', exerciseId)
    .maybeSingle() as unknown as { data: any | null, error: unknown }
  if (exErr) throw createError({ statusCode: 500, message: String(exErr) })
  if (!ex) throw createError({ statusCode: 404, message: 'Упражнение не найдено' })

  const ans = Array.isArray(ex.PageExerciseAnswer) ? ex.PageExerciseAnswer[0] : ex.PageExerciseAnswer
  const key = ans?.answerKey ?? {}
  const explanation: string = ans?.explanation ?? ''

  let isCorrect: boolean | null = null
  let score: number | null = null
  let feedback = ''
  let correctAnswer: string | undefined

  const deterministic = checkDeterministic(ex.kind, response, key)
  if (deterministic) {
    isCorrect = deterministic.correct
    score = deterministic.correct ? 100 : 0
    correctAnswer = deterministic.correctAnswer
    feedback = deterministic.correct
      ? 'Верно! ' + explanation
      : (explanation || 'Не совсем. Посмотри правило ещё раз.')
  } else {
    // Open answer with no accept-list match → leave for teacher review (no AI).
    isCorrect = null
    feedback = 'Ответ сохранён. Преподаватель проверит его.'
  }

  const now = new Date().toISOString()
  const { error: upErr } = await supabase
    .from('PageAttempt')
    .upsert({
      studentId,
      exerciseId,
      response,
      isCorrect,
      score,
      aiFeedback: { feedback, correctAnswer },
      audioUrl: body.audioUrl ?? null,
      updatedAt: now
    }, { onConflict: 'studentId,exerciseId' })
  if (upErr) throw createError({ statusCode: 500, message: upErr.message })

  return { isCorrect, score, feedback, correctAnswer }
})
