import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const stripHtml = (html: string) => {
  if (!html) return ''
  let text = html.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n')
  text = text.replace(/<[^>]*>?/gm, '')
  text = text.replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'")
             .replace(/&nbsp;/g, ' ')
  return text.trim()
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; postId: string }> }): Promise<Metadata> {
  const { postId, slug } = await params

  const { data: post } = await supabase
    .from('posts')
    .select(`
      title, content, image_url, is_college_post,
      users!posts_author_id_fkey ( full_name, unique_id ),
      communities ( slug, display_name )
    `)
    .eq('id', postId)
    .single()

  if (!post) {
    return {
      title: 'Post Not Found | Claspire',
    }
  }

  const cleanContent = stripHtml(post.content || '')
  
  const title = post.title || (cleanContent.slice(0, 80) + (cleanContent.length > 80 ? '...' : '')) || 'Claspire Post'
  const description = cleanContent.slice(0, 200) + (cleanContent.length > 200 ? '...' : '')

  let parsedUrls: string[] = []
  if (post.image_url) {
    try {
      parsedUrls = typeof post.image_url === 'string' && post.image_url.startsWith('[')
        ? JSON.parse(post.image_url)
        : typeof post.image_url === 'string' ? [post.image_url] : post.image_url
    } catch {
      parsedUrls = typeof post.image_url === 'string' ? [post.image_url] : []
    }
  }
  const ogImage = parsedUrls.length > 0 ? parsedUrls[0] : 'https://claspire.in/og-image.png'

  return {
    title,
    description,
    alternates: {
      canonical: `https://claspire.in/community/c/${slug}/p/${postId}`,
    },
    openGraph: {
      title,
      description,
      url: `https://claspire.in/community/c/${slug}/p/${postId}`,
      type: 'article',
      siteName: 'Claspire',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default function PostDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
