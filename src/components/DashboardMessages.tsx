'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import ChatWindow from '@/components/ChatWindow'
import { MessageSquare, Search, User as UserIcon, Loader2, ArrowLeft, Plus, X, Building2, ShieldCheck } from 'lucide-react'

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

export default function DashboardMessages({ currentUserId, role }: { currentUserId: string, role: 'senior' | 'junior' }) {
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

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/list')
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
    if (currentUserId) {
      fetchConversations()
    }
  }, [currentUserId, fetchConversations])

  // Handle auto-starting chat from URL parameter ?messageUser=ID
  useEffect(() => {
    if (!currentUserId || conversations.length === 0 && loading) return

    const params = new URLSearchParams(window.location.search)
    const targetUserId = params.get('messageUser')
    
    if (targetUserId) {
      // Check if we already have a conversation with this user
      const existing = conversations.find(c => c.otherUserId === targetUserId)
      if (existing) {
        setSelectedChat(existing)
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname)
      } else {
        // Fetch user details to start new chat
        const fetchNewUser = async () => {
          try {
            const res = await fetch(`/api/messages/search-users?userId=${targetUserId}`)
            const data = await res.json()
            if (data.users && data.users[0]) {
              startNewChat(data.users[0])
              // Clean URL
              window.history.replaceState({}, '', window.location.pathname)
            }
          } catch (err) {
            console.error('Failed to auto-start chat:', err)
          }
        }
        fetchNewUser()
      }
    }
  }, [currentUserId, conversations, loading])

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
  const startNewChat = (user: SearchUser) => {
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-purple-600" size={24} />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-200px)] gap-6 antialiased">
      {/* Sidebar: Conversation List */}
      <div className={`
        ${selectedChat ? 'hidden lg:flex' : 'flex'}
        w-full lg:w-80 flex-col bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden
      `}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-black flex items-center gap-2">
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

          {/* New Message Search */}
          {showNewMessage ? (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                Search {role === 'junior' ? 'Seniors' : 'Users'} to message
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-purple-600 transition-colors"
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
                <div className="p-6 text-center text-gray-400">
                  <p className="text-xs">Type at least 2 characters to search</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  <p className="text-xs">No users found for &quot;{userSearchQuery}&quot;</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => startNewChat(user)}
                      className="p-4 cursor-pointer hover:bg-purple-50 transition-colors flex gap-3"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                        user.avatar_url ? 'bg-transparent shadow-sm' : 'bg-red-500 text-white'
                      }`}>
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-black">{user.full_name?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-gray-900 truncate">{user.full_name}</h3>
                          {user.is_verified && <ShieldCheck size={14} className="text-blue-500 flex-shrink-0" />}
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">
                          {user.role === 'senior' && user.company
                            ? `${user.designation || ''} @ ${user.company}`
                            : user.unique_id
                          }
                        </p>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg self-center flex-shrink-0 ${
                        user.role === 'senior'
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
                <div className="p-8 text-center text-gray-400">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare size={24} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-medium">No conversations yet</p>
                  <p className="text-xs text-gray-400 mt-1 mb-4">
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
                <div className="divide-y divide-gray-50">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedChat(conv)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors flex gap-3 relative ${selectedChat?.id === conv.id ? 'bg-purple-50/50' : ''}`}
                    >
                      {conv.unread && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600 rounded-r" />
                      )}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                        conv.otherUser.avatar_url ? 'bg-transparent shadow-sm' : 'bg-red-500 text-white'
                      }`}>
                        {conv.otherUser.avatar_url ? (
                          <img src={conv.otherUser.avatar_url} alt={conv.otherUser.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-black">{conv.otherUser.full_name?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className={`text-sm truncate ${conv.unread ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>
                            {conv.otherUser.full_name}
                          </h3>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            {formatTime(conv.timestamp)}
                          </span>
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${conv.unread ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>
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
      <div className={`flex-1 h-full ${!selectedChat ? 'hidden lg:flex' : 'flex'}`}>
        {selectedChat ? (
          <div className="flex flex-col w-full h-full">
            <button
              onClick={() => setSelectedChat(null)}
              className="lg:hidden flex items-center gap-2 text-xs font-bold text-gray-500 mb-4 bg-white p-2 rounded-xl shadow-sm border border-gray-100 w-fit"
            >
              <ArrowLeft size={14} /> Back to List
            </button>
            <ChatWindow
              currentUserId={currentUserId}
              otherUserId={selectedChat.otherUserId}
              otherUserName={selectedChat.otherUser.full_name}
              otherUserAvatar={selectedChat.otherUser.avatar_url}
              onMessageSent={handleMessageSent}
            />
          </div>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl shadow-sm text-center p-8">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={40} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">Start a Conversation</h3>
            <p className="text-gray-500 max-w-xs mx-auto mb-6">
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
