'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ChatWindow from '@/components/ChatWindow'
import { useNotificationPrompt } from '@/contexts/NotificationPromptContext'
import { MessageSquare, Search, Loader2, ArrowLeft, Plus, X, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Conversation {
  id: string
  lastMessage: string
  timestamp: string
  otherUser: {
    full_name: string
    avatar_url?: string
  }
  otherUserId: string
  unread: boolean
}

interface SearchUser {
  id: string
  full_name: string
  avatar_url?: string
  role: string
  unique_id: string
  company?: string
  designation?: string
  is_verified?: boolean
}

interface DashboardMessagesProps {
  currentUserId: string
  role: 'junior' | 'senior'
  initialUserId?: string
  fullscreen?: boolean
  backHref?: string
}

export default function DashboardMessages({
  currentUserId,
  role,
  initialUserId,
  fullscreen = false,
  backHref = '/dashboard/senior',
}: DashboardMessagesProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // New message state
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<any>(null)
  const router = useRouter()
  const { trigger: triggerNotifPrompt } = useNotificationPrompt()
  const notifTriggered = useRef(false)

  useEffect(() => {
    if (!notifTriggered.current) {
      notifTriggered.current = true
      triggerNotifPrompt()
    }
  }, [triggerNotifPrompt])

  const goBackToDashboard = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(backHref)
    }
  }

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/list', { cache: 'no-store' })
      const data = await res.json()
      if (data.conversations && Array.isArray(data.conversations)) {
        setConversations(data.conversations)
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!currentUserId) return;

    fetchConversations();

    const channel = supabase
      .channel(`dashboard-messages-${currentUserId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'direct_messages', 
        filter: `receiver_id=eq.${currentUserId}` 
      }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'direct_messages', 
        filter: `sender_id=eq.${currentUserId}` 
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchConversations])

  // Create conversation with initial user if provided
  const createConversationWithUser = useCallback(async (userId: string) => {
    if (!currentUserId || conversations.length === 0 && loading) return

    // Check if we already have a conversation with this user
    const existing = conversations.find(c => c.otherUserId === userId)
    if (existing) {
      setSelectedChat(existing)
      return
    }

    // Detect if UUID or unique_id using regex
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)

    try {
      // First check if we can message this user
      const canMessageRes = await fetch(`/api/message-requests/can-message?other_user_id=${userId}`)
      const canMessageData = await canMessageRes.json()

      if (!canMessageData.canMessage) {
        alert('You need an accepted message request to chat with this user.')
        return
      }

      // Fetch user details
      const searchParam = isUUID ? `userId=${userId}` : `uniqueId=${userId}`
      const res = await fetch(`/api/messages/search-users?${searchParam}`)
      const data = await res.json()

      if (data.users && data.users[0]) {
        startNewChat(data.users[0])
      }
    } catch (err) {
      console.error('Failed to create conversation:', err)
      alert('Failed to start chat. Please try again.')
    }
  }, [currentUserId, conversations, loading])

  // Handle initialUserId prop
  useEffect(() => {
    if (initialUserId) {
      createConversationWithUser(initialUserId)
    }
  }, [initialUserId, createConversationWithUser])

  // Handle auto-starting chat from URL parameter ?messageUser=ID (legacy support)
  useEffect(() => {
    if (!currentUserId || conversations.length === 0 && loading) return

    const params = new URLSearchParams(window.location.search)
    const targetUserId = params.get('messageUser')

    if (targetUserId) {
      createConversationWithUser(targetUserId)
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [currentUserId, conversations, loading, createConversationWithUser])

  // Debounced user search
  useEffect(() => {
    if (userSearchQuery.length < 2) {
      setSearchResults([])
      return
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        // If junior, search for seniors. If senior, search all.
        const roleFilter = role === 'junior' ? '&role=senior' : ''
        const res = await fetch(`/api/messages/search-users?q=${encodeURIComponent(userSearchQuery)}${roleFilter}`)
        const data = await res.json()
        if (data.users) {
          setSearchResults(data.users)
        }
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [userSearchQuery, role])

  // When user selects someone from search to chat with
  const startNewChat = async (user: SearchUser) => {
    // Check if users can message each other
    try {
      const res = await fetch(`/api/message-requests/can-message?other_user_id=${user.id}`)
      const data = await res.json()

      if (!data.canMessage) {
        alert('You need an accepted message request to chat with this user.')
        return
      }
    } catch (error) {
      console.error('Failed to check messaging permission:', error)
      alert('Failed to check messaging permission. Please try again.')
      return
    }

    const newConv: Conversation = {
      id: `new-${user.id}`,
      lastMessage: '',
      timestamp: new Date().toISOString(),
      otherUser: {
        full_name: user.full_name,
        avatar_url: user.avatar_url
      },
      otherUserId: user.id,
      unread: false
    }
    setSelectedChat(newConv)
    setShowNewMessage(false)
    setUserSearchQuery('')
    setSearchResults([])
  }

  const handleMessageSent = useCallback(() => {
    fetchConversations()
  }, [fetchConversations])

  const filteredConversations = conversations.filter(c =>
    c.otherUser.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!currentUserId) {
    return (
      <div className={`flex items-center justify-center ${fullscreen ? 'fixed inset-0 bg-white dark:bg-[#283036]' : 'h-64'}`}>
        <Loader2 className="animate-spin text-purple-600" size={24} />
      </div>
    )
  }

  const rootClass = fullscreen
    ? 'fixed inset-0 z-[1000] flex flex-row w-full h-dvh bg-white dark:bg-[#283036]'
    : 'flex flex-row w-full h-[calc(100dvh-140px)] md:h-[600px] gap-0 md:gap-6 antialiased'

  const listClass = fullscreen
    ? `${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-[360px] lg:w-[400px] flex-shrink-0 flex-col bg-white dark:bg-[#283036] border-r border-gray-100 dark:border-[#38434F] overflow-hidden`
    : `${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-shrink-0 flex-col bg-white dark:bg-[#283036] border border-gray-100 dark:border-[#38434F] rounded-3xl shadow-sm dark:shadow-[#1D2226]/50 overflow-hidden`

  const chatPanelClass = fullscreen
    ? `flex-1 min-w-0 h-full flex-col bg-white dark:bg-[#283036] ${!selectedChat ? 'hidden md:flex' : 'flex'}`
    : `flex-1 min-w-0 h-full flex-col ${!selectedChat ? 'hidden md:flex' : 'flex'}`

  const chatHeaderClass = fullscreen
    ? 'flex flex-shrink-0 items-center gap-3 px-3 py-3 bg-[#f0f2f5] dark:bg-[#1D2226] border-b border-gray-200 dark:border-[#38434F]'
    : 'md:hidden flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#283036] border-b border-gray-100 dark:border-[#38434F] shadow-sm dark:shadow-[#1D2226]/50'

  return (
    <div className={rootClass}>
      {/* Sidebar: Conversation List */}
      <div className={listClass}>
        {fullscreen && (
          <div className="flex-shrink-0 flex items-center gap-3 px-3 py-3 bg-[#f0f2f5] dark:bg-[#1D2226] border-b border-gray-200 dark:border-[#38434F]">
            <button
              onClick={goBackToDashboard}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-[#B0B7BE] transition-colors flex-shrink-0"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="flex-1 text-base font-bold text-gray-900 dark:text-white">
              {role === 'senior' ? 'Messages' : 'Mentors'}
            </h2>
            <button
              onClick={() => setShowNewMessage(!showNewMessage)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-[#B0B7BE] transition-colors"
              title="New Message"
            >
              {showNewMessage ? <X size={20} /> : <Plus size={20} />}
            </button>
          </div>
        )}

        <div className={`${fullscreen ? 'p-3' : 'p-4'} border-b border-gray-100 dark:border-[#38434F]`}>
          {!fullscreen && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-black dark:text-white flex items-center gap-2">
                <MessageSquare size={20} className="text-purple-600" />
                {role === 'senior' ? 'Messages' : 'Mentors'}
              </h2>
              <button
                onClick={() => setShowNewMessage(!showNewMessage)}
                className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors"
                title="New Message"
              >
                {showNewMessage ? <X size={16} /> : <Plus size={16} />}
              </button>
            </div>
          )}

          {/* New Message Search */}
          {showNewMessage ? (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 dark:text-[#B0B7BE] uppercase tracking-wider">
                Search {role === 'junior' ? 'Seniors' : 'Users'} to message
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#B0B7BE]" size={16} />
                <input
                  type="text"
                  placeholder={`Type a name...`}
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-purple-50 border border-purple-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-purple-600 transition-colors"
                />
              </div>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#B0B7BE]" size={16} />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#1D2226] border border-gray-100 dark:border-[#38434F] rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-purple-600 transition-colors"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Show search results when searching for new message */}
          {showNewMessage ? (
            <div>
              {searching ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="animate-spin text-purple-600" size={20} />
                </div>
              ) : userSearchQuery.length < 2 ? (
                <div className="p-6 text-center text-gray-400 dark:text-[#B0B7BE]">
                  <p className="text-xs">Type at least 2 characters to search</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center text-gray-400 dark:text-[#B0B7BE]">
                  <p className="text-xs">No users found for &quot;{userSearchQuery}&quot;</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-[#38434F]">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => startNewChat(user)}
                      className="p-4 cursor-pointer hover:bg-purple-50 transition-colors flex gap-3"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${user.avatar_url ? 'bg-transparent shadow-sm dark:shadow-[#1D2226]/50' : 'bg-red-500 text-white'
                        }`}>
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-black">{user.full_name?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.full_name}</h3>
                          {user.is_verified && <ShieldCheck size={14} className="text-blue-500 flex-shrink-0" />}
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-[#B0B7BE] font-medium truncate mt-0.5">
                          {user.role === 'senior' && user.company
                            ? `${user.designation || ''} @ ${user.company}`
                            : user.unique_id
                          }
                        </p>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg self-center flex-shrink-0 ${user.role === 'senior'
                          ? 'bg-orange-50 text-orange-600'
                          : 'bg-blue-50 text-blue-600'
                        }`}>
                        {user.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Show existing conversations */
            <>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="animate-spin text-purple-600" size={20} />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-400 dark:text-[#B0B7BE]">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-[#1D2226] rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare size={24} className="text-gray-300 dark:text-[#B0B7BE]" />
                  </div>
                  <p className="text-sm font-medium">No conversations yet</p>
                  <p className="text-xs text-gray-400 dark:text-[#B0B7BE] mt-1 mb-4">
                    {role === 'senior'
                      ? 'Students will appear here when they message you'
                      : 'Start a conversation with a senior mentor'}
                  </p>
                  <button
                    onClick={() => setShowNewMessage(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition-colors"
                  >
                    <Plus size={14} /> New Message
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-[#38434F]">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedChat(conv)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 dark:bg-[#1D2226] dark:hover:bg-[#1D2226] transition-colors flex gap-3 relative ${selectedChat?.id === conv.id ? 'bg-purple-50/50' : ''}`}
                    >
                      {conv.unread && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600 rounded-r" />
                      )}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${conv.otherUser.avatar_url ? 'bg-transparent shadow-sm dark:shadow-[#1D2226]/50' : 'bg-red-500 text-white'
                        }`}>
                        {conv.otherUser.avatar_url ? (
                          <img src={conv.otherUser.avatar_url} alt={conv.otherUser.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-black">{conv.otherUser.full_name?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className={`text-sm truncate ${conv.unread ? 'font-black text-gray-900 dark:text-white' : 'font-bold text-gray-700 dark:text-[#B0B7BE]'}`}>
                            {conv.otherUser.full_name}
                          </h3>
                          <span className="text-[10px] text-gray-400 dark:text-[#B0B7BE] whitespace-nowrap">
                            {formatTime(conv.timestamp)}
                          </span>
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${conv.unread ? 'text-gray-800 dark:text-[#B0B7BE] font-semibold' : 'text-gray-500 dark:text-[#B0B7BE]'}`}>
                          {conv.lastMessage}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main: Chat Window */}
      <div className={chatPanelClass}>
        {selectedChat ? (
          <div className="flex flex-col w-full h-full">
            {/* Chat header — always visible in fullscreen (WhatsApp style) */}
            <div className={chatHeaderClass}>
              <button
                onClick={() => setSelectedChat(null)}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-[#B0B7BE] transition-colors flex-shrink-0"
                aria-label="Back to conversations"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm overflow-hidden flex-shrink-0">
                {selectedChat.otherUser.avatar_url ? (
                  <img
                    src={selectedChat.otherUser.avatar_url}
                    alt={selectedChat.otherUser.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  selectedChat.otherUser.full_name?.[0]?.toUpperCase()
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">
                  {selectedChat.otherUser.full_name}
                </p>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <ChatWindow
                currentUserId={currentUserId}
                otherUserId={selectedChat.otherUserId}
                otherUserName={selectedChat.otherUser.full_name}
                otherUserAvatar={selectedChat.otherUser.avatar_url}
                onMessageSent={handleMessageSent}
                hideHeader={fullscreen}
                flat={fullscreen}
              />
            </div>
          </div>
        ) : (
          <div className={`h-full w-full flex flex-col items-center justify-center text-center p-8 ${fullscreen ? 'bg-[#efeae2] dark:bg-[#1D2226]' : 'bg-white dark:bg-[#283036] border border-gray-100 dark:border-[#38434F] rounded-3xl shadow-sm dark:shadow-[#1D2226]/50'}`}>
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={40} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-black dark:text-white mb-2">Start a Conversation</h3>
            <p className="text-gray-500 dark:text-[#B0B7BE] max-w-xs mx-auto mb-6">
              Click the <strong className="text-purple-600">+</strong> button to search for {role === 'senior' ? 'students' : 'seniors'} and start messaging.
            </p>
            <button
              onClick={() => setShowNewMessage(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white text-sm font-bold rounded-2xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-100"
            >
              <Plus size={18} /> New Message
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString()
}
