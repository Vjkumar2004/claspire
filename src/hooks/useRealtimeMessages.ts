'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  conversation_id: string
  is_read: boolean
}

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

export function useRealtimeMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const channelsRef = useRef<Map<string, any>>(new Map())

  // Initialize WebSocket connection and subscribe to conversations
  const initializeRealtime = (userId: string) => {
    // Subscribe to all conversations for this user
    const channel = supabase
      .channel(`conversations-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${userId}`
        },
        (payload) => {
          handleRealtimeMessage(payload, userId)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        }
      })

    channelsRef.current.set(`user-${userId}`, channel)

    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel)
      })
      channelsRef.current.clear()
      setIsConnected(false)
    }
  }

  // Handle realtime message updates
  const handleRealtimeMessage = (payload: any, userId: string) => {
    const { eventType, new: newMessage, old: oldMessage } = payload

    if (eventType === 'INSERT') {
      // New message received - update conversations list
      setConversations(prev => {
        const updated = [...prev]
        const conversationIndex = updated.findIndex(
          conv => conv.id === newMessage.conversation_id
        )

        if (conversationIndex >= 0) {
          // Update existing conversation
          updated[conversationIndex] = {
            ...updated[conversationIndex],
            lastMessage: newMessage.content,
            timestamp: newMessage.created_at,
            unread: newMessage.receiver_id === userId && !newMessage.is_read
          }
          // Move to top
          const [updatedConv] = updated.splice(conversationIndex, 1)
          updated.unshift(updatedConv)
        } else {
          // New conversation - fetch other user info and add
          fetchConversationDetails(newMessage, userId).then(newConv => {
            if (newConv) {
              setConversations(prev => [newConv, ...prev])
            }
          })
        }

        return updated
      })
    } else if (eventType === 'UPDATE') {
      // Message read status updated
      if (oldMessage?.is_read !== newMessage?.is_read) {
        setConversations(prev => 
          prev.map(conv => 
            conv.id === newMessage.conversation_id 
              ? { ...conv, unread: !newMessage.is_read && newMessage.receiver_id === userId }
              : conv
          )
        )
      }
    }
  }

  // Fetch conversation details for new conversations
  const fetchConversationDetails = async (message: Message, userId: string) => {
    try {
      const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id
      
      // Fetch other user info
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, avatar_url, unique_id')
        .eq('id', otherUserId)
        .single()

      if (!userData) return null

      return {
        id: message.conversation_id,
        lastMessage: message.content,
        timestamp: message.created_at,
        otherUser: {
          full_name: userData.full_name,
          avatar_url: userData.avatar_url
        },
        otherUserId,
        otherUserUniqueId: userData.unique_id,
        unread: message.receiver_id === userId && !message.is_read
      }
    } catch (error) {
      console.error('Error fetching conversation details:', error)
      return null
    }
  }

  // Fetch initial conversations
  const fetchConversations = async (userId: string) => {
    try {
      const res = await fetch('/api/messages/list')
      const data = await res.json()
      
      if (data.conversations) {
        // Transform conversations to include unique_id
        const transformedConversations = await Promise.all(
          data.conversations.map(async (conv: any) => {
            // Get other user's unique_id
            const { data: otherUser } = await supabase
              .from('users')
              .select('unique_id')
              .eq('id', conv.otherUserId)
              .single()

            return {
              ...conv,
              otherUserUniqueId: otherUser?.unique_id
            }
          })
        )
        setConversations(transformedConversations)
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    }
  }

  // Mark messages as read
  const markAsRead = async (conversationId: string, userId: string) => {
    try {
      const res = await fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
      })

      if (res.ok) {
        // Update local state
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, unread: false }
              : conv
          )
        )
      }
    } catch (error) {
      console.error('Failed to mark messages as read:', error)
    }
  }

  return {
    conversations,
    isConnected,
    initializeRealtime,
    fetchConversations,
    markAsRead,
    setConversations
  }
}
