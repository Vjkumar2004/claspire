'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface MessageRequestButtonProps {
  seniorId: string
  seniorName: string
}

type RequestStatus = 'loading' | 'none' | 'pending' | 'accepted' | 'declined'

export default function MessageRequestButton({ seniorId, seniorName }: MessageRequestButtonProps) {
  const [status, setStatus] = useState<RequestStatus>('loading')
  const [sending, setSending] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkRequestStatus()
  }, [seniorId])

  const checkRequestStatus = async () => {
    try {
      const res = await fetch(`/api/message-requests/status?senior_id=${seniorId}`)
      if (res.ok) {
        const data = await res.json()
        setStatus(data.status)
      } else {
        setStatus('none')
      }
    } catch (error) {
      console.error('Failed to check request status:', error)
      setStatus('none')
    }
  }

  const handleSendRequest = async () => {
    if (sending || status !== 'none') return

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
      } else {
        if (data.error === 'already_requested') {
          setStatus(data.status)
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
    router.push(`/dashboard/junior?activeTab=messages&user=${seniorId}`)
  }

  // Loading state
  if (status === 'loading') {
    return (
      <button 
        disabled 
        className="bg-gray-300 text-gray-500 rounded-xl px-4 py-2 text-sm font-medium cursor-not-allowed flex items-center gap-2"
      >
        <Loader2 size={14} className="animate-spin" />
        Checking...
      </button>
    )
  }

  // No request sent yet
  if (status === 'none') {
    return (
      <button
        onClick={handleSendRequest}
        disabled={sending}
        className="bg-[#A78BFA] hover:bg-[#9061F9] text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {sending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <MessageSquare size={14} />
            Message Request
          </>
        )}
      </button>
    )
  }

  // Request pending
  if (status === 'pending') {
    return (
      <button 
        disabled 
        className="bg-gray-800 text-gray-400 rounded-xl px-4 py-2 text-sm cursor-not-allowed flex items-center gap-2"
      >
        <Clock size={14} />
        Request Sent
      </button>
    )
  }

  // Request accepted
  if (status === 'accepted') {
    return (
      <button
        onClick={handleMessage}
        className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2"
      >
        <CheckCircle size={14} />
        Message
      </button>
    )
  }

  // Request declined
  if (status === 'declined') {
    return (
      <button 
        disabled 
        className="bg-gray-800 text-red-400 rounded-xl px-4 py-2 text-sm cursor-not-allowed flex items-center gap-2"
      >
        <XCircle size={14} />
        Request Declined
      </button>
    )
  }

  return null
}
