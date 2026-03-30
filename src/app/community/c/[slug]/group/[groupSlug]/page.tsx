'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Users, Lock, Globe, Clock, Send, 
  Crown, MoreHorizontal, Sparkles, User, Ban
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

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchGroupData()
    fetchCurrentUser()
  }, [slug, groupSlug])

  // Poll for new messages every 3 seconds
useEffect(() => {
  if (!groupData?.isMember || !groupData?.group?.id) return

  const pollMessages = async () => {
    const res = await fetch(`/api/groups/${groupSlug}`)
    if (res.ok) {
      const data = await res.json()
      const newMessages = data.messages || []
      setMessages(newMessages)
    }
  }

  const interval = setInterval(pollMessages, 3000)
  return () => clearInterval(interval)
}, [groupData?.isMember, groupData?.group?.id, groupSlug])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchGroupData = async () => {
    try {
      const res = await fetch(`/api/groups/${groupSlug}`)
      if (res.ok) {
        const data = await res.json()
        
        // Check if user has pending request
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
  setNewMessage('')
  setSending(true)

  try {
    const res = await fetch(`/api/groups/${groupSlug}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, sender_id: currentUser?.id })
    })

    if (!res.ok) {
      const error = await res.json()
      alert(error.error || 'Failed to send message')
      setNewMessage(content) // Restore message on failure
    }
  } catch (error) {
    alert('Something went wrong')
    setNewMessage(content)
  } finally {
    setSending(false)
  }
}

  const handleJoin = async () => {
    if (joining) return
    setTermsAccepted(false) // Reset checkbox when modal opens
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
          // Show waiting state
          setGroupData(prev => prev ? { ...prev, isMember: false, canMessage: false, isAdmin: false } : prev)
          alert('✅ Join request sent! Waiting for admin approval.')
        }
      } else {
        if (data.collegeRestricted) {
          // Show college restriction modal
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!groupData) return null

  const { group, isMember, isAdmin, canMessage } = groupData

  return (
  <div className="flex flex-col h-screen bg-[#0A0A0F] text-white overflow-hidden">
    
    {/* Header */}
    <div className="flex-shrink-0 bg-[#111118] border-b border-white/5 px-4 py-3 flex items-center justify-between z-50">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(`/community/c/${slug}`)} className="p-1.5 hover:bg-white/10 rounded-xl transition-colors">
          <ArrowLeft size={20} className="text-white/70" />
        </button>
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center font-black text-sm">
          {group.name[0]}
        </div>
        <div>
          <h1 className="font-bold text-sm text-white leading-tight">{group.name}</h1>
          <p className="text-xs text-white/40">{group.member_count} members • {group.is_private ? 'Private' : 'Public'}</p>
        </div>
      </div>
      <button onClick={() => setShowMembers(!showMembers)} className="p-2 hover:bg-white/10 rounded-xl transition-colors relative">
        <Users size={18} className="text-white/60" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
          {group.member_count}
        </span>
      </button>
    </div>

    {/* Members Sidebar */}
    <AnimatePresence>
      {showMembers && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-72 bg-[#111118] border-l border-white/5 z-50 shadow-2xl"
        >
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-bold text-white">Members</h2>
            <button onClick={() => setShowMembers(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft size={16} className="text-white/60" />
            </button>
          </div>
          <div className="overflow-y-auto h-full pb-20">
            {groupData.members.map((member) => (
              <div key={member.id} className="px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0 ${
                  member.avatar_url ? '' : member.role === 'senior' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-violet-500 to-purple-700'
                }`}>
                  {member.avatar_url ? <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" /> : member.full_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-white truncate">{member.full_name}</span>
                    {member.membership_role === 'admin' && (
                      <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">Admin</span>
                    )}
                  </div>
                  <p className="text-xs text-white/30">Joined {timeAgo(member.joined_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Messages Area */}
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" style={{ scrollbarWidth: 'none' }}>
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
          <Sparkles size={32} className="text-violet-400" />
          <p className="text-sm text-white/60 font-medium">{isMember ? 'Be the first to say something! 👋' : 'Join to start chatting'}</p>
        </div>
      ) : (
        messages.map((message, index) => {
          const isOwn = message.sender?.id === currentUser?.id
          const prevMessage = messages[index - 1]
          const isSameSender = prevMessage?.sender?.id === message.sender?.id
          const showAvatar = !isOwn && !isSameSender

          return (
            <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isSameSender ? 'mt-0.5' : 'mt-3'}`}>
              <div className={`flex gap-2 max-w-[75%] sm:max-w-[60%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                {!isOwn && (
                  <div className="w-7 h-7 flex-shrink-0 mt-auto">
                    {showAvatar ? (
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-white font-bold text-xs overflow-hidden ${
                        message.sender?.avatar_url ? '' : message.sender?.role === 'senior' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-violet-500 to-purple-700'
                      }`}>
                        {message.sender?.avatar_url ? <img src={message.sender.avatar_url} className="w-full h-full object-cover" /> : message.sender?.full_name?.[0]}
                      </div>
                    ) : <div className="w-7 h-7" />}
                  </div>
                )}

                <div className="flex flex-col gap-0.5">
                  {!isOwn && showAvatar && (
                    <span className="text-[11px] font-semibold text-violet-400 px-3">{message.sender?.full_name}</span>
                  )}
                  <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                    isOwn
                      ? 'bg-violet-600 text-white rounded-br-md'
                      : 'bg-[#1E1E2E] text-white/90 rounded-bl-md border border-white/5'
                  }`}>
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                  <span className={`text-[10px] text-white/25 px-2 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {timeAgo(message.created_at)}
                  </span>
                </div>
              </div>
            </div>
          )
        })
      )}
      <div ref={messagesEndRef} />
    </div>

    {/* Input - Sticky Bottom */}
    <div className="flex-shrink-0 bg-[#111118] border-t border-white/5 px-4 py-3 pb-safe">
      {!isMember ? (
        <div className="flex justify-center">
          {groupData?.requestPending ? (
            <div className="flex items-center gap-2 text-sm text-white/50 bg-white/5 px-4 py-2.5 rounded-2xl">
              <Clock size={14} />
              Waiting for admin approval...
            </div>
          ) : (
            <button onClick={handleJoin} disabled={joining} className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-2xl font-bold text-sm transition-colors disabled:opacity-50">
              {joining ? 'Joining...' : group?.is_private ? '🔒 Request to Join' : '✦ Join to Participate'}
            </button>
          )}
        </div>
      ) : isBlocked ? (
        <div className="flex items-center justify-center gap-3 py-2">
          <Ban size={16} className="text-red-400" />
          <p className="text-center text-sm text-red-400 font-medium">You are blocked from sending messages in this group</p>
          <Ban size={16} className="text-red-400" />
        </div>
      ) : canMessage ? (
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message..."
            className="flex-1 bg-[#1E1E2E] border border-white/10 text-white placeholder-white/25 px-4 py-2.5 rounded-2xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 bg-violet-600 hover:bg-violet-700 disabled:opacity-30 text-white rounded-2xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
      ) : (
        <p className="text-center text-xs text-white/30">You cannot send messages in this group</p>
      )}
    </div>

    {/* Terms Modal */}
    <AnimatePresence>
      {showTermsModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowTermsModal(false)}>
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-[#111118] rounded-3xl w-full max-w-md overflow-hidden border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-violet-600 to-purple-700 p-5">
              <div className="flex items-center gap-3">
                <Users size={22} />
                <div>
                  <h2 className="font-bold text-white">Join {groupData?.group?.name}</h2>
                  <p className="text-xs text-white/60">Read the guidelines before joining</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3 max-h-[50vh] overflow-y-auto">
              {['Be respectful and professional', 'Share relevant content only', 'No spam or self-promotion', 'Protect member privacy', 'Report inappropriate content'].map((rule, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-white/70">
                  <span className="w-5 h-5 bg-violet-500/20 text-violet-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                  {rule}
                </div>
              ))}
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <p className="text-xs text-amber-400">Violations may result in removal from the group.</p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer mt-4">
                <input 
                  type="checkbox" 
                  className="mt-0.5 w-4 h-4 accent-violet-500" 
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <span className="text-sm text-white/60">I agree to follow the group guidelines.</span>
              </label>
            </div>
            <div className="p-4 border-t border-white/5 flex gap-3">
              <button onClick={() => setShowTermsModal(false)} className="flex-1 py-2.5 rounded-2xl border border-white/10 text-white/60 text-sm font-medium hover:bg-white/5 transition-colors">Cancel</button>
              <button 
                id="accept-terms-btn" 
                onClick={handleAcceptTerms} 
                disabled={!termsAccepted} 
                className={`flex-1 py-2.5 rounded-2xl text-white text-sm font-bold transition-colors ${
                  termsAccepted 
                    ? 'bg-violet-600 hover:bg-violet-700' 
                    : 'bg-gray-600 opacity-40 cursor-not-allowed'
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCollegeRestriction(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#111118] rounded-3xl w-full max-w-md overflow-hidden border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Lock size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white">College Restricted</h2>
                  <p className="text-xs text-white/60">This group is not available for you</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                <p className="text-sm text-white/80 text-center">
                  This group is only available for students from the same college. 
                  You can only join groups created within your college.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-white/60">Why this restriction?</p>
                <ul className="text-xs text-white/40 space-y-1">
                  <li>• Groups are college-specific for privacy</li>
                  <li>• Ensures relevant discussions for your college</li>
                  <li>• Maintains community authenticity</li>
                </ul>
              </div>
              <button 
                onClick={() => setShowCollegeRestriction(false)}
                className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)
}
