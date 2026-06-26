import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const alt = 'Claspire - Community Post'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

async function getInterFont(): Promise<ArrayBuffer> {
  const css = await fetch(
    'https://fonts.googleapis.com/css2?family=Inter:wght@600;700&display=swap',
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    }
  ).then((r) => r.text())

  const match = css.match(/src:\s*url\(([^)]+)\)/)
  if (!match) throw new Error('Could not extract font URL from Google Fonts CSS')

  return fetch(match[1]).then((r) => r.arrayBuffer())
}

const stripHtml = (html: string) => {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>?/gm, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>
}) {
  const { postId } = await params

  const { data: post } = await supabase
    .from('posts')
    .select('title, content, image_url')
    .eq('id', postId)
    .single()

  const rawTitle = post?.title || ''
  const cleanContent = stripHtml(post?.content || '')

  const title =
    rawTitle ||
    cleanContent.slice(0, 80) + (cleanContent.length > 80 ? '…' : '') ||
    'Community Post'

  const description =
    cleanContent.slice(0, 100) + (cleanContent.length > 100 ? '…' : '')

  // If the post has a cover image, include it in the OG image
  let coverUrl: string | null = null
  if (post?.image_url) {
    try {
      const urls: string[] =
        typeof post.image_url === 'string' && post.image_url.startsWith('[')
          ? JSON.parse(post.image_url)
          : typeof post.image_url === 'string'
            ? [post.image_url]
            : post.image_url
      coverUrl = urls[0] || null
    } catch {
      coverUrl = typeof post.image_url === 'string' ? post.image_url : null
    }
  }

  let fontData: ArrayBuffer
  try {
    fontData = await getInterFont()
  } catch {
    fontData = new ArrayBuffer(0)
  }

  const fonts = fontData.byteLength
    ? [
        { name: 'Inter', data: fontData, weight: 600 as const, style: 'normal' as const },
        { name: 'Inter', data: fontData, weight: 700 as const, style: 'normal' as const },
      ]
    : []

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
          fontFamily: fontData.byteLength ? 'Inter' : 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-80px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '-40px',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
          }}
        />

        {/* Cover image (if available) */}
        {coverUrl && (
          <img
            src={coverUrl}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '50%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.25,
            }}
          />
        )}

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '56px 64px',
            height: '100%',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Brand header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginBottom: 'auto',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 700,
                color: 'white',
              }}
            >
              C
            </div>
            <span
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
                letterSpacing: '-0.3px',
              }}
            >
              Claspire
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxWidth: coverUrl ? '65%' : '90%',
            }}
          >
            <h1
              style={{
                fontSize: title.length > 60 ? 38 : 48,
                fontWeight: 700,
                color: 'white',
                lineHeight: 1.15,
                margin: '0 0 12px 0',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title.slice(0, 120)}
            </h1>

            {description && (
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.65)',
                  lineHeight: 1.4,
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {description}
              </p>
            )}
          </div>

          {/* Domain */}
          <div
            style={{
              marginTop: 'auto',
              fontSize: 16,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.3px',
            }}
          >
            claspire.in
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
    }
  )
}
