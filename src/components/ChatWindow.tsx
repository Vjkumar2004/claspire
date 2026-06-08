'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Loader2, X, Pencil, Reply, Trash2, AlertTriangle, RefreshCw } from 'lucide-react'
import { canModifyMessage, type DirectMessageRow } from '@/lib/message-utils'
import { supabase } from '@/lib/supabase'

interface ChatWindowProps {
  currentUserId: string
  otherUserId: string
  otherUserName: string
  otherUserAvatar?: string
  onMessageSent?: () => void
  hideHeader?: boolean
  flat?: boolean
}

type Message = DirectMessageRow

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function MessageStatus({ isOptimistic, isRead, failed }: { isOptimistic: boolean; isRead?: boolean; failed?: boolean }) {
  if (failed) {
    return <AlertTriangle size={12} className="text-red-400" />
  }
  if (isOptimistic) {
    return <span className="text-[11px]" title="Sending">🫲</span>
  }
  if (isRead) {
    return <span className="text-[11px]" title="Seen">🤝</span>
  }
  return <span className="text-[11px]" title="Sent">🫲</span>
}

export default function ChatWindow({
  currentUserId,
  otherUserId,
  otherUserName,
  otherUserAvatar,
  onMessageSent,
  hideHeader = false,
  flat = false,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [blockStatus, setBlockStatus] = useState<'loading' | 'none' | 'blocked'>('loading')
  const [menuMessageId, setMenuMessageId] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const sendingRef = useRef(false)
  const [failedMessages, setFailedMessages] = useState<Set<string>>(new Set())

  const conversationId = [currentUserId, otherUserId].sort().join('_')

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  const syncMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/history?userId=${otherUserId}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages)
      }
    } catch {
      // silent
    }
  }, [otherUserId])

  useEffect(() => {
    if (!currentUserId || !otherUserId) return

    const init = async () => {
      setLoading(true)
      setMessages([])

      await syncMessages()
      setLoading(false)
    }

    init()

    const channel = supabase
      .channel(`chat-${conversationId}`)
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
            const newMsg = payload.new as Message
            if (newMsg.sender_id !== currentUserId) {
              setMessages(prev => {
                if (prev.find(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg]
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as Message
            setMessages(prev =>
              prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m)
            )
          } else if (payload.eventType === 'DELETE') {
            const deletedMsg = payload.old as { id: string }
            setMessages(prev => prev.filter(m => m.id !== deletedMsg.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [otherUserId, currentUserId, syncMessages, conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuMessageId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchBlockStatus = async () => {
      try {
        const res = await fetch(`/api/block/status?user_id=${otherUserId}`)
        if (res.ok) {
          const data = await res.json()
          setBlockStatus(data.they_blocked_me ? 'blocked' : 'none')
        }
      } catch {
        setBlockStatus('none')
      }
    }
    fetchBlockStatus()
  }, [otherUserId])

  const clearComposerState = () => {
    setReplyingTo(null)
    setEditingMessage(null)
    setNewMessage('')
  }

  const handleReply = (msg: Message) => {
    setMenuMessageId(null)
    setEditingMessage(null)
    setReplyingTo(msg)
    inputRef.current?.focus()
  }

  const handleEdit = (msg: Message) => {
    if (!canModifyMessage(msg.created_at)) {
      alert('Messages can only be edited within 7 hours of sending.')
      return
    }
    setMenuMessageId(null)
    setReplyingTo(null)
    setEditingMessage(msg)
    setNewMessage(msg.content)
    inputRef.current?.focus()
  }

  const handleDelete = async (msg: Message) => {
    setMenuMessageId(null)
    if (!canModifyMessage(msg.created_at)) {
      alert('Messages can only be deleted within 7 hours of sending.')
      return
    }
    if (!confirm('Delete this message for everyone?')) return

    try {
      const res = await fetch(`/api/messages/${msg.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id))
        if (editingMessage?.id === msg.id) clearComposerState()
        if (replyingTo?.id === msg.id) setReplyingTo(null)
      } else {
        alert(data.error || 'Failed to delete message')
      }
    } catch {
      alert('Failed to delete message')
    }
  }

  const sendMessage = async () => {
    const content = newMessage.trim()
    if (!content || sending || sendingRef.current) return

    if (editingMessage) {
      setSending(true)
      try {
        const res = await fetch(`/api/messages/${editingMessage.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        })
        const data = await res.json()
        if (res.ok && data.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === editingMessage.id ? { ...m, ...data.message, reply_to: m.reply_to } : m))
          )
          clearComposerState()
          onMessageSent?.()
        } else {
          alert(data.error || 'Failed to edit message')
        }
      } catch {
        alert('Failed to edit message')
      } finally {
        setSending(false)
      }
      return
    }

    sendingRef.current = true
    const tempId = `temp-${Date.now()}-${Math.random()}`
    const replyTarget = replyingTo

    const optimisticMsg: Message = {
      id: tempId,
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content,
      created_at: new Date().toISOString(),
      conversation_id: conversationId,
      is_read: false,
      reply_to_id: replyTarget?.id || null,
      reply_to: replyTarget
        ? { id: replyTarget.id, content: replyTarget.content, sender_id: replyTarget.sender_id }
        : null,
    }

    setMessages((prev) => [...prev, optimisticMsg])
    setNewMessage('')
    setReplyingTo(null)

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: otherUserId,
          content,
          replyToId: replyTarget?.id || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...data.message, reply_to: optimisticMsg.reply_to } : m))
          )
        }
        onMessageSent?.()
      } else {
        const errorData = await res.json().catch(() => ({}))
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, failed: true, error: errorData.error || 'Failed to send' } : m))
        )
        setFailedMessages((prev) => new Set(prev).add(tempId))
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, failed: true, error: 'Network error' } : m))
      )
      setFailedMessages((prev) => new Set(prev).add(tempId))
    } finally {
      sendingRef.current = false
    }
  }

  const retryMessage = (failedMsg: Message) => {
    setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id))
    setFailedMessages((prev) => {
      const next = new Set(prev)
      next.delete(failedMsg.id)
      return next
    })
    setNewMessage(failedMsg.content)
    if (failedMsg.reply_to) {
      setReplyingTo(failedMsg as any)
    }
    inputRef.current?.focus()
  }

  const renderReplyQuote = (msg: Message, isMine: boolean) => {
    if (!msg.reply_to) return null
    const author =
      msg.reply_to.sender_id === currentUserId ? 'You' : otherUserName
    return (
      <div
        className={`mb-2 pl-2 border-l-2 text-[11px] leading-snug ${isMine ? 'border-white/60 text-white/90' : 'border-purple-500 text-gray-500'
          }`}
      >
        <p className="font-bold truncate">{author}</p>
        <p className="truncate opacity-90">{msg.reply_to.content}</p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full overflow-hidden ${flat ? 'bg-[#efeae2]' : 'bg-white border border-gray-100 rounded-3xl shadow-sm'}`}>
      {!hideHeader && (
        <div className="hidden md:flex flex-shrink-0 p-4 border-b border-gray-100 items-center justify-between bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${otherUserAvatar ? 'bg-transparent shadow-sm' : 'bg-red-500 text-white'}`}>
              {otherUserAvatar ? (
                <img src={otherUserAvatar} alt={otherUserName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-black">{otherUserName?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{otherUserName}</h3>
            </div>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar ${flat ? 'bg-[#efeae2]' : 'bg-gray-50/30'}`}
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
            const failed = failedMessages.has(msg.id)
            const showMenu = menuMessageId === msg.id
            const canEditDelete = isMine && !isOptimistic && !failed && canModifyMessage(msg.created_at)

            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div className="relative max-w-[82%]">
                  <button
                    type="button"
                    onClick={() => {
                      if (failed) {
                        retryMessage(msg)
                      } else {
                        setMenuMessageId(showMenu ? null : msg.id)
                      }
                    }}
                    className={`w-full text-left p-3 rounded-2xl text-sm transition-transform active:scale-[0.99] ${isMine
                        ? `bg-purple-600 text-white rounded-br-none`
                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-sm'
                      } ${failed ? 'ring-2 ring-red-400 cursor-pointer' : ''}`}
                  >
                    {renderReplyQuote(msg, isMine)}
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className={`flex items-center justify-end gap-1.5 mt-1 ${isMine ? 'text-white/75' : 'text-gray-400'}`}>
                      {msg.edited_at && (
                        <span className="text-[9px] italic">edited</span>
                      )}
                      {failed ? (
                        <span className="flex items-center gap-1 text-[9px] text-red-400">
                          <RefreshCw size={10} /> Tap to retry
                        </span>
                      ) : (
                        <>
                          <span className="text-[9px]">{formatTime(msg.created_at)}</span>
                          {isMine && <MessageStatus isOptimistic={isOptimistic} isRead={msg.is_read} />}
                        </>
                      )}
                    </div>
                  </button>

                  {showMenu && !failed && (
                    <div
                      ref={menuRef}
                      className={`absolute z-20 min-w-[140px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden ${isMine ? 'right-0 top-full mt-1' : 'left-0 top-full mt-1'
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleReply(msg)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Reply size={15} /> Reply
                      </button>
                      {canEditDelete && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEdit(msg)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100"
                          >
                            <Pencil size={15} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(msg)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                          >
                            <Trash2 size={15} /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={`flex-shrink-0 ${flat ? 'pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[#f0f2f5] border-t border-gray-200' : 'bg-white border-t border-gray-100'}`}>
        {(replyingTo || editingMessage) && (
          <div className="flex items-start gap-2 px-3 pt-3">
            <div className="flex-1 rounded-xl bg-purple-50 border border-purple-100 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wide text-purple-600">
                {editingMessage ? 'Editing message' : `Replying to ${replyingTo?.sender_id === currentUserId ? 'yourself' : otherUserName}`}
              </p>
              <p className="text-xs text-gray-600 truncate mt-0.5">
                {(editingMessage || replyingTo)?.content}
              </p>
            </div>
            <button
              type="button"
              onClick={clearComposerState}
              className="p-2 rounded-full hover:bg-gray-200 text-gray-500"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {blockStatus === 'blocked' ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            You can&apos;t send messages to this user.
          </div>
        ) : (
          <div className="relative flex items-center gap-2 p-3">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={editingMessage ? 'Edit your message...' : replyingTo ? 'Write a reply...' : 'Type a message...'}
              className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-600 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="p-3 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-all disabled:opacity-50 active:scale-95 flex-shrink-0"
            >
              <Send size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
