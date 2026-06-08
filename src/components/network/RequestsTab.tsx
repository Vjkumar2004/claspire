'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, UserPlus, Clock, ArrowLeft, Send } from 'lucide-react'

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
  company?: string | null
  designation?: string | null
  branch?: string | null
  college_id?: string | null
  graduation_year?: number | null
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

  useEffect(() => {
    fetchRequests()
  }, [refreshKey])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/network/requests')
      if (res.ok) {
        const data = await res.json()
        setIncoming(data.incoming || [])
        setOutgoing(data.outgoing || [])
      }
    } catch { } finally {
      setLoading(false)
    }
  }

  const handleRespond = async (connectionId: string, action: 'accepted' | 'rejected') => {
    setActionId(connectionId)
    try {
      const res = await fetch('/api/network/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: connectionId, action }),
      })
      if (res.ok) {
        setIncoming((prev) => prev.filter((r) => r.id !== connectionId))
      }
    } catch { } finally {
      setActionId(null)
    }
  }

  const handleWithdraw = async (connectionId: string) => {
    setActionId(connectionId)
    try {
      const res = await fetch('/api/network/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: connectionId }),
      })
      if (res.ok) {
        setOutgoing((prev) => prev.filter((r) => r.id !== connectionId))
      }
    } catch { } finally {
      setActionId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-purple-600" />
      </div>
    )
  }

  const roleLabel = (role: string) =>
    role === 'senior' ? 'Senior' : 'Student'

  const roleColor = (role: string) =>
    role === 'senior'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : 'bg-blue-50 text-blue-700 border-blue-100'

  return (
    <div className="space-y-8">
      {incoming.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <UserPlus size={16} className="text-amber-500" />
            Incoming Requests
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{incoming.length}</span>
          </h3>
          <div className="space-y-3">
            {incoming.map((req) => (
              <div
                key={req.id}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-amber-200 hover:shadow-sm transition-all"
              >
                <div
                  onClick={() => router.push(`/u/${req.unique_id}`)}
                  className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-sm font-black text-gray-500 border border-gray-200 overflow-hidden cursor-pointer flex-shrink-0"
                >
                  {req.avatar_url ? (
                    <img src={req.avatar_url} alt={req.full_name} className="w-full h-full object-cover" />
                  ) : (
                    req.full_name?.substring(0, 2).toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4
                      onClick={() => router.push(`/u/${req.unique_id}`)}
                      className="text-sm font-bold text-gray-900 hover:text-purple-600 cursor-pointer truncate"
                    >
                      {req.full_name}
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleColor(req.role)} flex-shrink-0`}>
                      {roleLabel(req.role)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {req.designation && req.company
                      ? `${req.designation} at ${req.company}`
                      : req.branch || 'Student'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleRespond(req.id, 'accepted')}
                    disabled={actionId === req.id}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {actionId === req.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Check size={13} />
                    )}
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespond(req.id, 'rejected')}
                    disabled={actionId === req.id}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <X size={13} />
                    Ignore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {outgoing.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Send size={16} className="text-blue-500" />
            Outgoing Requests
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{outgoing.length}</span>
          </h3>
          <div className="space-y-3">
            {outgoing.map((req) => (
              <div
                key={req.id}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div
                  onClick={() => router.push(`/u/${req.unique_id}`)}
                  className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-sm font-black text-gray-500 border border-gray-200 overflow-hidden cursor-pointer flex-shrink-0"
                >
                  {req.avatar_url ? (
                    <img src={req.avatar_url} alt={req.full_name} className="w-full h-full object-cover" />
                  ) : (
                    req.full_name?.substring(0, 2).toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4
                    onClick={() => router.push(`/u/${req.unique_id}`)}
                    className="text-sm font-bold text-gray-900 hover:text-purple-600 cursor-pointer truncate"
                  >
                    {req.full_name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {req.designation && req.company
                      ? `${req.designation} at ${req.company}`
                      : req.branch || 'Student'}
                  </p>
                  <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1 font-medium">
                    <Clock size={11} />
                    Request sent {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>

                <button
                  onClick={() => handleWithdraw(req.id)}
                  disabled={actionId === req.id}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionId === req.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <ArrowLeft size={13} />
                  )}
                  Withdraw
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {incoming.length === 0 && outgoing.length === 0 && (
        <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-xl">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <UserPlus size={24} className="text-gray-300" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-2">No pending requests</h3>
          <p className="text-gray-500 text-sm">Connect with people in the Discover tab to grow your network</p>
        </div>
      )}
    </div>
  )
}
