'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Users, Lock, Globe, Clock, Send, 
  Crown, MoreHorizontal, Trash2, UserPlus, Sparkles, User
} from 'lucide-react'
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
    role: 'student' | 'senior'
    unique_id: string
  }
}

interface GroupData {
  group: {
    id: string
    name: string
    description: string
    is_private: boolean
    is_ephemeral: boolean
    member_count: number
    creator_role: 'student' | 'senior'
    college: {
      short_name: string
      slug: string
    }
  }
  members: Array<{
    id: string
    full_name: string
    avatar_url?: string
    role: 'student' | 'senior'
    unique_id: string
    membership_role: string
    joined_at: string
  }>
  messages: Message[]
  isMember: boolean
  isAdmin: boolean
  canMessage: boolean
}

export default function GroupChatPage() {
  const params = useParams()
  const router = useRouter()
  const { slug, groupSlug } = params as { slug: string, groupSlug: string }
  
  const [groupData, setGroupData] = useState<GroupData | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [joining, setJoining] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchGroupData()
    fetchCurrentUser()
  }, [slug, groupSlug])

  useEffect(() => {
    if (groupData?.isMember) {
      // Subscribe to new messages
      const channel = supabase
        .channel(`group:${groupData.group.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'group_messages',
            filter: `community_id=eq.${groupData.group.id}`
          },
          (payload: any) => {
            const newMsg = payload.new as Message
            // Fetch sender details
            fetchSenderDetails(newMsg).then(msg => {
              if (msg) {
                setMessages(prev => [...prev, msg])
              }
            })
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [groupData])

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
      console.log('=== Fetching group data ===')
      console.log('Group slug:', groupSlug)
      
      const res = await fetch(`/api/groups/${groupSlug}`)
      console.log('API response status:', res.status)
      
      if (res.ok) {
        const data = await res.json()
        console.log('Group data received:', data)
        setGroupData(data)
        setMessages(data.messages || [])
      } else {
        const errorData = await res.json()
        console.error('API error:', errorData)
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
      console.error('Error fetching user:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !groupData?.canMessage) return

    setSending(true)
    try {
      const res = await fetch(`/api/groups/${groupSlug}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() })
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to send message')
      }
    } catch (error) {
      alert('Something went wrong')
    } finally {
      setSending(false)
    }
  }

  const handleJoin = async () => {
    if (joining) return
    // Show terms modal first
    setShowTermsModal(true)
  }

  const handleAcceptTerms = async () => {
    setJoining(true)
    setShowTermsModal(false)

    try {
      const res = await fetch(`/api/groups/${groupSlug}/join`, {
        method: 'POST'
      })

      const data = await res.json()
      if (res.ok) {
        if (data.joined) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!groupData) {
    return null
  }

  const { group, isMember, isAdmin, canMessage } = groupData

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header - Professional & Mobile Responsive */}
      <div className="bg-white border-b border-[#E2E8F0] sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <button
              onClick={() => router.push(`/community/c/${slug}`)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-black text-gray-900 truncate">{group.name}</h1>
              <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  {group.creator_role === 'student' ? (
                    <User size={10} className="sm:w-3 sm:h-3" />
                  ) : (
                    <Crown size={10} className="text-amber-500 sm:w-3 sm:h-3" />
                  )}
                  {group.creator_role}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <Users size={10} className="sm:w-3 sm:h-3" />
                  {group.member_count} members
                </span>
                <span>•</span>
                {group.is_private ? (
                  <span className="flex items-center gap-1">
                    <Lock size={10} className="sm:w-3 sm:h-3" /> Private
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Globe size={10} className="sm:w-3 sm:h-3" /> Public
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMembers(!showMembers)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors relative"
            >
              <Users size={20} />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
                {group.member_count}
              </span>
            </button>
            {isAdmin && (
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <MoreHorizontal size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Ephemeral Banner */}
        {group.is_ephemeral && (
          <div className="bg-amber-50 border-t border-amber-200 px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-amber-800">
              <Clock size={14} />
              <span>⏰ Messages auto-delete after 24hrs</span>
            </div>
          </div>
        )}
      </div>

      {/* Members Sidebar */}
      <AnimatePresence>
        {showMembers && (
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-white border-l border-[#E2E8F0] z-40 shadow-xl"
          >
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="font-black text-gray-900">Members ({groupData.members.length})</h2>
              <button
                onClick={() => setShowMembers(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
            </div>
            <div className="overflow-y-auto h-full pb-20">
              {groupData.members.map((member) => (
                <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden ${
                      member.avatar_url ? 'bg-transparent' : 
                      member.role === 'senior' ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 
                      'bg-gradient-to-br from-purple-500 to-indigo-500'
                    }`}>
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                      ) : (
                        member.full_name[0]
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{member.full_name}</span>
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area - Mobile Optimized */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <Sparkles size={40} className="sm:w-12 sm:h-12 mx-auto text-gray-300 mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-black text-gray-900 mb-2">No messages yet</h3>
            <p className="text-sm text-gray-600 px-4">
              {isMember ? 'Be the first to say something!' : 'Join to start chatting'}
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender.id === currentUser?.id
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-1`}
              >
                <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {!isOwn && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs overflow-hidden flex-shrink-0 ${
                      message.sender.avatar_url ? 'bg-transparent' : 
                      message.sender.role === 'senior' ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 
                      'bg-gradient-to-br from-purple-500 to-indigo-500'
                    }`}>
                      {message.sender.avatar_url ? (
                        <img src={message.sender.avatar_url} alt={message.sender.full_name} className="w-full h-full object-cover" />
                      ) : (
                        message.sender.full_name[0]
                      )}
                    </div>
                  )}
                  <div>
                    {!isOwn && (
                      <div className="flex items-center gap-2 mb-1 px-2">
                        <span className="text-xs font-bold text-gray-700">{message.sender.full_name}</span>
                        {message.sender.role === 'senior' && <Crown size={10} className="text-amber-500" />}
                        <span className="text-xs text-gray-500">{timeAgo(message.created_at)}</span>
                      </div>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-[#7C3AED] text-white rounded-tr-[4px]'
                          : 'bg-white border border-[#E2E8F0] text-gray-900 rounded-tl-[4px]'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {isOwn && (
                      <p className="text-xs text-gray-500 mt-1 px-2 text-right">
                        {timeAgo(message.created_at)}
                        {message.expires_at && ' • ⏰'}
                      </p>
                    )}
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
        {!isMember ? (
          <div className="text-center">
            <button
              onClick={handleJoin}
              disabled={joining}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50"
            >
              {joining ? 'Joining...' : 'Join to Participate'}
            </button>
          </div>
        ) : canMessage ? (
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
              onClick={(e) => e.stopPropagation()}
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
                      defaultChecked={false}
                      onChange={(e) => {
                        const button = document.getElementById('accept-terms-btn') as HTMLButtonElement
                        if (button) {
                          button.disabled = !e.target.checked
                          button.classList.toggle('opacity-50', !e.target.checked)
                        }
                      }}
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
                  disabled={true}
                  className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                >
                  Accept & Join
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
