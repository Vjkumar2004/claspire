'use client'

import { useState, useEffect } from 'react'
import { Clock, User, Building2, GraduationCap, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface MessageRequest {
  id: string
  student_id: string
  senior_id: string
  status: string
  created_at: string
  responded_at: string
  full_name: string
  avatar_url?: string
  college_id?: string
  branch?: string
  year?: number
  unique_id: string
  college_name?: string
  college_short_name?: string
  college_location?: string
}

export default function MessageRequestsSection() {
  const [requests, setRequests] = useState<MessageRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      console.log('Fetching message requests...')
      const res = await fetch('/api/message-requests/incoming')
      console.log('Response status:', res.status)
      
      if (res.ok) {
        const data = await res.json()
        console.log('Requests data:', data)
        setRequests(data.requests || [])
      } else {
        const errorData = await res.json()
        console.error('❌ API error:', errorData)
        console.error('❌ Error details:', errorData.details)
        alert(`Failed to load requests: ${errorData.error}${errorData.details ? ` - ${errorData.details}` : ''}`)
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = async (requestId: string, action: 'accepted' | 'declined') => {
    if (responding) return

    setResponding(requestId)
    try {
      const res = await fetch('/api/message-requests/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, action })
      })

      const data = await res.json()
      
      if (res.ok && data.success) {
        // Remove the request from the list
        setRequests(prev => prev.filter(req => req.id !== requestId))
        
        // Show success message
        const message = action === 'accepted' ? 'Request accepted!' : 'Request declined!'
        alert(message)
      } else {
        alert(data.error || 'Failed to respond to request')
      }
    } catch (error) {
      console.error('Failed to respond:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setResponding(null)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return `${mins}m ago`
  }

  const getInitials = (name: string) => {
    if (!name) return '??'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          Message Requests
          {requests.length > 0 && (
            <span className="bg-[#A78BFA] text-white text-xs rounded-full px-2 py-0.5">
              {requests.length} pending
            </span>
          )}
        </h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📭</span>
          </div>
          <p className="text-gray-500 text-sm">No pending requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              {/* Avatar */}
              <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300 border border-gray-600 overflow-hidden">
                {request.avatar_url ? (
                  <img
                    src={request.avatar_url}
                    alt={request.full_name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(request.full_name || '')
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                  <h4 className="text-white font-semibold text-sm">
                    {request.full_name || 'Unknown User'}
                  </h4>
                  <span className="text-gray-500 text-xs sm:ml-auto">
                    @{request.unique_id}
                  </span>
                </div>
                
                {/* College Information */}
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Building2 size={10} />
                  <span>{request.college_name || 'College not specified'}</span>
                </div>
                
                {/* Branch and Year */}
                {(request.branch || request.year) && (
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                    <GraduationCap size={10} />
                    {request.branch && <span>{request.branch}</span>}
                    {request.branch && request.year && <span>•</span>}
                    {request.year && <span>Year {request.year}</span>}
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Clock size={10} />
                  <span>Wants to message you</span>
                  <span>•</span>
                  <span>{formatTimeAgo(request.created_at)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                <button
                  onClick={() => handleRespond(request.id, 'accepted')}
                  disabled={responding === request.id}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors flex items-center justify-center gap-1 min-w-[80px] sm:min-w-[90px]"
                >
                  {responding === request.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <CheckCircle size={12} />
                  )}
                  Accept
                </button>
                <button
                  onClick={() => handleRespond(request.id, 'declined')}
                  disabled={responding === request.id}
                  className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-gray-400 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors flex items-center justify-center gap-1 min-w-[80px] sm:min-w-[90px]"
                >
                  {responding === request.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <XCircle size={12} />
                  )}
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
