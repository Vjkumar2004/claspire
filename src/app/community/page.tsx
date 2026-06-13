import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import CommunityPageClient from './client-page'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

type InitialData = {
  initialCommunities: any[]
  initialPosts: any[]
  initialCampusJobs: any[]
}

async function fetchInitialData(): Promise<InitialData> {
  const timings: Record<string, number> = {}

  const start = performance.now()

  const [communitiesResult, postsResult, jobsResult] = await Promise.all([
    (async () => {
      const t0 = performance.now()
      const result = await supabase
        .from('communities')
        .select(`
          id, slug, display_name, description, member_count, senior_count, doubt_count,
          colleges ( id, name, short_name, location, state, type, email_domain, logo_url )
        `)
        .order('member_count', { ascending: false })
        .limit(20)
      timings.communities = Math.round((performance.now() - t0) * 100) / 100
      return result
    })(),
    (async () => {
      const t0 = performance.now()
      const result = await supabase
        .from('posts')
        .select(`
          id, title, content, type, created_at, upvote_count, downvote_count, answer_count, is_answered, tags, image_url, author_id,
          users!posts_author_id_fkey ( full_name, unique_id, role, is_verified, avatar_url ),
          communities ( slug, colleges ( name, short_name ) )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(0, 4)
      timings.posts = Math.round((performance.now() - t0) * 100) / 100
      return result
    })(),
    (async () => {
      const t0 = performance.now()
      const result = await supabase
        .from('jobs')
        .select('id, role, company_name, location, job_type, salary_range, referral_available, is_active, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5)
      timings.jobs = Math.round((performance.now() - t0) * 100) / 100
      return result
    })(),
  ])

  timings.total = Math.round((performance.now() - start) * 100) / 100

  console.log('[SSR Community] Query timings (ms):', JSON.stringify(timings))

  return {
    initialCommunities: communitiesResult.data ?? [],
    initialPosts: postsResult.data ?? [],
    initialCampusJobs: jobsResult.data ?? [],
  }
}

const getCachedData = unstable_cache(
  fetchInitialData,
  ['community-ssr-data'],
  { revalidate: 60, tags: ['community-ssr'] }
)

export default async function CommunityPage() {
  let data: InitialData
  try {
    data = await getCachedData()
  } catch (e) {
    console.error('Failed to fetch initial community data for SSR:', e)
    data = { initialCommunities: [], initialPosts: [], initialCampusJobs: [] }
  }

  return <CommunityPageClient {...data} />
}
