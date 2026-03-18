'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSearchParams } from 'next/navigation'
import ChatWindow from '@/components/ChatWindow'
import { MessageSquare, Search, User as UserIcon, Loader2, ArrowLeft, Wifi, WifiOff } from 'lucide-react'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'

interface Conversation {
  id: string
  lastMessage: string
  timestamp: string
  otherUser: {
    full_name: string
    avatar_url?: string
  }
  otherUserId: string
  otherUserUniqueId?: string
  unread: boolean
}

export default function JuniorMessagesPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const targetUserUniqueId = searchParams.get('user')
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Use real-time messaging hook
  const {
    conversations,
    isConnected,
    initializeRealtime,
    fetchConversations,
    markAsRead,
    setConversations
  } = useRealtimeMessages()

  useEffect(() => {
    if (user?.id) {
      // Initialize real-time connection
      const cleanup = initializeRealtime(user.id)
      
      // Fetch initial conversations
      fetchConversations().finally(() => {
        setLoading(false)
      })

      return cleanup
    } else {
      setLoading(false)
    }
  }, [user?.id])

  // Auto-select conversation when target user is specified
  useEffect(() => {
    if (targetUserUniqueId && conversations.length > 0 && !selectedChat) {
      const targetConversation = conversations.find(conv => conv.otherUserUniqueId === targetUserUniqueId)
      if (targetConversation) {
        setSelectedChat(targetConversation)
        // Mark messages as read when opening conversation
        markAsRead(targetConversation.id, user?.id || '')
      } else {
        // If no existing conversation, create one with the target user
        createConversationWithUser(targetUserUniqueId)
      }
    }
  }, [targetUserUniqueId, conversations, selectedChat, user])

  const createConversationWithUser = async (userUniqueId: string) => {
    try {
      // Get user info from unique_id
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: targetUser, error } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, unique_id')
        .eq('unique_id', userUniqueId)
        .single()

      if (error || !targetUser) {
        console.error('User not found:', userUniqueId)
        return
      }

      // Create a temporary conversation object
      const newConversation: Conversation = {
        id: `new-${targetUser.id}`,
        lastMessage: 'Start a conversation...',
        timestamp: new Date().toISOString(),
        otherUser: {
          full_name: targetUser.full_name,
          avatar_url: targetUser.avatar_url
        },
        otherUserId: targetUser.id,
        otherUserUniqueId: targetUser.unique_id,
        unread: false
      }

      setSelectedChat(newConversation)
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  const handleMessageSent = () => {
    // Real-time hook will automatically update conversations
    console.log('Message sent - real-time update will handle conversation list')
  }

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedChat(conversation)
    // Mark messages as read when opening conversation
    if (user) {
      markAsRead(conversation.id, user.id)
    }
  }

  const filteredConversations = conversations.filter(c => 
    c.otherUser.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex w-full h-screen gap-0 md:gap-6 antialiased">
      {/* Sidebar: Conversation List */}
      <div className={`w-full md:w-80 flex flex-col bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-black flex items-center gap-2">
              <MessageSquare size={20} className="text-purple-600" />
              My Mentors
            </h2>
            <div className="flex items-center gap-1">
              {isConnected ? (
                <>
                  <Wifi size={14} className="text-green-500" />
                  <span className="text-xs text-green-500">Live</span>
                </>
              ) : (
                <>
                  <WifiOff size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-400">Offline</span>
                </>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search mentors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-purple-600 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin text-purple-600" size={20} />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-sm">No active chats</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleConversationClick(conv)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors flex gap-3 relative ${selectedChat?.id === conv.id ? 'bg-purple-50/50' : ''}`}
                >
                  {conv.unread && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600" />
                  )}
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                    <UserIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{conv.otherUser.full_name}</h3>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {new Date(conv.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main: Chat Window */}
      <div className={`flex-1 h-full ${!selectedChat ? 'hidden md:block' : 'block'}`}>
        {selectedChat && user ? (
          <div className="flex flex-col h-full bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
            {/* Mobile Header with Back Button */}
            <div className="md:hidden flex items-center p-4 border-b border-gray-100 bg-white">
              <button 
                onClick={() => setSelectedChat(null)}
                className="p-2 -ml-2 text-gray-500 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="ml-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <UserIcon size={16} />
                </div>
                <h3 className="text-sm font-bold text-gray-900">{selectedChat.otherUser.full_name}</h3>
              </div>
            </div>
            
            <div className="flex-1">
              <ChatWindow
                currentUserId={user.id}
                otherUserId={selectedChat.otherUserId}
                otherUserName={selectedChat.otherUser.full_name}
                otherUserAvatar={selectedChat.otherUser.avatar_url}
                onMessageSent={handleMessageSent}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl shadow-sm text-center p-8">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={40} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">Select a Mentor</h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              Choose a verified senior from the list to continue your guidance. 
              Mentorship is the shortcut to success.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
