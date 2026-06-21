const ALLOWED_TAGS = new Set([
  'div', 'span', 'p', 'br', 'hr',
  'strong', 'em', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'img', 'blockquote',
  'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'caption', 'col', 'colgroup',
  'font',
  'pre', 'code',
  'html', 'head', 'body', 'title', 'meta',
])

export function sanitizeEmailHtml(html: string): string {
  if (!html) return ''

  // 1. Strip dangerous blocks entirely (with their content)
  html = html.replace(/<(script|iframe|object|embed|noscript|base)[\s\S]*?<\/\1>/gi, '')
  html = html.replace(/<[\/]?(?:script|iframe|object|embed|noscript|base)[^>]*>/gi, '')

  // 2. Strip event handlers (onclick, onerror, onload, etc.)
  html = html.replace(/\s+on\w+\s*=\s*(["'])(?:(?!\1).)*\1/gi, '')

  // 3. Sanitize javascript: URLs in href/src
  html = html.replace(/(href|src)\s*=\s*(["'])\s*javascript\s*:/gi, '$1=$2')

  // 4. Normalize br and hr
  html = html.replace(/<br\s*\/?>/gi, '<br>')
  html = html.replace(/<hr\s*\/?>/gi, '<hr>')

  // 5. Remove disallowed tags (keep their content), keep allowed tags with all attributes
  html = html.replace(/<(\/?)(\w+)([^>]*)>/gi, (match, slash, tagName, attrs) => {
    const tag = tagName.toLowerCase()
    if (ALLOWED_TAGS.has(tag)) {
      // Keep the tag with all its attributes
      return `<${slash}${tag}${attrs}>`
    }
    // Remove the tag entirely (keeping its content)
    return ''
  })

  // 6. Normalize whitespace: collapse multiple spaces (from removed tags) but preserve single spaces
  html = html.replace(/[ \t]+/g, ' ')
  html = html.replace(/\n\s*\n/g, '\n')

  // 7. Remove empty tags that only contain whitespace
  html = html.replace(/<(p|li|blockquote|div|td|th|h[1-6])>\s*<\/\1>/g, '')

  // 8. Limit consecutive br to max 2
  html = html.replace(/(<br>\s*){3,}/g, '<br><br>')

  return html.trim()
}
