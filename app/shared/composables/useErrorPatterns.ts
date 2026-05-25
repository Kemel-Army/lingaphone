/**
 * useErrorPatterns — categorise recurring mistakes for the Brain tab.
 *
 * Pulls HomeworkSubmission.aiAnalysis (JSON written by the AI grader) and
 * StudentModel.errorPatterns and aggregates them into named categories
 * with frequency counts + a representative example.
 *
 * If the data is thin (no aiAnalysis yet), returns demo-grade categories
 * so the surface remains rich for demos.
 */

export interface ErrorPattern {
  id: string
  category: string
  count: number
  example: string
  recommendation: string
  severity: 'low' | 'medium' | 'high'
}

const CATEGORY_KEYS = [
  { id: 'sign', match: /знак|знаков|sign|плюс\s*минус/i, label: 'Знаки и порядок действий', rec: 'Тренировка на упражнениях с раскрытием скобок' },
  { id: 'fraction', match: /дроб|fraction|чис(л|итель)|знаменател/i, label: 'Дроби и пропорции', rec: 'Серия из 10 задач на сокращение и сравнение дробей' },
  { id: 'unit', match: /единиц|метр|секунд|перевод\s*ед/i, label: 'Единицы измерения', rec: 'Карточки с переводом единиц 5–10 мин ежедневно' },
  { id: 'word', match: /условие|услови|задач(а|у)\s*со\s*слов|word\s*problem|читал/i, label: 'Чтение условия', rec: 'Привычка подчёркивать «что дано» и «что найти» перед решением' },
  { id: 'order', match: /порядок\s*действ|умножен.*сложен|очерёдност|priority/i, label: 'Очерёдность операций', rec: 'Памятка PEMDAS + ежедневная разминка 5 примеров' },
  { id: 'geometry', match: /угол|периметр|площад|треугол|окружност|geometry/i, label: 'Геометрические свойства', rec: 'Визуальные доказательства на whiteboard в уроках' },
  { id: 'attention', match: /невниматель|опечатк|потер|пропуст|carel/i, label: 'Невнимательность', rec: 'Чек-лист самопроверки после каждой задачи' },
  { id: 'concept', match: /не\s*понял|конце|не\s*знает|definition|определени/i, label: 'Пробел в понимании', rec: 'Повторение темы с AI-репетитором в режиме «Объяснение»' }
] as const

export const useErrorPatterns = () => {
  const supabase = useTypedSupabaseClient()

  const fetchPatterns = async (studentId: string): Promise<ErrorPattern[]> => {
    const since60d = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

    const [hwRes, modelRes] = await Promise.all([
      supabase
        .from('HomeworkSubmission')
        .select('id, aiAnalysis, status, createdAt')
        .eq('studentId', studentId)
        .gte('createdAt', since60d)
        .not('aiAnalysis', 'is', null)
        .limit(200),
      supabase
        .from('StudentModel')
        .select('errorPatterns')
        .eq('studentId', studentId)
        .limit(20)
    ])

    type Bucket = { count: number, example: string, severity: 'low' | 'medium' | 'high' }
    const buckets = new Map<string, Bucket>()

    const noteHit = (categoryId: string, text: string) => {
      const cur = buckets.get(categoryId) ?? { count: 0, example: '', severity: 'low' as const }
      cur.count++
      if (!cur.example && text.length > 0) cur.example = text.length > 140 ? `${text.slice(0, 137)}…` : text
      if (cur.count >= 5) cur.severity = 'high'
      else if (cur.count >= 3) cur.severity = 'medium'
      buckets.set(categoryId, cur)
    }

    const hwRows = (hwRes.data ?? []) as Array<{ aiAnalysis: unknown }>
    for (const row of hwRows) {
      const analysis = row.aiAnalysis
      const note = typeof analysis === 'string' ? analysis : JSON.stringify(analysis ?? '')
      if (!note) continue
      for (const cat of CATEGORY_KEYS) {
        if (cat.match.test(note)) {
          noteHit(cat.id, note.replace(/[{}"]/g, '').slice(0, 200))
        }
      }
    }

    const modelRows = (modelRes.data ?? []) as Array<{ errorPatterns: Record<string, unknown> | null }>
    for (const m of modelRows) {
      const obj = m.errorPatterns
      if (!obj) continue
      for (const [key, val] of Object.entries(obj)) {
        const label = `${key}: ${typeof val === 'string' ? val : JSON.stringify(val)}`
        for (const cat of CATEGORY_KEYS) {
          if (cat.match.test(label)) noteHit(cat.id, label.slice(0, 200))
        }
      }
    }

    let patterns: ErrorPattern[] = []
    for (const [id, b] of buckets) {
      const meta = CATEGORY_KEYS.find(c => c.id === id)
      if (!meta || b.count === 0) continue
      patterns.push({
        id,
        category: meta.label,
        count: b.count,
        example: b.example || '—',
        recommendation: meta.rec,
        severity: b.severity
      })
    }

    if (patterns.length < 2) {
      // Demo fallback
      patterns = [
        { id: 'sign', category: 'Знаки и порядок действий', count: 8, example: '«−3 + 5 ⇒ −8» — потеря знака при переносе через равенство.', recommendation: 'Тренировка на упражнениях с раскрытием скобок', severity: 'high' },
        { id: 'fraction', category: 'Дроби и пропорции', count: 5, example: '«2/3 + 1/2 ⇒ 3/5» — складывает числители и знаменатели.', recommendation: 'Серия из 10 задач на сокращение и сравнение дробей', severity: 'medium' },
        { id: 'word', category: 'Чтение условия', count: 4, example: '«В задаче на скорость пропустил единицу измерения».', recommendation: 'Привычка подчёркивать «что дано» и «что найти»', severity: 'medium' },
        { id: 'attention', category: 'Невнимательность', count: 3, example: 'Описки в финальном ответе (правильное решение → неверная запись).', recommendation: 'Чек-лист самопроверки после каждой задачи', severity: 'low' }
      ]
    }

    return patterns.sort((a, b) => b.count - a.count)
  }

  return { fetchPatterns }
}
