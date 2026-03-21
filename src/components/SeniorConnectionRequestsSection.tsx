'use client'

import { useState, useEffect } from 'react'
import { Users, Clock, CheckCircle, XCircle, Loader2, MessageCircle, Building2, GraduationCap } from 'lucide-react'

interface SeniorRequest {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  status: string
  created_at: string
  responded_at: string | null
  sender: {
    id: string
    full_name: string
    unique_id: string
    avatar_url?: string
    company: string
    designation: string
  } | null
}

export default function SeniorConnectionRequestsSection() {
  const [requests, setRequests] = useState<SeniorRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/senior-message-requests/incoming')
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestAction = async (requestId: string, action: 'accept' | 'decline') => {
    if (processing) return

    setProcessing(requestId)
    try {
      const res = await fetch('/api/senior-message-requests/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, action })
      })

      if (res.ok) {
        // Remove the request from the list
        setRequests(prev => prev.filter(req => req.id !== requestId))
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to process request')
      }
    } catch (error) {
      console.error('Error processing request:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (mins > 0) return `${mins}m ago`
    return 'Just now'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users size={20} className="text-cyan-600" />
          <h3 className="text-lg font-bold text-black">Connection Requests</h3>
        </div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users size={20} className="text-cyan-600" />
          <h3 className="text-lg font-bold text-black">Connection Requests</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No pending connection requests</p>
          <p className="text-gray-400 text-sm mt-1">Senior mentors can connect with you here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users size={20} className="text-cyan-600" />
          <h3 className="text-lg font-bold text-black">Connection Requests</h3>
          <span className="bg-cyan-100 text-cyan-700 text-xs font-bold px-2 py-1 rounded-full">
            {requests.length}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <div 
            key={request.id}
            className="border border-gray-100 rounded-xl p-4 hover:border-cyan-200 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div 
                className={`w-12 h-12 rounded-xl ${
                  request.sender?.avatar_url 
                    ? 'bg-transparent' 
                    : 'bg-gradient-to-br from-cyan-100 to-blue-100'
                } flex items-center justify-center text-sm font-black text-cyan-600 border border-gray-200 overflow-hidden flex-shrink-0`}
              >
                {request.sender?.avatar_url ? (
                  <img 
                    src={request.sender.avatar_url} 
                    alt={request.sender.full_name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  request.sender?.full_name?.substring(0, 2).toUpperCase() || 'SR'
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-black text-sm">
                      {request.sender?.full_name || 'Unknown Senior'}
                    </h4>
                    <p className="text-xs text-gray-500">@{request.sender?.unique_id || 'unknown'}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                    <Clock size={12} />
                    {timeAgo(request.created_at)}
                  </div>
                </div>

                {/* Professional Info */}
                <div className="flex items-start gap-3 mb-3">
                  <Building2 size={14} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-800">{request.sender?.designation}</p>
                    <p className="text-xs text-gray-500">{request.sender?.company}</p>
                  </div>
                </div>

                {/* Message */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {request.message}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRequestAction(request.id, 'accept')}
                    disabled={processing === request.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-bold py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                  >
                    {processing === request.id ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        Accept
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleRequestAction(request.id, 'decline')}
                    disabled={processing === request.id}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 disabled:text-gray-400 text-sm font-bold py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                  >
                    {processing === request.id ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle size={14} />
                        Decline
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
