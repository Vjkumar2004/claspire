'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  MessageCircle, MessageSquare, Send, X,
  ChevronRight, ChevronUp, ChevronDown,
  AlertTriangle, RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

interface ChatWidgetProps {
  user: any
  isNavVisible: boolean
}

function ChatWidget({ user, isNavVisible }: ChatWidgetProps) {
  const router = useRouter()

  // Direct Messaging Overhaul States (Phase 3)
  const [chatExpanded, setChatExpanded] = useState(false)
  const [chatThreads, setChatThreads] = useState<any[]>([])
  const [activeChatUser, setActiveChatUser] = useState<any>(null)
  const [drawerMessages, setDrawerMessages] = useState<any[]>([])
  const [drawerNewMessage, setDrawerNewMessage] = useState('')
  const [drawerChatLoading, setDrawerChatLoading] = useState(false)
  const [drawerChatSending, setDrawerChatSending] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [drawerFailedMessages, setDrawerFailedMessages] = useState<Set<string>>(new Set())

  const drawerScrollRef = useRef<HTMLDivElement>(null)
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const drawerSendingRef = useRef(false)

  // Fetch active conversations and accepted connections dynamically
  useEffect(() => {
    const fetchChatWidgetData = async () => {
      try {
        const threadsMap = new Map()

        // 1. Fetch active conversations from /api/messages/list
        const resList = await fetch('/api/messages/list')
        if (resList.ok) {
          const listData = await resList.json()
          const convs = listData.conversations || []
          convs.forEach((conv: any) => {
            const oId = conv.otherUserId
            if (oId && !threadsMap.has(oId)) {
              threadsMap.set(oId, {
                id: oId,
                unread: conv.unread || false,
                users: {
                  id: oId,
                  full_name: conv.otherUser?.full_name || 'Alumni Partner',
                  avatar_url: conv.otherUser?.avatar_url || null,
                  role: 'member'
                }
              })
            }
          })
        }

        // 2. Fetch accepted message requests for juniors (mentors) - student role ONLY
        if (user?.role === 'student') {
          const resSeniors = await fetch('/api/message-requests/accepted-seniors')
          if (resSeniors.ok) {
            const seniorsData = await resSeniors.json()
            const seniors = seniorsData.seniors || []
            seniors.forEach((s: any) => {
              const oId = s.senior_id
              if (oId && !threadsMap.has(oId)) {
                threadsMap.set(oId, {
                  id: oId,
                  users: {
                    id: oId,
                    full_name: s.full_name,
                    avatar_url: s.avatar_url || null,
                    role: 'senior'
                  }
                })
              }
            })
          }
        }

        const threadsList = Array.from(threadsMap.values())
        setChatThreads(threadsList)
      } catch (err) {
        console.error('Failed to load chat drawer details:', err)
        setChatThreads([])
      }
    }

    if (user?.id) {
      fetchChatWidgetData()
    }
  }, [user?.id, user?.role])

  // Realtime chat messages inside the interactive drawer/bottom sheet
  useEffect(() => {
    if (!activeChatUser || !user?.id) return

    const conversationId = [user.id, activeChatUser.id].sort().join('_')

    // Mark messages as read immediately
    fetch('/api/messages/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId })
    }).catch(console.error)

    // Clear local unread state
    setChatThreads(prev => prev.map(t => t.id === activeChatUser.id ? { ...t, unread: false } : t))

    let isMounted = true
    setDrawerChatLoading(true)

    const fetchInitialHistory = async () => {
      try {
        const res = await fetch(`/api/messages/history?userId=${activeChatUser.id}`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted && data.messages && Array.isArray(data.messages)) {
            setDrawerMessages(data.messages)
          }
        }
      } catch (err) {
        console.error('Failed to fetch initial chat history:', err)
      } finally {
        if (isMounted) setDrawerChatLoading(false)
      }
    }

    fetchInitialHistory()

    const channel = supabase.channel(`community-chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as any
            if (newMsg.sender_id !== user.id) {
              setDrawerMessages(prev => {
                if (prev.some((m: any) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg]
              })
              
              fetch('/api/messages/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId })
              }).catch(console.error)
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as any
            setDrawerMessages(prev =>
              prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m)
            )
          } else if (payload.eventType === 'DELETE') {
            const deletedMsg = payload.old as any
            setDrawerMessages(prev => prev.filter(m => m.id !== deletedMsg.id))
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [activeChatUser, user?.id])

  // Auto Scroll to bottom for messages inside drawer/bottom sheet
  useEffect(() => {
    if (drawerScrollRef.current) {
      drawerScrollRef.current.scrollTop = drawerScrollRef.current.scrollHeight
    }
    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollTop = mobileScrollRef.current.scrollHeight
    }
  }, [drawerMessages])

  const retryDrawerMessage = (failedId: string, content: string) => {
    setDrawerMessages(prev => prev.filter(m => m.id !== failedId))
    setDrawerFailedMessages(prev => {
      const next = new Set(prev)
      next.delete(failedId)
      return next
    })
    setDrawerNewMessage(content)
  }

  const sendDrawerMessage = async () => {
    const text = drawerNewMessage.trim()
    if (!text || !activeChatUser || drawerChatSending || drawerSendingRef.current || !user?.id) return

    drawerSendingRef.current = true
    setDrawerNewMessage('')

    const conversationId = [user.id, activeChatUser.id].sort().join('_')
    const tempId = `temp-${Date.now()}-${Math.random()}`
    const optMsg = {
      id: tempId,
      sender_id: user.id,
      receiver_id: activeChatUser.id,
      content: text,
      created_at: new Date().toISOString(),
      conversation_id: conversationId
    }

    setDrawerMessages(prev => [...prev, optMsg])

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: activeChatUser.id,
          content: text
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.message) {
          setDrawerMessages(prev => prev.map(m => m.id === tempId ? data.message : m))
        }
      } else {
        const errorData = await res.json().catch(() => ({}))
        if (errorData.error === 'not_connected') {
          setDrawerMessages(prev => prev.filter(m => m.id !== tempId))
          alert('You are not connected with this user yet.')
        } else {
          setDrawerMessages(prev => prev.map(m => m.id === tempId ? { ...m, failed: true } : m))
          setDrawerFailedMessages(prev => new Set(prev).add(tempId))
        }
      }
    } catch (err) {
      console.error('Failed to send message inside drawer:', err)
      setDrawerMessages(prev => prev.map(m => m.id === tempId ? { ...m, failed: true } : m))
      setDrawerFailedMessages(prev => new Set(prev).add(tempId))
    } finally {
      drawerSendingRef.current = false
    }
  }

  return (
    <>
      {/* ════ MOBILE DIRECT MESSAGING REDESIGN: Floating Circular FAB ════ */}
      <button
        onClick={() => setMobileDrawerOpen(true)}
        className={`fixed right-6 lg:hidden w-12 h-12 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out z-50 border border-purple-400 ${isNavVisible ? 'bottom-24' : 'bottom-6'
          }`}
        title="Open Direct Messages"
      >
        <MessageCircle className="w-6 h-6 animate-pulse" />
        {chatThreads.filter(t => t.unread).length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-[9px] font-black text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#7C3AED]">
            {chatThreads.filter(t => t.unread).length}
          </span>
        )}
      </button>

      {/* ════ MOBILE DIRECT MESSAGING BOTTOM SHEET DRAWER ════ */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] lg:hidden flex items-end"
            onClick={() => setMobileDrawerOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              onClick={e => e.stopPropagation()}
              className="w-full bg-white rounded-t-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col font-plus-jakarta-sans pb-6"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white flex items-center justify-between px-4 py-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {activeChatUser && (
                    <button
                      onClick={() => setActiveChatUser(null)}
                      className="mr-1 hover:text-purple-200 transition-colors p-1"
                      title="Back to conversation list"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                  )}
                  <span className="text-xs font-bold">
                    {activeChatUser ? `Chat with ${activeChatUser.full_name}` : 'Direct Messaging'}
                  </span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer content body */}
              <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50 flex flex-col">
                {activeChatUser ? (
                  // Active Chat thread view inside mobile drawer
                  <div className="flex flex-col h-[50vh] bg-white">
                    {/* User status info */}
                    <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2 flex-shrink-0">
                      <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center font-bold text-slate-800 text-[10px] overflow-hidden">
                        {activeChatUser.avatar_url ? (
                          <img src={activeChatUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          activeChatUser.full_name?.[0] || 'U'
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-[10px] text-slate-900 block leading-tight">{activeChatUser.full_name}</span>
                        <span className="text-[7px] text-slate-400 font-extrabold uppercase tracking-wider block">
                          {activeChatUser.role === 'senior' ? '★ Verified Senior' : 'Mentee peer'}
                        </span>
                      </div>
                    </div>

                    {/* Messages scrolling */}
                    <div
                      ref={mobileScrollRef}
                      className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50"
                    >
                      {drawerChatLoading && drawerMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full gap-2">
                          <div className="w-4 h-4 border-2 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
                          <span className="text-[10px] text-slate-400 font-semibold">Loading history...</span>
                        </div>
                      ) : drawerMessages.length === 0 ? (
                        <div className="text-center py-16 px-4">
                          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-[11px] text-slate-400 font-bold">No messages here yet</p>
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Start the conversation by typing below!</p>
                        </div>
                      ) : (
                        drawerMessages.map((msg: any) => {
                          const isMine = msg.sender_id === user?.id
                          const isOptimistic = msg.id.startsWith('temp-')
                          const failed = drawerFailedMessages.has(msg.id)
                          return (
                            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <button
                                onClick={() => failed && retryDrawerMessage(msg.id, msg.content)}
                                className={`max-w-[85%] p-2.5 rounded-xl text-[10.5px] font-semibold text-left ${isMine
                                  ? `bg-purple-600 text-white rounded-br-none`
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                                  } ${failed ? 'ring-2 ring-red-400 cursor-pointer' : ''}`}
                              >
                                <p className="leading-normal">{msg.content}</p>
                                <span className={`flex items-center gap-1 mt-1 ${isMine ? 'text-white/70 justify-end' : 'text-slate-400'}`}>
                                  {failed ? (
                                    <><RefreshCw size={9} /> Tap to retry</>
                                  ) : (
                                    new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  )}
                                </span>
                              </button>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Chat send block */}
                    <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 flex-shrink-0">
                      <input
                        type="text"
                        value={drawerNewMessage}
                        onChange={e => setDrawerNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendDrawerMessage()}
                        placeholder="Type message here..."
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-[#7C3AED] transition-colors"
                      />
                      <button
                        onClick={sendDrawerMessage}
                        disabled={!drawerNewMessage.trim() || drawerChatSending}
                        className="p-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-slate-100 text-white rounded-xl cursor-pointer transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Conversation list screen inside mobile sheet drawer
                  <div className="flex flex-col h-[50vh] bg-white">
                    {chatThreads.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50">
                        <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-3 border border-purple-100">
                          <MessageSquare className="w-6 h-6 text-[#7C3AED]" />
                        </div>
                        <h4 className="font-bold text-xs text-slate-800">No active connections yet</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1 px-4 leading-normal">
                          You are not connected with anyone yet. Connect with seniors or students to start messaging.
                        </p>
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => {
                              setMobileDrawerOpen(false)
                              router.push('/seniors')
                            }}
                            className="px-3 py-1.5 bg-[#7C3AED] text-white text-[9px] font-bold rounded shadow-sm hover:bg-[#6D28D9] transition-all cursor-pointer"
                          >
                            Explore Seniors
                          </button>
                          <button
                            onClick={() => {
                              setMobileDrawerOpen(false)
                              router.push('/colleges')
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[9px] font-bold rounded hover:bg-slate-50 transition-all cursor-pointer"
                          >
                            Find Communities
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
                        {chatThreads.map((thread) => (
                          <div
                            key={thread.id}
                            onClick={() => {
                              setActiveChatUser({
                                id: thread.users?.id || thread.users?.unique_id || thread.id,
                                full_name: thread.users?.full_name || 'Alumni Partner',
                                avatar_url: thread.users?.avatar_url,
                                role: thread.users?.role || 'senior'
                              })
                            }}
                            className="flex items-center gap-3.5 p-3.5 hover:bg-slate-100 bg-white cursor-pointer transition-colors"
                          >
                            <div className="w-8 h-8 rounded bg-purple-50 flex items-center justify-center font-bold text-[#7C3AED] text-[10px] overflow-hidden flex-shrink-0 border border-purple-100">
                              {thread.users?.avatar_url ? (
                                <img src={thread.users.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                thread.users?.full_name?.[0] || 'S'
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-xs text-slate-800 truncate">{thread.users?.full_name}</h5>
                              <p className="text-[10px] text-slate-400 font-semibold truncate leading-none mt-0.5">
                                {thread.users?.role === 'senior' ? '★ Verified Senior' : 'Mentee peer'}
                              </p>
                            </div>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-4 text-center bg-white border-t border-slate-100 flex-shrink-0">
                      <button
                        onClick={() => {
                          setMobileDrawerOpen(false)
                          router.push('/dashboard/junior/messages')
                        }}
                        className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[11px] font-bold rounded transition-colors cursor-pointer border border-purple-100"
                      >
                        Open Full Messaging Center
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ COLLAPSIBLE/EXPANDABLE DESKTOP DIRECT MESSAGING WIDGET ════ */}
      <div
        className={`fixed bottom-0 right-6 z-[9999] w-80 bg-white rounded-t-xl shadow-[0_-4px_25px_rgba(0,0,0,0.12)] border border-slate-200 overflow-hidden font-plus-jakarta-sans transition-all duration-300 hidden lg:block ${chatExpanded ? 'h-[440px]' : 'h-11'
          }`}
      >
        {/* Header */}
        <div
          onClick={() => {
            setChatExpanded(!chatExpanded)
            if (!chatExpanded) {
              setActiveChatUser(null)
            }
          }}
          className="bg-slate-900 text-white flex items-center justify-between px-3.5 py-3 cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            {activeChatUser && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveChatUser(null)
                }}
                className="p-0.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
                title="Back to Chats list"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold tracking-tight">
                {activeChatUser ? `Chat: ${activeChatUser.full_name}` : 'Direct Messaging'}
              </span>
            </div>
          </div>
          <button className="text-white hover:text-purple-200 transition-colors">
            {chatExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Content Body when expanded */}
        {chatExpanded && (
          <div className="h-[396px] flex flex-col bg-slate-50">
            {activeChatUser ? (
              // Active Conversation Screen inside widget
              <div className="flex flex-col h-full bg-white">
                {/* User mini info */}
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center font-bold text-slate-800 text-[10px] overflow-hidden">
                      {activeChatUser.avatar_url ? (
                        <img src={activeChatUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        activeChatUser.full_name?.[0] || 'U'
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-[10px] text-slate-900 block leading-tight">{activeChatUser.full_name}</span>
                      <span className="text-[7px] text-slate-400 font-extrabold uppercase tracking-wider block mt-0.5">
                        {activeChatUser.role === 'senior' ? '★ Verified Senior' : 'Mentee peer'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages scroll area */}
                <div
                  ref={drawerScrollRef}
                  className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50"
                >
                  {drawerChatLoading && drawerMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
                      <span className="text-[9px] text-slate-400 font-semibold">Loading messages...</span>
                    </div>
                  ) : drawerMessages.length === 0 ? (
                    <div className="text-center py-10 px-4">
                      <MessageSquare className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                      <p className="text-[10px] text-slate-400 font-bold">No messages yet</p>
                      <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Send a quick note below to start chatting!</p>
                    </div>
                  ) : (
                    drawerMessages.map((msg: any) => {
                      const isMine = msg.sender_id === user?.id
                      const isOptimistic = msg.id.startsWith('temp-')
                      const failed = drawerFailedMessages.has(msg.id)
                      return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <button
                            onClick={() => failed && retryDrawerMessage(msg.id, msg.content)}
                            className={`max-w-[85%] p-2 rounded-lg text-[10px] font-semibold text-left ${isMine
                              ? `bg-purple-600 text-white rounded-br-none`
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                              } ${failed ? 'ring-2 ring-red-400 cursor-pointer' : ''}`}
                          >
                            <p className="leading-normal">{msg.content}</p>
                            <span className={`flex items-center gap-1 mt-1 ${isMine ? 'text-white/70 justify-end' : 'text-slate-400'}`}>
                              {failed ? (
                                <><RefreshCw size={8} /> Tap to retry</>
                              ) : (
                                new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              )}
                            </span>
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Input block */}
                <div className="p-2.5 border-t border-slate-100 bg-white flex items-center gap-2 flex-shrink-0">
                  <input
                    type="text"
                    value={drawerNewMessage}
                    onChange={e => setDrawerNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendDrawerMessage()}
                    placeholder="Write message..."
                    className="flex-1 border border-slate-200 hover:border-slate-300 rounded px-2.5 py-1.5 text-[10px] font-semibold outline-none focus:border-[#7C3AED] transition-colors"
                  />
                  <button
                    onClick={sendDrawerMessage}
                    disabled={!drawerNewMessage.trim() || drawerChatSending}
                    className="p-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-slate-100 text-white rounded cursor-pointer transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              // General Active Threads List Screen inside widget
              <div className="flex flex-col h-full bg-slate-50">
                {chatThreads.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-white">
                    <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mb-2 border border-purple-100">
                      <MessageSquare className="w-5 h-5 text-[#7C3AED]" />
                    </div>
                    <h4 className="font-bold text-[10px] text-slate-800">No active connections</h4>
                    <p className="text-[8px] text-slate-400 font-semibold mt-1 px-3 leading-normal">
                      You are not connected with anyone yet. Connect with seniors or students to start messaging.
                    </p>
                    <div className="mt-3.5 flex gap-1.5">
                      <button
                        onClick={() => router.push('/seniors')}
                        className="px-2.5 py-1 bg-[#7C3AED] text-white text-[8px] font-bold rounded hover:bg-[#6D28D9] transition-all cursor-pointer"
                      >
                        Explore Seniors
                      </button>
                      <button
                        onClick={() => router.push('/colleges')}
                        className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-[8px] font-bold rounded hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        Find Communities
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 divide-y divide-slate-100 overflow-y-auto bg-white">
                    {chatThreads.map((thread) => (
                      <div
                        key={thread.id}
                        onClick={() => {
                          setActiveChatUser({
                            id: thread.users?.id || thread.users?.unique_id || thread.id,
                            full_name: thread.users?.full_name || 'Alumni Partner',
                            avatar_url: thread.users?.avatar_url,
                            role: thread.users?.role || 'senior'
                          })
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-slate-100 bg-white cursor-pointer transition-colors"
                      >
                        <div className="w-7 h-7 rounded bg-purple-50 flex items-center justify-center font-bold text-[#7C3AED] text-[10px] overflow-hidden flex-shrink-0">
                          {thread.users?.avatar_url ? (
                            <img src={thread.users.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            thread.users?.full_name?.[0] || 'S'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-[11px] text-slate-800 truncate">{thread.users?.full_name}</h5>
                          <p className="text-[9px] text-slate-400 font-semibold truncate leading-none mt-0.5">
                            {thread.users?.role === 'senior' ? '★ Verified Senior' : 'Mentee peer'}
                          </p>
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3 text-center bg-white mt-auto border-t border-slate-100 flex-shrink-0">
                  <button
                    onClick={() => {
                      const messageRoute = user?.role === 'senior'
                        ? '/dashboard/senior/messages'
                        : '/dashboard/junior/messages'
                      router.push(messageRoute)
                    }}
                    className="w-full py-1.5 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[10px] font-bold rounded transition-colors cursor-pointer border border-purple-100"
                  >
                    Full Messaging Console
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default React.memo(ChatWidget)
