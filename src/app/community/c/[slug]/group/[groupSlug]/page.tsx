'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Users, Lock, Globe, Clock, Send, 
  Crown, MoreHorizontal, Sparkles, User, Ban,
  Menu,
} from 'lucide-react'
import { subscribeToGroupMessages } from '@/lib/realtime-channels'
import { GroupsProvider } from '@/contexts/GroupsContext'
import GroupsSidebar from '@/components/groups/GroupsSidebar'

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
    college: { short_name: string; slug: string }
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
  requestPending?: boolean
}

export default function GroupChatPage() {
  const params = useParams()
  const router = useRouter()
  const { slug, groupSlug } = params as { slug: string; groupSlug: string }

  const [groupData, setGroupData] = useState<GroupData | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [joining, setJoining] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showCollegeRestriction, setShowCollegeRestriction] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isBlocked, setIsBlocked] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const membersRef = useRef(groupData?.members || [])

  useEffect(() => {
    fetchGroupData()
    fetchCurrentUser()
  }, [slug, groupSlug])

  // Mark group as read when loaded
  useEffect(() => {
    if (groupData?.group?.id && groupData?.isMember) {
      fetch('/api/groups/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: groupData.group.id }),
      }).catch(() => {})
    }
  }, [groupData?.group?.id, groupData?.isMember])

  // Keep membersRef in sync with latest groupData
  useEffect(() => {
    membersRef.current = groupData?.members || []
  }, [groupData?.members])

  // Subscribe to Realtime messages via shared channel (deduplicated with GroupsContext)
  useEffect(() => {
    if (!groupData?.isMember || !groupData?.group?.id) return

    const unsub = subscribeToGroupMessages(groupData.group.id, (event, payload) => {
      if (event === 'INSERT') {
        const senderId = payload.new.sender_id
        setMessages((prev) => {
          const hasTempFromSender = prev.some(m => m.id.startsWith('temp-') && m.sender?.id === senderId)
          if (hasTempFromSender) {
            return prev.filter(m => !(m.id.startsWith('temp-') && m.sender?.id === senderId))
          }
          if (prev.some(m => m.id === payload.new.id)) return prev

          const sender = membersRef.current.find(m => m.id === senderId)
          const newMessage: Message = {
            id: payload.new.id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            sender: {
              id: senderId,
              full_name: sender?.full_name || 'Unknown User',
              avatar_url: sender?.avatar_url,
              role: sender?.role || 'student',
              unique_id: sender?.unique_id || '',
            }
          }
          return [...prev, newMessage]
        })
      } else if (event === 'DELETE') {
        setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
      } else if (event === 'UPDATE') {
        setMessages((prev) => {
          if (payload.new.is_deleted) {
            return prev.filter((msg) => msg.id !== payload.new.id)
          }
          return prev.map((msg) => (msg.id === payload.new.id ? { ...msg, content: payload.new.content } : msg))
        })
      }
    })

    return unsub
  }, [groupData?.isMember, groupData?.group?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchGroupData = async () => {
    try {
      const res = await fetch(`/api/groups/${groupSlug}`)
      if (res.ok) {
        const data = await res.json()
        
        if (!data.isMember && data.group?.is_private) {
          const reqRes = await fetch(`/api/groups/${groupSlug}/my-request`)
          if (reqRes.ok) {
            const reqData = await reqRes.json()
            if (reqData.status === 'pending') {
              setGroupData({ ...data, requestPending: true })
              setIsBlocked(data.isBlocked || false)
              const msgs = data.messages || []
              setMessages(msgs)
              setLoading(false)
              return
            }
          }
        }
        
        setGroupData(data)
        setIsBlocked(data.isBlocked || false)
        const msgs = data.messages || []
        setMessages(msgs)
      } else {
        const errorData = await res.json()
        alert(`Group not found: ${errorData.error}`)
        router.push(`/community/c/${slug}`)
      }
    } catch (error) {
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

    const content = newMessage.trim()
    const tempId = `temp-${Date.now()}-${Math.random()}`

    const optimisticMessage: Message = {
      id: tempId,
      content,
      created_at: new Date().toISOString(),
      sender: {
        id: currentUser?.id || '',
        full_name: currentUser?.full_name || 'You',
        avatar_url: currentUser?.avatar_url,
        role: currentUser?.role || 'student',
        unique_id: currentUser?.unique_id || '',
      }
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setNewMessage('')
    setSending(true)

    try {
      const res = await fetch(`/api/groups/${groupSlug}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Failed to send message')
        setMessages((prev) => prev.filter(m => m.id !== tempId))
      } else {
        const data = await res.json()
        if (data.message) {
          setMessages((prev) => prev.map(m =>
            m.id === tempId
              ? {
                  id: data.message.id,
                  content: data.message.content,
                  created_at: data.message.created_at,
                  sender: {
                    id: data.message.sender_id,
                    full_name: currentUser?.full_name || 'You',
                    avatar_url: currentUser?.avatar_url,
                    role: currentUser?.role || 'student',
                    unique_id: currentUser?.unique_id || '',
                  }
                }
              : m
          ))
        }
      }
    } catch (error) {
      alert('Something went wrong')
      setMessages((prev) => prev.filter(m => m.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  const handleJoin = async () => {
    if (joining) return
    setTermsAccepted(false)
    setShowTermsModal(true)
  }

  const handleAcceptTerms = async () => {
    setJoining(true)
    setShowTermsModal(false)
    try {
      const res = await fetch(`/api/groups/${groupSlug}/join`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        if (data.joined) {
          fetchGroupData()
        } else if (data.requested) {
          setGroupData(prev => prev ? { ...prev, isMember: false, canMessage: false, isAdmin: false, requestPending: true } : prev)
        }
      } else {
        if (data.collegeRestricted) {
          setShowCollegeRestriction(true)
        } else {
          alert(data.error || 'Failed to join')
        }
      }
    } catch {
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

  const chatContent = loading ? (
    <div className="flex-1 flex items-center justify-center bg-[#efeae2] dark:bg-[#1D2226]">
      <div className="w-8 h-8 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
    </div>
  ) : !groupData ? null : (
    <>
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-[#283036] border-b border-gray-200 dark:border-[#38434F] px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between z-40 shadow-sm min-h-[60px]">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <button onClick={() => setShowMobileSidebar(true)} className="lg:hidden p-2 -ml-1 hover:bg-gray-100 dark:bg-[#283036] dark:hover:bg-[#1D2226] rounded-full transition-colors flex-shrink-0">
            <Menu size={20} className="text-gray-700 dark:text-[#B0B7BE]" />
          </button>
          <button onClick={() => router.push(`/community/c/${slug}`)} className="hidden lg:block p-2 -ml-1 hover:bg-gray-100 dark:bg-[#283036] dark:hover:bg-[#1D2226] rounded-full transition-colors flex-shrink-0">
            <ArrowLeft size={20} className="text-gray-700 dark:text-[#B0B7BE]" />
          </button>
          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-base overflow-hidden flex-shrink-0">
            {groupData.group.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[16px] text-gray-900 dark:text-white leading-tight truncate">{groupData.group.name}</div>
            <p className="text-xs text-gray-500 dark:text-[#B0B7BE] truncate mt-0.5">{groupData.group.member_count} members • {groupData.group.is_private ? 'Private' : 'Public'}</p>
          </div>
        </div>
        <div className="flex-shrink-0 pl-2">
          <button onClick={() => setShowMembers(!showMembers)} className="p-2 hover:bg-gray-100 dark:bg-[#283036] dark:hover:bg-[#1D2226] rounded-full transition-colors relative">
            <Users size={20} className="text-gray-700 dark:text-[#B0B7BE]" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-purple-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm border border-white">
              {groupData.group.member_count}
            </span>
          </button>
        </div>
      </div>

      {/* Members Sidebar */}
      <AnimatePresence>
        {showMembers && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-72 bg-white dark:bg-[#283036] border-l border-gray-200 dark:border-[#38434F] z-50 shadow-2xl"
          >
            <div className="p-4 border-b border-gray-100 dark:border-[#38434F] flex items-center justify-between bg-white dark:bg-[#283036]">
              <h2 className="font-bold text-gray-900 dark:text-white">Members</h2>
              <button onClick={() => setShowMembers(false)} className="p-2 hover:bg-gray-100 dark:bg-[#283036] dark:hover:bg-[#1D2226] rounded-full transition-colors">
                <ArrowLeft size={16} className="text-gray-500 dark:text-[#B0B7BE]" />
              </button>
            </div>
            <div className="overflow-y-auto h-full pb-20 bg-gray-50 dark:bg-[#1D2226]/50">
              {groupData.members.map((member) => (
                <div key={member.id} className="px-4 py-3 hover:bg-gray-100 dark:bg-[#283036] dark:hover:bg-[#1D2226] transition-colors flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0 ${
                    member.avatar_url ? 'bg-transparent shadow-sm' : member.role === 'senior' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-purple-500 to-purple-700'
                  }`}>
                    {member.avatar_url ? <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" /> : member.full_name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">{member.full_name}</span>
                      {member.membership_role === 'admin' && (
                        <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold flex-shrink-0">Admin</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-[#B0B7BE]">Joined {timeAgo(member.joined_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
            <div className="w-12 h-12 bg-white dark:bg-[#283036] rounded-full flex items-center justify-center shadow-sm">
              <Sparkles size={24} className="text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 dark:text-[#B0B7BE] font-medium">{groupData.isMember ? 'Be the first to say something! 👋' : 'Join to start chatting'}</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.sender?.id === currentUser?.id
            const prevMessage = messages[index - 1]
            const isSameSender = prevMessage?.sender?.id === message.sender?.id
            const showAvatar = !isOwn && !isSameSender

            return (
              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] sm:max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {!isOwn && (
                    <div className="w-8 h-8 flex-shrink-0 mt-auto">
                      {showAvatar ? (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs overflow-hidden shadow-sm ${
                          message.sender?.avatar_url ? 'bg-transparent' : message.sender?.role === 'senior' ? 'bg-amber-500' : 'bg-purple-600'
                        }`}>
                          {message.sender?.avatar_url ? <img src={message.sender.avatar_url} className="w-full h-full object-cover" /> : message.sender?.full_name?.[0]?.toUpperCase()}
                        </div>
                      ) : <div className="w-8 h-8" />}
                    </div>
                  )}

                  <div className="flex flex-col gap-0.5 relative">
                    {!isOwn && showAvatar && (
                      <span className="text-[11px] font-semibold text-purple-600 px-1 ml-1">{message.sender?.full_name}</span>
                    )}
                    <div className={`px-4 py-2 text-sm leading-relaxed shadow-sm ${
                      isOwn
                        ? 'bg-purple-600 text-white rounded-2xl rounded-br-none'
                        : 'bg-white dark:bg-[#283036] text-gray-800 dark:text-white border border-gray-100 dark:border-[#38434F] rounded-2xl rounded-bl-none'
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      <div className={`flex items-center justify-end gap-1.5 mt-1 ${isOwn ? 'text-white/75' : 'text-gray-400 dark:text-[#B0B7BE]'}`}>
                        <span className="text-[9px]">{timeAgo(message.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Sticky Bottom */}
      <div className="flex-shrink-0 bg-[#f0f2f5] dark:bg-[#1D2226] border-t border-gray-200 dark:border-[#38434F] px-4 py-3 pb-safe">{groupData.isMember ? (
  <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
    <input
      type="text"
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      placeholder="Type a message..."
      disabled={sending || !groupData.canMessage}
      className="flex-1 bg-white dark:bg-[#283036] border border-gray-200 dark:border-[#38434F] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#B0B7BE] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors disabled:opacity-50 shadow-sm"
    />
    <button
      type="submit"
      disabled={!newMessage.trim() || sending || !groupData.canMessage}
      className="p-3 flex-shrink-0 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl flex items-center justify-center transition-colors disabled:opacity-50 active:scale-95 shadow-sm"
    >
      {sending ? (
        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      ) : (
        <Send size={20} className="ml-0.5" />
      )}
    </button>
  </form>
) : groupData?.requestPending ? (
    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-[#B0B7BE] bg-white dark:bg-[#283036] border border-gray-200 dark:border-[#38434F] px-4 py-3 rounded-2xl shadow-sm">
      <Clock size={16} />
      Waiting for admin approval...
    </div>
  ) : (
    <button onClick={handleJoin} disabled={joining} className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm shadow-purple-200">
      {joining ? 'Joining...' : groupData.group?.is_private ? '🔒 Request to Join' : '✦ Join to Participate'}
    </button>
  )}
      </div>

      {/* Terms Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4" onClick={() => setShowTermsModal(false)}>
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white dark:bg-[#283036] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-purple-50 p-5 border-b border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                    <Users size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white">Join {groupData?.group?.name}</h2>
                    <p className="text-xs text-gray-500 dark:text-[#B0B7BE]">Read the guidelines before joining</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-3 max-h-[50vh] overflow-y-auto">
                {['Be respectful and professional', 'Share relevant content only', 'No spam or self-promotion', 'Protect member privacy', 'Report inappropriate content'].map((rule, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-[#B0B7BE]">
                    <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                    {rule}
                  </div>
                ))}
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <p className="text-xs text-amber-700 font-medium">Violations may result in removal from the group.</p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer mt-4">
                  <input 
                    type="checkbox" 
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <span className="text-sm text-gray-600 dark:text-[#B0B7BE] font-medium select-none">I agree to follow the group guidelines.</span>
                </label>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-[#1D2226] border-t border-gray-100 dark:border-[#38434F] flex gap-3">
                <button onClick={() => setShowTermsModal(false)} className="flex-1 py-2.5 rounded-2xl bg-white dark:bg-[#283036] border border-gray-200 dark:border-[#38434F] text-gray-700 dark:text-[#B0B7BE] text-sm font-bold hover:bg-gray-50 dark:bg-[#1D2226] dark:hover:bg-[#1D2226] transition-colors shadow-sm">Cancel</button>
                <button 
                  id="accept-terms-btn" 
                  onClick={handleAcceptTerms} 
                  disabled={!termsAccepted} 
                  className={`flex-1 py-2.5 rounded-2xl text-white text-sm font-bold transition-all shadow-sm ${
                    termsAccepted 
                      ? 'bg-purple-600 hover:bg-purple-700 active:scale-95' 
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Accept & Join
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* College Restriction Modal */}
      <AnimatePresence>
        {showCollegeRestriction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowCollegeRestriction(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#283036] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-red-50 p-5 border-b border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                    <Lock size={24} />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white">College Restricted</h2>
                    <p className="text-xs text-gray-500 dark:text-[#B0B7BE]">This group is not available for you</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                  <p className="text-sm text-red-800 font-medium text-center">
                    This group is only available for students from the same college. 
                    You can only join groups created within your college.
                  </p>
                </div>
                <div className="space-y-2 p-2">
                  <p className="text-xs font-bold text-gray-700 dark:text-[#B0B7BE]">Why this restriction?</p>
                  <ul className="text-sm text-gray-600 dark:text-[#B0B7BE] space-y-1">
                    <li>• Groups are college-specific for privacy</li>
                    <li>• Ensures relevant discussions for your college</li>
                    <li>• Maintains community authenticity</li>
                  </ul>
                </div>
                <button 
                  onClick={() => setShowCollegeRestriction(false)}
                  className="w-full py-3 rounded-2xl bg-gray-900 hover:bg-black text-white text-sm font-bold transition-all active:scale-95 shadow-sm"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )

  return (
    <GroupsProvider>
      <div className="flex h-screen bg-[#efeae2] dark:bg-[#1D2226] text-gray-900 dark:text-white overflow-hidden">
        {/* Desktop sidebar */}
        <div className="w-[350px] flex-shrink-0 border-r border-gray-200 dark:border-[#38434F] hidden lg:block">
          <GroupsSidebar currentGroupSlug={groupSlug} />
        </div>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {showMobileSidebar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 lg:hidden"
            >
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileSidebar(false)} />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute left-0 top-0 bottom-0 w-[300px] bg-white dark:bg-[#283036] shadow-xl"
              >
                <GroupsSidebar currentGroupSlug={groupSlug} onClose={() => setShowMobileSidebar(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right chat panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {chatContent}
        </div>
      </div>
    </GroupsProvider>
  )
}
