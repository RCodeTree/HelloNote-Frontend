/**
 * 本地笔记导入与格式转换：
 * - .txt 普通文本  → 原样保留
 * - .md  Markdown  → 原样保留（配合编辑器工具栏/预览）
 * - .html/.htm 有格式笔记 → 递归转换为 Markdown（标题/粗斜体/列表/链接/图片/引用/代码块）
 */

export interface ImportedNote {
  title: string
  content: string
  kind: 'txt' | 'md' | 'html'
}

const MAX_SIZE = 2 * 1024 * 1024

export async function parseImportedFile(file: File): Promise<ImportedNote> {
  if (file.size > MAX_SIZE) throw new Error(`「${file.name}」超过 2MB，已跳过`)
  const baseName = file.name.replace(/\.[^.]+$/, '').trim() || '导入的笔记'
  const ext = (file.name.split('.').pop() ?? '').toLowerCase()
  const text = await file.text()

  if (ext === 'md' || ext === 'markdown') {
    return { title: baseName, content: normalize(text), kind: 'md' }
  }
  if (ext === 'html' || ext === 'htm') {
    return { title: baseName, content: htmlToMarkdown(text), kind: 'html' }
  }
  if (ext === 'txt' || ext === 'text' || file.type.startsWith('text/') || ext === '') {
    return { title: baseName, content: normalize(text), kind: 'txt' }
  }
  throw new Error(`暂不支持 .${ext} 格式`)
}

function normalize(text: string): string {
  return text.replace(/\r\n/g, '\n').trim()
}

/** HTML → Markdown：递归遍历 DOM，按语义标签转换 */
export function htmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script, style, noscript, meta, link, title').forEach((el) => el.remove())
  const md = Array.from(doc.body.childNodes).map(nodeToMd).join('')
  return md
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\n+$/g, '')
}

function nodeToMd(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '').replace(/\s+/g, ' ')
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return ''
  const el = node as Element
  const tag = el.tagName.toLowerCase()
  const inner = Array.from(el.childNodes).map(nodeToMd).join('')
  const text = inner.trim()

  switch (tag) {
    case 'br':
      return '\n'
    case 'hr':
      return '\n\n---\n\n'
    case 'h1':
      return `\n\n# ${text}\n\n`
    case 'h2':
      return `\n\n## ${text}\n\n`
    case 'h3':
      return `\n\n### ${text}\n\n`
    case 'h4':
    case 'h5':
    case 'h6':
      return `\n\n#### ${text}\n\n`
    case 'b':
    case 'strong':
      return text ? `**${text}**` : ''
    case 'i':
    case 'em':
      return text ? `*${text}*` : ''
    case 's':
    case 'strike':
    case 'del':
      return text ? `~~${text}~~` : ''
    case 'code':
      return text ? `\`${text}\`` : ''
    case 'pre':
      return `\n\n\`\`\`\n${(el.textContent ?? '').trim()}\n\`\`\`\n\n`
    case 'blockquote':
      return `\n\n${text.split('\n').map((l) => `> ${l}`).join('\n')}\n\n`
    case 'a': {
      const href = el.getAttribute('href')
      return href && text ? `[${text}](${href})` : text
    }
    case 'img': {
      const src = el.getAttribute('src') ?? ''
      return src ? `![${el.getAttribute('alt') ?? ''}](${src})` : ''
    }
    case 'li': {
      const parent = el.parentElement
      if (parent && parent.tagName.toLowerCase() === 'ol') {
        const index = Array.prototype.indexOf.call(parent.children, el) + 1
        return `\n${index}. ${text}`
      }
      return `\n- ${text}`
    }
    case 'ul':
    case 'ol':
      return `\n${inner}\n\n`
    case 'p':
    case 'div':
    case 'section':
    case 'article':
    case 'header':
    case 'footer':
    case 'main':
    case 'table':
    case 'tr':
      return `\n\n${inner.trim()}\n\n`
    case 'td':
    case 'th':
      return `${text} | `
    default:
      return inner
  }
}
