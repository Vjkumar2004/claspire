import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function generateMetadata({ params }: { params: Promise<{ uniqueId: string }> }): Promise<Metadata> {
  const { uniqueId } = await params

  const { data: user } = await supabase
    .from('users')
    .select('full_name, role, bio, unique_id, avatar_url')
    .eq('unique_id', uniqueId)
    .single()

  if (!user) {
    return {
      title: 'Profile Not Found | Claspire',
    }
  }

  const roleLabel = user.role === 'senior' ? 'Senior' : 'Student'
  const title = `${user.full_name} | ${roleLabel} | Claspire`
  const description = user.bio
    ? user.bio.slice(0, 160)
    : `${roleLabel} profile on Claspire — connect with ${user.full_name} for mentorship and guidance.`
  const ogImage = user.avatar_url || '/og-image.png'

  return {
    title,
    description,
    alternates: {
      canonical: `https://claspire.in/u/${uniqueId}`,
    },
    openGraph: {
      title,
      description,
      url: `https://claspire.in/u/${uniqueId}`,
      type: 'profile',
      siteName: 'Claspire',
      images: [{ url: ogImage, width: 1200, height: 630, alt: user.full_name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default function PublicProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
