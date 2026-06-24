import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { Users, MessageCircle, Star, ArrowRight, CheckCircle, TrendingUp, Award, HelpCircle, MessageSquare, FileText, Sparkles, Globe, Shield, ExternalLink } from 'lucide-react'
import ProfileImage from '@/components/ProfileImage'
import CollegeClaimButton from '@/components/CollegeClaimButton'
import PostContentRenderer from '@/components/PostContentRenderer'
import { verifySessionCookie } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
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

async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('claspire_session')
    if (!sessionCookie) return null
    const verified = verifySessionCookie(sessionCookie.value)
    return verified?.userId || null
  } catch {
    return null
  }
}

async function isCommunityMember(userId: string, communityId: string, collegeId: string | null): Promise<boolean> {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('college_id')
    .eq('id', userId)
    .single()

  if (user?.college_id && collegeId && user.college_id === collegeId) {
    return true
  }

  const { data } = await supabaseAdmin
    .from('community_members')
    .select('id')
    .eq('user_id', userId)
    .eq('community_id', communityId)
    .maybeSingle()
  return !!data
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
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        id, full_name, unique_id, role, college_id,
        company, designation, graduation_year,
        rise_points, avatar_url, is_verified
      `)
      .eq('college_id', collegeId)
      .eq('role', 'senior')
      .order('rise_points', { ascending: false })
      .limit(12)

    if (error) {
      console.error('Error fetching college seniors:', error)
      return []
    }

    return (data || []).map((senior: any) => ({
      id: senior.id,
      full_name: senior.full_name,
      graduation_year: senior.graduation_year,
      company: senior.company,
      role: senior.designation,
      profile_pic: senior.avatar_url,
      bio: '',
      verified: senior.is_verified === true
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
        answer_count,
        is_college_post
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

  // Check if current user is a community member
  const currentUserId = await getCurrentUserId()
  const collegeId = community.colleges?.id || null
  const isMember = currentUserId && community.id
    ? await isCommunityMember(currentUserId, community.id, collegeId)
    : false

  const [seniors, posts] = await Promise.all([
    getCollegeSeniors(community.colleges?.id || community.id),
    getCollegePosts(community.id)
  ])

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

  const collegeLogo = community.colleges?.logo_url || null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#1D2226]">
        {/* Banner Hero */}
        {community.colleges?.banner_url && (
          <div className="h-48 sm:h-56 md:h-64 w-full overflow-hidden bg-gradient-to-br from-[#0A2540] to-indigo-700">
            <img
              src={community.colleges.banner_url}
              alt={`${collegeName} banner`}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header */}
        <div className="bg-surface dark:bg-[#283036] border-b border-surface dark:border-[#38434F]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <Link 
              href="/colleges" 
              className="text-[#F4A01C] hover:text-[#E09410] text-xs font-bold mb-6 inline-flex items-center gap-1 uppercase tracking-wider no-underline"
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
                  <div className="w-24 h-24 rounded-md overflow-hidden bg-surface dark:bg-[#283036] border border-surface dark:border-[#38434F] p-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.04)] mb-4 flex-shrink-0 flex items-center justify-center">
                    <Image
                      src={collegeLogo}
                      alt={`${collegeName} logo`}
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-snug">
                  {collegeName}
                </h1>
                <p className="text-xs font-bold text-gray-500 dark:text-[#B0B7BE] mt-1.5 tracking-wide uppercase">Institution</p>
              </div>

              {/* Center Section: Community Information */}
              <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left pt-1 md:pt-0">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-4">
                  {community.colleges?.is_verified && (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded border border-emerald-100 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                      <Shield size={12} />
                      Verified College
                    </span>
                  )}
                  <span className="bg-[#FFF3D6] text-[#F4A01C] text-[10px] font-bold px-2.5 py-1 rounded border border-[#F4A01C]/20 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <Sparkles size={12} className="text-[#F4A01C]" />
                    Community Hub
                  </span>
                  <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded border border-green-100 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Active Network
                  </span>
                </div>
                
                <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white tracking-tight mb-2.5">
                  Welcome to the {collegeName} Community.
                </h2>
                {community.colleges?.description && (
                  <p className="text-gray-500 dark:text-[#B0B7BE] text-sm leading-relaxed max-w-xl font-medium mb-3">
                    {community.colleges.description}
                  </p>
                )}
                {!community.colleges?.description && (
                  <p className="text-gray-500 dark:text-[#B0B7BE] text-sm leading-relaxed max-w-xl font-medium mb-3">
                    Connect with verified seniors, alumni, and students for placements, mentorship, discussions, and exclusive career opportunities. Join our growing ecosystem of professionals today.
                  </p>
                )}
                {community.colleges?.website_url && (
                  <a
                    href={community.colleges.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#F4A01C] hover:text-[#E09410] text-xs font-bold no-underline"
                  >
                    <Globe size={14} />
                    {community.colleges.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    <ExternalLink size={10} />
                  </a>
                )}
                {community.colleges?.social_links && Object.keys(community.colleges.social_links).length > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    {Object.entries(community.colleges.social_links).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#283036] hover:bg-[#F4A01C]/10 dark:hover:bg-[#F4A01C]/20 flex items-center justify-center text-gray-500 dark:text-[#B0B7BE] hover:text-[#F4A01C] transition-all border border-surface dark:border-[#38434F]"
                        title={platform}
                      >
                        {platform === 'linkedin' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        )}
                        {platform === 'twitter' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        )}
                        {platform === 'instagram' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        )}
                        {platform === 'facebook' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        )}
                        {platform === 'youtube' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Section: Statistics Panel */}
              <div className="md:col-span-4 w-full">
                <div className="bg-app dark:bg-[#1D2226] rounded-md border border-surface dark:border-[#38434F] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 pb-3 border-b border-surface/80 dark:border-[#38434F]">
                    Community Overview
                  </h3>
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2.5 text-gray-600 dark:text-[#B0B7BE]">
                        <Users size={16} className="text-gray-400 dark:text-[#B0B7BE] group-hover:text-[#F4A01C] transition-colors" />
                        <span className="text-sm font-semibold">Total Members</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white bg-surface dark:bg-[#283036] px-2 py-0.5 rounded border border-surface dark:border-[#38434F] shadow-sm">{community.member_count || 0}+</span>
                    </div>
                    
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2.5 text-gray-600 dark:text-[#B0B7BE]">
                        <Award size={16} className="text-gray-400 dark:text-[#B0B7BE] group-hover:text-blue-500 transition-colors" />
                        <span className="text-sm font-semibold">Verified Seniors</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white bg-surface dark:bg-[#283036] px-2 py-0.5 rounded border border-surface dark:border-[#38434F] shadow-sm">{community.senior_count || 0}+</span>
                    </div>
                    
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2.5 text-gray-600 dark:text-[#B0B7BE]">
                        <MessageSquare size={16} className="text-gray-400 dark:text-[#B0B7BE] group-hover:text-green-500 transition-colors" />
                        <span className="text-sm font-semibold">Active Discussions</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white bg-surface dark:bg-[#283036] px-2 py-0.5 rounded border border-surface dark:border-[#38434F] shadow-sm">{community.doubt_count || 0}+</span>
                    </div>

                    {community.colleges?.avg_package && (
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-2.5 text-gray-600 dark:text-[#B0B7BE]">
                          <TrendingUp size={16} className="text-gray-400 dark:text-[#B0B7BE] group-hover:text-emerald-500 transition-colors" />
                          <span className="text-sm font-semibold">Avg. Package</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 shadow-sm">₹{Number(community.colleges.avg_package).toFixed(1)} LPA</span>
                      </div>
                    )}
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
                <div className="bg-surface dark:bg-[#283036] rounded-md p-4 sm:p-5 border border-surface dark:border-[#38434F] hover:shadow-md transition-all shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FFF3D6] rounded-md flex items-center justify-center border border-[#F4A01C]/20">
                      <Users className="w-5 h-5 text-[#F4A01C]" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{seniors.length}+</p>
                      <p className="text-xs text-gray-500 dark:text-[#B0B7BE] font-semibold mt-0.5">Verified Seniors</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-surface dark:bg-[#283036] rounded-md p-4 sm:p-5 border border-surface dark:border-[#38434F] hover:shadow-md transition-all shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-md flex items-center justify-center border border-blue-100">
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{posts.length}+</p>
                      <p className="text-xs text-gray-500 dark:text-[#B0B7BE] font-semibold mt-0.5">Community Posts</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-surface dark:bg-[#283036] rounded-md p-4 sm:p-5 border border-surface dark:border-[#38434F] hover:shadow-md transition-all shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-md flex items-center justify-center border border-green-100">
                      <Star className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">4.8/5</p>
                      <p className="text-xs text-gray-500 dark:text-[#B0B7BE] font-semibold mt-0.5">Student Rating</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Posts */}
              <div className="bg-surface dark:bg-[#283036] rounded-md border border-surface dark:border-[#38434F] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <div className="p-4 sm:p-5 border-b border-surface dark:border-[#38434F]">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Recent Community Posts</h2>
                </div>
                <div className="p-4 sm:p-5 space-y-4">
                  {posts.length > 0 ? (
                    posts.map((post: any) => (
                      <div key={post.id} className="border-b border-gray-150 dark:border-[#38434F] pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-[#FFF3D6] rounded-md flex items-center justify-center flex-shrink-0 mt-1 border border-[#F4A01C]/20">
                            {post.type === 'doubt' ? (
                              <HelpCircle size={14} className="text-[#F4A01C]" />
                            ) : post.type === 'discussion' ? (
                              <MessageSquare size={14} className="text-[#F4A01C]" />
                            ) : (
                              <FileText size={14} className="text-[#F4A01C]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate leading-snug tracking-tight">
                              {post.title || 'Community Discussion'}
                            </h3>
                            <PostContentRenderer content={post.content} clamp={3} />
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-[#B0B7BE]">
                              <span className="font-semibold text-gray-700 dark:text-[#B0B7BE]">{post.users?.full_name || 'Community Member'}</span>
                              <span>•</span>
                              <span>{new Date(post.created_at).toLocaleDateString()}</span>
                              {post.upvote_count > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-[#F4A01C] font-bold">{post.upvote_count} upvotes</span>
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
                      <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">No posts yet</p>
                      <p className="text-xs text-gray-500 dark:text-[#B0B7BE]">Be the first to start the conversation!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">

              {/* Claim Card / Admin Dashboard Link */}
              <div className="bg-surface dark:bg-[#283036] rounded-md border border-surface dark:border-[#38434F] p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <CollegeClaimButton
                  collegeId={community.colleges?.id || community.id}
                  collegeSlug={slug}
                  collegeName={collegeName}
                  collegeDomain={community.colleges?.email_domain}
                  isVerified={community.colleges?.is_verified || false}
                />
              </div>

              {/* CTA Card */}
              <div className="bg-gradient-to-br from-[#1F1F2E] to-[#0F0F1A] rounded-md p-5 sm:p-6 text-white border border-gray-800 shadow-md">
                <h3 className="text-base font-bold mb-4 tracking-tight">Join {collegeName} Community</h3>
                <ul className="space-y-3.5 mb-6 pl-0">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#F4A01C] mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-300">Connect with verified seniors</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#F4A01C] mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-300">Get placement guidance</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#F4A01C] mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-300">Access job referrals</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#F4A01C] mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-300">Free mentorship</span>
                  </li>
                </ul>
                <Link 
                  href={`/community/c/${slug}`}
                  className="block w-full bg-[#F4A01C] hover:bg-[#E09410] text-white text-center font-bold py-3 px-4 rounded-md transition-colors text-sm uppercase tracking-wider no-underline border-none"
                >
                  {isMember ? 'View Community' : 'Join Community'}
                  <ArrowRight className="w-4 h-4 inline ml-1.5 animate-pulse" />
                </Link>
              </div>

              {/* Verified Seniors */}
              <div className="bg-surface dark:bg-[#283036] rounded-md border border-surface dark:border-[#38434F] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <div className="p-4 sm:p-5 border-b border-surface dark:border-[#38434F]">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Verified Seniors</h3>
                </div>
                <div className="p-4 sm:p-5 space-y-4">
                  {seniors.length > 0 ? (
                    seniors.slice(0, 6).map((senior: any) => (
                      <div key={senior.id} className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#FFF3D6] rounded-md flex items-center justify-center flex-shrink-0 border border-[#F4A01C]/20 overflow-hidden">
                          <ProfileImage
                            src={senior.profile_pic}
                            alt={senior.full_name}
                            name={senior.full_name}
                            width={36}
                            height={36}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white truncate text-xs">{senior.full_name}</p>
                          <p className="text-[11px] text-gray-500 dark:text-[#B0B7BE] font-semibold truncate mt-0.5">
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
                      <p className="text-xs font-semibold text-gray-500 dark:text-[#B0B7BE]">No verified seniors yet</p>
                    </div>
                  )}
                </div>
                {seniors.length > 6 && (
                  <div className="p-3 sm:p-4 border-t border-surface dark:border-[#38434F] bg-app/50">
                    <Link 
                      href={`/community/c/${slug}`}
                      className="text-[#F4A01C] hover:text-[#E09410] text-xs font-bold no-underline flex items-center justify-center gap-1"
                    >
                      View all {seniors.length} seniors <ArrowRight size={12} />
                    </Link>
                  </div>
                )}
              </div>

              {/* Benefits */}
              <div className="bg-surface dark:bg-[#283036] rounded-md border border-surface dark:border-[#38434F] p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 tracking-tight">Why Join Claspire?</h3>
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-xs">Career Growth</p>
                      <p className="text-[11px] text-gray-500 dark:text-[#B0B7BE] mt-0.5 leading-snug">Get guidance from industry professionals</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-xs">Verified Network</p>
                      <p className="text-[11px] text-gray-500 dark:text-[#B0B7BE] mt-0.5 leading-snug">All seniors are verified professionals</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-xs">24/7 Support</p>
                      <p className="text-[11px] text-gray-500 dark:text-[#B0B7BE] mt-0.5 leading-snug">Get help whenever you need it</p>
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
