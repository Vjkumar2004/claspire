'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Clock, Loader2, UserPlus, UserCheck, GraduationCap, Briefcase, Users, X } from 'lucide-react'

interface PeopleCardPerson {
  id: string
  full_name: string
  unique_id: string
  role: string
  avatar_url?: string | null
  banner_url?: string | null
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
  isFollowing?: boolean
}

interface PeopleCardProps {
  person: PeopleCardPerson
  onConnect?: (userId: string) => Promise<boolean>
  onFollow?: (userId: string, follow: boolean) => Promise<void>
  onRemove?: (connectionId: string) => Promise<void>
  connectionId?: string
  showActions?: boolean
}

export default function PeopleCard({ person, onConnect, onFollow, onRemove, connectionId, showActions = true }: PeopleCardProps) {
  const router = useRouter()
  const [connecting, setConnecting] = useState(false)
  const [following, setFollowing] = useState(person.isFollowing || false)
  const [followLoading, setFollowLoading] = useState(false)
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
      if (ok) setLocalStatus('pending_sent')
    } catch { } finally {
      setConnecting(false)
    }
  }

  const handleFollow = async () => {
    if (!onFollow || followLoading) return
    setFollowLoading(true)
    try {
      await onFollow(person.id, !following)
      setFollowing(!following)
    } catch { } finally {
      setFollowLoading(false)
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
    router.push(`/dashboard/junior/messages?user=${person.id}`)
  }

  const headline = person.designation && person.company
    ? `${person.designation} at ${person.company}`
    : person.designation
    ? person.designation
    : person.role === 'senior'
    ? 'Senior'
    : 'Student'

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-200 group">
      {/* Banner */}
      <div className={`relative h-10 md:h-14 border-b border-gray-100 ${person.banner_url ? '' : 'bg-gradient-to-r from-gray-50 to-gray-100'}`}>
        {person.banner_url && (
          <img src={person.banner_url} alt="" className="w-full h-full object-cover" />
        )}
        <div
          onClick={() => router.push(`/u/${person.unique_id}`)}
          className="absolute -bottom-5 md:-bottom-7 left-3 md:left-4 w-10 h-10 md:w-14 md:h-14 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs md:text-base font-black text-gray-500 overflow-hidden shadow-sm cursor-pointer hover:border-purple-300 transition-all"
        >
          {person.avatar_url ? (
            <img src={person.avatar_url} alt={person.full_name} className="w-full h-full object-cover" />
          ) : (
            person.full_name?.substring(0, 2).toUpperCase() || '?'
          )}
        </div>
        {/* Same college indicator */}
        {person.college && (
          <div className="absolute top-1.5 md:top-2 right-2 md:right-3 flex items-center gap-1 text-[9px] md:text-[10px] font-semibold text-gray-400">
            <GraduationCap size={9} className="md:hidden" />
            <GraduationCap size={11} className="hidden md:block" />
            <span className="truncate max-w-[80px] md:max-w-none">{person.college.short_name || person.college.name}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pt-6 md:pt-9 px-3 md:px-4 pb-3 md:pb-4">
        <div className="flex items-start justify-between gap-1 md:gap-2 mb-1">
          <div className="min-w-0 flex-1">
            <h3
              onClick={() => router.push(`/u/${person.unique_id}`)}
              className="text-xs md:text-sm font-bold text-gray-900 hover:text-purple-600 cursor-pointer transition-colors truncate"
            >
              {person.full_name}
            </h3>
            <p className="text-[10px] md:text-xs text-gray-600 font-medium truncate mt-0.5 hidden sm:block">{headline}</p>
          </div>
          <span className={`text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full border ${roleColor} flex-shrink-0 mt-0.5`}>
            {roleLabel}
          </span>
        </div>

        {/* College + Branch */}
        {person.college && (
          <p className="text-[10px] md:text-[11px] text-gray-500 mt-1 md:mt-1.5 flex items-center gap-1">
            <GraduationCap size={10} className="md:hidden" />
            <GraduationCap size={12} className="hidden md:block" />
            <span className="truncate">{person.college.short_name || person.college.name}</span>
            {person.branch && <span className="text-gray-400 hidden sm:inline">• {person.branch}</span>}
          </p>
        )}

        {/* Mutual Connections */}
        {person.mutualConnections > 0 && (
          <div className="items-center gap-1 mt-2 text-xs font-medium text-gray-500 hidden sm:flex">
            <Users size={12} />
            <span>{person.mutualConnections} mutual connection{person.mutualConnections !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-100 flex items-center gap-1.5 md:gap-2">
            {localStatus === 'none' && (
              <>
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-1 md:py-1.5 text-[10px] md:text-xs font-semibold transition-colors flex items-center justify-center gap-0.5 md:gap-1 disabled:opacity-50"
                >
                  {connecting ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <UserPlus size={10} className="md:hidden" />
                  )}
                  {connecting ? '' : <UserPlus size={12} className="hidden md:block" />}
                  <span>Connect</span>
                </button>
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-semibold border transition-colors flex items-center gap-0.5 md:gap-1 ${
                    following
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {followLoading ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : following ? (
                    <UserCheck size={10} className="md:hidden" />
                  ) : (
                    <UserPlus size={10} className="md:hidden" />
                  )}
                  {followLoading ? '' : following ? <UserCheck size={12} className="hidden md:block" /> : <UserPlus size={12} className="hidden md:block" />}
                  {following ? 'Following' : 'Follow'}
                </button>
              </>
            )}

            {localStatus === 'pending_sent' && (
              <button
                disabled
                className="flex-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg py-1 md:py-1.5 text-[10px] md:text-xs font-semibold flex items-center justify-center gap-1 md:gap-1.5 cursor-not-allowed"
              >
                <Clock size={10} className="md:hidden" />
                <Clock size={12} className="hidden md:block" />
                Pending
              </button>
            )}

            {localStatus === 'pending_received' && (
              <button
                disabled
                className="flex-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg py-1 md:py-1.5 text-[10px] md:text-xs font-semibold flex items-center justify-center gap-1 md:gap-1.5 cursor-not-allowed"
              >
                <UserPlus size={10} className="md:hidden" />
                <UserPlus size={12} className="hidden md:block" />
                Respond
              </button>
            )}

            {localStatus === 'accepted' && (
              <div className="flex gap-1.5 md:gap-2 w-full">
                <button
                  onClick={handleMessage}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-1 md:py-1.5 text-[10px] md:text-xs font-semibold transition-colors flex items-center justify-center gap-0.5 md:gap-1.5"
                >
                  <MessageSquare size={10} className="md:hidden" />
                  <MessageSquare size={12} className="hidden md:block" />
                  Message
                </button>
                {connectionId && onRemove && (
                  <button
                    onClick={handleRemove}
                    disabled={removing}
                    className="px-1.5 md:px-2.5 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-semibold border border-gray-200 bg-white text-gray-600 transition-colors flex items-center gap-0.5 md:gap-1 group/remove hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                  >
                    {removing ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <X size={10} className="md:hidden" />
                    )}
                    {removing ? '' : <X size={12} className="hidden md:block" />}
                    <span className="hidden group-hover/remove:inline">Remove</span>
                    <span className="group-hover/remove:hidden">Connected</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
