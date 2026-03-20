'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Briefcase, MessageSquare, Loader2, User } from 'lucide-react'

interface AcceptedSenior {
  id: string
  senior_id: string
  request_created_at: string
  accepted_at: string
  full_name: string
  avatar_url?: string
  company?: string
  designation?: string
  unique_id: string
}

export default function AcceptedSeniorsSection() {
  const [seniors, setSeniors] = useState<AcceptedSenior[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchAcceptedSeniors()
  }, [])

  const fetchAcceptedSeniors = async () => {
    try {
      const res = await fetch('/api/message-requests/accepted-seniors')
      if (res.ok) {
        const data = await res.json()
        setSeniors(data.seniors || [])
      }
    } catch (error) {
      console.error('Failed to fetch accepted seniors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMessage = (seniorId: string) => {
    router.push(`/dashboard/junior/messages?user=${seniorId}`)
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

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return `${mins}m ago`
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
        Your Mentors
        {seniors.length > 0 && (
          <span className="bg-[#A78BFA] text-white text-xs rounded-full px-2 py-0.5">
            {seniors.length}
          </span>
        )}
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      ) : seniors.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={24} className="text-gray-500" />
          </div>
          <p className="text-gray-500 text-sm">
            No accepted connections yet. Send a message request to a senior!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seniors.map((senior) => (
            <div
              key={senior.id}
              className="bg-gray-800 border border-gray-700 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300 border border-gray-600 overflow-hidden flex-shrink-0">
                  {senior.avatar_url ? (
                    <img
                      src={senior.avatar_url}
                      alt={senior.full_name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(senior.full_name || '')
                  )}
                </div>

                {/* Senior Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-semibold text-sm truncate">
                      {senior.full_name}
                    </h4>
                    <span className="text-gray-500 text-xs flex-shrink-0">
                      @{senior.unique_id}
                    </span>
                  </div>
                  
                  {(senior.designation || senior.company) && (
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                      {senior.designation && (
                        <>
                          <Briefcase size={10} />
                          <span className="truncate">{senior.designation}</span>
                        </>
                      )}
                      {senior.company && (
                        <>
                          <span>•</span>
                          <span className="truncate">{senior.company}</span>
                        </>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-3">
                    <span>Connected {formatTimeAgo(senior.accepted_at)}</span>
                  </div>

                  {/* Message Button */}
                  <button
                    onClick={() => handleMessage(senior.senior_id)}
                    className="w-full bg-[#A78BFA] hover:bg-[#9061F9] text-white rounded-lg px-4 py-1.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={12} />
                    Message
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
