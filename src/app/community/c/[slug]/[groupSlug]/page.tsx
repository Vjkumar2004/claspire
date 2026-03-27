'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Globe, Send, Shield, CheckCircle, Crown, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  content: string
  created_at: string
  expires_at?: string
  sender: {
    id: string
    full_name: string
    avatar_url?: string
    role: string
    unique_id: string
  }
}

interface GroupData {
  group: {
    id: string
    name: string
    description: string
    is_private: boolean
    member_count: number
    created_at: string
    created_by: string
    creator_role: string
    creator: {
      id: string
      full_name: string
      avatar_url?: string
      role: string
      unique_id: string
    }
  }
  members: Array<{
    id: string
    full_name: string
    avatar_url?: string
    role: string
    joined_at: string
    membership_role?: string
  }>
  messages: Message[]
  isMember: boolean
  isAdmin: boolean
  canMessage: boolean
}

export default function GroupChatPage({ params }: { params: Promise<{ slug: string; groupSlug: string }> }) {
  const [groupData, setGroupData] = useState<GroupData | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [joining, setJoining] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isCreator, setIsCreator] = useState(false)
  const [slug, setSlug] = useState<string>('')
  const [groupSlug, setGroupSlug] = useState<string>('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    // Hide the bottom navbar on group chat pages
    const hideNavbar = () => {
      const navbar = document.querySelector('.bottom-navbar')
      if (navbar) {
        (navbar as HTMLElement).style.display = 'none'
      }
    }
    
    // Hide immediately
    hideNavbar()
    
    // Also hide after a short delay in case the navbar loads later
    const timeoutId = setTimeout(hideNavbar, 100)
    
    // Show it back when leaving the page
    return () => {
      clearTimeout(timeoutId)
      const navbar = document.querySelector('.bottom-navbar')
      if (navbar) {
        (navbar as HTMLElement).style.display = ''
      }
    }
  }, [])

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setSlug(resolvedParams.slug)
      setGroupSlug(resolvedParams.groupSlug)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (slug && groupSlug) {
      fetchGroupData()
      fetchCurrentUser()
    }
  }, [slug, groupSlug])

  useEffect(() => {
    if (groupData && currentUser) {
      // Check if current user is the creator
      if (groupData.group.created_by === currentUser.id) {
        setIsCreator(true)
      } else {
        setIsCreator(false)
      }
    }
  }, [groupData?.group.created_by, currentUser?.id])

  useEffect(() => {
    if (groupData?.group.id) {
      const channel = supabase
        .channel(`group:${groupData.group.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'student_group_messages',
          filter: `group_id=eq.${groupData.group.id}`
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as any
            fetchSenderDetails(newMsg).then(message => {
              if (message) {
                setMessages(prev => [...prev, message])
              }
            })
          }
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [groupData?.group.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchSenderDetails = async (message: any): Promise<Message | null> => {
    try {
      const { data: sender } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, role, unique_id')
        .eq('id', message.sender_id)
        .single()

      if (sender) {
        return {
          ...message,
          sender
        }
      }
    } catch (error) {
      console.error('Error fetching sender:', error)
    }
    return null
  }

  const fetchGroupData = async () => {
    try {
      const res = await fetch(`/api/groups/${groupSlug}`)
      
      if (res.ok) {
        const data = await res.json()
        setGroupData(data)
        setMessages(data.messages || [])
      } else {
        const errorData = await res.json()
        alert(`Group not found: ${errorData.error}`)
        router.push(`/community/c/${slug}`)
      }
    } catch (error) {
      console.error('Error fetching group:', error)
      alert('Failed to load group. Please try again.')
      router.push(`/community/c/${slug}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setCurrentUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !groupData) return

    setSending(true)
    try {
      const res = await fetch(`/api/groups/${groupSlug}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          sender_id: currentUser?.id
        })
      })

      if (res.ok) {
        // Add the message to local state immediately
        const newMessageObj = {
          id: crypto.randomUUID(),
          content: newMessage.trim(),
          sender_id: currentUser?.id,
          sender: currentUser,
          created_at: new Date().toISOString(),
          is_deleted: false
        }
        
        setMessages(prev => [...prev, newMessageObj])
        setNewMessage('')
        // Message will also be added via real-time subscription
      } else {
        alert('Failed to send message')
      }
    } catch (error) {
      alert('Something went wrong')
    } finally {
      setSending(false)
    }
  }

  const handleJoin = async () => {
    if (joining) return
    setTermsAccepted(false) // Reset when opening modal
    setShowTermsModal(true)
  }

  const handleAcceptTerms = async () => {
    setJoining(true)
    setShowTermsModal(false)
    setTermsAccepted(false) // Reset for next time

    try {
      const res = await fetch(`/api/groups/${groupSlug}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id })
      })

      const data = await res.json()
      if (res.ok) {
        if (data.success) {
          fetchGroupData() // Refresh to get member status
        } else if (data.requested) {
          alert('Join request sent! Waiting for admin approval.')
        }
      } else {
        alert(data.error || 'Failed to join')
      }
    } catch (error) {
      alert('Something went wrong')
    } finally {
      setJoining(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (mins > 0) return `${mins}m ago`
    return 'just now'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading group...</p>
        </div>
      </div>
    )
  }

  if (!groupData) {
    return null
  }

  const { group, isMember, isAdmin, canMessage } = groupData
  
  // Override for creator - always allow messaging
  const effectiveCanMessage = isCreator ? true : canMessage
  const effectiveIsMember = isCreator ? true : isMember

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col pb-0">
      {/* Header - Mobile Optimized */}
      <div className="bg-white border-b border-[#E2E8F0] sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between p-3 sm:p-4">
          <button 
            onClick={() => router.push(`/community/c/${slug}`)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          
          <div className="flex-1 mx-3 min-w-0">
            <h1 className="text-base sm:text-lg font-black text-gray-900 truncate">
              {groupData.group.name}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {groupData.group.member_count} members
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowMembers(!showMembers)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors relative"
            >
              <Users size={20} className="text-gray-700" />
              {groupData.group.member_count > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {groupData.group.member_count}
                </span>
              )}
            </button>
            
            <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <Globe size={20} className="text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Members Dropdown */}
      <AnimatePresence>
        {showMembers && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b border-[#E2E8F0] overflow-hidden"
          >
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-3">Group Members</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {groupData.members.map((member, index) => (
                  <div key={member.id || `member-${index}`} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden ${
                        member.avatar_url ? 'bg-transparent' : 
                        member.role === 'senior' ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 
                        'bg-gradient-to-br from-purple-500 to-indigo-500'
                      }`}>
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.full_name || 'User'} className="w-full h-full object-cover" />
                        ) : (
                          member.full_name?.[0] || 'U'
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{member.full_name || 'Unknown User'}</span>
                          {member.role === 'senior' && <Crown size={12} className="text-amber-500" />}
                          {member.membership_role === 'admin' && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Joined {timeAgo(member.joined_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area - Mobile Optimized */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            {isCreator ? (
              <>
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-3xl border border-purple-200 mb-4 max-w-sm">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <Crown className="text-purple-600" size={28} />
                    <h3 className="font-bold text-purple-900 text-lg">Welcome, Creator!</h3>
                  </div>
                  <p className="text-sm text-purple-700 mb-2">
                    You're the admin of this group
                  </p>
                  <p className="text-xs text-purple-600">
                    Start the conversation by sending the first message below
                  </p>
                </div>
                <Sparkles size={40} className="sm:w-12 sm:h-12 mx-auto text-gray-300 mb-3 sm:mb-4" />
                <p className="text-gray-500 font-medium text-sm sm:text-base">No messages yet</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">Be the first to say something! 👋</p>
              </>
            ) : (
              <>
                <Sparkles size={40} className="sm:w-12 sm:h-12 mx-auto text-gray-300 mb-3 sm:mb-4" />
                <p className="text-gray-500 font-medium text-sm sm:text-base">No messages yet</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">Be the first to say something! 👋</p>
              </>
            )}
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.sender?.id === currentUser?.id
            return (
              <div
                key={message.id || `message-${index}`}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-1`}
              >
                <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {!isOwn && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs overflow-hidden flex-shrink-0 ${
                      message.sender?.avatar_url ? 'bg-transparent' : 
                      message.sender?.role === 'senior' ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 
                      'bg-gradient-to-br from-purple-500 to-indigo-500'
                    }`}>
                      {message.sender?.avatar_url ? (
                        <img src={message.sender.avatar_url} alt={message.sender.full_name || 'User'} className="w-full h-full object-cover" />
                      ) : (
                        message.sender.full_name?.[0] || 'U'
                      )}
                    </div>
                  )}
                  <div className={`max-w-full ${isOwn ? 'text-right' : ''}`}>
                    <p className="text-xs font-bold text-gray-600 mb-1">
                      {isOwn ? 'You' : (message.sender?.full_name || 'Unknown User')}
                    </p>
                    <div className={`inline-block px-4 py-2 rounded-2xl text-sm ${
                      isOwn 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="break-words">{message.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-2">
                      {timeAgo(message.created_at)}
                      {message.expires_at && ' • ⏰'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Mobile Optimized */}
      <div className="bg-white border-t border-[#E2E8F0] p-3 sm:p-4">
        {(isCreator || (effectiveIsMember && effectiveCanMessage)) ? (
          // Creator or member with messaging rights gets input
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isCreator ? "Send the first message as group creator..." : "Type a message..."}
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-[#E2E8F0] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-2.5 sm:p-3 rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 flex-shrink-0"
            >
              <Send size={18} className="sm:w-5 sm:h-5" />
            </button>
          </form>
        ) : !effectiveIsMember ? (
          <div className="text-center">
            <button
              onClick={handleJoin}
              disabled={joining}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50"
            >
              {joining ? 'Joining...' : 'Join to Participate'}
            </button>
          </div>
        ) : effectiveCanMessage ? (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-[#E2E8F0] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-2.5 sm:p-3 bg-[#7C3AED] text-white rounded-2xl hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Send size={16} className="sm:w-4 sm:h-4" />
            </button>
          </form>
        ) : (
          <div className="text-center text-sm text-gray-500 px-4">
            You cannot send messages in this group
          </div>
        )}
      </div>

      {/* Terms Acceptance Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Users size={24} />
                  <h2 className="text-xl font-bold">Join Group</h2>
                </div>
                <p className="text-sm opacity-90">
                  {groupData?.group?.name || 'Group'}
                </p>
              </div>

              {/* Terms Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <h3 className="font-bold text-gray-900 mb-4">Group Guidelines</h3>
                
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <span className="text-purple-600 mt-1">✓</span>
                    <p>Be respectful and professional in all communications</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-600 mt-1">✓</span>
                    <p>Share relevant and helpful content with group members</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-600 mt-1">✓</span>
                    <p>No spam, self-promotion, or unrelated content</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-600 mt-1">✓</span>
                    <p>Protect privacy - don't share personal information</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-600 mt-1">✓</span>
                    <p>Report inappropriate content to group admins</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <p className="text-xs text-amber-800">
                    <strong>Note:</strong> Violation of these guidelines may result in removal from the group.
                  </p>
                </div>

                <div className="mt-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">
                      I agree to follow the group guidelines and understand the consequences of violation.
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-100 p-6 flex gap-3">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="accept-terms-btn"
                  onClick={handleAcceptTerms}
                  disabled={!termsAccepted || joining}
                  className={`flex-1 px-4 py-3 rounded-2xl font-bold transition-all ${
                    termsAccepted && !joining
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700' 
                      : 'bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {joining ? 'Joining...' : 'Accept & Join'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
