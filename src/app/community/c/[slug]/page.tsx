'use client'
import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

import {
  ChevronRight, Users, Star, MapPin, MessageSquare,
  Briefcase, Video, Lock, Shield,
  Clock, TrendingUp, Calendar,
  Globe, Award, Activity, Target, Zap,
  X, GraduationCap, MessageCircle, Crown,
  CheckCircle, Search, MoreHorizontal,
  Share2, ArrowUp, MessageSquarePlus, LayoutGrid, DollarSign,
  Sparkles, ArrowRight
} from 'lucide-react'
import PostModal from '@/components/PostModal'
import CreateGroupModal from '@/components/CreateGroupModal'
import { getCollegeLogo, getCollegeInitial } from '@/lib/college-utils'
import MediaGallery from '@/components/MediaGallery'

// Utility function to convert URLs to clickable links and preserve line breaks
const convertUrlsToLinks = (text: string) => {
  if (!text) return text
  const urlPattern = /(https?:\/\/[^\s\)]+)/g
  const lines = text.split('\n')
  return lines.map((line, lineIndex) => {
    const matches = line.match(urlPattern) || []
    if (matches.length === 0) {
      return (
        <span key={`line-${lineIndex}`}>
          {line}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      )
    }
    const parts: React.ReactNode[] = []
    let lastIdx = 0
    matches.forEach((match, matchIndex) => {
      const matchStart = line.indexOf(match, lastIdx)
      const before = line.substring(lastIdx, matchStart)
      if (before) parts.push(<span key={`t-${lineIndex}-${matchIndex}`}>{before}</span>)
      parts.push(
        <a key={`l-${lineIndex}-${matchIndex}`} href={match} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: '#7C3AED', fontWeight: 600, wordBreak: 'break-all' }}>{match}</a>
      )
      lastIdx = matchStart + match.length
    })
    const remaining = line.substring(lastIdx)
    if (remaining) parts.push(<span key={`t-${lineIndex}-end`}>{remaining}</span>)
    return (
      <span key={`line-${lineIndex}`}>
        {parts}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    )
  })
}

function CommunityPageContent({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const shouldCreate = searchParams.get('create') === 'true'
  const [slug, setSlug] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('feed')
  const [showPostModal, setShowPostModal] = useState(false)
  const [referralConfirmOpen, setReferralConfirmOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [requestLoading, setRequestLoading] = useState(false)
  const [joining, setJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [studentGroups, setStudentGroups] = useState<any[]>([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [memberGroups, setMemberGroups] = useState({
    ownStudents: [] as any[],
    ownSeniors: [] as any[],
    otherCollege: [] as any[],
  })
  const [memberCounts, setMemberCounts] = useState({
    ownStudents: 0,
    ownSeniors: 0,
    otherCollege: 0,
    total: 0,
  })
  const [membersLoading, setMembersLoading] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)

  // Check if current user belongs to this college
  const isUserCollege = currentUser?.college_id === data?.community?.college_id

  useEffect(() => {
    const getSlug = async () => {
      const { slug: resolvedSlug } = await params
      setSlug(resolvedSlug)
    }
    getSlug()
  }, [params])

  useEffect(() => {
    if (slug) {
      Promise.all([
        fetchCommunity(),
        fetchCurrentUser(),
        fetchStudentGroups(),
      ])
    }
  }, [slug])

  useEffect(() => {
    if (data) {
      setHasJoined(data.isJoined || data.isAlreadyMember || false)
    }
  }, [data])

  // Handle auto-open post modal
  useEffect(() => {
    if (shouldCreate && data?.canPost) {
      setShowPostModal(true)
      // Clean up URL to prevent reopening on refresh
      const newPath = window.location.pathname
      window.history.replaceState({}, '', newPath)
    }
  }, [shouldCreate, data?.canPost, pathname])

  async function fetchCommunity() {
    try {
      const res = await fetch(`/api/community/${slug}`, { cache: 'no-store' })
      if (!res.ok) {
        router.push('/community')
        return
      }
      const json = await res.json()
      setData(json)
      setHasJoined(json.isJoined || json.isAlreadyMember || false)
    } catch {
      router.push('/community')
    } finally {
      setLoading(false)
    }
  }

  async function fetchCurrentUser() {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setCurrentUser(json.user)
      }
    } catch {
      // User not logged in
    }
  }

  async function fetchStudentGroups() {
    try {
      const res = await fetch(`/api/community/${slug}/student-groups`, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setStudentGroups(json.groups || [])
      }
    } catch {
      console.error('Failed to fetch student groups')
    } finally {
      setGroupsLoading(false)
    }
  }

  async function fetchCommunityMembers() {
    if (!slug) return
    setMembersLoading(true)
    try {
      const res = await fetch(`/api/community/${slug}/members`, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setMembers(json.members || [])
        setMemberGroups({
          ownStudents: json.groups?.ownStudents || [],
          ownSeniors: json.groups?.ownSeniors || [],
          otherCollege: json.groups?.otherCollege || [],
        })
        setMemberCounts(
          json.counts || {
            ownStudents: 0,
            ownSeniors: 0,
            otherCollege: 0,
            total: (json.members || []).length,
          }
        )
      }
    } catch {
      console.error('Failed to fetch community members')
    } finally {
      setMembersLoading(false)
    }
  }

  const handleRequestReferral = async () => {
    if (!selectedJob || !currentUser) return
    setRequestLoading(true)
    try {
      const res = await fetch('/api/jobs/request-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJob.id,
          seniorId: selectedJob.posted_by
        })
      })
      const json = await res.json()
      if (res.ok) {
        alert('Referral request sent! Your profile has been shared with the senior. 🚀')
        setReferralConfirmOpen(false)
      } else {
        alert(json.error || 'Failed to request referral')
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setRequestLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!currentUser) {
      router.push('/login')
      return
    }

    if (joining) return
    setJoining(true)

    try {
      const res = await fetch(`/api/community/${slug}/join`, { method: 'POST' })
      const result = await res.json()

      if (result.success) {
        setHasJoined(true)
        await fetchCommunity()
        if (result.memberCount != null) {
          setData((prev: any) =>
            prev
              ? {
                  ...prev,
                  isJoined: true,
                  isAlreadyMember: true,
                  totalMembers: result.memberCount,
                  seniorCount: result.seniorCount ?? prev.seniorCount,
                  community: {
                    ...prev.community,
                    member_count: result.memberCount,
                    senior_count: result.seniorCount ?? prev.community?.senior_count,
                  },
                }
              : prev
          )
        }
      } else {
        alert(result.error || 'Failed to join')
        console.error(result.error)
      }
    } catch (err) {
      console.error('Join error:', err)
    } finally {
      setJoining(false)
    }
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (mins > 0) return `${mins}m ago`
    return 'Just now'
  }

  const handlePostSuccess = () => {
    fetchCommunity()
  }

  // No auto-open effect here anymore

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'doubt': return { label: 'Doubt', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', highlight: '#3B82F6' }
      case 'discussion': return { label: 'Discussion', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', highlight: '#8B5CF6' }
      case 'experience': return { label: 'Experience', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', highlight: '#F59E0B' }
      case 'referral_hunt': return { label: 'Referral', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', highlight: '#10B981' }
      case 'resource': return { label: 'Resource', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', highlight: '#EF4444' }
      default: return { label: type, color: '#64748B', bg: '#F8FAFC', border: '#F1F5F9', highlight: '#94A3B8' }
    }
  }

  const LockScreen = ({ title, description, ctaText, ctaAction }: { title: string; description: string; userRole?: string; ctaText: string; ctaAction: () => void }) => (
    <div className="bg-white dark:bg-[#1D2226] rounded-2xl border border-purple-100/80 shadow-sm py-16 px-6 sm:px-10 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-cyan-500 flex items-center justify-center mx-auto mb-5 text-white shadow-lg shadow-purple-200/50">
        <Lock size={32} />
      </div>
      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white m-0 mb-3">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-[#B0B7BE] max-w-md mx-auto m-0 mb-8 leading-relaxed">{description}</p>
      <button
        type="button"
        onClick={ctaAction}
        className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-sm font-bold border-none cursor-pointer shadow-sm transition-colors"
      >
        {ctaText}
      </button>
    </div>
  )

  const renderMemberRow = (
    member: any,
    style: { bg: string; border: string; avatarBg: string }
  ) => (
    <div
      key={member.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 12,
        transition: 'all 0.2s',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: member.avatar_url ? 'transparent' : style.avatarBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 14,
          fontWeight: 800,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt={member.full_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          member.full_name?.[0] || '?'
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
          <p className="text-slate-900 dark:text-white" style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
            {member.full_name}
          </p>
          {member.is_verified && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: '#059669',
                background: '#D1FAE5',
                padding: '2px 6px',
                borderRadius: 100,
              }}
            >
              Verified
            </span>
          )}
          {member.member_category === 'other_college' && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: '#0369A1',
                background: '#E0F2FE',
                padding: '2px 6px',
                borderRadius: 100,
              }}
            >
              Network
            </span>
          )}
        </div>
        <p className="text-slate-500 dark:text-[#B0B7BE]" style={{ fontSize: 12, margin: 0 }}>
          {member.member_category === 'other_college' ? (
            <>
              {member.college_short_name || member.college_name || 'Other college'}
              {member.role === 'senior' ? ' · Senior' : ' · Student'}
            </>
          ) : member.role === 'senior' ? (
            <>Senior · {community.colleges?.short_name || community.colleges?.name || 'This college'}</>
          ) : (
            <>Student · {community.colleges?.short_name || community.colleges?.name || 'This college'}</>
          )}
        </p>
        {member.unique_id && (
          <p className="text-slate-400 dark:text-[#B0B7BE]" style={{ fontSize: 11, margin: '2px 0 0' }}>@{member.unique_id}</p>
        )}
      </div>
    </div>
  )

  const topContributors = useMemo(() => {
    if (!data?.posts) return []
    const map: any = {}
    data.posts.forEach((p: any) => {
      const id = p.users?.id || 'u'
      if (!map[id]) map[id] = {
        name: p.users?.full_name || 'User',
        count: 0,
        role: p.users?.role || 'student',
        avatar_url: p.users?.avatar_url
      }
      map[id].count++
    })
    return Object.entries(map).sort((a: any, b: any) => b[1].count - a[1].count).slice(0, 5)
  }, [data?.posts])

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#1D2226] flex flex-col items-center justify-center gap-3 font-plus-jakarta-sans">
      <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
      <p className="text-xs text-slate-500 dark:text-[#B0B7BE] font-semibold">Loading community...</p>
    </div>
  )

  if (!data) return null

  const {
    community,
    verifiedJuniors = 0,
    verifiedSeniors = 0,
    seniorCount = 0,
    posts = [],
    jobs = [],
    webinars = [],
    userRole,
    canPost,
    canViewJobs,
    canViewWebinars,
    isAlreadyMember,
    isCollegeAdmin,
    totalMembers = 0
  } = data || {}

  const displayMemberCount =
    typeof totalMembers === 'number'
      ? totalMembers
      : (community?.member_count ?? 0)
  const displaySeniorCount =
    typeof seniorCount === 'number'
      ? seniorCount
      : (verifiedSeniors ?? community?.senior_count ?? 0)

  // Auto-open logic moved to top

  const tabs = [
    { id: 'feed', label: 'Feed', icon: <LayoutGrid size={16} />, locked: false },
    { id: 'jobs', label: 'Referrals', icon: <Briefcase size={16} />, locked: !canViewJobs },
    { id: 'webinars', label: 'Events', icon: <Video size={16} />, locked: !canViewWebinars }
  ]

  const collegeLogo = getCollegeLogo(community.colleges)
  const collegeName = community.colleges?.name || community.display_name || community.slug
  const collegeShort = community.colleges?.short_name
  const collegeLocation = [community.colleges?.location, community.colleges?.state].filter(Boolean).join(', ')

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#1D2226] font-plus-jakarta-sans text-sm text-slate-800 dark:text-white pb-24 lg:pb-8">
      {/* College Banner */}
      {community.colleges?.banner_url && (
        <div className="h-40 sm:h-48 w-full overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-700">
          <img
            src={community.colleges.banner_url}
            alt={`${community.colleges.name} banner`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Hero */}
      <header className="border-b border-slate-200 dark:border-[#38434F]/80 bg-white dark:bg-[#1D2226]">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-8">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-[#B0B7BE] mb-6">
            <button type="button" onClick={() => router.push('/community')} className="hover:text-[#7C3AED] transition-colors border-none bg-transparent cursor-pointer p-0">
              Communities
            </button>
            <ChevronRight size={14} className="text-slate-300 dark:text-[#B0B7BE] shrink-0" />
            <span className="text-slate-900 dark:text-white truncate">c/{community.slug}</span>
          </nav>

          <div className="flex flex-col md:flex-row gap-6 md:items-start">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border border-slate-200 dark:border-[#38434F]/80 bg-white dark:bg-[#1D2226] shadow-sm p-2 shrink-0 mx-auto md:mx-0">
              <div className={`w-full h-full rounded-xl flex items-center justify-center overflow-hidden text-3xl font-black ${collegeLogo ? 'bg-white dark:bg-[#1D2226]' : 'bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] text-white'}`}>
                {collegeLogo ? (
                  <img src={collegeLogo} alt={collegeShort || community.slug} className="w-full h-full object-contain" />
                ) : (
                  getCollegeInitial(community.colleges)
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full">
                  Official College Hub
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-[#B0B7BE] bg-slate-50 dark:bg-[#283036] border border-slate-200 dark:border-[#38434F] px-2.5 py-1 rounded-full">
                  <Users size={13} className="text-purple-600" />
                  {displayMemberCount} members
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-[#B0B7BE] bg-slate-50 dark:bg-[#283036] border border-slate-200 dark:border-[#38434F] px-2.5 py-1 rounded-full">
                  <Crown size={13} className="text-amber-500" />
                  {displaySeniorCount} seniors
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-white tracking-tight m-0 mb-1">
                {collegeName}
              </h1>
              {(collegeShort || collegeLocation) && (
                <p className="text-sm text-slate-500 dark:text-[#B0B7BE] font-medium m-0 mb-4 flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1">
                  {collegeShort && <span className="inline-flex items-center gap-1"><GraduationCap size={14} /> {collegeShort}</span>}
                  {collegeLocation && <span className="inline-flex items-center gap-1"><MapPin size={14} /> {collegeLocation}</span>}
                </p>
              )}
              {community.description && (
                <p className="text-sm text-slate-600 dark:text-[#B0B7BE] leading-relaxed max-w-2xl mx-auto md:mx-0 mb-5 line-clamp-2">
                  {community.description}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {userRole === 'guest' ? (
                  <button
                    type="button"
                    onClick={() => router.push('/signup')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer shadow-sm transition-colors"
                  >
                    Join Community
                  </button>
                ) : (hasJoined || isAlreadyMember) ? (
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                    <CheckCircle size={16} /> Joined
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={joining}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-purple-700 disabled:opacity-60 text-white text-xs font-bold border-none cursor-pointer shadow-sm transition-colors"
                  >
                    {joining ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Joining...
                      </>
                    ) : (
                      'Join Community'
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { fetchCommunityMembers(); setShowMembersModal(true) }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-[#1D2226] border border-slate-200 dark:border-[#38434F] text-slate-700 dark:text-white hover:bg-slate-50 dark:bg-[#283036] dark:hover:bg-[#1D2226] text-xs font-bold cursor-pointer transition-colors"
                >
                  <Users size={14} /> View Members
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-14 z-40 bg-white dark:bg-[#1D2226]/90 dark:bg-[#1D2226]/90 backdrop-blur-md border-b border-slate-200 dark:border-[#38434F]/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => !tab.locked && setActiveTab(tab.id)}
                disabled={tab.locked}
                className={`relative flex items-center gap-2 px-4 py-3.5 text-xs font-bold whitespace-nowrap border-none bg-transparent transition-colors ${
                  tab.locked
                    ? 'text-slate-300 dark:text-[#B0B7BE] cursor-not-allowed'
                    : activeTab === tab.id
                      ? 'text-[#7C3AED] cursor-pointer'
                      : 'text-slate-500 dark:text-[#B0B7BE] hover:text-slate-800 dark:text-white dark:hover:text-white cursor-pointer'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.locked && <Lock size={12} />}
                {activeTab === tab.id && !tab.locked && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#7C3AED] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 lg:gap-8">
        <div className="min-w-0 space-y-6">
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {canPost && (
                <button
                  type="button"
                  onClick={() => setShowPostModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer shadow-sm transition-colors"
                >
                  <MessageSquarePlus size={16} /> Create Post
                </button>
              )}
              {(hasJoined || isAlreadyMember) && !canPost && userRole !== 'guest' && (
                <div className="px-4 py-3 rounded-xl bg-purple-50 border border-purple-100 text-xs font-semibold text-purple-800 leading-relaxed">
                  You joined as a member. You can view posts and updates; only students from this college can post here.
                </div>
              )}
              {posts.length > 0 ? (
                posts.map((post: any) => {
                  const s = getTypeStyle(post.type)
                  return (
                    <article
                      key={post.id}
                      onClick={() => router.push(`/community/c/${community.slug}/p/${post.id}`)}
                      className="bg-white dark:bg-[#1D2226] rounded-2xl border border-slate-200 dark:border-[#38434F]/80 shadow-sm p-4 sm:p-5 cursor-pointer hover:border-purple-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {post.is_college_post ? (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/colleges/${post.communities?.colleges?.slug || post.communities?.slug}`)
                                }}
                                className="w-10 h-10 rounded-xl shrink-0 overflow-hidden flex items-center justify-center text-sm font-bold text-white border-none cursor-pointer bg-slate-100 dark:bg-[#283036]"
                              >
                                {post.communities?.colleges?.logo_url ? (
                                  <img src={post.communities.colleges.logo_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  post.communities?.colleges?.name?.[0] || post.communities?.colleges?.short_name?.[0] || 'C'
                                )}
                              </button>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      router.push(`/colleges/${post.communities?.colleges?.slug || post.communities?.slug}`)
                                    }}
                                    className="text-sm font-bold text-slate-900 dark:text-white hover:text-[#7C3AED] border-none bg-transparent cursor-pointer p-0 truncate max-w-full"
                                  >
                                    {post.communities?.colleges?.name || post.communities?.colleges?.short_name || 'College'}
                                  </button>
                                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                                    Official
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border" style={{ color: s.color, background: s.bg, borderColor: s.border }}>{s.label}</span>
                                  <span className="text-[10px] text-slate-400 dark:text-[#B0B7BE] font-semibold inline-flex items-center gap-1">
                                    <Clock size={10} /> {timeAgo(post.created_at)}
                                  </span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/u/${post.users?.unique_id}`)
                                }}
                                className={`w-10 h-10 rounded-xl shrink-0 overflow-hidden flex items-center justify-center text-sm font-bold text-white border-none cursor-pointer ${
                                  post.users?.avatar_url
                                    ? 'bg-slate-100 dark:bg-[#283036]'
                                    : post.users?.role === 'senior'
                                      ? 'bg-gradient-to-br from-emerald-500 to-teal-400'
                                      : 'bg-gradient-to-br from-[#7C3AED] to-indigo-500'
                                }`}
                              >
                                {post.users?.avatar_url ? (
                                  <img src={post.users.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  post.users?.full_name?.[0]
                                )}
                              </button>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/u/${post.users?.unique_id}`)
                                  }}
                                  className="text-sm font-bold text-slate-900 dark:text-white hover:text-[#7C3AED] flex items-center gap-1.5 border-none bg-transparent cursor-pointer p-0 truncate max-w-full"
                                >
                                  {post.users?.full_name}
                                  {post.users?.role === 'senior' && <Crown size={12} className="text-amber-500 shrink-0" />}
                                </button>
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                  {post.is_network_post && (
                                    <span className="text-[9px] font-bold uppercase text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">Network</span>
                                  )}
                                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border" style={{ color: s.color, background: s.bg, borderColor: s.border }}>{s.label}</span>
                                  <span className="text-[10px] text-slate-400 dark:text-[#B0B7BE] font-semibold inline-flex items-center gap-1">
                                    <Clock size={10} /> {timeAgo(post.created_at)}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <button type="button" onClick={(e) => e.stopPropagation()} className="text-slate-300 dark:text-[#B0B7BE] hover:text-slate-500 dark:text-[#B0B7BE] dark:hover:text-[#B0B7BE] border-none bg-transparent cursor-pointer p-1 shrink-0">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>

                      {post.title && (
                        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white m-0 mb-2 leading-snug">{post.title}</h2>
                      )}
                      <div className="text-sm text-slate-600 dark:text-[#B0B7BE] leading-relaxed line-clamp-3 mb-3">{convertUrlsToLinks(post.content)}</div>
                      <MediaGallery imageUrls={post.image_url} />

                      <div className="flex flex-wrap items-center gap-4 pt-3 mt-3 border-t border-slate-100 dark:border-[#38434F] text-xs font-semibold text-slate-500 dark:text-[#B0B7BE]">
                        <span className="inline-flex items-center gap-1.5">
                          <ArrowUp size={14} className="text-purple-600" />
                          {post.upvote_count ?? 0} upvotes
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MessageSquarePlus size={14} className="text-teal-600" />
                          {post.answer_count ?? 0} replies
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Activity size={14} className="opacity-50" />
                          {post.view_count || 0} views
                        </span>
                        <button type="button" onClick={(e) => e.stopPropagation()} className="ml-auto text-slate-400 dark:text-[#B0B7BE] hover:text-slate-600 dark:text-[#B0B7BE] dark:hover:text-[#B0B7BE] border-none bg-transparent cursor-pointer p-1">
                          <Share2 size={15} />
                        </button>
                      </div>
                    </article>
                  )
                })
              ) : (
                <div className="text-center py-16 px-6 bg-white dark:bg-[#1D2226] rounded-2xl border border-slate-200 dark:border-[#38434F]/80">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-50 flex items-center justify-center text-[#7C3AED]">
                    <MessageSquare size={32} />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white m-0 mb-2">No posts yet</h3>
                  <p className="text-sm text-slate-500 dark:text-[#B0B7BE] max-w-sm mx-auto m-0 leading-relaxed">Be the first to start a conversation in your college community.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="space-y-4">
              {canViewJobs ? (
                <>
                  {jobs && jobs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {jobs.map((job: any) => (
                        <article key={job.id} className="bg-white dark:bg-[#1D2226] rounded-2xl border border-slate-200 dark:border-[#38434F]/80 shadow-sm p-5 hover:border-purple-200 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-[#283036] border border-slate-100 dark:border-[#38434F] flex items-center justify-center text-2xl shrink-0">
                              🏢
                            </div>
                            {job.referral_available && (
                              <span className="text-[9px] font-bold uppercase text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                                Referral active
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white m-0 mb-0.5 leading-snug">{job.role}</h3>
                          <p className="text-sm font-semibold text-slate-500 dark:text-[#B0B7BE] m-0 mb-4">{job.company_name}</p>

                          <div className="flex flex-wrap gap-2 mb-5">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-[#B0B7BE] bg-slate-50 dark:bg-[#283036] px-2.5 py-1 rounded-lg">
                              <MapPin size={12} className="opacity-60" /> {job.location || 'Remote'}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-[#B0B7BE] bg-slate-50 dark:bg-[#283036] px-2.5 py-1 rounded-lg">
                              <Clock size={12} className="opacity-60" /> {job.job_type?.replace('_', ' ')}
                            </span>
                            {job.salary_range && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-[#B0B7BE] bg-slate-50 dark:bg-[#283036] px-2.5 py-1 rounded-lg">
                                <DollarSign size={12} className="opacity-60" /> {job.salary_range}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <a
                              href={job.description}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-center py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-xs font-bold no-underline transition-colors"
                            >
                              View details
                            </a>
                            {currentUser?.id !== job.posted_by && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedJob(job)
                                  setReferralConfirmOpen(true)
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer transition-colors"
                              >
                                Get referral
                              </button>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 px-6 bg-white dark:bg-[#1D2226] rounded-2xl border border-slate-200 dark:border-[#38434F]/80">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Briefcase size={32} />
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white m-0 mb-2">Seeking opportunities</h3>
                      <p className="text-sm text-slate-500 dark:text-[#B0B7BE] max-w-sm mx-auto m-0 leading-relaxed">Internal referrals from seniors and alumni will appear here once posted.</p>
                    </div>
                  )}
                </>
              ) : (
                <LockScreen title="Career Network Locked" description="Gain access to unlisted jobs and internships through internal referrals from your university seniors." userRole={userRole} ctaText="Verify my ID" ctaAction={() => router.push('/onboarding')} />
              )}
            </div>
          )}

          {activeTab === 'webinars' && (
            <div className="space-y-4">
              {canViewWebinars ? (
                <div className="text-center py-16 px-6 bg-white dark:bg-[#1D2226] rounded-2xl border border-slate-200 dark:border-[#38434F]/80">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                    <Video size={32} />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white m-0 mb-2">Academy Live</h3>
                  <p className="text-sm text-slate-500 dark:text-[#B0B7BE] max-w-sm mx-auto m-0 leading-relaxed">Live expert sessions and alumni workshops are being curated for your campus.</p>
                </div>
              ) : (
                <LockScreen title="Claspire Academy Locked" description="Unlock live career masterclasses, alumni webinars, and doubt-clearing sessions." userRole={userRole} ctaText="Enter Academy" ctaAction={() => router.push('/onboarding')} />
              )}
            </div>
          )}

          {/* Student Groups */}
          <section className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white m-0">Student Groups</h2>
                <p className="text-sm text-slate-500 dark:text-[#B0B7BE] font-medium mt-1 m-0">Focused discussions within your campus</p>
              </div>
              {currentUser && isUserCollege && (
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer shadow-sm transition-colors shrink-0"
                >
                  <Users size={16} />
                  Create Group
                </button>
              )}
            </div>

            {groupsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-[#1D2226] rounded-2xl border border-slate-200 dark:border-[#38434F]/80 p-5 animate-pulse">
                    <div className="flex gap-3 mb-4">
                      <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-[#283036] shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-3/5 rounded bg-slate-100 dark:bg-[#283036]" />
                        <div className="h-2.5 w-2/5 rounded bg-slate-100 dark:bg-[#283036]" />
                      </div>
                    </div>
                    <div className="h-3 w-full rounded bg-slate-100 dark:bg-[#283036] mb-2" />
                    <div className="h-3 w-4/5 rounded bg-slate-100 dark:bg-[#283036]" />
                  </div>
                ))}
              </div>
            ) : studentGroups.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {studentGroups.map((group: any) => (
                  <article
                    key={group.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/community/c/${slug}/group/${group.slug}`)}
                    onKeyDown={(e) => e.key === 'Enter' && router.push(`/community/c/${slug}/group/${group.slug}`)}
                    className="bg-white dark:bg-[#1D2226] rounded-2xl border border-slate-200 dark:border-[#38434F]/80 shadow-sm p-4 sm:p-5 cursor-pointer hover:border-purple-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white border-2 border-slate-100 dark:border-[#38434F] bg-gradient-to-br from-[#7C3AED] to-cyan-500">
                          {group.creator?.avatar_url ? (
                            <img src={group.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            group.creator?.full_name?.[0] || 'A'
                          )}
                        </div>
                        {group.creator?.role === 'senior' && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white dark:border-[#38434F]">
                            <Crown size={8} className="text-white" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white m-0 truncate">{group.creator?.full_name || 'Group Admin'}</p>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                            group.creator?.role === 'senior' ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700'
                          }`}>
                            {group.creator?.role === 'senior' ? 'Senior' : 'Admin'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-[#B0B7BE] font-medium m-0 mt-0.5">
                          Created {new Date(group.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white m-0 leading-snug flex-1">{group.name}</h3>
                        {(group.scope === 'private' || group.is_private) ? (
                          <Lock size={14} className="text-amber-600 shrink-0" />
                        ) : group.scope === 'college' ? (
                          <GraduationCap size={14} className="text-indigo-500 shrink-0" />
                        ) : (
                          <Globe size={14} className="text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-[#B0B7BE] m-0 line-clamp-2 leading-relaxed">
                        {group.description || 'No description provided'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-[#B0B7BE]">
                        <Users size={12} /> {group.member_count} members
                      </span>
                      {(group.scope === 'private' || group.is_private) ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          <Lock size={8} /> Private
                        </span>
                      ) : group.scope === 'college' ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          <GraduationCap size={8} /> College only
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <Globe size={8} /> Public
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/community/c/${slug}/group/${group.slug}`)
                      }}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold border-none cursor-pointer flex items-center justify-center gap-1.5 transition-colors ${
                        group.is_joined
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-[#7C3AED] hover:bg-purple-700 text-white'
                      }`}
                    >
                      {group.is_joined ? (
                        <><CheckCircle size={14} /> Visit group</>
                      ) : (
                        'Join group'
                      )}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-6 bg-white dark:bg-[#1D2226] rounded-2xl border border-slate-200 dark:border-[#38434F]/80">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-50 flex items-center justify-center text-[#7C3AED]">
                  <Users size={32} />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white m-0 mb-2">No groups yet</h3>
                <p className="text-sm text-slate-500 dark:text-[#B0B7BE] max-w-sm mx-auto m-0 mb-6 leading-relaxed">
                  Be the first to create a student group in your community.
                </p>
                {currentUser && isUserCollege ? (
                  <button
                    type="button"
                    onClick={() => setShowCreateGroupModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer transition-colors"
                  >
                    <Users size={16} />
                    Create first group
                  </button>
                ) : currentUser ? (
                  <div className="max-w-sm mx-auto px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#283036] border border-slate-200 dark:border-[#38434F]">
                    <p className="text-sm text-slate-500 dark:text-[#B0B7BE] m-0">
                      Only students from {data?.community?.colleges?.name || 'this college'} can create groups here.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push('/signup')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer transition-colors"
                  >
                    Sign up to create groups
                  </button>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col gap-4 lg:sticky lg:top-[7.5rem] lg:self-start">
          <div className="bg-white dark:bg-[#1D2226] rounded-2xl border border-slate-200 dark:border-[#38434F]/80 shadow-sm p-4">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-3 flex items-center gap-1.5 m-0">
              <Zap size={12} /> Community pulse
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Seniors', val: verifiedSeniors, icon: <Crown size={14} className="text-purple-600" />, bg: 'bg-purple-50' },
                { label: 'Members', val: totalMembers, icon: <Users size={14} className="text-cyan-600" />, bg: 'bg-cyan-50' },
                { label: 'Posts', val: posts?.length || 0, icon: <MessageCircle size={14} className="text-amber-600" />, bg: 'bg-amber-50' },
                { label: 'Jobs', val: jobs?.length || 0, icon: <Target size={14} className="text-emerald-600" />, bg: 'bg-emerald-50' },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-xl bg-slate-50 dark:bg-[#283036] border border-slate-100 dark:border-[#38434F]">
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>{s.icon}</div>
                  <p className="text-lg font-extrabold text-slate-900 dark:text-white m-0 leading-none">{s.val}</p>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-[#B0B7BE] mt-1 m-0">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#1D2226] rounded-2xl border border-slate-200 dark:border-[#38434F]/80 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 dark:text-white m-0">Top contributors</h4>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <Star size={10} fill="currentColor" /> Weekly
              </span>
            </div>
            <div className="space-y-2">
              {topContributors.length > 0 ? topContributors.map(([id, c]: any, i) => (
                <div key={id} className={`flex items-center gap-3 p-2 rounded-xl ${i === 0 ? 'bg-purple-50/80' : ''}`}>
                  <div className="relative shrink-0">
                    <div className={`w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center text-xs font-bold text-white ${
                      c.avatar_url ? 'bg-slate-100 dark:bg-[#283036]' : c.role === 'senior' ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-purple-600 to-indigo-600'
                    }`}>
                      {c.avatar_url ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover" /> : c.name[0]}
                    </div>
                    {i < 3 && (
                      <span className="absolute -bottom-1 -right-1 text-[10px]">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white m-0 truncate">{c.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-[#B0B7BE] font-semibold m-0">{c.count} posts</p>
                  </div>
                  {i === 0 && <Award size={16} className="text-amber-500 shrink-0" />}
                </div>
              )) : (
                <p className="text-xs text-slate-400 dark:text-[#B0B7BE] text-center py-4 m-0">No contributors yet</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-[#1D2226] rounded-2xl border border-slate-200 dark:border-[#38434F]/80 shadow-sm p-4">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 dark:text-white mb-3 flex items-center gap-1.5 m-0">
              <Shield size={14} className="text-red-500" /> Guidelines
            </h4>
            <ul className="space-y-3 m-0 p-0 list-none">
              {[
                { t: 'Stay constructive', d: 'Ask doubts that help everyone learn.' },
                { t: 'Respect privacy', d: 'Connect through Claspire only.' },
                { t: 'Trust verified seniors', d: 'Prioritize guidance from verified mentors.' },
              ].map((r, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-xs font-extrabold text-purple-300 w-4 shrink-0">{i + 1}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-white m-0">{r.t}</p>
                    <p className="text-[11px] text-slate-500 dark:text-[#B0B7BE] m-0 mt-0.5 leading-relaxed">{r.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* ── MODALS ── */}
      <PostModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        communityId={community.id}
        communitySlug={community.slug}
        onSuccess={handlePostSuccess}
        userRole={userRole}
        canPostAsCollege={!!isCollegeAdmin}
        collegeName={community.colleges?.name}
        collegeLogo={community.colleges?.logo_url}
        collegeSlug={community.colleges?.slug}
      />

      {/* Referral Confirmation Modal */}
      {referralConfirmOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="animate-fade bg-white dark:bg-[#1D2226]" style={{ width: '100%', maxWidth: 400, borderRadius: 28, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.4)', padding: 32, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#7C3AED' }}>
              <Target size={32} />
            </div>
            <h3 className="text-slate-900 dark:text-white" style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Confirm Referral Request</h3>
            <p className="text-slate-500 dark:text-[#B0B7BE]" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Requesting a referral for <b>{selectedJob?.role}</b> at <b>{selectedJob?.company_name}</b>.
              Your profile will be shared with the senior for review.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setReferralConfirmOpen(false)}
                disabled={requestLoading}
                style={{ flex: 1, border: '1px solid #E2E8F0', padding: '12px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                className="bg-[#F8FAFC] dark:bg-[#1D2226] text-slate-500 dark:text-[#B0B7BE]"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestReferral}
                disabled={requestLoading}
                style={{ flex: 2, background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', color: 'white', border: 'none', padding: '12px', borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: requestLoading ? 0.7 : 1 }}
              >
                {requestLoading ? 'Sending...' : 'Confirm Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="animate-fade bg-white dark:bg-[#1D2226]" style={{ width: '100%', maxWidth: 600, maxHeight: '80vh', borderRadius: 28, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '24px 24px 16px' }} className="border-b border-slate-100 dark:border-[#38434F]">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 className="text-slate-900 dark:text-white" style={{ fontSize: 20, fontWeight: 800, margin: 0, marginBottom: 4 }}>Community Members</h3>
                  <p className="text-slate-500 dark:text-[#B0B7BE]" style={{ fontSize: 13, margin: 0 }}>
                    {memberCounts.total} total · {memberCounts.ownStudents} own students · {memberCounts.ownSeniors} seniors · {memberCounts.otherCollege} other colleges
                  </p>
                </div>
                <button
                  onClick={() => setShowMembersModal(false)}
                  style={{ border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, transition: 'all 0.2s' }}
                  className="bg-transparent text-slate-500 dark:text-[#B0B7BE]"
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px 24px' }}>
              {membersLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-[#F8FAFC] dark:bg-[#1D2226] rounded-xl" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12 }}>
                      <div className="bg-slate-200 dark:bg-[#283036]" style={{ width: 40, height: 40, borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                      <div style={{ flex: 1 }}>
                        <div className="bg-slate-200 dark:bg-[#283036]" style={{ width: '60%', height: 12, borderRadius: 6, marginBottom: 6, animation: 'pulse 2s infinite' }} />
                        <div className="bg-slate-200 dark:bg-[#283036]" style={{ width: '40%', height: 10, borderRadius: 6, animation: 'pulse 2s infinite' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Own college — students */}
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#5B21B6', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <GraduationCap size={15} />
                      Own College — Students ({memberGroups.ownStudents.length})
                    </h4>
                    {memberGroups.ownStudents.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {memberGroups.ownStudents.map((member) =>
                          renderMemberRow(member, {
                            bg: '#F5F3FF',
                            border: '#DDD6FE',
                            avatarBg: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                          })
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-400 dark:text-[#B0B7BE] dark:bg-[#1D2226]" style={{ fontSize: 12, margin: 0, padding: '8px 12px', background: '#F8FAFC', borderRadius: 10 }}>
                        No students from this college yet.
                      </p>
                    )}
                  </div>

                  {/* Own college — seniors */}
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#B45309', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <Crown size={15} />
                      Own College — Seniors ({memberGroups.ownSeniors.length})
                    </h4>
                    {memberGroups.ownSeniors.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {memberGroups.ownSeniors.map((member) =>
                          renderMemberRow(member, {
                            bg: '#FFFBEB',
                            border: '#FDE68A',
                            avatarBg: 'linear-gradient(135deg, #F59E0B, #D97706)',
                          })
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-400 dark:text-[#B0B7BE] dark:bg-[#1D2226]" style={{ fontSize: 12, margin: 0, padding: '8px 12px', background: '#F8FAFC', borderRadius: 10 }}>
                        No seniors from this college yet.
                      </p>
                    )}
                  </div>

                  {/* Other colleges — joined network */}
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0369A1', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <Globe size={15} />
                      Other Colleges — Joined ({memberGroups.otherCollege.length})
                    </h4>
                    {memberGroups.otherCollege.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {memberGroups.otherCollege.map((member) =>
                          renderMemberRow(member, {
                            bg: '#F0F9FF',
                            border: '#BAE6FD',
                            avatarBg: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                          })
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-400 dark:text-[#B0B7BE] dark:bg-[#1D2226]" style={{ fontSize: 12, margin: 0, padding: '8px 12px', background: '#F8FAFC', borderRadius: 10 }}>
                        No members from other colleges have joined yet.
                      </p>
                    )}
                  </div>

                  {memberCounts.total === 0 && !membersLoading && (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <Users size={48} className="text-slate-300 dark:text-[#B0B7BE]" style={{ margin: '0 auto 16px' }} />
                      <p className="text-slate-500 dark:text-[#B0B7BE]" style={{ fontSize: 16, margin: 0 }}>No members found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && currentUser && (
        <CreateGroupModal
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
          onSuccess={() => {
            setShowCreateGroupModal(false)
            fetchStudentGroups() // Refresh the groups list
            // Redirect to groups page with created parameter
            router.push('/groups?created=true')
          }}
          currentUser={{
            id: currentUser.id,
            is_premium: currentUser.is_premium || false,
            role: currentUser.role || 'student',
            college_id: currentUser.college_id
          }}
          communityId={data?.id}
        />
      )}

    </div>
  )
}

export default function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#1D2226] flex flex-col items-center justify-center gap-3 font-plus-jakarta-sans">
        <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-500 dark:text-[#B0B7BE] font-semibold">Loading community...</p>
      </div>
    }>
      <CommunityPageContent params={params} />
    </Suspense>
  )
}
