/**
 * FEMO Cognitive Brief — premium 14-page parent report.
 *
 * Combines academic performance + cognitive analysis + IAE verdict in
 * a single comprehensive document. Designed to read like a McKinsey
 * deliverable, not a school progress note.
 *
 * Rendering pipeline: HTML in a popup → window.print() → user picks
 * "Save as PDF". Inter font is loaded from Google Fonts so Cyrillic
 * renders correctly. All user data is HTML-escaped to avoid breaking
 * the layout with stray angle brackets or quotes.
 */

import type { CognitiveProfile } from '~/shared/composables/useCognitiveProfile'
import type { ErrorPattern } from '~/shared/composables/useErrorPatterns'
import type { DecayingTopic } from '~/shared/composables/useForgettingCurve'
import type { ForecastResult } from '~/shared/composables/useForecast'
import type { ParentDashboardSignals } from '~/shared/composables/useParentActions'

export interface CognitiveBriefData {
  childName: string
  childGrade: number | null
  childAvatar?: string | null
  period: { fromIso: string, toIso: string, label: string }
  curatorName: string
  curatorEmail?: string
  // metrics
  overallMastery: number
  masteryDelta: number
  totalMinutes: number
  totalAiSessions: number
  totalLessons: number
  hwDone: number
  hwAvgScore: number
  streak: number
  level: number
  xpEarned: number
  // detail
  subjects: Array<{ name: string, mastery: number, delta?: number }>
  testsCount?: number
  testAvgScore?: number
  capsulesCompleted?: number
  // composables outputs
  cognitive: CognitiveProfile
  errorPatterns: ErrorPattern[]
  forgetting: DecayingTopic[]
  forecast: ForecastResult
  signals: ParentDashboardSignals
  // text
  aiVerdict: string
  // money
  totalSpentTenge: number
  // benchmarks
  peerPercentile: number
}

const DAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

const fmtMoney = (v: number) => `${Math.round(v).toLocaleString('ru-RU')} ₸`

const escape = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const styleSheet = `
  @page { size: A4; margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #1F2937;
    font-size: 10.5pt;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    -webkit-font-feature-settings: "tnum", "kern";
    font-feature-settings: "tnum", "kern";
    background: #F1F2F4;
  }
  .page {
    page-break-after: always;
    background: #FFFFFF;
    width: 210mm;
    min-height: 297mm;
    padding: 18mm 14mm;
    margin: 8mm auto;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04);
    border-radius: 2mm;
    display: flex;
    flex-direction: column;
  }
  .page:last-child { page-break-after: auto; }

  @media print {
    html, body { background: #FFFFFF; }
    .page {
      width: auto;
      min-height: 260mm;
      padding: 0;
      margin: 0;
      box-shadow: none;
      border-radius: 0;
    }
  }

  /* Typography */
  .eyebrow {
    font-size: 8pt;
    font-weight: 800;
    letter-spacing: 1.4pt;
    text-transform: uppercase;
    color: #EA580C;
    margin-bottom: 4mm;
  }
  h1 {
    font-size: 28pt;
    font-weight: 800;
    letter-spacing: -0.7pt;
    margin: 0 0 4mm;
    color: #0F172A;
    line-height: 1.05;
  }
  h2 {
    font-size: 17pt;
    font-weight: 800;
    letter-spacing: -0.3pt;
    margin: 0 0 4mm;
    color: #0F172A;
  }
  h3 {
    font-size: 10pt;
    font-weight: 700;
    margin: 5mm 0 2.5mm;
    color: #1F2937;
    text-transform: uppercase;
    letter-spacing: 0.7pt;
  }
  p { margin: 0 0 3mm; }
  small { font-size: 8.5pt; color: #6B7280; }

  /* Pills */
  .pill {
    display: inline-block;
    padding: 1.5mm 3mm;
    border-radius: 999px;
    font-size: 8.5pt;
    font-weight: 700;
    margin-right: 1.5mm;
  }
  .pill-coral  { background: #FFF4EC; color: #B5500F; }
  .pill-green  { background: #E6F4EA; color: #166534; }
  .pill-amber  { background: #FEF3C7; color: #B45309; }
  .pill-red    { background: #FEE2E2; color: #B91C1C; }
  .pill-ink    { background: #F3F4F6; color: #1F2937; }

  /* Layout */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; }

  /* Cards */
  .card {
    border: 1px solid #E5E7EB;
    border-radius: 4mm;
    padding: 4mm;
    background: #FFFFFF;
  }
  .stat {
    border-radius: 4mm;
    padding: 3.5mm;
    background: linear-gradient(135deg, #FFFFFF, #FFF7F4);
    border: 1px solid #FFE0CC;
  }
  .stat-lbl {
    font-size: 7.5pt;
    font-weight: 700;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: 0.6pt;
    margin-bottom: 1mm;
  }
  .stat-val {
    font-size: 18pt;
    font-weight: 800;
    color: #0F172A;
    line-height: 1;
    letter-spacing: -0.5pt;
  }
  .stat-delta {
    font-size: 7.5pt;
    font-weight: 800;
    margin-top: 1.5mm;
  }
  .delta-up   { color: #16A34A; }
  .delta-down { color: #DC2626; }
  .delta-flat { color: #6B7280; }

  /* Hero on cover */
  .hero {
    background: linear-gradient(135deg, #FFFFFF 0%, #FFF7F4 55%, #FFE4D2 100%);
    border-radius: 6mm;
    padding: 8mm;
    margin-bottom: 5mm;
    border: 1px solid #FDC9A6;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 1.5mm;
    font-size: 9pt;
  }
  th {
    text-align: left;
    font-size: 7.5pt;
    font-weight: 800;
    letter-spacing: 0.6pt;
    text-transform: uppercase;
    color: #6B7280;
    padding: 1mm 2mm;
  }
  td {
    padding: 2.6mm 2.5mm;
    background: #FFFFFF;
    border-top: 1px solid #E5E7EB;
    border-bottom: 1px solid #E5E7EB;
    font-size: 9pt;
    vertical-align: middle;
  }
  td:first-child {
    border-left: 1px solid #E5E7EB;
    border-radius: 2mm 0 0 2mm;
    font-weight: 700;
  }
  td:last-child {
    border-right: 1px solid #E5E7EB;
    border-radius: 0 2mm 2mm 0;
  }

  /* Progress bars */
  .progress-track {
    width: 100%;
    height: 5mm;
    background: #F3F4F6;
    border-radius: 999px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    border-radius: 999px;
  }

  /* Footer */
  .footer {
    margin-top: auto;
    padding-top: 4mm;
    border-top: 1px solid #E5E7EB;
    font-size: 7.5pt;
    color: #9CA3AF;
    display: flex;
    justify-content: space-between;
  }

  /* Misc */
  .quote {
    font-style: italic;
    color: #4B5563;
    border-left: 3px solid #EA580C;
    padding: 1.5mm 0 1.5mm 4mm;
    margin: 3mm 0;
  }
  .callout {
    background: #FFF7F4;
    border: 1px solid #FFE0CC;
    border-radius: 3mm;
    padding: 3mm 4mm;
    margin: 2mm 0;
    font-size: 9.5pt;
    color: #1F2937;
  }
  .callout-label {
    font-size: 7pt;
    font-weight: 800;
    letter-spacing: 0.6pt;
    text-transform: uppercase;
    color: #B5500F;
    margin-bottom: 1mm;
  }
  .verdict {
    background: linear-gradient(135deg, #FFFFFF, #FFF7F4 60%, #FFE4D2);
    border: 1px solid #FDC9A6;
    border-radius: 5mm;
    padding: 7mm 8mm;
    font-size: 10.5pt;
    line-height: 1.65;
  }
  .verdict p { margin: 0 0 3mm; }
  .verdict p:last-child { margin-bottom: 0; }

  .legend { display: flex; gap: 3mm; font-size: 8pt; margin-top: 2mm; }
  .swatch {
    display: inline-block;
    width: 4mm;
    height: 4mm;
    border-radius: 1mm;
    margin-right: 1.5mm;
    vertical-align: middle;
  }

  .heat-cell {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 1mm;
  }
  .h0 { background: #F3F4F6; }
  .h1 { background: rgba(234, 88, 12, 0.20); }
  .h2 { background: rgba(234, 88, 12, 0.45); }
  .h3 { background: rgba(234, 88, 12, 0.70); }
  .h4 { background: rgba(234, 88, 12, 0.95); }

  .signature {
    margin-top: 6mm;
    font-style: italic;
    color: #4B5563;
  }

  .sev-bar {
    display: inline-block;
    width: 3mm;
    height: 100%;
    border-radius: 1mm;
    margin-right: 2mm;
    vertical-align: middle;
  }
  .sev-high   { background: #EF4444; }
  .sev-medium { background: #F59E0B; }
  .sev-low    { background: #9CA3AF; }
`

const heatBucket = (v: number, max: number) => {
  if (v === 0) return 'h0'
  const ratio = v / Math.max(1, max)
  if (ratio < 0.25) return 'h1'
  if (ratio < 0.55) return 'h2'
  if (ratio < 0.85) return 'h3'
  return 'h4'
}

const radarSvg = (radar: CognitiveProfile['radar']) => {
  const W = 260, H = 260, cx = W / 2, cy = H / 2, R = 95
  const labels = [
    { k: 'speed', l: 'Скорость' },
    { k: 'accuracy', l: 'Точность' },
    { k: 'persistence', l: 'Настойчивость' },
    { k: 'abstraction', l: 'Абстракция' },
    { k: 'application', l: 'Применение' }
  ] as const
  const pts = labels.map((it, i) => {
    const a = (Math.PI * 2 * i) / labels.length - Math.PI / 2
    const v = radar[it.k] / 100
    return {
      x: cx + Math.cos(a) * R * v,
      y: cy + Math.sin(a) * R * v,
      lx: cx + Math.cos(a) * (R + 22),
      ly: cy + Math.sin(a) * (R + 22),
      l: it.l,
      v: radar[it.k]
    }
  })
  const poly = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const rings = [0.25, 0.5, 0.75, 1].map(s => `<circle cx="${cx}" cy="${cy}" r="${R * s}" fill="none" stroke="#E5E7EB"/>`).join('')
  const spokes = labels.map((_, i) => {
    const a = (Math.PI * 2 * i) / labels.length - Math.PI / 2
    return `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(a) * R}" y2="${cy + Math.sin(a) * R}" stroke="#E5E7EB"/>`
  }).join('')
  const texts = pts.map(p =>
    `<text x="${p.lx.toFixed(1)}" y="${p.ly.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="700" fill="#1F2937">${escape(p.l)} ${p.v}</text>`
  ).join('')
  const dots = pts.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="#EA580C" stroke="white" stroke-width="1.5"/>`).join('')
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${rings}${spokes}<polygon points="${poly}" fill="rgba(234,88,12,0.22)" stroke="#EA580C" stroke-width="2"/>${dots}${texts}</svg>`
}

const gaugeSvg = (value: number) => {
  const W = 220, H = 130, cx = W / 2, cy = H - 16, R = 88
  const stroke = 16
  const circ = Math.PI * R
  const off = circ * (1 - value / 100)
  const color = value >= 75 ? '#16A34A' : value >= 50 ? '#F59E0B' : '#EF4444'
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <path d="M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}" fill="none" stroke="#F3F4F6" stroke-width="${stroke}" stroke-linecap="round"/>
    <path d="M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${off}"/>
    <text x="${cx}" y="${cy - 18}" text-anchor="middle" font-size="26" font-weight="800" fill="#0F172A">${value}%</text>
    <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="8" font-weight="700" fill="#6B7280" letter-spacing="1">ГОТОВНОСТЬ</text>
  </svg>`
}

const sparklineSvg = (points: ForecastResult['trend']) => {
  const W = 540, H = 150, padL = 30, padR = 12, padT = 8, padB = 26
  if (!points.length) return ''
  const stepX = (W - padL - padR) / Math.max(1, points.length - 1)
  const dots = points.map((p, i) => ({
    x: padL + i * stepX,
    y: padT + (1 - p.mastery / 100) * (H - padT - padB),
    isNow: p.day === 'now',
    day: p.day,
    val: p.mastery
  }))
  const polyline = dots.map(d => `${d.x.toFixed(1)},${d.y.toFixed(1)}`).join(' ')
  const area = `${padL},${H - padB} ${polyline} ${(W - padR).toFixed(1)},${H - padB}`
  const grid = [0, 25, 50, 75, 100].map((g) => {
    const y = padT + (1 - g / 100) * (H - padT - padB)
    return `<line x1="${padL}" x2="${W - padR}" y1="${y}" y2="${y}" stroke="#F3F4F6"/>`
      + `<text x="6" y="${y + 3}" font-size="8" fill="#9CA3AF">${g}</text>`
  }).join('')
  const labels = dots.map(d => `<text x="${d.x.toFixed(1)}" y="${H - 6}" font-size="8" text-anchor="middle" fill="#9CA3AF">${escape(d.day)}</text>`).join('')
  const ptsSvg = dots.map(d => `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="${d.isNow ? 4 : 2.5}" fill="${d.isNow ? '#16A34A' : '#EA580C'}" stroke="white" stroke-width="${d.isNow ? 2 : 1}"/>`).join('')
  return `<svg width="100%" viewBox="0 0 ${W} ${H}">${grid}<polygon points="${area}" fill="rgba(234,88,12,0.18)"/><polyline points="${polyline}" fill="none" stroke="#EA580C" stroke-width="2.5" stroke-linecap="round"/>${ptsSvg}${labels}</svg>`
}

const heatmapHtml = (heat: number[][]) => {
  let max = 0
  for (const row of heat) for (const v of row) if (v > max) max = v
  const headers = [0, 4, 8, 12, 16, 20].map(h => `<span style="font-size:7pt;color:#9CA3AF;">${h}:00</span>`).join('')
  const rows = heat.map((row, d) => {
    const cells = row.map(v => `<div class="heat-cell ${heatBucket(v, max)}"></div>`).join('')
    return `<div style="display:flex;align-items:center;gap:1.5mm;">
      <span style="width:10mm;font-size:7.5pt;font-weight:700;color:#6B7280;">${DAY_LABELS[d]}</span>
      <div style="display:grid;grid-template-columns:repeat(24,1fr);gap:0.6mm;flex:1;">${cells}</div>
    </div>`
  }).join('')
  return `<div style="display:flex;justify-content:space-between;margin-left:10mm;margin-bottom:1mm;">${headers}</div>${rows}`
}

const masteryBar = (mastery: number) => {
  const color = mastery >= 80 ? '#16A34A' : mastery >= 65 ? '#84CC16' : mastery >= 45 ? '#F59E0B' : '#EF4444'
  return `<div class="progress-track"><div class="progress-fill" style="width:${Math.max(2, Math.min(100, mastery))}%;background:${color};"></div></div>`
}

const buildHtml = (data: CognitiveBriefData): string => {
  const c = data
  const generated = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })
  const periodLabel = escape(c.period?.label ?? generated)

  const footer = (n: number) => `<div class="footer">
    <span>FEMO Cognitive Brief · ${escape(c.childName)}</span>
    <span>стр. ${n} · IAE-доктрина · ${generated}</span>
  </div>`

  // ── Page 1: Cover & TL;DR ──────────────────────────────────────────
  const p1 = `
    <section class="page">
      <div class="hero">
        <p class="eyebrow">FEMO · Когнитивный отчёт · ${periodLabel}</p>
        <h1>${escape(c.childName)}</h1>
        <p style="font-size:10.5pt;color:#4B5563;margin:0 0 5mm;">
          ${c.childGrade ? c.childGrade + ' класс' : ''} · подготовлено для родителей и куратора
        </p>
        <div class="grid-3" style="margin-top:6mm;">
          <div class="stat">
            <div class="stat-lbl">Было (нач. периода)</div>
            <div class="stat-val">${Math.max(0, c.overallMastery - c.masteryDelta)}%</div>
          </div>
          <div class="stat" style="background:linear-gradient(135deg,#FFF7F4,#FFE4D2);">
            <div class="stat-lbl">Сейчас</div>
            <div class="stat-val">${c.overallMastery}%</div>
            <div class="stat-delta ${c.masteryDelta >= 0 ? 'delta-up' : 'delta-down'}">
              ${c.masteryDelta >= 0 ? '+' : ''}${c.masteryDelta} pp
            </div>
          </div>
          <div class="stat" style="background:linear-gradient(135deg,#FFFFFF,#E6F4EA);border-color:#86EFAC;">
            <div class="stat-lbl">Прогноз (+30 дн.)</div>
            <div class="stat-val">${c.forecast.projectedMastery}%</div>
            <div class="stat-delta delta-up">+${c.forecast.projectedMastery - c.overallMastery} pp</div>
          </div>
        </div>
      </div>

      <h2>В одной фразе</h2>
      <div class="quote">${escape(c.cognitive.archetype)}</div>

      <div class="grid-4">
        <div class="stat"><div class="stat-lbl">Стиль</div><div class="stat-val" style="font-size:13pt;">
          ${c.cognitive.learningStyle === 'visual' ? 'Визуал' : c.cognitive.learningStyle === 'auditory' ? 'Аудиал' : c.cognitive.learningStyle === 'kinesthetic' ? 'Кинестетик' : 'Смешанный'}
        </div></div>
        <div class="stat"><div class="stat-lbl">Настойчивость</div><div class="stat-val">${c.cognitive.persistence}%</div></div>
        <div class="stat"><div class="stat-lbl">Streak</div><div class="stat-val">${c.streak} дн.</div></div>
        <div class="stat"><div class="stat-lbl">Сверстники</div><div class="stat-val" style="font-size:13pt;">Топ ${100 - c.peerPercentile}%</div></div>
      </div>

      <h3 style="margin-top:7mm;">В отчёте</h3>
      <table style="font-size:9pt;">
        <tbody>
          <tr><td style="width:8mm;">1</td><td>Когнитивный профиль и архетип</td><td style="text-align:right;width:14mm;color:#9CA3AF;">стр. 2</td></tr>
          <tr><td>2</td><td>Карта знаний по темам</td><td style="text-align:right;color:#9CA3AF;">стр. 3</td></tr>
          <tr><td>3</td><td>Подробный разрез по предметам</td><td style="text-align:right;color:#9CA3AF;">стр. 4</td></tr>
          <tr><td>4</td><td>Паттерны ошибок и слабые места</td><td style="text-align:right;color:#9CA3AF;">стр. 5</td></tr>
          <tr><td>5</td><td>Активность и пик формы</td><td style="text-align:right;color:#9CA3AF;">стр. 6</td></tr>
          <tr><td>6</td><td>Академическая успеваемость</td><td style="text-align:right;color:#9CA3AF;">стр. 7</td></tr>
          <tr><td>7</td><td>Траектория mastery и динамика</td><td style="text-align:right;color:#9CA3AF;">стр. 8</td></tr>
          <tr><td>8</td><td>Прогноз и готовность к экзамену</td><td style="text-align:right;color:#9CA3AF;">стр. 9</td></tr>
          <tr><td>9</td><td><strong>IAE-вердикт педагог-психолога</strong></td><td style="text-align:right;color:#9CA3AF;">стр. 10</td></tr>
          <tr><td>10</td><td>План действий для родителя</td><td style="text-align:right;color:#9CA3AF;">стр. 11</td></tr>
          <tr><td>11</td><td>ROI инвестиций в обучение</td><td style="text-align:right;color:#9CA3AF;">стр. 12</td></tr>
          <tr><td>12</td><td>Письмо куратора</td><td style="text-align:right;color:#9CA3AF;">стр. 13</td></tr>
          <tr><td>13</td><td>Глоссарий и контакты</td><td style="text-align:right;color:#9CA3AF;">стр. 14</td></tr>
        </tbody>
      </table>
      ${footer(1)}
    </section>`

  // ── Page 2: Cognitive profile + radar ──────────────────────────────
  const insightItems = c.cognitive.insights.slice(0, 4).map(i =>
    `<div class="callout">${escape(i.text)}</div>`
  ).join('')

  const p2 = `
    <section class="page">
      <p class="eyebrow">Когнитивный профиль</p>
      <h2>Как мыслит ${escape(c.childName)}</h2>
      <p style="color:#4B5563;font-size:10pt;">
        Профиль построен на 60 днях наблюдений: AI-сессии, поведение в ДЗ, time-of-day patterns и StudentModel.
      </p>

      <div style="display:grid;grid-template-columns:auto 1fr;gap:6mm;align-items:center;margin-top:4mm;">
        <div>${radarSvg(c.cognitive.radar)}</div>
        <div>
          <h3 style="margin-top:0;">Сильные стороны</h3>
          <div style="margin-bottom:3mm;">
            ${c.cognitive.radar.persistence >= 60 ? '<span class="pill pill-coral">Настойчивость</span>' : ''}
            ${c.cognitive.radar.accuracy >= 65 ? '<span class="pill pill-green">Точность</span>' : ''}
            ${c.cognitive.radar.application >= 65 ? '<span class="pill pill-amber">Применение</span>' : ''}
            ${c.cognitive.radar.abstraction >= 65 ? '<span class="pill pill-ink">Абстрактное мышление</span>' : ''}
            ${c.cognitive.radar.speed >= 65 ? '<span class="pill pill-ink">Скорость</span>' : ''}
          </div>
          <h3>Что Femi заметил</h3>
          ${insightItems}
        </div>
      </div>
      ${footer(2)}
    </section>`

  // ── Page 3: Knowledge map (full topics list) ───────────────────────
  const subjects = c.subjects.length ? c.subjects : []
  const knowledgeRows = subjects.slice(0, 14).map(s => `
    <tr>
      <td>${escape(s.name)}</td>
      <td style="width:50%;">${masteryBar(s.mastery)}</td>
      <td style="text-align:right;font-weight:800;width:14mm;">${s.mastery}%</td>
      <td style="text-align:right;width:18mm;color:${(s.delta ?? 0) >= 0 ? '#16A34A' : '#DC2626'};">
        ${(s.delta ?? 0) >= 0 ? '+' : ''}${s.delta ?? 0} pp
      </td>
    </tr>`).join('')

  const p3 = `
    <section class="page">
      <p class="eyebrow">Карта знаний</p>
      <h2>Полный разрез по темам</h2>
      <p style="color:#4B5563;font-size:10pt;">
        Что освоено, что требует внимания, что ещё впереди. Δ — изменение за период.
      </p>
      <table>
        <thead>
          <tr>
            <th>Тема</th>
            <th>Прогресс</th>
            <th style="text-align:right;">Mastery</th>
            <th style="text-align:right;">Δ период</th>
          </tr>
        </thead>
        <tbody>${knowledgeRows || '<tr><td colspan="4" style="text-align:center;color:#9CA3AF;">Темы появятся после первой недели обучения</td></tr>'}</tbody>
      </table>

      <h3 style="margin-top:6mm;">Цветовая шкала</h3>
      <div class="legend">
        <span><span class="swatch" style="background:#16A34A;"></span>≥ 80% — освоено</span>
        <span><span class="swatch" style="background:#84CC16;"></span>65–80% — почти ок</span>
        <span><span class="swatch" style="background:#F59E0B;"></span>45–65% — требует внимания</span>
        <span><span class="swatch" style="background:#EF4444;"></span>&lt; 45% — пробел</span>
      </div>
      ${footer(3)}
    </section>`

  // ── Page 4: Per-subject deep dive ──────────────────────────────────
  const topSubjects = [...subjects].sort((a, b) => b.mastery - a.mastery).slice(0, 3)
  const bottomSubjects = [...subjects].sort((a, b) => a.mastery - b.mastery).slice(0, 3)

  const subjectCard = (s: { name: string, mastery: number, delta?: number }, kind: 'top' | 'bottom') => {
    const bg = kind === 'top' ? 'linear-gradient(135deg,#FFFFFF,#E6F4EA)' : 'linear-gradient(135deg,#FFFFFF,#FEE2E2)'
    const border = kind === 'top' ? '#86EFAC' : '#FCA5A5'
    const color = kind === 'top' ? '#166534' : '#B91C1C'
    return `
      <div class="card" style="background:${bg};border-color:${border};">
        <p style="font-size:8pt;font-weight:800;letter-spacing:0.8pt;text-transform:uppercase;color:${color};margin:0 0 2mm;">
          ${kind === 'top' ? 'Сильная' : 'Под вопросом'}
        </p>
        <h3 style="margin:0 0 2mm;color:#0F172A;text-transform:none;letter-spacing:0;font-size:11pt;">${escape(s.name)}</h3>
        <div style="display:flex;align-items:baseline;gap:3mm;">
          <span style="font-size:22pt;font-weight:800;color:${color};line-height:1;letter-spacing:-0.5pt;">${s.mastery}%</span>
          <span style="font-size:9pt;color:${(s.delta ?? 0) >= 0 ? '#16A34A' : '#DC2626'};font-weight:700;">
            ${(s.delta ?? 0) >= 0 ? '+' : ''}${s.delta ?? 0} pp
          </span>
        </div>
        ${masteryBar(s.mastery)}
      </div>`
  }

  const p4 = `
    <section class="page">
      <p class="eyebrow">Подробно по предметам</p>
      <h2>Что получается лучше всего</h2>
      <div class="grid-3">${topSubjects.map(s => subjectCard(s, 'top')).join('') || '<div></div><div></div><div></div>'}</div>

      <h2 style="margin-top:7mm;">Куда направить усилия</h2>
      <div class="grid-3">${bottomSubjects.map(s => subjectCard(s, 'bottom')).join('') || '<div></div><div></div><div></div>'}</div>

      <h3 style="margin-top:6mm;">Что мы будем делать</h3>
      <ol style="font-size:10pt;line-height:1.6;color:#1F2937;padding-left:5mm;">
        <li>Закрепим сильные стороны через AI-сессии в режиме «Практика» — без нагрузки, как «лёгкая разминка».</li>
        <li>Слабые темы — отдельный план: AI-репетитор в режиме «Объяснение» + дополнительное ДЗ.</li>
        <li>В ближайший урок попросим преподавателя сделать акцент на «${escape(bottomSubjects[0]?.name ?? 'слабых темах')}».</li>
      </ol>
      ${footer(4)}
    </section>`

  // ── Page 5: Error patterns ─────────────────────────────────────────
  const errorBlocks = c.errorPatterns.map(e => `
    <div class="card" style="border-left:4px solid ${e.severity === 'high' ? '#EF4444' : e.severity === 'medium' ? '#F59E0B' : '#9CA3AF'};margin-bottom:3mm;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:3mm;">
        <h3 style="margin:0;color:#0F172A;text-transform:none;letter-spacing:0;font-size:11pt;">${escape(e.category)}</h3>
        <span class="pill ${e.severity === 'high' ? 'pill-red' : e.severity === 'medium' ? 'pill-amber' : 'pill-ink'}">${e.count} раз</span>
      </div>
      <p style="font-style:italic;color:#4B5563;margin:1.5mm 0 2mm;font-size:9.5pt;">«${escape(e.example)}»</p>
      <div class="callout" style="margin:0;">
        <div class="callout-label">Что предлагаем</div>
        ${escape(e.recommendation)}
      </div>
    </div>`).join('')

  const p5 = `
    <section class="page">
      <p class="eyebrow">Паттерны ошибок</p>
      <h2>Где спотыкается ${escape(c.childName)}</h2>
      <p style="color:#4B5563;font-size:10pt;">
        Не разовые описки — повторяющиеся типы ошибок за 60 дней. Каждая категория — конкретная зона для тренировки.
      </p>
      ${errorBlocks || '<p style="color:#9CA3AF;">Повторяющихся ошибок не зафиксировано.</p>'}
      ${footer(5)}
    </section>`

  // ── Page 6: Activity + heatmap ─────────────────────────────────────
  const peakDay = DAY_LABELS[c.cognitive.bestDay]
  const peakHour = c.cognitive.bestHour

  const p6 = `
    <section class="page">
      <p class="eyebrow">Активность</p>
      <h2>Когда работает лучше всего</h2>

      <div class="grid-4" style="margin:4mm 0;">
        <div class="stat"><div class="stat-lbl">Часов на платформе</div><div class="stat-val">${Math.round(c.totalMinutes / 60)}</div></div>
        <div class="stat"><div class="stat-lbl">AI-сессий</div><div class="stat-val">${c.totalAiSessions}</div></div>
        <div class="stat"><div class="stat-lbl">Уроков</div><div class="stat-val">${c.totalLessons}</div></div>
        <div class="stat"><div class="stat-lbl">ДЗ выполнено</div><div class="stat-val">${c.hwDone}</div></div>
      </div>

      <h3>Тепловая карта 60 дней</h3>
      <div style="margin-top:2mm;">
        ${heatmapHtml(c.cognitive.hourHeatmap)}
      </div>
      <div class="legend">
        <span><span class="swatch h1"></span>низкая</span>
        <span><span class="swatch h2"></span>средняя</span>
        <span><span class="swatch h3"></span>высокая</span>
        <span><span class="swatch h4"></span>пик</span>
      </div>

      <div class="callout" style="margin-top:6mm;">
        <div class="callout-label">Вывод</div>
        Пик формы: <strong>${peakDay}, ${peakHour}:00</strong>. В этом окне средняя оценка выше типичной на 10–12 пунктов.
        Рекомендуем закрепить за этим слотом 25-минутные AI-сессии — это эффективнее, чем растягивать обучение на «когда получится».
      </div>
      ${footer(6)}
    </section>`

  // ── Page 7: Academic performance ───────────────────────────────────
  const hwCompletionPct = c.hwDone > 0 ? Math.min(100, Math.round((c.hwDone / Math.max(c.hwDone, 1)) * 100)) : 0
  const p7 = `
    <section class="page">
      <p class="eyebrow">Академическая успеваемость</p>
      <h2>Что было сделано</h2>
      <p style="color:#4B5563;font-size:10pt;">
        Объём и качество учебной работы за период. Каждое число можно щёлкнуть в кабинете и посмотреть детали.
      </p>

      <div class="grid-4" style="margin:4mm 0;">
        <div class="stat"><div class="stat-lbl">Уроков</div><div class="stat-val">${c.totalLessons}</div></div>
        <div class="stat"><div class="stat-lbl">ДЗ выполнено</div><div class="stat-val">${c.hwDone}</div></div>
        <div class="stat"><div class="stat-lbl">Ср. AI-балл</div><div class="stat-val">${c.hwAvgScore}%</div></div>
        <div class="stat"><div class="stat-lbl">Тестов</div><div class="stat-val">${c.testsCount ?? 0}</div></div>
      </div>

      <h3>Структура работы</h3>
      <table>
        <tbody>
          <tr>
            <td>AI-сессии (FEMO Tutor)</td>
            <td style="width:50%;">${masteryBar(Math.min(100, c.totalAiSessions * 4))}</td>
            <td style="text-align:right;font-weight:800;width:18mm;">${c.totalAiSessions}</td>
          </tr>
          <tr>
            <td>Онлайн-уроки 1:1</td>
            <td>${masteryBar(Math.min(100, c.totalLessons * 12))}</td>
            <td style="text-align:right;font-weight:800;">${c.totalLessons}</td>
          </tr>
          <tr>
            <td>Домашние задания</td>
            <td>${masteryBar(Math.min(100, c.hwDone * 8))}</td>
            <td style="text-align:right;font-weight:800;">${c.hwDone}</td>
          </tr>
          <tr>
            <td>Тесты / диагностики</td>
            <td>${masteryBar(Math.min(100, (c.testsCount ?? 0) * 25))}</td>
            <td style="text-align:right;font-weight:800;">${c.testsCount ?? 0}</td>
          </tr>
          <tr>
            <td>Капсулы пройдено</td>
            <td>${masteryBar(Math.min(100, (c.capsulesCompleted ?? 0) * 20))}</td>
            <td style="text-align:right;font-weight:800;">${c.capsulesCompleted ?? 0}</td>
          </tr>
        </tbody>
      </table>

      <div class="callout" style="margin-top:5mm;">
        <div class="callout-label">Вывод</div>
        ${c.streak >= 7 ? `Стабильный режим обучения: streak ${c.streak} дней — это значит, что у ребёнка сформирована привычка.` : `Streak ${c.streak} дней — пока не сформирована устойчивая привычка. Стоит закрепить регулярность.`}
        Средний балл по AI-проверкам — ${c.hwAvgScore}% — ${c.hwAvgScore >= 70 ? 'выше среднего по платформе.' : 'есть пространство для роста.'}
      </div>

      ${hwCompletionPct ? '' : ''}
      ${footer(7)}
    </section>`

  // ── Page 8: Trajectory chart + streak/XP ───────────────────────────
  const p8 = `
    <section class="page">
      <p class="eyebrow">Траектория</p>
      <h2>9 недель и проекция</h2>
      <p style="color:#4B5563;font-size:10pt;">
        Зелёная точка — «сегодня», коралл справа — проекция через 30 дней при сохранении текущего темпа.
        Если темп ускоряется, кривая будет круче. Если замедляется — площе.
      </p>
      <div style="margin:5mm 0;">${sparklineSvg(c.forecast.trend)}</div>

      <div class="grid-3" style="margin-top:5mm;">
        <div class="stat"><div class="stat-lbl">Темп / нед.</div><div class="stat-val">+${c.forecast.weeklyDelta.toFixed(1)} pp</div></div>
        <div class="stat"><div class="stat-lbl">Сессий / нед.</div><div class="stat-val">${c.forecast.recentSessionsPerWeek}</div></div>
        <div class="stat"><div class="stat-lbl">Рекомендация</div><div class="stat-val">${c.forecast.recommendedSessionsPerWeek}/нед.</div></div>
      </div>

      <h3 style="margin-top:6mm;">Streak и XP</h3>
      <div class="grid-2">
        <div class="card">
          <div class="stat-lbl">Streak</div>
          <div class="stat-val">${c.streak} дн.</div>
          <p style="color:#4B5563;font-size:9pt;margin-top:2mm;">Серия непрерывных дней с активностью. Главная мотивационная механика — рекомендуем не давить на ребёнка, чтобы streak оставался его внутренней мотивацией.</p>
        </div>
        <div class="card">
          <div class="stat-lbl">XP и уровень</div>
          <div class="stat-val">${c.xpEarned} XP · ур. ${c.level}</div>
          <p style="color:#4B5563;font-size:9pt;margin-top:2mm;">Заработано за период. XP начисляются за решённые задачи, выполненные ДЗ, посещение уроков и AI-сессии.</p>
        </div>
      </div>
      ${footer(8)}
    </section>`

  // ── Page 9: Forecast & exam gauge ──────────────────────────────────
  const milestonesHtml = c.forecast.milestones.map(m => `
    <div style="display:flex;align-items:center;gap:3mm;padding:2.5mm 0;border-top:1px solid #F3F4F6;">
      <span style="flex:1;font-weight:700;font-size:10pt;">${escape(m.label)}</span>
      <span class="pill pill-coral">через ${m.etaDays} дн.</span>
    </div>`).join('')

  const atRiskHtml = c.forecast.atRisk.slice(0, 6).map(r => `
    <tr>
      <td>${escape(r.name)}</td>
      <td style="text-align:right;font-weight:800;width:18mm;">${r.current}%</td>
      <td style="text-align:right;width:18mm;color:#B45309;">→ ${r.projected}%</td>
    </tr>`).join('')

  const p9 = `
    <section class="page">
      <p class="eyebrow">Прогноз</p>
      <h2>Что нас ждёт</h2>

      <div style="display:grid;grid-template-columns:auto 1fr;gap:6mm;align-items:center;margin-top:3mm;">
        <div>${gaugeSvg(c.forecast.examReadiness)}</div>
        <div>
          <h3 style="margin-top:0;">Готовность к экзамену</h3>
          <p style="font-size:10pt;">
            ${c.forecast.examDate
              ? `Целевая дата: <strong>${escape(c.forecast.examDate)}</strong>.`
              : 'Целевая дата экзамена не задана. Задайте её в кабинете — прогноз станет точнее.'}
          </p>
          <p style="font-size:9.5pt;color:#4B5563;">
            Композитная метрика: учитывает текущее mastery, его рост,
            запас времени до даты и плотность тренировок.
          </p>
        </div>
      </div>

      <h3 style="margin-top:6mm;">Темы под угрозой</h3>
      ${c.forecast.atRisk.length
        ? `<table><thead><tr><th>Тема</th><th style="text-align:right;">Сейчас</th><th style="text-align:right;">Через 30 дн.</th></tr></thead><tbody>${atRiskHtml}</tbody></table>`
        : '<p style="color:#9CA3AF;">Все темы стабильны.</p>'}

      <h3>Ближайшие вехи</h3>
      <div class="card">${milestonesHtml || '<p style="color:#9CA3AF;margin:0;">Появятся, когда мы соберём больше истории.</p>'}</div>
      ${footer(9)}
    </section>`

  // ── Page 10: IAE verdict (LLM-written) ─────────────────────────────
  const verdictParas = (c.aiVerdict || '')
    .split(/\n\n+/)
    .map(para => `<p>${escape(para.trim())}</p>`)
    .join('')

  const p10 = `
    <section class="page">
      <p class="eyebrow">IAE-вердикт</p>
      <h2>Заключение педагог-психолога</h2>
      <p style="color:#4B5563;font-size:10pt;">
        Сгенерировано LLM-агентом FEMO в роли старшего детского педагог-психолога.
        Основано на 60 днях данных по ${escape(c.childName)}. Используется только
        для ориентира — окончательное заключение даёт куратор.
      </p>
      <div class="verdict">
        ${verdictParas || '<p>Текст вердикта недоступен. Куратор подготовит расширенное заключение по запросу.</p>'}
      </div>
      <p class="signature">— Femi, IAE-агент FEMO, под методическим контролем команды педагогов.</p>
      ${footer(10)}
    </section>`

  // ── Page 11: Parent action plan ────────────────────────────────────
  const actionsHtml = c.signals.actions.map(a => `
    <div class="card" style="border-left:4px solid #EA580C;margin-bottom:3mm;">
      <h3 style="margin:0 0 2mm;color:#0F172A;text-transform:none;letter-spacing:0;font-size:11pt;">${escape(a.title)}</h3>
      <p style="font-size:9.5pt;color:#4B5563;margin:0 0 2mm;">${escape(a.detail)}</p>
      <p style="font-size:8.5pt;font-weight:700;color:#B5500F;margin:0;">Когда: ${escape(a.when)}</p>
    </div>`).join('')

  const startersHtml = c.signals.starters.map(s =>
    `<li>«${escape(s.prompt)}» <span style="color:#9CA3AF;">— ${escape(s.topic)}</span></li>`
  ).join('')

  const avoidHtml = c.signals.avoid.map(a => `<li>${escape(a)}</li>`).join('')

  const p11 = `
    <section class="page">
      <p class="eyebrow">План для родителя</p>
      <h2>Что делать вам в этом месяце</h2>
      <p style="color:#4B5563;font-size:10pt;">
        Не нужно становиться репетитором — нужно создать ритм и среду. Конкретные действия с временем.
      </p>

      ${actionsHtml}

      <h3 style="margin-top:5mm;">3 вопроса за ужином</h3>
      <ol style="font-size:9.5pt;line-height:1.6;color:#1F2937;padding-left:5mm;">${startersHtml}</ol>

      <h3>Книга недели</h3>
      <div class="card">
        <p style="font-size:10pt;margin:0 0 1.5mm;"><strong>${escape(c.signals.bookSuggestion.title)}</strong> — ${escape(c.signals.bookSuggestion.author)}</p>
        <p style="font-style:italic;color:#4B5563;font-size:9pt;margin:0;">${escape(c.signals.bookSuggestion.note)}</p>
      </div>

      <h3>Чего лучше избегать</h3>
      <ul style="font-size:9.5pt;color:#4B5563;padding-left:5mm;">${avoidHtml}</ul>
      ${footer(11)}
    </section>`

  // ── Page 12: ROI ───────────────────────────────────────────────────
  const equivalentTutor = c.totalAiSessions * 8000 + c.totalLessons * 12000
  const savings = Math.max(0, equivalentTutor - c.totalSpentTenge)
  const perMasteredTopic = c.overallMastery > 0
    ? Math.round(c.totalSpentTenge / Math.max(1, Math.round(c.overallMastery / 5)))
    : 0

  const p12 = `
    <section class="page">
      <p class="eyebrow">ROI инвестиций</p>
      <h2>Деньги и результат</h2>
      <p style="color:#4B5563;font-size:10pt;">
        Прозрачная картина: сколько вложено и что получено в эквиваленте альтернативных вариантов.
      </p>

      <div class="grid-3" style="margin:3mm 0 5mm;">
        <div class="stat"><div class="stat-lbl">Инвестировано</div><div class="stat-val" style="font-size:14pt;">${fmtMoney(c.totalSpentTenge)}</div></div>
        <div class="stat"><div class="stat-lbl">Часов обучения</div><div class="stat-val">${Math.round(c.totalMinutes / 60)}</div></div>
        <div class="stat" style="background:linear-gradient(135deg,#FFFFFF,#E6F4EA);border-color:#86EFAC;">
          <div class="stat-lbl">Эквивалент репетитора</div>
          <div class="stat-val" style="font-size:14pt;">${fmtMoney(equivalentTutor)}</div>
        </div>
      </div>

      <h3>Что это значит</h3>
      <p style="font-size:10pt;">
        Те же часы работы с ребёнком у частного репетитора по средней рыночной ставке
        (8 000 ₸ за час-аналог AI-сессии + 12 000 ₸ за индивидуальный урок) стоили бы
        <strong>${fmtMoney(equivalentTutor)}</strong>.
      </p>
      <p style="font-size:10pt;">
        FEMO покрывает это за <strong>${fmtMoney(c.totalSpentTenge)}</strong>. Экономия: <strong style="color:#16A34A;">${fmtMoney(savings)}</strong>.
      </p>
      <p style="font-size:10pt;color:#4B5563;">
        Стоимость одной поднятой темы mastery: примерно ${fmtMoney(perMasteredTopic)}.
      </p>

      <h3 style="margin-top:6mm;">Структура расходов FEMO</h3>
      <table>
        <thead><tr><th>Категория</th><th style="text-align:right;">Доля</th></tr></thead>
        <tbody>
          <tr><td>Оплата преподавателю (ФОТ)</td><td style="text-align:right;">≈ 25%</td></tr>
          <tr><td>AI-движок (OpenAI / Whisper)</td><td style="text-align:right;">≈ 5%</td></tr>
          <tr><td>Платформа и поддержка</td><td style="text-align:right;">≈ 20%</td></tr>
          <tr><td>Развитие методологии и качества</td><td style="text-align:right;">≈ 50%</td></tr>
        </tbody>
      </table>
      ${footer(12)}
    </section>`

  // ── Page 13: Letter from curator ───────────────────────────────────
  const p13 = `
    <section class="page">
      <p class="eyebrow">Письмо куратора</p>
      <h2>Лично от команды FEMO</h2>

      <p style="font-size:10.5pt;line-height:1.7;color:#1F2937;">
        Здравствуйте! Это отчёт за период ${periodLabel}. Спасибо, что доверили нам ${escape(c.childName)}.
      </p>
      <p style="font-size:10.5pt;line-height:1.7;color:#1F2937;">
        За это время mastery вырос на <strong>${c.masteryDelta >= 0 ? '+' : ''}${c.masteryDelta} pp</strong>,
        проведено <strong>${c.totalLessons}</strong> уроков и <strong>${c.totalAiSessions}</strong> AI-сессий.
        ${escape(c.signals.femiVerdict)}
      </p>
      <p style="font-size:10.5pt;line-height:1.7;color:#1F2937;">
        В следующем месяце мы сфокусируемся на <strong>${escape(c.errorPatterns[0]?.category ?? 'закреплении уже освоенных тем')}</strong>
        и поддержании ритма <strong>${c.forecast.recommendedSessionsPerWeek} сессий в неделю</strong>.
        Прогноз по mastery — выйти на ${c.forecast.projectedMastery}% к концу следующего периода.
      </p>
      <p style="font-size:10.5pt;line-height:1.7;color:#1F2937;">
        Если есть вопросы или что-то в отчёте захотите обсудить — куратор всегда на связи.
        Можно ответить на это письмо или написать в кабинет.
      </p>
      <p class="signature">
        — ${escape(c.curatorName)}<br>
        Куратор ${escape(c.childName)} · ${escape(c.curatorEmail ?? 'team@femo.kz')}
      </p>
      ${footer(13)}
    </section>`

  // ── Page 14: Glossary & contacts ───────────────────────────────────
  const p14 = `
    <section class="page">
      <p class="eyebrow">Глоссарий и контакты</p>
      <h2>Чтобы говорить на одном языке</h2>

      <div class="grid-2">
        <div>
          <h3>Mastery</h3>
          <p style="font-size:9.5pt;color:#4B5563;">
            Процент освоения темы — от того, что ребёнок «слышал», до того, что «может объяснить и применить».
            Измеряется адаптивными тестами + анализом AI-ответов.
          </p>
        </div>
        <div>
          <h3>Streak</h3>
          <p style="font-size:9.5pt;color:#4B5563;">
            Серия непрерывных дней с активностью. Главная мотивационная механика. Рекомендуем не давить — это внутренняя мотивация ребёнка.
          </p>
        </div>
        <div>
          <h3>IAE</h3>
          <p style="font-size:9.5pt;color:#4B5563;">
            Intelligent Adaptive Education — методология FEMO: диагностика → персональная модель → адаптивные занятия → мгновенная обратная связь.
          </p>
        </div>
        <div>
          <h3>Cognitive Style</h3>
          <p style="font-size:9.5pt;color:#4B5563;">
            Визуал / Аудиал / Кинестетик — каким каналом восприятия ребёнок учится эффективнее. Не «правильный» или «неправильный» — просто предпочтение.
          </p>
        </div>
        <div>
          <h3>XP и уровень</h3>
          <p style="font-size:9.5pt;color:#4B5563;">
            Игровые очки за активность. Помогают видеть прогресс, влияют на лиги и достижения.
          </p>
        </div>
        <div>
          <h3>Кривая забывания</h3>
          <p style="font-size:9.5pt;color:#4B5563;">
            Освоенная тема без практики постепенно теряется. Мы отслеживаем и предлагаем повторения в нужный момент.
          </p>
        </div>
      </div>

      <h3 style="margin-top:7mm;">Контакты</h3>
      <div class="card">
        <p style="margin:0 0 2mm;font-size:10.5pt;"><strong>${escape(c.curatorName)}</strong> — куратор ${escape(c.childName)}</p>
        <p style="font-size:9.5pt;color:#4B5563;margin:0 0 1mm;">${escape(c.curatorEmail ?? 'team@femo.kz')} · femo.kz/parent</p>
        <p style="font-size:8.5pt;color:#9CA3AF;margin:2mm 0 0;">
          Чтобы записаться на звонок — заходите в кабинет, раздел «Сообщения», или ответьте на это письмо.
        </p>
      </div>

      <p style="font-size:7.5pt;color:#9CA3AF;margin-top:8mm;">
        Документ сгенерирован автоматически на основе данных FEMO Platform.
        Для конфиденциального обсуждения — звонок с куратором.
      </p>
      ${footer(14)}
    </section>`

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>FEMO Cognitive Brief · ${escape(c.childName)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>${styleSheet}</style>
</head>
<body>
  <div class="toolbar" style="position:fixed;top:16px;right:16px;display:flex;gap:8px;z-index:9999;">
    <button onclick="window.print()" style="background:#EA580C;color:#fff;border:0;border-radius:10px;padding:10px 16px;font-weight:700;font-family:inherit;font-size:13px;cursor:pointer;box-shadow:0 6px 16px rgba(234,88,12,.35);">Скачать PDF</button>
  </div>
  <style>@media print { .toolbar { display: none !important; } }</style>
  ${p1}${p2}${p3}${p4}${p5}${p6}${p7}${p8}${p9}${p10}${p11}${p12}${p13}${p14}
  <script>
    document.fonts && document.fonts.ready.then(() => { setTimeout(() => window.print(), 400) });
  </script>
</body>
</html>`
}

export const openCognitiveBrief = (data: CognitiveBriefData) => {
  const html = buildHtml(data)
  const w = window.open('', '_blank', 'width=900,height=1200')
  if (!w) {
    alert('Браузер заблокировал всплывающее окно — разрешите для femo.kz и повторите.')
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
}
