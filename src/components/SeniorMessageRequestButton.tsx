'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Clock, CheckCircle, XCircle, Loader2, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface SeniorMessageRequestButtonProps {
  targetSeniorId: string
  targetSeniorName: string
}

type RequestStatus = 'loading' | 'none' | 'pending' | 'accepted' | 'declined'

const STORAGE_KEY_PREFIX = 'senior_req_status_'

export default function SeniorMessageRequestButton({ targetSeniorId, targetSeniorName }: SeniorMessageRequestButtonProps) {
  const [status, setStatus] = useState<RequestStatus>('loading')
  const [sending, setSending] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    checkRequestStatus()

    const onFocus = () => checkRequestStatus()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [targetSeniorId])

  const checkRequestStatus = async () => {
    try {
      const res = await fetch(
        `/api/senior-message-requests/status?receiver_id=${targetSeniorId}`,
        { cache: 'no-store', credentials: 'include' }
      )
      if (res.ok) {
        const data = await res.json()
        const serverStatus = data.status as RequestStatus
        setStatus(serverStatus)
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${targetSeniorId}`, serverStatus)
      } else {
        const cached = localStorage.getItem(`${STORAGE_KEY_PREFIX}${targetSeniorId}`)
        if (cached) setStatus(cached as RequestStatus)
        else setStatus('none')
      }
    } catch (error) {
      console.error('Failed to check request status:', error)
      const cached = localStorage.getItem(`${STORAGE_KEY_PREFIX}${targetSeniorId}`)
      if (cached) setStatus(cached as RequestStatus)
      else setStatus('none')
    }
  }

  const handleSendRequest = async () => {
    if (sending || status !== 'none' || !message.trim()) return

    setSending(true)
    try {
      const res = await fetch('/api/senior-message-requests/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          receiver_id: targetSeniorId,
          message: message.trim()
        })
      })

      const data = await res.json()
      
      if (res.ok && data.success) {
        setStatus('pending')
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${targetSeniorId}`, 'pending')
        setShowModal(false)
        setMessage('')
        alert('Connection request sent successfully! 🎯')
      } else {
        if (data.error === 'already_requested') {
          const s = data.status as RequestStatus
          setStatus(s)
          localStorage.setItem(`${STORAGE_KEY_PREFIX}${targetSeniorId}`, s)
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
    router.push(`/dashboard/senior?activeTab=messages&user=${targetSeniorId}`)
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
      <>
        <button
          onClick={() => setShowModal(true)}
          disabled={sending}
          className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Users size={14} />
          Connect
        </button>

        {/* Senior to Senior Message Request Modal */}
        {showModal && (
          <div style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(15, 23, 42, 0.85)', 
            backdropFilter: 'blur(12px)', 
            zIndex: 1000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: 16 
          }}>
            <div className="animate-fade" style={{ 
              background: 'white', 
              width: '100%', 
              maxWidth: 450, 
              borderRadius: 28, 
              overflow: 'hidden', 
              boxShadow: '0 40px 80px rgba(0,0,0,0.4)', 
              padding: 32 
            }}>
              {/* Header */}
              <div style={{ 
                width: 64, 
                height: 64, 
                background: 'linear-gradient(135deg, #06B6D4, #0891B2)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 20px', 
                color: 'white' 
              }}>
                <Users size={32} />
              </div>
              
              <h3 style={{ 
                fontSize: 20, 
                fontWeight: 800, 
                color: '#0F172A', 
                marginBottom: 12, 
                textAlign: 'center' 
              }}>
                Senior Connect Request
              </h3>
              
              <p style={{ 
                fontSize: 14, 
                color: '#64748B', 
                lineHeight: 1.6, 
                marginBottom: 20,
                textAlign: 'center'
              }}>
                Send a connection request to <b>{targetSeniorName}</b>. 
                Introduce yourself and mention why you'd like to connect.
              </p>

              {/* Message Input */}
              <div style={{ marginBottom: 24 }}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi! I'd like to connect because..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#06B6D4'}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
                <div style={{ 
                  fontSize: '12px', 
                  color: message.length > 200 ? '#EF4444' : '#94A3B8', 
                  marginTop: '4px',
                  textAlign: 'right'
                }}>
                  {message.length}/200
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setMessage('')
                  }}
                  disabled={sending}
                  style={{ 
                    flex: 1, 
                    background: '#F8FAFC', 
                    color: '#64748B', 
                    border: '1px solid #E2E8F0', 
                    padding: '12px', 
                    borderRadius: 14, 
                    fontSize: 13, 
                    fontWeight: 700, 
                    cursor: 'pointer' 
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendRequest}
                  disabled={sending || !message.trim() || message.length > 200}
                  style={{ 
                    flex: 2, 
                    background: sending || !message.trim() || message.length > 200 
                      ? '#94A3B8' 
                      : 'linear-gradient(135deg, #06B6D4, #0891B2)', 
                    color: 'white', 
                    border: 'none', 
                    padding: '12px', 
                    borderRadius: 14, 
                    fontSize: 13, 
                    fontWeight: 800, 
                    cursor: sending || !message.trim() || message.length > 200 ? 'not-allowed' : 'pointer',
                    opacity: sending ? 0.7 : 1
                  }}
                >
                  {sending ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
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
