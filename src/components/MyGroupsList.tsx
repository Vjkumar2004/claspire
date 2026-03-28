'use client'
import { useState, useEffect } from 'react'
import { Users, Calendar, Lock, Globe, Trash2, Edit, Eye, Settings, Shield, Ban, UserX } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

interface GroupMember {
  id: string
  user_id: string
  group_id: string
  role: 'member' | 'admin'
  joined_at: string
  is_blocked: boolean
  user: {
    id: string
    full_name: string
    avatar_url?: string
    role: string
    unique_id: string
  }
}

export default function MyGroupsList() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showManageModal, setShowManageModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

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

  const deleteGroup = async (groupSlug: string) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/groups/${groupSlug}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setGroups(groups.filter(g => g.slug !== groupSlug))
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete group')
      }
    } catch (error) {
      alert('Something went wrong')
    }
  }

  const fetchMembers = async (groupSlug: string) => {
    try {
      setLoadingMembers(true)
      console.log('Fetching members for group:', groupSlug)
      const res = await fetch(`/api/groups/${groupSlug}/members`)
      
      console.log('Response status:', res.status)
      console.log('Response ok:', res.ok)
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Error response:', errorText)
        throw new Error(`Failed to fetch members: ${res.status} - ${errorText}`)
      }
      
      const data = await res.json()
      console.log('Members data:', data)
      setMembers(data.members || [])
    } catch (err) {
      console.error('Error fetching members:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      alert(`Failed to fetch members: ${errorMessage}`)
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleManageMembers = (group: Group) => {
    setSelectedGroup(group)
    setShowManageModal(true)
    fetchMembers(group.slug)
  }

  const handleBlockMember = async (memberId: string, isBlocked: boolean) => {
    try {
      const res = await fetch(`/api/groups/members/${memberId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_blocked: isBlocked })
      })

      if (res.ok) {
        setMembers(members.map(m => 
          m.id === memberId ? { ...m, is_blocked: isBlocked } : m
        ))
        alert(isBlocked ? 'Member blocked successfully' : 'Member unblocked successfully')
      } else {
        const error = await res.json()
        if (error.needsDatabaseUpdate) {
          alert('Blocking feature requires database update. Please contact administrator to add the is_blocked column to the student_group_members table.')
        } else {
          alert(error.error || 'Failed to update member status')
        }
      }
    } catch (error) {
      alert('Something went wrong')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the group?')) {
      return
    }

    try {
      console.log('Removing member with ID:', memberId)
      const res = await fetch(`/api/groups/members/${memberId}`, {
        method: 'DELETE'
      })

      console.log('Remove response status:', res.status)
      console.log('Remove response ok:', res.ok)

      if (res.ok) {
        // Remove from members list in modal
        setMembers(members.filter(m => m.id !== memberId))
        
        // Also refresh the groups list to update member count
        await fetchGroups()
        
        alert('Member removed successfully')
      } else {
        const error = await res.json()
        console.error('Remove error response:', error)
        alert(error.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Remove member error:', error)
      alert('Something went wrong')
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
                        window.open(`/community/c/${communitySlug}/group/${group.slug}`, '_blank')
                      }}
                      className="p-2 sm:p-2.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                      title="View Group"
                    >
                      <Eye size={16} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleManageMembers(group)}
                      className="p-2 sm:p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Manage Members"
                    >
                      <Settings size={16} className="sm:w-4 sm:h-4" />
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

      {/* Member Management Modal */}
      <AnimatePresence>
        {showManageModal && selectedGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowManageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Manage Members</h2>
                    <p className="text-sm opacity-90">{selectedGroup.name}</p>
                  </div>
                  <button
                    onClick={() => setShowManageModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {/* Members List */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loadingMembers ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={48} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No members found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className={`flex items-center gap-3 p-4 rounded-xl border ${
                          member.is_blocked 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                          {member.user.avatar_url ? (
                            <img 
                              src={member.user.avatar_url} 
                              alt={member.user.full_name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            member.user.full_name[0]
                          )}
                        </div>

                        {/* Member Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 truncate">
                              {member.user.full_name} (ID: {member.id})
                            </span>
                            {member.role === 'admin' && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                Admin
                              </span>
                            )}
                            {member.is_blocked && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                Blocked
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {member.user.unique_id} • Joined {formatDate(member.joined_at)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {member.role !== 'admin' && (
                            <>
                              <button
                                onClick={() => handleBlockMember(member.id, !member.is_blocked)}
                                className={`p-2 rounded-lg transition-colors ${
                                  member.is_blocked
                                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                                }`}
                                title={member.is_blocked ? 'Unblock Member' : 'Block Member'}
                              >
                                {member.is_blocked ? <Shield size={16} /> : <Ban size={16} />}
                              </button>
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Remove Member"
                              >
                                <UserX size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
