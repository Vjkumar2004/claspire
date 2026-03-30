'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Users, Search, Globe, Lock, Crown, GraduationCap, 
  Plus, RefreshCw, Sparkles, User, LayoutDashboard, Building2,
  Home
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import CreateGroupModal from '@/components/CreateGroupModal'
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://claspire.in/groups",
  },
}

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
    id: string
    name: string
    city: string
    state: string
  }
  is_joined?: boolean
  is_requested?: boolean
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

  // Check if user was redirected after creating a group
  useEffect(() => {
    if (searchParams.get('created') === 'true') {
      setRefreshKey(prev => prev + 1)
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
      // User not logged in
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

  const handleJoinGroup = async (groupSlug: string, groupId: string) => {
    if (!currentUser) {
      router.push('/login')
      return
    }

    setJoining(groupId)
    try {
      const res = await fetch(`/api/groups/${groupSlug}/join`, {
        method: 'POST'
      })
      
      const data = await res.json()
      
      if (res.ok) {
        if (data.joined) {
          setGroups(groups.map(g => 
            g.id === groupId ? { ...g, is_joined: true, member_count: g.member_count + 1 } : g
          ))
        } else if (data.requested) {
          // For private groups, show requested state
          setGroups(groups.map(g => 
            g.id === groupId ? { ...g, is_requested: true } : g
          ))
          alert('✅ Join request sent! Waiting for admin approval.')
        }
      } else {
        const error = data
        if (error.collegeRestricted) {
          alert(error.error)
        } else {
          alert('Failed to join group')
        }
      }
    } catch (error) {
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

  const handleCreateGroupSuccess = () => {
    setIsCreateModalOpen(false)
    setRefreshKey(prev => prev + 1)
  }

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.creator.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterType === 'all' || 
                          (filterType === 'public' && ((group as any).scope === 'public' || (!(group as any).scope && !group.is_private))) ||
                          (filterType === 'private' && ((group as any).scope === 'private' || group.is_private)) ||
                          (filterType === 'college' && (group as any).scope === 'college')
    
    return matchesSearch && matchesFilter
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Groups</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-sm"
            >
              + Create
            </button>
            <button
              onClick={() => fetchGroups()}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-2xl mx-auto">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search groups, topics, or seniors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-100 rounded-2xl border-0 shadow-sm focus:shadow-md focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 placeholder:text-gray-500 text-gray-900"
          />
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { value: 'all', label: 'All', count: groups.length },
              { value: 'college', label: 'College Only', count: groups.filter(g => (g as any).scope === 'college').length },
              { value: 'public', label: 'Public', count: groups.filter(g => ((g as any).scope === 'public') || (!(g as any).scope && !g.is_private)).length },
              { value: 'private', label: 'Private', count: groups.filter(g => ((g as any).scope === 'private') || g.is_private).length }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterType(filter.value as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  filterType === filter.value
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {filter.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  filterType === filter.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>
              {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded-lg w-3/4 mb-2 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded-lg w-1/2 animate-pulse" />
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded-lg w-full mb-3 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded-lg w-2/3 animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No groups yet</h2>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              Create the first group and start the community
            </p>
            {currentUser && (
              <button
                onClick={handleCreateGroup}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/25"
              >
                <Plus className="w-5 h-5" />
                Create First Group
              </button>
            )}
          </div>
        ) : (
          /* Groups Grid */
          <div className="space-y-4">
              {filteredGroups.map((group) => (
              <div key={group.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                {/* Top Row */}
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {group.creator?.avatar_url ? (
                      <img 
                        src={group.creator.avatar_url} 
                        alt={group.creator.full_name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {group.creator?.full_name?.[0] || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      by {group.creator?.full_name || 'Unknown'}
                    </p>
                  </div>
                </div>

                {/* Tags Row */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                    {group.creator?.role || 'student'}
                  </span>
                  {(group as any).scope === 'college' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                      <GraduationCap className="w-3 h-3" />
                      College Only
                    </span>
                  ) : (group as any).scope === 'private' || group.is_private ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                      <Lock className="w-3 h-3" />
                      Private
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                      <Globe className="w-3 h-3" />
                      Public
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {group.description || 'No description available'}
                </p>

                {/* Bottom Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{group.member_count || 0} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      <span>{group.college?.name || 'Community'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (group.is_joined) {
                        const communitySlug = group.college?.name?.toLowerCase().replace(/\s+/g, '-') || 'college'
                        router.push(`/community/c/${communitySlug}/group/${group.slug}`)
                      } else {
                        handleJoinGroup(group.slug, group.id)
                      }
                    }}
                    disabled={joining === group.id || group.is_requested}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      group.is_joined 
                        ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                        : group.is_requested
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : joining === group.id
                        ? 'bg-gray-100 text-gray-400 cursor-wait'
                        : (group.is_private || (group as any).scope === 'private')
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-sm hover:shadow-md'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {joining === group.id ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : group.is_joined ? (
                      'Visit Group'
                    ) : group.is_requested ? (
                      'Requested'
                    ) : (group.is_private || (group as any).scope === 'private') ? (
                      'Request to Join'
                    ) : (
                      'Join'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      
      
      {/* Create Group Modal */}
      {isCreateModalOpen && (
        <CreateGroupModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false)
            setRefreshKey(prev => prev + 1)
            router.push('/groups?created=true')
          }}
        />
      )}
    </div>
                            )
}

export default function GroupsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Groups...</p>
        </div>
      </div>
    }>
      <GroupsPageContent />
    </Suspense>
  )
}
