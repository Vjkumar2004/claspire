'use client'
import { useState, useEffect } from 'react'
import { Users, Calendar, Lock, Globe, Trash2, Edit, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface Group {
  id: string
  name: string
  slug: string
  description: string
  is_private: boolean
  member_count: number
  created_at: string
  is_active: boolean
  auto_delete_at: string
  created_by: string
  communities?: {
    slug: string
  }
  creator?: {
    id: string
    full_name: string
    avatar_url?: string
    role: string
    is_verified: boolean
  }
}

export default function MyGroupsList() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/groups/my-groups-detailed')
      
      if (!res.ok) {
        throw new Error('Failed to fetch groups')
      }
      
      const data = await res.json()
      setGroups(data.groups || [])
    } catch (err) {
      console.error('Failed to fetch groups:', err)
      setError('Failed to load your groups')
    } finally {
      setLoading(false)
    }
  }

  const deleteGroup = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this group? This cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/groups/${slug}/delete`, {
        method: 'DELETE'
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to delete group')
      }
      
      // Remove from local state
      setGroups(groups.filter(g => g.slug !== slug))
    } catch (err) {
      console.error('Failed to delete group:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete group. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDaysUntilDeletion = (autoDeleteAt: string) => {
    const now = new Date()
    const deleteDate = new Date(autoDeleteAt)
    const diffTime = deleteDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded-lg mb-4 w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="text-center py-8">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={fetchGroups}
            className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Groups Yet</h3>
          <p className="text-gray-600 text-sm">You haven't created any student groups yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-4 sm:mb-6">My Student Groups</h2>
      
      <div className="space-y-3 sm:space-y-4">
        {groups.map((group, index) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-all duration-300 hover:border-purple-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Creator Profile Section */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm sm:text-base overflow-hidden flex-shrink-0">
                    {group.creator?.avatar_url ? (
                      <img 
                        src={group.creator.avatar_url} 
                        alt={group.creator.full_name || 'Admin'} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      group.creator?.full_name?.[0] || 'A'
                    )}
                  </div>
                  {group.creator?.is_verified && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {group.creator?.full_name || 'Admin'}
                    </p>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                      Admin
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Created {formatDate(group.created_at)}
                  </p>
                </div>
              </div>

              {/* Group Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-2 truncate">
                      {group.name}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {group.description || 'No description provided'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {group.is_private ? (
                      <Lock size={16} className="text-amber-500" />
                    ) : (
                      <Globe size={16} className="text-green-500" />
                    )}
                  </div>
                </div>

                {/* Stats and Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="sm:w-4 sm:h-4" />
                      <span className="font-medium">{group.member_count} members</span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getDaysUntilDeletion(group.auto_delete_at) <= 3 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {getDaysUntilDeletion(group.auto_delete_at)} days left
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const communitySlug = group.communities?.slug || 'kamaraj'
                        window.open(`/community/c/${communitySlug}/${group.slug}`, '_blank')
                      }}
                      className="p-2 sm:p-2.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                      title="View Group"
                    >
                      <Eye size={16} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => deleteGroup(group.slug)}
                      className="p-2 sm:p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete Group"
                    >
                      <Trash2 size={16} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
