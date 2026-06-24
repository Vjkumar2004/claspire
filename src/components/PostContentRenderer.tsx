'use client'

function getDisplayDomain(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return url
  }
}

const convertUrlsToLinks = (html: string) => {
  if (!html) return ''

  // Convert newlines to <br> for plain-text content
  // (RichEditor content already has HTML structure from contentEditable)
  if (!html.includes('<')) {
    html = html.replace(/\n/g, '<br>\n')
  }

  // Protect existing <a> tags so they aren't double-linked
  const anchors: string[] = []
  const withoutAnchors = html.replace(/<a\s+[^>]*>[\s\S]*?<\/a>/gi, (match) => {
    anchors.push(match)
    return `\x00A${anchors.length - 1}\x00`
  })

  // Convert bare URLs and email addresses to clickable links (single pass to avoid nested matches)
  const linkRegex = /(https?:\/\/[^\s<]+)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
  const withLinks = withoutAnchors.replace(linkRegex, (match, url, email) => {
    if (url) {
      let trailing = ''
      const cleanUrl = url.replace(/[.,;:!?)]+$/, (m) => {
        trailing = m
        return ''
      })
      const cleanDomain = getDisplayDomain(cleanUrl)
      return '<a href="/redirect?url=' + encodeURIComponent(cleanUrl) + '" target="_blank" rel="noopener noreferrer" class="text-[#F4A01C] hover:underline font-medium inline-flex items-center gap-0.5">' + cleanDomain + ' <span class="text-[10px] opacity-70">↗</span></a>' + trailing
    }
    return '<a href="mailto:' + email + '" class="text-[#F4A01C] hover:underline font-medium">' + email + '</a>'
  })

  // Restore protected anchor tags
  return withLinks.replace(/\x00A(\d+)\x00/g, (_, idx) => anchors[parseInt(idx)])
}

interface PostContentRendererProps {
  content: string
  clamp?: number
}

export default function PostContentRenderer({ content, clamp }: PostContentRendererProps) {
  if (!content) {
    console.log('[PostContentRenderer] null content — returning null')
    return null
  }

  const html = convertUrlsToLinks(content)

  const clampClass = clamp === 1 ? 'line-clamp-1'
    : clamp === 2 ? 'line-clamp-2'
    : clamp === 3 ? 'line-clamp-3'
    : clamp === 4 ? 'line-clamp-4'
    : clamp === 5 ? 'line-clamp-5'
    : clamp === 6 ? 'line-clamp-6'
    : ''

  const finalClassName = `text-[13px] sm:text-sm text-slate-700 dark:text-[#CBD5E1] leading-[1.65] font-normal [&>blockquote]:border-l-4 [&>blockquote]:border-[#F4A01C] [&>blockquote]:pl-4 [&>blockquote]:text-slate-500 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&_a]:text-[#F4A01C] [&_a]:hover:underline [&_a]:font-medium ${clampClass}`

  console.log('[PostContentRenderer]', {
    contentLength: content.length,
    clamp,
    hasHtml: html.length > 0,
    clampClass,
    finalClassName,
  })

  return (
    <div
      className={finalClassName}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
