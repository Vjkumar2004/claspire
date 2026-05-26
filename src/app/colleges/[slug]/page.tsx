import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import { Users, MessageCircle, Star, ArrowRight, CheckCircle, TrendingUp, Award, HelpCircle, MessageSquare, FileText, Sparkles } from 'lucide-react'
import ProfileImage from '@/components/ProfileImage'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

async function getLiveStatsForCollege(collegeId: string, communityId?: string) {
  const { data: users } = await supabase
    .from('users')
    .select('role')
    .eq('college_id', collegeId)

  const memberCount = users?.length || 0
  const seniorCount = users?.filter((user: any) => user.role === 'senior').length || 0

  let postCount = 0
  if (communityId) {
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', communityId)
    postCount = count || 0
  }

  return { memberCount, seniorCount, postCount }
}

async function getCollegeBySlug(slug: string) {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select(`
        *,
        colleges (*)
      `)
      .eq('slug', slug)
      .single()

    if (data) {
      const collegeId = data.college_id || data.colleges?.id
      if (collegeId) {
        const { memberCount, seniorCount, postCount } = await getLiveStatsForCollege(
          collegeId,
          data.id
        )
        return {
          ...data,
          member_count: Math.max(data.member_count || 0, memberCount),
          senior_count: Math.max(data.senior_count || 0, seniorCount),
          doubt_count: Math.max(data.doubt_count || 0, postCount),
        }
      }
      return data
    }

    const { data: college, error: collegeError } = await supabase
      .from('colleges')
      .select('*')
      .eq('slug', slug)
      .single()

    if (collegeError || !college) {
      return null
    }

    const { memberCount, seniorCount, postCount } = await getLiveStatsForCollege(college.id)

    return {
      id: college.id,
      slug: college.slug,
      display_name: college.short_name || college.name,
      description: `${college.name} community on Claspire`,
      member_count: memberCount,
      senior_count: seniorCount,
      doubt_count: postCount,
      colleges: college
    }
  } catch (error) {
    console.error('Error fetching college:', error)
    return null
  }
}

async function getCollegeSeniors(collegeId: string) {
  try {
    console.log('Fetching seniors for college ID:', collegeId)
    console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
    console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL)
    console.log('Using base URL:', process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://claspire.in')
    
    // Use the existing API endpoint with fallback to production URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://claspire.in'
    const response = await fetch(`${baseUrl}/api/seniors`)
    
    console.log('Seniors API response status:', response.status)
    
    if (!response.ok) {
      console.error('Error fetching seniors from API:', response.status)
      return []
    }
    
    const data = await response.json()
    console.log('Seniors API data length:', data?.length || 0)
    
    // Filter seniors by college ID and only verified ones
    const collegeSeniors = data.filter((senior: any) => 
      senior.college_id === collegeId && 
      senior.role === 'senior' && 
      senior.rise_points > 0 // Use rise_points as verification proxy
    )
    
    console.log('Filtered seniors for college:', collegeSeniors.length)
    
    // Map to expected format
    return collegeSeniors.slice(0, 12).map((senior: any) => ({
      id: senior.id,
      full_name: senior.full_name,
      graduation_year: senior.graduation_year,
      company: senior.company,
      role: senior.designation,
      profile_pic: senior.avatar_url,
      bio: '', // Not available in API
      verified: senior.rise_points > 0
    }))
  } catch (error) {
    console.error('Error fetching seniors:', error)
    return []
  }
}

async function getCollegePosts(communityId: string) {
  try {
    // Try to fetch posts directly with correct schema
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        type,
        created_at,
        upvote_count,
        answer_count
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })
      .limit(8)

    if (error) {
      console.error('Error fetching posts:', error)
      return []
    }
    
    // Map to expected format without user relationship
    return (data || []).map((post: any) => ({
      ...post,
      users: {
        full_name: 'Community Member',
        graduation_year: '2024'
      }
    }))
  } catch (error) {
    console.error('Error fetching posts:', error)
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const community = await getCollegeBySlug(slug)

  if (!community) {
    return {
      title: 'College Not Found | Claspire',
      description: 'The requested college community could not be found.',
    }
  }

  const collegeName = community.colleges?.name || community.display_name

  return {
    title: `${collegeName} Community — Seniors, Placement Help | Claspire`,
    description: `${collegeName} students — connect with verified seniors for placement guidance, job referrals and mentorship. Free on Claspire.`,
    alternates: {
      canonical: `https://claspire.in/colleges/${slug}`,
    },
    keywords: [
      `${collegeName} community`,
      `${collegeName} seniors`,
      `${collegeName} placement`,
      `${collegeName} students`,
      collegeName,
    ],
    openGraph: {
      title: `${collegeName} Community — Claspire`,
      description: `Connect with ${collegeName} seniors for placement help and mentorship`,
      url: `https://claspire.in/colleges/${slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${collegeName} Community — Claspire`,
      description: `Connect with ${collegeName} seniors for placement help`,
    },
  }
}

export default async function CollegePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const community = await getCollegeBySlug(slug)

  if (!community) {
    notFound()
  }

  const collegeName = community.colleges?.name || community.display_name

  // Debug logging
  console.log('Community data:', community)
  console.log('College ID from communities:', community.colleges?.id)
  console.log('Community ID:', community.id)
  console.log('College name:', collegeName)

  const [seniors, posts] = await Promise.all([
    getCollegeSeniors(community.colleges?.id || community.id),
    getCollegePosts(community.id)
  ])

  // Debug logging for results
  console.log('Seniors found:', seniors.length)
  console.log('Posts found:', posts.length)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": `${collegeName} Community on Claspire`,
    "url": `https://claspire.in/colleges/${slug}`,
    "description": `Connect with ${collegeName} seniors for placement help`,
    "mainEntity": {
      "@type": "Organization",
      "name": "Claspire",
      "url": "https://claspire.in"
    }
  }

  const getCollegeLogo = (collegeSlug: string) => {
    const logoMap: Record<string, string> = {
      'aaacet': '/aaaclg_logo.jpg',
      'vvvclg': '/vvvclogo.png',
      'vvv': '/vvvclogo.png',
      'anjac': '/anjac.jpg',
      'sfr': '/sfr.jpg',
      'skc': '/skc.jpg',
      'kamaraj': '/kamaraj.jpg',
      'agpc': '/agpc.jpg',
    }
    return logoMap[collegeSlug] || null
  }

  const collegeLogo = getCollegeLogo(slug)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen bg-[#F8FAFC]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <Link 
              href="/colleges" 
              className="text-[#7C3AED] hover:text-[#6D28D9] text-xs font-bold mb-6 inline-flex items-center gap-1 uppercase tracking-wider no-underline"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Colleges
            </Link>
            
            {/* 3-Column LinkedIn-Style Organization Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-start mt-2">
              
              {/* Left Section: Identity Block */}
              <div className="md:col-span-3 flex flex-col items-center md:items-start text-center md:text-left">
                {collegeLogo && (
                  <div className="w-24 h-24 rounded-md overflow-hidden bg-white border border-gray-200 p-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.04)] mb-4 flex-shrink-0 flex items-center justify-center">
                    <Image
                      src={collegeLogo}
                      alt={`${collegeName} logo`}
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-snug">
                  {collegeName}
                </h1>
                <p className="text-xs font-bold text-gray-500 mt-1.5 tracking-wide uppercase">Institution</p>
              </div>

              {/* Center Section: Community Information */}
              <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left pt-1 md:pt-0">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-4">
                  <span className="bg-purple-50 text-[#7C3AED] text-[10px] font-bold px-2.5 py-1 rounded border border-purple-100 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <Sparkles size={12} className="text-[#7C3AED]" />
                    Community Hub
                  </span>
                  <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded border border-green-100 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Active Network
                  </span>
                </div>
                
                <h2 className="text-base sm:text-lg font-bold text-gray-800 tracking-tight mb-2.5">
                  Welcome to the {collegeName} Community.
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xl font-medium">
                  Connect with verified seniors, alumni, and students for placements, mentorship, discussions, and exclusive career opportunities. Join our growing ecosystem of professionals today.
                </p>
              </div>

              {/* Right Section: Statistics Panel */}
              <div className="md:col-span-4 w-full">
                <div className="bg-gray-50 rounded-md border border-gray-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 pb-3 border-b border-gray-200/80">
                    Community Overview
                  </h3>
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2.5 text-gray-600">
                        <Users size={16} className="text-gray-400 group-hover:text-[#7C3AED] transition-colors" />
                        <span className="text-sm font-semibold">Total Members</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm">{community.member_count || 0}+</span>
                    </div>
                    
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2.5 text-gray-600">
                        <Award size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <span className="text-sm font-semibold">Verified Seniors</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm">{community.senior_count || 0}+</span>
                    </div>
                    
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2.5 text-gray-600">
                        <MessageSquare size={16} className="text-gray-400 group-hover:text-green-500 transition-colors" />
                        <span className="text-sm font-semibold">Active Discussions</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm">{community.doubt_count || 0}+</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-md p-4 sm:p-5 border border-gray-200 hover:shadow-md transition-all shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-md flex items-center justify-center border border-purple-100">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 leading-tight">{seniors.length}+</p>
                      <p className="text-xs text-gray-500 font-semibold mt-0.5">Verified Seniors</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-md p-4 sm:p-5 border border-gray-200 hover:shadow-md transition-all shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-md flex items-center justify-center border border-blue-100">
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 leading-tight">{posts.length}+</p>
                      <p className="text-xs text-gray-500 font-semibold mt-0.5">Community Posts</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-md p-4 sm:p-5 border border-gray-200 hover:shadow-md transition-all shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-md flex items-center justify-center border border-green-100">
                      <Star className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 leading-tight">4.8/5</p>
                      <p className="text-xs text-gray-500 font-semibold mt-0.5">Student Rating</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Posts */}
              <div className="bg-white rounded-md border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <div className="p-4 sm:p-5 border-b border-gray-200">
                  <h2 className="text-base font-bold text-gray-900 tracking-tight">Recent Community Posts</h2>
                </div>
                <div className="p-4 sm:p-5 space-y-4">
                  {posts.length > 0 ? (
                    posts.map((post: any) => (
                      <div key={post.id} className="border-b border-gray-150 pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-purple-50 rounded-md flex items-center justify-center flex-shrink-0 mt-1 border border-purple-100">
                            {post.type === 'doubt' ? (
                              <HelpCircle size={14} className="text-[#7C3AED]" />
                            ) : post.type === 'discussion' ? (
                              <MessageSquare size={14} className="text-[#7C3AED]" />
                            ) : (
                              <FileText size={14} className="text-[#7C3AED]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate leading-snug tracking-tight">
                              {post.title || 'Community Discussion'}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-550 mt-1.5 line-clamp-2 sm:line-clamp-3 leading-relaxed font-medium">
                              {post.content}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className="font-semibold text-gray-700">{post.users?.full_name || 'Community Member'}</span>
                              <span>•</span>
                              <span>{new Date(post.created_at).toLocaleDateString()}</span>
                              {post.upvote_count > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-[#7C3AED] font-bold">{post.upvote_count} upvotes</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 sm:py-14">
                      <MessageCircle
                        size={32}
                        className="mx-auto mb-4 text-purple-200"
                      />
                      <p className="text-sm font-bold text-gray-900 mb-1">No posts yet</p>
                      <p className="text-xs text-gray-500">Be the first to start the conversation!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* CTA Card */}
              <div className="bg-gradient-to-br from-[#1F1F2E] to-[#0F0F1A] rounded-md p-5 sm:p-6 text-white border border-gray-800 shadow-md">
                <h3 className="text-base font-bold mb-4 tracking-tight">Join {collegeName} Community</h3>
                <ul className="space-y-3.5 mb-6 pl-0">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-300">Connect with verified seniors</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-300">Get placement guidance</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-300">Access job referrals</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-300">Free mentorship</span>
                  </li>
                </ul>
                <Link 
                  href={`/community/c/${slug}`}
                  className="block w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-center font-bold py-3 px-4 rounded-md transition-colors text-sm uppercase tracking-wider no-underline border-none"
                >
                  Join Community
                  <ArrowRight className="w-4 h-4 inline ml-1.5 animate-pulse" />
                </Link>
              </div>

              {/* Verified Seniors */}
              <div className="bg-white rounded-md border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <div className="p-4 sm:p-5 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 tracking-tight">Verified Seniors</h3>
                </div>
                <div className="p-4 sm:p-5 space-y-4">
                  {seniors.length > 0 ? (
                    seniors.slice(0, 6).map((senior: any) => (
                      <div key={senior.id} className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-50 rounded-md flex items-center justify-center flex-shrink-0 border border-purple-100 overflow-hidden">
                          <ProfileImage
                            src={senior.profile_pic}
                            alt={senior.full_name}
                            name={senior.full_name}
                            width={36}
                            height={36}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate text-xs">{senior.full_name}</p>
                          <p className="text-[11px] text-gray-500 font-semibold truncate mt-0.5">
                            {senior.company} • {senior.role}
                          </p>
                        </div>
                        {senior.verified && (
                          <Award className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <Users className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                      <p className="text-xs font-semibold text-gray-500">No verified seniors yet</p>
                    </div>
                  )}
                </div>
                {seniors.length > 6 && (
                  <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50/50">
                    <Link 
                      href={`/community/c/${slug}`}
                      className="text-[#7C3AED] hover:text-[#6D28D9] text-xs font-bold no-underline flex items-center justify-center gap-1"
                    >
                      View all {seniors.length} seniors <ArrowRight size={12} />
                    </Link>
                  </div>
                )}
              </div>

              {/* Benefits */}
              <div className="bg-white rounded-md border border-gray-200 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <h3 className="text-sm font-bold text-gray-900 mb-4 tracking-tight">Why Join Claspire?</h3>
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900 text-xs">Career Growth</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Get guidance from industry professionals</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900 text-xs">Verified Network</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">All seniors are verified professionals</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900 text-xs">24/7 Support</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Get help whenever you need it</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
