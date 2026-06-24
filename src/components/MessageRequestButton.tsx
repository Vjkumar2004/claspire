'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface MessageRequestButtonProps {
  seniorId: string
  seniorName: string
}

type RequestStatus = 'loading' | 'none' | 'pending' | 'accepted' | 'declined'

function storageKey(userId: string, seniorId: string) {
  return `msg_req_status_${userId}_${seniorId}`
}

export default function MessageRequestButton({ seniorId, seniorName }: MessageRequestButtonProps) {
  const { user } = useAuth()
  const userId = user?.id
  const [status, setStatus] = useState<RequestStatus>('loading')
  const [sending, setSending] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!userId) return
    // Load cached status immediately to avoid flash
    const cached = localStorage.getItem(storageKey(userId, seniorId))
    if (cached && cached !== 'none') {
      setStatus(cached as RequestStatus)
    }
    // Always verify with server
    checkRequestStatus()
  }, [seniorId, userId])

  const checkRequestStatus = async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/message-requests/status?senior_id=${seniorId}`)
      if (res.ok) {
        const data = await res.json()
        const serverStatus = data.status as RequestStatus
        setStatus(serverStatus)
        // Persist to localStorage so page reloads don't flash Connect
        localStorage.setItem(storageKey(userId, seniorId), serverStatus)
      } else {
        // If API fails, fall back to cached value rather than 'none'
        const cached = localStorage.getItem(storageKey(userId, seniorId))
        if (cached) {
          setStatus(cached as RequestStatus)
        } else {
          setStatus('none')
        }
      }
    } catch (error) {
      console.error('Failed to check request status:', error)
      const cached = localStorage.getItem(storageKey(userId, seniorId))
      if (cached) {
        setStatus(cached as RequestStatus)
      } else {
        setStatus('none')
      }
    }
  }

  const handleSendRequest = async () => {
    if (!userId || sending || status !== 'none') return

    setSending(true)
    try {
      const res = await fetch('/api/message-requests/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senior_id: seniorId })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setStatus('pending')
        localStorage.setItem(storageKey(userId, seniorId), 'pending')
      } else {
        if (data.error === 'already_requested') {
          const s = data.status as RequestStatus
          setStatus(s)
          localStorage.setItem(storageKey(userId, seniorId), s)
        } else {
          alert(data.error || 'Failed to send request')
        }
      }
    } catch (error) {
      console.error('Failed to send request:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleMessage = () => {
    router.push(`/dashboard/junior/messages?user=${seniorId}`)
  }

  if (status === 'loading') {
    return (
      <button
        disabled
        className="w-full bg-gray-100 text-gray-400 rounded-lg px-4 py-2.5 text-sm font-semibold cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Loader2 size={14} className="animate-spin" />
        Checking...
      </button>
    )
  }

  if (status === 'none') {
    return (
      <button
        onClick={handleSendRequest}
        disabled={sending}
        className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-[#0A66C2]/20/50"
      >
        {sending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <MessageSquare size={14} />
            Connect
          </>
        )}
      </button>
    )
  }

  if (status === 'pending') {
    return (
      <button
        disabled
        className="w-full bg-amber-50 text-amber-600 border border-amber-200 rounded-lg px-4 py-2.5 text-sm font-semibold cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Clock size={14} />
        Request Sent
      </button>
    )
  }

  if (status === 'accepted') {
    return (
      <button
        onClick={handleMessage}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-200/50"
      >
        <CheckCircle size={14} />
        Message
      </button>
    )
  }

  if (status === 'declined') {
    return (
      <button
        disabled
        className="w-full bg-red-50 text-red-400 border border-red-200 rounded-lg px-4 py-2.5 text-sm font-semibold cursor-not-allowed flex items-center justify-center gap-2"
      >
        <XCircle size={14} />
        Request Declined
      </button>
    )
  }

  return null
}
