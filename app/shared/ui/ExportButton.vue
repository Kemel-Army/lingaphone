<script setup lang="ts">
/**
 * Universal export button — CSV, XLSX (via xlsx lib), PDF (via jspdf).
 * Falls back to CSV if libraries are not available.
 */
const props = defineProps<{
  data: Record<string, unknown>[]
  columns: { key: string, label: string }[]
  filename?: string
}>()

const isExporting = ref(false)

const exportCSV = () => {
  const header = props.columns.map(c => c.label).join(',')
  const rows = props.data.map(row =>
    props.columns.map((c) => {
      const val = String(row[c.key] ?? '')
      return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val
    }).join(',')
  )
  const csv = [header, ...rows].join('\n')
  downloadBlob(csv, `${props.filename ?? 'export'}.csv`, 'text/csv;charset=utf-8;')
}

const exportExcel = async () => {
  try {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(
      props.data.map((row) => {
        const obj: Record<string, unknown> = {}
        for (const c of props.columns) {
          obj[c.label] = row[c.key] ?? ''
        }
        return obj
      })
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    XLSX.writeFile(wb, `${props.filename ?? 'export'}.xlsx`)
  } catch {
    exportCSV()
  }
}

const exportPDF = async () => {
  try {
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default
    const { registerPdfFonts, PDF_FONT } = await import('~/shared/lib/pdf')

    const doc = new jsPDF()
    await registerPdfFonts(doc)

    autoTable(doc, {
      head: [props.columns.map(c => c.label)],
      body: props.data.map(row => props.columns.map(c => String(row[c.key] ?? ''))),
      styles: { font: PDF_FONT, fontStyle: 'normal' },
      headStyles: { font: PDF_FONT, fontStyle: 'bold', fillColor: [22, 163, 74] }
    })
    doc.save(`${props.filename ?? 'export'}.pdf`)
  } catch {
    exportCSV()
  }
}

const downloadBlob = (content: string, filename: string, type: string) => {
  const blob = new Blob(['\ufeff' + content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const doExport = async (format: string) => {
  isExporting.value = true
  try {
    switch (format) {
      case 'csv':
        exportCSV()
        break
      case 'xlsx':
        await exportExcel()
        break
      case 'pdf':
        await exportPDF()
        break
    }
  } finally {
    isExporting.value = false
  }
}

const items = [
  { label: 'CSV', value: 'csv', icon: 'i-lucide-file-text' },
  { label: 'Excel', value: 'xlsx', icon: 'i-lucide-file-spreadsheet' },
  { label: 'PDF', value: 'pdf', icon: 'i-lucide-file-down' }
]
</script>

<template>
  <UDropdownMenu :items="items.map(i => ({ ...i, onSelect: () => doExport(i.value) }))">
    <UButton
      icon="i-lucide-download"
      label="Экспорт"
      variant="outline"
      :loading="isExporting"
    />
  </UDropdownMenu>
</template>
