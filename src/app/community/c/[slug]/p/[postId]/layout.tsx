import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function generateMetadata({ params }: { params: Promise<{ slug: string; postId: string }> }): Promise<Metadata> {
  const { postId, slug } = await params

  const { data: post } = await supabase
    .from('posts')
    .select(`
      title, content, image_url,
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

  const authorName = (post.users as any)?.full_name || 'Someone'
  const communityName = (post.communities as any)?.display_name || 'Community'
  const cleanContent = post.content?.replace(/<[^>]*>/g, '').trim() || ''
  const description = cleanContent.slice(0, 160)

  const title = `${post.title} | ${communityName} | Claspire`
  const ogImage = post.image_url?.[0] || '/og-image.png'

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
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
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
