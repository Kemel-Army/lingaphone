/**
 * Browser-native printable parent report.
 *
 * Why not jsPDF? jsPDF's bundled fonts have no Cyrillic glyphs, so titles
 * like "Отчёт: Айдос Бекенов" render as garbage. Loading a custom Cyrillic
 * TTF into jsPDF works but inflates the bundle by 100+ KB. Instead we open
 * a styled HTML document in a popup, auto-trigger window.print(), and let
 * the browser produce a PDF natively — fonts, kerning, paging are perfect
 * out of the box and the layout can be styled with normal CSS.
 *
 * The popup is opaque to the user: they see the system print dialog and
 * choose "Save as PDF" → beautiful, branded report.
 */

export interface PrintableSubject {
  name: string
  mastery: number
  delta?: number // weekly mastery change, optional
}

export interface PrintableErrorPattern {
  label: string
  count: number
}

export interface PrintableEvent {
  date: string // ISO
  kind: 'capsule' | 'ai' | 'test' | 'homework' | 'achievement'
  text: string
  value?: string
}

export interface PrintableReportData {
  childName: string
  childGrade: number | null
  period: string
  generatedAt?: Date
  summary: {
    overallMastery: number
    totalLessons: number
    homeworkCompleted: number
    testsCount: number
    testAvgScore: number
    aiSessions: number
    capsulesCompleted: number
    xpEarned: number
    streak: number
  }
  subjects: PrintableSubject[]
  strengths: string[]
  weaknesses: string[]
  errorPatterns: PrintableErrorPattern[]
  recentEvents: PrintableEvent[]
  femiSummary: string // free-form text — same paragraph parent sees in /parent
}

const masteryBucket = (m: number): { color: string, label: string } => {
  if (m >= 80) return { color: '#10b981', label: 'освоено' }
  if (m >= 65) return { color: '#84cc16', label: 'почти ок' }
  if (m >= 45) return { color: '#f59e0b', label: 'требует внимания' }
  return { color: '#f43f5e', label: 'пробел' }
}

const eventIcon: Record<PrintableEvent['kind'], string> = {
  capsule: '🟢',
  ai: '💜',
  test: '📋',
  homework: '📝',
  achievement: '🏆'
}

const fmtDateRu = (iso: string) =>
  new Date(iso).toLocaleDateString('ru', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })

const fmtDayMonth = (d: Date) =>
  d.toLocaleDateString('ru', { day: '2-digit', month: 'long', year: 'numeric' })

const escape = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const buildHtml = (d: PrintableReportData): string => {
  const generated = d.generatedAt ?? new Date()
  const s = d.summary

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Отчёт FEMO — ${escape(d.childName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #1f2937;
      background: #ffffff;
      font-size: 11pt;
      line-height: 1.45;
    }
    .wrap {
      max-width: 800px;
      margin: 0 auto;
      padding: 32px 36px 48px;
    }

    /* Header */
    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      padding-bottom: 18px;
      border-bottom: 3px solid #ef4444;
      margin-bottom: 24px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-mark {
      width: 44px; height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #ef4444 0%, #f59e0b 100%);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 800; font-size: 22px;
      letter-spacing: -0.02em;
    }
    .brand-text { line-height: 1.15; }
    .brand-name { font-weight: 800; font-size: 18pt; letter-spacing: -0.01em; }
    .brand-tag { color: #6b7280; font-size: 9pt; }

    .head-right { text-align: right; }
    .head-period { font-size: 9pt; color: #6b7280; }
    .head-date { font-size: 8pt; color: #9ca3af; margin-top: 2px; }

    /* Hero block */
    .hero {
      background: linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%);
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    .hero-left h1 {
      margin: 0 0 4px;
      font-size: 22pt;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #111827;
    }
    .hero-left .meta { color: #6b7280; font-size: 10pt; }
    .hero-right {
      text-align: right;
    }
    .hero-mastery {
      font-size: 36pt;
      font-weight: 800;
      color: #ef4444;
      line-height: 1;
      letter-spacing: -0.03em;
    }
    .hero-mastery small {
      font-size: 14pt;
      color: #9ca3af;
    }

    /* Sections */
    h2 {
      font-size: 13pt;
      font-weight: 700;
      margin: 24px 0 12px;
      color: #111827;
      letter-spacing: -0.01em;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h2::before {
      content: '';
      width: 4px;
      height: 16px;
      background: #ef4444;
      border-radius: 2px;
    }

    /* Femi text block */
    .femi-text {
      background: #faf5ff;
      border-left: 3px solid #a855f7;
      padding: 14px 18px;
      border-radius: 8px;
      font-size: 10.5pt;
      line-height: 1.6;
      color: #374151;
      margin-bottom: 8px;
    }
    .femi-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 8pt;
      font-weight: 600;
      color: #a855f7;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 6px;
    }

    /* KPI grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    .kpi {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 12px 14px;
    }
    .kpi-label {
      font-size: 8.5pt;
      color: #6b7280;
      margin-bottom: 4px;
      font-weight: 500;
    }
    .kpi-value {
      font-size: 18pt;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.02em;
    }
    .kpi-sub {
      font-size: 8pt;
      color: #9ca3af;
      margin-top: 2px;
    }

    /* Topics table */
    .topics {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
    }
    .topic-row {
      display: grid;
      grid-template-columns: 1fr 90px 110px;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 10pt;
    }
    .topic-row:last-child { border-bottom: none; }
    .topic-name { font-weight: 500; color: #1f2937; }
    .topic-bar {
      height: 6px;
      background: #f3f4f6;
      border-radius: 3px;
      overflow: hidden;
    }
    .topic-bar > div { height: 100%; border-radius: 3px; }
    .topic-meta {
      text-align: right;
      font-weight: 600;
      font-size: 10pt;
    }

    /* 2-col grid */
    .cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .panel {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .panel h3 {
      margin: 0 0 8px;
      font-size: 10pt;
      font-weight: 700;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .panel ul { margin: 0; padding: 0; list-style: none; }
    .panel li {
      padding: 4px 0;
      font-size: 10pt;
      color: #1f2937;
      display: flex;
      align-items: flex-start;
      gap: 6px;
    }
    .panel li::before {
      content: '';
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #ef4444;
      margin-top: 7px;
      flex: 0 0 5px;
    }
    .strengths li::before { background: #10b981; }
    .errors li::before { background: #f59e0b; }
    .err-count {
      margin-left: auto;
      font-weight: 600;
      color: #f59e0b;
      font-size: 9pt;
    }

    /* Recent events */
    .events {
      display: grid;
      gap: 6px;
    }
    .event-row {
      display: grid;
      grid-template-columns: 22px 1fr 80px;
      align-items: center;
      gap: 10px;
      padding: 7px 10px;
      border: 1px solid #f3f4f6;
      border-radius: 8px;
      font-size: 9.5pt;
    }
    .event-date { color: #9ca3af; text-align: right; font-size: 8.5pt; }

    /* Footer */
    .footer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #9ca3af;
    }

    @media print {
      @page { size: A4; margin: 12mm; }
      body { font-size: 10pt; }
      .wrap { padding: 0; }
      .hero, .femi-text, .panel, .kpi, .topic-row, .event-row {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <div class="brand">
        <div class="brand-mark">F</div>
        <div class="brand-text">
          <div class="brand-name">FEMO</div>
          <div class="brand-tag">Образовательная платформа · AI-репетитор Femi</div>
        </div>
      </div>
      <div class="head-right">
        <div class="head-period">Период: ${escape(d.period)}</div>
        <div class="head-date">Сформирован: ${fmtDayMonth(generated)}</div>
      </div>
    </div>

    <div class="hero">
      <div class="hero-left">
        <h1>${escape(d.childName)}</h1>
        <div class="meta">${d.childGrade ? `${d.childGrade} класс · ` : ''}Отчёт о прогрессе</div>
      </div>
      <div class="hero-right">
        <div class="hero-mastery">${s.overallMastery}<small>%</small></div>
        <div class="meta">Общий уровень освоения</div>
      </div>
    </div>

    <h2>AI-сводка от Femi</h2>
    <div class="femi-text">
      <div class="femi-tag">✨ Резюме недели</div>
      ${escape(d.femiSummary)}
    </div>

    <h2>Ключевые показатели</h2>
    <div class="kpi-grid">
      <div class="kpi">
        <div class="kpi-label">Капсул пройдено</div>
        <div class="kpi-value">${s.capsulesCompleted}</div>
        <div class="kpi-sub">за период</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">AI-сессий</div>
        <div class="kpi-value">${s.aiSessions}</div>
        <div class="kpi-sub">разговоров с Femi</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Тестов сдано</div>
        <div class="kpi-value">${s.testsCount}</div>
        <div class="kpi-sub">средний балл ${s.testAvgScore}%</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Стрик</div>
        <div class="kpi-value">${s.streak}<small style="font-size:11pt;color:#9ca3af"> дн.</small></div>
        <div class="kpi-sub">${s.xpEarned} XP заработано</div>
      </div>
    </div>

    <h2>Знания по темам</h2>
    <div class="topics">
      ${d.subjects.map((t) => {
        const b = masteryBucket(t.mastery)
        return `
        <div class="topic-row">
          <div class="topic-name">${escape(t.name)}</div>
          <div class="topic-bar">
            <div style="width:${t.mastery}%; background:${b.color}"></div>
          </div>
          <div class="topic-meta" style="color:${b.color}">
            ${t.mastery}% <span style="font-weight:400;color:#9ca3af;font-size:8.5pt">· ${b.label}</span>
          </div>
        </div>`
      }).join('')}
    </div>

    <div class="cols" style="margin-top:16px">
      <div class="panel">
        <h3>💪 Сильные стороны</h3>
        <ul class="strengths">
          ${d.strengths.length ? d.strengths.map(x => `<li>${escape(x)}</li>`).join('') : '<li style="color:#9ca3af;">Будут видны после первой диагностики</li>'}
        </ul>
      </div>
      <div class="panel">
        <h3>🎯 Над чем работаем</h3>
        <ul>
          ${d.weaknesses.length ? d.weaknesses.map(x => `<li>${escape(x)}</li>`).join('') : '<li style="color:#9ca3af;">Слабых тем не выявлено — отличный темп!</li>'}
        </ul>
      </div>
    </div>

    ${d.errorPatterns.length
      ? `
    <h2>Паттерны ошибок</h2>
    <div class="panel">
      <ul class="errors">
        ${d.errorPatterns.map(p => `<li>${escape(p.label)}<span class="err-count">${p.count} случаев</span></li>`).join('')}
      </ul>
    </div>
    `
      : ''}

    ${d.recentEvents.length
      ? `
    <h2>События за период</h2>
    <div class="events">
      ${d.recentEvents.map(e => `
        <div class="event-row">
          <div>${eventIcon[e.kind]}</div>
          <div>${escape(e.text)}${e.value ? ` <span style="color:#a855f7;font-weight:600">${escape(e.value)}</span>` : ''}</div>
          <div class="event-date">${fmtDateRu(e.date)}</div>
        </div>
      `).join('')}
    </div>
    `
      : ''}

    <div class="footer">
      <div>FEMO · Адаптивная AI-платформа подготовки 1–6 класс</div>
      <div>femo.kz</div>
    </div>
  </div>

  <script>
    // Auto-open the system print dialog when the document is ready.
    // The popup is intended to be transient — user picks "Save as PDF" and closes.
    window.addEventListener('load', () => setTimeout(() => window.print(), 300));
  </script>
</body>
</html>`
}

/**
 * Open a styled printable report in a new window and auto-trigger the
 * print dialog. The user picks "Save as PDF" in the browser dialog and
 * receives a beautiful, fully-localized report.
 */
export const openPrintableReport = (data: PrintableReportData): void => {
  const html = buildHtml(data)
  const w = window.open('', 'femo-report', 'width=900,height=1200,scrollbars=yes')
  if (!w) {
    // Pop-up blocked — fall back to data URL so the user can still see it
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.location.href = url
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
}
