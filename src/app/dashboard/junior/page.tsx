'use client'
import {
  LayoutDashboard, HelpCircle, 
  Calendar, Users, Settings, 
  Flame, Zap, 
  ChevronRight, Plus, Clock,
  CheckCircle, Video, Briefcase,
  
  BarChart3, Menu, X, Trash2,
  Handshake, Sparkles, MessageSquare,
  ArrowUp, LogOut, User, GraduationCap, Pencil} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { usePoints } from '@/contexts/PointsContext'
import { motion, AnimatePresence } from 'framer-motion'

import NotificationBell from '@/components/NotificationBell'
import DeleteAccountModal from '@/components/DeleteAccountModal'
import AcceptedSeniorsSection from '@/components/junior/AcceptedSeniorsSection'
import CreateGroupModal from '@/components/CreateGroupModal'
import MyGroupsList from '@/components/MyGroupsList'
import DashboardMessages from '@/components/DashboardMessages'

interface DashData {
  user: {
    id: string
    full_name: string
    email: string
    unique_id: string
    rise_points: number
    rp_level: number
    doubt_count: number
    referral_count: number
    webinar_count: number
    is_verified: boolean
    avatar_url?: string
    banner_url?: string | null
    is_premium?: boolean
    role?: 'student' | 'senior'
    branch?: string
    year?: number | string
    passout_year?: number | string
    colleges: {
      id: string
      name: string
      short_name: string
      slug: string
    }
  } | null
  rpLog: Array<{
    id: string
    points: number
    reason: string
    created_at: string
  }>
  myPosts: Array<{
    id: string
    title: string
    content: string
    image_url?: string
    upvote_count: number
    answer_count: number
    is_answered: boolean
    created_at: string
    communities: {
      display_name: string
      slug: string
    } | null
    users: {
      full_name: string
      avatar_url?: string
      unique_id: string
    }
  }>
  unreadCount: number
  dailyRPEarned: boolean
  myReferrals: Array<{
    id: string
    status: string
    created_at: string
    job: {
      company_name: string
      role: string
    }
    senior: {
      id: string
      full_name: string
      avatar_url?: string
      unique_id: string
    }
  }>
  joinedCommunities: Array<{
    id: string
    communities: {
      id: string
      slug: string
      display_name: string
    }
  }>
  webinars: Array<{
    id: string
    title: string
    description: string
    scheduled_at: string
    duration: string
    communities: {
      display_name: string
    }
    users: {
      id: string
      full_name: string
      avatar_url?: string
      unique_id: string
    }
  }>
}

export default function JuniorDashboard() {
  const router = useRouter()
  const { showAward } = usePoints()
  const [authChecked, setAuthChecked] = useState(false)
  const [dashData, setDashData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [initialMessageUser, setInitialMessageUser] = useState<string | undefined>(undefined)
  const [hasOpenedMessages, setHasOpenedMessages] = useState(false)

  const searchParams = useSearchParams()

  // Handle URL parameters for active tab
  useEffect(() => {
    const tab = searchParams.get('activeTab')
    const targetUser = searchParams.get('user')

    if (tab && ['overview', 'doubts', 'webinars', 'community', 'referrals', 'events', 'messages'].includes(tab)) {
      setActiveTab(tab === 'webinars' ? 'events' : tab)
    }

    if (targetUser) {
      setInitialMessageUser(targetUser)
      setActiveTab('messages')
      setHasOpenedMessages(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (activeTab === 'messages') {
      setHasOpenedMessages(true)
    }
  }, [activeTab])
  const [doubtSearch, setDoubtSearch] = useState('')
  const [doubtFilter, setDoubtFilter] = useState<'all' | 'answered' | 'pending'>('all')
  const [eventSearch, setEventSearch] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [userCollegeCommunityId, setUserCollegeCommunityId] = useState<string>('')

  useEffect(() => {
    init()
    fetchUserCollegeCommunity()
  }, [])

  const fetchUserCollegeCommunity = async () => {
    try {
      console.log('Fetching user college community...')
      const res = await fetch('/api/community/my-college')
      if (res.ok) {
        const data = await res.json()
        console.log('College community data:', data)
        setUserCollegeCommunityId(data.communityId || '')
      } else {
        console.error('Failed to fetch college community:', res.status, res.statusText)
      }
    } catch (err) {
      console.error('Failed to fetch college community:', err)
    }
  }

  useEffect(() => {
    const handleClick = () => setShowDeleteConfirm(null)
    if (showDeleteConfirm) {
      setTimeout(() => document.addEventListener('click', handleClick), 100)
    }
    return () => document.removeEventListener('click', handleClick)
  }, [showDeleteConfirm])

  const init = async () => {
    try {
      const res = await fetch('/api/dashboard/me')
      if (!res.ok) {
        router.replace('/login')
        return
      }
      const data = await res.json()
      if (data.user?.role === 'senior') {
        router.replace('/dashboard/senior')
        return
      }
      setDashData(data)
      setAuthChecked(true)
    } catch {
      router.replace('/login')
    } finally {
      setLoading(false)
    }
  }

  const getRPLevel = (points: number) => {
    if (points >= 5000) return { label: 'Legend', emoji: '👑', next: null, color: '#F59E0B' }
    if (points >= 1500) return { label: 'Champion', emoji: '🏆', next: 5000, color: '#7C3AED' }
    if (points >= 500) return { label: 'Mentor', emoji: '💎', next: 1500, color: '#06B6D4' }
    if (points >= 100) return { label: 'Contributor', emoji: '🌟', next: 500, color: '#16A34A' }
    return { label: 'Explorer', emoji: '🌱', next: 100, color: '#8B5CF6' }
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

  const parsePostImages = (image_url?: string) => {
    if (!image_url) return []

    if (typeof image_url !== 'string') {
      return [String(image_url)]
    }

    const trimmed = image_url.trim()
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.filter((item) => typeof item === 'string') as string[]
        }
        if (typeof parsed === 'string') {
          return [parsed]
        }
      } catch {
        // fallback to raw string
      }
    }

    return [trimmed]
  }

  const handleDeletePost = async (postId: string) => {
    setDeletingId(postId)
    try {
      const res = await fetch('/api/posts/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId })
      })
      if ((await res.json()).success) {
        setDashData(prev => prev ? { ...prev, myPosts: prev.myPosts.filter(p => p.id !== postId) } : null)
        setShowDeleteConfirm(null)
      }
    } catch (err) { console.error(err) } finally { setDeletingId(null) }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch('/api/user/delete-account', { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        localStorage.clear()
        window.location.href = '/'
      } else {
        alert('Failed to delete account. Please try again.')
        setIsDeleting(false)
      }
    } catch (err) {
      alert('Something went wrong. Please try again.')
      setIsDeleting(false)
    }
  }

  if (loading || !authChecked || !dashData || !dashData.user) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F8FAFC] dark:bg-[#1D2226] flex-col gap-4 font-plus-jakarta-sans">
        <div className="w-12 h-12 border-[3px] border-slate-100 dark:border-[#38434F] border-t-purple-600 rounded-full animate-spin" />
        <p className="text-slate-400 dark:text-[#B0B7BE] text-sm font-semibold animate-pulse">Initializing Dashboard...</p>
      </div>
    )
  }

  const u = dashData.user!
  const rp = getRPLevel(u.rise_points)
  const rpProgress = rp.next ? Math.min((u.rise_points / rp.next) * 100, 100) : 100

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'doubts', label: 'My Doubts', icon: <HelpCircle size={18} /> },
    { id: 'events', label: 'Webinars', icon: <Video size={18} /> },
    { id: 'community', label: 'Community', icon: <Users size={18} /> },
    { id: 'referrals', label: 'Referrals', icon: <Handshake size={18} /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare size={18} /> },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#1D2226] font-plus-jakarta-sans text-[#0F172A] dark:text-white antialiased">

      {/* ═══ MOBILE SIDEBAR OVERLAY ═══ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ═══ SIDEBAR NAVIGATION ═══ */}
      <aside className={`fixed top-0 left-0 h-full w-[280px] bg-white dark:bg-[#283036] border-r border-slate-200/60 dark:border-[#38434F] z-[101] flex flex-col justify-between transition-all duration-300 transform lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-10">
            <Link href="/" className="inline-block no-underline">
              <span className="font-plus-jakarta-sans font-black text-xl text-[#0F172A] dark:text-white tracking-tight">
                cl<span className="text-[#7C3AED]">aspire</span>
              </span>
            </Link>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1D2226] text-slate-500 dark:text-[#B0B7BE] hover:text-slate-700 dark:text-[#B0B7BE] dark:hover:text-[#B0B7BE] transition-colors border border-slate-200/50 dark:border-[#38434F] shadow-sm cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <nav className="space-y-1.5">
            <p className="text-[10px] font-extrabold text-[#94A3B8] dark:text-[#B0B7BE] uppercase tracking-[0.2em] ml-3 mb-4">Student Hub</p>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { 
                  setActiveTab(item.id); 
                  router.push('?activeTab=' + item.id, { scroll: false });
                  setMobileMenuOpen(false); 
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group cursor-pointer ${activeTab === item.id
                    ? 'bg-[#F5F3FF] text-[#7C3AED] shadow-sm shadow-purple-500/5'
                    : 'text-[#64748B] dark:text-[#B0B7BE] hover:bg-[#F8FAFC] dark:bg-[#1D2226] dark:hover:bg-[#1D2226] hover:text-[#0F172A] dark:text-white dark:hover:text-white'
                  }`}
              >
                <span className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110 text-[#7C3AED]' : 'text-slate-400 dark:text-[#B0B7BE] group-hover:scale-110 group-hover:text-slate-600 dark:text-[#B0B7BE] dark:group-hover:text-[#B0B7BE] dark:hover:text-[#B0B7BE]'}`}>
                  {item.icon}
                </span>
                {item.label}
                {activeTab === item.id && (
                  <motion.div layoutId="nav-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Rise Points Mini Card */}
        <div className="p-6">
          <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-purple-500/20 transition-colors" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-[#B0B7BE] m-0">Rise Points</p>
                <Flame size={16} className="text-[#F59E0B] animate-pulse" />
              </div>
              <div className="text-3xl font-bold mb-1 text-white tracking-tight">{u.rise_points}</div>
              <div className="text-[10px] font-extrabold text-purple-300 mb-4 flex items-center gap-1.5 bg-white/5 w-fit px-2 py-0.5 rounded-full border border-white/5">
                {rp.emoji} {rp.label}
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-bold text-slate-400 dark:text-[#B0B7BE]">
                  <span>Level Progress</span>
                  <span className="text-purple-300">{Math.round(rpProgress)}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${rpProgress}%` }}
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <main className="lg:ml-[280px] min-h-screen pb-20">

        {/* MOBILE TOP HEADER BAR */}
        <div className="lg:hidden sticky top-0 bg-white/85 backdrop-blur-md border-b border-slate-200/60 dark:border-[#38434F] z-30 px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#1D2226] text-slate-700 dark:text-[#B0B7BE] transition-colors border border-slate-200/50 dark:border-[#38434F] shadow-sm cursor-pointer"
          >
            <Menu size={20} />
          </button>
          
          <span className="font-plus-jakarta-sans font-black text-base text-[#0F172A] dark:text-white tracking-tight">
            cl<span className="text-[#7C3AED]">aspire</span>
          </span>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className={`w-8 h-8 rounded-xl ${u.avatar_url ? 'bg-transparent' : 'bg-gradient-to-br from-purple-500 to-indigo-600'} flex items-center justify-center text-white text-xs font-bold overflow-hidden border border-slate-200/60 dark:border-[#38434F] shadow-sm`}>
              {u.avatar_url ? (
                <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" />
              ) : (
                u.full_name[0].toUpperCase()
              )}
            </div>
          </div>
        </div>

        {/* PREMIUM PROFILE HERO CARD (LinkedIn Style) */}
        <div className="px-4 md:px-12 pt-6 md:pt-8">
          <div className="bg-white dark:bg-[#283036] rounded-3xl border border-slate-200/60 dark:border-[#38434F] overflow-hidden shadow-sm relative group">
            {/* User Banner */}
            <div
              className="h-36 md:h-64 bg-slate-950 relative overflow-hidden transition-all duration-300"
              style={u.banner_url ? {
                background: `url(${u.banner_url}) center/cover no-repeat`
              } : undefined}
            >
              {!u.banner_url && <div className="absolute inset-0 bg-grid-white/5 opacity-20" />}
            </div>
            {/* Profile Detail Block */}
            <div className="px-6 md:px-8 pb-6 md:pb-8 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
              
              {/* Profile Avatar & Metadata */}
<div className="flex flex-col md:flex-row items-center md:items-end gap-5 -mt-8 md:-mt-10 relative z-10 text-center md:text-left">                {/* Avatar with White Border */}
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-white dark:bg-[#283036] p-1 shadow-md flex items-center justify-center overflow-hidden flex-shrink-0">
                  <div className={`w-full h-full rounded-2xl ${u.avatar_url ? 'bg-transparent' : 'bg-gradient-to-br from-purple-500 to-indigo-600'} flex items-center justify-center text-white text-3xl font-bold overflow-hidden`}>
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" />
                    ) : (
                      u.full_name[0].toUpperCase()
                    )}
                  </div>
                </div>

                <div className="pt-2 md:pt-0">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white m-0 tracking-tight leading-none">{u.full_name}</h1>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-purple-600 text-[9px] font-extrabold tracking-wider uppercase">
                      <Sparkles size={8} /> Verified Student
                    </span>
                  </div>

                  <p className="text-[#64748B] dark:text-[#B0B7BE] text-xs font-semibold m-0 flex items-center justify-center md:justify-start gap-1.5">
                    <GraduationCap size={14} className="text-slate-400 dark:text-[#B0B7BE]" />
                    <span>{u.colleges?.name} ({u.colleges?.short_name})</span>
                  </p>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3 text-[10px] font-bold text-slate-500 dark:text-[#B0B7BE] uppercase tracking-wider">
                    <span className="bg-slate-50 dark:bg-[#1D2226] border border-slate-200/60 dark:border-[#38434F] px-3 py-1 rounded-xl">
                      {u.branch || 'General Branch'}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 hidden md:inline" />
                    <span className="bg-slate-50 dark:bg-[#1D2226] border border-slate-200/60 dark:border-[#38434F] px-3 py-1 rounded-xl">
                      Year {u.year || '1'} (Class of {u.passout_year || '2025'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center md:justify-end gap-3 self-center md:self-auto w-full md:w-auto relative z-10">
                <button
                  onClick={() => router.push('/jobs')}
                  className="flex-1 md:flex-initial bg-slate-50 dark:bg-[#1D2226] hover:bg-slate-100 dark:hover:bg-[#1D2226] border border-slate-200/60 dark:border-[#38434F] text-[#0F172A] dark:text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-sm hover:scale-102 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Briefcase size={14} /> Explore Jobs
                </button>
                <button
                  onClick={() => router.push('/community?create=true')}
                  className="flex-1 md:flex-initial bg-slate-900 hover:bg-black text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-sm hover:scale-102 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus size={14} /> Ask a Doubt
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* ═══ MAIN GRID SYSTEM ═══ */}
        {hasOpenedMessages && (
          <div className={`px-4 md:px-12 mt-6 md:mt-8 ${activeTab === 'messages' ? 'block' : 'hidden'}`}>
            <DashboardMessages 
              currentUserId={u.id}
              role="junior"
              initialUserId={initialMessageUser}
            />
          </div>
        )}
        
        <div className={`px-4 md:px-12 mt-6 md:mt-8 ${activeTab !== 'messages' ? 'block' : 'hidden'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* LEFT COLUMN: MAIN TAB CONTENT (8 COLS) */}
            <div className="lg:col-span-8 space-y-8">

              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                    className="space-y-8"
                  >
                    {/* My Student Groups Card */}
                    <div className="bg-white dark:bg-[#283036] rounded-3xl border border-slate-200/60 dark:border-[#38434F] p-6 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                            <Users size={16} />
                          </div>
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider m-0">My Mentorship Groups</h3>
                        </div>
                        <button
                          onClick={() => setShowCreateGroupModal(true)}
                          className="px-3.5 py-2 bg-slate-50 dark:bg-[#1D2226] border border-slate-200/60 dark:border-[#38434F] text-slate-700 dark:text-[#B0B7BE] hover:bg-slate-100 dark:hover:bg-[#1D2226] rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Plus size={14} /> Create
                        </button>
                      </div>
                      <MyGroupsList />
                    </div>

                    {/* Premium SaaS Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { label: 'Doubts Asked', value: u.doubt_count, icon: <HelpCircle size={20} />, trend: '+1 this week', bg: 'from-purple-500/5 to-indigo-500/5', border: 'hover:border-purple-200', iconColor: 'text-purple-600 bg-purple-50' },
                        { label: 'Active Referrals', value: dashData.myReferrals.length, icon: <Handshake size={20} />, trend: 'Direct Tracking', bg: 'from-cyan-500/5 to-blue-500/5', border: 'hover:border-cyan-200', iconColor: 'text-cyan-600 bg-cyan-50' },
                        { label: 'Events Joined', value: u.webinar_count, icon: <Video size={20} />, trend: 'Live Seminars', bg: 'from-amber-500/5 to-orange-500/5', border: 'hover:border-amber-200', iconColor: 'text-amber-600 bg-amber-50' },
                      ].map((stat, i) => (
                        <div key={i} className={`bg-gradient-to-br ${stat.bg} bg-white dark:bg-[#283036] p-6 rounded-3xl border border-slate-200/60 dark:border-[#38434F] ${stat.border} shadow-sm hover:shadow-md transition-all group flex flex-col justify-between min-h-[160px] cursor-pointer`}>
                          <div className="flex justify-between items-start">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconColor} transition-transform group-hover:scale-105 duration-300`}>
                              {stat.icon}
                            </div>
                            <span className="text-[9px] font-black text-slate-500 dark:text-[#B0B7BE] bg-slate-100 dark:bg-[#283036] px-2.5 py-1 rounded-full">{stat.trend}</span>
                          </div>
                          <div className="mt-4">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-wider mb-1">{stat.label}</p>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white leading-none tracking-tight">{stat.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Recent Activity (RP Log Timeline) */}
                    <div className="bg-white dark:bg-[#283036] rounded-3xl border border-slate-200/60 dark:border-[#38434F] overflow-hidden shadow-sm">
                      <div className="p-6 border-b border-slate-100 dark:border-[#38434F] flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Zap size={16} />
                          </div>
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider m-0">Recent Activity</h3>
                        </div>
                        <span className="text-[9px] font-black text-[#94A3B8] dark:text-[#B0B7BE] bg-slate-50 dark:bg-[#1D2226] border border-slate-100 dark:border-[#38434F] px-3 py-1 rounded-full uppercase tracking-wider">Rewards Log</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-[#38434F]">
                        {dashData.rpLog.length > 0 ? dashData.rpLog.map((log) => (
                          <div key={log.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-[#1D2226]/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#1D2226] flex items-center justify-center border border-slate-100 dark:border-[#38434F] text-slate-400 dark:text-[#B0B7BE]">
                                <Zap size={15} className="text-purple-500" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-[#0F172A] dark:text-white m-0">{log.reason}</p>
                                <p className="text-[10px] font-semibold text-[#94A3B8] dark:text-[#B0B7BE] m-0 mt-1 flex items-center gap-1.5"><Clock size={11} /> {timeAgo(log.created_at)}</p>
                              </div>
                            </div>
                            <div className={`text-xs font-black px-3.5 py-1 rounded-full ${log.points > 0 ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                              {log.points > 0 ? '+' : ''}{log.points} RP
                            </div>
                          </div>
                        )) : (
                          <div className="p-16 text-center">
                            <BarChart3 size={32} className="mx-auto text-slate-200 dark:text-[#B0B7BE] mb-4" />
                            <p className="text-slate-400 dark:text-[#B0B7BE] text-xs font-semibold">No rewards activity logged yet.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Accepted Connections Section */}
                    <div className="bg-white dark:bg-[#283036] rounded-3xl border border-slate-200/60 dark:border-[#38434F] p-6 shadow-sm">
                      <AcceptedSeniorsSection />
                    </div>
                  </motion.div>
                )}

                {/* MY DOUBTS TAB */}
                {activeTab === 'doubts' && (
                  <motion.div
                    key="doubts" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#283036] p-6 rounded-3xl border border-slate-200/60 dark:border-[#38434F] shadow-sm">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight m-0">My Doubts Feed</h2>
                        <p className="text-[#64748B] dark:text-[#B0B7BE] text-xs font-semibold m-0 mt-1">Check answers and status for all your posted doubts.</p>
                      </div>
                      <div className="flex gap-1 bg-slate-50 dark:bg-[#1D2226] border border-slate-100 dark:border-[#38434F] p-1 rounded-xl self-start sm:self-auto">
                        {['all', 'answered', 'pending'].map(f => (
                          <button
                            key={f} onClick={() => setDoubtFilter(f as any)}
                            className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all capitalize cursor-pointer ${doubtFilter === f ? 'bg-white dark:bg-[#283036] shadow-sm text-purple-600' : 'text-slate-400 dark:text-[#B0B7BE] hover:text-slate-600 dark:text-[#B0B7BE] dark:hover:text-[#B0B7BE]'}`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {(() => {
                        const filteredPosts = dashData.myPosts.filter(p => doubtFilter === 'all' || (doubtFilter === 'answered' ? p.is_answered : !p.is_answered))
                        if (filteredPosts.length === 0) {
                          return (
                            <div className="rounded-3xl border border-dashed border-slate-200 dark:border-[#38434F] bg-white dark:bg-[#283036] p-12 text-center shadow-sm">
                              <HelpCircle size={32} className="mx-auto text-slate-300 dark:text-[#B0B7BE] mb-4" />
                              <p className="text-sm font-bold text-[#0F172A] dark:text-white mb-1">No doubts found</p>
                              <p className="text-xs text-[#64748B] dark:text-[#B0B7BE] font-semibold mb-6">You haven't asked any doubts matching this filter yet.</p>
                              <button
                                onClick={() => router.push('/community?create=true')}
                                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-black transition-transform cursor-pointer"
                              >
                                Ask First Doubt 🚀
                              </button>
                            </div>
                          )
                        }

                        return filteredPosts.map(post => (
                          <div key={post.id} className="group bg-white dark:bg-[#283036] p-6 rounded-3xl border border-slate-200/60 dark:border-[#38434F] hover:border-purple-200 transition-all shadow-sm hover:shadow-md relative overflow-hidden cursor-pointer">
                            <div className="flex justify-between items-center mb-4">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${post.is_answered ? 'bg-green-50 text-green-600 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                {post.is_answered ? '✓ Answered' : '⌛ Pending'}
                              </span>
                              
                              <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/dashboard/junior/edit-post/${post.id}?activeTab=doubts`)
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#1D2226] text-slate-500 dark:text-[#B0B7BE] hover:bg-purple-50 hover:text-purple-600 transition-all shadow-sm border border-slate-200/60"
                                  title="Edit Post"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(post.id) }}
                                  className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#1D2226] text-slate-500 dark:text-[#B0B7BE] hover:bg-red-50 hover:text-red-500 transition-all shadow-sm border border-slate-200/60"
                                  title="Delete Post"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex gap-4">
                              <div className={`w-9 h-9 rounded-xl ${post.users?.avatar_url ? 'bg-transparent' : 'bg-purple-100'} flex items-center justify-center text-purple-600 font-bold text-xs overflow-hidden flex-shrink-0 mt-0.5 border border-slate-200/60`}>
                                {post.users?.avatar_url ? (
                                  <img src={post.users.avatar_url} alt={post.users.full_name} className="w-full h-full object-cover" />
                                ) : (
                                  post.users?.full_name?.[0] || 'U'
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-base font-bold text-[#0F172A] dark:text-white group-hover:text-purple-600 transition-colors mb-1.5 tracking-tight leading-snug">{post.title}</h3>
                                <p className="text-xs font-semibold text-[#64748B] dark:text-[#B0B7BE] line-clamp-2 mb-4 leading-relaxed">{post.content}</p>
                                {parsePostImages(post.image_url).length > 0 && (
                                  <div className="mb-4 rounded-2xl overflow-hidden border border-slate-100 dark:border-[#38434F] max-w-sm shadow-sm">
                                    <img src={parsePostImages(post.image_url)[0]} alt="Post media" className="w-full h-auto object-cover max-h-52" />
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-[10px] font-bold text-[#94A3B8] dark:text-[#B0B7BE] border-t border-slate-100 dark:border-[#38434F] pt-3.5 mt-2">
                              <div className="flex gap-4">
                                <span className="flex items-center gap-1"><ArrowUp size={12} /> {post.upvote_count} Upvotes</span>
                                <span className="flex items-center gap-1"><MessageSquare size={12} /> {post.answer_count} Answers</span>
                              </div>
                              <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(post.created_at)}</span>
                            </div>

                            {showDeleteConfirm === post.id && (
                              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                                <p className="font-black text-[#0F172A] dark:text-white mb-1 text-base">Delete this doubt?</p>
                                <p className="text-xs text-[#64748B] dark:text-[#B0B7BE] mb-5 font-semibold">This action cannot be undone.</p>
                                <div className="flex gap-2 w-full max-w-xs">
                                  <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(null) }} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#38434F] font-bold text-xs text-[#64748B] dark:text-[#B0B7BE] hover:bg-slate-50 dark:hover:bg-[#1D2226] cursor-pointer">Cancel</button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id) }} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 cursor-pointer">Delete</button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      })()}
                    </div>
                  </motion.div>
                )}

                {/* WEBINARS TAB */}
                {activeTab === 'events' && (
                  <motion.div
                    key="events" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {dashData.webinars.length > 0 ? dashData.webinars.map((w, i) => (
                      <div key={i} className="bg-white dark:bg-[#283036] rounded-3xl border border-slate-200/60 dark:border-[#38434F] overflow-hidden group shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer">
                        <div>
                          <div className="h-40 bg-[#0F172A] relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 to-indigo-600/20" />
                            <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-white text-[9px] font-black uppercase tracking-wider">
                              LIVE WEBINAR
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                              <Video size={40} className="text-white/20" />
                            </div>
                          </div>
                          <div className="p-6">
                            <h3 className="text-base font-bold text-[#0F172A] dark:text-white m-0 mb-1.5 truncate group-hover:text-purple-600 transition-colors leading-snug tracking-tight">{w.title}</h3>
                            <p className="text-xs font-semibold text-[#64748B] dark:text-[#B0B7BE] line-clamp-2 mb-6 leading-relaxed h-8">{w.description}</p>
                            
                            <div className="flex items-center gap-3">
                              <div
                                onClick={() => router.push(`/u/${w.users.unique_id}`)}
                                className={`w-9 h-9 rounded-xl ${w.users.avatar_url ? 'bg-transparent' : 'bg-slate-50 dark:bg-[#1D2226]'} border border-slate-200/60 dark:border-[#38434F] flex items-center justify-center text-sm overflow-hidden flex-shrink-0 hover:scale-105 transition-transform`}
                              >
                                {w.users.avatar_url ? (
                                  <img src={w.users.avatar_url} alt={w.users.full_name} className="w-full h-full object-cover" />
                                ) : (
                                  '👨‍🏫'
                                )}
                              </div>
                              <div>
                                <p
                                  onClick={() => router.push(`/u/${w.users.unique_id}`)}
                                  className="text-xs font-bold text-[#0F172A] dark:text-white m-0 cursor-pointer hover:text-purple-600 transition-colors"
                                >
                                  {w.users.full_name}
                                </p>
                                <p className="text-[9px] font-extrabold text-[#94A3B8] dark:text-[#B0B7BE] m-0 uppercase tracking-widest mt-0.5">Verified Instructor</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="px-6 pb-6 pt-0">
                          <button className="w-full py-3 rounded-2xl bg-[#0F172A] text-white font-bold text-xs hover:bg-black transition-colors shadow-sm cursor-pointer">Register for Webinar</button>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-2 py-20 text-center bg-white dark:bg-[#283036] rounded-3xl border border-dashed border-slate-200 dark:border-[#38434F]">
                        <Video size={36} className="mx-auto text-slate-300 dark:text-[#B0B7BE] mb-4" />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white m-0 mb-1">No Webinars Found</h3>
                        <p className="text-xs text-[#64748B] dark:text-[#B0B7BE] font-semibold m-0">Check back later for expert mentoring sessions.</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* COMMUNITY TAB */}
                {activeTab === 'community' && (
                  <motion.div key="community" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    {/* College Banner Call-to-action */}
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-md">
                      <div className="absolute inset-0 bg-grid-white/10 opacity-20" />
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
                      
                      <div className="relative z-10 max-w-xl">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-[9px] font-black tracking-widest uppercase mb-4">
                          <Sparkles size={10} /> Exclusive Campus Network
                        </span>
                        <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">Inside {u.colleges?.short_name || 'Your College'} Hub</h2>
                        <p className="text-purple-100 font-semibold text-xs leading-relaxed mb-6">Interact directly with verified students and senior alumni from your institute inside your private college discussions board.</p>
                        
                        <div className="flex flex-wrap gap-3">
                          <Link href={u.colleges?.slug ? `/community/c/${u.colleges.slug}` : '/community'} className="inline-flex items-center gap-2 bg-white dark:bg-[#283036] text-[#0F172A] dark:text-white px-6 py-3 rounded-2xl font-bold text-xs hover:scale-102 hover:shadow-md transition-all no-underline cursor-pointer">
                            Enter Campus Hub <ChevronRight size={14} />
                          </Link>
                          <button
                            onClick={() => setShowCreateGroupModal(true)}
                            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-2xl font-bold text-xs hover:bg-white dark:hover:bg-[#283036]/20 transition-all border border-white/10"
                          >
                            <Plus size={14} /> Create Student Group
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Joined Subscribed Hubs */}
                    <div>
                      <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-[10px] font-extrabold text-slate-400 dark:text-[#B0B7BE] uppercase tracking-widest ml-4">Subscription Overview</h3>
                        <button
                          onClick={() => setShowCreateGroupModal(true)}
                          className="px-3.5 py-1.5 bg-purple-50 text-purple-600 border border-purple-100 rounded-xl font-bold text-[10px] hover:bg-purple-100 transition-colors flex items-center gap-1.5"
                        >
                          <Plus size={12} /> Create Group
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dashData.joinedCommunities.map((item, i) => (
                          <div key={i} className="bg-white dark:bg-[#283036] p-5 rounded-3xl border border-slate-200/60 dark:border-[#38434F] flex items-center justify-between group hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-extrabold text-sm border border-purple-100 group-hover:scale-105 transition-transform duration-300">
                                {item.communities.display_name[0]}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-[#0F172A] dark:text-white m-0 leading-snug">{item.communities.display_name}</h4>
                                <p className="text-[9px] font-black text-[#94A3B8] dark:text-[#B0B7BE] uppercase tracking-wider mt-1">Private Hub Member</p>
                              </div>
                            </div>
                            <button onClick={() => router.push(`/community/c/${item.communities.slug}`)} className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1D2226] text-slate-400 dark:text-[#B0B7BE] group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors cursor-pointer border border-transparent group-hover:border-purple-100">
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* REFERRALS TAB */}
                {activeTab === 'referrals' && (
                  <motion.div key="referrals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="bg-white dark:bg-[#283036] p-6 rounded-3xl border border-slate-200/60 dark:border-[#38434F] shadow-sm flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight m-0">Referral Request Tracker</h2>
                        <p className="text-slate-400 dark:text-[#B0B7BE] text-xs font-semibold m-0 mt-0.5">Real-time referral requests status directly linked to company recruiters.</p>
                      </div>
                      <button onClick={() => router.push('/jobs')} className="px-4 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer border border-transparent">Browse Jobs</button>
                    </div>

                    <div className="space-y-4">
                      {dashData.myReferrals.length > 0 ? dashData.myReferrals.map((req, i) => (
                        <div key={i} className="bg-white dark:bg-[#283036] p-5 rounded-3xl border border-slate-200/60 dark:border-[#38434F] hover:border-purple-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer shadow-sm">
                          <div className="flex items-center gap-4">
                            <div
                              onClick={() => router.push(`/u/${req.senior.unique_id}`)}
                              className={`w-14 h-14 rounded-2xl ${req.senior.avatar_url ? 'bg-transparent' : 'bg-slate-50 dark:bg-[#1D2226]'} border border-slate-200/60 dark:border-[#38434F] flex items-center justify-center text-slate-400 dark:text-[#B0B7BE] hover:scale-105 transition-transform overflow-hidden cursor-pointer flex-shrink-0`}
                            >
                              {req.senior.avatar_url ? (
                                <img src={req.senior.avatar_url} alt={req.senior.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <Briefcase size={22} className="text-slate-400 dark:text-[#B0B7BE]" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-[#0F172A] dark:text-white m-0">{req.job.role} <span className="text-[#94A3B8] dark:text-[#B0B7BE] font-semibold">@ {req.job.company_name}</span></h3>
                              <p className="text-[10px] font-black text-[#64748B] dark:text-[#B0B7BE] mt-1 m-0">Requested from <span className="text-[#0F172A] dark:text-white">{req.senior.full_name}</span> • {timeAgo(req.created_at)}</p>
                            </div>
                          </div>
                          <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border text-center ${req.status === 'approved' ? 'bg-green-50 text-green-600 border-green-200' :
                              req.status === 'rejected' ? 'bg-red-50 text-red-500 border-red-200' :
                                'bg-amber-50 text-amber-600 border-amber-200'
                            }`}>
                            {req.status === 'approved' ? '✓ Approved' : req.status === 'pending' ? '⌛ Pending Review' : req.status}
                          </div>
                        </div>
                      )) : (
                        <div className="p-20 bg-white dark:bg-[#283036] rounded-3xl border border-dashed border-slate-200 dark:border-[#38434F] text-center shadow-sm">
                          <Handshake size={36} className="mx-auto text-slate-200 dark:text-[#B0B7BE] mb-4" />
                          <h3 className="text-base font-black m-0 mb-1">No Referrals Requested</h3>
                          <p className="text-xs text-[#64748B] dark:text-[#B0B7BE] font-semibold mb-6">Connect with seniors in your dream company to get your resume referred.</p>
                          <button onClick={() => router.push('/jobs')} className="bg-[#0F172A] text-white px-6 py-3 rounded-2xl font-bold text-xs hover:scale-102 transition-all cursor-pointer">Explore Job Opportunities</button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

            </div>

            {/* RIGHT COLUMN: INTERACTIVE ROADMAP & SETTINGS (4 COLS) */}
            <div className="lg:col-span-4 space-y-8">

              {/* Gamified Growth Road Map */}
              <div className="bg-white dark:bg-[#283036] rounded-3xl border border-slate-200/60 dark:border-[#38434F] p-6 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 group-hover:bg-purple-100 transition-colors rounded-bl-full -mr-8 -mt-8" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white m-0 mb-6 uppercase tracking-wider relative z-10 font-bold">Campus Career Roadmap</h3>
                
                <div className="space-y-3 relative z-10">
                  {[
                    { label: 'Post a Doubt', rp: '+5', done: u.doubt_count > 0, icon: <HelpCircle size={14} /> },
                    { label: 'Daily Campus Login', rp: '+1', done: true, icon: <Calendar size={14} /> },
                    { label: 'Join Expert Webinar', rp: '+10', done: u.webinar_count > 0, icon: <Video size={14} /> },
                    { label: 'Receive Referral', rp: '+20', done: dashData.myReferrals.some((r: any) => r.status === 'approved'), icon: <Handshake size={14} /> },
                  ].map((task, i) => (
                    <div key={i} className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${task.done ? 'bg-green-50/50 border-green-100/50' : 'bg-slate-50 dark:bg-[#1D2226] border-transparent hover:bg-white dark:hover:bg-[#283036] hover:border-slate-200 dark:hover:border-[#38434F] shadow-sm'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${task.done ? 'text-green-600 bg-white/50' : 'text-slate-400 dark:text-[#B0B7BE] bg-white dark:bg-[#283036] shadow-sm'}`}>
                          {task.done ? <CheckCircle size={14} /> : task.icon}
                        </div>
                        <span className={`text-xs font-bold ${task.done ? 'text-green-800' : 'text-[#64748B] dark:text-[#B0B7BE]'}`}>{task.label}</span>
                      </div>
                      <span className={`text-[10px] font-black ${task.done ? 'text-green-600' : 'text-[#7C3AED]'}`}>{task.rp} RP</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Sidebar: Quick Nav */}
              <div className="bg-slate-900 rounded-3xl p-6 text-white border border-white/5 shadow-xl space-y-6">
                <div>
                  <h4 className="text-[9px] font-black text-slate-400 dark:text-[#B0B7BE] uppercase tracking-[0.2em] mb-4">Quick Settings</h4>
                  <div className="space-y-1.5">
                    <button onClick={() => router.push(`/u/${u.unique_id}`)} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 dark:text-[#B0B7BE] hover:bg-white dark:hover:bg-[#283036]/5 hover:text-white transition-all group cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-105 transition-transform text-slate-400 dark:text-[#B0B7BE]">
                        <User size={14} />
                      </div>
                      My Public Profile
                    </button>
                    <button onClick={() => alert('Preferences page coming soon!')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 dark:text-[#B0B7BE] hover:bg-white dark:hover:bg-[#283036]/5 hover:text-white transition-all group cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-105 transition-transform text-slate-400 dark:text-[#B0B7BE]">
                        <Settings size={14} />
                      </div>
                      Dashboard Settings
                    </button>
                    <button onClick={async () => {
                      try { await fetch('/api/auth/signout', { method: 'POST' }); } catch(e) {}
                      sessionStorage.clear();
                      localStorage.removeItem('claspire_user');
                      localStorage.removeItem('claspire_recent_searches');
                      router.push('/login');
                    }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all group cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <LogOut size={14} />
                      </div>
                      Sign Out
                    </button>
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-800 pt-6">
                  <h3 className="text-red-400 font-bold text-xs uppercase tracking-wider mb-1">
                    Danger Zone
                  </h3>
                  <p className="text-slate-500 dark:text-[#B0B7BE] text-[11px] leading-relaxed mb-4 font-semibold">
                    Permanent action. Once deleted, your student portfolio, doubts, and connection history are erased.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="border border-red-900/60 text-red-400 hover:bg-red-950/20 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer w-full text-center"
                  >
                    Delete My Account
                  </button>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[9px] font-black text-slate-400 dark:text-[#B0B7BE] uppercase tracking-[0.2em]">Platform Status</h4>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[9px] font-black text-green-500">SYSTEM ONLINE ⚡</span>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] text-slate-400 dark:text-[#B0B7BE] font-semibold leading-relaxed italic m-0">
                      "Education is not preparation for life; education is life itself."
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        html {
          scroll-behavior: smooth;
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeleting}
      />
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onSuccess={() => {
          setShowCreateGroupModal(false)
        }}
        currentUser={{
          id: u.id,
          is_premium: u.is_premium || false,
          role: u.role || 'student',
          college_id: u.colleges?.id || ''
        }}
        communityId={userCollegeCommunityId || undefined}
      />
    </div>
  )
}
