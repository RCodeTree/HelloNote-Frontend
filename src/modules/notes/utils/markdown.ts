/**
 * 极简 Markdown → HTML 渲染器（编辑器预览用）。
 * 支持：标题、粗体/斜体/删除线、行内代码与代码块、引用、有序/无序列表、
 * 链接、图片、分隔线、段落与换行。所有原始 HTML 会被转义，防注入。
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 行内语法：先保护行内代码，再依次转换图片/链接/粗体/斜体/删除线 */
function renderInline(text: string): string {
  const codes: string[] = []
  let out = text.replace(/`([^`]+)`/g, (_m: string, c: string) => {
    codes.push(c)
    return `\u0000${codes.length - 1}\u0000`
  })
  out = out
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
  return out.replace(/\u0000(\d+)\u0000/g, (_m: string, i: string) => `<code>${codes[Number(i)]}</code>`)
}

export function mdToHtml(md: string): string {
  const lines = escapeHtml(md.replace(/\r\n/g, '\n')).split('\n')
  const html: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let inCode = false
  let inQuote = false
  let para: string[] = []

  const closeList = (): void => {
    if (listType) {
      html.push(`</${listType}>`)
      listType = null
    }
  }
  const closeQuote = (): void => {
    if (inQuote) {
      html.push('</blockquote>')
      inQuote = false
    }
  }
  const flushPara = (): void => {
    if (para.length) {
      html.push(`<p>${para.map(renderInline).join('<br>')}</p>`)
      para = []
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    // 代码块围栏
    if (/^```/.test(line.trim())) {
      flushPara()
      closeList()
      closeQuote()
      if (inCode) {
        html.push('</code></pre>')
        inCode = false
      } else {
        html.push('<pre><code>')
        inCode = true
      }
      continue
    }
    if (inCode) {
      html.push(line)
      continue
    }

    // 空行：结束段落/列表/引用
    if (!line.trim()) {
      flushPara()
      closeList()
      closeQuote()
      continue
    }

    // 标题
    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      flushPara()
      closeList()
      closeQuote()
      const level = heading[1].length
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`)
      continue
    }

    // 分隔线
    if (/^(\*\*\*\*|-{3,}|_{3,})$/.test(line.trim())) {
      flushPara()
      closeList()
      closeQuote()
      html.push('<hr>')
      continue
    }

    // 引用
    const quote = line.match(/^>\s?(.*)$/)
    if (quote) {
      flushPara()
      closeList()
      if (!inQuote) {
        html.push('<blockquote>')
        inQuote = true
      }
      html.push(`<p>${renderInline(quote[1])}</p>`)
      continue
    }
    closeQuote()

    // 列表
    const ul = line.match(/^[-*+]\s+(.*)$/)
    const ol = line.match(/^\d+[.)]\s+(.*)$/)
    if (ul) {
      flushPara()
      if (listType !== 'ul') {
        closeList()
        html.push('<ul>')
        listType = 'ul'
      }
      html.push(`<li>${renderInline(ul[1])}</li>`)
      continue
    }
    if (ol) {
      flushPara()
      if (listType !== 'ol') {
        closeList()
        html.push('<ol>')
        listType = 'ol'
      }
      html.push(`<li>${renderInline(ol[1])}</li>`)
      continue
    }
    closeList()

    para.push(line)
  }

  flushPara()
  closeList()
  closeQuote()
  if (inCode) html.push('</code></pre>')
  return html.join('\n')
}
