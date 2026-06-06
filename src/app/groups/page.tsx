'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Users, Search, Globe, Lock, Crown, GraduationCap,
  Plus, RefreshCw, Sparkles, Building2, ChevronRight,
  CheckCircle, LayoutGrid, Shield,
} from 'lucide-react'
import CreateGroupModal from '@/components/CreateGroupModal'

interface Group {
  id: string
  name: string
  slug: string
  description: string
  is_private: boolean
  scope?: string
  member_count: number
  created_at: string
  created_by: string
  college_id: string
  parent_community_id?: string
  creator: {
    id: string
    full_name: string
    avatar_url?: string
    role: string
    unique_id: string
  }
  college: {
    id?: string
    name: string
    slug?: string
    city: string
    state: string
  }
  is_joined?: boolean
  is_requested?: boolean
}

function getGroupCommunitySlug(group: Group) {
  return group.college?.slug || group.college?.name?.toLowerCase().replace(/\s+/g, '-') || 'general'
}

function GroupsPageContent() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private' | 'college'>('all')
  const [joining, setJoining] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('created') === 'true') {
      setRefreshKey((prev) => prev + 1)
      router.replace('/groups')
    }
  }, [searchParams, router])

  useEffect(() => {
    fetchGroups()
    fetchCurrentUser()
  }, [refreshKey])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setCurrentUser(data.user)
      }
    } catch {
      // not logged in
    }
  }

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/groups/all')
      if (res.ok) {
        const data = await res.json()
        setGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroup = async (groupSlug: string, groupId: string, communitySlug: string) => {
    if (!currentUser) {
      router.push('/login')
      return
    }

    setJoining(groupId)
    try {
      const res = await fetch(`/api/groups/${groupSlug}/join`, { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        if (data.joined) {
          // Re-fetch groups to get updated membership status from API
          await fetchGroups()
          router.push(`/community/c/${communitySlug}/group/${groupSlug}`)
        } else if (data.requested) {
          setGroups(groups.map((g) =>
            g.id === groupId ? { ...g, is_requested: true } : g
          ))
        }
      } else if (data.collegeRestricted) {
        alert(data.error)
      } else {
        alert('Failed to join group')
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setJoining(null)
    }
  }

  const handleCreateGroup = () => {
    if (currentUser?.college_id) {
      setIsCreateModalOpen(true)
    } else {
      alert('You need to be associated with a college to create groups')
    }
  }

  const filteredGroups = groups.filter((group) => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.creator?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'public' && (group.scope === 'public' || (!group.scope && !group.is_private))) ||
      (filterType === 'private' && (group.scope === 'private' || group.is_private)) ||
      (filterType === 'college' && group.scope === 'college')

    return matchesSearch && matchesFilter
  })

  const filterCounts = {
    all: groups.length,
    college: groups.filter((g) => g.scope === 'college').length,
    public: groups.filter((g) => g.scope === 'public' || (!g.scope && !g.is_private)).length,
    private: groups.filter((g) => g.scope === 'private' || g.is_private).length,
  }

  const totalMembers = groups.reduce((sum, g) => sum + (g.member_count || 0), 0)
  const joinedCount = groups.filter((g) => g.is_joined).length

  const scopeBadge = (group: Group) => {
    if (group.scope === 'college') {
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
          <GraduationCap size={8} /> College only
        </span>
      )
    }
    if (group.scope === 'private' || group.is_private) {
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
          <Lock size={8} /> Private
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
        <Globe size={8} /> Public
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3 font-plus-jakarta-sans">
        <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-semibold">Loading groups...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-plus-jakarta-sans text-sm text-slate-800 pb-24 lg:pb-10">
      {/* Page header */}
      <header className="border-b border-slate-200/80 bg-white">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-br from-purple-50/80 via-white to-cyan-50/30 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-6">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-5">
            <button
              type="button"
              onClick={() => router.push('/community')}
              className="hover:text-[#7C3AED] transition-colors border-none bg-transparent cursor-pointer p-0"
            >
              Community
            </button>
            <ChevronRight size={14} className="text-slate-300 shrink-0" />
            <span className="text-slate-900">Groups</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-200/50 shrink-0">
                <Users size={26} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight m-0 mb-1">
                  Student groups
                </h1>
                <p className="text-sm text-slate-500 font-medium m-0 max-w-lg leading-relaxed">
                  Join focused discussions across campuses — study circles, placements, and more.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                    <LayoutGrid size={13} className="text-purple-600" />
                    {groups.length} groups
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                    <Users size={13} className="text-purple-600" />
                    {totalMembers} members
                  </span>
                  {currentUser && joinedCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                      <CheckCircle size={13} />
                      {joinedCount} joined
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fetchGroups()}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                aria-label="Refresh groups"
              >
                <RefreshCw size={18} />
              </button>
              <button
                type="button"
                onClick={handleCreateGroup}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer shadow-sm transition-colors"
              >
                <Plus size={16} />
                Create group
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6 lg:gap-8">
        <main className="min-w-0 space-y-5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search groups, topics, or creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-slate-200/80 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 shadow-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {(
              [
                { value: 'all' as const, label: 'All' },
                { value: 'college' as const, label: 'College only' },
                { value: 'public' as const, label: 'Public' },
                { value: 'private' as const, label: 'Private' },
              ] as const
            ).map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setFilterType(filter.value)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-colors border cursor-pointer ${
                  filterType === filter.value
                    ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {filter.label}
                <span
                  className={`min-w-[1.25rem] text-center px-1.5 py-0.5 rounded-full text-[10px] ${
                    filterType === filter.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {filterCounts[filter.value]}
                </span>
              </button>
            ))}
          </div>

          {/* Results */}
          {filteredGroups.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white rounded-2xl border border-slate-200/80">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-50 flex items-center justify-center text-[#7C3AED]">
                <Sparkles size={32} />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 m-0 mb-2">
                {searchQuery || filterType !== 'all' ? 'No matching groups' : 'No groups yet'}
              </h2>
              <p className="text-sm text-slate-500 max-w-sm mx-auto m-0 mb-6 leading-relaxed">
                {searchQuery || filterType !== 'all'
                  ? 'Try a different search or filter.'
                  : 'Create the first group and start the conversation.'}
              </p>
              {currentUser && !searchQuery && filterType === 'all' && (
                <button
                  type="button"
                  onClick={handleCreateGroup}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer transition-colors"
                >
                  <Plus size={16} />
                  Create first group
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredGroups.map((group) => {
                const communitySlug = getGroupCommunitySlug(group)
                return (
                  <article
                    key={group.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-col hover:border-purple-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white border-2 border-slate-100 bg-gradient-to-br from-[#7C3AED] to-cyan-500">
                          {group.creator?.avatar_url ? (
                            <img src={group.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            group.creator?.full_name?.[0] || 'U'
                          )}
                        </div>
                        {group.creator?.role === 'senior' && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white">
                            <Crown size={8} className="text-white" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-extrabold text-slate-900 m-0 truncate leading-snug">
                          {group.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium m-0 mt-0.5 truncate">
                          by {group.creator?.full_name || 'Unknown'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        group.creator?.role === 'senior' ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {group.creator?.role === 'senior' ? 'Senior' : group.creator?.role || 'Student'}
                      </span>
                      {scopeBadge(group)}
                    </div>

                    <p className="text-xs text-slate-600 m-0 mb-4 line-clamp-2 leading-relaxed flex-1">
                      {group.description || 'No description provided'}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <Users size={12} /> {group.member_count || 0} members
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium truncate">
                          <Building2 size={11} className="shrink-0" />
                          {group.college?.name || 'Community'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (group.is_joined) {
                            router.push(`/community/c/${communitySlug}/group/${group.slug}`)
                          } else {
                            handleJoinGroup(group.slug, group.id, communitySlug)
                          }
                        }}
                        disabled={joining === group.id || group.is_requested}
                        className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold border-none cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                          group.is_joined
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : group.is_requested
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : group.is_private || group.scope === 'private'
                                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                : 'bg-[#7C3AED] hover:bg-purple-700 text-white'
                        }`}
                      >
                        {joining === group.id ? (
                          <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : group.is_joined ? (
                          'Visit'
                        ) : group.is_requested ? (
                          'Requested'
                        ) : group.is_private || group.scope === 'private' ? (
                          'Request'
                        ) : (
                          'Join'
                        )}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col gap-4 lg:sticky lg:top-[4.5rem] lg:self-start">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-3 m-0">
              Your network
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Available groups</span>
                <span className="font-bold text-slate-900">{groups.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">You joined</span>
                <span className="font-bold text-emerald-600">{joinedCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Public</span>
                <span className="font-bold text-slate-900">{filterCounts.public}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5 m-0">
              <Shield size={14} className="text-red-500" /> Group tips
            </h4>
            <ul className="space-y-3 m-0 p-0 list-none">
              {[
                { t: 'Pick the right scope', d: 'College-only for campus topics; public for wider reach.' },
                { t: 'Clear names', d: 'Help others find your group from search.' },
                { t: 'Stay active', d: 'Regular posts keep members engaged.' },
              ].map((tip, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-xs font-extrabold text-purple-300 w-4 shrink-0">{i + 1}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-700 m-0">{tip.t}</p>
                    <p className="text-[11px] text-slate-500 m-0 mt-0.5 leading-relaxed">{tip.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {currentUser?.college_id && (
            <button
              type="button"
              onClick={handleCreateGroup}
              className="w-full py-3 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer transition-colors"
            >
              <Plus size={14} className="inline mr-1.5 -mt-0.5" />
              Create a new group
            </button>
          )}
        </aside>
      </div>

      {isCreateModalOpen && currentUser && (
        <CreateGroupModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false)
            setRefreshKey((prev) => prev + 1)
            router.push('/groups?created=true')
          }}
          currentUser={{
            id: currentUser.id,
            is_premium: currentUser.is_premium || false,
            role: currentUser.role || 'student',
            college_id: currentUser.college_id,
          }}
        />
      )}
    </div>
  )
}

export default function GroupsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3 font-plus-jakarta-sans">
          <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Loading groups...</p>
        </div>
      }
    >
      <GroupsPageContent />
    </Suspense>
  )
}
