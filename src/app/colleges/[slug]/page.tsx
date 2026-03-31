import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import { Users, MessageCircle, Star, ArrowRight, CheckCircle, TrendingUp, Award } from 'lucide-react'
import ProfileImage from '@/components/ProfileImage'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

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

    if (error || !data) {
      return null
    }

    return data
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
      
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link 
            href="/colleges" 
            className="text-purple-600 hover:text-purple-700 text-sm font-medium mb-4 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Colleges
          </Link>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {collegeLogo && (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-white border border-gray-200 p-3 shadow-sm mx-auto sm:mx-0">
                <Image
                  src={collegeLogo}
                  alt={`${collegeName} logo`}
                  width={80}
                  height={80}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {collegeName}
                </h1>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded-full">
                    Community Hub
                  </span>
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Connect with verified seniors for placement guidance, mentorship, and career opportunities. Join {community.member_count || 0}+ students already benefiting.
              </p>
              <div className="flex flex-wrap gap-4 mt-4 justify-center sm:justify-start">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{community.member_count || 0}+ Members</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MessageCircle className="w-4 h-4" />
                  <span>{community.senior_count || 0}+ Seniors</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Star className="w-4 h-4" />
                  <span>{community.doubt_count || 0}+ Discussions</span>
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
                <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{seniors.length}+</p>
                      <p className="text-xs sm:text-sm text-gray-600">Verified Seniors</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{posts.length}+</p>
                      <p className="text-xs sm:text-sm text-gray-600">Community Posts</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">4.8/5</p>
                      <p className="text-xs sm:text-sm text-gray-600">Student Rating</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Posts */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Community Posts</h2>
                </div>
                <div className="p-4 sm:p-6 space-y-4">
                  {posts.length > 0 ? (
                    posts.map((post: any) => (
                      <div key={post.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-xs font-medium text-purple-600">
                              {post.type === 'doubt' ? '❓' : post.type === 'discussion' ? '💬' : '📝'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                              {post.title || 'Community Discussion'}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2 sm:line-clamp-3">
                              {post.content}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                              <span>{post.users?.full_name || 'Community Member'}</span>
                              <span>•</span>
                              <span>{new Date(post.created_at).toLocaleDateString()}</span>
                              {post.upvote_count > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{post.upvote_count} upvotes</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <MessageCircle
                        size={32}
                        color="#DDD6FE"
                        className="mx-auto mb-4"
                      />
                      <p className="text-sm sm:text-base font-medium text-gray-900 mb-2">No posts yet</p>
                      <p className="text-xs sm:text-sm text-gray-600">Be the first to start the conversation!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* CTA Card */}
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-4 sm:p-6 text-white">
                <h3 className="text-lg sm:text-xl font-bold mb-4">Join {collegeName} Community</h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 flex-shrink-0" />
                    <span className="text-sm">Connect with verified seniors</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 flex-shrink-0" />
                    <span className="text-sm">Get placement guidance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 flex-shrink-0" />
                    <span className="text-sm">Access job referrals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 flex-shrink-0" />
                    <span className="text-sm">Free mentorship</span>
                  </li>
                </ul>
                <Link 
                  href={`/community/c/${slug}`}
                  className="block w-full bg-white text-purple-600 text-center font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Join Community
                  <ArrowRight className="w-4 h-4 inline ml-2" />
                </Link>
              </div>

              {/* Verified Seniors */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Verified Seniors</h3>
                </div>
                <div className="p-4 sm:p-6 space-y-4">
                  {seniors.length > 0 ? (
                    seniors.slice(0, 6).map((senior: any) => (
                      <div key={senior.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <ProfileImage
                            src={senior.profile_pic}
                            alt={senior.full_name}
                            name={senior.full_name}
                            width={40}
                            height={40}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate text-sm">{senior.full_name}</p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {senior.company} • {senior.role}
                          </p>
                        </div>
                        {senior.verified && (
                          <Award className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <Users className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">No verified seniors yet</p>
                    </div>
                  )}
                </div>
                {seniors.length > 6 && (
                  <div className="p-3 sm:p-4 border-t border-gray-200">
                    <Link 
                      href={`/community/c/${slug}`}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      View all {seniors.length} seniors →
                    </Link>
                  </div>
                )}
              </div>

              {/* Benefits */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Why Join Claspire?</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Career Growth</p>
                      <p className="text-xs text-gray-600">Get guidance from industry professionals</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Verified Network</p>
                      <p className="text-xs text-gray-600">All seniors are verified professionals</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">24/7 Support</p>
                      <p className="text-xs text-gray-600">Get help whenever you need it</p>
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
