import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from './datetime'
import { formatPercent } from './formatters'

interface ReportOptions {
  title: string
  subtitle?: string
  generatedAt?: Date
}

export const PDF_FONT = 'Roboto'

let fontLoadPromise: Promise<{ regular: string, bold: string }> | null = null

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

const loadFontBase64 = async (url: string): Promise<string> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load font ${url}: ${res.status}`)
  return arrayBufferToBase64(await res.arrayBuffer())
}

const loadFonts = (): Promise<{ regular: string, bold: string }> => {
  if (!fontLoadPromise) {
    fontLoadPromise = Promise.all([
      loadFontBase64('/fonts/Roboto-Regular.ttf'),
      loadFontBase64('/fonts/Roboto-Bold.ttf')
    ]).then(([regular, bold]) => ({ regular, bold }))
  }
  return fontLoadPromise
}

export const registerPdfFonts = async (doc: jsPDF): Promise<void> => {
  const { regular, bold } = await loadFonts()
  doc.addFileToVFS('Roboto-Regular.ttf', regular)
  doc.addFont('Roboto-Regular.ttf', PDF_FONT, 'normal')
  doc.addFileToVFS('Roboto-Bold.ttf', bold)
  doc.addFont('Roboto-Bold.ttf', PDF_FONT, 'bold')
  doc.setFont(PDF_FONT, 'normal')
}

const registerFonts = registerPdfFonts

const createBasePdf = async (options: ReportOptions): Promise<jsPDF> => {
  const doc = new jsPDF()
  await registerFonts(doc)
  const { title, subtitle, generatedAt = new Date() } = options

  doc.setFont(PDF_FONT, 'bold')
  doc.setFontSize(20)
  doc.text('FEMO Platform', 14, 20)

  doc.setFont(PDF_FONT, 'bold')
  doc.setFontSize(14)
  doc.text(title, 14, 32)

  if (subtitle) {
    doc.setFont(PDF_FONT, 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(subtitle, 14, 40)
    doc.setTextColor(0)
  }

  doc.setFont(PDF_FONT, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(`Дата: ${formatDate(generatedAt)}`, 14, subtitle ? 48 : 40)
  doc.setTextColor(0)

  return doc
}

const tableStyles = {
  styles: { font: PDF_FONT, fontStyle: 'normal' as const },
  headStyles: { font: PDF_FONT, fontStyle: 'bold' as const, fillColor: [22, 163, 74] as [number, number, number] }
}

export const generateStudentReport = async (data: {
  studentName: string
  period: string
  subjects: Array<{
    name: string
    mastery: number
    lessonsAttended: number
    homeworkCompleted: number
    testScore: number
  }>
  summary: {
    totalLessons: number
    totalHomework: number
    averageMastery: number
    xpEarned: number
    streak: number
  }
}): Promise<jsPDF> => {
  const doc = await createBasePdf({
    title: `Отчёт: ${data.studentName}`,
    subtitle: `Период: ${data.period}`
  })

  let y = 56

  doc.setFont(PDF_FONT, 'bold')
  doc.setFontSize(12)
  doc.text('Общая сводка', 14, y)
  y += 8

  autoTable(doc, {
    startY: y,
    head: [['Показатель', 'Значение']],
    body: [
      ['Уроков посещено', String(data.summary.totalLessons)],
      ['ДЗ выполнено', String(data.summary.totalHomework)],
      ['Средний уровень', formatPercent(data.summary.averageMastery / 100)],
      ['XP заработано', String(data.summary.xpEarned)],
      ['Streak', `${data.summary.streak} дней`]
    ],
    theme: 'grid',
    ...tableStyles
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 16

  doc.setFont(PDF_FONT, 'bold')
  doc.setFontSize(12)
  doc.text('По предметам', 14, y)
  y += 8

  autoTable(doc, {
    startY: y,
    head: [['Предмет', 'Уровень', 'Уроки', 'ДЗ', 'Тесты']],
    body: data.subjects.map(s => [
      s.name,
      formatPercent(s.mastery / 100),
      String(s.lessonsAttended),
      String(s.homeworkCompleted),
      formatPercent(s.testScore / 100)
    ]),
    theme: 'grid',
    ...tableStyles
  })

  return doc
}

export const generateDiagnosticReport = async (data: {
  studentName: string
  subjectName: string
  overallScore: number
  topicResults: Record<string, { mastery: number, correct: number, total: number }>
  totalCorrect: number
  totalQuestions: number
  totalTime: number
  speed: string
  difficultyLevel: number
}): Promise<jsPDF> => {
  const doc = await createBasePdf({
    title: `Диагностика: ${data.subjectName}`,
    subtitle: `Ученик: ${data.studentName}`
  })

  let y = 56

  doc.setFont(PDF_FONT, 'bold')
  doc.setFontSize(12)
  doc.text('Общий результат', 14, y)
  y += 8

  const mins = Math.floor(data.totalTime / 60)
  const secs = data.totalTime % 60
  const timeStr = `${mins} мин ${secs} сек`

  autoTable(doc, {
    startY: y,
    head: [['Показатель', 'Значение']],
    body: [
      ['Общий балл', `${data.overallScore}%`],
      ['Правильных ответов', `${data.totalCorrect} / ${data.totalQuestions}`],
      ['Время прохождения', timeStr],
      ['Скорость', data.speed === 'fast' ? 'Быстрая' : data.speed === 'slow' ? 'Медленная' : 'Нормальная'],
      ['Рекомендуемый уровень', String(data.difficultyLevel)]
    ],
    theme: 'grid',
    ...tableStyles
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 16

  doc.setFont(PDF_FONT, 'bold')
  doc.setFontSize(12)
  doc.text('Результаты по темам', 14, y)
  y += 8

  const topicRows = Object.entries(data.topicResults)
    .sort((a, b) => b[1].mastery - a[1].mastery)
    .map(([name, d]) => [
      name,
      `${d.mastery}%`,
      `${d.correct} / ${d.total}`,
      d.mastery >= 70 ? '✓ Освоено' : d.mastery >= 40 ? '~ В процессе' : '✗ Пробел'
    ])

  autoTable(doc, {
    startY: y,
    head: [['Тема', 'Уровень', 'Ответы', 'Статус']],
    body: topicRows,
    theme: 'grid',
    ...tableStyles,
    bodyStyles: { font: PDF_FONT, fontStyle: 'normal' as const, fontSize: 9 }
  })

  return doc
}

export const downloadPdf = (doc: jsPDF, filename: string) => {
  doc.save(filename)
}
