const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'u', 's',
  'ul', 'ol', 'li',
  'a', 'blockquote', 'img',
  'div', 'span', 'code',
])

export function sanitizeHtml(html: string): string {
  if (!html) return ''

  // 1. Strip dangerous blocks entirely (with their content)
  html = html.replace(/<(script|style|iframe|object|embed|meta|link|noscript)[\s\S]*?<\/\1>/gi, '')
  html = html.replace(/<[\/]?(?:script|style|iframe|object|embed|meta|link|noscript)[^>]*>/gi, '')

  // 2. Strip event handlers and data-* attributes
  html = html.replace(/\s+(on\w+|data-[\w-]+)\s*=\s*(["'])(?:(?!\2).)*\2/gi, '')

  // 3. Normalize tag names to allowed equivalents
  html = html.replace(/<b\b[^>]*>/gi, '<strong>')
  html = html.replace(/<\/b>/gi, '</strong>')
  html = html.replace(/<(strong)\b[^>]*>/gi, '<$1>')
  html = html.replace(/<\/(strong)>/gi, '</$1>')
  html = html.replace(/<i\b[^>]*>/gi, '<em>')
  html = html.replace(/<\/i>/gi, '</em>')
  html = html.replace(/<(em)\b[^>]*>/gi, '<$1>')
  html = html.replace(/<\/(em)>/gi, '</$1>')
  html = html.replace(/<ins\b[^>]*>/gi, '<u>')
  html = html.replace(/<\/ins>/gi, '</u>')
  html = html.replace(/<(u)\b[^>]*>/gi, '<$1>')
  html = html.replace(/<\/(u)>/gi, '</$1>')
  html = html.replace(/<del\b[^>]*>/gi, '<s>')
  html = html.replace(/<\/del>/gi, '</s>')
  html = html.replace(/<(s)\b[^>]*>/gi, '<$1>')
  html = html.replace(/<\/(s)>/gi, '</$1>')

  // Convert heading tags to strong
  for (let i = 1; i <= 6; i++) {
    html = html.replace(new RegExp(`<h${i}\\b[^>]*>`, 'gi'), '<strong>')
    html = html.replace(new RegExp(`</h${i}>`, 'gi'), '</strong>')
  }

  // 4. Convert div -> p (only if not preserving div structure), unwrap font / pre
  // Note: div, span, code are now allowed to preserve RichEditor formatting
  html = html.replace(/<font\b[^>]*>/gi, '')
  html = html.replace(/<\/font>/gi, '')
  html = html.replace(/<pre\b[^>]*>/gi, '<p>')
  html = html.replace(/<\/pre>/gi, '</p>')

  // 5. Normalize br
  html = html.replace(/<br\s*\/?>/gi, '<br>')

  // 6. Strip classes, id, style, and all other non-allowed attributes
  html = html.replace(/\s+(?:class|id|style|dir|lang|title|hidden|role|tabindex|width|height|align|valign|border|cellpadding|cellspacing|aria-[\w-]+)\s*=\s*(["'])(?:(?!\1).)*\1/gi, '')

  // 7. Extract href from <a> and src from <img> before stripping remaining attributes
  const anchors: string[] = []
  html = html.replace(/<a\s+href\s*=\s*["']([^"']*)["'][^>]*>/gi, (_, href) => {
    anchors.push(href.replace(/[^\w\s\/:.#?=&@%-]/g, ''))
    return '\x00A' + (anchors.length - 1) + '\x00'
  })

  const images: string[] = []
  html = html.replace(/<img\s[^>]*src\s*=\s*["']([^"']*)["'][^>]*>/gi, (_, src) => {
    images.push(src.replace(/[^\w\s\/:.#?=&@%-]/g, ''))
    return '\x00IMG' + (images.length - 1) + '\x00'
  })

  // 8. Remove disallowed tags (keep content) and strip attributes from allowed tags

  html = html.replace(/<(\/?)(\w+)[^>]*>/g, (match, slash, tag) => {
    const t = tag.toLowerCase()
    if (ALLOWED_TAGS.has(t)) return `<${slash}${t}>`
    return ''
  })

  // 9. Restore extracted attributes
  html = html.replace(/\x00A(\d+)\x00/g, (_, idx) => {
    const href = anchors[parseInt(idx)]
    return href ? `<a href="${href}">` : '<a>'
  })
  html = html.replace(/\x00IMG(\d+)\x00/g, (_, idx) => {
    const src = images[parseInt(idx)]
    return src ? `<img src="${src}">` : '<img>'
  })

  // 10. Remove empty tags (p, li, blockquote with only whitespace)
  html = html.replace(/<(p|li|blockquote)>\s*<\/\1>/g, '')

  // 11. Limit consecutive br to max 2
  html = html.replace(/(<br>\s*){3,}/g, '<br><br>')

  return html.trim()
}
