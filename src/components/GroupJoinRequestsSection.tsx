'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Clock, Lock, UserRound, XCircle } from 'lucide-react'

interface GroupJoinRequest {
  id: string
  requested_at: string
  group: {
    name: string
    slug: string
  } | null
  users: {
    full_name: string
    avatar_url?: string
    role?: string
    unique_id?: string
    branch?: string
    year?: string | number
    colleges?: {
      name?: string
      short_name?: string
    } | Array<{
      name?: string
      short_name?: string
    }>
  } | null
}

interface GroupJoinRequestsSectionProps {
  onCountChange?: (count: number) => void
}

const getCollegeName = (user: GroupJoinRequest['users']) => {
  const college = Array.isArray(user?.colleges) ? user?.colleges[0] : user?.colleges
  return college?.short_name || college?.name || 'College not added'
}

export default function GroupJoinRequestsSection({ onCountChange }: GroupJoinRequestsSectionProps) {
  const [requests, setRequests] = useState<GroupJoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/groups/join-requests', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const nextRequests = data.requests || []
        setRequests(nextRequests)
        onCountChange?.(nextRequests.length)
      }
    } catch (error) {
      console.error('Failed to fetch group join requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const reviewRequest = async (request: GroupJoinRequest, action: 'accept' | 'reject') => {
    if (!request.group?.slug) return

    setProcessingId(request.id)
    try {
      const res = await fetch(`/api/groups/${request.group.slug}/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (res.ok) {
        setRequests((prev) => {
          const nextRequests = prev.filter((item) => item.id !== request.id)
          onCountChange?.(nextRequests.length)
          return nextRequests
        })
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to review request')
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <section className="bg-white dark:bg-[#283036] border border-gray-200 dark:border-[#38434F] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-[#38434F] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Lock size={16} />
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-900 dark:text-white m-0">Private Group Requests</h2>
            <p className="text-xs text-gray-500 dark:text-[#B0B7BE] m-0">Review who can enter your private groups.</p>
          </div>
        </div>
        {requests.length > 0 && (
          <span className="bg-amber-50 text-amber-700 rounded-full px-2 py-1 text-[10px] font-black">
            {requests.length} pending
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-gray-400 dark:text-[#B0B7BE]">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="p-8 text-center">
          <Clock size={26} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-500 dark:text-[#B0B7BE] m-0">No private group requests</p>
          <p className="text-xs text-gray-400 dark:text-[#B0B7BE] m-0 mt-1">New requests will show up here.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {requests.map((request) => {
            const user = request.users
            const disabled = processingId === request.id

            return (
              <div key={request.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 text-white flex items-center justify-center overflow-hidden shrink-0">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserRound size={18} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-gray-900 dark:text-white m-0 truncate">{user?.full_name || 'Unknown user'}</h3>
                      <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-600 dark:text-[#B0B7BE] rounded px-1.5 py-0.5">
                        {user?.role || 'student'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-[#B0B7BE] m-0 mt-1">
                      Wants to join <span className="font-bold text-gray-800">{request.group?.name || 'your group'}</span>
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-[#B0B7BE] m-0 mt-1">
                      {user?.unique_id || 'No ID'} • {getCollegeName(user)}{user?.branch ? ` • ${user.branch}` : ''}{user?.year ? ` • Year ${user.year}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => reviewRequest(request, 'reject')}
                    disabled={disabled}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-black hover:bg-red-100 disabled:opacity-60"
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewRequest(request, 'accept')}
                    disabled={disabled}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <CheckCircle size={14} />
                    Accept
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
