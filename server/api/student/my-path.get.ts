/**
 * GET /api/student/my-path   (STUDENT)  — «Мой путь»
 *
 * Returns the student's assigned course book as a sequential map of blocks
 * (Modules). Each block carries its lessons + block test and a computed
 * lock state:
 *   - block[0]        → AVAILABLE (COMPLETED if its test is passed)
 *   - block[i>0]      → LOCKED until block[i-1]'s test is passed, then AVAILABLE
 *   - any block       → COMPLETED once its own test is passed
 * Gating source is StudentBlockResult (written by /api/book/submit-block-test).
 *
 * Book resolution (teacher-controlled, see 20260826000000_book_assignments.sql):
 *   1. StudentBook.bookId  — teacher's per-student override, if any.
 *   2. Group.bookId        — teacher's default book for the student's active group.
 *   3. null                — UI shows an "awaiting curator" state.
 * Either way the resolved book must still be isPublished.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

type BlockStatus = 'LOCKED' | 'AVAILABLE' | 'COMPLETED'

export default defineEventHandler(async (event) => {
  const { studentId } = await getCurrentStudent(event)
  const supabase = useServerSupabase(event)

  // Student's curator-assigned level (the track key).
  const { data: st, error: stErr } = await supabase
    .from('Student').select('level').eq('id', studentId).maybeSingle() as unknown as
    { data: { level: string } | null, error: unknown }
  if (stErr) throw createError({ statusCode: 500, message: String(stErr) })
  const level = st?.level ?? null

  // Track metadata (tier, book title) — shown even when no book is bound yet.
  const { data: track } = await supabase
    .from('LevelTrack').select('level, tier, bookTitle, isActive')
    .eq('level', level ?? '').maybeSingle() as unknown as
    { data: { level: string, tier: string, bookTitle: string, isActive: boolean } | null }

  const base = {
    level,
    tier: track?.tier ?? null,
    trackBookTitle: track?.bookTitle ?? null,
    book: null as null | { id: string, title: string, cefrTier: string | null },
    blocks: [] as any[],
    scanModule: null as null | { id: string, title: string, pageCount: number }
  }
  if (!level) return base

  // Resolve assigned book: StudentBook override → student's active group's
  // default book → none. Only ever surfaces isPublished books.
  const { data: override } = await supabase
    .from('StudentBook').select('bookId').eq('studentId', studentId).maybeSingle() as unknown as
    { data: { bookId: string } | null }

  let bookId = override?.bookId ?? null
  if (!bookId) {
    const { data: membership } = await supabase
      .from('GroupMember')
      .select('Group!groupId ( bookId )')
      .eq('studentId', studentId).eq('status', 'ACTIVE').maybeSingle() as unknown as
      { data: { Group: { bookId: string | null } | { bookId: string | null }[] | null } | null }
    const group = Array.isArray(membership?.Group) ? membership?.Group[0] : membership?.Group
    bookId = group?.bookId ?? null
  }
  if (!bookId) return base

  const { data: book } = await supabase
    .from('Book').select('id, title, cefrTier')
    .eq('id', bookId).eq('isPublished', true).maybeSingle() as unknown as
    { data: { id: string, title: string, cefrTier: string | null } | null }
  if (!book) return base
  base.book = { id: book.id, title: book.title, cefrTier: book.cefrTier }

  // Blocks (modules) ordered. Отсканированный учебник (pageCount>0) — не блок
  // «Мой путь», а отдельная читалка → отделяем его.
  const { data: modules } = await supabase
    .from('Module').select('id, title, order, pageCount').eq('bookId', book.id).order('order') as unknown as
    { data: Array<{ id: string, title: string, order: number, pageCount: number }> | null }
  const allModules = modules ?? []
  const scan = allModules.find(m => (m.pageCount ?? 0) > 0)
  if (scan) base.scanModule = { id: scan.id, title: scan.title, pageCount: scan.pageCount }
  const blocks = allModules.filter(m => (m.pageCount ?? 0) === 0)
  if (!blocks.length) return base
  const moduleIds = blocks.map(b => b.id)

  // Units of all blocks (with exercise counts), block results, and the
  // student's correct attempts (for per-lesson progress display).
  const [{ data: units }, { data: results }] = await Promise.all([
    supabase.from('LessonUnit')
      .select('id, moduleId, title, orderIndex, kind, passThreshold, LessonExercise(count)')
      .in('moduleId', moduleIds).order('orderIndex') as unknown as Promise<{ data: any[] | null }>,
    supabase.from('StudentBlockResult')
      .select('moduleId, testUnitId, bestScore, passed, attempts')
      .eq('studentId', studentId).in('moduleId', moduleIds) as unknown as Promise<{ data: any[] | null }>
  ])

  // Correct-attempt counts per unit (lesson progress).
  const exIds: string[] = []
  const exUnit: Record<string, string> = {}
  const { data: exRows } = await supabase
    .from('LessonExercise').select('id, unitId')
    .in('unitId', (units ?? []).map((u: any) => u.id)) as unknown as { data: any[] | null }
  for (const e of exRows ?? []) {
    exIds.push(e.id)
    exUnit[e.id] = e.unitId
  }

  const doneByUnit: Record<string, number> = {}
  if (exIds.length) {
    const { data: att } = await supabase
      .from('LessonAttempt').select('exerciseId, isCorrect')
      .eq('studentId', studentId).in('exerciseId', exIds) as unknown as { data: any[] | null }
    for (const a of att ?? []) {
      const uid = exUnit[a.exerciseId]
      if (a.isCorrect && uid) doneByUnit[uid] = (doneByUnit[uid] ?? 0) + 1
    }
  }

  const resultByModule: Record<string, any> = {}
  for (const r of results ?? []) resultByModule[r.moduleId] = r

  // Assemble blocks. Gating is OFF — every block is open; a block is only
  // marked COMPLETED once its test is passed, otherwise AVAILABLE (never LOCKED).
  const out = blocks.map((blk) => {
    const bUnits = (units ?? []).filter((u: any) => u.moduleId === blk.id)
    const lessonUnits = bUnits.filter((u: any) => u.kind === 'LESSON')
    const testUnit = bUnits.find((u: any) => u.kind === 'TEST') ?? null
    const result = resultByModule[blk.id] ?? null
    const passed = testUnit ? Boolean(result?.passed) : false

    const status: BlockStatus = passed ? 'COMPLETED' : 'AVAILABLE'

    const lessons = lessonUnits.map((u: any) => {
      const total = u.LessonExercise?.[0]?.count ?? 0
      const done = Math.min(doneByUnit[u.id] ?? 0, total)
      return { id: u.id, title: u.title, orderIndex: u.orderIndex, exerciseCount: total, doneCount: done, completed: total > 0 && done >= total }
    })

    const block = {
      id: blk.id,
      title: blk.title,
      order: blk.order,
      status,
      lessons,
      lessonsTotal: lessons.length,
      lessonsDone: lessons.filter(l => l.completed).length,
      test: testUnit
        ? {
            unitId: testUnit.id,
            title: testUnit.title,
            passThreshold: testUnit.passThreshold,
            exerciseCount: testUnit.LessonExercise?.[0]?.count ?? 0,
            passed,
            bestScore: result?.bestScore ?? 0,
            attempts: result?.attempts ?? 0
          }
        : null
    }
    return block
  })

  base.blocks = out
  return base
})
