'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, User as UserIcon, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  conversation_id: string
}

interface ChatWindowProps {
  currentUserId: string
  otherUserId: string
  otherUserName: string
  otherUserAvatar?: string
  onMessageSent?: () => void
}

export default function ChatWindow({ 
  currentUserId, 
  otherUserId, 
  otherUserName, 
  otherUserAvatar,
  onMessageSent 
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Message[]>([])
  const channelRef = useRef<any>(null)

  // Keep ref in sync
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  const conversationId = [currentUserId, otherUserId].sort().join('_')

  // Fetch history + subscribe to realtime
  useEffect(() => {
    let channel: any = null

    const init = async () => {
      setLoading(true)
      setMessages([])

      // 1. Fetch history
      try {
        const res = await fetch(`/api/messages/history?userId=${otherUserId}`)
        const data = await res.json()
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages)
        }
      } catch (err) {
        console.error('Failed to fetch chat history:', err)
      } finally {
        setLoading(false)
      }

      // 2. Subscribe to realtime - listen for both sender and receiver
      channel = supabase
        .channel(`dm-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            const newMsg = payload.new as Message
            
            // Check if message belongs to this conversation
            if ((newMsg.sender_id === currentUserId && newMsg.receiver_id === otherUserId) ||
                (newMsg.sender_id === otherUserId && newMsg.receiver_id === currentUserId)) {
              
              setMessages(prev => {
                const exists = prev.some(m => m.id === newMsg.id)
                if (exists) {
                  // Replace the optimistic version with the real one
                  return prev.map(m => m.id === newMsg.id ? newMsg : m)
                }
                // Add new message if it doesn't exist
                return [...prev, newMsg]
              })
            }
          }
        )
        .subscribe()

      channelRef.current = channel
    }

    init()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [otherUserId, currentUserId, conversationId])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const sendMessage = async () => {
    const content = newMessage.trim()
    if (!content || sending) return

    setSending(true)
    setNewMessage('')

    // Optimistic update: show message immediately
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}-${Math.random()}`,
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content,
      created_at: new Date().toISOString(),
      conversation_id: conversationId
    }
    
    setMessages(prev => [...prev, optimisticMsg])

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: otherUserId,
          content
        })
      })

      if (res.ok) {
        const data = await res.json()
        
        // Replace the optimistic message with the real one from DB
        if (data.message) {
          setMessages(prev =>
            prev.map(m => m.id === optimisticMsg.id ? data.message : m)
          )
        }
        // Notify parent to refresh conversation list
        onMessageSent?.()
      } else {
        const error = await res.json()
        console.error('Send message error:', error)
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
        alert(error.error || 'Failed to send message')
      }
    } catch (err) {
      console.error('Send error:', err)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      alert('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${otherUserAvatar ? 'bg-transparent shadow-sm' : 'bg-red-500 text-white'}`}>
            {otherUserAvatar ? (
              <img 
                src={otherUserAvatar} 
                alt={otherUserName} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.classList.add('bg-red-500', 'text-white');
                  // We can't easily inject the letter here via DOM, so we just rely on state if we had it.
                  // But for now, just fallback to icon if img fails.
                }}
              />
            ) : (
              <span className="text-sm font-black">{otherUserName?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{otherUserName}</h3>
            <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4 space-y-3 custom-scrollbar bg-gray-50/30"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-purple-600" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Send size={24} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Start a conversation with {otherUserName}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId
            const isOptimistic = msg.id.startsWith('temp-')
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  isMine
                    ? `bg-purple-600 text-white rounded-br-none ${isOptimistic ? 'opacity-70' : ''}`
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-sm'
                }`}>
                  {msg.content}
                  <p className={`text-[9px] mt-1 ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                    {isOptimistic ? 'Sending...' : new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-600 transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-all disabled:opacity-50 active:scale-95 flex-shrink-0"
          >
            {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  )
}
