'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, UserPlus, Clock, ArrowLeft, Send, GraduationCap, Briefcase } from 'lucide-react'
import PeopleCard from './PeopleCard'

interface RequestUser {
  id: string
  sender_id: string
  receiver_id: string
  status: string
  created_at: string
  full_name: string
  unique_id: string
  role: string
  avatar_url?: string | null
  banner_url?: string | null
  company?: string | null
  designation?: string | null
  branch?: string | null
  college_id?: string | null
  graduation_year?: number | null
  last_seen?: string | null
}

interface RequestsTabProps {
  refreshKey?: number
}

export default function RequestsTab({ refreshKey = 0 }: RequestsTabProps) {
  const router = useRouter()
  const [incoming, setIncoming] = useState<RequestUser[]>([])
  const [outgoing, setOutgoing] = useState<RequestUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => { fetchRequests() }, [refreshKey])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/network/requests')
      if (res.ok) {
        const data = await res.json()
        setIncoming(data.incoming || [])
        setOutgoing(data.outgoing || [])
      }
    } catch { } finally { setLoading(false) }
  }

  const handleRespond = async (connectionId: string, action: 'accepted' | 'rejected') => {
    setActionId(connectionId)
    try {
      const res = await fetch('/api/network/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: connectionId, action }),
      })
      if (res.ok) setIncoming((prev) => prev.filter((r) => r.id !== connectionId))
    } catch { } finally { setActionId(null) }
  }

  const handleWithdraw = async (connectionId: string) => {
    setActionId(connectionId)
    try {
      const res = await fetch('/api/network/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: connectionId }),
      })
      if (res.ok) setOutgoing((prev) => prev.filter((r) => r.id !== connectionId))
    } catch { } finally { setActionId(null) }
  }

  const handleConnectAction = async (userId: string): Promise<boolean> => {
    // For requests tab, this is handled by handleRespond/handleWithdraw
    return false
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 2xl:grid-cols-3 gap-3 lg:gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-[#283036] rounded-xl border border-gray-200 dark:border-[#38434F]/90 dark:border-[#38434F]/90 overflow-hidden animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="h-[80px] lg:h-[90px] bg-gray-100 dark:bg-[#1D2226]" />
            <div className="px-3 lg:px-4 pb-2.5 lg:pb-3 pt-1 lg:pt-1.5 space-y-1.5 lg:space-y-2">
              <div className="flex justify-center -mt-[21px] lg:-mt-8 mb-1">
                <div className="w-[42px] h-[42px] lg:w-16 lg:h-16 rounded-full border-[3px] lg:border-[4px] border-white bg-gray-100 dark:bg-[#1D2226] shadow-md" />
              </div>
              <div className="h-3 lg:h-3.5 bg-gray-100 dark:bg-[#1D2226] rounded w-2/3 mx-auto" />
              <div className="h-2 lg:h-2.5 bg-gray-50 dark:bg-[#1D2226] rounded w-1/2 mx-auto" />
              <div className="h-2 bg-gray-50 dark:bg-[#1D2226] rounded w-1/3 mx-auto" />
              <div className="mt-1.5 lg:mt-2 pt-1.5 lg:pt-2 border-t border-gray-100 dark:border-[#38434F]">
                <div className="h-7 lg:h-8 bg-gray-100 dark:bg-[#1D2226] rounded-lg w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const roleLabel = (role: string) => role === 'senior' ? 'Senior' : 'Student'
  const roleColor = (role: string) =>
    role === 'senior'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : 'bg-blue-50 text-blue-700 border-blue-100'

  return (
    <div className="space-y-8">
      {incoming.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserPlus size={18} className="text-amber-500" />
              Incoming Requests
              <span className="text-xs font-semibold text-gray-400 dark:text-[#B0B7BE] bg-gray-100 dark:bg-[#1D2226] px-3 py-1 rounded-full">{incoming.length}</span>
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 2xl:grid-cols-3 gap-3 lg:gap-5">
            {incoming.map((req) => (
              <PeopleCard
                key={req.id}
                person={{
                  id: req.sender_id,
                  full_name: req.full_name,
                  unique_id: req.unique_id,
                  role: req.role,
                  avatar_url: req.avatar_url,
                  banner_url: req.banner_url,
                  company: req.company,
                  designation: req.designation,
                  branch: req.branch,
                  college_id: req.college_id,
                  graduation_year: req.graduation_year,
                  last_seen: req.last_seen,
                  connectionStatus: 'pending_received',
                  mutualConnections: 0,
                  isFollowing: false,
                }}
                onConnect={handleConnectAction}
                connectionId={req.id}
                onRespond={handleRespond}
              />
            ))}
          </div>
        </div>
      )}

      {outgoing.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Send size={18} className="text-blue-500" />
              Outgoing Requests
              <span className="text-xs font-semibold text-gray-400 dark:text-[#B0B7BE] bg-gray-100 dark:bg-[#1D2226] px-3 py-1 rounded-full">{outgoing.length}</span>
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 2xl:grid-cols-3 gap-3 lg:gap-5">
            {outgoing.map((req) => (
              <PeopleCard
                key={req.id}
                person={{
                  id: req.receiver_id,
                  full_name: req.full_name,
                  unique_id: req.unique_id,
                  role: req.role,
                  avatar_url: req.avatar_url,
                  banner_url: req.banner_url,
                  company: req.company,
                  designation: req.designation,
                  branch: req.branch,
                  college_id: req.college_id,
                  graduation_year: req.graduation_year,
                  last_seen: req.last_seen,
                  connectionStatus: 'pending_sent',
                  mutualConnections: 0,
                  isFollowing: false,
                }}
                onConnect={handleConnectAction}
                connectionId={req.id}
                onWithdraw={handleWithdraw}
              />
            ))}
          </div>
        </div>
      )}

      {incoming.length === 0 && outgoing.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-[#283036] rounded-2xl border border-gray-200 dark:border-[#38434F]">
          <div className="w-16 h-16 bg-gray-50 dark:bg-[#1D2226] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus size={24} className="text-gray-300 dark:text-[#38434F]" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">No pending requests</h3>
          <p className="text-sm text-gray-500 dark:text-[#B0B7BE]">Connect with people in the Discover tab to grow your network</p>
        </div>
      )}
    </div>
  )
}
