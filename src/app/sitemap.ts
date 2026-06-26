import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SECRET_KEY || 'placeholder'
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://claspire.in'
  const staticLastMod = new Date('2026-06-13')

  // Fetch all active communities
  let communities: any[] = []
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('slug, updated_at')

    if (!error && data) {
      communities = data
    }
  } catch (error) {
    console.error('Error fetching communities for sitemap:', error)
  }

  // Fetch recent public posts
  let posts: any[] = []
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, updated_at, communities ( slug )')
      .order('updated_at', { ascending: false })
      .limit(1000)

    if (!error && data) {
      posts = data
    }
  } catch (error) {
    console.error('Error fetching posts for sitemap:', error)
  }

  // Fetch blog posts
  let blogPosts: { slug: string }[] = []
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, updated_at')
      .eq('type', 'blog')
      .order('created_at', { ascending: false })

    if (!error && data) {
      blogPosts = data.map(p => ({ slug: p.id }))
    }
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error)
  }

  // Fetch public user profiles
  let profiles: any[] = []
  try {
    const { data, error } = await supabase
      .from('users')
      .select('unique_id, updated_at')
      .not('unique_id', 'is', null)
      .limit(500)

    if (!error && data) {
      profiles = data
    }
  } catch (error) {
    console.error('Error fetching profiles for sitemap:', error)
  }

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: staticLastMod,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/seniors`,
      lastModified: staticLastMod,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/colleges`,
      lastModified: staticLastMod,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: staticLastMod,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: staticLastMod,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/groups`,
      lastModified: staticLastMod,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: staticLastMod,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: staticLastMod,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: staticLastMod,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: staticLastMod,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: staticLastMod,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: staticLastMod,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/help-center`,
      lastModified: staticLastMod,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ]

  // Dynamic community pages
  const communityPages: MetadataRoute.Sitemap = communities.map((comm) => ({
    url: `${baseUrl}/community/c/${comm.slug}`,
    lastModified: comm.updated_at ? new Date(comm.updated_at) : staticLastMod,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // Dynamic college pages
  const collegePages: MetadataRoute.Sitemap = communities.map((comm) => ({
    url: `${baseUrl}/colleges/${comm.slug}`,
    lastModified: comm.updated_at ? new Date(comm.updated_at) : staticLastMod,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  // Dynamic post pages
  const postPages: MetadataRoute.Sitemap = posts.map((post) => {
    const communitySlug = (post.communities as any)?.slug
    if (!communitySlug) return null
    return {
      url: `${baseUrl}/community/c/${communitySlug}/p/${post.id}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : staticLastMod,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }
  }).filter(Boolean) as MetadataRoute.Sitemap

  // Profile pages
  const profilePages: MetadataRoute.Sitemap = profiles.map((profile) => ({
    url: `${baseUrl}/u/${profile.unique_id}`,
    lastModified: profile.updated_at ? new Date(profile.updated_at) : staticLastMod,
    changeFrequency: 'weekly' as const,
    priority: 0.4,
  }))

  // Blog pages
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: staticLastMod,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [
    ...staticPages,
    ...communityPages,
    ...collegePages,
    ...postPages,
    ...profilePages,
    ...blogPages,
  ]
}
