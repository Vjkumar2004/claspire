'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ChatWindow from '@/components/ChatWindow'
import { MessageSquare, Search, User as UserIcon, Loader2, ArrowLeft } from 'lucide-react'

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

export default function SeniorMessagesPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/messages/list')
      const data = await res.json()
      if (data.conversations) {
        setConversations(data.conversations)
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    } finally {
      setLoading(false)
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
          <h2 className="text-lg font-black text-black mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-purple-600" />
            Messages
          </h2>
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
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin text-purple-600" size={20} />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-gray-500">No conversations found</p>
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
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl shadow-sm text-center p-8">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={40} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">Select a conversation</h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              Choose a student or recruiter from the list to start messaging. 
              Remember, direct guidance build better careers.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
