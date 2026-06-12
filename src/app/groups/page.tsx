'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Search, TrendingUp, Users, MessageSquare, Sparkles, Plus,
  Clock, Hash, Zap, Activity, Lock, MoreHorizontal,
} from 'lucide-react'
import CreateGroupModal from '@/components/CreateGroupModal'

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
}

function getRelativeTime(date: string | null) {
  if (!date) return null
  const diff = Date.now() - new Date(date).getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 172800000) return 'Yesterday'
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return `${Math.floor(diff / 604800000)}w ago`
}

interface Creator {
  id: string
  full_name: string
  avatar_url?: string
  unique_id: string
  role: string
}

interface Group {
  id: string
  name: string
  slug: string
  description: string
  scope: string
  member_count: number
  created_at: string
  created_by: string
  creator: Creator | null
  is_joined: boolean
  community_slug: string
}

interface Activity {
  id: string
  content: string
  created_at: string
  group_id: string
  sender: { id: string; full_name: string; avatar_url?: string } | null
}

interface OnlineMember {
  id: string
  full_name: string
  avatar_url?: string
  unique_id: string
  role: string
}

interface DiscoverData {
  stats: { activeGroups: number; totalMembers: number; totalMessages: number; onlineNow: number }
  trendingGroups: Group[]
  onlineMembers: OnlineMember[]
  recentActivity: Activity[]
  groups: Group[]
  categories: string[]
}

export default function GroupsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const { data, isLoading, isError, error } = useQuery<DiscoverData>({
    queryKey: ['groups-discover'],
    queryFn: async () => {
      const res = await fetch('/api/groups/discover')
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to fetch')
      return json.data
    },
    staleTime: 60_000,
  })

  const stats = data?.stats
  const trendingGroups = data?.trendingGroups || []
  const onlineMembers = data?.onlineMembers || []
  const recentActivity = data?.recentActivity || []
  const categories = data?.categories || []

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j?.user) setCurrentUser(j.user) })
      .catch(() => {})
  }, [])

  const filteredGroups = useMemo(() => {
    let list = data?.groups || []
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(g => g.name.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q))
    }
    if (activeCategory !== 'All') {
      const cat = activeCategory.toLowerCase()
      list = list.filter(g => g.name.toLowerCase().includes(cat) || g.description?.toLowerCase().includes(cat))
    }
    return list
  }, [data?.groups, searchQuery, activeCategory])

  if (isError) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
        <div className="max-w-md text-center px-4">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity size={24} className="text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Failed to load communities</h2>
          <p className="text-sm text-gray-500 font-medium mb-6">{error instanceof Error ? error.message : 'Something went wrong'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7]">

      {/* ===== MOBILE HEADER + SEARCH (lg:hidden) ===== */}
      <div className="lg:hidden bg-white border-b border-slate-100">
        <div className="px-4 pt-3 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#7C3AED]/10 rounded-full border border-[#7C3AED]/20 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
            <span className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-wider">Student Communities</span>
          </div>
          <h1 className="text-xl font-extrabold text-[#0F172A] tracking-tight leading-tight m-0">
            Discover{' '}
            <span className="bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] bg-clip-text text-transparent">Student Communities</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-medium mt-1 m-0">Connect with seniors, get placement referrals, share knowledge, and grow together.</p>
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search communities by name..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 transition-all"
              />
            </div>
            <button className="h-10 px-4 rounded-xl bg-[#7C3AED] text-white text-xs font-bold border-none cursor-pointer hover:bg-[#6D28D9] transition-all flex items-center gap-1.5">
              <Search size={13} /> Search
            </button>
          </div>
        </div>
        {stats && (
          <div className="grid grid-cols-4 gap-2 px-4 pb-3">
            {[
              { label: 'Active Groups', value: stats.activeGroups, icon: Hash },
              { label: 'Members', value: stats.totalMembers, icon: Users },
              { label: 'Messages', value: stats.totalMessages, icon: MessageSquare },
              { label: 'Online Now', value: stats.onlineNow, icon: Activity },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-2.5 text-center shadow-sm">
                  <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/5 flex items-center justify-center mx-auto mb-1">
                    <Icon size={13} className="text-[#7C3AED]" />
                  </div>
                  <p className="text-base font-extrabold text-[#0F172A] m-0 leading-none">{s.value.toLocaleString()}</p>
                  <p className="text-[8px] font-medium text-slate-400 m-0 mt-0.5 truncate">{s.label}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ===== HERO (desktop only) ===== */}
      <section className="hidden lg:block max-w-7xl mx-auto px-0 sm:px-4 lg:px-6 pt-0 lg:pt-8">
        <div className="relative overflow-hidden rounded-none sm:rounded-2xl lg:rounded-3xl bg-gradient-to-br from-[#312E81] via-[#5B21B6] to-[#7C3AED] shadow-2xl shadow-purple-900/20">
          <div className="absolute inset-0 bg-gradient-to-br from-[#312E81]/70 via-[#5B21B6]/60 to-[#7C3AED]/50" />
          <img src="/group-banner.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 20px 20px, white 1.5px, transparent 0)', backgroundSize: '40px 40px' }} />
          <div className="absolute top-[-80px] right-[-60px] w-[300px] h-[300px] bg-purple-300/15 rounded-full blur-[80px]" />
          <div className="absolute bottom-[-60px] left-[-40px] w-[250px] h-[250px] bg-fuchsia-400/12 rounded-full blur-[70px]" />

          <div className="relative flex flex-col lg:flex-row items-center px-5 sm:px-8 lg:px-14 py-6 lg:py-0 min-h-[340px] lg:min-h-[300px]">

            {/* Left */}
            <div className="flex-1 w-full lg:w-3/5 lg:py-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/8 mb-3">
                <Hash size={10} className="text-purple-200" />
                <span className="text-[10px] font-bold text-purple-100 uppercase tracking-[0.12em]">Student Communities</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[40px] font-extrabold text-white leading-[1.12] tracking-tight mb-2">
                Discover{' '}
                <span className="bg-gradient-to-r from-purple-200 to-fuchsia-200 bg-clip-text text-transparent">Student Communities</span>
              </h1>

              <p className="text-[13px] sm:text-[15px] text-purple-200/75 max-w-xl font-normal leading-relaxed mb-4">
                Connect with seniors, get placement referrals, share knowledge, and grow together.
              </p>

              {/* Search */}
              <div className="relative max-w-xl group mb-4">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-fuchsia-400 rounded-2xl opacity-25 blur group-hover:opacity-40 transition-opacity" />
                <div className="relative flex items-center bg-white rounded-2xl overflow-hidden shadow-lg shadow-black/5">
                  <div className="pl-4 pr-2 text-gray-400">
                    <Search size={18} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search communities by name..."
                    className="flex-1 h-[48px] lg:h-[52px] pr-3 text-sm text-gray-900 outline-none bg-transparent placeholder:text-gray-400 font-medium"
                  />
                  <button
                    onClick={() => {}}
                    className="h-[48px] lg:h-[52px] px-4 lg:px-5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white text-xs lg:text-sm font-bold flex items-center gap-2 transition-all"
                  >
                    <Search size={15} />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
              </div>

              {/* Stats */}
              {stats && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  {[
                    { label: 'Active Groups', value: stats.activeGroups, icon: Hash },
                    { label: 'Members', value: stats.totalMembers, icon: Users },
                    { label: 'Messages', value: stats.totalMessages, icon: MessageSquare },
                    { label: 'Online Now', value: stats.onlineNow, icon: Activity },
                  ].map((s) => {
                    const Icon = s.icon
                    return (
                      <div key={s.label} className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                          <Icon size={11} className="text-purple-200" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-extrabold text-white leading-none">{s.value.toLocaleString()}</p>
                          <p className="text-[8px] font-semibold text-purple-200/60 uppercase tracking-wider leading-tight hidden sm:block">{s.label}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 lg:pt-8">
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-8">

          {/* ===== LEFT ===== */}
          <div className="flex-1 min-w-0">

            {/* Sticky Category Pills */}
            <div className="sticky top-0 z-20 bg-[#F4F5F7] pt-3 pb-2 -mx-4 px-4 sm:static sm:bg-transparent sm:pt-0 sm:pb-0 sm:mx-0 sm:px-0 sm:mb-5">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all flex-shrink-0 ${
                      activeCategory === cat
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-200 hover:text-purple-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading */}
            {isLoading ? (
              <div className="space-y-5 mt-3 sm:mt-0">
                <div>
                  <div className="h-5 bg-gray-200 rounded w-32 mb-3 animate-pulse" />
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="w-[220px] flex-shrink-0 bg-white rounded-2xl border border-gray-200/80 animate-pulse p-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200 mb-3" />
                        <div className="h-3.5 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-full mb-3" />
                        <div className="flex gap-2 mb-3">
                          <div className="h-3 bg-gray-100 rounded w-14" />
                          <div className="h-3 bg-gray-100 rounded w-14" />
                        </div>
                        <div className="h-8 bg-gray-100 rounded-lg w-full" />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="h-5 bg-gray-200 rounded w-32 mb-3 animate-pulse" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array(6).fill(0).map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-200/80 animate-pulse p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="h-3.5 bg-gray-200 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-gray-100 rounded w-full" />
                          </div>
                        </div>
                        <div className="flex gap-2 mb-3">
                          <div className="h-3 bg-gray-100 rounded w-14" />
                          <div className="h-3 bg-gray-100 rounded w-14" />
                          <div className="h-3 bg-gray-100 rounded w-14" />
                        </div>
                        <div className="h-8 bg-gray-100 rounded-lg w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Trending Communities */}
                {trendingGroups.length > 0 && (
                  <div className="mb-6 lg:mb-0 lg:hidden">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={15} className="text-purple-600" />
                        <h2 className="text-sm font-extrabold text-gray-900">Trending Communities</h2>
                      </div>
                      <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{trendingGroups.length}</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                      {trendingGroups.map((group) => (
                        <div
                          key={group.id}
                          className="w-[220px] sm:w-[240px] flex-shrink-0 bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                          onClick={() => router.push(`/community/c/${group.community_slug}/group/${group.slug}`)}
                        >
                          <div className="p-4 flex flex-col h-full">
                            <div className="relative w-10 h-10 mb-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center overflow-hidden shadow-sm">
                                {group.creator?.avatar_url ? (
                                  <img src={group.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs font-black text-white">{getInitials(group.name)}</span>
                                )}
                              </div>
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                            </div>
                            <h3 className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-1 mb-0.5">{group.name}</h3>
                            <p className="text-[11px] text-gray-500 font-medium line-clamp-1 mb-2.5">{group.description}</p>
                            <div className="flex items-center gap-2.5 mb-3">
                              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                group.scope !== 'public' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                <Lock size={8} />
                                {group.scope === 'public' ? 'Public' : 'Private'}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                                <Users size={11} className="text-gray-400" />
                                {group.member_count}
                              </span>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/community/c/${group.community_slug}/group/${group.slug}`) }}
                              className="mt-auto w-full py-1.5 rounded-lg text-[11px] font-bold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 transition-all shadow-sm"
                            >
                              {group.is_joined ? 'Open' : 'Join'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Communities */}
                <div className="mb-6 lg:mb-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap size={15} className="text-purple-600" />
                      <h2 className="text-sm font-extrabold text-gray-900">
                        {searchQuery ? `Results for "${searchQuery}"` : 'All Communities'}
                      </h2>
                      <span className="text-[11px] font-bold text-gray-500 bg-gray-200/70 px-2 py-0.5 rounded-full">
                        {filteredGroups.length}
                      </span>
                    </div>
                  </div>

                  {filteredGroups.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredGroups.map((group) => (
                        <div
                          key={group.id}
                          className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                          onClick={() => router.push(`/community/c/${group.community_slug}/group/${group.slug}`)}
                        >
                          <div className="p-4">
                            {/* Top Row */}
                            <div className="flex items-start justify-between mb-2.5">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="relative w-10 h-10 flex-shrink-0">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center overflow-hidden shadow-sm">
                                    {group.creator?.avatar_url ? (
                                      <img src={group.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-xs font-black text-white">{getInitials(group.name)}</span>
                                    )}
                                  </div>
                                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                                </div>
                                <div className="min-w-0">
                                  <h3 className="text-[13px] font-bold text-gray-900 leading-snug truncate">{group.name}</h3>
                                  <p className="text-[11px] text-gray-500 font-medium line-clamp-1">{group.description}</p>
                                </div>
                              </div>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0 ml-1"
                              >
                                <MoreHorizontal size={14} />
                              </button>
                            </div>

                            {/* Meta Row */}
                            <div className="flex items-center gap-2.5 mb-3">
                              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                group.scope !== 'public' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                <Lock size={8} />
                                {group.scope === 'public' ? 'Public' : 'Private'}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                                <Users size={11} className="text-gray-400" />
                                {group.member_count}
                              </span>
                              {getRelativeTime(group.created_at) && (
                                <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                                  <Clock size={11} />
                                  {getRelativeTime(group.created_at)}
                                </span>
                              )}
                            </div>

                            {/* CTA */}
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/community/c/${group.community_slug}/group/${group.slug}`) }}
                              className="w-full py-1.5 rounded-lg text-[11px] font-bold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 transition-all shadow-sm"
                            >
                              {group.is_joined ? 'Open Community' : 'Join Group'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
                      <Search size={20} className="text-gray-300 mx-auto mb-2" />
                      <h3 className="text-sm font-bold text-gray-900 mb-0.5">No communities found</h3>
                      <p className="text-xs text-gray-500 font-medium">Try a different search or category</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Mobile-only sidebar sections */}
            <div className="flex flex-col gap-4 lg:hidden pb-6">
              {/* Online Now */}
              {onlineMembers.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-bold text-gray-900">Online Now</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{stats?.onlineNow || 0}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex -space-x-1.5">
                      {onlineMembers.slice(0, 5).map((member) => (
                        <div
                          key={member.id}
                          onClick={() => router.push(`/u/${member.unique_id}`)}
                          className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 border-2 border-white flex items-center justify-center cursor-pointer hover:z-10 relative"
                          title={member.full_name}
                        >
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-[7px] font-black text-white">{getInitials(member.full_name)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      {stats?.onlineNow || 0} member{(stats?.onlineNow || 0) !== 1 ? 's' : ''} online
                    </span>
                  </div>
                </div>
              )}

              {/* Trending Communities - List */}
              {trendingGroups.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={15} className="text-amber-500" />
                    <h3 className="text-sm font-bold text-gray-900">Trending Communities</h3>
                  </div>
                  <div className="space-y-1">
                    {trendingGroups.slice(0, 5).map((group, i) => (
                      <div
                        key={group.id}
                        onClick={() => router.push(`/community/c/${group.community_slug}/group/${group.slug}`)}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <span className="text-xs font-extrabold text-gray-300 w-4 text-center">{i + 1}</span>
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] font-black text-white">{getInitials(group.name)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 truncate">{group.name}</p>
                          <p className="text-[10px] text-gray-500 font-medium">{group.member_count} members</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {recentActivity.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={15} className="text-blue-500" />
                    <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
                  </div>
                  <div className="space-y-2.5">
                    {recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {activity.sender?.avatar_url ? (
                            <img src={activity.sender.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-[8px] font-black text-white">
                              {activity.sender ? getInitials(activity.sender.full_name) : '?'}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-gray-900 font-semibold truncate">{activity.sender?.full_name || 'Someone'}</p>
                          <p className="text-[10px] text-gray-500 font-medium line-clamp-1">{activity.content}</p>
                          <p className="text-[9px] text-gray-400 font-medium mt-0.5">{getRelativeTime(activity.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ===== RIGHT SIDEBAR (desktop only) ===== */}
          <div className="hidden lg:block w-[300px] flex-shrink-0">
            <div className="space-y-5 sticky top-28">

              {/* Trending Communities */}
              {trendingGroups.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={15} className="text-amber-500" />
                    <h3 className="text-sm font-bold text-gray-900">Trending Communities</h3>
                  </div>
                  <div className="space-y-1">
                    {trendingGroups.slice(0, 5).map((group, i) => (
                      <div
                        key={group.id}
                        onClick={() => router.push(`/community/c/${group.community_slug}/group/${group.slug}`)}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <span className="text-xs font-extrabold text-gray-300 w-4 text-center">{i + 1}</span>
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] font-black text-white">{getInitials(group.name)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 truncate">{group.name}</p>
                          <p className="text-[10px] text-gray-500 font-medium">{group.member_count} members</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Online Members */}
              {onlineMembers.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-sm font-bold text-gray-900">Online Now</h3>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{stats?.onlineNow || 0}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex -space-x-2">
                      {onlineMembers.slice(0, 5).map((member) => (
                        <div
                          key={member.id}
                          onClick={() => router.push(`/u/${member.unique_id}`)}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 border-2 border-white flex items-center justify-center cursor-pointer hover:z-10 relative transition-transform hover:-translate-y-0.5"
                          title={member.full_name}
                        >
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-black text-white">{getInitials(member.full_name)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {onlineMembers.length > 5 && (
                      <span className="text-[11px] font-bold text-purple-600">+{onlineMembers.length - 5} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {recentActivity.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={15} className="text-blue-500" />
                    <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
                  </div>
                  <div className="space-y-3">
                    {recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {activity.sender?.avatar_url ? (
                            <img src={activity.sender.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-[8px] font-black text-white">
                              {activity.sender ? getInitials(activity.sender.full_name) : '?'}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-gray-900 font-semibold truncate">{activity.sender?.full_name || 'Someone'}</p>
                          <p className="text-[10px] text-gray-500 font-medium line-clamp-1">{activity.content}</p>
                          <p className="text-[9px] text-gray-400 font-medium mt-0.5">{getRelativeTime(activity.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Create Community CTA */}
              <div className="bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-xl p-5 shadow-lg shadow-purple-200">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <Plus size={18} className="text-white" />
                </div>
                <h3 className="text-sm font-extrabold text-white mb-1">Create a Community</h3>
                <p className="text-[11px] text-purple-200 font-medium mb-4 leading-relaxed">
                  Start a group for placement prep, coding, or anything your college needs.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full py-2.5 rounded-lg bg-white text-purple-700 text-xs font-bold hover:bg-purple-50 transition-all flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Sparkles size={13} />
                  Get Started
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 z-50 lg:hidden w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-xl shadow-purple-400/50 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
      >
        <Plus size={24} />
      </button>

      {currentUser && (
        <CreateGroupModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}
