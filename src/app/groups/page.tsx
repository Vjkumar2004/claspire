'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Users, Search, Globe, Lock, Crown, GraduationCap, 
  Calendar, Filter, ArrowRight, UserPlus, MapPin,
  Building, Star, TrendingUp, Plus, RefreshCw,
  Sparkles, Hash
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import CreateGroupModal from '@/components/CreateGroupModal'

interface Group {
  id: string
  name: string
  slug: string
  description: string
  is_private: boolean
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
}

function GroupsPageContent() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all')
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
      
      if (res.ok) {
        setGroups(groups.map(g => 
          g.id === groupId ? { ...g, is_joined: true, member_count: g.member_count + 1 } : g
        ))
      } else {
        const error = await res.json()
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
                          (filterType === 'public' && !group.is_private) ||
                          (filterType === 'private' && group.is_private)
    
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Premium Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Groups</h1>
                <p className="text-sm text-slate-600 hidden sm:block">Discover and join student communities</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentUser && (
                <button
                  onClick={handleCreateGroup}
                  className="hidden sm:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
                >
                  <span className="text-lg">+</span>
                  Create Group
                </button>
              )}
              {currentUser && (
                <button
                  onClick={handleCreateGroup}
                  className="sm:hidden flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/25"
                >
                  <span className="text-base">+</span>
                  Create
                </button>
              )}
              <button
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
                title="Refresh groups"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Search & Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search groups, topics, or seniors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-slate-900 bg-white rounded-2xl border-0 shadow-lg shadow-slate-200/50 focus:shadow-xl focus:shadow-slate-200/60 transition-all duration-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          
          {/* Filter Chips */}
          <div className="flex justify-center">
            <div className="inline-flex items-center rounded-2xl bg-slate-100 p-1">
              {[
                { value: 'all', label: 'All', count: groups.length },
                { value: 'public', label: 'Public', count: groups.filter(g => !g.is_private).length },
                { value: 'private', label: 'Private', count: groups.filter(g => g.is_private).length }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterType(filter.value as any)}
                  className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    filterType === filter.value
                      ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                    filterType === filter.value ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32">
        {filteredGroups.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-16 sm:py-24">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">No active groups yet</h2>
            <p className="text-slate-600 mb-8">Be the first to create a community and bring students together</p>
            {currentUser && (
              <button
                onClick={handleCreateGroup}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
              >
                <Plus className="w-5 h-5" />
                Create First Group
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredGroups.map((group) => (
              <div key={group.id} className="group bg-white rounded-3xl shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 overflow-hidden border border-slate-200/50">
                {/* Card Header */}
                <div className="p-6 sm:p-8">
                  <div className="flex items-start gap-4 mb-6">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden shadow-lg">
                        {group.creator?.avatar_url ? (
                          <img src={group.creator.avatar_url} alt={group.creator?.full_name || 'Creator'} className="w-full h-full object-cover" />
                        ) : (
                          group.creator?.full_name?.[0] || 'U'
                        )}
                      </div>
                      {group.creator?.role === 'senior' && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Group Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className=" flex items-center gap-2 text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium text-slate-700">
                          by {group.creator?.full_name || 'Unknown Admin'}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                          {group.creator?.role || 'student'}
                        </span>
                        {group.is_private ? (
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <Lock className="w-3 h-3" />
                            <span className="text-xs font-medium">Private</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <Globe className="w-3 h-3" />
                            <span className="text-xs font-medium">Public</span>
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 line-clamp-2 leading-relaxed">
                        {group.description}
                      </p>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <span className="font-medium">{group.college?.name || 'College'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{group.member_count} members</span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-slate-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      Created {formatDate(group.created_at)}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                  {group.is_joined ? (
                    <button
                      onClick={() => router.push(`/community/c/${group.college?.name?.toLowerCase().replace(/\s+/g, '-') || 'college'}/group/${group.slug}`)}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl font-semibold hover:bg-slate-200 transition-all duration-200"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Visit Group
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinGroup(group.slug, group.id)}
                      disabled={joining === group.id}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {joining === group.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Join</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {currentUser && (
        <CreateGroupModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateGroupSuccess}
          currentUser={{
            id: currentUser.id,
            is_premium: currentUser.is_premium || false,
            role: currentUser.role || 'student',
            college_id: currentUser.college_id
          }}
        />
      )}
    </div>
  )
}

export default function GroupsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    }>
      <GroupsPageContent />
    </Suspense>
  )
}
