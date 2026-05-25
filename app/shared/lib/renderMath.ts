import MarkdownIt from 'markdown-it'
import katex from 'katex'

const md = new MarkdownIt({ html: false, linkify: true, typographer: true })

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll('\'', '&#39;')

/**
 * Renders markdown with inline/block KaTeX. Block math uses `$$…$$`,
 * inline math uses `$…$`. Falls back to `<code>` on parse errors.
 */
export function renderMath(source: string): string {
  let text = source
  const placeholders: string[] = []

  const pushPlaceholder = (html: string) => {
    const token = `@@MATH_${placeholders.length}@@`
    placeholders.push(html)
    return token
  }

  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try {
      return pushPlaceholder(katex.renderToString(math.trim(), { displayMode: true, throwOnError: false }))
    } catch {
      return pushPlaceholder(`<code>${escapeHtml(String(math))}</code>`)
    }
  })

  text = text.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    try {
      return pushPlaceholder(katex.renderToString(math.trim(), { displayMode: false, throwOnError: false }))
    } catch {
      return pushPlaceholder(`<code>${escapeHtml(String(math))}</code>`)
    }
  })

  let rendered = md.render(text)
  placeholders.forEach((html, idx) => {
    rendered = rendered.replaceAll(`@@MATH_${idx}@@`, html)
  })
  return rendered
}
