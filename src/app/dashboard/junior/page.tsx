'use client'
import {
  LayoutDashboard, HelpCircle, BookOpen,
  Calendar, Users, Settings, Bell,
  Flame, TrendingUp, Zap, Award,
  ChevronRight, Plus, Clock,
  CheckCircle, Video, Briefcase,
  GraduationCap, Star, Target,
  BarChart3, Menu, X, Trash2,
  Handshake, Search, Sparkles,
  ArrowUp, ArrowDown, LogOut, User
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePoints } from '@/contexts/PointsContext'
import { motion, AnimatePresence } from 'framer-motion'
import NotificationPrompt from '@/components/NotificationPrompt'
import NotificationBell from '@/components/NotificationBell'

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
    colleges: {
      name: string
      short_name: string
      slug: string
    } | null
  }
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
  const [doubtSearch, setDoubtSearch] = useState('')
  const [doubtFilter, setDoubtFilter] = useState<'all' | 'answered' | 'pending'>('all')
  const [eventSearch, setEventSearch] = useState('')

  useEffect(() => {
    init()
  }, [])

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
      if (data.dailyRPEarned) {
        showAward(1, "Daily visit bonus 🌅");
      }
    } catch {
      router.replace('/login')
    } finally {
      setLoading(false)
    }
  }

  const getRPLevel = (points: number) => {
    if (points >= 1000) return { label: 'Pathfinder', emoji: '🏆', next: null, color: '#F59E0B' }
    if (points >= 500) return { label: 'Rising Star', emoji: '⭐', next: 1000, color: '#7C3AED' }
    if (points >= 200) return { label: 'Explorer', emoji: '🔭', next: 500, color: '#06B6D4' }
    return { label: 'Newcomer', emoji: '🌱', next: 200, color: '#16A34A' }
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

  if (loading || !authChecked || !dashData) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F8F9FA] flex-col gap-4 font-plus-jakarta-sans">
        <div className="w-12 h-12 border-[3px] border-purple-100 border-t-purple-600 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium animate-pulse">Initializing Dashboard...</p>
      </div>
    )
  }

  const u = dashData.user
  const rp = getRPLevel(u.rise_points)
  const rpProgress = rp.next ? Math.min((u.rise_points / rp.next) * 100, 100) : 100

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'doubts', label: 'My Doubts', icon: <HelpCircle size={20} /> },
    { id: 'events', label: 'Webinars', icon: <Video size={20} /> },
    { id: 'community', label: 'Community', icon: <Users size={20} /> },
    { id: 'referrals', label: 'Referrals', icon: <Handshake size={20} /> },
  ]

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-plus-jakarta-sans text-[#1E293B]">

      {/* ═══ MOBILE SIDEBAR OVERLAY ═══ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ═══ SIDEBAR NAVIGATION ═══ */}
      <aside className={`fixed top-0 left-0 h-full w-[280px] bg-white border-r border-[#E2E8F0] z-[101] transition-all duration-300 transform lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 pb-4">
          <Link href="/" className="inline-block mb-10 no-underline">
            <span className="text-xl font-bold tracking-tight text-black font-plus-jakarta-sans">
              Clas<span className="text-[#7C3AED]">pire</span>
            </span>
          </Link>

          <nav className="space-y-1.5">
            <p className="text-[11px] font-extrabold text-[#94A3B8] uppercase tracking-[0.15em] ml-2 mb-4">Main Menu</p>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group cursor-pointer ${activeTab === item.id
                    ? 'bg-[#F5F3FF] text-[#7C3AED] shadow-sm shadow-purple-500/5'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                  }`}
              >
                <span className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
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
        <div className="mt-auto p-6">
          <div className="bg-gradient-to-br from-[#1E1B4B] to-[#312E81] rounded-[24px] p-5 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-colors" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 m-0">Rise Points</p>
                <Flame size={18} className="text-[#F59E0B]" />
              </div>
              <div className="text-3xl font-black mb-1 font-instrument-serif">{u.rise_points}</div>
              <div className="text-[11px] font-bold opacity-80 mb-4 flex items-center gap-1.5">
                {rp.emoji} {rp.label} Level
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="opacity-60">Progress</span>
                  <span className="text-[#A5B4FC]">{Math.round(rpProgress)}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${rpProgress}%` }}
                    className="h-full bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <main className="lg:ml-[280px] min-h-screen">

        {/* TOP NAV / DASHBOARD HERO */}
        <div className="relative z-40 bg-[#0F172A] pt-6 pb-20 px-6 md:px-12 border-b border-white/5">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -mr-64 -mt-64" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-[100px] -ml-40 -mb-40" />

          {/* Desktop Header Container */}
          <div className="relative z-30 flex flex-col gap-10">
            <header className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white cursor-pointer"
                >
                  <Menu size={20} />
                </button>
                <div className="hidden md:block">
                  <h2 className="text-white font-bold text-sm m-0 flex items-center gap-2 opacity-60">
                    <LayoutDashboard size={14} /> / {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <NotificationBell />
                <div className={`w-11 h-11 rounded-2xl ${u.avatar_url ? 'bg-transparent' : 'bg-gradient-to-br from-purple-500 to-indigo-600'} flex items-center justify-center text-white text-sm font-black shadow-lg overflow-hidden`}>
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" />
                  ) : (
                    u.full_name[0].toUpperCase()
                  )}
                </div>
              </div>
            </header>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black tracking-widest uppercase mb-4"
                >
                  <Sparkles size={10} /> Professional Dashboard
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-black text-white m-0 font-instrument-serif tracking-tight leading-tight">
                  Welcome, {u.full_name.split(' ')[0]}
                </h1>
                <p className="text-white/50 font-medium text-lg mt-2 m-0 max-w-xl">
                  Connect with verified seniors from {u.colleges?.short_name || 'your college'}.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/community')}
                  className="bg-white text-[#0F172A] px-6 py-3.5 rounded-[20px] font-bold text-sm shadow-xl hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={18} /> Ask a Doubt
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ TAB CONTENT ═══ */}
        <div className="px-6 md:px-12 -mt-10 relative z-20 pb-20">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* LEFT COLUMN: MAIN FEED (8 COLS) */}
            <div className="lg:col-span-8 space-y-8">

              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { label: 'Doubts Asked', value: u.doubt_count, icon: <HelpCircle size={22} />, color: '#7C3AED', trend: '+1 this week' },
                        { label: 'Referrals', value: dashData.myReferrals.length, icon: <Handshake size={22} />, color: '#06B6D4', trend: 'Active tracking' },
                        { label: 'Events Joined', value: u.webinar_count, icon: <Video size={22} />, color: '#D97706', trend: 'Learing mode' },
                      ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-[28px] border border-[#E2E8F0] shadow-sm hover:shadow-xl transition-all group cursor-pointer">
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-[18px] bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                              {stat.icon}
                            </div>
                            <span className="text-[10px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-full">{stat.trend}</span>
                          </div>
                          <p className="text-[11px] font-extrabold text-[#94A3B8] uppercase tracking-[0.1em] mb-1">{stat.label}</p>
                          <div className="text-4xl font-black text-[#0F172A] font-instrument-serif">{stat.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Quick Access Card */}
                    <div className="bg-white rounded-[32px] border border-[#E2E8F0] overflow-hidden shadow-sm">
                      <div className="p-8 border-b border-[#F1F5F9] flex justify-between items-center">
                        <h3 className="text-xl font-black text-[#0F172A] font-instrument-serif m-0">Recent Activity</h3>
                        <button className="text-[11px] font-bold text-purple-600 uppercase tracking-widest px-4 py-2 bg-purple-50 rounded-xl cursor-pointer">View Journal</button>
                      </div>
                      <div className="divide-y divide-[#F1F5F9]">
                        {dashData.rpLog.length > 0 ? dashData.rpLog.map((log) => (
                          <div key={log.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                <Zap size={18} className="text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#1E293B] m-0">{log.reason}</p>
                                <p className="text-xs font-medium text-[#94A3B8] m-0 mt-1 flex items-center gap-1.5"><Clock size={12} /> {timeAgo(log.created_at)}</p>
                              </div>
                            </div>
                            <div className={`text-sm font-black px-4 py-1.5 rounded-full ${log.points > 0 ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                              {log.points > 0 ? '+' : ''}{log.points} RP
                            </div>
                          </div>
                        )) : (
                          <div className="p-20 text-center">
                            <BarChart3 size={40} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-400 font-bold">No activity logged yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'doubts' && (
                  <motion.div
                    key="doubts" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between bg-white p-6 rounded-[28px] border border-[#E2E8F0] shadow-sm">
                      <div>
                        <h2 className="text-2xl font-black text-[#0F172A] font-instrument-serif m-0">My Doubts</h2>
                        <p className="text-[#64748B] text-sm font-medium m-0 mt-1">History of all questions asked across communities.</p>
                      </div>
                      <div className="flex gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                        {['all', 'answered', 'pending'].map(f => (
                          <button
                            key={f} onClick={() => setDoubtFilter(f as any)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all capitalize cursor-pointer ${doubtFilter === f ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400'}`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {dashData.myPosts.filter(p => doubtFilter === 'all' || (doubtFilter === 'answered' ? p.is_answered : !p.is_answered)).map(post => (
                        <div key={post.id} className="group bg-white p-6 rounded-[28px] border border-[#E2E8F0] hover:border-purple-200 transition-all shadow-sm hover:shadow-xl relative overflow-hidden cursor-pointer">
                          <div className="flex justify-between items-start mb-4">
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${post.is_answered ? 'bg-green-50 text-green-600 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                              {post.is_answered ? '✓ Answered' : '⌛ Pending'}
                            </span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setShowDeleteConfirm(post.id)}
                                className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <div className={`w-9 h-9 rounded-xl ${post.users?.avatar_url ? 'bg-transparent' : 'bg-purple-100'} flex items-center justify-center text-purple-600 font-bold text-xs overflow-hidden flex-shrink-0 mt-1 shadow-sm`}>
                              {post.users?.avatar_url ? (
                                <img src={post.users.avatar_url} alt={post.users.full_name} className="w-full h-full object-cover" />
                              ) : (
                                post.users?.full_name?.[0] || 'U'
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-[#1E293B] group-hover:text-purple-600 transition-colors mb-2">{post.title}</h3>
                              <p className="text-sm font-medium text-[#64748B] line-clamp-2 mb-4">{post.content}</p>
                              {post.image_url && (
                                <div className="mb-6 rounded-xl overflow-hidden border border-gray-100 max-w-md shadow-sm">
                                  <img src={post.image_url} alt="Post content" className="w-full h-auto object-cover max-h-60" />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs font-bold text-[#94A3B8] border-t border-[#F1F5F9] pt-4">
                            <div className="flex gap-4">
                              <span className="flex items-center gap-1.5"><ArrowUp size={14} /> {post.upvote_count}</span>
                              <span className="flex items-center gap-1.5"><HelpCircle size={14} /> {post.answer_count} answers</span>
                            </div>
                            <span className="flex items-center gap-1.5"><Clock size={14} /> {timeAgo(post.created_at)}</span>
                          </div>

                          {showDeleteConfirm === post.id && (
                            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 text-center">
                              <p className="font-black text-[#0F172A] mb-2 text-lg">Delete this doubt?</p>
                              <p className="text-sm text-[#64748B] mb-6 font-medium">This cannot be undone. All answers will also be removed.</p>
                              <div className="flex gap-3 w-full max-w-xs">
                                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 font-bold text-sm text-[#64748B] hover:bg-gray-50">Cancel</button>
                                <button onClick={() => handleDeletePost(post.id)} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600">Delete</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'events' && (
                  <motion.div
                    key="events" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {dashData.webinars.length > 0 ? dashData.webinars.map((w, i) => (
                      <div key={i} className="bg-white rounded-[32px] border border-[#E2E8F0] overflow-hidden group shadow-sm hover:shadow-2xl transition-all cursor-pointer">
                        <div className="h-48 bg-[#0F172A] relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 to-blue-600/10" />
                          <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest">
                            UPCOMING
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <Video size={48} className="text-white/20" />
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-[#0F172A] m-0 mb-2 truncate group-hover:text-purple-600 transition-colors">{w.title}</h3>
                          <p className="text-sm font-medium text-[#64748B] line-clamp-2 mb-6 h-10">{w.description}</p>
                          <div className="flex items-center gap-3 mb-6">
                            <div
                              onClick={() => router.push(`/u/${w.users.unique_id}`)}
                              className={`w-10 h-10 rounded-xl ${w.users.avatar_url ? 'bg-transparent' : 'bg-gray-50'} flex items-center justify-center text-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform`}
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
                                className="text-xs font-bold text-[#0F172A] m-0 cursor-pointer hover:text-purple-600 transition-colors"
                              >
                                {w.users.full_name}
                              </p>
                              <p className="text-[10px] font-bold text-[#94A3B8] m-0 uppercase tracking-wider">Expert Mentor</p>
                            </div>
                          </div>
                          <button className="w-full py-3.5 rounded-2xl bg-[#0F172A] text-white font-bold text-sm hover:bg-black transition-colors shadow-lg cursor-pointer">Register for Webinar</button>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-2 py-40 text-center bg-white rounded-[40px] border border-dashed border-[#E2E8F0]">
                        <Video size={48} className="mx-auto text-gray-300 mb-6" />
                        <h3 className="text-xl font-black text-[#0F172A] font-instrument-serif m-0 mb-2">No Webinars Found</h3>
                        <p className="text-[#64748B] font-medium m-0">Stay tuned! New expert sessions are added weekly.</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'community' && (
                  <motion.div key="community" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    <div className="bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                      <div className="relative z-10">
                        <h2 className="text-4xl font-black font-instrument-serif tracking-tight mb-4">Inside {u.colleges?.short_name || 'Your College'} Hub</h2>
                        <p className="text-white/60 font-medium text-lg max-w-lg mb-8">Access private discussions and exclusive resources limited to your college members.</p>
                        <Link href={u.colleges?.slug ? `/community/c/${u.colleges.slug}` : '/community'} className="inline-flex items-center gap-3 bg-white text-[#0F172A] px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-transform no-underline cursor-pointer">
                          Enter College Hub <ChevronRight size={18} />
                        </Link>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-6 ml-4">Subscription Overview</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dashData.joinedCommunities.map((item, i) => (
                          <div key={i} className="bg-white p-5 rounded-[28px] border border-[#E2E8F0] flex items-center justify-between group hover:shadow-xl transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-[#F5F3FF] flex items-center justify-center text-[#7C3AED] font-black text-xl border border-purple-100 group-hover:scale-110 transition-transform duration-300">
                                {item.communities.display_name[0]}
                              </div>
                              <div>
                                <h4 className="text-base font-bold text-[#0F172A] m-0">{item.communities.display_name}</h4>
                                <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mt-1">Joined Member</p>
                              </div>
                            </div>
                            <button onClick={() => router.push(`/community/c/${item.communities.slug}`)} className="p-3.5 rounded-2xl bg-gray-50 text-gray-400 group-hover:bg-[#F5F3FF] group-hover:text-purple-600 transition-colors cursor-pointer">
                              <ChevronRight size={20} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'referrals' && (
                  <motion.div key="referrals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="bg-white p-6 rounded-[28px] border border-[#E2E8F0] shadow-sm flex items-center justify-between">
                      <h2 className="text-2xl font-black text-[#0F172A] font-instrument-serif m-0">Referral Tracker</h2>
                      <button onClick={() => router.push('/jobs')} className="px-5 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer">Browse Jobs</button>
                    </div>

                    <div className="space-y-4">
                      {dashData.myReferrals.length > 0 ? dashData.myReferrals.map((req, i) => (
                        <div key={i} className="bg-white p-6 rounded-[32px] border border-[#E2E8F0] hover:border-purple-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer">
                          <div className="flex items-center gap-5">
                            <div
                              onClick={() => router.push(`/u/${req.senior.unique_id}`)}
                              className={`w-16 h-16 rounded-[24px] ${req.senior.avatar_url ? 'bg-transparent' : 'bg-gray-50'} border border-gray-100 flex items-center justify-center text-3xl hover:scale-105 transition-transform overflow-hidden cursor-pointer`}
                            >
                              {req.senior.avatar_url ? (
                                <img src={req.senior.avatar_url} alt={req.senior.full_name} className="w-full h-full object-cover" />
                              ) : (
                                '💼'
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-[#0F172A] m-0">{req.job.role} <span className="text-[#94A3B8] font-medium">@ {req.job.company_name}</span></h3>
                              <p className="text-xs font-bold text-[#64748B] mt-1 m-0">Request sent to <span className="text-[#0F172A]">{req.senior.full_name}</span> • {timeAgo(req.created_at)}</p>
                            </div>
                          </div>
                          <div className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border text-center ${req.status === 'approved' ? 'bg-green-50 text-green-600 border-green-200' :
                              req.status === 'rejected' ? 'bg-red-50 text-red-500 border-red-200' :
                                'bg-amber-50 text-amber-600 border-amber-200'
                            }`}>
                            {req.status === 'approved' ? '✓ Approved' : req.status === 'pending' ? '⌛ Pending Review' : req.status}
                          </div>
                        </div>
                      )) : (
                        <div className="p-32 bg-white rounded-[40px] border border-dashed border-[#E2E8F0] text-center">
                          <Handshake size={48} className="mx-auto text-gray-200 mb-6" />
                          <h3 className="text-xl font-black text-[#0F172A] font-instrument-serif m-0 mb-2">No Referrals Requested</h3>
                          <p className="text-[#64748B] font-medium mb-8">Reach out to seniors at top tech companies for referrals.</p>
                          <button onClick={() => router.push('/jobs')} className="bg-[#0F172A] text-white px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-all cursor-pointer">Explore Opportunities</button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            {/* RIGHT COLUMN: INFO & BADGES (4 COLS) */}
            <div className="lg:col-span-4 space-y-8">

              {/* How to Earn RP Card */}
              <div className="bg-white rounded-[32px] border border-[#E2E8F0] p-8 shadow-sm hover:shadow-xl transition-all overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 group-hover:bg-purple-100 transition-colors rounded-bl-full -mr-8 -mt-8" />
                <h3 className="text-xl font-black text-[#0F172A] font-instrument-serif m-0 mb-6 relative z-10">The Growth Map</h3>
                <div className="space-y-4 relative z-10">
                  {[
                    { label: 'Post a Doubt', rp: '+5', done: u.doubt_count > 0, icon: <HelpCircle size={14} /> },
                    { label: 'Daily Visit', rp: '+1', done: true, icon: <Calendar size={14} /> },
                    { label: 'Join Webinar', rp: '+10', done: u.webinar_count > 0, icon: <Video size={14} /> },
                    { label: 'Get Referral', rp: '+20', done: dashData.myReferrals.some((r: any) => r.status === 'approved'), icon: <Handshake size={14} /> },
                  ].map((task, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${task.done ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200 shadow-sm'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${task.done ? 'text-green-600 bg-white/50' : 'text-gray-400 bg-white shadow-sm'}`}>
                          {task.done ? <CheckCircle size={14} /> : task.icon}
                        </div>
                        <span className={`text-xs font-bold ${task.done ? 'text-green-700' : 'text-[#64748B]'}`}>{task.label}</span>
                      </div>
                      <span className={`text-[11px] font-black ${task.done ? 'text-green-600' : 'text-purple-600'}`}>{task.rp} RP</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Sidebar: Quick Nav */}
              <div className="bg-[#0F172A] rounded-[32px] p-8 text-white shadow-2xl space-y-8">
                <div>
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6">Account Settings</h4>
                  <div className="space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-white/70 hover:bg-white/5 hover:text-white transition-all group">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <User size={16} />
                      </div>
                      My Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-white/70 hover:bg-white/5 hover:text-white transition-all group">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Settings size={16} />
                      </div>
                      Preferences
                    </button>
                    <button onClick={() => { localStorage.removeItem('claspire_user'); router.push('/login'); }} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all group cursor-pointer">
                      <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <LogOut size={16} />
                      </div>
                      Sign Out
                    </button>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Platform Status</h4>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-green-500 text-purple-400">ONLINE</span>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-[11px] text-white/40 font-medium leading-relaxed italic m-0">
                      "Your degree is just a piece of paper, your education is seen in your behavior."
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        :root {
          --font-instrument-serif: 'Instrument Serif', serif;
        }

        .font-instrument-serif {
          font-family: var(--font-instrument-serif);
        }

        /* Smooth scroll for modern look */
        html {
          scroll-behavior: smooth;
        }

        /* Hide scrollbars for a cleaner look */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <NotificationPrompt />
    </div>
  )
}
