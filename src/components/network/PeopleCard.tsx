'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, CheckCircle, Clock, XCircle, Loader2, UserPlus, UserCheck, GraduationCap, Briefcase, Users } from 'lucide-react'

interface PeopleCardPerson {
  id: string
  full_name: string
  unique_id: string
  role: string
  avatar_url?: string | null
  college_id?: string | null
  branch?: string | null
  company?: string | null
  designation?: string | null
  graduation_year?: number | null
  passout_year?: number | null
  rise_points?: number | null
  college?: { name: string; short_name: string } | null
  connectionStatus: string
  mutualConnections: number
  score?: number
}

interface PeopleCardProps {
  person: PeopleCardPerson
  onConnect?: (userId: string) => Promise<boolean>
  onRemove?: (connectionId: string) => Promise<void>
  connectionId?: string
  showActions?: boolean
}

export default function PeopleCard({ person, onConnect, onRemove, connectionId, showActions = true }: PeopleCardProps) {
  const router = useRouter()
  const [connecting, setConnecting] = useState(false)
  const [localStatus, setLocalStatus] = useState(person.connectionStatus)
  const [removing, setRemoving] = useState(false)

  const roleLabel = person.role === 'senior' ? 'Senior' : 'Student'

  const roleColor = person.role === 'senior'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : 'bg-blue-50 text-blue-700 border-blue-100'

  const handleConnect = async () => {
    if (!onConnect || connecting) return
    setConnecting(true)
    try {
      const ok = await onConnect(person.id)
      if (ok) {
        setLocalStatus('pending_sent')
      }
    } catch { } finally {
      setConnecting(false)
    }
  }

  const handleRemove = async () => {
    if (!onRemove || !connectionId || removing) return
    setRemoving(true)
    try {
      await onRemove(connectionId)
    } catch { } finally {
      setRemoving(false)
    }
  }

  const handleMessage = () => {
    router.push(`/dashboard/${person.role === 'senior' ? 'junior' : 'junior'}/messages?user=${person.id}`)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-purple-200 hover:shadow-md transition-all duration-200 flex flex-col h-full">
      <div className="flex items-start gap-4 mb-4">
        <div
          onClick={() => router.push(`/u/${person.unique_id}`)}
          className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-sm font-black text-gray-500 border border-gray-200 hover:border-purple-300 hover:text-purple-600 transition-all overflow-hidden cursor-pointer flex-shrink-0"
        >
          {person.avatar_url ? (
            <img src={person.avatar_url} alt={person.full_name} className="w-full h-full object-cover" />
          ) : (
            person.full_name?.substring(0, 2).toUpperCase() || '?'
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              onClick={() => router.push(`/u/${person.unique_id}`)}
              className="text-base font-bold text-gray-900 hover:text-purple-600 transition-colors cursor-pointer truncate"
            >
              {person.full_name}
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleColor} flex-shrink-0`}>
              {roleLabel}
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium">@{person.unique_id}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4 flex-1">
        {person.designation && person.company && (
          <div className="flex items-start gap-2.5">
            <Briefcase size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 leading-snug">
              <span className="font-semibold">{person.designation}</span>
              {person.company && <span className="text-gray-500"> at {person.company}</span>}
            </p>
          </div>
        )}

        {person.college && (
          <div className="flex items-start gap-2.5">
            <GraduationCap size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 leading-snug">
              <span className="font-semibold">{person.college.short_name || person.college.name}</span>
              {person.branch && <span className="text-gray-500"> • {person.branch}</span>}
            </p>
          </div>
        )}

        {person.mutualConnections > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Users size={12} />
            {person.mutualConnections} mutual connection{person.mutualConnections !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {showActions && (
        <div className="pt-4 border-t border-gray-100 mt-auto space-y-2">
          {localStatus === 'none' && (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {connecting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <UserPlus size={14} />
              )}
              Connect
            </button>
          )}

          {localStatus === 'pending_sent' && (
            <button
              disabled
              className="w-full bg-amber-50 text-amber-600 border border-amber-200 rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              <Clock size={14} />
              Pending
            </button>
          )}

          {localStatus === 'pending_received' && (
            <button
              disabled
              className="w-full bg-blue-50 text-blue-600 border border-blue-200 rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              <UserPlus size={14} />
              Respond in Requests
            </button>
          )}

          {localStatus === 'accepted' && (
            <div className="flex gap-2">
              <button
                onClick={handleMessage}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <MessageSquare size={14} />
                Message
              </button>
              {connectionId && onRemove && (
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  className="px-3 py-2 rounded-lg text-sm font-semibold border border-gray-200 bg-white text-gray-700 transition-colors flex items-center gap-1.5 group hover:border-red-200 hover:bg-red-50"
                >
                  {removing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <CheckCircle size={14} className="group-hover:hidden" />
                      <span className="group-hover:hidden">Connected</span>
                      <span className="hidden group-hover:inline text-red-500 font-bold">Remove</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
