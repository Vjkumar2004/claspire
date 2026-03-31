'use client'
import { useState, useEffect } from 'react'
import { Users, Lock, Globe, Trash2, Eye, Settings, Shield, Ban, UserX, UserPlus, Check, X, GraduationCap, Clock, RefreshCw, Share2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Group {
  id: string
  name: string
  slug: string
  description: string
  is_private: boolean
  scope?: string
  member_count: number
  created_at: string
  is_active: boolean
  auto_delete_at: string
  created_by: string
  communities?: { slug: string }
  creator?: {
    id: string
    full_name: string
    avatar_url?: string
    role: string
    is_verified: boolean
  }
  pendingRequests?: number
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

interface JoinRequest {
  id: string
  status: string
  requested_at: string
  users: {
    id: string
    full_name: string
    avatar_url?: string
    role: string
    unique_id: string
    branch?: string
    year?: string
    colleges?: { name: string; location: string; state: string }
  }
}

export default function MyGroupsList() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showManageModal, setShowManageModal] = useState(false)
  const [showRequestsModal, setShowRequestsModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)

  useEffect(() => { fetchGroups() }, [])

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/groups/my-groups-detailed')
      if (!res.ok) throw new Error('Failed to fetch groups')
      const data = await res.json()
      setGroups(data.groups || [])
    } catch (err) {
      setError('Failed to load your groups')
    } finally {
      setLoading(false)
    }
  }

  const fetchRequests = async (groupSlug: string) => {
    try {
      setLoadingRequests(true)
      console.log('Fetching requests for group:', groupSlug)
      const res = await fetch(`/api/groups/${groupSlug}/requests`)
      console.log('Requests response status:', res.status)
      
      if (res.ok) {
        const data = await res.json()
        console.log('Requests data:', data)
        setRequests(data.requests || [])
      } else {
        const errorData = await res.json()
        console.error('Failed to fetch requests:', errorData)
        
        let errorMessage = 'Failed to fetch requests'
        if (errorData.error === 'Forbidden - Only group creator can view requests') {
          errorMessage = 'Only group creators can view join requests'
        } else if (errorData.details) {
          errorMessage = `Failed to fetch requests: ${errorData.details}`
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
        
        alert(errorMessage)
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err)
      alert('Failed to fetch requests. Please check your connection and try again.')
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleReviewRequest = async (groupSlug: string, requestId: string, action: 'accept' | 'reject') => {
    setProcessingRequest(requestId)
    try {
      const res = await fetch(`/api/groups/${groupSlug}/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== requestId))
        if (action === 'accept') fetchGroups()
      } else {
        alert('Failed to process request')
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleOpenRequests = (group: Group) => {
    setSelectedGroup(group)
    setShowRequestsModal(true)
    fetchRequests(group.slug)
  }

  const handleRefreshRequests = () => {
    if (selectedGroup) {
      fetchRequests(selectedGroup.slug)
    }
  }

  const deleteGroup = async (groupSlug: string) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return
    try {
      const res = await fetch(`/api/groups/${groupSlug}/delete`, { method: 'DELETE' })
      if (res.ok) {
        setGroups(groups.filter(g => g.slug !== groupSlug))
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete group')
      }
    } catch { alert('Something went wrong') }
  }

  const fetchMembers = async (groupSlug: string) => {
    try {
      setLoadingMembers(true)
      const res = await fetch(`/api/groups/${groupSlug}/members`)
      if (!res.ok) throw new Error('Failed to fetch members')
      const data = await res.json()
      setMembers(data.members || [])
    } catch (err) {
      alert('Failed to fetch members')
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleManageMembers = (group: Group) => {
    setSelectedGroup(group)
    setShowManageModal(true)
    fetchMembers(group.slug)
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member?')) return
    try {
      const res = await fetch(`/api/groups/members/${memberId}`, { method: 'DELETE' })
      if (res.ok) {
        setMembers(members.filter(m => m.id !== memberId))
        fetchGroups()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to remove member')
      }
    } catch { alert('Something went wrong') }
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const getDaysUntilDeletion = (autoDeleteAt: string) => {
    const diffTime = new Date(autoDeleteAt).getTime() - Date.now()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const handleShareGroup = async (group: Group) => {
    const groupUrl = `${window.location.origin}/community/c/${group.communities?.slug || 'kamaraj'}/group/${group.slug}`
    
    // Check if Web Share API is available (mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${group.name} - Claspire Group`,
          text: `${group.description || 'Join this amazing group on Claspire!'}`,
          url: groupUrl
        })
        return
      } catch (err) {
        // User cancelled or error, fallback to clipboard
      }
    }
    
    // Fallback: Copy to clipboard with notification
    try {
      await navigator.clipboard.writeText(groupUrl)
      
      // Create a nice shareable text
      const shareText = `🎯 ${group.name}\n\n${group.description || 'Join this amazing group on Claspire!'}\n\n🔗 Join here: ${groupUrl}\n\n📱 Download Claspire: ${window.location.origin}`
      
      // Copy the enhanced share text
      await navigator.clipboard.writeText(shareText)
      
      // Show success notification
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2'
      notification.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        Group link copied to clipboard!
      `
      document.body.appendChild(notification)
      
      setTimeout(() => {
        notification.remove()
      }, 3000)
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Failed to copy link. Please try again.')
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

  if (loading) return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="animate-pulse space-y-3">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        {[1,2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  )

  if (error) return (
    <div className="bg-white rounded-2xl p-6 shadow-sm text-center py-8">
      <p className="text-red-600 font-medium mb-3">{error}</p>
      <button onClick={fetchGroups} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">Try Again</button>
    </div>
  )

  if (groups.length === 0) return (
    <div className="bg-white rounded-2xl p-6 shadow-sm text-center py-8">
      <Users size={40} className="text-gray-300 mx-auto mb-3" />
      <h3 className="font-semibold text-gray-900 mb-1">No Groups Yet</h3>
      <p className="text-gray-500 text-sm">You haven't created any student groups yet.</p>
    </div>
  )

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
            className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-all hover:border-purple-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Creator */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                    {group.creator?.avatar_url
                      ? <img src={group.creator.avatar_url} className="w-full h-full object-cover" />
                      : group.creator?.full_name?.[0] || 'A'}
                  </div>
                  {group.creator?.is_verified && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm">{group.creator?.full_name || 'Admin'}</p>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
                  </div>
                  <p className="text-xs text-gray-500">Created {formatDate(group.created_at)}</p>
                </div>
              </div>

              {/* Group Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base mb-1 truncate">{group.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{group.description || 'No description provided'}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {group.scope === 'college' ? (
                      <GraduationCap size={16} className="text-indigo-500" />
                    ) : group.is_private || group.scope === 'private' ? (
                      <Lock size={16} className="text-amber-500" />
                    ) : (
                      <Globe size={16} className="text-green-500" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Users size={13} />
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
                    {/* Join Requests button — only for private groups */}
                    {(group.is_private || group.scope === 'private') && (
                      <button
                        onClick={() => handleOpenRequests(group)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors text-xs font-medium relative"
                        title="Join Requests"
                      >
                        <UserPlus size={14} />
                        <span>Requests</span>
                        {group.pendingRequests && group.pendingRequests > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                            {group.pendingRequests > 9 ? '9+' : group.pendingRequests}
                          </span>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => window.open(`/community/c/${group.communities?.slug || 'kamaraj'}/group/${group.slug}`, '_blank')}
                      className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                      title="View Group"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleShareGroup(group)}
                      className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Share Group"
                    >
                      <Share2 size={16} />
                    </button>
                    <button
                      onClick={() => handleManageMembers(group)}
                      className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Manage Members"
                    >
                      <Settings size={16} />
                    </button>
                    <button
                      onClick={() => deleteGroup(group.slug)}
                      className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete Group"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Join Requests Modal */}
      <AnimatePresence>
        {showRequestsModal && selectedGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRequestsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Join Requests</h2>
                    <p className="text-sm opacity-90">{selectedGroup.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleRefreshRequests}
                      disabled={loadingRequests}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Refresh Requests"
                    >
                      <RefreshCw size={18} className={loadingRequests ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => setShowRequestsModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 overflow-y-auto max-h-[60vh]">
                {loadingRequests ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-12">
                    <UserPlus size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No pending requests</p>
                    <p className="text-gray-400 text-sm mt-1">All caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((req) => (
                      <div key={req.id} className="border border-gray-200 rounded-xl p-4 hover:border-amber-200 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                            {req.users?.avatar_url
                              ? <img src={req.users.avatar_url} className="w-full h-full object-cover" />
                              : req.users?.full_name?.[0] || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-900 text-sm">{req.users?.full_name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                req.users?.role === 'senior' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                              }`}>{req.users?.role}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                              <span>{req.users?.unique_id}</span>
                              {req.users?.branch && <span>• {req.users.branch}</span>}
                              {req.users?.year && <span>• Year {req.users.year}</span>}
                              {req.users?.colleges && (
                                <span className="flex items-center gap-1">
                                  <GraduationCap size={10} />
                                  {req.users.colleges.name}, {req.users.colleges.location}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                              <Clock size={10} />
                              Requested {timeAgo(req.requested_at)}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleReviewRequest(selectedGroup.slug, req.id, 'accept')}
                            disabled={processingRequest === req.id}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                          >
                            {processingRequest === req.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <><Check size={14} /> Accept</>
                            )}
                          </button>
                          <button
                            onClick={() => handleReviewRequest(selectedGroup.slug, req.id, 'reject')}
                            disabled={processingRequest === req.id}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                          >
                            <X size={14} /> Reject
                          </button>
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

      {/* Members Modal */}
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
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Manage Members</h2>
                  <p className="text-sm opacity-90">{selectedGroup.name}</p>
                </div>
                <button onClick={() => setShowManageModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto max-h-[60vh]">
                {loadingMembers ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500">No members found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className={`flex items-center gap-3 p-4 rounded-xl border ${member.is_blocked ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                          {member.user.avatar_url
                            ? <img src={member.user.avatar_url} className="w-full h-full object-cover" />
                            : member.user.full_name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-gray-900 text-sm truncate">{member.user.full_name}</span>
                            {member.role === 'admin' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Admin</span>}
                            {member.is_blocked && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Blocked</span>}
                          </div>
                          <p className="text-xs text-gray-500">{member.user.unique_id} • Joined {formatDate(member.joined_at)}</p>
                        </div>
                        {member.role !== 'admin' && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <UserX size={16} />
                          </button>
                        )}
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
