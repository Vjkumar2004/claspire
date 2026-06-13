import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  const { data: community } = await supabase
    .from('communities')
    .select('display_name, description, member_count, colleges ( name, short_name )')
    .eq('slug', slug)
    .single()

  if (!community) {
    return {
      title: 'Community Not Found | Claspire',
    }
  }

  const collegeName = (community.colleges as any)?.name || community.display_name
  const collegeShort = (community.colleges as any)?.short_name || ''
  const title = `${collegeName} Community — Placement Help & Mentorship | Claspire`
  const description = community.description
    ? community.description.slice(0, 160)
    : `${collegeName}${collegeShort ? ` (${collegeShort})` : ''} community — connect with verified seniors for placement guidance, job referrals and mentorship.`

  return {
    title,
    description,
    alternates: {
      canonical: `https://claspire.in/community/c/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://claspire.in/community/c/${slug}`,
      type: 'website',
      siteName: 'Claspire',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default function CommunityDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
