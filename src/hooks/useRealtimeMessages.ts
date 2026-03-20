'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
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
  const userIdRef = useRef<string>('')

  const fetchConversationDetails = async (message: Message, userId: string) => {
    try {
      const otherUserId = message.sender_id === userId 
        ? message.receiver_id 
        : message.sender_id

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
      } as Conversation
    } catch (error) {
      console.error('Error fetching conversation details:', error)
      return null
    }
  }

  const handleRealtimeMessage = useCallback((payload: any, userId: string) => {
    const { eventType, new: newMessage } = payload

    if (eventType === 'INSERT') {
      setConversations(prev => {
        const existingIndex = prev.findIndex(
          conv => conv.id === newMessage.conversation_id
        )

        if (existingIndex >= 0) {
          // Update existing conversation and move to top
          const updated = [...prev]
          updated[existingIndex] = {
            ...updated[existingIndex],
            lastMessage: newMessage.content,
            timestamp: newMessage.created_at,
            unread: newMessage.receiver_id === userId && !newMessage.is_read
          }
          const [conv] = updated.splice(existingIndex, 1)
          return [conv, ...updated]
        } else {
          // New conversation — fetch details async and add
          fetchConversationDetails(newMessage, userId).then(newConv => {
            if (newConv) {
              setConversations(p => [newConv, ...p])
            }
          })
          return prev
        }
      })
    } else if (eventType === 'UPDATE') {
      setConversations(prev =>
        prev.map(conv =>
          conv.id === newMessage.conversation_id
            ? { 
                ...conv, 
                unread: !newMessage.is_read && newMessage.receiver_id === userId 
              }
            : conv
        )
      )
    }
  }, [])

  // Fetch initial conversations — no userId param needed
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/list')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()

      if (data.conversations) {
        // Get unique_ids for all other users in one query
        const otherUserIds = data.conversations.map((c: any) => c.otherUserId)
        
        const { data: usersData } = await supabase
          .from('users')
          .select('id, unique_id')
          .in('id', otherUserIds)

        const uniqueIdMap = new Map(
          usersData?.map(u => [u.id, u.unique_id]) || []
        )

        const transformed = data.conversations.map((conv: any) => ({
          ...conv,
          otherUserUniqueId: uniqueIdMap.get(conv.otherUserId) || ''
        }))

        setConversations(transformed)
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    }
  }, [])

  const initializeRealtime = useCallback((userId: string) => {
    userIdRef.current = userId
    setIsConnected(true)

    // Poll conversations list every 3 seconds
    const interval = setInterval(() => {
      fetchConversations()
    }, 3000)

    return () => {
      clearInterval(interval)
      setIsConnected(false)
    }
  }, [fetchConversations])

  const markAsRead = useCallback(async (conversationId: string, userId: string) => {
    try {
      await fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
      })

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unread: false }
            : conv
        )
      )
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }, [])

  return {
    conversations,
    isConnected,
    initializeRealtime,
    fetchConversations,
    markAsRead,
    setConversations
  }
}
